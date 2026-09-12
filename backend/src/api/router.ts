import type { Env } from "../db";
import {
  findOrCreateUserByEmail,
  saveEmailOtp,
  verifyAndConsumeEmailOtp,
  getAccountsForUser,
  getAccountById,
  upsertConnectedAccount,
  deleteConnectedAccount,
  getAutomationsForAccount,
  saveReelAutomation,
  deleteReelAutomation,
  getCapturedLeads,
  getAllCapturedLeadsForExport,
  getAnalyticsSummary,
} from "../db/queries";
import {
  signJwt,
  verifyJwt,
  generateOtpCode,
  sendOtpEmail,
  type JwtPayload,
} from "../auth";
import { encryptSecret, decryptSecret } from "../crypto";
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
 * Escapes fields for standard RFC 4180 CSV generation
 */
function escapeCsv(field: unknown): string {
  const str = field === null || field === undefined ? "" : String(field);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
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
  // 1. AUTHENTICATION ENDPOINTS (Public)
  // =========================================================================

  // POST /api/auth/otp/send
  if (path === "/api/auth/otp/send" && method === "POST") {
    let body: any;
    try {
      body = await request.json();
    } catch {
      return jsonError("INVALID_JSON", "Malformed request payload", 400);
    }

    const email = body?.email ? String(body.email).toLowerCase().trim() : "";
    if (!email || !email.includes("@")) {
      return jsonError("INVALID_EMAIL", "A valid email address is required.", 400);
    }

    const code = generateOtpCode();
    await saveEmailOtp(env.DB, email, code, 600); // 10 minutes expiry

    const sendResult = await sendOtpEmail(email, code, env.RESEND_API_KEY);

    return jsonSuccess({
      message: "Verification code sent to your email.",
      debugCode: env.ENVIRONMENT !== "production" ? sendResult.debugCode : undefined,
    });
  }

  // POST /api/auth/otp/verify
  if (path === "/api/auth/otp/verify" && method === "POST") {
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
    return jsonSuccess({ accounts });
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

  // POST /api/auth/meta/callback (OAuth Code Exchange)
  if (path === "/api/auth/meta/callback" && method === "POST") {
    let body: any;
    try {
      body = await request.json();
    } catch {
      return jsonError("INVALID_JSON", "Malformed request payload", 400);
    }

    const code = body?.code;
    const shortLivedToken = body?.accessToken || code;

    if (!shortLivedToken) {
      return jsonError("MISSING_TOKEN", "Meta OAuth access token or code is required.", 400);
    }

    const masterKey = env.ENCRYPTION_MASTER_KEY || env.JWT_SECRET;

    try {
      // 1. Fetch connected Instagram business pages
      const accounts = await metaGraphClient.getConnectedAccounts(shortLivedToken);

      if (accounts.length === 0) {
        return jsonError(
          "NO_INSTAGRAM_ACCOUNT",
          "No Instagram Professional/Creator account was found linked to your Facebook Page. Please link your Instagram account in Page Settings.",
          400
        );
      }

      const connectedResults = [];

      for (const acc of accounts) {
        // 2. Encrypt Page Access Token
        const encryptedToken = await encryptSecret(acc.pageAccessToken, masterKey);
        const tokenExpiresAt = Math.floor(Date.now() / 1000) + 60 * 24 * 60 * 60; // 60 days
        const accountId = createAccountId(crypto.randomUUID());

        await upsertConnectedAccount(env.DB, {
          id: accountId,
          userId: user.sub,
          instagramUserId: acc.instagramAccountId,
          username: acc.instagramUsername,
          profilePictureUrl: acc.profilePictureUrl,
          accessTokenEncrypted: encryptedToken,
          tokenExpiresAt,
        });

        connectedResults.push({
          id: accountId,
          instagramUserId: acc.instagramAccountId,
          username: acc.instagramUsername,
          profilePictureUrl: acc.profilePictureUrl,
        });
      }

      return jsonSuccess({ connectedAccounts: connectedResults });
    } catch (err: any) {
      return jsonError("OAUTH_FAILED", `Failed to link Instagram account: ${err.message}`, 500);
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

    const account = await getAccountById(env.DB, createAccountId(accountId));
    if (!account || !account.isActive) {
      return jsonError("ACCOUNT_NOT_FOUND", "Instagram account not found or inactive.", 404);
    }

    const masterKey = env.ENCRYPTION_MASTER_KEY || env.JWT_SECRET;
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
      return jsonError("GRAPH_API_ERROR", `Failed to fetch reels: ${err.message}`, 500);
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

    const automations = await getAutomationsForAccount(env.DB, createAccountId(accountId));
    return jsonSuccess({ automations });
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

    if (triggerKeywords.length === 0) {
      return jsonError(
        "MISSING_KEYWORDS",
        "At least one trigger keyword or '*' catch-all is required.",
        400
      );
    }

    // MANDATORY INSTAGRAM ANTI-SPAM RULE: Validate 3 to 8 reply variations
    const replyValidation = validateReplyVariations(commentReplies, 3, 8);
    if (!replyValidation.isValid) {
      return jsonError(
        "SPAM_PROTECTION_VIOLATION",
        replyValidation.error || "A minimum of 3 unique comment reply variations is required to prevent Instagram spam flags.",
        400,
        { totalVariations: replyValidation.totalVariations }
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
    if (!Array.isArray(templateCard.buttons) || templateCard.buttons.length === 0) {
      return jsonError(
        "MISSING_BUTTONS",
        "At least 1 button (max 3) is required for the Generic Template card.",
        400
      );
    }
    if (templateCard.buttons.length > 3) {
      return jsonError("TOO_MANY_BUTTONS", "Maximum allowed buttons per card is 3.", 400);
    }

    const automationId = body?.id || createAutomationId(crypto.randomUUID());

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
    });

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

    const deleted = await deleteReelAutomation(env.DB, automationId, accountId);
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

    const exportRows = await getAllCapturedLeadsForExport(env.DB, createAccountId(accountId));

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

    const search = url.searchParams.get("search") || undefined;
    const limit = Number(url.searchParams.get("limit") || 50);
    const offset = Number(url.searchParams.get("offset") || 0);

    const result = await getCapturedLeads(env.DB, createAccountId(accountId), {
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

    const telemetry = await getAnalyticsSummary(env.DB, createAccountId(accountId));
    return jsonSuccess({ telemetry });
  }

  return jsonError("NOT_FOUND", `Endpoint ${method} ${path} not found.`, 404);
}
