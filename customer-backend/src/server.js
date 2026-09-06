// HTTP API: health, Instagram webhooks, config push, status.
// Webhook request path is deliberately cheap: verify → parse/filter →
// dedupe (UNIQUE insert) → match in cached flows → enqueue only on match →
// 200. Non-matching traffic costs zero Postgres writes (in-memory counters).
import express from "express";
import { query } from "./db.js";
import { parseCommentEvents, parseMessageEvents } from "./parse.js";
import { matchKeywords } from "./keyword.js";
import {
  requireBackendAuth,
  verifyWebhookSignature,
  timingSafeEqualStr,
  protectSecret,
} from "./crypto.js";
import { getActiveFlows, invalidateFlowCache } from "./flows.js";
import { enqueueJob } from "./queue.js";
import { aiStatus } from "./ai/index.js";
import { stats, uptimeSec } from "./stats.js";

const ACCOUNT_CACHE_TTL_MS = 30_000;
let accountCache = { at: 0, accounts: [] };

async function getAccounts() {
  if (Date.now() - accountCache.at > ACCOUNT_CACHE_TTL_MS) {
    const { rows } = await query(
      "SELECT instagram_id, username, is_active FROM ig_accounts WHERE is_active = TRUE"
    );
    accountCache = { at: Date.now(), accounts: rows };
  }
  return accountCache.accounts;
}

function invalidateAccountCache() {
  accountCache.at = 0;
}

/**
 * Public CORS for safe GET endpoints only (/health, /api/status).
 * Lets the Chat Flow AI dashboard (any origin) read operational status
 * directly from the browser. Both endpoints are secret-free by design, so a
 * wildcard origin exposes nothing sensitive. POST routes are never called
 * from browsers (config push is proxied server-to-server) and get no CORS.
 */
function publicCors(req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(204).end();
  next();
}

