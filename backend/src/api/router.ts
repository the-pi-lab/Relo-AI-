import type { Env } from "../db";
import {
  findOrCreateUserByEmail,
  getUserByEmail,
  createSession,
  getActiveSession,
  revokeSession,
  revokeAllSessions,
  saveEmailOtp,
  verifyAndConsumeEmailOtp,
  getAccountsForUser,
  getOwnedAccount,
  getAccountOwnership,
  upsertConnectedAccount,
  deleteConnectedAccount,
  getAutomationsForAccount,
  getAutomationById,
  saveReelAutomation,
  deleteReelAutomation,
  getCapturedLeads,
  getAllCapturedLeadsForExport,
  getAnalyticsSummary,
  getDailyActivity,
  getRecentActivity,
  countActiveAutomations,
  markFreeReelConsumed,
  replaceShortLinks,
  resetMonthlyCreditsIfDue,
  getAccountClickStats,
  getAccountStorageRows,
  activatePlanForUser,
  getUserBilling,
  setPlanExpiry,
  recordBillingPayment,
  expirePlanForUserIfDue,
  getShortLinksForAutomation,
  getProductsForAccount,
  countProductsForAccount,
  getProductById,
  insertProduct,
  updateProduct,
  deleteProduct,
  type ProductInput,
  getCampaignsForAccount,
  getCampaignById,
  insertCampaign,
  updateCampaign,
  deleteCampaign,
  fanOutCampaignTargets,
  getCampaignTargets,
  type CampaignInput,
  getFlowsForAccount,
  insertFlow,
  saveFlow,
  deleteFlow,
  countFlowsForAccount,
  getReferralSummary,
  findReferrerByCode,
  recordReferral,
  qualifyReferralsForUser,
  rewardQualifiedReferrals,
  isUserAdmin,
} from "../db/queries";
import { limitsFor, planSatisfies } from "../tiers";
import {
  getLinkPageForAccount,
  getLinkBlocks,
  replaceLinkBlocks,
  upsertLinkPage,
  getLinkPageBySlug,
} from "../db/linkPage";
import {
  getContentPlans,
  getContentPlanById,
  insertContentPlan,
  updateContentPlan,
  deleteContentPlan,
  getContentStats,
  isContentStatus,
} from "../db/contentPlans";

const SLUG_RE = /^[a-z0-9_-]{3,60}$/;
import { validateFlowGraph, createStarterGraph } from "../engine/flowGraph";

/** Public site origin, used for shareable referral links. */
const SITE_URL = "https://relo.ai";

/**
 * Origin of the Worker itself. Link-in-bio pages (/p/:id, /b/:slug) and short
 * links (/l/:id) are served here, NOT by the Next app — using PUBLIC_APP_URL
 * for them produces a URL that 404s.
 */
function publicBaseUrl(env: Env): string {
  return (env.PUBLIC_BASE_URL || env.PUBLIC_APP_URL || SITE_URL).replace(/\/$/, "");
}

function publicPageUrl(env: Env, page: { id: string; slug?: string }): string {
  return page.slug
    ? `${publicBaseUrl(env)}/b/${page.slug}`
    : `${publicBaseUrl(env)}/p/${page.id}`;
}
import {
  signJwt,
  verifyJwt,
  generateOtpCode,
  sendOtpEmail,
  type JwtPayload,
} from "../auth";
import { encryptSecret, decryptSecret, getMasterKey, getOtpPepper, timingSafeEqualAsync } from "../crypto";
import { metaGraphClient } from "../meta/client";
import { validateReplyVariations } from "../engine/spintax";
import { campaignWindowSeconds, normalizeCampaignCard } from "../engine/campaignWorker";
import { createAccountId, createAutomationId, createMediaId } from "../types/ids";
import type { ApiResponse, TemplateCardConfig } from "../types";
import { withCors, preflightResponse, isDisallowedCrossOrigin } from "../security/cors";
import { RATE_LIMITS, consumeRateLimit, clientIp, type RateLimitResult } from "../security/limits";
import { verifyCaptcha } from "../security/captcha";
import { resolveAdmin, recordAdminAudit, type AdminActor } from "../security/admin";
import { assertTenantPolicies } from "../db/tenancy";
import {
  parseBody,
  otpSendSchema,
  otpVerifySchema,
  metaCallbackSchema,
  referralClaimSchema,
  automationSaveSchema,
  productSaveSchema,
  campaignSaveSchema,
  flowSaveSchema,
  contentPlanSaveSchema,
  contentPlanPublishSchema,
  linkPageSaveSchema,
  manualUpiSchema,
  agencyContactSchema,
  adminPaymentSchema,
} from "../security/schemas";
import { cleanText, safeHttpUrl, isSafeId, clampInt } from "../security/validate";

/**
 * Response envelopes.
 *
 * CORS is *not* applied here: `handleApiRequest` decorates every response with
 * the allowlisted origin at the boundary (see `security/cors.ts`), so a handler
 * cannot accidentally widen the policy by returning a bare envelope.
 */
export function jsonSuccess<T>(data: T, status = 200): Response {
  const body: ApiResponse<T> = { success: true, data };
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export function jsonError(
  code: string,
  message: string,
  status = 400,
  details?: unknown
): Response {
  const body: ApiResponse<never> = {
    success: false,
    error: { code, message, details },
  };
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Authenticates user from Bearer JWT token in Authorization header.
 *
 * Signature validity is not enough: the token's `jti` must still have a live
 * row in `sessions`. That is the only way logout, "sign out everywhere" and an
 * owner-initiated revocation actually take effect before the 7-day expiry.
 */
export async function authenticateUser(
  request: Request,
  env: Env
): Promise<JwtPayload | null> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.slice(7).trim();
  const payload = await verifyJwt(token, env.JWT_SECRET);
  if (!payload) return null;

  try {
    const session = await getActiveSession(env.DB, payload.jti);
    if (!session || session.userId !== payload.sub) return null;
  } catch (error) {
    // A database deployed ahead of migration 007 has no sessions table. Fail
    // closed rather than accepting a token that cannot be revoked.
    console.error("[Auth] Session lookup failed:", error);
    return null;
  }
  return payload;
}

/**
 * Escapes fields for standard RFC 4180 CSV generation AND neutralizes
 * spreadsheet formula injection (=, +, -, @, tab, CR) from attacker-controlled
 * cells (commenter usernames/emails) before the CSV reaches Excel/Sheets.
 */
function escapeCsv(field: unknown): string {
  let str = field === null || field === undefined ? "" : String(field);
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Applies one rate-limit budget. Returns an error response when the caller is
 * over budget, or the limiter result so the caller can echo headers.
 */
async function enforceRateLimit(
  env: Env,
  key: string,
  options: { max: number; windowSeconds: number }
): Promise<{ limited: false; result: RateLimitResult } | { limited: true; response: Response }> {
  const result = await consumeRateLimit(env.DB, key, options);
  if (result.allowed) return { limited: false, result };

  const retry = result.retryAfterSeconds;
  const response = jsonError(
    "RATE_LIMITED",
    `Too many requests. Please try again in ${retry} second${retry === 1 ? "" : "s"}.`,
    429,
    { retryAfterSeconds: retry }
  );
  response.headers.set("Retry-After", String(retry));
  response.headers.set("X-RateLimit-Limit", String(result.limit));
  response.headers.set("X-RateLimit-Remaining", "0");
  return { limited: true, response };
}

/**
 * Resolves the acting admin for an `/api/admin/*` request, or a rejection.
 *
 * This runs on the path prefix, before any admin handler, so a new admin route
 * cannot ship without the check. The UI hiding the button is not a control.
 */
async function requireAdmin(
  request: Request,
  env: Env,
  user: JwtPayload
): Promise<{ actor: AdminActor } | { actor: null; response: Response }> {
  const actor = await resolveAdmin(request, env, user, (userId) => isUserAdmin(env.DB, userId));
  if (!actor) {
    return {
      actor: null,
      response: jsonError("FORBIDDEN", "Admin access is required for this endpoint.", 403),
    };
  }
  return { actor };
}

const EMAIL_PATTERN = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/;

/**
 * Resolves an accountId from the request and asserts the authenticated user
 * owns it. Returns either the owned account or a ready-to-return error.
 */
async function requireOwnedAccount(
  db: Env["DB"],
  accountId: string,
  user: JwtPayload
): Promise<{ account: NonNullable<Awaited<ReturnType<typeof getOwnedAccount>>> } | { account: null; error: Response }> {
  if (!isSafeId(accountId)) {
    return {
      account: null,
      error: jsonError("INVALID_ACCOUNT_ID", "That account identifier is not valid.", 400),
    };
  }
  const account = await getOwnedAccount(db, createAccountId(accountId), user.sub);
  if (!account) {
    return {
      account: null,
      error: jsonError(
        "ACCOUNT_NOT_FOUND",
        "Instagram account not found, inactive, or not owned by you.",
        404
      ),
    };
  }
  return { account };
}

/**
 * Lemon Squeezy signs the raw body with HMAC-SHA256 and sends the hex digest in
 * `X-Signature`. The digest is compared in constant time; a malformed header is
 * simply invalid, never a reason to process the payload.
 */
async function verifyLemonSignature(
  rawBody: string,
  header: string | null,
  secret: string
): Promise<boolean> {
  const provided = (header || "").trim().replace(/^sha256=/i, "").toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(provided)) return false;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(rawBody));
  const expected = Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return timingSafeEqualAsync(provided, expected);
}

interface LemonWebhookPayload {
  meta?: {
    event_name?: string;
    custom_data?: Record<string, unknown> | null;
  };
  data?: {
    id?: string | number;
    type?: string;
    attributes?: Record<string, any>;
  };
}

function parseEpochSeconds(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    // Accept either seconds or milliseconds; LS uses ISO strings today, but
    // guarding here keeps a future payload shape from becoming year 57000.
    return Math.floor(value > 10_000_000_000 ? value / 1000 : value);
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Date.parse(value);
    if (!Number.isNaN(parsed)) return Math.floor(parsed / 1000);
  }
  return null;
}

/** Lemon reports money in the currency's minor unit (paise/cents). */
function lemonAmountInr(attributes: Record<string, any>): number {
  const total = Number(attributes?.total ?? 0);
  if (!Number.isFinite(total) || total <= 0) return 0;
  return Math.max(0, Math.round(total / 100));
}

/**
 * Maps a purchased variant to a tier. Explicit custom data wins (it is set by
 * our own checkout link), then the two configured variant ids.
 */
function resolveLemonPlan(
  env: Env,
  variantId: unknown,
  customData: Record<string, unknown> | null | undefined
): "pro" | "studio" | null {
  const claimed = String(customData?.plan || "").toLowerCase();
  if (claimed === "pro" || claimed === "studio") return claimed;

  const id = String(variantId ?? "").trim();
  if (!id) return null;
  if (id === String(env.LEMON_SQUEEZY_PRO_VARIANT_ID || "").trim()) return "pro";
  if (id === String(env.LEMON_SQUEEZY_STUDIO_VARIANT_ID || "").trim()) return "studio";
  return null;
}

