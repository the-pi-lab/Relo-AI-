// Automation engine: turns a queued job into at most one DM.
// Guarantees (adapted from OpenReply's proven worker logic):
// - Meta allows exactly ONE private reply per comment: UNIQUE(automation_id,
//   comment_id) + a cross-automation SENT check enforce it, so overlapping
//   campaigns skip with SKIPPED_DEDUP instead of burning API calls.
// - Public replies are decoupled from DMs and idempotent across retries.
// - Follow-gating is one-shot per comment in v1 (no postback infra): the
//   prompt consumes the comment's reply slot; the link goes out when the user
//   comments again after following. This is stated honestly in the README.
// - AI runs ONLY for flows with ai_enabled=true; failures fall back to the
//   template message (never a failed DM over an AI outage).
import { query } from "./db.js";
import { getFlowById } from "./flows.js";
import { personalize } from "./keyword.js";
import {
  sendPrivateReply,
  sendCommentReply,
  sendDirectMessage,
  getUserFollowStatus,
  isRetryable,
  TokenExpiredError,
} from "./meta.js";
import { reserveSendSlot } from "./ratelimit.js";
import { generateReply } from "./ai/index.js";
import { revealSecret } from "./crypto.js";
import { stats } from "./stats.js";

async function getAccountToken(accountId) {
  const { rows } = await query(
    "SELECT access_token, is_active FROM ig_accounts WHERE instagram_id = $1",
    [accountId]
  );
  const account = rows[0];
  if (!account || !account.is_active) return null;
  try {
    return revealSecret(account.access_token);
  } catch (err) {
    console.error(`[engine] cannot decrypt token for ${accountId}:`, err.message);
    return null;
  }
}

async function upsertLogBase({ flowId, accountId, commenterId, commenterName, text, dedupeKey, keyword }) {
  await query(
    `INSERT INTO dm_logs (automation_id, account_id, commenter_id, commenter_name,
                          comment_text, comment_id, matched_keyword, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
     ON CONFLICT (automation_id, comment_id) DO NOTHING`,
    [flowId, accountId, commenterId, commenterName || null, text, dedupeKey, keyword || null]
  );
}

async function setLogStatus(flowId, dedupeKey, patch) {
  const keys = Object.keys(patch);
  const sets = keys.map((k, i) => `${k} = $${i + 3}`).join(", ");
  await query(
    `UPDATE dm_logs SET ${sets}, updated_at = now()
     WHERE automation_id = $1 AND comment_id = $2`,
    [flowId, dedupeKey, ...keys.map((k) => patch[k])]
  );
}

async function touchContact(accountId, igUserId, username) {
  await query(
    `INSERT INTO contacts (account_id, ig_user_id, username, last_seen_at)
     VALUES ($1, $2, $3, now())
     ON CONFLICT (account_id, ig_user_id)
     DO UPDATE SET username = COALESCE(EXCLUDED.username, contacts.username),
                   last_seen_at = now()`,
    [accountId, igUserId, username || null]
  );
}

async function buildMessage(flow, text, username) {
  if (!flow.ai_enabled) {
    return { message: personalize(flow.dm_message, username), aiUsed: false };
  }
  try {
    const aiText = await generateReply({
      systemPrompt: flow.ai_prompt,
      userText: text,
      username,
    });
    return { message: aiText, aiUsed: true };
  } catch (err) {
    console.warn(`[engine] AI failed for flow ${flow.id}, using template:`, err.message);
    return { message: personalize(flow.dm_message, username), aiUsed: false };
  }
}

/**
 * Shared delivery pipeline for comment (private reply) and DM (direct) jobs.
 * @returns 'done' | 'retry' (throw) — reschedule handled via thrown RescheduleError
 */
export class RescheduleError extends Error {
  constructor(delayMs, message) {
    super(message);
    this.delayMs = delayMs;
  }
}

async function deliver({
  flow,
  accountId,
  token,
  dedupeKey,
  commenterId,
  commenterName,
  text,
  keyword,
  sendDm,
  publicReply,
}) {
  if (!flow.is_active) {
    await setLogStatus(flow.id, dedupeKey, { status: "skipped_inactive" });
    return;
  }

  const { rows: existing } = await query(
    "SELECT status, public_reply_sent_at FROM dm_logs WHERE automation_id = $1 AND comment_id = $2",
    [flow.id, dedupeKey]
  );
  if (existing[0]?.status === "sent") return; // job redelivered after success

  // Exactly one private reply per comment across ALL automations.
  const { rows: otherSent } = await query(
    `SELECT automation_id FROM dm_logs
     WHERE comment_id = $1 AND status = 'sent' AND automation_id <> $2 LIMIT 1`,
    [dedupeKey, flow.id]
  );
  if (otherSent.length > 0) {
    await upsertLogBase({
      flowId: flow.id, accountId, commenterId, commenterName, text, dedupeKey, keyword,
    });
    await setLogStatus(flow.id, dedupeKey, {
      status: "skipped_dedup",
      error_message: "Another automation already sent this comment's one private reply",
    });
    return;
  }

  await upsertLogBase({
    flowId: flow.id, accountId, commenterId, commenterName, text, dedupeKey, keyword,
  });

  // Rate budget: reserve before spending an API call.
  const slot = await reserveSendSlot(accountId);
  if (!slot.allowed) {
    throw new RescheduleError(
      slot.retryAfterMs,
      "Hourly Instagram rate budget reached; rescheduled"
    );
  }

  const { message, aiUsed } = await buildMessage(flow, text, commenterName);

  // Public reply leg first: independent of the DM, idempotent via timestamp.
  if (publicReply && !existing[0]?.public_reply_sent_at) {
    try {
      await sendCommentReply(token, publicReply.commentId, publicReply.message);
      await setLogStatus(flow.id, dedupeKey, {
        public_reply_sent_at: new Date().toISOString(),
      });
    } catch (err) {
      console.warn("[engine] public reply failed (DM leg continues):", err.message);
    }
  }

  try {
    await sendDm(message);
  } catch (err) {
    if (err instanceof TokenExpiredError) {
      await query("UPDATE ig_accounts SET is_active = FALSE WHERE instagram_id = $1", [
        accountId,
      ]);
      console.error(
        `[engine] Instagram token for ${accountId} expired — account deactivated, reconnect required.`
      );
    }
    if (isRetryable(err)) throw err;
    await setLogStatus(flow.id, dedupeKey, {
      status: "failed",
      error_message: String(err.message).slice(0, 500),
    });
    return;
  }

  await setLogStatus(flow.id, dedupeKey, {
    status: "sent",
    dm_sent_at: new Date().toISOString(),
    ai_used: aiUsed,
    matched_keyword: keyword || null,
    error_message: null,
  });
  stats.dmSent += 1;
  await touchContact(accountId, commenterId, commenterName);
}