export function createApp(config) {
  const app = express();
  app.disable("x-powered-by");
  app.use(["/health", "/api/status"], publicCors);

  // --- Instagram webhook ingress (raw body for HMAC) ---
  // Registered BEFORE express.json(): this path must see exact bytes.
  app.post(
    "/webhooks/instagram",
    express.raw({ type: "application/json", limit: "1mb" }),
    async (req, res) => {
      stats.webhooksReceived += 1;
      const rawBody = req.body ? req.body.toString("utf8") : "";
      const signature = req.headers["x-hub-signature-256"];

      if (!verifyWebhookSignature(rawBody, signature, config.metaSecrets)) {
        stats.webhooksRejected += 1;
        return res.status(401).json({ ok: false, error: "Invalid signature" });
      }

      let payload = null;
      try {
        payload = rawBody ? JSON.parse(rawBody) : null;
      } catch {
        return res.status(400).json({ ok: false, error: "Invalid JSON" });
      }

      try {
        await handleWebhookPayload(payload);
      } catch (err) {
        console.error("[webhook] handling failed:", err.message);
      }
      return res.status(200).json({ ok: true });
    }
  );

  app.get("/webhooks/instagram", (req, res) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];
    if (
      mode === "subscribe" &&
      typeof token === "string" &&
      timingSafeEqualStr(token, config.webhookVerifyToken)
    ) {
      return res.status(200).send(challenge ?? "");
    }
    return res.status(403).send("Forbidden");
  });

  app.use(express.json({ limit: "1mb" }));

  // --- Health (for UptimeRobot / provider checks; no secrets, no auth) ---
  app.get("/health", async (req, res) => {
    let db = "up";
    try {
      await query("SELECT 1");
    } catch {
      db = "down";
    }
    res.status(db === "up" ? 200 : 503).json({
      ok: db === "up",
      version: config.version,
      uptimeSec: uptimeSec(),
      db,
    });
  });

  const authed = requireBackendAuth(() => config.backendAuthToken);

  // --- Config push (control plane → this backend; Bearer auth) ---
  // Accepts the automation configuration. Tokens arrive ONLY over this
  // server-to-server TLS channel (Phase 5 OAuth handoff) or env bootstrap —
  // never through the browser.
  app.post("/api/config/push", authed, async (req, res) => {
    try {
      const { flows = [], igAccounts = [] } = req.body || {};
      if (!Array.isArray(flows)) {
        return res.status(400).json({ ok: false, error: "flows must be an array" });
      }

      let flowCount = 0;
      for (const flow of flows) {
        validateFlow(flow);
        await query(
          `INSERT INTO flows (id, name, is_active, post_id, match_any_post, keywords,
                              whole_word_match, dm_trigger_enabled, dm_message,
                              public_reply_enabled, public_reply_message,
                              require_follow, follow_prompt_message,
                              ai_enabled, ai_prompt, updated_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,now())
           ON CONFLICT (id) DO UPDATE SET
             name = EXCLUDED.name, is_active = EXCLUDED.is_active,
             post_id = EXCLUDED.post_id, match_any_post = EXCLUDED.match_any_post,
             keywords = EXCLUDED.keywords, whole_word_match = EXCLUDED.whole_word_match,
             dm_trigger_enabled = EXCLUDED.dm_trigger_enabled,
             dm_message = EXCLUDED.dm_message,
             public_reply_enabled = EXCLUDED.public_reply_enabled,
             public_reply_message = EXCLUDED.public_reply_message,
             require_follow = EXCLUDED.require_follow,
             follow_prompt_message = EXCLUDED.follow_prompt_message,
             ai_enabled = EXCLUDED.ai_enabled, ai_prompt = EXCLUDED.ai_prompt,
             updated_at = now()`,
          [
            flow.id, flow.name, flow.is_active !== false,
            flow.post_id || null, Boolean(flow.match_any_post),
            flow.keywords, flow.whole_word_match !== false,
            Boolean(flow.dm_trigger_enabled), flow.dm_message,
            Boolean(flow.public_reply_enabled), flow.public_reply_message || null,
            Boolean(flow.require_follow), flow.follow_prompt_message || null,
            Boolean(flow.ai_enabled), flow.ai_prompt || null,
          ]
        );
        flowCount += 1;
      }

      let accountCount = 0;
      if (Array.isArray(igAccounts)) {
        for (const account of igAccounts) {
          if (!account.instagramId || !account.accessToken) {
            return res.status(400).json({
              ok: false,
              error: "igAccounts entries need instagramId + accessToken",
            });
          }
          await query(
            `INSERT INTO ig_accounts (instagram_id, username, access_token, is_active, updated_at)
             VALUES ($1, $2, $3, TRUE, now())
             ON CONFLICT (instagram_id) DO UPDATE SET
               username = EXCLUDED.username, access_token = EXCLUDED.access_token,
               is_active = TRUE, updated_at = now()`,
            [
              account.instagramId,
              account.username || account.instagramId,
              protectSecret(account.accessToken),
            ]
          );
          accountCount += 1;
        }
      }

      invalidateFlowCache();
      invalidateAccountCache();
      return res.json({ ok: true, flows: flowCount, igAccounts: accountCount });
    } catch (err) {
      console.error("[config] push failed:", err.message);
      return res.status(400).json({ ok: false, error: err.message });
    }
  });

  // --- Status (public by design: operational data only, zero secrets) ---
  app.get("/api/status", async (req, res) => {
    try {
      const { rows: accounts } = await query(
        "SELECT instagram_id, username, is_active FROM ig_accounts"
      );
      const { rows: flowCounts } = await query(
        `SELECT COUNT(*)::int AS total,
                COUNT(*) FILTER (WHERE is_active)::int AS active
         FROM flows`
      );
      const { rows: pendingJobs } = await query(
        `SELECT COUNT(*)::int AS pending FROM jobs
         WHERE status IN ('pending', 'failed') AND attempts < max_attempts`
      );
      const ai = aiStatus();
      return res.json({
        ok: true,
        version: config.version,
        // Uptime lets dashboards tell a fresh deploy/restart apart from a
        // long-running worker, and spot sleep/wake cycles on free tiers.
        uptimeSec: uptimeSec(),
        accounts: accounts.map((a) => ({
          instagramId: a.instagram_id,
          username: a.username,
          isActive: a.is_active,
        })),
        flows: flowCounts[0] || { total: 0, active: 0 },
        jobsPending: pendingJobs[0]?.pending ?? 0,
        ai: { provider: ai.provider, configured: ai.configured, model: ai.model },
        counters: {
          webhooksReceived: stats.webhooksReceived,
          webhooksRejected: stats.webhooksRejected,
          eventsMatched: stats.eventsMatched,
          jobsEnqueued: stats.jobsEnqueued,
          jobsCompleted: stats.jobsCompleted,
          jobsFailed: stats.jobsFailed,
          dmSent: stats.dmSent,
        },
        worker: { lastPollAt: stats.lastPollAt, lastJobAt: stats.lastJobAt },
      });
    } catch (err) {
      return res.status(503).json({ ok: false, error: "Database unavailable" });
    }
  });

  return app;
}

