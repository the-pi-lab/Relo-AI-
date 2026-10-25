import type { ExecutionContext, ScheduledEvent } from "@cloudflare/workers-types";
import type { Env } from "./db";
import {
  getAccountByInstagramId,
  getActiveAutomationsForMedia,
  getAutomationById,
  getAutomationsForAccount,
  insertJobIfNew,
  setHumanTakeoverPause,
  recordWebhookAuditLog,
  requeueStaleProcessingJobs,
  purgeRetentionData,
  getAndTrackShortLink,
  markLeadInbound,
  getProductById,
  claimInboundMessage,
  recordOutboundMessage,
  isOutboundMessage,
  isThreadPausedByHumanTakeover,
  getLastAiReplyAt,
  markAiReplySent,
  expireDuePlans,
  getJobIdByCommentId,
  recordCronHeartbeat,
} from "./db/queries";
import { verifyMetaSignature, timingSafeEqualAsync, decryptSecret, getMasterKey } from "./crypto";
import { parseWebhookEnvelope } from "./engine/parse";
import { findMatchingKeyword } from "./engine/keyword";
import {
  processDueJobsBatch,
  buildDeliveryCardPayload,
  buildFollowGatePayload,
} from "./engine/processor";
import { processScheduledCampaigns } from "./engine/campaignWorker";
import { refreshExpiringTokens } from "./engine/tokenRefresh";
import {
  decideAiReply,
  buildProductCardReply,
  aiEnabledForPlan,
  OWNER_HANDOFF_REPLY,
} from "./engine/aiResponder";
import { metaGraphClient, setMetaGraphVersion } from "./meta/client";
import { handleApiRequest } from "./api/router";
import { getPublishedLinkPage, getLinkPageBySlug, getAndTrackLinkBlock } from "./db/linkPage";
import { renderLinkPageHtml } from "./api/linkPageHtml";
import { createAutomationId, createJobId } from "./types/ids";
import type { ReelAutomation } from "./types";
import { preflightResponse, withCors } from "./security/cors";
import { assertTenantPolicies } from "./db/tenancy";

/**
 * Baseline security headers for every response the Worker emits.
 *
 * Static and always-on. The HTML link page needs the one concession of inline
 * styles (it renders its own CSS) and inline JSON-LD, so its CSP is built
 * separately in `securityHeadersFor`.
 */
const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
  "Cross-Origin-Resource-Policy": "same-origin",
  // HSTS only means anything over TLS, but sending it on an http:// response is
  // harmless and ensures the very next request is upgraded.
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
};

const HTML_CSP =
  "default-src 'none'; img-src 'self' https: data:; style-src 'unsafe-inline'; " +
  "script-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'";

/** Headers for a response, including a CSP when the body is HTML. */
function securityHeadersFor(contentType: string | null): Record<string, string> {
  const headers: Record<string, string> = { ...SECURITY_HEADERS };
  if (contentType && contentType.toLowerCase().includes("text/html")) {
    headers["Content-Security-Policy"] = HTML_CSP;
  } else {
    headers["Content-Security-Policy"] = "default-src 'none'; frame-ancestors 'none'";
  }
  return headers;
}

/** Adds the baseline headers without overwriting anything a handler set. */
function applySecurityHeaders(response: Response): Response {
  const headers = securityHeadersFor(response.headers.get("content-type"));
  for (const [key, value] of Object.entries(headers)) {
    if (!response.headers.has(key)) response.headers.set(key, value);
  }
  return response;
}

/**
 * Runs one cron stage in isolation.
 *
 * The minute cron used to share a single try/catch, so one failing stage (say,
 * a provider outage during token refresh) silently skipped every stage after it
 * — including campaign delivery and retention. Each stage now fails alone.
 */
async function runCronStage(name: string, fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
  } catch (error) {
    console.error(`[Cron:${name}] stage failed:`, error);
  }
}