/**
 * Finds the buyer. A custom `user_id` is trusted only after it resolves to a
 * real row; otherwise the email on the order is the identity. Creating the
 * user is deferred to the caller so a cancellation for an unknown email cannot
 * conjure an account.
 */
async function resolveLemonIdentity(
  env: Env,
  payload: LemonWebhookPayload
): Promise<{ userId: string | null; email: string } | null> {
  const custom = payload.meta?.custom_data || {};
  const claimedId =
    typeof custom.user_id === "string"
      ? custom.user_id
      : typeof custom.userId === "string"
        ? custom.userId
        : "";
  if (claimedId) {
    const row = (await env.DB
      .prepare(`SELECT id, email FROM users WHERE id = ? LIMIT 1`)
      .bind(claimedId)
      .first()) as any;
    if (row) return { userId: row.id, email: row.email };
  }

  const email = String(payload.data?.attributes?.user_email || "")
    .trim()
    .toLowerCase();
  if (!EMAIL_PATTERN.test(email)) return null;

  const existing = await getUserByEmail(env.DB, email);
  return { userId: existing?.id ?? null, email };
}

/**
 * Main REST API Router for /api/* requests.
 *
 * The route table lives in `routeRequest`; this wrapper owns the two concerns
 * that must apply to *every* response: the allowlisted CORS policy and the
 * tenant-policy self-check.
 */
export async function handleApiRequest(
  request: Request,
  env: Env
): Promise<Response> {
  assertTenantPolicies();

  if (request.method === "OPTIONS") {
    return preflightResponse(request, env);
  }

  const response = await routeRequest(request, env);
  return withCors(response, request, env);
}