/**
 * No usable token (account disconnected, row removed, or unreadable secret).
 * Retrying is futile until the operator reconnects, so fail terminally with
 * a reconnect error instead of burning retries/backoff slots forever.
 */
async function failNoToken({ flowId, accountId, commenterId, commenterName, text, dedupeKey, keyword }) {
  const { rows } = await query(
    "SELECT status FROM dm_logs WHERE automation_id = $1 AND comment_id = $2",
    [flowId, dedupeKey]
  );
  if (rows[0]?.status === "sent") return; // job redelivered after success
  await upsertLogBase({
    flowId, accountId, commenterId, commenterName, text, dedupeKey, keyword,
  });
  await setLogStatus(flowId, dedupeKey, {
    status: "failed",
    error_message: "Instagram account disconnected or token unreadable — reconnect required",
  });
}

/** Job: comment matched a flow. Private-reply path. */
export async function processCommentJob(job) {
  const p = job.payload;
  const flow = await getFlowById(p.automationId);
  if (!flow) return; // flow deleted → drop job
  const token = await getAccountToken(p.accountId);
  if (!token) {
    await failNoToken({
      flowId: flow.id, accountId: p.accountId, commenterId: p.commenterId,
      commenterName: p.commenterName, text: p.text, dedupeKey: p.commentId,
      keyword: p.matchedKeyword,
    });
    return;
  }

  let sendDm;
  if (flow.require_follow) {
    const follows = await getUserFollowStatus(token, p.commenterId);
    if (follows === false) {
      // One-shot gate: prompt consumes this comment's reply slot; the link
      // goes out on the user's NEXT comment (re-checked then).
      const prompt = personalize(
        flow.follow_prompt_message ||
          "Thanks for commenting! Please follow @{username} first, then comment again and I'll send your link right over.",
        p.commenterName
      );
      sendDm = () => sendPrivateReply(token, p.accountId, p.commentId, prompt);
    } else {
      // true OR unverifiable (null) → fail open, never trap a real follower.
      sendDm = (message) => sendPrivateReply(token, p.accountId, p.commentId, message);
    }
  } else {
    sendDm = (message) => sendPrivateReply(token, p.accountId, p.commentId, message);
  }

  await deliver({
    flow,
    accountId: p.accountId,
    token,
    dedupeKey: p.commentId,
    commenterId: p.commenterId,
    commenterName: p.commenterName,
    text: p.text,
    keyword: p.matchedKeyword,
    sendDm,
    publicReply:
      flow.public_reply_enabled && flow.public_reply_message
        ? {
            commentId: p.commentId,
            message: personalize(flow.public_reply_message, p.commenterName),
          }
        : null,
  });
}

/** Job: inbound DM matched a dm_trigger flow. Direct-message path. */
export async function processDmJob(job) {
  const p = job.payload;
  const flow = await getFlowById(p.automationId);
  if (!flow) return;
  const token = await getAccountToken(p.accountId);
  if (!token) {
    await failNoToken({
      flowId: flow.id, accountId: p.accountId, commenterId: p.senderId,
      commenterName: null, text: p.text, dedupeKey: `dm:${p.messageId}`,
      keyword: p.matchedKeyword,
    });
    return;
  }

  let sendDm;
  if (flow.require_follow) {
    const follows = await getUserFollowStatus(token, p.senderId);
    if (follows === false) {
      const prompt = personalize(
        flow.follow_prompt_message ||
          "Thanks for reaching out! Please follow us first, then message again and I'll send your link.",
        null
      );
      await deliver({
        flow, accountId: p.accountId, token,
        dedupeKey: `dm:${p.messageId}`,
        commenterId: p.senderId, commenterName: null, text: p.text,
        keyword: p.matchedKeyword,
        sendDm: () => sendDirectMessage(token, p.accountId, p.senderId, prompt),
        publicReply: null,
      });
      return;
    }
  }
  sendDm = (message) => sendDirectMessage(token, p.accountId, p.senderId, message);

  await deliver({
    flow,
    accountId: p.accountId,
    token,
    dedupeKey: `dm:${p.messageId}`,
    commenterId: p.senderId,
    commenterName: null,
    text: p.text,
    keyword: p.matchedKeyword,
    sendDm,
    publicReply: null,
  });
}

export async function processJob(job) {
  if (job.type === "comment") return processCommentJob(job);
  if (job.type === "dm") return processDmJob(job);
  console.warn(`[engine] unknown job type "${job.type}", completing`);
}