export default {
  /**
   * Main HTTP Request Router for Cloudflare Workers.
   *
   * The wrapper owns HTTPS enforcement, CORS (allowlist only), security
   * headers and the tenancy self-check; `routeRequest` owns the route table.
   */
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    assertTenantPolicies();
    setMetaGraphVersion(env.META_GRAPH_API_VERSION);

    const url = new URL(request.url);

    // 0. HTTPS everywhere. Cloudflare terminates TLS, so the scheme is read
    //    from the forwarded header. Only enforced in production, so local
    //    `wrangler dev` over http keeps working.
    const forwardedProto = (request.headers.get("x-forwarded-proto") || url.protocol.replace(":", "")).toLowerCase();
    if (env.ENVIRONMENT === "production" && forwardedProto !== "https") {
      const httpsUrl = new URL(request.url);
      httpsUrl.protocol = "https:";
      httpsUrl.port = "";
      return new Response(null, {
        status: 308,
        headers: {
          Location: httpsUrl.toString(),
          ...securityHeadersFor("application/json"),
        },
      });
    }

    if (request.method === "OPTIONS") {
      return preflightResponse(request, env);
    }

    let response: Response;
    try {
      response = await this.route(request, env, ctx, url);
    } catch (err) {
      /* Anything a handler throws lands here. Without this catch the runtime
         returns a bare 500 with no CORS headers, so the dashboard can only say
         "network error" and never shows the real code. */
      console.error("[Unhandled route error]", request.method, url.pathname, err);
      response = new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "INTERNAL_ERROR",
            message: "The Worker could not handle this request. Try again.",
          },
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
    return withCors(applySecurityHeaders(response), request, env);
  },

  /**
   * The route table. Reached only through `fetch`, which has already enforced
   * HTTPS and will apply the allowlisted CORS policy and security headers to
   * whatever this returns.
   */
  async route(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
    url: URL
  ): Promise<Response> {
    const path = url.pathname;
    const method = request.method;

    // 2. Health Check
    if (path === "/" || path === "/health") {
      return new Response(
        JSON.stringify({
          status: "healthy",
          service: "relo-engine",
          environment: env.ENVIRONMENT || "production",
          timestamp: new Date().toISOString(),
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 3. Meta Webhook Verification Handshake (GET /webhook)
    if (path === "/webhook" && method === "GET") {
      const mode = url.searchParams.get("hub.mode");
      const token = url.searchParams.get("hub.verify_token") || "";
      const challenge = url.searchParams.get("hub.challenge");

      // Fail closed: an unset verify token must never match an empty query
      // parameter, otherwise anyone can complete the handshake.
      const configuredToken = env.META_VERIFY_TOKEN || "";
      const tokenMatches =
        configuredToken.length > 0 && (await timingSafeEqualAsync(token, configuredToken));
      if (mode === "subscribe" && tokenMatches) {
        return new Response(challenge ?? "", {
          status: 200,
          headers: { "Content-Type": "text/plain" },
        });
      }

      return new Response("Forbidden: Invalid verification token", { status: 403 });
    }

    // 4. Meta Webhook Ingestion (<15ms response) (POST /webhook)
    if (path === "/webhook" && method === "POST") {
      const signatureHeader = request.headers.get("x-hub-signature-256");
      const rawBody = await request.text();

      // Verify HMAC-SHA256 signature
      const isSignatureValid = await verifyMetaSignature(
        rawBody,
        signatureHeader,
        env.META_APP_SECRET
      );

      if (!isSignatureValid) {
        console.error("[Webhook Error] Invalid HMAC-SHA256 signature.");
        // Audit off the hot path — a slow D1 write must not turn a 401 into a 500
        ctx.waitUntil(
          recordWebhookAuditLog(env.DB, {
            eventType: "webhook_signature_failed",
            statusCode: 401,
            errorMessage: "Invalid X-Hub-Signature-256 header",
          }).catch((err) => console.error("[Webhook Audit Error]", err))
        );
        return new Response("Unauthorized: Invalid signature", { status: 401 });
      }

      let payload: unknown;
      try {
        payload = JSON.parse(rawBody);
      } catch {
        return new Response("Bad Request: Malformed JSON", { status: 400 });
      }

      // Early filter & parse through OpenReply engine
      const events = parseWebhookEnvelope(payload);

      // Process parsed events asynchronously so Meta receives instant 200 OK
      ctx.waitUntil(
        handleIngestedEvents(events, env, ctx).catch((err) =>
          console.error("[Webhook Ingestion Error]", err)
        )
      );

      return new Response(
        JSON.stringify({ received: true, count: events.length }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 5a. Short-link click redirect (Sent → Clicked tracking)
    if (method === "GET" && path.startsWith("/l/")) {
      const linkId = path.slice(3).trim();
      if (!/^[A-Za-z0-9-]{8,40}$/.test(linkId)) {
        return new Response("Not Found", { status: 404 });
      }
      const link = await getAndTrackShortLink(env.DB, linkId);
      if (!link) return new Response("Not Found", { status: 404 });
      return new Response(null, {
        status: 302,
        headers: { Location: link.targetUrl, "Cache-Control": "no-store" },
      });
    }

    // 5b. RELO branding button redirect (free-tier viral loop)
    if (method === "GET" && path.startsWith("/r/")) {
      const accountId = path.slice(3).trim();
      if (!/^[A-Za-z0-9-]{8,40}$/.test(accountId)) {
        return new Response("Not Found", { status: 404 });
      }
      const appUrl = (env.PUBLIC_APP_URL || "https://relo.ai").replace(/\/$/, "");
      return new Response(null, {
        status: 302,
        headers: { Location: `${appUrl}/?ref=${accountId}`, "Cache-Control": "no-store" },
      });
    }

    // 5d. Link-in-bio block click redirect (counts the tap, then forwards)
    if (method === "GET" && path.startsWith("/c/")) {
      const blockId = path.slice(3).trim();
      if (!/^[A-Za-z0-9-]{8,64}$/.test(blockId)) {
        return new Response("Not Found", { status: 404 });
      }
      const block = await getAndTrackLinkBlock(env.DB, blockId);
      if (!block) return new Response("Not Found", { status: 404 });
      return new Response(null, {
        status: 302,
        headers: { Location: block.targetUrl, "Cache-Control": "no-store" },
      });
    }

    // 5c. Public link-in-bio page (plan.md §4.5 / Phase 2)
    //     Unauthenticated by design — this is the page you put in your bio.
    if (method === "GET" && (path.startsWith("/p/") || path.startsWith("/b/"))) {
      const prefix = path[1];
      const key = path.slice(3).trim().toLowerCase();
      if (!/^[a-z0-9_-]{3,60}$/.test(key)) {
        return new Response("Not Found", { status: 404 });
      }
      let page: Awaited<ReturnType<typeof getPublishedLinkPage>> = null;
      if (prefix === "b") {
        const bySlug = await getLinkPageBySlug(env.DB, key);
        page = bySlug ? await getPublishedLinkPage(env.DB, bySlug.id) : null;
      } else {
        page = await getPublishedLinkPage(env.DB, key);
      }
      if (!page) return new Response("Not Found", { status: 404 });

      const origin = new URL(request.url).origin;
      const html = renderLinkPageHtml(page, origin);
      return new Response(html, {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "public, max-age=60",
        },
      });
    }

    // 5. REST API Layer (/api/*)
    if (path.startsWith("/api/")) {
      return handleApiRequest(request, env);
    }

    // 6. Fallback for unhandled routes
    return new Response(JSON.stringify({ error: "Endpoint not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  },

  /**
   * 1-Minute Scheduled Cron Handler (Cron-as-Queue Engine)
   */
  async scheduled(
    event: ScheduledEvent,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void> {
    ctx.waitUntil(
      (async () => {
        setMetaGraphVersion(env.META_GRAPH_API_VERSION);

        // Heartbeat first: it is the only signal that distinguishes "the cron
        // trigger is not deployed" from "everything is broken".
        await runCronStage("heartbeat", async () => {
          await recordCronHeartbeat(env.DB);
        });

        // Reaper: jobs whose isolate died mid-dispatch are stuck in
        // 'processing' forever — requeue anything past the 5-minute lease.
        await runCronStage("requeue", async () => {
          const requeued = await requeueStaleProcessingJobs(env.DB, 300);
          if (requeued > 0) {
            console.warn(`[Cron Queue] Requeued ${requeued} stale 'processing' jobs.`);
          }
        });

        await runCronStage("jobs", async () => {
          const result = await processDueJobsBatch(env, { batchLimit: 50 });
          if (result.processedCount > 0) {
            console.log(
              `[Cron Queue] Processed ${result.processedCount} jobs: ${result.completedCount} completed, ${result.failedCount} failed, ${result.skippedCount} skipped.`
            );
          }
        });

        // Token upkeep: long-lived tokens last ~60 days and nothing else in
        // the request path renews them, so expiring accounts are refreshed
        // here (best effort — a rejected grant is surfaced as "reconnect
        // needed" in Settings rather than retried in a loop).
        await runCronStage("tokens", async () => {
          const refreshed = await refreshExpiringTokens(env, { limit: 10 });
          if (refreshed.refreshed > 0 || refreshed.failed > 0) {
            console.log(
              `[Token Refresh] scanned ${refreshed.scanned}, renewed ${refreshed.refreshed}, failed ${refreshed.failed}.`
            );
          }
        });

        // Retention: purge old comment text, terminal jobs, and logs (plan.md §5)
        await runCronStage("retention", async () => {
          const purged = await purgeRetentionData(env.DB);
          if (purged.jobsDeleted > 0 || purged.logsDeleted > 0) {
            console.log(`[Retention] purged ${JSON.stringify(purged)}`);
          }
        });

        // Billing: a paid plan that lapsed goes back to Free. `plan_expires_at
        // = 0` is grandfathered and is never touched. This stage is isolated
        // so a pre-migration database cannot block campaign delivery.
        await runCronStage("plans", async () => {
          const expired = await expireDuePlans(env.DB, 100);
          if (expired > 0) {
            console.log(`[Billing] downgraded ${expired} lapsed plan(s).`);
          }
        });

        // Campaigns (plan.md §4.3): one batch per scheduled campaign per tick.
        await runCronStage("campaigns", async () => {
          const accountsWithCampaigns = (await env.DB
            .prepare(
              `SELECT DISTINCT account_id FROM campaigns
               WHERE status IN ('scheduled','sending')
                 AND (scheduled_at <= unixepoch() OR status = 'sending')`
            )
            .all()) as { results?: Array<{ account_id: string }> };
          const accountIds = (accountsWithCampaigns.results || []).map(
            (r) => r.account_id
          );
          if (accountIds.length === 0) return;

          const sent = await processScheduledCampaigns(env, {
            accounts: accountIds.map((accountId) => ({ accountId })),
          });
          for (const s of sent) {
            if (s.sent > 0 || s.failed > 0) {
              console.log(
                `[Campaigns] ${s.campaignId}: ${s.sent} sent, ${s.failed} failed.`
              );
            }
          }
        });
      })()
    );
  },
};

/**
 * Handles ingested webhook events and enqueues matching comments into D1.
 * Each event is isolated: one failure must never drop the rest of the batch.
 */
async function handleIngestedEvents(
  events: ReturnType<typeof parseWebhookEnvelope>,
  env: Env,
  ctx?: ExecutionContext
): Promise<void> {
  for (const event of events) {
    try {
      if (event.type === "comment") {
        await handleCommentEvent(event, env, ctx);
      } else if (event.type === "message") {
        await handleMessageEvent(event, env);
      }
    } catch (err) {
      console.error(`[Webhook Event Error] ${event.type} event failed:`, err);
      await recordWebhookAuditLog(env.DB, {
        eventType: "webhook_event_failed",
        statusCode: 500,
        errorMessage: err instanceof Error ? err.message : String(err),
      }).catch(() => undefined);
    }
  }
}

async function handleCommentEvent(
  event: Extract<ReturnType<typeof parseWebhookEnvelope>[number], { type: "comment" }>,
  env: Env,
  ctx?: ExecutionContext
): Promise<void> {
  // Every early return below writes one audit row. Without this a comment that
  // arrived but did not fire left *no* trace anywhere (webhook_logs stayed
  // empty), which is why "auth works, connect works, automation silent" was
  // undebuggable from the outside. Rows are purged by the 7-day retention job.
  const audit = (
    eventType: string,
    payload: Record<string, unknown> = {},
    accountId?: string
  ) =>
    recordWebhookAuditLog(env.DB, {
      accountId: accountId as any,
      eventType,
      statusCode: 200,
      payload: JSON.stringify({
        commentId: event.commentId,
        mediaId: event.mediaId,
        instagramAccountId: event.accountId,
        ...payload,
      }),
    }).catch((err) => console.error("[Webhook Audit Error]", err));

  // Find connected account by Instagram Account ID
  const account = await getAccountByInstagramId(env.DB, event.accountId);
  if (!account) {
    await audit("comment_no_account");
    return;
  }
  if (!account.isActive) {
    await audit("comment_account_inactive", {}, account.id);
    return;
  }

  // Fetch active automation rules for this Reel
  const automations = await getActiveAutomationsForMedia(
    env.DB,
    account.id,
    event.mediaId
  );

  if (automations.length === 0) {
    await audit("comment_no_automation_for_media", {}, account.id);
    return;
  }

  // Match trigger keyword using the Unicode whole-word engine
  let matchedAutomation: ReelAutomation | null = null;
  for (const auto of automations) {
    const matched = findMatchingKeyword(event.text, auto.triggerKeywords);
    if (matched) {
      matchedAutomation = auto;
      break;
    }
  }

  if (!matchedAutomation) {
    await audit(
      "comment_no_keyword_match",
      { automationsForMedia: automations.length, text: event.text.slice(0, 120) },
      account.id
    );
    return;
  }

  // Calculate anti-spam randomized human delay jitter (10 to 25 seconds in production, 30 to 90 seconds in test)
  const isTest = env.ENVIRONMENT === "test";
  const jitterSeconds = isTest
    ? 30 + Math.floor(Math.random() * 60)
    : 10 + Math.floor(Math.random() * 15); // 10 to 24s for rapid looping response
  const sendAt = Math.floor(Date.now() / 1000) + jitterSeconds;

  // Insert into D1 jobs queue with atomic deduplication on comment_id
  const inserted = await insertJobIfNew(env.DB, {
    id: createJobId(crypto.randomUUID()),
    accountId: account.id,
    commentId: event.commentId,
    commenterUserId: event.commenterId,
    commenterUsername: event.commenterUsername,
    commentText: event.text,
    postId: event.mediaId,
    matchedAutomationId: matchedAutomation.id,
    sendAt,
  });

  if (inserted) {
    await recordWebhookAuditLog(env.DB, {
      accountId: account.id,
      eventType: "comment_enqueued",
      statusCode: 200,
      payload: JSON.stringify({
        commentId: event.commentId,
        sendAt,
        jitterSeconds,
        mediaId: event.mediaId,
        automationId: matchedAutomation.id,
      }),
    });

    // Fast-dispatch in background: don't wait for 1-minute cron tick!
    // Sleep for the safe 10-25s human jitter, then immediately trigger batch processor.
    if (!isTest && ctx?.waitUntil) {
      ctx.waitUntil(
        (async () => {
          try {
            await new Promise((resolve) => setTimeout(resolve, jitterSeconds * 1000 + 500));
            const result = await processDueJobsBatch(env, { batchLimit: 10 });
            if (result.processedCount > 0) {
              console.log(
                `[Fast Dispatch] Processed ${result.processedCount} jobs (${result.completedCount} completed, ${result.failedCount} failed).`
              );
            }
          } catch (fastErr) {
            console.error("[Fast Dispatch Error]", fastErr);
          }
        })()
      );
    }
    return;
  }

  // `INSERT OR IGNORE` returns "no change" for a dedupe hit *and* for any
  // constraint violation, which made a silently rejected insert look exactly
  // like "already handled". Ask the database which one it was.
  const existingJobId = await getJobIdByCommentId(env.DB, event.commentId);
  if (existingJobId) {
    await audit("comment_duplicate", { jobId: existingJobId }, account.id);
    return;
  }
  console.error(
    `[Webhook] Job insert for comment ${event.commentId} was rejected by the database.`
  );
  await audit("comment_insert_failed", { automationId: matchedAutomation.id }, account.id);
}

/**
 * Minimum gap between two AI replies on the same thread.
 *
 * A lead who sends "hi", "is this available", and "how much" in one burst is
 * one conversation, not three. The clock is per (account, thread), so unrelated
 * conversations are never throttled by each other.
 */
const AI_REPLY_COOLDOWN_SECONDS = 120;

async function handleMessageEvent(
  event: Extract<ReturnType<typeof parseWebhookEnvelope>[number], { type: "message" }>,
  env: Env
): Promise<void> {
  const account = await getAccountByInstagramId(env.DB, event.accountId);
  if (!account) {
    // Same blind spot as comments: a DM for an account id we cannot resolve
    // used to disappear without a trace. Record it off the hot path.
    await recordWebhookAuditLog(env.DB, {
      eventType: "message_no_account",
      statusCode: 200,
      payload: JSON.stringify({
        instagramAccountId: event.accountId,
        mid: event.mid,
        senderId: event.senderId,
      }),
    }).catch((err) => console.error("[Webhook Audit Error]", err));
    return;
  }

  // Human Takeover Detection.
  //
  // An `is_echo` message is ambiguous: it is either our own outbound DM coming
  // back through the webhook, or the creator replying by hand. Only the second
  // is a takeover signal. `message_mids` is what tells them apart — every DM we
  // send records its mid, so an echo that we did not send is genuinely human.
  if (event.isEcho) {
    if (!event.recipientId || event.recipientId === event.accountId) return;

    if (await isOutboundMessage(env.DB, event.mid)) {
      return; // our own message, not a human takeover
    }

    // Record the human reply too, so a redelivered echo cannot re-pause.
    await recordOutboundMessage(env.DB, account.id, event.recipientId, event.mid);
    await setHumanTakeoverPause(env.DB, account.id, event.recipientId, 1800);
    return;
  }

  // Meta retries webhooks. The mid ledger makes inbound processing
  // exactly-once, so one DM cannot produce two AI replies.
  if (event.mid) {
    const firstDelivery = await claimInboundMessage(
      env.DB,
      account.id,
      event.senderId,
      event.mid
    );
    if (!firstDelivery) return;
  }

  // An inbound DM is NOT a takeover: the lead talking to us is the normal
  // case. Setting a pause here used to suppress the very reply we wanted to
  // send (and blocked the job queue on that thread for 30 minutes).
  await markLeadInbound(
    env.DB,
    account.id,
    event.senderId as Parameters<typeof markLeadInbound>[2]
  );

  // 1. Funnel Actions (Opt-in button tap & Follow-Gate confirmation tap)
  const quickReplyPayload = event.quickReplyPayload || "";
  const rawText = (event.text || "").trim();

  // Funnel: User tapped the Opt-in CTA button (Step 1 -> Step 2 or Step 3)
  if (
    quickReplyPayload.startsWith("RELO_OPTIN:") ||
    rawText.toLowerCase() === "send me the access"
  ) {
    const rawAutoId = quickReplyPayload.replace("RELO_OPTIN:", "").trim();
    const handled = await handleFunnelOptIn(event, account, rawAutoId, env).catch((err) => {
      console.warn("[Funnel Opt-In] skipped:", err);
      return false;
    });
    if (handled) return;
  }

  // Funnel: User confirmed they followed (Step 2 -> Step 3)
  if (
    quickReplyPayload.startsWith("RELO_FOLLOWED:") ||
    rawText.includes("I'm following") ||
    rawText.toLowerCase() === "following"
  ) {
    const rawAutoId = quickReplyPayload.replace("RELO_FOLLOWED:", "").trim();
    const handled = await handleFunnelFollowed(event, account, rawAutoId, env).catch((err) => {
      console.warn("[Funnel Followed] skipped:", err);
      return false;
    });
    if (handled) return;
  }

  // AI product-Q&A (plan.md §4.4). Wrapped so a failure here can never drop
  // the webhook — the lead anchor above has already been written.
  await handleAiProductQA(event, account, env).catch((err) => {
    console.warn("[AI product-Q&A] skipped:", err);
  });
}

/**
 * Handles viewer tapping the Opt-in button in DM ("Send me the access").
 * If Follow-Gate is enabled, sends the Follow-Gate card with creator profile link.
 * If Follow-Gate is disabled, sends the Final Delivery Card directly.
 */
async function handleFunnelOptIn(
  event: Extract<ReturnType<typeof parseWebhookEnvelope>[number], { type: "message" }>,
  account: NonNullable<Awaited<ReturnType<typeof getAccountByInstagramId>>>,
  rawAutoId: string,
  env: Env
): Promise<boolean> {
  let automation: ReelAutomation | null = null;
  if (rawAutoId) {
    automation = await getAutomationById(env.DB, createAutomationId(rawAutoId));
  }
  if (!automation) {
    const automations = await getAutomationsForAccount(env.DB, account.id);
    automation = automations.find((a) => a.isActive) || null;
  }
  if (!automation || !automation.isActive) return false;

  const token = await decryptSecret(account.accessTokenEncrypted, getMasterKey(env));

  if (automation.followGateEnabled) {
    // Send Follow-Gate Card (Funnel Step 2)
    const followGatePayload = buildFollowGatePayload(account, automation, { id: event.senderId });
    const res = await metaGraphClient.sendDirectMessage(
      token,
      event.senderId,
      followGatePayload.message as any
    );
    if (res?.message_id) {
      await recordOutboundMessage(env.DB, account.id, event.senderId, res.message_id);
    }
    return true;
  }

  // Follow-gate is disabled: Deliver the resource card directly (Funnel Step 3)
  const deliveryPayload = await buildDeliveryCardPayload(
    env,
    account,
    automation,
    { id: event.senderId }
  );
  const res = await metaGraphClient.sendDirectMessage(
    token,
    event.senderId,
    deliveryPayload.message as any
  );
  if (res?.message_id) {
    await recordOutboundMessage(env.DB, account.id, event.senderId, res.message_id);
  }
  return true;
}

/**
 * Handles viewer tapping "I'm following ✅" on the Follow-Gate card.
 * Directly delivers the final resource card with the 1-3 links.
 */
async function handleFunnelFollowed(
  event: Extract<ReturnType<typeof parseWebhookEnvelope>[number], { type: "message" }>,
  account: NonNullable<Awaited<ReturnType<typeof getAccountByInstagramId>>>,
  rawAutoId: string,
  env: Env
): Promise<boolean> {
  let automation: ReelAutomation | null = null;
  if (rawAutoId) {
    automation = await getAutomationById(env.DB, createAutomationId(rawAutoId));
  }
  if (!automation) {
    const automations = await getAutomationsForAccount(env.DB, account.id);
    automation = automations.find((a) => a.isActive) || null;
  }
  if (!automation || !automation.isActive) return false;

  const token = await decryptSecret(account.accessTokenEncrypted, getMasterKey(env));

  // Send Final Delivery Card (Funnel Step 3)
  const deliveryPayload = await buildDeliveryCardPayload(
    env,
    account,
    automation,
    { id: event.senderId }
  );
  const res = await metaGraphClient.sendDirectMessage(
    token,
    event.senderId,
    deliveryPayload.message as any
  );
  if (res?.message_id) {
    await recordOutboundMessage(env.DB, account.id, event.senderId, res.message_id);
  }
  return true;
}

/**
 * Answers an inbound DM from the account's own product catalog, or hands off.
 *
 * Two gates sit in front of the model:
 *   - an active human takeover (the creator is handling this thread), and
 *   - the per-thread cooldown, so a burst of messages gets one answer.
 *
 * Every message it sends is recorded in `message_mids`, which is what keeps the
 * webhook echo from looking like a human takeover later.
 */
async function handleAiProductQA(
  event: Extract<ReturnType<typeof parseWebhookEnvelope>[number], { type: "message" }>,
  account: NonNullable<Awaited<ReturnType<typeof getAccountByInstagramId>>>,
  env: Env
): Promise<void> {
  const text = String(event.text || "").trim();
  if (!text || text.length > 1000) return;
  if (!aiEnabledForPlan(account.plan)) return;

  if (await isThreadPausedByHumanTakeover(env.DB, account.id, event.senderId)) return;

  const lastAiReplyAt = await getLastAiReplyAt(env.DB, account.id, event.senderId);
  const now = Math.floor(Date.now() / 1000);
  if (lastAiReplyAt > 0 && now - lastAiReplyAt < AI_REPLY_COOLDOWN_SECONDS) return;

  const decision = await decideAiReply(text, {
    db: env.DB,
    env,
    accountId: account.id,
    plan: account.plan,
  });

  // Frustrated thread: stay out of the way for 30 minutes and let a human take
  // it. This is the one place the AI itself sets the takeover pause — inbound
  // DMs no longer pause the thread, so the intent has to be honoured here.
  if (decision.action === "silence") {
    if (decision.reason === "frustrated_thread") {
      await setHumanTakeoverPause(env.DB, account.id, event.senderId, 1800);
    }
    return;
  }

  const token = await decryptSecret(account.accessTokenEncrypted, getMasterKey(env));

  const deliver = async (payload: { text?: string; attachment?: unknown }) => {
    const res = await metaGraphClient.sendDirectMessage(token, event.senderId, payload);
    await recordOutboundMessage(env.DB, account.id, event.senderId, res.message_id);
    await markAiReplySent(env.DB, account.id, event.senderId);
  };

  if (decision.action === "handoff") {
    await deliver({ text: OWNER_HANDOFF_REPLY });
    return;
  }

  if (decision.intent === "buying_intent" && decision.productId) {
    const product = await getProductById(env.DB, decision.productId, account.id);
    if (product) {
      const { card } = buildProductCardReply(product, env.PUBLIC_BASE_URL || "");
      if (card.buttons.length > 0) {
        await deliver({
          attachment: {
            type: "template",
            payload: { template_type: "generic", elements: [card] },
          },
        });
        return;
      }
    }
  }

  await deliver({ text: decision.replyText || OWNER_HANDOFF_REPLY });
}