async function routeRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  // A browser request from an origin we did not approve is refused outright,
  // rather than served and left to the browser to discard.
  if (isDisallowedCrossOrigin(request, env)) {
    return jsonError("ORIGIN_NOT_ALLOWED", "This origin is not allowed to call the API.", 403);
  }

  // =========================================================================
  // 1. AUTHENTICATION ENDPOINTS (Public, rate-limited)
  // =========================================================================

  // POST /api/auth/otp/send
  if (path === "/api/auth/otp/send" && method === "POST") {
    const ipLimit = await enforceRateLimit(
      env,
      `otp-send:ip:${clientIp(request)}`,
      RATE_LIMITS.otpSend
    );
    if (ipLimit.limited) return ipLimit.response;

    const parsed = await parseBody(request, otpSendSchema);
    if (!parsed.ok) return jsonError(parsed.code, parsed.message, parsed.status);

    const email = parsed.data.email;
    if (!email || !EMAIL_PATTERN.test(email)) {
      return jsonError("INVALID_EMAIL", "A valid email address is required.", 400);
    }

    const emailLimit = await enforceRateLimit(
      env,
      `otp-send:email:${email}`,
      RATE_LIMITS.otpSendPerEmail
    );
    if (emailLimit.limited) return emailLimit.response;

    const captcha = await verifyCaptcha(
      request,
      env,
      parsed.data.captchaToken || parsed.data["cf-turnstile-response"]
    );
    if (!captcha.ok) {
      return jsonError(captcha.code || "CAPTCHA_FAILED", captcha.message || "Verification failed.", 403);
    }

    const code = generateOtpCode();

    // A missing pepper means we cannot hash the code. Fail before writing a row
    // or sending an email, so the caller never sees a code that cannot verify.
    let otpPepper: string;
    try {
      otpPepper = getOtpPepper(env);
    } catch (error) {
      console.error("[Auth] OTP pepper is not configured:", error);
      return jsonError(
        "SERVER_MISCONFIGURED",
        "Sign-in is temporarily unavailable. Please try again later.",
        503
      );
    }

    // Without an email provider (and outside an explicit dev opt-in) there is no
    // way to deliver the code. Report that honestly instead of pretending the
    // mail went out and throttling the retry for 60 seconds.
    const devMode = env.DEBUG_OTPS === "1" && env.ENVIRONMENT !== "production";
    if (!env.RESEND_API_KEY && !devMode) {
      return jsonError(
        "EMAIL_NOT_CONFIGURED",
        "Sign-in email is not configured on this deployment. Please contact support.",
        503
      );
    }

    const saveResult = await saveEmailOtp(env.DB, email, code, 600, otpPepper);
    if (!saveResult.ok) {
      return jsonError(
        "OTP_RESEND_THROTTLED",
        `A code was recently sent. Please wait ${saveResult.retryAfterSeconds}s before requesting another.`,
        429,
        { retryAfterSeconds: saveResult.retryAfterSeconds }
      );
    }

    const sendResult = await sendOtpEmail(email, code, env.RESEND_API_KEY, devMode, env.RESEND_FROM_EMAIL);
    if (!sendResult.success) {
      console.error(`[Auth] OTP email delivery failed for ${email}: ${sendResult.error}`);
      if (sendResult.error === "EMAIL_NOT_CONFIGURED") {
        return jsonError(
          "EMAIL_NOT_CONFIGURED",
          "Sign-in email is not configured on this deployment. Please contact support.",
          503
        );
      }
      return jsonError(
        "EMAIL_DELIVERY_FAILED",
        "We could not send the verification email right now. Please try again shortly.",
        502
      );
    }

    // Dev-only OTP echo: requires an explicit opt-in flag, never on by default.
    const debugCode = devMode && !env.RESEND_API_KEY ? code : undefined;

    return jsonSuccess({
      message: "Verification code sent to your email.",
      debugCode,
    });
  }

  // POST /api/auth/otp/verify
  if (path === "/api/auth/otp/verify" && method === "POST") {
    const ipLimit = await enforceRateLimit(
      env,
      `otp-verify:ip:${clientIp(request)}`,
      RATE_LIMITS.otpVerify
    );
    if (ipLimit.limited) return ipLimit.response;

    const parsed = await parseBody(request, otpVerifySchema);
    if (!parsed.ok) return jsonError(parsed.code, parsed.message, parsed.status);

    const email = parsed.data.email;
    const code = parsed.data.code;

    if (!email || !code) {
      return jsonError("MISSING_FIELDS", "Email and 6-digit code are required.", 400);
    }

    const emailLimit = await enforceRateLimit(
      env,
      `otp-verify:email:${email}`,
      RATE_LIMITS.otpVerifyPerEmail
    );
    if (emailLimit.limited) return emailLimit.response;

    const captcha = await verifyCaptcha(
      request,
      env,
      parsed.data.captchaToken || parsed.data["cf-turnstile-response"]
    );
    if (!captcha.ok) {
      return jsonError(captcha.code || "CAPTCHA_FAILED", captcha.message || "Verification failed.", 403);
    }

    let otpPepper: string;
    try {
      otpPepper = getOtpPepper(env);
    } catch (error) {
      console.error("[Auth] OTP pepper is not configured:", error);
      return jsonError(
        "SERVER_MISCONFIGURED",
        "Sign-in is temporarily unavailable. Please try again later.",
        503
      );
    }

    const isValid = await verifyAndConsumeEmailOtp(env.DB, email, code, otpPepper);
    if (!isValid) {
      return jsonError("INVALID_OTP", "Invalid or expired verification code.", 401);
    }

    // Find or create user
    const user = await findOrCreateUserByEmail(env.DB, email);

    // Issue signed 7-day JWT session. A deployment with no JWT_SECRET fails
    // closed here rather than issuing a token signed with a placeholder.
    const ttlSeconds = 7 * 24 * 60 * 60;
    const jti = crypto.randomUUID();
    const expiresAt = Math.floor(Date.now() / 1000) + ttlSeconds;
    let token: string;
    try {
      token = await signJwt(
        { sub: user.id as any, email: user.email, jti },
        env.JWT_SECRET,
        ttlSeconds
      );
      await createSession(env.DB, jti, user.id, expiresAt);
    } catch (error) {
      console.error("[Auth] Cannot mint a session token:", error);
      return jsonError(
        "SERVER_MISCONFIGURED",
        "Sign-in is temporarily unavailable. Please try again later.",
        503
      );
    }

    return jsonSuccess({
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
      },
      token,
      expiresAt,
    });
  }

  // =========================================================================
  // 2. AGENCY CONTACT (public: rate-limited + CAPTCHA)
  //
  // Lives above the auth guard on purpose. It is a *sales* form — the people
  // who use it manage more than three accounts and are usually not customers
  // yet, so requiring a session turned it into a dead end. It is identified
  // and throttled by IP, and reuses the caller's email when one is signed in.
  // =========================================================================
  if (path === "/api/agency/contact" && method === "POST") {
    const contactLimit = await enforceRateLimit(
      env,
      `agency:${clientIp(request)}`,
      RATE_LIMITS.contact
    );
    if (contactLimit.limited) return contactLimit.response;

    const parsed = await parseBody(request, agencyContactSchema);
    if (!parsed.ok) return jsonError(parsed.code, parsed.message, parsed.status);
    const body = parsed.data;

    const captcha = await verifyCaptcha(
      request,
      env,
      body.captchaToken || body["cf-turnstile-response"]
    );
    if (!captcha.ok) {
      return jsonError(captcha.code || "CAPTCHA_FAILED", captcha.message || "Verification failed.", 403);
    }

    // Optional identity: a signed-in visitor does not have to retype their
    // email, but no session is required to submit the form.
    const optionalUser = await authenticateUser(request, env).catch(() => null);
    const email = (body.email || optionalUser?.email || "").trim().toLowerCase();
    if (!EMAIL_PATTERN.test(email)) {
      return jsonError("INVALID_EMAIL", "Enter a valid email so we can reply.", 400);
    }
    const accountCount = clampInt(body.accountCount, 1, 10_000, 3);
    const notes = cleanText(body.notes, 1000, true);
    const planInterest = body.plan === "studio" ? "studio" : "custom";

    await env.DB
      .prepare(
        `INSERT INTO agency_enquiries (id, email, account_count, plan_interest, notes, status)
         VALUES (?, ?, ?, ?, ?, 'new')`
      )
      .bind(crypto.randomUUID(), email, accountCount, planInterest, notes || null)
      .run();

    return jsonSuccess({
      message: `Thanks — we'll reply to ${email} within one business day.`,
    });
  }

  // =========================================================================
  // 2b. LEMON SQUEEZY WEBHOOK (public, signature-verified)
  //
  // Lemon retries non-2xx aggressively, so the contract is:
  //   - bad signature / missing config → non-2xx (a real failure)
  //   - unknown event, unmapped variant, unknown cancellation → 200 + ignored
  //   - duplicate order → 200, but never a second month
  // Activation and revocation both happen here; the client never grants a plan.
  // =========================================================================
  if (path === "/api/billing/lemonsqueezy" && method === "POST") {
    const secret = env.LEMON_SQUEEZY_WEBHOOK_SECRET || "";
    if (!secret) {
      console.error("[Billing] LEMON_SQUEEZY_WEBHOOK_SECRET is not configured.");
      return jsonError(
        "WEBHOOK_NOT_CONFIGURED",
        "Billing webhooks are not configured on this deployment.",
        503
      );
    }

    const rawBody = await request.text();
    if (rawBody.length > 1_000_000) {
      return jsonError("PAYLOAD_TOO_LARGE", "Webhook payload is too large.", 413);
    }

    const validSignature = await verifyLemonSignature(
      rawBody,
      request.headers.get("x-signature"),
      secret
    );
    if (!validSignature) {
      console.warn("[Billing] Rejected a Lemon Squeezy webhook with an invalid signature.");
      return jsonError("INVALID_SIGNATURE", "Webhook signature verification failed.", 401);
    }

    let payload: LemonWebhookPayload;
    try {
      payload = JSON.parse(rawBody) as LemonWebhookPayload;
    } catch {
      return jsonError("INVALID_PAYLOAD", "Webhook body is not valid JSON.", 400);
    }

    const eventName = String(payload.meta?.event_name || "");
    const attributes = payload.data?.attributes || {};
    const dataId = String(payload.data?.id ?? "").trim();
    const now = Math.floor(Date.now() / 1000);

    const ACTIVATION = new Set(["order_created", "subscription_created"]);
    const RENEWAL = new Set([
      "subscription_resumed",
      "subscription_updated",
      "subscription_payment_success",
    ]);
    const END = new Set([
      "subscription_cancelled",
      "subscription_expired",
      "subscription_paused",
      "order_refunded",
    ]);

    if (!ACTIVATION.has(eventName) && !RENEWAL.has(eventName) && !END.has(eventName)) {
      return jsonSuccess({ received: true, ignored: true, event: eventName });
    }

    try {
      const identity = await resolveLemonIdentity(env, payload);
      if (!identity) {
        return jsonSuccess({ received: true, ignored: true, reason: "no_identity" });
      }

      const variantId =
        attributes.variant_id ?? attributes.first_order_item?.variant_id ?? null;
      const plan = resolveLemonPlan(env, variantId, payload.meta?.custom_data);
      if (!plan) {
        // Configuration, not a transient failure: retrying cannot fix it.
        console.warn(
          `[Billing] Lemon event ${eventName} has an unmapped variant (${variantId ?? "none"}).`
        );
        return jsonSuccess({ received: true, ignored: true, reason: "unmapped_variant" });
      }

      let userId = identity.userId;
      if (!userId) {
        if (END.has(eventName)) {
          return jsonSuccess({ received: true, ignored: true, reason: "unknown_user" });
        }
        // A paid buyer must be able to sign in with the email they paid with.
        const created = await findOrCreateUserByEmail(env.DB, identity.email);
        userId = created.id;
      }

      if (eventName === "order_created") {
        const status = String(attributes.status || "").toLowerCase();
        if (status && status !== "paid") {
          return jsonSuccess({ received: true, ignored: true, reason: "order_not_paid" });
        }
      }

      if (ACTIVATION.has(eventName)) {
        if (!dataId) {
          return jsonSuccess({ received: true, ignored: true, reason: "missing_order_id" });
        }
        const accounts = await getAccountsForUser(env.DB, userId);
        // The UNIQUE (provider, external_ref) index is what makes a retried
        // webhook a no-op instead of a second free month.
        const recorded = await recordBillingPayment(env.DB, {
          userId,
          accountId: accounts[0]?.id ?? null,
          provider: "lemon_squeezy",
          externalRef: dataId,
          plan,
          amountInr: lemonAmountInr(attributes),
        });

        const renewsAt = parseEpochSeconds(attributes.renews_at);
        const expiresAt = renewsAt && renewsAt > now ? renewsAt : now + 30 * 86400;
        const current = await getUserBilling(env.DB, userId);

        if (recorded.inserted) {
          await activatePlanForUser(env.DB, userId, plan, expiresAt);
          // Referrals only earn a reward when the referred user actually pays.
          const qualified = await qualifyReferralsForUser(env.DB, userId);
          if (qualified > 0) await rewardQualifiedReferrals(env.DB, userId);
        } else if (!current || current.plan !== plan || current.planExpiresAt <= now) {
          // Re-delivery after a lapse, or an upgrade: grant the plan again.
          await activatePlanForUser(env.DB, userId, plan, expiresAt);
        }

        return jsonSuccess({
          received: true,
          activated: true,
          plan,
          duplicate: !recorded.inserted,
        });
      }

      if (END.has(eventName)) {
        const endsAt = parseEpochSeconds(attributes.ends_at);
        if (eventName === "order_refunded" || eventName === "subscription_expired") {
          await setPlanExpiry(env.DB, userId, now);
          await expirePlanForUserIfDue(env.DB, userId);
          return jsonSuccess({ received: true, planEnded: true });
        }

        // Cancelled/paused: the creator keeps what they already paid for until
        // the period actually ends. No immediate downgrade.
        const expiry = endsAt && endsAt > now ? endsAt : now;
        await setPlanExpiry(env.DB, userId, expiry);
        if (expiry <= now) await expirePlanForUserIfDue(env.DB, userId);
        return jsonSuccess({ received: true, planEndsAt: expiry });
      }

      // RENEWAL events. A subscription update can also mean "cancelled",
      // "past_due" or "paused"; those must not extend access.
      const status = String(attributes.status || "").toLowerCase();
      if (["cancelled", "expired", "paused", "past_due", "unpaid"].includes(status)) {
        const endsAt = parseEpochSeconds(attributes.ends_at);
        const expiry = endsAt && endsAt > now ? endsAt : now;
        await setPlanExpiry(env.DB, userId, expiry);
        if (expiry <= now) await expirePlanForUserIfDue(env.DB, userId);
        return jsonSuccess({ received: true, planEndsAt: expiry });
      }

      const renewsAt = parseEpochSeconds(attributes.renews_at);
      const expiresAt = renewsAt && renewsAt > now ? renewsAt : now + 30 * 86400;
      const current = await getUserBilling(env.DB, userId);
      if (!current || current.plan !== plan || current.planExpiresAt <= now) {
        // First activation, an upgrade, or a plan that lapsed between events.
        await activatePlanForUser(env.DB, userId, plan, expiresAt);
      } else {
        // A routine renewal/metadata change extends the period without
        // refilling the credit balance a second time in the same month.
        await setPlanExpiry(env.DB, userId, expiresAt);
      }
      return jsonSuccess({ received: true, plan, planExpiresAt: expiresAt });
    } catch (error) {
      // A real processing failure must be retried by Lemon.
      console.error("[Billing] Lemon Squeezy webhook failed:", error);
      return jsonError("WEBHOOK_FAILED", "Could not process the billing event.", 500);
    }
  }

  // =========================================================================
  // AUTHENTICATION GUARD FOR PROTECTED ENDPOINTS
  // =========================================================================
  const user = await authenticateUser(request, env);
  if (!user) {
    return jsonError("UNAUTHORIZED", "Missing or invalid authorization token.", 401);
  }

  // -------------------------------------------------------------------------
  // SESSION LIFECYCLE
  // A signed token is revocable only while these routes can reach its row.
  // -------------------------------------------------------------------------
  if (path === "/api/auth/logout" && method === "POST") {
    await revokeSession(env.DB, user.jti, user.sub);
    return jsonSuccess({ loggedOut: true });
  }

  if (path === "/api/auth/logout-all" && method === "POST") {
    const revoked = await revokeAllSessions(env.DB, user.sub);
    return jsonSuccess({ loggedOut: true, sessionsRevoked: revoked });
  }

  // -------------------------------------------------------------------------
  // ADMIN AUTHORIZATION — enforced on the path prefix, before any handler, so
  // a new admin route can never ship without a server-side role check.
  // -------------------------------------------------------------------------
  let adminActor: AdminActor | null = null;
  if (path.startsWith("/api/admin/")) {
    const adminLimit = await enforceRateLimit(env, `admin:${user.sub}`, RATE_LIMITS.admin);
    if (adminLimit.limited) return adminLimit.response;

    const admin = await requireAdmin(request, env, user);
    if (!admin.actor) return admin.response;
    adminActor = admin.actor;
  } else if (method !== "GET") {
    // One shared mutation budget for the rest of the authenticated surface.
    const writeLimit = await enforceRateLimit(env, `write:${user.sub}`, RATE_LIMITS.write);
    if (writeLimit.limited) return writeLimit.response;
  }

  // =========================================================================
  // 2. CONNECTED ACCOUNTS & OAUTH
  // =========================================================================

  // GET /api/accounts
  if (path === "/api/accounts" && method === "GET") {
    const accounts = await getAccountsForUser(env.DB, user.sub);
    // Monthly AI credit cycle resets lazily on read
    const withTier = await Promise.all(
      accounts.map(async (acc) => {
        const owned = await getOwnedAccount(env.DB, acc.id, user.sub);
        if (!owned) return acc;
        const refreshed = await resetMonthlyCreditsIfDue(env.DB, owned);
        return {
          ...acc,
          plan: refreshed.plan,
          aiCreditsRemaining: refreshed.aiCreditsRemaining,
          aiCreditsResetAt: refreshed.aiCreditsResetAt,
          freeReelConsumed: refreshed.freeReelConsumed,
        };
      })
    );
    return jsonSuccess({ accounts: withTier });
  }

  // DELETE /api/accounts/:id
  if (path.startsWith("/api/accounts/") && method === "DELETE") {
    const accountId = path.replace("/api/accounts/", "").trim();
    if (!accountId) {
      return jsonError("INVALID_ACCOUNT_ID", "Account ID is required", 400);
    }

    const deleted = await deleteConnectedAccount(env.DB, accountId, user.sub);
    if (!deleted) {
      return jsonError("NOT_FOUND", "Account not found or already deleted.", 404);
    }
    return jsonSuccess({ deleted: true });
  }

  // POST /api/auth/meta/callback (OAuth Code Exchange, server-side)
  if (path === "/api/auth/meta/callback" && method === "POST") {
    const parsed = await parseBody(request, metaCallbackSchema);
    if (!parsed.ok) return jsonError(parsed.code, parsed.message, parsed.status);

    const code = parsed.data.code || undefined;
    const clientAccessToken = parsed.data.accessToken || undefined;

    if (!code && !clientAccessToken) {
      return jsonError("MISSING_TOKEN", "Meta OAuth code or access token is required.", 400);
    }

    if (!env.META_APP_ID || !env.META_APP_SECRET) {
      return jsonError(
        "OAUTH_NOT_CONFIGURED",
        "Meta OAuth app credentials are not configured on the server.",
        503
      );
    }

    try {
      // 1. Resolve a short-lived user token: either exchanged from the OAuth
      //    code or supplied directly by the client-side login flow.
      let shortLivedToken: string;
      if (code) {
        const exchanged = await metaGraphClient.exchangeCodeForToken(
          env.META_APP_ID,
          env.META_APP_SECRET,
          code,
          parsed.data.redirectUri
        );
        shortLivedToken = exchanged.access_token;
      } else {
        shortLivedToken = clientAccessToken as string;
      }

      // 2. Upgrade to a long-lived token (~60 days) so connected accounts
      //    actually survive past the first hour.
      const longLived = await metaGraphClient.exchangeForLongLivedToken(
        env.META_APP_ID,
        env.META_APP_SECRET,
        shortLivedToken
      );
      const longLivedToken = longLived.access_token;
      const tokenExpiresAt =
        Math.floor(Date.now() / 1000) + (longLived.expires_in || 60 * 24 * 60 * 60);

      // 3. Fetch connected Instagram business pages
      const accounts = await metaGraphClient.getConnectedAccounts(longLivedToken);

      if (accounts.length === 0) {
        return jsonError(
          "NO_INSTAGRAM_ACCOUNT",
          "No Instagram Professional/Creator account was found linked to your Facebook Page. Please link your Instagram account in Page Settings.",
          400
        );
      }

      // 4. Tier account cap (plan.md §3): Free/Pro = 1 IG account, Studio = 3.
      //    Re-connecting an account you already own is always allowed; only a
      //    genuinely NEW binding can hit the cap.
      const existingAccounts = await getAccountsForUser(env.DB, user.sub);
      const existingIgIds = new Set<string>(existingAccounts.map((a) => String(a.instagramUserId)));
      const newBindings = accounts.filter(
        (a) => !existingIgIds.has(a.instagramAccountId)
      );
      if (newBindings.length > 0) {
        const currentPlan = existingAccounts[0]?.plan ?? "free";
        const maxAccounts = limitsFor(currentPlan).maxAccounts;
        if (existingAccounts.length + newBindings.length > maxAccounts) {
          return jsonError(
            "ACCOUNT_LIMIT_REACHED",
            maxAccounts === 1
              ? `The ${currentPlan === "free" ? "Free" : "Pro"} tier connects 1 Instagram account. Upgrade to Studio to run 3.`
              : `Your plan connects up to ${maxAccounts} Instagram accounts. Need more? Talk to us about agency pricing.`,
            403,
            { upgrade: true, maxAccounts, currentCount: existingAccounts.length }
          );
        }
      }

      const masterKey = getMasterKey(env);
      // The long-lived USER token is kept alongside the page token: it is the
      // only credential Meta will re-exchange, so without it the account can
      // never be renewed and silently dies after ~60 days.
      const encryptedUserToken = await encryptSecret(longLivedToken, masterKey);
      const connectedResults: Array<{
        id: string;
        instagramUserId: string;
        username: string;
        profilePictureUrl: string | undefined;
      }> = [];

      for (const acc of accounts) {
        // 5. Ownership guard: never let a later connect steal another user's
        //    Instagram binding.
        const ownership = await getAccountOwnership(env.DB, acc.instagramAccountId);
        if (ownership && ownership.userId !== user.sub) {
          return jsonError(
            "ACCOUNT_ALREADY_BOUND",
            `@${acc.instagramUsername} is already linked to another RELO account.`,
            409
          );
        }

        // 6. Encrypt the page access token
        const encryptedToken = await encryptSecret(acc.pageAccessToken, masterKey);
        const accountId = createAccountId(crypto.randomUUID());

        await upsertConnectedAccount(env.DB, {
          id: ownership ? ownership.accountId : accountId,
          userId: user.sub,
          instagramUserId: acc.instagramAccountId,
          username: acc.instagramUsername,
          profilePictureUrl: acc.profilePictureUrl,
          accessTokenEncrypted: encryptedToken,
          tokenExpiresAt,
          userTokenEncrypted: encryptedUserToken,
          userTokenExpiresAt: tokenExpiresAt,
        });

        connectedResults.push({
          id: ownership ? ownership.accountId : accountId,
          instagramUserId: acc.instagramAccountId,
          username: acc.instagramUsername,
          profilePictureUrl: acc.profilePictureUrl,
        });
      }

      return jsonSuccess({ connectedAccounts: connectedResults });
    } catch (err: any) {
      console.error("[OAuth] Meta token exchange failed:", err?.message);
      return jsonError(
        "OAUTH_FAILED",
        "Failed to link your Instagram account. Please re-run the connection flow.",
        502
      );
    }
  }

  // =========================================================================
  // 3. REELS STUDIO
  // =========================================================================

  // GET /api/reels?accountId=...
  if (path === "/api/reels" && method === "GET") {
    const accountId = url.searchParams.get("accountId");
    if (!accountId) {
      return jsonError("MISSING_ACCOUNT_ID", "Query parameter 'accountId' is required.", 400);
    }

    const owned = await requireOwnedAccount(env.DB, accountId, user);
    if (!owned.account) return owned.error;
    const account = owned.account;

    // Outbound Meta Graph call: budgeted separately from cheap reads.
    const graphLimit = await enforceRateLimit(
      env,
      `graph:reels:${user.sub}`,
      RATE_LIMITS.expensive
    );
    if (graphLimit.limited) return graphLimit.response;

    const masterKey = getMasterKey(env);
    const decryptedToken = await decryptSecret(account.accessTokenEncrypted, masterKey);

    try {
      // Fetch recent 25 media items from Meta Graph API
      const mediaItems = await metaGraphClient.getRecentReels(
        decryptedToken,
        account.instagramUserId,
        25
      );

      // Fetch active automations to overlay status
      const automations = await getAutomationsForAccount(env.DB, account.id);
      const activeMediaIds = new Set(
        automations.filter((a) => a.isActive).map((a) => a.instagramMediaId)
      );

      const reels = mediaItems.map((media) => ({
        id: media.id,
        permalink: media.permalink,
        mediaType: media.media_type,
        mediaUrl: media.media_url,
        thumbnailUrl: media.thumbnail_url || media.media_url,
        caption: media.caption,
        timestamp: media.timestamp,
        hasActiveAutomation: activeMediaIds.has(createMediaId(media.id)),
      }));

      return jsonSuccess({ reels });
    } catch (err: any) {
      return jsonError("GRAPH_API_ERROR", "Failed to fetch reels from Instagram.", 502);
    }
  }

  // =========================================================================
  // 4. AUTOMATIONS STUDIO (CRUD & Anti-Spam Validation)
  // =========================================================================

  // GET /api/automations?accountId=...
  if (path === "/api/automations" && method === "GET") {
    const accountId = url.searchParams.get("accountId");
    if (!accountId) {
      return jsonError("MISSING_ACCOUNT_ID", "Query parameter 'accountId' is required.", 400);
    }

    const owned = await requireOwnedAccount(env.DB, accountId, user);
    if (!owned.account) return owned.error;

    const automations = await getAutomationsForAccount(env.DB, owned.account.id);
    const withClicks = await Promise.all(
      automations.map(async (a) => ({
        ...a,
        shortLinks: await getShortLinksForAutomation(env.DB, a.id),
      }))
    );
    return jsonSuccess({ automations: withClicks });
  }

  // POST /api/automations (Create / Update)
  if (path === "/api/automations" && method === "POST") {
    const parsed = await parseBody(request, automationSaveSchema);
    if (!parsed.ok) return jsonError(parsed.code, parsed.message, parsed.status);
    const body = parsed.data;

    const accountId = body.accountId ? createAccountId(body.accountId) : null;
    const instagramMediaId = body.instagramMediaId
      ? createMediaId(body.instagramMediaId)
      : null;
    const reelPermalink = body.reelPermalink || "";
    const triggerKeywords: string[] = body.triggerKeywords
      .map((keyword) => keyword.trim())
      .filter(Boolean);
    const commentReplies: string[] = body.commentReplies
      .map((reply) => reply.trim())
      .filter(Boolean);
    const templateCard = body.templateCard as unknown as TemplateCardConfig;

    if (!accountId || !instagramMediaId || !reelPermalink) {
      return jsonError(
        "MISSING_FIELDS",
        "accountId, instagramMediaId, and reelPermalink are required.",
        400
      );
    }

    // OWNERSHIP: the automation may only be written to an account the
    // authenticated user owns.
    const owned = await requireOwnedAccount(env.DB, accountId, user);
    if (!owned.account) return owned.error;
    const plan = owned.account.plan;

    // ── UPDATE GUARD ─────────────────────────────────────────────
    // A client-supplied id is honoured only as an idempotent create key or as
    // an update to this account's own rule. Create-vs-update is decided by the
    // database, never by the presence of `id` in the request body — otherwise a
    // client could send any id and skip the free-tier slot check below.
    const existingAutomation = body?.id
      ? await getAutomationById(env.DB, createAutomationId(String(body.id)))
      : null;

    if (existingAutomation && existingAutomation.accountId !== accountId) {
      return jsonError(
        "AUTOMATION_NOT_OWNED",
        "The automation you are trying to update does not belong to this account.",
        403
      );
    }
    const isNew = !existingAutomation;

    // ── TIER LIMITS (plan.md §3) ─────────────────────────────────
    if (plan === "free") {
      // Lifetime 1-reel rule: deleting an automation never frees the slot.
      const activeCount = await countActiveAutomations(env.DB, accountId);
      if (isNew && (owned.account.freeReelConsumed || activeCount >= 1)) {
        return jsonError(
          "FREE_REEL_LIMIT",
          "The free tier includes 1 automated reel for a lifetime. Upgrade to Pro for unlimited reels.",
          403,
          { upgrade: true }
        );
      }
    }

    // Reply variations: Free = exactly 2, Pro/Studio = 3–8
    const [minVariations, maxVariations] = plan === "free" ? [2, 2] : [3, 8];
    if (commentReplies.length < minVariations || commentReplies.length > maxVariations) {
      return jsonError(
        "SPAM_PROTECTION_VIOLATION",
        plan === "free"
          ? "Free tier runs exactly 2 reply variations. Upgrade to Pro for 3–8 spintax variations."
          : "Between 3 and 8 unique reply variations are required.",
        400,
        { totalVariations: commentReplies.length }
      );
    }

    // Buttons: Free = 1–2 own (RELO button appended at dispatch), Pro/Studio = 1–3
    const maxButtons = plan === "free" ? 2 : 3;

    if (triggerKeywords.length === 0) {
      return jsonError(
        "MISSING_KEYWORDS",
        "At least one trigger keyword or '*' catch-all is required.",
        400
      );
    }

    // Validate 3-Button Generic Template Card
    if (!templateCard || !templateCard.title) {
      return jsonError("INVALID_TEMPLATE_CARD", "Template card title is required.", 400);
    }
    if (templateCard.title.length > 80) {
      return jsonError(
        "TITLE_TOO_LONG",
        "Generic Template title must not exceed 80 characters.",
        400
      );
    }
    if (templateCard.subtitle && templateCard.subtitle.length > 80) {
      return jsonError(
        "SUBTITLE_TOO_LONG",
        "Generic Template subtitle must not exceed 80 characters.",
        400
      );
    }
    if (!Array.isArray(templateCard.buttons) || templateCard.buttons.length === 0) {
      return jsonError(
        "MISSING_BUTTONS",
        "At least 1 button (max 3) is required for the Generic Template card.",
        400
      );
    }
    if (templateCard.buttons.length > maxButtons) {
      return jsonError(
        "TOO_MANY_BUTTONS",
        plan === "free"
          ? "Free tier allows up to 2 buttons — the ⚡ Automated by RELO button is added for you."
          : "Maximum allowed buttons per card is 3.",
        400
      );
    }
    for (const btn of templateCard.buttons) {
      if (!btn || typeof btn.title !== "string" || !btn.title.trim() || btn.title.length > 20) {
        return jsonError(
          "INVALID_BUTTON",
          "Each button needs a title of at most 20 characters.",
          400
        );
      }
      if (btn.type === "web_url" && !/^https:\/\/[^\s"'<>]+$/.test(String(btn.url || ""))) {
        return jsonError(
          "INVALID_BUTTON_URL",
          "Web URL buttons must point to a valid https:// URL.",
          400
        );
      }
    }

    // Creates keep a client-supplied id when one was sent (idempotent create);
    // otherwise the id is generated server-side.
    const automationId = existingAutomation?.id
      ? createAutomationId(String(existingAutomation.id))
      : body?.id
        ? createAutomationId(String(body.id))
        : createAutomationId(crypto.randomUUID());

    // Follow-up DMs are a Pro/Studio feature (plan.md §4.2)
    const followUpEnabled = plan !== "free" && Boolean(body?.followUpEnabled);
    const followUpDelayMinutes = Math.min(
      1440,
      Math.max(5, Math.floor(Number(body?.followUpDelayMinutes)) || 60)
    );

    await saveReelAutomation(env.DB, {
      id: automationId,
      accountId,
      instagramMediaId,
      reelPermalink,
      reelThumbnailUrl: body?.reelThumbnailUrl,
      triggerKeywords,
      commentReplies,
      templateCard,
      isActive: body?.isActive !== false,
      followUpEnabled,
      followUpDelayMinutes,
    });

    // Sent → Clicked tracking: one short link per web_url button (plan.md §4.5)
    const webUrls = (templateCard.buttons as Array<{ type: string; url?: string }>)
      .map((b) => (b.type === "web_url" ? String(b.url || "") : ""))
      .filter(Boolean);
    if (webUrls.length > 0) {
      await replaceShortLinks(env.DB, automationId, accountId, webUrls);
    }

    // Burn the free-tier slot on first create
    if (plan === "free" && isNew) {
      await markFreeReelConsumed(env.DB, accountId);
    }

    return jsonSuccess({
      automation: {
        id: automationId,
        accountId,
        instagramMediaId,
        reelPermalink,
        triggerKeywords,
        commentReplies,
        templateCard,
        isActive: body?.isActive !== false,
        followUpEnabled,
        followUpDelayMinutes,
      },
    });
  }

  // DELETE /api/automations/:id?accountId=...
  if (path.startsWith("/api/automations/") && method === "DELETE") {
    const automationId = path.replace("/api/automations/", "").trim();
    const accountId = url.searchParams.get("accountId");

    if (!automationId || !accountId) {
      return jsonError("MISSING_PARAMS", "automationId and accountId are required.", 400);
    }

    // OWNERSHIP: deleting through someone else's accountId is rejected here
    const owned = await requireOwnedAccount(env.DB, accountId, user);
    if (!owned.account) return owned.error;

    const deleted = await deleteReelAutomation(env.DB, automationId, owned.account.id);
    if (!deleted) {
      return jsonError("NOT_FOUND", "Automation not found or already deleted.", 404);
    }
    return jsonSuccess({ deleted: true });
  }

  // =========================================================================
  // 5. LEADS MANAGEMENT & CSV EXPORT
  // =========================================================================

  // GET /api/leads/export?accountId=... (1-Click CSV Stream)
  if (path === "/api/leads/export" && method === "GET") {
    const accountId = url.searchParams.get("accountId");
    if (!accountId) {
      return jsonError("MISSING_ACCOUNT_ID", "Query parameter 'accountId' is required.", 400);
    }

    const owned = await requireOwnedAccount(env.DB, accountId, user);
    if (!owned.account) return owned.error;

    const exportLimit = await enforceRateLimit(
      env,
      `export:leads:${user.sub}`,
      RATE_LIMITS.expensive
    );
    if (exportLimit.limited) return exportLimit.response;

    const exportRows = await getAllCapturedLeadsForExport(env.DB, owned.account.id);

    const csvHeaders = [
      "Lead ID",
      "Username",
      "Instagram Scoped ID",
      "Follower Status",
      "Email Collected",
      "Total DMs Sent",
      "First Interaction (UTC)",
      "Last Interaction (UTC)",
    ];

    const lines = [csvHeaders.join(",")];

    for (const r of exportRows) {
      lines.push(
        [
          escapeCsv(r.id),
          escapeCsv(r.username),
          escapeCsv(r.instagramScopedId),
          escapeCsv(r.followerStatusAtTrigger),
          escapeCsv(r.emailCollected),
          escapeCsv(r.totalDmsSent),
          escapeCsv(r.firstInteractionAt),
          escapeCsv(r.lastInteractionAt),
        ].join(",")
      );
    }

    const csvContent = lines.join("\r\n");

    return new Response(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="relo-leads-${owned.account.id}.csv"`,
      },
    });
  }

  // GET /api/leads?accountId=...&search=...&limit=...&offset=...
  if (path === "/api/leads" && method === "GET") {
    const accountId = url.searchParams.get("accountId");
    if (!accountId) {
      return jsonError("MISSING_ACCOUNT_ID", "Query parameter 'accountId' is required.", 400);
    }

    const owned = await requireOwnedAccount(env.DB, accountId, user);
    if (!owned.account) return owned.error;

    const search = cleanText(url.searchParams.get("search") || "", 80) || undefined;
    // Client-supplied paging is clamped server-side, never trusted.
    const limit = clampInt(url.searchParams.get("limit"), 1, 100, 50);
    const offset = clampInt(url.searchParams.get("offset"), 0, 100_000, 0);

    const result = await getCapturedLeads(env.DB, owned.account.id, {
      search,
      limit,
      offset,
    });

    return jsonSuccess(result);
  }

  // =========================================================================
  // 6. DASHBOARD TELEMETRY & HEALTH
  // =========================================================================

  // GET /api/analytics?accountId=...
  if (path === "/api/analytics" && method === "GET") {
    const accountId = url.searchParams.get("accountId");
    if (!accountId) {
      return jsonError("MISSING_ACCOUNT_ID", "Query parameter 'accountId' is required.", 400);
    }

    const owned = await requireOwnedAccount(env.DB, accountId, user);
    if (!owned.account) return owned.error;

    const [telemetry, clicks, storageRows, daily, activity] = await Promise.all([
      getAnalyticsSummary(env.DB, owned.account.id),
      getAccountClickStats(env.DB, owned.account.id),
      getAccountStorageRows(env.DB, owned.account.id),
      getDailyActivity(env.DB, owned.account.id, 14),
      getRecentActivity(env.DB, owned.account.id, 12),
    ]);
    return jsonSuccess({
      telemetry: {
        ...telemetry,
        totalClicks: clicks.totalClicks,
        storageRows,
        plan: owned.account.plan,
        aiCreditsRemaining: owned.account.aiCreditsRemaining,
        daily,
        activity,
      },
    });
  }

  // =========================================================================
  // 7. BILLING (plan.md §3 — Lemon Squeezy global + manual UPI India)
  // =========================================================================

  // GET /api/billing — current plan, credits, payment history
  if (path === "/api/billing" && method === "GET") {
    // Reflect a lapsed plan immediately rather than waiting for the next cron
    // tick; the write is idempotent and scoped to this user.
    await expirePlanForUserIfDue(env.DB, user.sub).catch((error) => {
      console.warn("[Billing] Could not evaluate plan expiry:", error);
    });
    const billing = await getUserBilling(env.DB, user.sub);
    const { results } = await env.DB
      .prepare(
        `SELECT id, provider, plan, amount_inr, status, utr, created_at, verified_at
         FROM payments WHERE user_id = ? ORDER BY created_at DESC LIMIT 20`
      )
      .bind(user.sub)
      .all();
    return jsonSuccess({
      plan: billing?.plan || "free",
      aiCreditsRemaining: billing?.aiCreditsRemaining ?? 0,
      planExpiresAt: billing?.planExpiresAt ?? 0,
      payments: results || [],
      checkout: {
        lemonSqueezyUrl: env.LEMON_SQUEEZY_CHECKOUT_URL || null,
        upiId: env.MANUAL_UPI_ID || null,
        provider: env.LEMON_SQUEEZY_WEBHOOK_SECRET ? "lemon_squeezy" : null,
      },
    });
  }

  // POST /api/billing/manual-upi — India flow: record a UTR for owner verification
  if (path === "/api/billing/manual-upi" && method === "POST") {
    const billingLimit = await enforceRateLimit(
      env,
      `billing:${user.sub}:${clientIp(request)}`,
      RATE_LIMITS.billing
    );
    if (billingLimit.limited) return billingLimit.response;

    const parsed = await parseBody(request, manualUpiSchema);
    if (!parsed.ok) return jsonError(parsed.code, parsed.message, parsed.status);

    const plan = parsed.data.plan === "studio" ? "studio" : "pro";
    const utr = parsed.data.utr.trim();
    if (!/^[A-Za-z0-9]{8,30}$/.test(utr)) {
      return jsonError("INVALID_UTR", "Enter the UPI transaction reference (UTR) — 8 to 30 letters/digits.", 400);
    }
    const accounts = await getAccountsForUser(env.DB, user.sub);
    if (accounts.length === 0) {
      return jsonError("NO_ACCOUNT", "Connect an Instagram account before upgrading.", 400);
    }
    // Price is decided here, never by the client.
    const amountInr = plan === "studio" ? 499 : 199;
    // A UPI reference is globally unique: scoping this to one account would let
    // the same transaction be claimed against a second account.
    const duplicate = (await env.DB
      .prepare(`SELECT 1 FROM payments WHERE utr = ? LIMIT 1`)
      .bind(utr.toUpperCase())
      .first()) as any;
    if (duplicate) {
      return jsonError("DUPLICATE_UTR", "This transaction reference was already submitted.", 409);
    }
    try {
      await env.DB
        .prepare(
          `INSERT INTO payments (id, account_id, user_id, provider, plan, amount_inr, utr, status)
           VALUES (?, ?, ?, 'manual_upi', ?, ?, ?, 'pending')`
        )
        .bind(crypto.randomUUID(), accounts[0].id, user.sub, plan, amountInr, utr.toUpperCase())
        .run();
    } catch (insertErr) {
      // The UNIQUE index on utr is the real guard; two requests can pass the
      // SELECT above at the same time.
      const message = insertErr instanceof Error ? insertErr.message : String(insertErr);
      if (/UNIQUE|constraint/i.test(message)) {
        return jsonError(
          "DUPLICATE_UTR",
          "This transaction reference was already submitted.",
          409
        );
      }
      throw insertErr;
    }
    return jsonSuccess({
      message: "Payment recorded. Verification usually completes within a few hours.",
    });
  }

  // =========================================================================
  // 14. PRODUCTS LIBRARY (plan.md §4.4) — Pro/Studio only
  //     Knowledge base for AI product-Q&A and link-in-bio. Capped at 50 rows
  //     per account so the catalog fits in a single AI prompt (no RAG).
  // =========================================================================

  // GET /api/products?accountId=...
  if (path === "/api/products" && method === "GET") {
    const accountId = url.searchParams.get("accountId");
    if (!accountId) {
      return jsonError("MISSING_ACCOUNT_ID", "Query parameter 'accountId' is required.", 400);
    }
    const owned = await requireOwnedAccount(env.DB, accountId, user);
    if (!owned.account) return owned.error;

    if (owned.account.plan === "free") {
      return jsonError(
        "PRODUCTS_LOCKED",
        "The products library is a Pro feature. Upgrade to let AI answer product questions.",
        403,
        { upgrade: true }
      );
    }

    const products = await getProductsForAccount(env.DB, owned.account.id);
    return jsonSuccess({ products });
  }

  // POST /api/products — create or update (id present = update)
  if (path === "/api/products" && method === "POST") {
    const parsed = await parseBody(request, productSaveSchema);
    if (!parsed.ok) return jsonError(parsed.code, parsed.message, parsed.status);
    const body = parsed.data;

    const accountId = body.accountId;
    if (!accountId) {
      return jsonError("MISSING_ACCOUNT_ID", "accountId is required.", 400);
    }
    const owned = await requireOwnedAccount(env.DB, accountId, user);
    if (!owned.account) return owned.error;

    if (owned.account.plan === "free") {
      return jsonError(
        "PRODUCTS_LOCKED",
        "The products library is a Pro feature. Upgrade to let AI answer product questions.",
        403,
        { upgrade: true }
      );
    }

    const name = body.name.trim().slice(0, 120);
    if (!name) {
      return jsonError("MISSING_NAME", "A product name is required.", 400);
    }

    // URL fields must be http(s) — never javascript: or data:.
    const input: ProductInput = {
      name,
      priceText: body.priceText?.trim().slice(0, 60) || undefined,
      description: body.description?.trim().slice(0, 500) || undefined,
      link: safeHttpUrl(body.link),
      imageUrl: safeHttpUrl(body.imageUrl),
      isActive: body.isActive !== false,
    };

    const existingId = body.id || "";
    if (existingId) {
      const existing = await getProductById(env.DB, existingId, owned.account.id);
      if (!existing) {
        return jsonError("NOT_FOUND", "That product no longer exists.", 404);
      }
      const updated = await updateProduct(env.DB, existingId, owned.account.id, input);
      return jsonSuccess({ product: updated });
    }

    // Cap: the catalog must fit inside one AI prompt at MVP.
    const count = await countProductsForAccount(env.DB, owned.account.id);
    if (count >= 50) {
      return jsonError(
        "PRODUCT_LIMIT",
        "You've reached the 50-product limit. Remove a product to add another.",
        403
      );
    }

    const created = await insertProduct(env.DB, owned.account.id, input);
    return jsonSuccess({ product: created }, 201);
  }

  // DELETE /api/products/:id?accountId=...
  if (path.startsWith("/api/products/") && method === "DELETE") {
    const productId = path.split("/")[3];
    const accountId = url.searchParams.get("accountId");
    if (!productId || !accountId) {
      return jsonError("MISSING_FIELDS", "productId and accountId are required.", 400);
    }
    const owned = await requireOwnedAccount(env.DB, accountId, user);
    if (!owned.account) return owned.error;

    const deleted = await deleteProduct(env.DB, productId, owned.account.id);
    if (!deleted) {
      return jsonError("NOT_FOUND", "That product no longer exists.", 404);
    }
    return jsonSuccess({ deleted: true });
  }

  // =========================================================================
  // 15. CAMPAIGNS (plan.md §4.3 / Phase 3) — Pro/Studio only
  //     Re-engages captured commenters inside Meta's 24h window. The
  //     reachability engine runs at fan-out AND at send time.
  // =========================================================================

  // GET /api/campaigns?accountId=...
  if (path === "/api/campaigns" && method === "GET") {
    const accountId = url.searchParams.get("accountId");
    if (!accountId) {
      return jsonError("MISSING_ACCOUNT_ID", "Query parameter 'accountId' is required.", 400);
    }
    const owned = await requireOwnedAccount(env.DB, accountId, user);
    if (!owned.account) return owned.error;

    if (!limitsFor(owned.account.plan).campaigns) {
      return jsonError(
        "CAMPAIGNS_LOCKED",
        "Campaigns are a Pro feature. Upgrade to re-engage your commenters inside the 24-hour window.",
        403,
        { upgrade: true }
      );
    }

    const campaigns = await getCampaignsForAccount(env.DB, owned.account.id);
    return jsonSuccess({ campaigns });
  }

  // POST /api/campaigns — compose (id present = update, no = create)
  if (path === "/api/campaigns" && method === "POST") {
    const parsed = await parseBody(request, campaignSaveSchema);
    if (!parsed.ok) return jsonError(parsed.code, parsed.message, parsed.status);
    const body = parsed.data;

    const accountId = body.accountId;
    if (!accountId) {
      return jsonError("MISSING_ACCOUNT_ID", "accountId is required.", 400);
    }
    const owned = await requireOwnedAccount(env.DB, accountId, user);
    if (!owned.account) return owned.error;

    if (!limitsFor(owned.account.plan).campaigns) {
      return jsonError(
        "CAMPAIGNS_LOCKED",
        "Campaigns are a Pro feature. Upgrade to re-engage your commenters inside the 24-hour window.",
        403,
        { upgrade: true }
      );
    }

    const mediaId = (body.mediaId || "").trim();
    if (!mediaId) {
      return jsonError("MISSING_MEDIA_ID", "Pick the reel whose commenters you want to reach.", 400);
    }

    // Payload: { kind: 'text' | 'card', text?, card? } — the same shape the
    // Canvas "send message" node produces, so a campaign can be a flow node.
    // A card is normalized and validated here: Meta rejects an over-long title
    // or a fourth button per recipient, at cron time, where nobody is watching.
    const rawKind = body.kind === "card" ? "card" : "text";
    const text = (body.text || "").trim().slice(0, 1000);
    const card = body.card ?? null;
    if (rawKind === "text" && !text) {
      return jsonError("MISSING_TEXT", "Write the message you want to send.", 400);
    }
    if (rawKind === "card" && !card) {
      return jsonError("MISSING_CARD", "A card campaign needs card content.", 400);
    }

    let campaignPayload: CampaignInput["payload"];
    if (rawKind === "card") {
      const normalized = normalizeCampaignCard(card);
      if (!normalized.ok) {
        return jsonError("INVALID_CARD", normalized.message, 400);
      }
      campaignPayload = { kind: "card", card: normalized.card };
    } else {
      campaignPayload = { kind: "text", text };
    }

    const patch: CampaignInput = {
      mediaId,
      payload: campaignPayload,
      status: body.status === "scheduled" ? "scheduled" : "draft",
      scheduledAt: Number(body.scheduledAt || 0),
      // The HUMAN_AGENT tag extends Meta's window to 7 days (plan.md §4.3).
      // It is opt-in per campaign and only meaningful while the 7-day tag is approved.
      usesHumanAgentTag: body.usesHumanAgentTag === true,
    };

    // The tag widens the window only when Meta has actually approved it. An
    // unapproved tag makes Meta reject the send, so reachability stays at 24h.
    const windowSeconds = campaignWindowSeconds(patch, env);

    const existingId = body.id || "";
    if (existingId) {
      const existing = await getCampaignById(env.DB, existingId, owned.account.id);
      if (!existing) {
        return jsonError("NOT_FOUND", "That campaign no longer exists.", 404);
      }
      if (existing.status === "sending") {
        return jsonError("CAMPAIGN_IN_FLIGHT", "This campaign is already sending.", 409);
      }
      const updated = await updateCampaign(env.DB, existingId, owned.account.id, patch);
      const reach = await fanOutCampaignTargets(
        env.DB,
        existingId,
        owned.account.id,
        windowSeconds
      );
      return jsonSuccess({ campaign: updated, reachability: reach });
    }

    const campaignId = crypto.randomUUID();
    const created = await insertCampaign(env.DB, campaignId, owned.account.id, patch);
    const reach = await fanOutCampaignTargets(
      env.DB,
      campaignId,
      owned.account.id,
      windowSeconds
    );
    return jsonSuccess({ campaign: created, reachability: reach }, 201);
  }

  // GET /api/campaigns/:id?accountId=... — detail + per-lead delivery status
  if (path.startsWith("/api/campaigns/") && method === "GET") {
    const campaignId = path.split("/")[3];
    const accountId = url.searchParams.get("accountId");
    if (!campaignId || !accountId) {
      return jsonError("MISSING_FIELDS", "campaignId and accountId are required.", 400);
    }
    const owned = await requireOwnedAccount(env.DB, accountId, user);
    if (!owned.account) return owned.error;
    if (!limitsFor(owned.account.plan).campaigns) {
      return jsonError("CAMPAIGNS_LOCKED", "Campaigns are a Pro feature.", 403, { upgrade: true });
    }
    const campaign = await getCampaignById(env.DB, campaignId, owned.account.id);
    if (!campaign) {
      return jsonError("NOT_FOUND", "That campaign no longer exists.", 404);
    }
    const targets = await getCampaignTargets(env.DB, campaignId);
    const reachable = targets.filter((t) => t.status === "pending" || t.status === "sent").length;
    return jsonSuccess({
      campaign,
      targets,
      reachability: {
        total: targets.length,
        reachable,
        unreachable: targets.filter((t) => t.status === "unreachable").length,
      },
    });
  }

  // DELETE /api/campaigns/:id?accountId=...
  if (path.startsWith("/api/campaigns/") && method === "DELETE") {
    const campaignId = path.split("/")[3];
    const accountId = url.searchParams.get("accountId");
    if (!campaignId || !accountId) {
      return jsonError("MISSING_FIELDS", "campaignId and accountId are required.", 400);
    }
    const owned = await requireOwnedAccount(env.DB, accountId, user);
    if (!owned.account) return owned.error;
    const deleted = await deleteCampaign(env.DB, campaignId, owned.account.id);
    if (!deleted) {
      return jsonError("NOT_FOUND", "That campaign no longer exists.", 404);
    }
    return jsonSuccess({ deleted: true });
  }

  // =========================================================================
  // 16. CANVAS FLOWS (plan.md §7 Phase 3) — Studio only
  //     Linear chains first: trigger -> action -> action. Branching later.
  // =========================================================================

  if (path === "/api/flows" && method === "GET") {
    const accountId = url.searchParams.get("accountId");
    if (!accountId) {
      return jsonError("MISSING_ACCOUNT_ID", "Query parameter 'accountId' is required.", 400);
    }
    const owned = await requireOwnedAccount(env.DB, accountId, user);
    if (!owned.account) return owned.error;
    if (!limitsFor(owned.account.plan).canvas) {
      return jsonError(
        "CANVAS_LOCKED",
        "Canvas Studio is a Studio-tier feature. Upgrade to build your own multi-step flows.",
        403,
        { upgrade: true }
      );
    }
    const flows = await getFlowsForAccount(env.DB, owned.account.id);
    return jsonSuccess({ flows });
  }

  if (path === "/api/flows" && method === "POST") {
    const parsed = await parseBody(request, flowSaveSchema);
    if (!parsed.ok) return jsonError(parsed.code, parsed.message, parsed.status);
    const body = parsed.data;

    const accountId = body.accountId;
    if (!accountId) {
      return jsonError("MISSING_ACCOUNT_ID", "accountId is required.", 400);
    }
    const owned = await requireOwnedAccount(env.DB, accountId, user);
    if (!owned.account) return owned.error;
    if (!limitsFor(owned.account.plan).canvas) {
      return jsonError(
        "CANVAS_LOCKED",
        "Canvas Studio is a Studio-tier feature. Upgrade to build your own multi-step flows.",
        403,
        { upgrade: true }
      );
    }

    const existingId = body.id || "";
    if (existingId) {
      const graphValidation = validateFlowGraph(body.graph);
      if ("error" in graphValidation) {
        return jsonError("INVALID_FLOW", graphValidation.error, 400);
      }
      const saved = await saveFlow(env.DB, existingId, owned.account.id, {
        name: (body.name || "").trim().slice(0, 80) || undefined,
        graph: graphValidation.graph,
        isActive: body.isActive === undefined ? undefined : body.isActive === true,
        isPublished: body.isPublished === undefined ? undefined : body.isPublished === true,
      });
      if (!saved) {
        return jsonError("NOT_FOUND", "That flow no longer exists.", 404);
      }
      return jsonSuccess({ flow: saved });
    }

    const count = await countFlowsForAccount(env.DB, owned.account.id);
    if (count >= 25) {
      return jsonError(
        "FLOW_LIMIT",
        "You've reached the 25-flow limit. Delete a flow to create another.",
        403
      );
    }

    const graphValidation = validateFlowGraph(body.graph ?? createStarterGraph());
    if ("error" in graphValidation) {
      return jsonError("INVALID_FLOW", graphValidation.error, 400);
    }
    const name = (body.name || "").trim().slice(0, 80) || "Untitled flow";
    const flow = await insertFlow(
      env.DB,
      crypto.randomUUID(),
      owned.account.id,
      name,
      graphValidation.graph
    );
    return jsonSuccess({ flow }, 201);
  }

  if (path.startsWith("/api/flows/") && method === "DELETE") {
    const flowId = path.split("/")[3];
    const accountId = url.searchParams.get("accountId");
    if (!flowId || !accountId) {
      return jsonError("MISSING_FIELDS", "flowId and accountId are required.", 400);
    }
    const owned = await requireOwnedAccount(env.DB, accountId, user);
    if (!owned.account) return owned.error;
    const deleted = await deleteFlow(env.DB, flowId, owned.account.id);
    if (!deleted) {
      return jsonError("NOT_FOUND", "That flow no longer exists.", 404);
    }
    return jsonSuccess({ deleted: true });
  }

  // =========================================================================
  // 17. REFERRALS (plan.md §7 Phase 3) — 1 free Pro month per qualified signup
  // =========================================================================

  if (path === "/api/referrals" && method === "GET") {
    const summary = await getReferralSummary(env.DB, user.sub);
    return jsonSuccess({
      referral: { ...summary, shareUrl: `${SITE_URL}/signup?ref=${summary.code}` },
    });
  }

  // POST /api/referrals — claim a code (called right after OTP verification).
  // Self-referral is refused; the reward still waits for the referred person's
  // first paid activation.
  if (path === "/api/referrals" && method === "POST") {
    const parsed = await parseBody(request, referralClaimSchema);
    if (!parsed.ok) return jsonError(parsed.code, parsed.message, parsed.status);

    const code = parsed.data.code;
    if (!code) {
      return jsonError("MISSING_CODE", "A referral code is required.", 400);
    }
    const referrerUserId = await findReferrerByCode(env.DB, code);
    if (!referrerUserId) {
      return jsonError("INVALID_CODE", "That referral code isn't recognised.", 400);
    }
    const recorded = await recordReferral(
      env.DB,
      crypto.randomUUID(),
      referrerUserId,
      user.sub,
      code.toUpperCase()
    );
    if (!recorded) {
      // Already claimed, or self-referral. Never leak which.
      return jsonSuccess({ recorded: false });
    }
    return jsonSuccess({ recorded: true });
  }

  // =========================================================================
  // 18. LINK IN BIO (plan.md §4.5 / Phase 2) — Pro/Studio only
  //     Blocks pull from the Products library and click through the same
  //     /l/:id short links the DM buttons use, so one funnel covers both.
  // =========================================================================

  if (path === "/api/link-page" && method === "GET") {
    const accountId = url.searchParams.get("accountId");
    if (!accountId) {
      return jsonError("MISSING_ACCOUNT_ID", "Query parameter 'accountId' is required.", 400);
    }
    const owned = await requireOwnedAccount(env.DB, accountId, user);
    if (!owned.account) return owned.error;
    if (!limitsFor(owned.account.plan).products) {
      return jsonError(
        "LINK_PAGE_LOCKED",
        "Link in bio is a Pro feature. Upgrade to publish your products on your own page.",
        403,
        { upgrade: true }
      );
    }

    const page = await getLinkPageForAccount(env.DB, owned.account.id);
    const blocks = page ? await getLinkBlocks(env.DB, page.id) : [];
    const products = await getProductsForAccount(env.DB, owned.account.id, true);
    return jsonSuccess({
      page,
      blocks,
      products: products.map((p) => ({
        id: p.id,
        name: p.name,
        priceText: p.priceText ?? null,
        link: p.link ?? null,
        imageUrl: p.imageUrl ?? null,
      })),
      publicUrl: page ? publicPageUrl(env, page) : null,
    });
  }

  if (path === "/api/link-page" && method === "POST") {
    const accountId = url.searchParams.get("accountId");
    if (!accountId) {
      return jsonError("MISSING_ACCOUNT_ID", "Query parameter 'accountId' is required.", 400);
    }
    const owned = await requireOwnedAccount(env.DB, accountId, user);
    if (!owned.account) return owned.error;
    if (!limitsFor(owned.account.plan).products) {
      return jsonError(
        "LINK_PAGE_LOCKED",
        "Link in bio is a Pro feature. Upgrade to publish your products on your own page.",
        403,
        { upgrade: true }
      );
    }

    const parsed = await parseBody(request, linkPageSaveSchema);
    if (!parsed.ok) return jsonError(parsed.code, parsed.message, parsed.status);
    const body = parsed.data;

    const rawBlocks = body.blocks.slice(0, 20);
    if (body.blocks.length > 20) {
      return jsonError("TOO_MANY_BLOCKS", "A link page holds up to 20 blocks.", 400);
    }

    // Only the products this account owns may be promoted onto its page.
    const ownedProducts = new Set(
      (await getProductsForAccount(env.DB, owned.account.id, true)).map((p) => p.id)
    );

    const blocks: Array<{
      id: string;
      shortLinkId?: string;
      productId?: string;
      targetUrl: string;
      label: string;
    }> = [];

    // Only ids that already belong to THIS page may be reused. Everything else
    // gets a fresh server-generated id, so a caller cannot collide with (or
    // probe for) another tenant's block. Reuse is what keeps click history.
    const currentPage = await getLinkPageForAccount(env.DB, owned.account.id);
    const reusableBlockIds = new Set(
      (currentPage ? await getLinkBlocks(env.DB, currentPage.id) : []).map((block) => block.id)
    );

    for (const raw of rawBlocks) {
      const label = cleanText(raw.label, 60);
      const productId = cleanText(raw.productId, 64);
      if (!label) continue;

      let targetUrl = cleanText(raw.targetUrl, 500);
      if (productId) {
        if (!ownedProducts.has(productId)) {
          // Never let a page link to somebody else's product row.
          return jsonError("UNKNOWN_PRODUCT", "That product isn't in your catalog.", 400);
        }
        const product = await getProductById(env.DB, productId, owned.account.id);
        if (!product?.link) {
          return jsonError("PRODUCT_HAS_NO_LINK", "Add a buy link to that product first.", 400);
        }
        targetUrl = product.link;
      }

      const safeTarget = safeHttpUrl(targetUrl);
      if (!safeTarget) {
        return jsonError("INVALID_LINK", "Links must start with http:// or https://", 400);
      }

      blocks.push({
        // Block ids are generated server-side unless the id already belongs to
        // this page (see reusableBlockIds above).
        id:
          raw.id && reusableBlockIds.has(raw.id) ? raw.id : crypto.randomUUID(),
        productId: productId || undefined,
        targetUrl: safeTarget,
        label,
      });
    }

    const slugRaw = (body.slug || "").trim().toLowerCase();
    const slug = slugRaw ? (SLUG_RE.test(slugRaw) ? slugRaw : null) : null;
    if (slugRaw && !slug) {
      return jsonError(
        "INVALID_SLUG",
        "A custom address can only use letters, numbers, hyphens and underscores.",
        400
      );
    }

    const slugOwner = slug ? await getLinkPageBySlug(env.DB, slug) : null;
    if (slugOwner && slugOwner.accountId !== owned.account.id) {
      return jsonError("SLUG_TAKEN", "That address is already in use.", 409);
    }

    const page = await upsertLinkPage(env.DB, owned.account.id, {
      slug,
      headline: cleanText(body.headline, 120) || undefined,
      bio: cleanText(body.bio, 500, true) || undefined,
      theme: body.theme === "plain" || body.theme === "dark" ? body.theme : "volt",
      isPublished: body.isPublished === true,
    });

    const saved = await replaceLinkBlocks(env.DB, page.id, blocks);

    return jsonSuccess({
      page,
      blocks: saved,
      publicUrl: publicPageUrl(env, page),
    });
  }

  // =========================================================================
  // 20. CONTENT PLANNING (plan.md §7 Phase 2 — the competitive gap)
  //     Rivals bundle planning WITH automation; we plan the idea here and link
  //     it to the live Reel's automation. We never claim to publish for the
  //     creator — Meta has no content-publishing API.
  // =========================================================================

  if (path === "/api/content-plans" && method === "GET") {
    const accountId = url.searchParams.get("accountId");
    if (!accountId) {
      return jsonError("MISSING_ACCOUNT_ID", "Query parameter 'accountId' is required.", 400);
    }
    const owned = await requireOwnedAccount(env.DB, accountId, user);
    if (!owned.account) return owned.error;
    if (!limitsFor(owned.account.plan).campaigns) {
      return jsonError(
        "CONTENT_LOCKED",
        "Content planning is a Pro feature. Upgrade to plan Reels before you publish them.",
        403,
        { upgrade: true }
      );
    }
    const [plans, stats] = await Promise.all([
      getContentPlans(env.DB, owned.account.id),
      getContentStats(env.DB, owned.account.id),
    ]);
    return jsonSuccess({ plans, stats });
  }

  if (path === "/api/content-plans" && method === "POST") {
    const accountId = url.searchParams.get("accountId");
    if (!accountId) {
      return jsonError("MISSING_ACCOUNT_ID", "Query parameter 'accountId' is required.", 400);
    }
    const owned = await requireOwnedAccount(env.DB, accountId, user);
    if (!owned.account) return owned.error;
    if (!limitsFor(owned.account.plan).campaigns) {
      return jsonError(
        "CONTENT_LOCKED",
        "Content planning is a Pro feature. Upgrade to plan Reels before you publish them.",
        403,
        { upgrade: true }
      );
    }

    const parsed = await parseBody(request, contentPlanSaveSchema);
    if (!parsed.ok) return jsonError(parsed.code, parsed.message, parsed.status);
    const body = parsed.data;

    const title = (body.title || "").trim().slice(0, 120);
    if (!title) {
      return jsonError("MISSING_TITLE", "Give the Reel a working title.", 400);
    }

    const status = isContentStatus(body.status) ? body.status : "idea";
    const plannedFor = Math.max(0, Number(body.plannedFor || 0));

    // A plan may only be linked to an automation on the account it belongs to.
    // Checking that the automation merely *exists* would let a caller credit a
    // plan to another tenant's Reel.
    let automationId: string | undefined;
    if (body.automationId) {
      const automation = await getAutomationById(
        env.DB,
        createAutomationId(body.automationId)
      );
      if (!automation || automation.accountId !== owned.account.id) {
        return jsonError("NOT_FOUND", "That automation no longer exists.", 404);
      }
      automationId = body.automationId;
    }

    const patch = {
      title,
      hook: cleanText(body.hook, 300, true) || undefined,
      caption: cleanText(body.caption, 2200, true) || undefined,
      status,
      plannedFor,
      automationId,
    };

    const existingId = body.id || "";
    if (existingId) {
      const existing = await getContentPlanById(env.DB, existingId, owned.account.id);
      if (!existing) {
        return jsonError("NOT_FOUND", "That plan no longer exists.", 404);
      }
      const updated = await updateContentPlan(env.DB, existingId, owned.account.id, patch);
      return jsonSuccess({ plan: updated });
    }

    const created = await insertContentPlan(
      env.DB,
      crypto.randomUUID(),
      owned.account.id,
      patch
    );
    return jsonSuccess({ plan: created }, 201);
  }

  // POST /api/content-plans/publish — link a planned Reel to its live media.
  if (path === "/api/content-plans/publish" && method === "POST") {
    const accountId = url.searchParams.get("accountId");
    if (!accountId) {
      return jsonError("MISSING_ACCOUNT_ID", "Query parameter 'accountId' is required.", 400);
    }
    const owned = await requireOwnedAccount(env.DB, accountId, user);
    if (!owned.account) return owned.error;
    if (!limitsFor(owned.account.plan).campaigns) {
      return jsonError("CONTENT_LOCKED", "Content planning is a Pro feature.", 403, { upgrade: true });
    }

    const parsed = await parseBody(request, contentPlanPublishSchema);
    if (!parsed.ok) return jsonError(parsed.code, parsed.message, parsed.status);

    const planId = parsed.data.id || "";
    const mediaId = parsed.data.mediaId || "";
    if (!planId || !mediaId) {
      return jsonError("MISSING_FIELDS", "id and mediaId are required.", 400);
    }
    const plan = await getContentPlanById(env.DB, planId, owned.account.id);
    if (!plan) {
      return jsonError("NOT_FOUND", "That plan no longer exists.", 404);
    }

    // The Reel must be one this account actually automates, otherwise the
    // planner would happily claim credit for someone else's Reel.
    const matching = await env.DB
      .prepare(
        `SELECT id FROM reel_automations
         WHERE account_id = ? AND instagram_media_id = ? LIMIT 1`
      )
      .bind(owned.account.id, mediaId)
      .first() as any;

    const updated = await updateContentPlan(env.DB, planId, owned.account.id, {
      title: plan.title,
      status: "published",
      instagramMediaId: mediaId,
      automationId: matching?.id ? String(matching.id) : undefined,
    });
    return jsonSuccess({ plan: updated });
  }

  if (path.startsWith("/api/content-plans/") && method === "DELETE") {
    const planId = path.split("/")[3];
    const accountId = url.searchParams.get("accountId");
    if (!planId || !accountId) {
      return jsonError("MISSING_FIELDS", "planId and accountId are required.", 400);
    }
    const owned = await requireOwnedAccount(env.DB, accountId, user);
    if (!owned.account) return owned.error;
    const deleted = await deleteContentPlan(env.DB, planId, owned.account.id);
    if (!deleted) {
      return jsonError("NOT_FOUND", "That plan no longer exists.", 404);
    }
    return jsonSuccess({ deleted: true });
  }

  if (path === "/api/admin/activate-payment" && method === "POST") {
    // Defensive: the prefix guard already resolved an actor. If it is missing
    // for any reason, fail closed rather than trusting the route is reachable.
    if (!adminActor) {
      return jsonError("FORBIDDEN", "Admin access is required for this endpoint.", 403);
    }

    const parsed = await parseBody(request, adminPaymentSchema);
    if (!parsed.ok) return jsonError(parsed.code, parsed.message, parsed.status);

    const paymentId = parsed.data.paymentId || "";
    const approve = parsed.data.approve !== false;
    if (!paymentId) {
      return jsonError("MISSING_PAYMENT_ID", "paymentId is required.", 400);
    }
    const payment = (await env.DB
      .prepare(`SELECT * FROM payments WHERE id = ? AND status = 'pending' LIMIT 1`)
      .bind(paymentId)
      .first()) as any;
    if (!payment) {
      await recordAdminAudit(env.DB, {
        actor: adminActor,
        action: "payment.activate",
        targetType: "payment",
        targetId: paymentId,
        success: false,
        metadata: { reason: "pending_payment_not_found" },
        ip: clientIp(request),
      });
      return jsonError("NOT_FOUND", "Pending payment not found.", 404);
    }
    const now = Math.floor(Date.now() / 1000);
    if (approve) {
      // Payments carry the user id now; fall back to the account binding for
      // rows written before the migration.
      const paymentUserId =
        payment.user_id ||
        ((
          (await env.DB
            .prepare(`SELECT user_id FROM connected_accounts WHERE id = ? LIMIT 1`)
            .bind(payment.account_id)
            .first()) as any
        )?.user_id as string | undefined);
      if (!paymentUserId) {
        await recordAdminAudit(env.DB, {
          actor: adminActor,
          action: "payment.activate",
          targetType: "payment",
          targetId: paymentId,
          success: false,
          metadata: { reason: "account_missing", accountId: payment.account_id },
          ip: clientIp(request),
        });
        return jsonError("NOT_FOUND", "Payment account no longer exists.", 404);
      }

      // Claim the payment atomically: only one approval can win, so a double
      // click cannot grant the plan (and credits) twice.
      const claim = await env.DB
        .prepare(
          `UPDATE payments
              SET status = 'verified', verified_at = ?, user_id = COALESCE(user_id, ?)
            WHERE id = ? AND status = 'pending'`
        )
        .bind(now, paymentUserId, paymentId)
        .run();
      if ((claim.meta?.changes ?? 0) === 0) {
        return jsonError("ALREADY_PROCESSED", "This payment was already reviewed.", 409);
      }

      const activatedPlan = payment.plan === "studio" ? "studio" : "pro";
      // Owner-verified payments grant one month from approval, then lapse
      // automatically. Cron downgrades them; nobody has to remember.
      await activatePlanForUser(env.DB, paymentUserId, activatedPlan, now + 30 * 86400);

      // Referral loop (plan.md §7): the reward is only earned once the referred
      // person has actually paid, so this is the only place referrals qualify.
      const qualified = await qualifyReferralsForUser(env.DB, paymentUserId);
      const rewarded = qualified > 0 ? await rewardQualifiedReferrals(env.DB, paymentUserId) : 0;

      await recordAdminAudit(env.DB, {
        actor: adminActor,
        action: "payment.activate",
        targetType: "payment",
        targetId: paymentId,
        success: true,
        metadata: {
          plan: payment.plan,
          accountId: payment.account_id,
          userId: paymentUserId,
          referralsRewarded: rewarded,
        },
        ip: clientIp(request),
      });

      return jsonSuccess({ activated: true, plan: payment.plan, referralsRewarded: rewarded });
    }
    const rejected = await env.DB
      .prepare(
        `UPDATE payments SET status = 'rejected', verified_at = ? WHERE id = ? AND status = 'pending'`
      )
      .bind(now, paymentId)
      .run();
    if ((rejected.meta?.changes ?? 0) === 0) {
      return jsonError("ALREADY_PROCESSED", "This payment was already reviewed.", 409);
    }

    await recordAdminAudit(env.DB, {
      actor: adminActor,
      action: "payment.reject",
      targetType: "payment",
      targetId: paymentId,
      success: true,
      metadata: { plan: payment.plan, accountId: payment.account_id },
      ip: clientIp(request),
    });

    return jsonSuccess({ activated: false, rejected: true });
  }

  // The path is deliberately not echoed: it is attacker-controlled and the
  // client already knows what it requested.
  return jsonError("NOT_FOUND", "Endpoint not found.", 404);
}
