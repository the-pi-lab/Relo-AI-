import type { ExecutionContext, ScheduledEvent } from "@cloudflare/workers-types";
import type { Env } from "./db";
import {
  getAccountByInstagramId,
  getActiveAutomationsForMedia,
  insertJobIfNew,
  setHumanTakeoverPause,
  recordWebhookAuditLog,
} from "./db/queries";
import { verifyMetaSignature } from "./crypto";
import { parseWebhookEnvelope } from "./engine/parse";
import { findMatchingKeyword } from "./engine/keyword";
import { processDueJobsBatch } from "./engine/processor";
import { handleApiRequest } from "./api/router";
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
      const token = url.searchParams.get("hub.verify_token");
      const challenge = url.searchParams.get("hub.challenge");

      if (mode === "subscribe" && token === env.META_VERIFY_TOKEN) {
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
        await recordWebhookAuditLog(env.DB, {
          eventType: "webhook_signature_failed",
          statusCode: 401,
          errorMessage: "Invalid X-Hub-Signature-256 header",
        });
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
      ctx.waitUntil(handleIngestedEvents(events, env));

      return new Response(
        JSON.stringify({ received: true, count: events.length }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
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
          const result = await processDueJobsBatch(env, { batchLimit: 50 });
          if (result.processedCount > 0) {
            console.log(
              `[Cron Queue] Processed ${result.processedCount} jobs: ${result.completedCount} completed, ${result.failedCount} failed, ${result.skippedCount} skipped.`
            );
          }
        } catch (err) {
          console.error("[Cron Queue Critical Error]", err);
        }
      })()
    );
  },
};

/**
 * Handles ingested webhook events and enqueues matching comments into D1
 */
async function handleIngestedEvents(
  events: ReturnType<typeof parseWebhookEnvelope>,
  env: Env
): Promise<void> {
  for (const event of events) {
    if (event.type === "comment") {
      // Find connected account by Instagram Account ID
      const account = await getAccountByInstagramId(env.DB, event.accountId);
      if (!account || !account.isActive) {
        continue;
      }

      // Fetch active automation rules for this Reel
      const automations = await getActiveAutomationsForMedia(
        env.DB,
        account.id,
        event.mediaId
      );

      if (automations.length === 0) {
        continue;
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
        continue;
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
    } else if (event.type === "message") {
      // Human Takeover Detection:
      // If a message was sent manually by the creator, pause automation for 30 minutes
      const account = await getAccountByInstagramId(env.DB, event.accountId);
      if (account) {
        await setHumanTakeoverPause(env.DB, account.id, event.recipientId, 1800);
      }
    }
  }
}