function validateFlow(flow) {
  if (!flow || typeof flow.id !== "string" || !flow.id) {
    throw new Error("Each flow needs a string id");
  }
  if (typeof flow.name !== "string" || !flow.name) {
    throw new Error(`Flow ${flow.id}: name is required`);
  }
  if (!Array.isArray(flow.keywords) || flow.keywords.filter(Boolean).length === 0) {
    throw new Error(`Flow ${flow.id}: at least one keyword is required`);
  }
  if (typeof flow.dm_message !== "string" || !flow.dm_message.trim()) {
    throw new Error(`Flow ${flow.id}: dm_message is required`);
  }
  if (!flow.match_any_post && !flow.post_id) {
    throw new Error(`Flow ${flow.id}: set post_id or match_any_post=true`);
  }
}

/** Match parsed events against cached flows; enqueue ONLY on match. */
async function handleWebhookPayload(payload) {
  const [accounts, flows] = await Promise.all([getAccounts(), getActiveFlows()]);
  const knownAccounts = new Set(accounts.map((a) => a.instagram_id));

  for (const event of parseCommentEvents(payload)) {
    if (!knownAccounts.has(event.accountId)) continue;
    const seen = await markSeen(`comment:${event.accountId}:${event.commentId}`, "comment", event.accountId);
    if (!seen) continue; // redelivery
    for (const flow of flows) {
      if (flow.post_id && flow.post_id !== event.mediaId && !flow.match_any_post) {
        continue;
      }
      if (!flow.post_id && !flow.match_any_post) continue;
      const match = matchKeywords(event.text, flow.keywords, flow.whole_word_match);
      if (!match.matched) continue;
      stats.eventsMatched += 1;
      const created = await enqueueJob(
        `c:${event.accountId}:${event.commentId}:${flow.id}`,
        "comment",
        {
          automationId: flow.id,
          accountId: event.accountId,
          commentId: event.commentId,
          text: event.text,
          commenterId: event.commenterId,
          commenterName: event.commenterName,
          mediaId: event.mediaId,
          matchedKeyword: match.matchedKeyword,
        }
      );
      if (created) stats.jobsEnqueued += 1;
    }
  }

  for (const event of parseMessageEvents(payload)) {
    if (!knownAccounts.has(event.accountId)) continue;
    if (!event.messageId) continue;
    const seen = await markSeen(`dm:${event.accountId}:${event.messageId}`, "dm", event.accountId);
    if (!seen) continue;
    for (const flow of flows) {
      if (!flow.dm_trigger_enabled) continue;
      const match = matchKeywords(event.text, flow.keywords, flow.whole_word_match);
      if (!match.matched) continue;
      stats.eventsMatched += 1;
      const created = await enqueueJob(
        `m:${event.accountId}:${event.messageId}:${flow.id}`,
        "dm",
        {
          automationId: flow.id,
          accountId: event.accountId,
          senderId: event.senderId,
          messageId: event.messageId,
          text: event.text,
          matchedKeyword: match.matchedKeyword,
        }
      );
      if (created) stats.jobsEnqueued += 1;
    }
  }
}

/** Returns true when this is the FIRST time we've seen the key. */
async function markSeen(eventKey, kind, accountId) {
  const { rowCount } = await query(
    `INSERT INTO processed_events (event_key, kind, account_id)
     VALUES ($1, $2, $3) ON CONFLICT (event_key) DO NOTHING`,
    [eventKey, kind, accountId]
  );
  return rowCount === 1;
}
