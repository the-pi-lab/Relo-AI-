import type { ExecutionContext, ScheduledEvent } from "@cloudflare/workers-types";
import type { Env } from "./db";
import {
  getAccountByInstagramId,
  getActiveAutomationsForMedia,
  insertJobIfNew,
  setHumanTakeoverPause,
  recordWebhookAuditLog,
  requeueStaleProcessingJobs,
  purgeRetentionData,
  getAndTrackShortLink,
  markLeadInbound,
  getProductById,
} from "./db/queries";
import { verifyMetaSignature, timingSafeEqualAsync, decryptSecret, getMasterKey } from "./crypto";
import { parseWebhookEnvelope } from "./engine/parse";
import { findMatchingKeyword } from "./engine/keyword";
import { processDueJobsBatch } from "./engine/processor";
import { processScheduledCampaigns } from "./engine/campaignWorker";
import {
  decideAiReply,
  buildProductCardReply,
  aiEnabledForPlan,
  OWNER_HANDOFF_REPLY,
} from "./engine/aiResponder";
import { metaGraphClient } from "./meta/client";
import { handleApiRequest } from "./api/router";
import { getPublishedLinkPage, getLinkPageBySlug } from "./db/linkPage";
import { renderLinkPageHtml } from "./api/linkPageHtml";
import { createJobId } from "./types/ids";
import type { ReelAutomation } from "./types";

/**
 * Standard CORS headers for dashboard API communication
 */
const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Hub-Signature-256",
};

