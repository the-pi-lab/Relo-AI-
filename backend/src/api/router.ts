import type { Env } from "../db";
import {
  findOrCreateUserByEmail,
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
  countActiveAutomations,
  markFreeReelConsumed,
  replaceShortLinks,
  resetMonthlyCreditsIfDue,
  getAccountClickStats,
  getAccountStorageRows,
  activatePlanForUser,
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
import {
  signJwt,
  verifyJwt,
  generateOtpCode,
  sendOtpEmail,
  type JwtPayload,
} from "../auth";
import { encryptSecret, decryptSecret, getMasterKey } from "../crypto";
import { metaGraphClient } from "../meta/client";
import { validateReplyVariations } from "../engine/spintax";
import { createAccountId, createAutomationId, createMediaId } from "../types/ids";
import type { ApiResponse, TemplateCardConfig } from "../types";

/**
 * Standard CORS headers for dashboard API communication
 */
export const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Hub-Signature-256",
};

/**
 * Creates standardized API success envelope
 */
export function jsonSuccess<T>(data: T, status = 200): Response {
  const body: ApiResponse<T> = { success: true, data };
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

/**
 * Creates standardized API error envelope
 */
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
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

/**
 * Authenticates user from Bearer JWT token in Authorization header
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
  return verifyJwt(token, env.JWT_SECRET);
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
 * Best-effort in-memory sliding-window rate limiter (per Worker isolate).
 * Not globally durable — the durable OTP throttle lives in D1 — but it stops
 * burst abuse of the public auth endpoints from a single connection.
 */
const rateBuckets = new Map<string, number[]>();
function isRateLimited(bucketKey: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = (rateBuckets.get(bucketKey) || []).filter((t) => now - t < windowMs);
  if (bucket.length >= maxRequests) {
    rateBuckets.set(bucketKey, bucket);
    return true;
  }
  bucket.push(now);
  rateBuckets.set(bucketKey, bucket);
  if (rateBuckets.size > 10000) {
    // Prevent unbounded map growth on hot isolates
    const oldest = rateBuckets.keys().next().value;
    if (oldest) rateBuckets.delete(oldest);
  }
  return false;
}

function clientIp(request: Request): string {
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
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
 * Main REST API Router for /api/* requests
 */
export async function handleApiRequest(
  request: Request,
  env: Env
): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  // Handle CORS Preflight
  if (method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  // =========================================================================
  // 1. AUTHENTICATION ENDPOINTS (Public, rate-limited)
  // =========================================================================

  // POST /api/auth/otp/send
  if (path === "/api/auth/otp/send" && method === "POST") {
    if (isRateLimited(`otp-send:${clientIp(request)}`, 5, 60_000)) {
      return jsonError("RATE_LIMITED", "Too many code requests. Please wait a minute.", 429);
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      return jsonError("INVALID_JSON", "Malformed request payload", 400);
    }

    const email = body?.email ? String(body.email).toLowerCase().trim() : "";
    if (!email || email.length > 320 || !EMAIL_PATTERN.test(email)) {
      return jsonError("INVALID_EMAIL", "A valid email address is required.", 400);
    }

    const code = generateOtpCode();
    const saveResult = await saveEmailOtp(env.DB, email, code, 600);
    if (!saveResult.ok) {
      return jsonError(
        "OTP_RESEND_THROTTLED",
        `A code was recently sent. Please wait ${saveResult.retryAfterSeconds}s before requesting another.`,
        429,
        { retryAfterSeconds: saveResult.retryAfterSeconds }
      );
    }

    const sendResult = await sendOtpEmail(email, code, env.RESEND_API_KEY);
    if (!sendResult.success) {
      console.error(`[Auth] OTP email delivery failed for ${email}: ${sendResult.error}`);
      return jsonError(
        "EMAIL_DELIVERY_FAILED",
        "We could not send the verification email right now. Please try again shortly.",
        502
      );
    }

    // Dev-only OTP echo: requires an explicit opt-in flag, never on by default.
    const debugCode =
      env.DEBUG_OTPS === "1" && env.ENVIRONMENT !== "production" && !env.RESEND_API_KEY
        ? code
        : undefined;

    return jsonSuccess({
      message: "Verification code sent to your email.",
      debugCode,
    });
  }

  // POST /api/auth/otp/verify
  if (path === "/api/auth/otp/verify" && method === "POST") {
    if (isRateLimited(`otp-verify:${clientIp(request)}`, 10, 60_000)) {
      return jsonError("RATE_LIMITED", "Too many attempts. Please wait a minute.", 429);
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      return jsonError("INVALID_JSON", "Malformed request payload", 400);
    }

    const email = body?.email ? String(body.email).toLowerCase().trim() : "";
    const code = body?.code ? String(body.code).trim() : "";

    if (!email || !code) {
      return jsonError("MISSING_FIELDS", "Email and 6-digit code are required.", 400);
    }

    const isValid = await verifyAndConsumeEmailOtp(env.DB, email, code);
    if (!isValid) {
      return jsonError("INVALID_OTP", "Invalid or expired verification code.", 401);
    }

    // Find or create user
    const user = await findOrCreateUserByEmail(env.DB, email);

    // Issue signed 7-day JWT session
    const token = await signJwt(
      { sub: user.id as any, email: user.email },
      env.JWT_SECRET,
      7 * 24 * 60 * 60
    );

    return jsonSuccess({
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
      },
      token,
    });
  }

  // =========================================================================
  // AUTHENTICATION GUARD FOR PROTECTED ENDPOINTS
  // =========================================================================
  const user = await authenticateUser(request, env);
  if (!user) {
    return jsonError("UNAUTHORIZED", "Missing or invalid authorization token.", 401);
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
    let body: any;
    try {
      body = await request.json();
    } catch {
      return jsonError("INVALID_JSON", "Malformed request payload", 400);
    }

    const code = body?.code ? String(body.code) : undefined;
    const clientAccessToken = body?.accessToken ? String(body.accessToken) : undefined;

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
          body?.redirectUri ? String(body.redirectUri) : undefined
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
      const connectedResults = [];

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
    let body: any;
    try {
      body = await request.json();
    } catch {
      return jsonError("INVALID_JSON", "Malformed request payload", 400);
    }

    const accountId = body?.accountId ? createAccountId(body.accountId) : null;
    const instagramMediaId = body?.instagramMediaId ? createMediaId(body.instagramMediaId) : null;
    const reelPermalink = body?.reelPermalink || "";
    const triggerKeywords: string[] = Array.isArray(body?.triggerKeywords)
      ? body.triggerKeywords.map((k: string) => String(k).trim()).filter(Boolean)
      : [];
    const commentReplies: string[] = Array.isArray(body?.commentReplies)
      ? body.commentReplies.map((r: string) => String(r).trim()).filter(Boolean)
      : [];
    const followGateEnabled = Boolean(body?.followGateEnabled);
    const templateCard = body?.templateCard as TemplateCardConfig;

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

    // ── TIER LIMITS (plan.md §3) ─────────────────────────────────
    const isNew = !body?.id;
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

    // UPDATE GUARD: a client-supplied id must reference an automation that
    // already belongs to this account — otherwise the upsert would silently
    // overwrite someone else's rule.
    if (body?.id) {
      const existing = await getAutomationById(env.DB, createAutomationId(String(body.id)));
      if (existing && existing.accountId !== accountId) {
        return jsonError(
          "AUTOMATION_NOT_OWNED",
          "The automation you are trying to update does not belong to this account.",
          403
        );
      }
    }

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

    const automationId = body?.id
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
      followGateEnabled,
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
        followGateEnabled,
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
        ...CORS_HEADERS,
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="relo-leads-${accountId}.csv"`,
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

    const search = url.searchParams.get("search") || undefined;
    const limit = Number(url.searchParams.get("limit") || 50);
    const offset = Number(url.searchParams.get("offset") || 0);

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

    const [telemetry, clicks, storageRows] = await Promise.all([
      getAnalyticsSummary(env.DB, owned.account.id),
      getAccountClickStats(env.DB, owned.account.id),
      getAccountStorageRows(env.DB, owned.account.id),
    ]);
    return jsonSuccess({
      telemetry: {
        ...telemetry,
        totalClicks: clicks.totalClicks,
        storageRows,
        plan: owned.account.plan,
        aiCreditsRemaining: owned.account.aiCreditsRemaining,
      },
    });
  }

  // =========================================================================
  // 7. BILLING (plan.md §3 — Lemon Squeezy global + manual UPI India)
  // =========================================================================

  // GET /api/billing — current plan, credits, payment history
  if (path === "/api/billing" && method === "GET") {
    const accounts = await getAccountsForUser(env.DB, user.sub);
    const owned = accounts[0] ? await getOwnedAccount(env.DB, accounts[0].id, user.sub) : null;
    const { results } = await env.DB
      .prepare(
        `SELECT id, provider, plan, amount_inr, status, utr, created_at, verified_at
         FROM payments WHERE account_id = ? ORDER BY created_at DESC LIMIT 20`
      )
      .bind(owned?.id || "")
      .all();
    return jsonSuccess({
      plan: owned?.plan || "free",
      aiCreditsRemaining: owned?.aiCreditsRemaining ?? 0,
      payments: results || [],
      checkout: {
        lemonSqueezyUrl: env.LEMON_SQUEEZY_CHECKOUT_URL || null,
        upiId: env.MANUAL_UPI_ID || null,
      },
    });
  }

  // POST /api/billing/manual-upi — India flow: record a UTR for owner verification
  if (path === "/api/billing/manual-upi" && method === "POST") {
    if (isRateLimited(`upi:${clientIp(request)}`, 5, 60_000)) {
      return jsonError("RATE_LIMITED", "Too many submissions. Please wait a minute.", 429);
    }
    let body: any;
    try {
      body = await request.json();
    } catch {
      return jsonError("INVALID_JSON", "Malformed request payload", 400);
    }
    const plan = body?.plan === "studio" ? "studio" : "pro";
    const utr = String(body?.utr || "").trim();
    if (!/^[A-Za-z0-9]{8,30}$/.test(utr)) {
      return jsonError("INVALID_UTR", "Enter the UPI transaction reference (UTR) — 8 to 30 letters/digits.", 400);
    }
    const accounts = await getAccountsForUser(env.DB, user.sub);
    if (accounts.length === 0) {
      return jsonError("NO_ACCOUNT", "Connect an Instagram account before upgrading.", 400);
    }
    const amountInr = plan === "studio" ? 399 : 149;
    const duplicate = (await env.DB
      .prepare(`SELECT 1 FROM payments WHERE utr = ? AND account_id = ? LIMIT 1`)
      .bind(utr, accounts[0].id)
      .first()) as any;
    if (duplicate) {
      return jsonError("DUPLICATE_UTR", "This transaction reference was already submitted.", 409);
    }
    await env.DB
      .prepare(
        `INSERT INTO payments (id, account_id, provider, plan, amount_inr, utr, status)
         VALUES (?, ?, 'manual_upi', ?, ?, ?, 'pending')`
      )
      .bind(crypto.randomUUID(), accounts[0].id, plan, amountInr, utr.toUpperCase())
      .run();
    return jsonSuccess({
      message: "Payment recorded. Verification usually completes within a few hours.",
    });
  }

  // POST /api/admin/activate-payment — OWNER ONLY (x-admin-secret)
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
    let body: any;
    try {
      body = await request.json();
    } catch {
      return jsonError("INVALID_JSON", "Malformed request payload", 400);
    }

    const accountId = String(body?.accountId || "");
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

    const name = String(body?.name || "").trim().slice(0, 120);
    if (!name) {
      return jsonError("MISSING_NAME", "A product name is required.", 400);
    }

    // URL fields must be http(s) — never javascript: or data:.
    const safeUrl = (raw: unknown): string | undefined => {
      const v = String(raw || "").trim();
      if (!v) return undefined;
      return /^https?:\/\//i.test(v) ? v.slice(0, 500) : undefined;
    };

    const input: ProductInput = {
      name,
      priceText: String(body?.priceText || "").trim().slice(0, 60) || undefined,
      description: String(body?.description || "").trim().slice(0, 500) || undefined,
      link: safeUrl(body?.link),
      imageUrl: safeUrl(body?.imageUrl),
      isActive: body?.isActive !== false,
    };

    const existingId = String(body?.id || "").trim();
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
    let body: any;
    try {
      body = await request.json();
    } catch {
      return jsonError("INVALID_JSON", "Malformed request payload", 400);
    }

    const accountId = String(body?.accountId || "");
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

    const mediaId = String(body?.mediaId || "").trim();
    if (!mediaId) {
      return jsonError("MISSING_MEDIA_ID", "Pick the reel whose commenters you want to reach.", 400);
    }

    // Payload: { kind: 'text' | 'card', text?, card? } — the same shape the
    // Canvas "send message" node produces, so a campaign can be a flow node.
    const rawKind = body?.kind === "card" ? "card" : "text";
    const text = String(body?.text || "").trim().slice(0, 1000);
    const card = body?.card ?? null;
    if (rawKind === "text" && !text) {
      return jsonError("MISSING_TEXT", "Write the message you want to send.", 400);
    }
    if (rawKind === "card" && !card) {
      return jsonError("MISSING_CARD", "A card campaign needs card content.", 400);
    }

    const patch: CampaignInput = {
      mediaId,
      payload: rawKind === "text" ? { kind: "text", text } : { kind: "card", card },
      status: body?.status === "scheduled" ? "scheduled" : "draft",
      scheduledAt: Number(body?.scheduledAt || 0),
      // The HUMAN_AGENT tag extends Meta's window to 7 days (plan.md §4.3).
      // It is opt-in per campaign and only meaningful while the 7-day tag is approved.
      usesHumanAgentTag: body?.usesHumanAgentTag === true,
    };

    const existingId = String(body?.id || "").trim();
    if (existingId) {
      const existing = await getCampaignById(env.DB, existingId, owned.account.id);
      if (!existing) {
        return jsonError("NOT_FOUND", "That campaign no longer exists.", 404);
      }
      if (existing.status === "sending") {
        return jsonError("CAMPAIGN_IN_FLIGHT", "This campaign is already sending.", 409);
      }
      const updated = await updateCampaign(env.DB, existingId, owned.account.id, patch);
      const reach = await fanOutCampaignTargets(env.DB, existingId, owned.account.id);
      return jsonSuccess({ campaign: updated, reachability: reach });
    }

    const campaignId = crypto.randomUUID();
    const created = await insertCampaign(env.DB, campaignId, owned.account.id, patch);
    const reach = await fanOutCampaignTargets(env.DB, campaignId, owned.account.id);
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
    let body: any;
    try {
      body = await request.json();
    } catch {
      return jsonError("INVALID_JSON", "Malformed request payload", 400);
    }
    const accountId = String(body?.accountId || "");
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

    const existingId = String(body?.id || "").trim();
    if (existingId) {
      const graphValidation = validateFlowGraph(body?.graph);
      if ("error" in graphValidation) {
        return jsonError("INVALID_FLOW", graphValidation.error, 400);
      }
      const saved = await saveFlow(env.DB, existingId, owned.account.id, {
        name: String(body?.name || "").trim().slice(0, 80) || undefined,
        graph: graphValidation.graph,
        isActive: body?.isActive === undefined ? undefined : body.isActive === true,
        isPublished: body?.isPublished === undefined ? undefined : body.isPublished === true,
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

    const graphValidation = validateFlowGraph(body?.graph ?? createStarterGraph());
    if ("error" in graphValidation) {
      return jsonError("INVALID_FLOW", graphValidation.error, 400);
    }
    const name = String(body?.name || "").trim().slice(0, 80) || "Untitled flow";
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
    let body: any;
    try {
      body = await request.json();
    } catch {
      return jsonError("INVALID_JSON", "Malformed request payload", 400);
    }
    const code = String(body?.code || "").trim();
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
  // 18. AGENCY CONTACT (plan.md §3) — bigger than 3 accounts, talk to the owner
  // =========================================================================

  if (path === "/api/agency/contact" && method === "POST") {
    if (isRateLimited(`agency:${clientIp(request)}`, 5, 60_000)) {
      return jsonError("RATE_LIMITED", "Too many submissions. Please wait a minute.", 429);
    }
    let body: any;
    try {
      body = await request.json();
    } catch {
      return jsonError("INVALID_JSON", "Malformed request payload", 400);
    }
    const email = String(body?.email || user.email || "").trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return jsonError("INVALID_EMAIL", "Enter a valid email so we can reply.", 400);
    }
    const accountCount = Math.max(1, Number(body?.accountCount || 3));
    const notes = String(body?.notes || "").trim().slice(0, 1000);
    const planInterest = body?.plan === "studio" ? "studio" : "custom";

    await env.DB
      .prepare(
        `INSERT INTO webhook_logs (id, account_id, event_type, status_code, payload)
         VALUES (?, NULL, 'agency_contact', 202, ?)`
      )
      .bind(
        crypto.randomUUID(),
        JSON.stringify({ email, accountCount, planInterest, notes })
      )
      .run();

    return jsonSuccess({
      message: `Thanks — we'll reply to ${email} within one business day.`,
    });
  }

  // =========================================================================
  // 19. LINK IN BIO (plan.md §4.5 / Phase 2) — Pro/Studio only
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
      publicUrl: page ? `${(env.PUBLIC_APP_URL || "https://relo.ai").replace(/\/$/, "")}/p/${page.id}` : null,
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

    let body: any;
    try {
      body = await request.json();
    } catch {
      return jsonError("INVALID_JSON", "Malformed request payload", 400);
    }

    const rawBlocks = Array.isArray(body?.blocks) ? body.blocks.slice(0, 20) : [];
    if (Array.isArray(body?.blocks) && body.blocks.length > 20) {
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

    for (const raw of rawBlocks) {
      const label = String(raw?.label || "").trim().slice(0, 60);
      const productId = String(raw?.productId || "").trim();
      if (!label) continue;

      let targetUrl = String(raw?.targetUrl || "").trim();
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

      if (!/^https?:\/\//i.test(targetUrl)) {
        return jsonError("INVALID_LINK", "Links must start with http:// or https://", 400);
      }

      blocks.push({
        id: String(raw?.id || crypto.randomUUID()).slice(0, 64),
        productId: productId || undefined,
        targetUrl: targetUrl.slice(0, 500),
        label,
      });
    }

    const slugRaw = String(body?.slug || "").trim().toLowerCase();
    const slug = slugRaw ? (SLUG_RE.test(slugRaw) ? slugRaw : null) : null;
    if (slugRaw && !slug) {
      return jsonError(
        "INVALID_SLUG",
        "A custom address can only use letters, numbers, hyphens and underscores.",
        400
      );
    }

    const existing = await getLinkPageForAccount(env.DB, owned.account.id);
    const slugOwner = slug ? await getLinkPageBySlug(env.DB, slug) : null;
    if (slugOwner && slugOwner.accountId !== owned.account.id) {
      return jsonError("SLUG_TAKEN", "That address is already in use.", 409);
    }

    const page = await upsertLinkPage(env.DB, owned.account.id, {
      slug,
      headline: String(body?.headline || "").trim().slice(0, 120) || undefined,
      bio: String(body?.bio || "").trim().slice(0, 500) || undefined,
      theme: body?.theme === "plain" || body?.theme === "dark" ? body.theme : "volt",
      isPublished: body?.isPublished === true,
    });

    const saved = await replaceLinkBlocks(env.DB, page.id, blocks);

    return jsonSuccess({
      page,
      blocks: saved,
      publicUrl: `${(env.PUBLIC_APP_URL || "https://relo.ai").replace(/\/$/, "")}/p/${page.id}`,
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

    let body: any;
    try {
      body = await request.json();
    } catch {
      return jsonError("INVALID_JSON", "Malformed request payload", 400);
    }

    const title = String(body?.title || "").trim().slice(0, 120);
    if (!title) {
      return jsonError("MISSING_TITLE", "Give the Reel a working title.", 400);
    }

    const status = isContentStatus(body?.status) ? body.status : "idea";
    const plannedFor = Math.max(0, Number(body?.plannedFor || 0));

    // A plan may only be linked to an automation on an account the caller owns.
    let automationId: string | undefined;
    if (body?.automationId) {
      const automation = await getAutomationById(
        env.DB,
        createAutomationId(String(body.automationId))
      );
      if (!automation) {
        return jsonError("NOT_FOUND", "That automation no longer exists.", 404);
      }
      automationId = String(body.automationId);
    }

    const patch = {
      title,
      hook: String(body?.hook || "").trim().slice(0, 300) || undefined,
      caption: String(body?.caption || "").trim().slice(0, 2200) || undefined,
      status,
      plannedFor,
      automationId,
    };

    const existingId = String(body?.id || "").trim();
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

    let body: any;
    try {
      body = await request.json();
    } catch {
      return jsonError("INVALID_JSON", "Malformed request payload", 400);
    }

    const planId = String(body?.id || "").trim();
    const mediaId = String(body?.mediaId || "").trim();
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
    const secret = request.headers.get("x-admin-secret") || "";
    if (!env.ADMIN_SECRET || !secret) {
      return jsonError("FORBIDDEN", "Admin access requires the secret header.", 403);
    }
    const adminOk = await (await import("../crypto")).timingSafeEqualAsync(
      secret,
      env.ADMIN_SECRET
    );
    if (!adminOk) {
      return jsonError("FORBIDDEN", "Admin access requires the secret header.", 403);
    }
    let body: any;
    try {
      body = await request.json();
    } catch {
      return jsonError("INVALID_JSON", "Malformed request payload", 400);
    }
    const paymentId = String(body?.paymentId || "").trim();
    const approve = body?.approve !== false;
    if (!paymentId) {
      return jsonError("MISSING_PAYMENT_ID", "paymentId is required.", 400);
    }
    const payment = (await env.DB
      .prepare(`SELECT * FROM payments WHERE id = ? AND status = 'pending' LIMIT 1`)
      .bind(paymentId)
      .first()) as any;
    if (!payment) {
      return jsonError("NOT_FOUND", "Pending payment not found.", 404);
    }
    const now = Math.floor(Date.now() / 1000);
    if (approve) {
      const ownerRow = (await env.DB
        .prepare(`SELECT user_id FROM connected_accounts WHERE id = ? LIMIT 1`)
        .bind(payment.account_id)
        .first()) as any;
      if (!ownerRow?.user_id) {
        return jsonError("NOT_FOUND", "Payment account no longer exists.", 404);
      }
      const activatedPlan = payment.plan === "studio" ? "studio" : "pro";
      await activatePlanForUser(env.DB, ownerRow.user_id, activatedPlan);
      await env.DB
        .prepare(`UPDATE payments SET status = 'verified', verified_at = ? WHERE id = ?`)
        .bind(now, paymentId)
        .run();

      // Referral loop (plan.md §7): the reward is only earned once the referred
      // person has actually paid, so this is the only place referrals qualify.
      const qualified = await qualifyReferralsForUser(env.DB, ownerRow.user_id);
      const rewarded = qualified > 0 ? await rewardQualifiedReferrals(env.DB, ownerRow.user_id) : 0;

      return jsonSuccess({ activated: true, plan: payment.plan, referralsRewarded: rewarded });
    }
    await env.DB
      .prepare(`UPDATE payments SET status = 'rejected', verified_at = ? WHERE id = ?`)
      .bind(now, paymentId)
      .run();
    return jsonSuccess({ activated: false, rejected: true });
  }

  return jsonError("NOT_FOUND", `Endpoint ${method} ${path} not found.`, 404);
}