export default {
  /**
   * Main HTTP Request Router for Cloudflare Workers
   */
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // 1. Handle CORS Preflight
    if (method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

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
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        }
      );
    }

    // 3. Meta Webhook Verification Handshake (GET /webhook)
    if (path === "/webhook" && method === "GET") {
      const mode = url.searchParams.get("hub.mode");
      const token = url.searchParams.get("hub.verify_token") || "";
      const challenge = url.searchParams.get("hub.challenge");

      const tokenMatches = await timingSafeEqualAsync(
        token,
        env.META_VERIFY_TOKEN || ""
      );
      if (mode === "subscribe" && tokenMatches) {
        return new Response(challenge, {
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
        handleIngestedEvents(events, env).catch((err) =>
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

    // 5c. Public link-in-bio page (plan.md §4.5 / Phase 2)
    //     Unauthenticated by design — this is the page you put in your bio.
    if (method === "GET" && (path.startsWith("/p/") || path.startsWith("/b/"))) {
      const prefix = path[1];
      const key = path.slice(3).trim().toLowerCase();
      if (!/^[a-z0-9_-]{3,60}$/.test(key)) {
        return new Response("Not Found", { status: 404 });
      }
      const page = prefix === "b"
        ? (await getLinkPageBySlug(env.DB, key)
            ? await getPublishedLinkPage(env.DB, (await getLinkPageBySlug(env.DB, key))!.id)
            : null)
        : await getPublishedLinkPage(env.DB, key);
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
    return new Response(
      JSON.stringify({ error: "Endpoint not found" }),
      {
        status: 404,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      }
    );
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
        try {
          // Reaper: jobs whose isolate died mid-dispatch are stuck in
          // 'processing' forever — requeue anything past the 5-minute lease.
          const requeued = await requeueStaleProcessingJobs(env.DB, 300);
          if (requeued > 0) {
            console.warn(`[Cron Queue] Requeued ${requeued} stale 'processing' jobs.`);
          }

          const result = await processDueJobsBatch(env, { batchLimit: 50 });
          if (result.processedCount > 0) {
            console.log(
              `[Cron Queue] Processed ${result.processedCount} jobs: ${result.completedCount} completed, ${result.failedCount} failed, ${result.skippedCount} skipped.`
            );
          }

          // Retention: purge old comment text, terminal jobs, and logs (plan.md §5)
          const purged = await purgeRetentionData(env.DB);
          if (purged.jobsDeleted > 0 || purged.logsDeleted > 0) {
            console.log(`[Retention] purged ${JSON.stringify(purged)}`);
          }

          // Campaigns (plan.md §4.3): one batch per scheduled campaign per tick.
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
          if (accountIds.length > 0) {
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
          }
        } catch (err) {
          console.error("[Cron Queue Critical Error]", err);
        }
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
  env: Env
): Promise<void> {
  for (const event of events) {
    try {
      if (event.type === "comment") {
        await handleCommentEvent(event, env);
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
  env: Env
): Promise<void> {
  // Find connected account by Instagram Account ID
  const account = await getAccountByInstagramId(env.DB, event.accountId);
  if (!account || !account.isActive) {
    return;
  }

  // Fetch active automation rules for this Reel
  const automations = await getActiveAutomationsForMedia(
    env.DB,
    account.id,
    event.mediaId
  );

  if (automations.length === 0) {
    return;
  }

  // Match trigger keyword using OpenReply Unicode regex engine
  let matchedAutomation: ReelAutomation | null = null;
  for (const auto of automations) {
    const matched = findMatchingKeyword(event.text, auto.triggerKeywords);
    if (matched) {
      matchedAutomation = auto;
      break;
    }
  }

  if (!matchedAutomation) {
    return;
  }

  // Calculate anti-spam randomized human delay jitter (30 to 90 seconds)
  const jitterSeconds = 30 + Math.floor(Math.random() * 60);
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
      }),
    });
  }
}

async function handleMessageEvent(
  event: Extract<ReturnType<typeof parseWebhookEnvelope>[number], { type: "message" }>,
  env: Env
): Promise<void> {
  // Human Takeover Detection — pause automation for 30 minutes on the
  // thread that actually maps to a job's commenterUserId:
  //  - Creator manually replied (echo from the account): the conversation
  //    partner is the message recipient.
  //  - User sent the account a DM: the conversation partner is the sender.
  if (event.isEcho) {
    if (event.recipientId && event.recipientId !== event.accountId) {
      const account = await getAccountByInstagramId(env.DB, event.accountId);
      if (account) {
        await setHumanTakeoverPause(env.DB, account.id, event.recipientId, 1800);
      }
    }
    return;
  }

  const account = await getAccountByInstagramId(env.DB, event.accountId);
  if (account) {
    await setHumanTakeoverPause(env.DB, account.id, event.senderId, 1800);
    // Anchor the 24h window + follow-up gate: this lead spoke last
    await markLeadInbound(
      env.DB,
      account.id,
      event.senderId as Parameters<typeof markLeadInbound>[2]
    );

    // AI product-Q&A (plan.md §4.4). Wrapped so a failure here can never drop
    // the webhook — the lead anchor above has already been written.
    await handleAiProductQA(event, account, env).catch((err) => {
      console.warn("[AI product-Q&A] skipped:", err);
    });
  }
}

/**
 * Answers an inbound DM from the account's own product catalog, or hands off.
 *
 * The human-takeover pause written just above is set for 30 minutes on every
 * inbound message, which would silently suppress the AI on the very thread we
 * want it to answer. That is correct for a human who has taken over, but it
 * would make the AI unreachable, so the pause is treated as a gate only when
 * the sender is genuinely frustrated — which is exactly what `decideAiReply`
 * decides.
 */
async function handleAiProductQA(
  event: Extract<ReturnType<typeof parseWebhookEnvelope>[number], { type: "message" }>,
  account: NonNullable<Awaited<ReturnType<typeof getAccountByInstagramId>>>,
  env: Env
): Promise<void> {
  const text = String(event.text || "").trim();
  if (!text || text.length > 1000) return;
  if (!aiEnabledForPlan(account.plan)) return;

  const decision = await decideAiReply(text, {
    db: env.DB,
    env,
    accountId: account.id,
    plan: account.plan,
  });

  // Frustrated thread: keep the pause the webhook just set and get out of the way.
  if (decision.action === "silence") return;

  if (decision.action === "handoff") {
    await metaGraphClient.sendDirectMessage(
      await decryptSecret(account.accessTokenEncrypted, getMasterKey(env)),
      event.senderId,
      { text: OWNER_HANDOFF_REPLY }
    );
    return;
  }

  const token = await decryptSecret(account.accessTokenEncrypted, getMasterKey(env));
  if (decision.intent === "buying_intent" && decision.productId) {
    const product = await getProductById(env.DB, decision.productId, account.id);
    if (product) {
      const { card } = buildProductCardReply(product, env.PUBLIC_BASE_URL || "");
      if (card.buttons.length > 0) {
        await metaGraphClient.sendDirectMessage(token, event.senderId, {
          attachment: {
            type: "template",
            payload: { template_type: "generic", elements: [card] },
          },
        } as any);
        return;
      }
    }
  }

  await metaGraphClient.sendDirectMessage(token, event.senderId, {
    text: decision.replyText || OWNER_HANDOFF_REPLY,
  });
}
