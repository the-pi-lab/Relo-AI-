import type { D1Database, D1PreparedStatement } from "@cloudflare/workers-types";
import { hashOtp } from "../crypto";
import type {
  AccountId,
  AutomationId,
  CommentId,
  InstagramUserId,
  JobId,
  LeadId,
  MediaId,
  PendingJob,
  ReelAutomation,
  TemplateCardConfig,
} from "../types";
import {
  createAccountId,
  createAutomationId,
  createCommentId,
  createInstagramUserId,
  createJobId,
  createLeadId,
  createMediaId,
} from "../types";

/**
 * 1. Insert incoming comment as a pending job with atomic deduplication.
 * Uses INSERT OR IGNORE to prevent duplicate webhook processing.
 */
export async function insertJobIfNew(
  db: D1Database,
  job: {
    id: JobId;
    accountId: AccountId;
    commentId: CommentId;
    commenterUserId: InstagramUserId;
    commenterUsername: string;
    commentText: string;
    postId: MediaId;
    matchedAutomationId?: AutomationId;
    sendAt: number; // unix timestamp with 30-90s jitter
  }
): Promise<boolean> {
  const result = await db
    .prepare(
      `INSERT OR IGNORE INTO jobs (
        id, account_id, comment_id, commenter_user_id, commenter_username,
        comment_text, post_id, matched_automation_id, send_at, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`
    )
    .bind(
      job.id,
      job.accountId,
      job.commentId,
      job.commenterUserId,
      job.commenterUsername,
      job.commentText,
      job.postId,
      job.matchedAutomationId || null,
      job.sendAt
    )
    .run();

  return (result.meta?.changes ?? 0) > 0;
}

/**
 * 2. Fetch due pending jobs for the 1-minute Cron batch worker.
 * Leverages partial index `idx_jobs_cron_poll`.
 *
 * Phase 3 priority queue (plan.md §3, §5): Studio accounts jump the queue.
 * The tier is read live from `connected_accounts` rather than denormalised onto
 * the job row, so an upgrade takes effect on the very next cron tick and a
 * downgrade can never strand stale high-priority jobs.
 */
export async function getDueJobsBatch(
  db: D1Database,
  limit: number = 50
): Promise<PendingJob[]> {
  const now = Math.floor(Date.now() / 1000);

  const { results } = await db
    .prepare(
      `SELECT j.id, j.account_id, j.comment_id, j.commenter_user_id, j.commenter_username,
              j.comment_text, j.post_id, j.matched_automation_id, j.status, j.retry_count,
              j.send_at, j.created_at, j.updated_at, j.public_reply_id, j.parent_job_id, j.is_follow_up
       FROM jobs j
       LEFT JOIN connected_accounts ca ON ca.id = j.account_id
       WHERE j.status = 'pending' AND j.send_at <= ?
       ORDER BY (ca.plan = 'studio') DESC, j.send_at ASC, j.created_at ASC
       LIMIT ?`
    )
    .bind(now, limit)
    .all();

  return (results || []).map((row: any) => ({
    id: createJobId(row.id),
    accountId: createAccountId(row.account_id),
    commentId: createCommentId(row.comment_id),
    commenterUserId: createInstagramUserId(row.commenter_user_id),
    commenterUsername: row.commenter_username,
    commentText: row.comment_text,
    postId: createMediaId(row.post_id),
    matchedAutomationId: row.matched_automation_id
      ? createAutomationId(row.matched_automation_id)
      : undefined,
    status: "pending" as const,
    retryCount: row.retry_count || 0,
    sendAt: row.send_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    publicReplyId: row.public_reply_id || undefined,
    parentJobId: row.parent_job_id || undefined,
    isFollowUp: Boolean(row.is_follow_up),
  }));
}

/**
 * 3. Atomically mark job as processing to avoid race conditions.
 */
export async function markJobProcessing(
  db: D1Database,
  jobId: JobId
): Promise<boolean> {
  const now = Math.floor(Date.now() / 1000);
  const res = await db
    .prepare(
      `UPDATE jobs 
       SET status = 'processing', updated_at = ? 
       WHERE id = ? AND status = 'pending'`
    )
    .bind(now, jobId)
    .run();

  return (res.meta?.changes ?? 0) > 0;
}

/**
 * 4. Mark job completed upon successful DM & comment reply delivery.
 */
export async function markJobCompleted(
  db: D1Database,
  jobId: JobId,
  responseMid?: string
): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  await db
    .prepare(
      `UPDATE jobs 
       SET status = 'completed', response_mid = ?, updated_at = ? 
       WHERE id = ?`
    )
    .bind(responseMid || null, now, jobId)
    .run();
}

/**
 * 5. Handle job retry or terminal failure with exponential backoff.
 */
export async function markJobFailedOrRetry(
  db: D1Database,
  jobId: JobId,
  error: string,
  currentRetryCount: number,
  maxRetries: number = 3
): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  const nextRetryCount = currentRetryCount + 1;

  if (nextRetryCount > maxRetries) {
    // Terminal failure
    await db
      .prepare(
        `UPDATE jobs 
         SET status = 'failed', error_message = ?, updated_at = ? 
         WHERE id = ?`
      )
      .bind(error, now, jobId)
      .run();
  } else {
    // Exponential backoff: retry after 2^retryCount * 60 seconds (120s, 240s, 480s)
    const backoffSeconds = Math.pow(2, nextRetryCount) * 60;
    const nextSendAt = now + backoffSeconds;

    await db
      .prepare(
        `UPDATE jobs 
         SET status = 'pending', retry_count = ?, send_at = ?, error_message = ?, updated_at = ? 
         WHERE id = ?`
      )
      .bind(nextRetryCount, nextSendAt, error, now, jobId)
      .run();
  }
}

/**
 * 6. Check if a thread is currently under 30-minute Human Takeover auto-pause.
 */
export async function isThreadPausedByHumanTakeover(
  db: D1Database,
  accountId: AccountId,
  threadId: string
): Promise<boolean> {
  const now = Math.floor(Date.now() / 1000);
  const row = await db
    .prepare(
      `SELECT 1 FROM human_takeovers 
       WHERE account_id = ? AND thread_id = ? AND paused_until > ? 
       LIMIT 1`
    )
    .bind(accountId, threadId, now)
    .first();

  return !!row;
}

/**
 * 7. Set 30-minute Human Takeover auto-pause when manual reply is detected.
 * Upserts: one row per thread. The previous plain INSERT appended a row for
 * every inbound message, so the table grew without bound and every lookup had
 * to scan duplicates.
 */
export async function setHumanTakeoverPause(
  db: D1Database,
  accountId: AccountId,
  threadId: string,
  durationSeconds: number = 1800 // 30 minutes
): Promise<void> {
  const pausedUntil = Math.floor(Date.now() / 1000) + durationSeconds;
  await db
    .prepare(
      `INSERT INTO human_takeovers (id, account_id, thread_id, paused_until)
       VALUES (?, ?, ?, ?)
       ON CONFLICT (account_id, thread_id) DO UPDATE SET
         paused_until = MAX(human_takeovers.paused_until, excluded.paused_until)`
    )
    .bind(crypto.randomUUID(), accountId, threadId, pausedUntil)
    .run();
}

/**
 * 7a. Message-id ledger.
 *
 * Two problems share one solution:
 *   - Meta redelivers webhooks, so the same inbound message can be processed
 *     twice (double AI replies, double pause writes).
 *   - An `is_echo` message is either our own outbound message coming back, or
 *     the creator replying by hand. Only the second is a takeover signal, and
 *     the only way to tell them apart is remembering the mids we sent.
 */
export async function claimInboundMessage(
  db: D1Database,
  accountId: AccountId,
  threadId: string,
  mid: string
): Promise<boolean> {
  const res = await db
    .prepare(
      `INSERT OR IGNORE INTO message_mids (mid, account_id, thread_id, direction)
       VALUES (?, ?, ?, 'in')`
    )
    .bind(mid, accountId, threadId)
    .run();
  return (res.meta?.changes ?? 0) > 0;
}

/** Records a message WE sent, so its echo is not mistaken for a human reply. */
export async function recordOutboundMessage(
  db: D1Database,
  accountId: AccountId,
  threadId: string,
  mid: string
): Promise<void> {
  if (!mid) return;
  await db
    .prepare(
      `INSERT OR IGNORE INTO message_mids (mid, account_id, thread_id, direction)
       VALUES (?, ?, ?, 'out')`
    )
    .bind(mid, accountId, threadId)
    .run();
}

/** True when `mid` is a message this account sent (an echo of our own DM). */
export async function isOutboundMessage(db: D1Database, mid: string): Promise<boolean> {
  if (!mid) return false;
  const row = await db
    .prepare(`SELECT 1 FROM message_mids WHERE mid = ? AND direction = 'out' LIMIT 1`)
    .bind(mid)
    .first();
  return Boolean(row);
}

/**
 * 7b. Per-thread AI clock. Returns the unix second of the last AI reply, so the
 * caller can enforce a cooldown instead of answering every message in a burst.
 */
export async function getLastAiReplyAt(
  db: D1Database,
  accountId: AccountId,
  threadId: string
): Promise<number> {
  const row = (await db
    .prepare(
      `SELECT last_ai_reply_at FROM ai_thread_state
       WHERE account_id = ? AND thread_id = ? LIMIT 1`
    )
    .bind(accountId, threadId)
    .first()) as any;
  return Number(row?.last_ai_reply_at || 0);
}

/** Stamps the AI clock (and the inbound message it acted on) after a send. */
export async function markAiReplySent(
  db: D1Database,
  accountId: AccountId,
  threadId: string
): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  await db
    .prepare(
      `INSERT INTO ai_thread_state (account_id, thread_id, last_ai_reply_at, last_inbound_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT (account_id, thread_id) DO UPDATE SET
         last_ai_reply_at = excluded.last_ai_reply_at,
         last_inbound_at = excluded.last_inbound_at`
    )
    .bind(accountId, threadId, now, now)
    .run();
}

/**
 * 8. Upsert captured lead into private database.
 */
export async function upsertCapturedLead(
  db: D1Database,
  lead: {
    accountId: AccountId;
    instagramScopedId: InstagramUserId;
    username?: string;
    /** `null` means unknown — Meta exposes no follower lookup for commenters. */
    isFollower: boolean | null;
    email?: string;
  }
): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  const followerInt = lead.isFollower === null ? null : lead.isFollower ? 1 : 0;

  await db
    .prepare(
      `INSERT INTO captured_leads (
        id, account_id, instagram_scoped_id, username, follower_status_at_trigger,
        email_collected, total_dms_sent, first_interaction_at, last_interaction_at
      ) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)
      ON CONFLICT (account_id, instagram_scoped_id) DO UPDATE SET
        username = COALESCE(excluded.username, captured_leads.username),
        follower_status_at_trigger = excluded.follower_status_at_trigger,
        email_collected = COALESCE(excluded.email_collected, captured_leads.email_collected),
        total_dms_sent = captured_leads.total_dms_sent + 1,
        last_interaction_at = excluded.last_interaction_at`
    )
    .bind(
      crypto.randomUUID(),
      lead.accountId,
      lead.instagramScopedId,
      lead.username || null,
      followerInt,
      lead.email || null,
      now,
      now
    )
    .run();
}

/**
 * 9. Fetch active automation rules for a specific Reel.
 */
export async function getActiveAutomationsForMedia(
  db: D1Database,
  accountId: AccountId,
  mediaId: MediaId
): Promise<ReelAutomation[]> {
  const { results } = await db
    .prepare(
      `SELECT id, account_id, instagram_media_id, reel_permalink, reel_thumbnail_url,
              trigger_keywords, comment_replies, follow_gate_enabled, template_card,
              is_active, created_at, updated_at, follow_up_enabled, follow_up_delay_minutes
       FROM reel_automations
       WHERE account_id = ? AND instagram_media_id = ? AND is_active = 1`
    )
    .bind(accountId, mediaId)
    .all();

  return (results || []).map((row: any) => ({
    id: createAutomationId(row.id),
    accountId: createAccountId(row.account_id),
    instagramMediaId: createMediaId(row.instagram_media_id),
    reelPermalink: row.reel_permalink,
    reelThumbnailUrl: row.reel_thumbnail_url || undefined,
    triggerKeywords: JSON.parse(row.trigger_keywords),
    commentReplies: JSON.parse(row.comment_replies),
    templateCard: JSON.parse(row.template_card) as TemplateCardConfig,
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    followUpEnabled: Boolean(row.follow_up_enabled),
    followUpDelayMinutes: Number(row.follow_up_delay_minutes ?? 60),
  }));
}

/**
 * 9b. Fetch specific automation rule by its AutomationId.
 */
export async function getAutomationById(
  db: D1Database,
  automationId: AutomationId
): Promise<ReelAutomation | null> {
  const row = (await db
    .prepare(
      `SELECT id, account_id, instagram_media_id, reel_permalink, reel_thumbnail_url,
              trigger_keywords, comment_replies, follow_gate_enabled, template_card,
              is_active, created_at, updated_at, follow_up_enabled, follow_up_delay_minutes
       FROM reel_automations
       WHERE id = ?
       LIMIT 1`
    )
    .bind(automationId)
    .first()) as any;

  if (!row) return null;

  return {
    id: createAutomationId(row.id),
    accountId: createAccountId(row.account_id),
    instagramMediaId: createMediaId(row.instagram_media_id),
    reelPermalink: row.reel_permalink,
    reelThumbnailUrl: row.reel_thumbnail_url || undefined,
    triggerKeywords: JSON.parse(row.trigger_keywords),
    commentReplies: JSON.parse(row.comment_replies),
    templateCard: JSON.parse(row.template_card) as TemplateCardConfig,
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    followUpEnabled: Boolean(row.follow_up_enabled),
    followUpDelayMinutes: Number(row.follow_up_delay_minutes ?? 60),
  };
}

/**
 * 9c. Mark account token as expired when Meta returns Code 190.
 */
export async function markAccountTokenExpired(
  db: D1Database,
  accountId: AccountId
): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  await db
    .prepare(
      `UPDATE connected_accounts 
       SET is_active = 0, updated_at = ? 
       WHERE id = ?`
    )
    .bind(now, accountId)
    .run();
}

/**
 * 9d. Accounts whose long-lived token runs out inside `windowSeconds`, ignoring
 * any account already retried in the last 12 hours so the cron cannot hammer
 * Meta with the same failing exchange every minute.
 */
export async function getAccountsDueForTokenRefresh(
  db: D1Database,
  windowSeconds: number,
  limit = 10
): Promise<
  Array<{
    id: AccountId;
    username: string;
    instagramUserId: string;
    accessTokenEncrypted: string;
    tokenExpiresAt: number;
    userTokenEncrypted: string | null;
    userTokenExpiresAt: number;
  }>
> {
  const now = Math.floor(Date.now() / 1000);
  const retryCutoff = now - 12 * 60 * 60;
  const { results } = await db
    .prepare(
      `SELECT a.id, a.username, a.instagram_user_id, a.access_token_encrypted,
              a.token_expires_at, a.user_token_encrypted, a.user_token_expires_at
       FROM connected_accounts a
       WHERE a.is_active = 1
         AND a.token_expires_at <= ?
         AND NOT EXISTS (
           SELECT 1 FROM webhook_logs l
           WHERE l.account_id = a.id
             AND l.event_type = 'token_refresh_attempt'
             AND l.created_at >= ?
         )
       ORDER BY a.token_expires_at ASC
       LIMIT ?`
    )
    .bind(now + windowSeconds, retryCutoff, Math.max(1, Math.min(50, limit)))
    .all();

  return (results || []).map((row: any) => ({
    id: createAccountId(row.id),
    username: row.username,
    instagramUserId: String(row.instagram_user_id || ""),
    accessTokenEncrypted: row.access_token_encrypted,
    tokenExpiresAt: Number(row.token_expires_at),
    userTokenEncrypted: row.user_token_encrypted || null,
    userTokenExpiresAt: Number(row.user_token_expires_at || 0),
  }));
}

/**
 * 9e. Store a rotated token and its new expiry.
 *
 * The page token cannot be renewed on its own — Meta's `fb_exchange_token`
 * grant only accepts a user token — so a refresh writes both halves. The user
 * token arguments are optional to keep older callers compiling; when omitted
 * the stored user token is left untouched.
 */
export async function updateAccountToken(
  db: D1Database,
  accountId: AccountId,
  accessTokenEncrypted: string,
  tokenExpiresAt: number,
  userTokenEncrypted?: string | null,
  userTokenExpiresAt?: number
): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  if (userTokenEncrypted !== undefined) {
    await db
      .prepare(
        `UPDATE connected_accounts
         SET access_token_encrypted = ?, token_expires_at = ?,
             user_token_encrypted = ?, user_token_expires_at = ?, updated_at = ?
         WHERE id = ?`
      )
      .bind(
        accessTokenEncrypted,
        tokenExpiresAt,
        userTokenEncrypted,
        Number(userTokenExpiresAt || 0),
        now,
        accountId
      )
      .run();
    return;
  }

  await db
    .prepare(
      `UPDATE connected_accounts
       SET access_token_encrypted = ?, token_expires_at = ?, updated_at = ?
       WHERE id = ?`
    )
    .bind(accessTokenEncrypted, tokenExpiresAt, now, accountId)
    .run();
}

/**
 * 10. Fetch connected account by internal AccountId.
 */
export interface AccountRecord {
  id: AccountId;
  instagramUserId: InstagramUserId;
  username: string;
  accessTokenEncrypted: string;
  tokenExpiresAt: number;
  isActive: boolean;
  plan: "free" | "pro" | "studio";
  aiCreditsRemaining: number;
  aiCreditsResetAt: number;
  freeReelConsumed: boolean;
}

export async function getAccountById(
  db: D1Database,
  accountId: AccountId
): Promise<AccountRecord | null> {
  const row = (await db
    .prepare(
      `SELECT id, instagram_user_id, username, access_token_encrypted, token_expires_at, is_active,
              plan, ai_credits_remaining, ai_credits_reset_at, free_reel_consumed
       FROM connected_accounts
       WHERE id = ? AND is_active = 1
       LIMIT 1`
    )
    .bind(accountId)
    .first()) as any;

  if (!row) return null;

  return {
    id: createAccountId(row.id),
    instagramUserId: createInstagramUserId(row.instagram_user_id),
    username: row.username,
    accessTokenEncrypted: row.access_token_encrypted,
    tokenExpiresAt: row.token_expires_at,
    isActive: Boolean(row.is_active),
    plan: row.plan,
    aiCreditsRemaining: Number(row.ai_credits_remaining ?? 0),
    aiCreditsResetAt: Number(row.ai_credits_reset_at ?? 0),
    freeReelConsumed: Boolean(row.free_reel_consumed),
  };
}

/**
 * 11. Fetch connected account by Instagram Page/User ID.
 */
export async function getAccountByInstagramId(
  db: D1Database,
  igUserId: string
): Promise<{
  id: AccountId;
  instagramUserId: InstagramUserId;
  username: string;
  accessTokenEncrypted: string;
  tokenExpiresAt: number;
  isActive: boolean;
  /** Subscription tier — gates AI product-Q&A and canvas features. */
  plan: string;
} | null> {
  const row = (await db
    .prepare(
      `SELECT id, instagram_user_id, username, access_token_encrypted, token_expires_at, is_active, plan
       FROM connected_accounts
       WHERE instagram_user_id = ? AND is_active = 1
       LIMIT 1`
    )
    .bind(igUserId)
    .first()) as any;

  if (!row) return null;

  return {
    id: createAccountId(row.id),
    instagramUserId: createInstagramUserId(row.instagram_user_id),
    username: row.username,
    accessTokenEncrypted: row.access_token_encrypted,
    tokenExpiresAt: row.token_expires_at,
    isActive: Boolean(row.is_active),
    plan: row.plan || "free",
  };
}

/**
 * 12. Record Webhook Audit & Delivery log.
 */
export async function recordWebhookAuditLog(
  db: D1Database,
  log: {
    accountId?: AccountId;
    eventType: string;
    statusCode: number;
    payload?: string;
    errorMessage?: string;
  }
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO webhook_logs (id, account_id, event_type, status_code, payload, error_message)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .bind(
      crypto.randomUUID(),
      log.accountId || null,
      log.eventType,
      log.statusCode,
      log.payload || null,
      log.errorMessage || null
    )
    .run();
}

/**
 * 13. Find or Create User Profile by Email.
 */
export async function findOrCreateUserByEmail(
  db: D1Database,
  email: string
): Promise<{ id: string; email: string; createdAt: number }> {
  const normalizedEmail = email.toLowerCase().trim();

  // Race-safe: insert-if-absent first, then select — concurrent first logins
  // can never collide into a UNIQUE constraint 500.
  await db
    .prepare(`INSERT INTO users (id, email, created_at) VALUES (?, ?, ?)
              ON CONFLICT (email) DO NOTHING`)
    .bind(crypto.randomUUID(), normalizedEmail, Math.floor(Date.now() / 1000))
    .run();

  const existing = (await db
    .prepare(`SELECT id, email, created_at FROM users WHERE email = ? LIMIT 1`)
    .bind(normalizedEmail)
    .first()) as any;

  return {
    id: existing.id,
    email: existing.email,
    createdAt: existing.created_at,
  };
}

/** Look up a user (and their billing state) by email, without creating one. */
export async function getUserByEmail(
  db: D1Database,
  email: string
): Promise<{
  id: string;
  email: string;
  plan: "free" | "pro" | "studio";
  aiCreditsRemaining: number;
  aiCreditsResetAt: number;
  freeReelConsumed: number;
  planExpiresAt: number;
} | null> {
  const row = (await db
    .prepare(
      `SELECT id, email, plan, ai_credits_remaining, ai_credits_reset_at,
              free_reel_consumed, plan_expires_at
       FROM users WHERE email = ? LIMIT 1`
    )
    .bind(email.toLowerCase().trim())
    .first()) as any;
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    plan: row.plan === "studio" || row.plan === "pro" ? row.plan : "free",
    aiCreditsRemaining: Number(row.ai_credits_remaining ?? 0),
    aiCreditsResetAt: Number(row.ai_credits_reset_at ?? 0),
    freeReelConsumed: Number(row.free_reel_consumed ?? 0),
    planExpiresAt: Number(row.plan_expires_at ?? 0),
  };
}

/**
 * 13b. Server-side session ledger (JWT revocation).
 *
 * A token is only accepted while its `jti` has a live row here. Logging out
 * stamps `revoked_at`; "sign out everywhere" stamps every row for the user.
 */
export interface SessionRecord {
  jti: string;
  userId: string;
  createdAt: number;
  expiresAt: number;
}

export async function createSession(
  db: D1Database,
  jti: string,
  userId: string,
  expiresAt: number
): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  await db
    .prepare(
      `INSERT INTO sessions (jti, user_id, created_at, expires_at)
       VALUES (?, ?, ?, ?)`
    )
    .bind(jti, userId, now, expiresAt)
    .run();
}

export async function getActiveSession(
  db: D1Database,
  jti: string
): Promise<{ userId: string; expiresAt: number } | null> {
  if (!jti) return null;
  const now = Math.floor(Date.now() / 1000);
  const row = (await db
    .prepare(
      `SELECT user_id, expires_at FROM sessions
       WHERE jti = ? AND revoked_at IS NULL AND expires_at > ?
       LIMIT 1`
    )
    .bind(jti, now)
    .first()) as any;
  if (!row) return null;
  return { userId: row.user_id, expiresAt: Number(row.expires_at) };
}

export async function revokeSession(
  db: D1Database,
  jti: string,
  userId: string
): Promise<boolean> {
  const now = Math.floor(Date.now() / 1000);
  const res = await db
    .prepare(
      `UPDATE sessions SET revoked_at = ?
       WHERE jti = ? AND user_id = ? AND revoked_at IS NULL`
    )
    .bind(now, jti, userId)
    .run();
  return (res.meta?.changes ?? 0) > 0;
}

/** Revokes every session for a user, including the caller's own token. */
export async function revokeAllSessions(
  db: D1Database,
  userId: string
): Promise<number> {
  const now = Math.floor(Date.now() / 1000);
  const res = await db
    .prepare(
      `UPDATE sessions SET revoked_at = ?
       WHERE user_id = ? AND revoked_at IS NULL`
    )
    .bind(now, userId)
    .run();
  return res.meta?.changes ?? 0;
}

/**
 * 14. Save Email OTP code for passwordless sign-in (10 min expiry).
 * Enforces a 60-second resend throttle per email to prevent email-bombing.
 *
 * The code is stored as HMAC-SHA256(code, pepper), never in plaintext: a D1
 * snapshot (or a support export) must not contain a live login credential.
 */
export async function saveEmailOtp(
  db: D1Database,
  email: string,
  code: string,
  expiresInSeconds = 600,
  pepper = ""
): Promise<{ ok: true } | { ok: false; retryAfterSeconds: number }> {
  const normalizedEmail = email.toLowerCase().trim();
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = now + expiresInSeconds;
  const resendThrottleSeconds = 60;

  if (!pepper) {
    throw new Error("[Auth] An OTP pepper is required to store a login code.");
  }
  const codeHash = await hashOtp(code, pepper);

  const existing = (await db
    .prepare(`SELECT created_at FROM email_otps WHERE email = ? LIMIT 1`)
    .bind(normalizedEmail)
    .first()) as any;

  if (existing?.created_at && existing.created_at + resendThrottleSeconds > now) {
    return {
      ok: false,
      retryAfterSeconds: existing.created_at + resendThrottleSeconds - now,
    };
  }

  await db
    .prepare(
      `INSERT INTO email_otps (email, code_hash, expires_at, created_at, attempts, last_sent_at)
       VALUES (?, ?, ?, ?, 0, ?)
       ON CONFLICT (email) DO UPDATE SET
         code_hash = excluded.code_hash,
         expires_at = excluded.expires_at,
         created_at = excluded.created_at,
         attempts = 0,
         last_sent_at = excluded.last_sent_at`
    )
    .bind(normalizedEmail, codeHash, expiresAt, now, now)
    .run();

  return { ok: true };
}

const MAX_OTP_ATTEMPTS = 5;

/**
 * 15. Verify and consume Email OTP code.
 * Brute-force hardened: at most MAX_OTP_ATTEMPTS failed tries invalidate the
 * code, and consumption is an atomic conditional DELETE (no TOCTOU window).
 *
 * The submitted code is hashed with the same pepper before comparison, so the
 * stored row never needs to hold (or reveal) the plaintext code. A missing
 * pepper fails closed rather than matching an empty digest.
 */
export async function verifyAndConsumeEmailOtp(
  db: D1Database,
  email: string,
  code: string,
  pepper = ""
): Promise<boolean> {
  if (!pepper) return false;

  const normalizedEmail = email.toLowerCase().trim();
  const now = Math.floor(Date.now() / 1000);
  const codeHash = await hashOtp(code, pepper);

  const row = (await db
    .prepare(
      `SELECT attempts FROM email_otps
       WHERE email = ? AND expires_at > ? LIMIT 1`
    )
    .bind(normalizedEmail, now)
    .first()) as any;

  if (!row) return false;

  if (Number(row.attempts || 0) >= MAX_OTP_ATTEMPTS) {
    // Lockout: too many failures, invalidate the code entirely
    await db.prepare(`DELETE FROM email_otps WHERE email = ?`).bind(normalizedEmail).run();
    return false;
  }

  // Atomic consume: the delete only succeeds when the digest matches exactly,
  // so two concurrent verifications can never both "consume" the same OTP.
  const consume = await db
    .prepare(
      `DELETE FROM email_otps WHERE email = ? AND code_hash = ? AND expires_at > ?`
    )
    .bind(normalizedEmail, codeHash, now)
    .run();

  if ((consume.meta?.changes ?? 0) > 0) {
    return true;
  }

  // Wrong code: count the attempt and lock out at the ceiling
  await db
    .prepare(
      `UPDATE email_otps
       SET attempts = attempts + 1
       WHERE email = ? AND expires_at > ?`
    )
    .bind(normalizedEmail, now)
    .run();

  const after = (await db
    .prepare(`SELECT attempts FROM email_otps WHERE email = ?`)
    .bind(normalizedEmail)
    .first()) as any;
  if (after && Number(after.attempts || 0) >= MAX_OTP_ATTEMPTS) {
    await db.prepare(`DELETE FROM email_otps WHERE email = ?`).bind(normalizedEmail).run();
  }

  return false;
}

/**
 * 16. Get all connected Instagram accounts for a user.
 */
export async function getAccountsForUser(
  db: D1Database,
  userId: string
): Promise<Array<{
  id: AccountId;
  userId: string;
  instagramUserId: InstagramUserId;
  username: string;
  profilePictureUrl?: string;
  tokenExpiresAt: number;
  daysUntilExpiration: number;
  isActive: boolean;
  createdAt: number;
  /** Subscription tier — used to enforce the multi-account cap at connect. */
  plan: string;
}>> {
  const { results } = await db
    .prepare(
      `SELECT id, user_id, instagram_user_id, username, profile_picture_url,
              token_expires_at, is_active, created_at, plan
       FROM connected_accounts
       WHERE user_id = ? AND is_active = 1
       ORDER BY created_at DESC`
    )
    .bind(userId)
    .all();

  const now = Math.floor(Date.now() / 1000);

  return (results || []).map((row: any) => {
    const daysUntil = Math.max(0, Math.floor((row.token_expires_at - now) / 86400));
    return {
      id: createAccountId(row.id),
      userId: row.user_id,
      instagramUserId: createInstagramUserId(row.instagram_user_id),
      username: row.username,
      profilePictureUrl: row.profile_picture_url || undefined,
      tokenExpiresAt: row.token_expires_at,
      daysUntilExpiration: daysUntil,
      isActive: Boolean(row.is_active),
      createdAt: row.created_at,
      plan: row.plan || "free",
    };
  });
}

/**
 * 17. Upsert connected Instagram account.
 */
export async function upsertConnectedAccount(
  db: D1Database,
  account: {
    id: string;
    userId: string;
    instagramUserId: string;
    username: string;
    profilePictureUrl?: string;
    accessTokenEncrypted: string;
    tokenExpiresAt: number;
    /** Long-lived user token, from which the page token is derived. */
    userTokenEncrypted?: string | null;
    userTokenExpiresAt?: number;
  }
): Promise<boolean> {
  const now = Math.floor(Date.now() / 1000);
  // `WHERE connected_accounts.user_id = excluded.user_id` makes the SQL itself
  // refuse a cross-user takeover, instead of relying only on the router guard.
  //
  // Billing columns are seeded from the user's row: if a paying user connects a
  // new Instagram account (or reconnects one after disconnecting), the new row
  // must inherit the plan/credits/free-slot instead of silently starting on
  // Free. On conflict they are deliberately NOT overwritten — a reconnect must
  // never reset the tier that is already on the row.
  const res = await db
    .prepare(
      `INSERT INTO connected_accounts (
        id, user_id, instagram_user_id, username, profile_picture_url,
        access_token_encrypted, token_expires_at,
        user_token_encrypted, user_token_expires_at,
        is_active, created_at, updated_at,
        plan, ai_credits_remaining, ai_credits_reset_at, free_reel_consumed
      )
      SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?,
             u.plan, u.ai_credits_remaining, u.ai_credits_reset_at, u.free_reel_consumed
        FROM users u
       WHERE u.id = ?
      ON CONFLICT (instagram_user_id) DO UPDATE SET
        username = excluded.username,
        profile_picture_url = excluded.profile_picture_url,
        access_token_encrypted = excluded.access_token_encrypted,
        token_expires_at = excluded.token_expires_at,
        user_token_encrypted = excluded.user_token_encrypted,
        user_token_expires_at = excluded.user_token_expires_at,
        is_active = 1,
        updated_at = excluded.updated_at
      WHERE connected_accounts.user_id = excluded.user_id`
    )
    .bind(
      account.id,
      account.userId,
      account.instagramUserId,
      account.username,
      account.profilePictureUrl || null,
      account.accessTokenEncrypted,
      account.tokenExpiresAt,
      account.userTokenEncrypted || null,
      Number(account.userTokenExpiresAt || 0),
      now,
      now,
      account.userId
    )
    .run();
  return (res.meta?.changes ?? 0) > 0;
}

/**
 * 18. Disconnect a connected account.
 *
 * This is a soft delete on purpose: payments, automations, campaigns and lead
 * history reference the account row, and a hard DELETE either cascaded that
 * history away or failed on a foreign key. The row stays, but it disappears
 * from every active-account query (`is_active = 1`) and its tokens are wiped,
 * so a reconnect cannot silently keep using a revoked grant.
 */
export async function deleteConnectedAccount(
  db: D1Database,
  accountId: string,
  userId: string
): Promise<boolean> {
  const results = await db.batch([
    db
      .prepare(
        `UPDATE connected_accounts
            SET is_active = 0,
                access_token_encrypted = '',
                user_token_encrypted = NULL,
                user_token_expires_at = 0,
                updated_at = unixepoch()
          WHERE id = ? AND user_id = ? AND is_active = 1`
      )
      .bind(accountId, userId),
    // Payments keep their durable user_id; only the account attribution is
    // detached. This mirrors what ON DELETE SET NULL used to do, without
    // destroying the account row (and its automations/leads).
    db
      .prepare(
        `UPDATE payments SET account_id = NULL
          WHERE account_id = ? AND user_id = ?`
      )
      .bind(accountId, userId),
  ]);
  return (results[0]?.meta?.changes ?? 0) > 0;
}

/**
 * 19. Get all automations for an account.
 */
export async function getAutomationsForAccount(
  db: D1Database,
  accountId: AccountId
): Promise<ReelAutomation[]> {
  const { results } = await db
    .prepare(
      `SELECT id, account_id, instagram_media_id, reel_permalink, reel_thumbnail_url,
              trigger_keywords, comment_replies, follow_gate_enabled, template_card,
              is_active, created_at, updated_at, follow_up_enabled, follow_up_delay_minutes
       FROM reel_automations
       WHERE account_id = ?
       ORDER BY created_at DESC`
    )
    .bind(accountId)
    .all();

  return (results || []).map((row: any) => ({
    id: createAutomationId(row.id),
    accountId: createAccountId(row.account_id),
    instagramMediaId: createMediaId(row.instagram_media_id),
    reelPermalink: row.reel_permalink,
    reelThumbnailUrl: row.reel_thumbnail_url || undefined,
    triggerKeywords: JSON.parse(row.trigger_keywords),
    commentReplies: JSON.parse(row.comment_replies),
    templateCard: JSON.parse(row.template_card) as TemplateCardConfig,
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    followUpEnabled: Boolean(row.follow_up_enabled),
    followUpDelayMinutes: Number(row.follow_up_delay_minutes ?? 60),
  }));
}

/**
 * 20. Upsert Reel Automation Rule.
 */
export async function saveReelAutomation(
  db: D1Database,
  automation: {
    id: string;
    accountId: AccountId;
    instagramMediaId: MediaId;
    reelPermalink: string;
    reelThumbnailUrl?: string;
    triggerKeywords: string[];
    commentReplies: string[];
    templateCard: TemplateCardConfig;
    isActive: boolean;
    followUpEnabled?: boolean;
    followUpDelayMinutes?: number;
  }
): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  await db
    .prepare(
      `INSERT INTO reel_automations (
        id, account_id, instagram_media_id, reel_permalink, reel_thumbnail_url,
        trigger_keywords, comment_replies, follow_gate_enabled, template_card,
        is_active, created_at, updated_at, follow_up_enabled, follow_up_delay_minutes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT (id) DO UPDATE SET
        trigger_keywords = excluded.trigger_keywords,
        comment_replies = excluded.comment_replies,
        follow_gate_enabled = excluded.follow_gate_enabled,
        template_card = excluded.template_card,
        is_active = excluded.is_active,
        follow_up_enabled = excluded.follow_up_enabled,
        follow_up_delay_minutes = excluded.follow_up_delay_minutes,
        updated_at = excluded.updated_at`
    )
    .bind(
      automation.id,
      automation.accountId,
      automation.instagramMediaId,
      automation.reelPermalink,
      automation.reelThumbnailUrl || null,
      JSON.stringify(automation.triggerKeywords),
      JSON.stringify(automation.commentReplies),
      // The follower gate is retired: it called a Graph endpoint that does not
      // exist. The column stays for schema compatibility and is always 0.
      0,
      JSON.stringify(automation.templateCard),
      automation.isActive ? 1 : 0,
      now,
      now,
      automation.followUpEnabled ? 1 : 0,
      automation.followUpDelayMinutes ?? 60
    )
    .run();
}

/**
 * 21. Delete Reel Automation Rule.
 */
export async function deleteReelAutomation(
  db: D1Database,
  automationId: string,
  accountId: string
): Promise<boolean> {
  // `jobs.matched_automation_id` references this row. Older databases were
  // created without ON DELETE SET NULL, so detach the history first — in the
  // same transaction as the delete — then drop the automation. Historical jobs
  // stay intact and simply lose their rule pointer.
  const results = await db.batch([
    db
      .prepare(
        `UPDATE jobs
            SET matched_automation_id = NULL, updated_at = unixepoch()
          WHERE matched_automation_id = ? AND account_id = ?`
      )
      .bind(automationId, accountId),
    db
      .prepare(`DELETE FROM reel_automations WHERE id = ? AND account_id = ?`)
      .bind(automationId, accountId),
  ]);
  return (results[1]?.meta?.changes ?? 0) > 0;
}

/**
 * 22. Get Paginated Captured Leads with search.
 */
export async function getCapturedLeads(
  db: D1Database,
  accountId: AccountId,
  options: { search?: string; limit?: number; offset?: number } = {}
): Promise<{
  leads: Array<{
    id: string;
    accountId: AccountId;
    instagramScopedId: InstagramUserId;
    username?: string;
    /** `null` when unknown; older rows may still hold 0/1. */
    followerStatusAtTrigger: boolean | null;
    emailCollected?: string;
    totalDmsSent: number;
    firstInteractionAt: number;
    lastInteractionAt: number;
  }>;
  total: number;
}> {
  // Hard clamps: negative or oversized limits must never produce an
  // unbounded query (SQLite treats LIMIT -1 as "no limit").
  const limit = Math.max(1, Math.min(100, Math.floor(Number(options.limit)) || 50));
  const offset = Math.max(0, Math.min(100000, Math.floor(Number(options.offset)) || 0));
  const search = options.search?.trim().slice(0, 100);

  let query = `SELECT id, account_id, instagram_scoped_id, username,
                      follower_status_at_trigger, email_collected, total_dms_sent,
                      first_interaction_at, last_interaction_at
               FROM captured_leads
               WHERE account_id = ?`;
  let countQuery = `SELECT COUNT(*) as count FROM captured_leads WHERE account_id = ?`;
  const params: any[] = [accountId];
  const countParams: any[] = [accountId];

  if (search) {
    query += ` AND (username LIKE ? OR email_collected LIKE ?)`;
    countQuery += ` AND (username LIKE ? OR email_collected LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`);
    countParams.push(`%${search}%`, `%${search}%`);
  }

  query += ` ORDER BY last_interaction_at DESC LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  const [leadsRes, countRes] = await Promise.all([
    db.prepare(query).bind(...params).all(),
    db.prepare(countQuery).bind(...countParams).first() as Promise<any>,
  ]);

  const leads = (leadsRes.results || []).map((row: any) => ({
    id: row.id,
    accountId: createAccountId(row.account_id),
    instagramScopedId: createInstagramUserId(row.instagram_scoped_id),
    username: row.username || undefined,
    followerStatusAtTrigger:
      row.follower_status_at_trigger === null ||
      row.follower_status_at_trigger === undefined
        ? null
        : Boolean(row.follower_status_at_trigger),
    emailCollected: row.email_collected || undefined,
    totalDmsSent: row.total_dms_sent,
    firstInteractionAt: row.first_interaction_at,
    lastInteractionAt: row.last_interaction_at,
  }));

  return {
    leads,
    total: Number(countRes?.count || 0),
  };
}

/**
 * 23. Get all leads for 1-click CSV export.
 */
export async function getAllCapturedLeadsForExport(
  db: D1Database,
  accountId: AccountId
): Promise<Array<{
  id: string;
  username: string;
  instagramScopedId: string;
  followerStatusAtTrigger: string;
  emailCollected: string;
  totalDmsSent: number;
  firstInteractionAt: string;
  lastInteractionAt: string;
}>> {
  const { results } = await db
    .prepare(
      `SELECT id, username, instagram_scoped_id, follower_status_at_trigger,
              email_collected, total_dms_sent, first_interaction_at, last_interaction_at
       FROM captured_leads
       WHERE account_id = ?
       ORDER BY last_interaction_at DESC`
    )
    .bind(accountId)
    .all();

  return (results || []).map((row: any) => ({
    id: row.id,
    username: row.username || "anonymous",
    instagramScopedId: row.instagram_scoped_id,
    followerStatusAtTrigger:
      row.follower_status_at_trigger === null ||
      row.follower_status_at_trigger === undefined
        ? "Unknown"
        : row.follower_status_at_trigger
          ? "Follower"
          : "Non-Follower",
    emailCollected: row.email_collected || "",
    totalDmsSent: row.total_dms_sent,
    firstInteractionAt: new Date(row.first_interaction_at * 1000).toISOString(),
    lastInteractionAt: new Date(row.last_interaction_at * 1000).toISOString(),
  }));
}

/**
 * 24. Get Real-Time Analytics & Telemetry Summary.
 * Every number here is measured from real tables — no fabricated telemetry.
 */
export async function getAnalyticsSummary(
  db: D1Database,
  accountId: AccountId
): Promise<{
  status: "healthy" | "degraded" | "error";
  queueDepth: number;
  pendingJobs: number;
  completed24h: number;
  failed24h: number;
  totalLeads: number;
  totalComments: number;
  totalDmsSent: number;
  /** Every comment the webhook accepted, including ones still queued. */
  totalCommentsHeard: number;
  /** Comment-triggered DMs the Worker actually delivered. */
  totalDmsDelivered: number;
}> {
  const now = Math.floor(Date.now() / 1000);
  const oneDayAgo = now - 86400;

  const [pendingRow, completed24hRow, failed24hRow, leadsRow, commentsRow, heardRow] = (await Promise.all([
    db.prepare(`SELECT COUNT(*) as c FROM jobs WHERE account_id = ? AND status = 'pending'`).bind(accountId).first(),
    db.prepare(`SELECT COUNT(*) as c FROM jobs WHERE account_id = ? AND status = 'completed' AND updated_at >= ?`).bind(accountId, oneDayAgo).first(),
    db.prepare(`SELECT COUNT(*) as c FROM jobs WHERE account_id = ? AND status = 'failed' AND updated_at >= ?`).bind(accountId, oneDayAgo).first(),
    db.prepare(`SELECT COUNT(*) as c, SUM(total_dms_sent) as totalDms FROM captured_leads WHERE account_id = ?`).bind(accountId).first(),
    // Lifetime comments handled, not just the last 24 hours: follow-up DMs are
    // not comments, so they are excluded to keep the funnel honest.
    db
      .prepare(
        `SELECT COUNT(*) as c FROM jobs
         WHERE account_id = ? AND status = 'completed' AND is_follow_up = 0`
      )
      .bind(accountId)
      .first(),
    // The funnel's top stage is every comment the webhook accepted, queued or
    // not — "heard" and "answered" are different numbers and must stay so.
    db
      .prepare(`SELECT COUNT(*) as c FROM jobs WHERE account_id = ? AND is_follow_up = 0`)
      .bind(accountId)
      .first(),
  ])) as any[];

  const pendingJobs = Number(pendingRow?.c || 0);
  const completed24h = Number(completed24hRow?.c || 0);
  const failed24h = Number(failed24hRow?.c || 0);
  const totalLeads = Number(leadsRow?.c || 0);
  const totalDmsSent = Number(leadsRow?.totalDms || 0);
  const totalComments = Number(commentsRow?.c || 0);
  const totalCommentsHeard = Number(heardRow?.c || 0);

  const status = failed24h > 20 ? "degraded" : "healthy";

  return {
    status,
    queueDepth: pendingJobs,
    pendingJobs,
    completed24h,
    failed24h,
    totalLeads,
    totalComments,
    totalDmsSent,
    totalCommentsHeard,
    // A comment job that completed is a DM that went out: one dispatch per
    // comment, which is exactly what the funnel's middle stage means.
    totalDmsDelivered: totalComments,
  };
}

/**
 * 25a. Daily activity for the last N days.
 *
 * The dashboard needs a sparkline per funnel stage, and a sparkline drawn from
 * invented numbers is worse than no sparkline at all. These three grouped
 * counts are cheap (each hits an existing index) and always return exactly
 * `days` buckets, zero-filled, so the chart has no holes.
 */
export interface DailyPoint {
  /** UTC day, YYYY-MM-DD. */
  day: string;
  comments: number;
  dms: number;
  leads: number;
}

export async function getDailyActivity(
  db: D1Database,
  accountId: AccountId,
  days = 14
): Promise<DailyPoint[]> {
  const since = Math.floor(Date.now() / 1000) - days * 86400;

  const [commentsRes, dmsRes, leadsRes] = await Promise.all([
    db
      .prepare(
        `SELECT date(created_at, 'unixepoch') AS day, COUNT(*) AS c
         FROM jobs
         WHERE account_id = ? AND created_at >= ? AND is_follow_up = 0
         GROUP BY day`
      )
      .bind(accountId, since)
      .all(),
    db
      .prepare(
        `SELECT date(updated_at, 'unixepoch') AS day, COUNT(*) AS c
         FROM jobs
         WHERE account_id = ? AND status = 'completed' AND updated_at >= ?
         GROUP BY day`
      )
      .bind(accountId, since)
      .all(),
    db
      .prepare(
        `SELECT date(first_interaction_at, 'unixepoch') AS day, COUNT(*) AS c
         FROM captured_leads
         WHERE account_id = ? AND first_interaction_at >= ?
         GROUP BY day`
      )
      .bind(accountId, since)
      .all(),
  ]);

  /* SQLite groups in UTC and the JS below walks UTC days too, so the two
     agree on what "a day" is regardless of the viewer's timezone. */
  const bucket = (rows: unknown[]) => {
    const map = new Map<string, number>();
    for (const row of rows as Array<{ day: string; c: number }>) {
      if (row?.day) map.set(row.day, Number(row.c || 0));
    }
    return map;
  };

  const comments = bucket(commentsRes.results ?? []);
  const dms = bucket(dmsRes.results ?? []);
  const leads = bucket(leadsRes.results ?? []);

  const out: DailyPoint[] = [];
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const day = new Date(Date.now() - offset * 86400_000).toISOString().slice(0, 10);
    out.push({
      day,
      comments: comments.get(day) ?? 0,
      dms: dms.get(day) ?? 0,
      leads: leads.get(day) ?? 0,
    });
  }
  return out;
}

/**
 * 25b. The live activity stream.
 *
 * One row per comment the Worker has heard, joined to the automation that
 * claimed it. This is the audit trail the dashboard's feed renders — status is
 * the real job status, never a decoration.
 */
export interface ActivityEvent {
  id: string;
  username: string;
  comment: string;
  status: "pending" | "processing" | "completed" | "failed";
  /** unix seconds */
  at: number;
  triggerKeywords: string[];
  isFollowUp: boolean;
}

export async function getRecentActivity(
  db: D1Database,
  accountId: AccountId,
  limit = 12
): Promise<ActivityEvent[]> {
  const { results } = await db
    .prepare(
      `SELECT j.id, j.commenter_username, j.comment_text, j.status,
              j.created_at, j.is_follow_up, a.trigger_keywords
       FROM jobs j
       LEFT JOIN reel_automations a ON a.id = j.matched_automation_id
       WHERE j.account_id = ?
       ORDER BY j.created_at DESC
       LIMIT ?`
    )
    .bind(accountId, Math.min(Math.max(limit, 1), 50))
    .all();

  return (results ?? []).map((row: any) => {
    let keywords: string[] = [];
    try {
      const parsed = JSON.parse(String(row.trigger_keywords ?? "[]"));
      if (Array.isArray(parsed)) keywords = parsed.map((k) => String(k)).slice(0, 3);
    } catch {
      keywords = [];
    }
    return {
      id: String(row.id),
      username: String(row.commenter_username ?? "unknown"),
      comment: String(row.comment_text ?? ""),
      status: String(row.status ?? "pending") as ActivityEvent["status"],
      at: Number(row.created_at ?? 0),
      triggerKeywords: keywords,
      isFollowUp: Number(row.is_follow_up ?? 0) === 1,
    };
  });
}

/**
 * 25. Fetch a connected account ONLY when it belongs to the given user.
 * This is the ownership gate every account-scoped dashboard route must pass
 * through — prevents cross-tenant access (IDOR).
 */
export async function getOwnedAccount(
  db: D1Database,
  accountId: AccountId,
  userId: string
): Promise<AccountRecord | null> {
  const row = (await db
    .prepare(
      `SELECT id, instagram_user_id, username, access_token_encrypted, token_expires_at, is_active,
              plan, ai_credits_remaining, ai_credits_reset_at, free_reel_consumed
       FROM connected_accounts
       WHERE id = ? AND user_id = ? AND is_active = 1
       LIMIT 1`
    )
    .bind(accountId, userId)
    .first()) as any;

  if (!row) return null;

  return {
    id: createAccountId(row.id),
    instagramUserId: createInstagramUserId(row.instagram_user_id),
    username: row.username,
    accessTokenEncrypted: row.access_token_encrypted,
    tokenExpiresAt: row.token_expires_at,
    isActive: Boolean(row.is_active),
    plan: row.plan,
    aiCreditsRemaining: Number(row.ai_credits_remaining ?? 0),
    aiCreditsResetAt: Number(row.ai_credits_reset_at ?? 0),
    freeReelConsumed: Boolean(row.free_reel_consumed),
  };
}

/**
 * 26. Look up which user owns an Instagram business account binding.
 * Used to reject OAuth re-binding attempts by a different user.
 */
export async function getAccountOwnership(
  db: D1Database,
  instagramUserId: string
): Promise<{ userId: string; accountId: AccountId } | null> {
  const row = (await db
    .prepare(
      `SELECT id, user_id FROM connected_accounts WHERE instagram_user_id = ? LIMIT 1`
    )
    .bind(instagramUserId)
    .first()) as any;

  if (!row) return null;
  return { userId: row.user_id, accountId: createAccountId(row.id) };
}

/**
 * 27. Requeue jobs stuck in 'processing' past the lease window (cron isolate
 * died mid-dispatch). Called at the top of every cron run before polling.
 */
export async function requeueStaleProcessingJobs(
  db: D1Database,
  staleAfterSeconds = 300
): Promise<number> {
  const now = Math.floor(Date.now() / 1000);
  const res = await db
    .prepare(
      `UPDATE jobs
       SET status = 'pending', updated_at = ?
       WHERE status = 'processing' AND updated_at < ?`
    )
    .bind(now, now - staleAfterSeconds)
    .run();
  return res.meta?.changes ?? 0;
}

/**
 * 28. Persist the public comment reply ID so a retried job never posts a
 * second public reply (Meta visible-duplication / spam-flag protection).
 */
export async function markJobPublicReplyId(
  db: D1Database,
  jobId: JobId,
  replyId: string
): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  await db
    .prepare(`UPDATE jobs SET public_reply_id = ?, updated_at = ? WHERE id = ?`)
    .bind(replyId, now, jobId)
    .run();
}

/**
 * 29. Count active automations on an account (tier limits).
 */
export async function countActiveAutomations(
  db: D1Database,
  accountId: AccountId
): Promise<number> {
  const row = (await db
    .prepare(`SELECT COUNT(*) as c FROM reel_automations WHERE account_id = ? AND is_active = 1`)
    .bind(accountId)
    .first()) as any;
  return Number(row?.c || 0);
}

/**
 * 30. Burn the free-tier lifetime reel slot (plan.md §3 — one reel, ever).
 */
export async function markFreeReelConsumed(db: D1Database, accountId: AccountId): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  const userSubquery = `(SELECT user_id FROM connected_accounts WHERE id = ?)`;
  await db.batch([
    db
      .prepare(`UPDATE users SET free_reel_consumed = 1 WHERE id = ${userSubquery}`)
      .bind(accountId),
    db
      .prepare(
        `UPDATE connected_accounts
            SET free_reel_consumed = 1, updated_at = ?
          WHERE user_id = (SELECT user_id FROM connected_accounts WHERE id = ?)`
      )
      .bind(now, accountId),
  ]);
}

/**
 * 31. Replace the short links for an automation (Sent → Clicked tracking).
 * Called on every automation save — buttons may have changed.
 */
export async function replaceShortLinks(
  db: D1Database,
  automationId: string,
  accountId: AccountId,
  targets: string[]
): Promise<void> {
  // Preserve ids for buttons whose target did not change. Re-issuing ids on
  // every save would 404 every /l/ link already sitting in a delivered DM and
  // would reset its click history. A changed target reuses the id too, so
  // in-flight DMs keep working and simply point at the new URL.
  const existing = await getShortLinksForAutomation(db, automationId);
  const byIndex = new Map(existing.map((link) => [link.buttonIndex, link]));

  const statements: D1PreparedStatement[] = [];
  for (let i = 0; i < targets.length; i++) {
    const previous = byIndex.get(i);
    byIndex.delete(i);
    if (previous && previous.targetUrl === targets[i]) continue;

    statements.push(
      db
        .prepare(
          `INSERT INTO short_links (id, account_id, automation_id, button_index, target_url)
           VALUES (?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET
             button_index = excluded.button_index,
             target_url = excluded.target_url`
        )
        .bind(previous?.id ?? crypto.randomUUID(), accountId, automationId, i, targets[i])
    );
  }

  // Buttons that no longer exist: their links should stop resolving.
  for (const stale of byIndex.values()) {
    statements.push(db.prepare(`DELETE FROM short_links WHERE id = ?`).bind(stale.id));
  }

  if (statements.length > 0) await db.batch(statements);
}

/**
 * 32. Fetch all short links for an automation, keyed by button order.
 */
export async function getShortLinksForAutomation(
  db: D1Database,
  automationId: string
): Promise<Array<{ id: string; buttonIndex: number; targetUrl: string; clickCount: number }>> {
  const { results } = await db
    .prepare(
      `SELECT id, button_index, target_url, click_count
       FROM short_links WHERE automation_id = ? ORDER BY button_index ASC`
    )
    .bind(automationId)
    .all();
  return (results || []).map((row: any) => ({
    id: row.id,
    buttonIndex: Number(row.button_index),
    targetUrl: row.target_url,
    clickCount: Number(row.click_count || 0),
  }));
}

/**
 * 33. Click redirect lookup + atomic increment.
 */
export async function getAndTrackShortLink(
  db: D1Database,
  linkId: string
): Promise<{ targetUrl: string } | null> {
  const row = (await db
    .prepare(`SELECT target_url FROM short_links WHERE id = ? LIMIT 1`)
    .bind(linkId)
    .first()) as any;
  if (!row) return null;
  await db
    .prepare(`UPDATE short_links SET click_count = click_count + 1 WHERE id = ?`)
    .bind(linkId)
    .run();
  return { targetUrl: row.target_url };
}

/**
 * 34. Aggregated click stats for an account (analytics endpoint).
 */
export async function getAccountClickStats(
  db: D1Database,
  accountId: AccountId
): Promise<{ totalClicks: number; linkCount: number }> {
  const row = (await db
    .prepare(
      `SELECT COALESCE(SUM(click_count), 0) as clicks, COUNT(*) as links
       FROM short_links WHERE account_id = ?`
    )
    .bind(accountId)
    .first()) as any;
  return { totalClicks: Number(row?.clicks || 0), linkCount: Number(row?.links || 0) };
}

/**
 * 35. Enqueue a follow-up DM (plan.md §4.2 — Pro/Studio only, one per original DM).
 */
export async function insertFollowUpJob(
  db: D1Database,
  job: {
    id: JobId;
    accountId: AccountId;
    commenterUserId: InstagramUserId;
    commenterUsername: string;
    postId: MediaId;
    matchedAutomationId: AutomationId;
    parentJobId: JobId;
    sendAt: number;
  }
): Promise<boolean> {
  // `jobs.comment_id` is the atomic dedupe key and is UNIQUE NOT NULL, so a
  // follow-up cannot reuse the parent's comment id (that is exactly why the
  // old INSERT OR IGNORE silently inserted zero rows). A synthetic key,
  // derived from the parent job, is unique per follow-up and still idempotent
  // if the parent's completion path runs twice.
  const result = await db
    .prepare(
      `INSERT OR IGNORE INTO jobs (
        id, account_id, comment_id, commenter_user_id, commenter_username,
        comment_text, post_id, matched_automation_id, send_at, status,
        parent_job_id, is_follow_up
      ) VALUES (?, ?, ?, ?, ?, '__follow_up__', ?, ?, ?, 'pending', ?, 1)`
    )
    .bind(
      job.id,
      job.accountId,
      `followup:${job.parentJobId}`,
      job.commenterUserId,
      job.commenterUsername,
      job.postId,
      job.matchedAutomationId,
      job.sendAt,
      job.parentJobId
    )
    .run();
  return (result.meta?.changes ?? 0) > 0;
}

/**
 * Follow-ups and campaign sends go to `recipient.id`, which Meta only permits
 * inside an open 24-hour window. A lead who has messaged us is anchored on
 * that inbound message; otherwise the private reply to their comment is the
 * anchor (recorded as `first_interaction_at`).
 */
export async function getLeadMessagingAnchor(
  db: D1Database,
  accountId: AccountId,
  instagramScopedId: InstagramUserId
): Promise<number> {
  const row = (await db
    .prepare(
      `SELECT last_inbound_at, first_interaction_at FROM captured_leads
       WHERE account_id = ? AND instagram_scoped_id = ? LIMIT 1`
    )
    .bind(accountId, instagramScopedId)
    .first()) as any;
  return Number(row?.last_inbound_at || 0) || Number(row?.first_interaction_at || 0) || 0;
}

/**
 * 36. Record inbound DM time per lead — the 24h-window anchor and the
 * "has this lead replied since our DM?" follow-up condition.
 */
export async function markLeadInbound(
  db: D1Database,
  accountId: AccountId,
  instagramScopedId: InstagramUserId
): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  await db
    .prepare(
      `UPDATE captured_leads SET last_inbound_at = ? WHERE account_id = ? AND instagram_scoped_id = ?`
    )
    .bind(now, accountId, instagramScopedId)
    .run();
}

/**
 * 37. Did the lead message us since the parent DM completed? (follow-up gate)
 */
export async function hasLeadRepliedSince(
  db: D1Database,
  accountId: AccountId,
  instagramScopedId: InstagramUserId,
  sinceTs: number
): Promise<boolean> {
  const row = (await db
    .prepare(
      `SELECT last_inbound_at FROM captured_leads
       WHERE account_id = ? AND instagram_scoped_id = ? LIMIT 1`
    )
    .bind(accountId, instagramScopedId)
    .first()) as any;
  return Number(row?.last_inbound_at || 0) >= sinceTs;
}

/**
 * 38. Retention purge (plan.md §5) — keeps D1 growth flat:
 * comment text >72h (matching happens at ingest), completed/failed
 * jobs >30d, webhook logs >7d. Commenter identity rows live forever.
 */
export async function purgeRetentionData(
  db: D1Database
): Promise<{
  textsPurged: number;
  jobsDeleted: number;
  logsDeleted: number;
  midsDeleted: number;
  aiStateDeleted: number;
  takeoversDeleted: number;
  sessionsDeleted: number;
}> {
  const now = Math.floor(Date.now() / 1000);
  const texts = await db
    .prepare(
      `UPDATE jobs SET comment_text = '' WHERE comment_text != '' AND updated_at < ?`
    )
    .bind(now - 72 * 3600)
    .run();
  const jobs = await db
    .prepare(
      `DELETE FROM jobs WHERE status IN ('completed', 'failed') AND updated_at < ?`
    )
    .bind(now - 30 * 86400)
    .run();
  const logs = await db
    .prepare(`DELETE FROM webhook_logs WHERE created_at < ?`)
    .bind(now - 7 * 86400)
    .run();
  // The mid ledger only needs to outlive webhook retries; the AI clock and the
  // takeover pause are shorter still. Left unpruned, all three grow forever.
  // Each delete is independent and tolerated-on-failure: an older database that
  // has not applied migration 005 should still purge jobs and logs.
  const mids = await db
    .prepare(`DELETE FROM message_mids WHERE created_at < ?`)
    .bind(now - 7 * 86400)
    .run()
    .catch(() => null);
  const aiState = await db
    .prepare(`DELETE FROM ai_thread_state WHERE last_inbound_at < ?`)
    .bind(now - 7 * 86400)
    .run()
    .catch(() => null);
  const takeovers = await db
    .prepare(`DELETE FROM human_takeovers WHERE paused_until < ?`)
    .bind(now - 86400)
    .run()
    .catch(() => null);
  // Revoked/expired sessions are dead weight; removing them keeps the auth
  // lookup small (and a pre-007 database simply skips this).
  const sessions = await db
    .prepare(
      `DELETE FROM sessions
        WHERE expires_at < ?
           OR (revoked_at IS NOT NULL AND revoked_at < ?)`
    )
    .bind(now, now - 7 * 86400)
    .run()
    .catch(() => null);
  return {
    textsPurged: texts.meta?.changes ?? 0,
    jobsDeleted: jobs.meta?.changes ?? 0,
    logsDeleted: logs.meta?.changes ?? 0,
    midsDeleted: mids?.meta?.changes ?? 0,
    aiStateDeleted: aiState?.meta?.changes ?? 0,
    takeoversDeleted: takeovers?.meta?.changes ?? 0,
    sessionsDeleted: sessions?.meta?.changes ?? 0,
  };
}

/**
 * 39. Storage gauge for Settings (rough row counts, ~300B/row estimate).
 */
export async function getAccountStorageRows(
  db: D1Database,
  accountId: AccountId
): Promise<number> {
  const row = (await db
    .prepare(
      `SELECT
         (SELECT COUNT(*) FROM jobs WHERE account_id = ?) +
         (SELECT COUNT(*) FROM captured_leads WHERE account_id = ?) +
         (SELECT COUNT(*) FROM webhook_logs WHERE account_id = ?) +
         (SELECT COUNT(*) FROM short_links WHERE account_id = ?) as total`
    )
    .bind(accountId, accountId, accountId, accountId)
    .first()) as any;
  return Number(row?.total || 0);
}

/**
 * 40. Monthly AI credit reset (plan.md §4.4): called on account reads.
 * Free 3 / Pro 500 / Studio 5000, non-cumulative, 30-day cycle.
 */
export const TIER_CREDIT_LIMITS: Record<string, number> = {
  free: 3,
  pro: 500,
  studio: 5000,
};

export async function resetMonthlyCreditsIfDue(
  db: D1Database,
  account: AccountRecord
): Promise<AccountRecord> {
  const now = Math.floor(Date.now() / 1000);
  if (account.aiCreditsResetAt > now) return account;

  const limit = TIER_CREDIT_LIMITS[account.plan] ?? 3;
  const nextReset = now + 30 * 86400;
  await db.batch([
    db
      .prepare(
        `UPDATE users SET ai_credits_remaining = ?, ai_credits_reset_at = ?
          WHERE id = (SELECT user_id FROM connected_accounts WHERE id = ?)`
      )
      .bind(limit, nextReset, account.id),
    db
      .prepare(
        `UPDATE connected_accounts SET ai_credits_remaining = ?, ai_credits_reset_at = ?
          WHERE user_id = (SELECT user_id FROM connected_accounts WHERE id = ?)`
      )
      .bind(limit, nextReset, account.id),
    db
      .prepare(`INSERT INTO credit_ledger (id, account_id, delta, reason) VALUES (?, ?, ?, ?)`)
      .bind(crypto.randomUUID(), account.id, limit, `monthly_reset_${account.plan}`),
  ]);

  return { ...account, aiCreditsRemaining: limit, aiCreditsResetAt: nextReset };
}

/**
 * 41. Atomically spend one AI credit. Returns false when exhausted.
 */
export async function spendAiCredit(db: D1Database, accountId: AccountId): Promise<boolean> {
  // Creditors are pooled per user, so the decrement must target users — using
  // the per-account mirror would let a second account spend from a stale
  // balance. The mirror is refreshed in the same batch.
  const res = await db
    .prepare(
      `UPDATE users
          SET ai_credits_remaining = ai_credits_remaining - 1
        WHERE id = (SELECT user_id FROM connected_accounts WHERE id = ?)
          AND ai_credits_remaining > 0`
    )
    .bind(accountId)
    .run();
  const spent = (res.meta?.changes ?? 0) > 0;
  if (spent) {
    await db.batch([
      db
        .prepare(
          `UPDATE connected_accounts
              SET ai_credits_remaining = (SELECT ai_credits_remaining FROM users WHERE id = user_id)
            WHERE user_id = (SELECT user_id FROM connected_accounts WHERE id = ?)`
        )
        .bind(accountId),
      db
        .prepare(`INSERT INTO credit_ledger (id, account_id, delta, reason) VALUES (?, ?, ?, ?)`)
        .bind(crypto.randomUUID(), accountId, -1, "ai_reply"),
    ]);
  }
  return spent;
}

/**
 * 42. Owner-activated payment → set plan on the USER row and grant the tier's
 * monthly credits immediately.
 *
 * `expiresAt` is optional so existing callers (and grandfathered/comped plans)
 * keep the old "no expiry recorded" behaviour. Paid call sites pass a real
 * timestamp; cron then downgrades the account when it lapses.
 */
export async function activatePlanForUser(
  db: D1Database,
  userId: string,
  plan: "pro" | "studio",
  expiresAt?: number
): Promise<number> {
  const now = Math.floor(Date.now() / 1000);
  const limit = TIER_CREDIT_LIMITS[plan] ?? 3;
  const resetAt =
    typeof expiresAt === "number" && expiresAt > now ? expiresAt : now + 30 * 86400;

  // The plan belongs to the user row. The mirrored columns on
  // connected_accounts are kept in sync for backwards compatibility only.
  const userStatement =
    typeof expiresAt === "number"
      ? db
          .prepare(
            `UPDATE users
                SET plan = ?, ai_credits_remaining = ?, ai_credits_reset_at = ?, plan_expires_at = ?
              WHERE id = ?`
          )
          .bind(plan, limit, resetAt, Math.floor(expiresAt), userId)
      : db
          .prepare(
            `UPDATE users SET plan = ?, ai_credits_remaining = ?, ai_credits_reset_at = ? WHERE id = ?`
          )
          .bind(plan, limit, resetAt, userId);

  const results = await db.batch([
    userStatement,
    db
      .prepare(
        `UPDATE connected_accounts
            SET plan = ?, ai_credits_remaining = ?, ai_credits_reset_at = ?, updated_at = ?
          WHERE user_id = ?`
      )
      .bind(plan, limit, resetAt, now, userId),
  ]);

  const { results: accounts } = await db
    .prepare(`SELECT id FROM connected_accounts WHERE user_id = ?`)
    .bind(userId)
    .all();
  const ledger: D1PreparedStatement[] = [];
  for (const row of accounts || []) {
    ledger.push(
      db
        .prepare(`INSERT INTO credit_ledger (id, account_id, delta, reason) VALUES (?, ?, ?, ?)`)
        .bind(crypto.randomUUID(), (row as any).id, limit, `plan_activated_${plan}`)
    );
  }
  if (ledger.length > 0) await db.batch(ledger);

  return results[0]?.meta?.changes ?? 0;
}

/**
 * 42b. Move only the expiry. Used when a subscription is cancelled: the
 * creator keeps the plan they already paid for until the period ends.
 */
export async function setPlanExpiry(
  db: D1Database,
  userId: string,
  expiresAt: number
): Promise<boolean> {
  const res = await db
    .prepare(`UPDATE users SET plan_expires_at = ? WHERE id = ?`)
    .bind(Math.floor(expiresAt), userId)
    .run();
  return (res.meta?.changes ?? 0) > 0;
}

/**
 * 42c. Record a provider payment exactly once.
 *
 * `(provider, external_ref)` is UNIQUE, so a retried Lemon Squeezy webhook
 * cannot grant a second month. Returns `inserted: false` for a duplicate and
 * the existing row id.
 */
export async function recordBillingPayment(
  db: D1Database,
  payment: {
    userId: string;
    accountId?: string | null;
    provider: "lemon_squeezy" | "manual_upi";
    externalRef: string;
    plan: "pro" | "studio";
    amountInr: number;
    status?: "pending" | "verified" | "rejected";
  }
): Promise<{ inserted: boolean; id: string }> {
  const id = crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);
  const status = payment.status ?? "verified";
  const res = await db
    .prepare(
      `INSERT OR IGNORE INTO payments
         (id, account_id, user_id, provider, external_ref, plan, amount_inr, status, verified_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      payment.accountId ?? null,
      payment.userId,
      payment.provider,
      payment.externalRef,
      payment.plan,
      payment.amountInr,
      status,
      status === "verified" ? now : null
    )
    .run();

  if ((res.meta?.changes ?? 0) > 0) {
    return { inserted: true, id };
  }

  const existing = (await db
    .prepare(
      `SELECT id FROM payments WHERE provider = ? AND external_ref = ? LIMIT 1`
    )
    .bind(payment.provider, payment.externalRef)
    .first()) as any;
  return { inserted: false, id: existing?.id ?? id };
}

/** Full billing state from the canonical `users` row. */
export async function getUserBilling(
  db: D1Database,
  userId: string
): Promise<{
  plan: "free" | "pro" | "studio";
  aiCreditsRemaining: number;
  aiCreditsResetAt: number;
  freeReelConsumed: number;
  planExpiresAt: number;
} | null> {
  let row: any;
  try {
    row = (await db
      .prepare(
        `SELECT plan, ai_credits_remaining, ai_credits_reset_at,
                free_reel_consumed, plan_expires_at
         FROM users WHERE id = ? LIMIT 1`
      )
      .bind(userId)
      .first()) as any;
  } catch {
    // A Worker deployed ahead of migration 006 must still be able to read the
    // plan; only the expiry field is unknown, and 0 means "no expiry".
    row = (await db
      .prepare(
        `SELECT plan, ai_credits_remaining, ai_credits_reset_at, free_reel_consumed
         FROM users WHERE id = ? LIMIT 1`
      )
      .bind(userId)
      .first()) as any;
  }
  if (!row) return null;
  return {
    plan: row.plan === "studio" || row.plan === "pro" ? row.plan : "free",
    aiCreditsRemaining: Number(row.ai_credits_remaining ?? 0),
    aiCreditsResetAt: Number(row.ai_credits_reset_at ?? 0),
    freeReelConsumed: Number(row.free_reel_consumed ?? 0),
    planExpiresAt: Number(row.plan_expires_at ?? 0),
  };
}

/**
 * 42d. Downgrade one user if their paid plan has lapsed.
 *
 * Returns true when a downgrade happened. `plan_expires_at = 0` is deliberate:
 * it means "grandfathered / no expiry", never "expired long ago".
 */
export async function expirePlanForUserIfDue(
  db: D1Database,
  userId: string
): Promise<boolean> {
  const now = Math.floor(Date.now() / 1000);
  let row: any;
  try {
    row = (await db
      .prepare(
        `SELECT plan, plan_expires_at FROM users WHERE id = ? LIMIT 1`
      )
      .bind(userId)
      .first()) as any;
  } catch {
    // Pre-006 database: there is no expiry column, so nothing can be due.
    return false;
  }
  if (!row) return false;
  const plan = row.plan === "studio" || row.plan === "pro" ? row.plan : "free";
  const expiresAt = Number(row.plan_expires_at ?? 0);
  if (plan === "free" || expiresAt <= 0 || expiresAt > now) return false;

  const limit = TIER_CREDIT_LIMITS.free;
  const nextReset = now + 30 * 86400;
  await db.batch([
    db
      .prepare(
        `UPDATE users
            SET plan = 'free', ai_credits_remaining = ?, ai_credits_reset_at = ?,
                plan_expires_at = 0
          WHERE id = ?`
      )
      .bind(limit, nextReset, userId),
    db
      .prepare(
        `UPDATE connected_accounts
            SET plan = 'free', ai_credits_remaining = ?, ai_credits_reset_at = ?,
                updated_at = ?
          WHERE user_id = ?`
      )
      .bind(limit, nextReset, now, userId),
  ]);
  return true;
}

/** Cron entry point: downgrade up to `limit` lapsed plans per tick. */
export async function expireDuePlans(
  db: D1Database,
  limit = 100
): Promise<number> {
  const now = Math.floor(Date.now() / 1000);
  let due: Array<{ id: string }> = [];
  try {
    const { results } = await db
      .prepare(
        `SELECT id FROM users
          WHERE plan != 'free' AND plan_expires_at > 0 AND plan_expires_at <= ?
          ORDER BY plan_expires_at ASC
          LIMIT ?`
      )
      .bind(now, limit)
      .all();
    due = (results || []) as Array<{ id: string }>;
  } catch {
    // A database that has not applied migration 006 yet keeps its plans; the
    // next stage in cron still runs and the deploy is not stuck on this one.
    return 0;
  }

  let expired = 0;
  for (const row of due) {
    if (await expirePlanForUserIfDue(db, row.id)) expired++;
  }
  return expired;
}

/* ══════════════════════════════════════════════════════════════════════
   39. PRODUCTS LIBRARY (plan.md §4.4 / §5)
   Knowledge base for AI product-Q&A and the link-in-bio page. The whole
   catalog must fit in a single prompt at MVP, so writes are capped at 50
   rows per account — enforced by countProductsForAccount in the router.
   ══════════════════════════════════════════════════════════════════════ */

export interface ProductRow {
  id: string;
  accountId: AccountId;
  name: string;
  priceText?: string;
  description?: string;
  link?: string;
  imageUrl?: string;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

function mapProductRow(row: any): ProductRow {
  return {
    id: row.id as string,
    accountId: createAccountId(row.account_id as string),
    name: row.name as string,
    priceText: (row.price_text as string) || undefined,
    description: (row.description as string) || undefined,
    link: (row.link as string) || undefined,
    imageUrl: (row.image_url as string) || undefined,
    isActive: Number(row.is_active) === 1,
    createdAt: Number(row.created_at || 0),
    updatedAt: Number(row.updated_at || 0),
  };
}

export async function getProductsForAccount(
  db: D1Database,
  accountId: AccountId,
  activeOnly = false
): Promise<ProductRow[]> {
  const sql = activeOnly
    ? `SELECT id, account_id, name, price_text, description, link, image_url, is_active, created_at, updated_at
       FROM products WHERE account_id = ? AND is_active = 1 ORDER BY created_at DESC LIMIT 50`
    : `SELECT id, account_id, name, price_text, description, link, image_url, is_active, created_at, updated_at
       FROM products WHERE account_id = ? ORDER BY created_at DESC LIMIT 50`;
  const { results } = await db.prepare(sql).bind(accountId).all();
  return (results || []).map(mapProductRow);
}

export async function countProductsForAccount(
  db: D1Database,
  accountId: AccountId
): Promise<number> {
  const row = await db
    .prepare(`SELECT COUNT(*) AS n FROM products WHERE account_id = ?`)
    .bind(accountId)
    .first<{ n: number }>();
  return Number(row?.n || 0);
}

export async function getProductById(
  db: D1Database,
  productId: string,
  accountId: AccountId
): Promise<ProductRow | null> {
  const row = await db
    .prepare(
      `SELECT id, account_id, name, price_text, description, link, image_url, is_active, created_at, updated_at
       FROM products WHERE id = ? AND account_id = ?`
    )
    .bind(productId, accountId)
    .first<any>();
  return row ? mapProductRow(row) : null;
}

export interface ProductInput {
  name: string;
  priceText?: string;
  description?: string;
  link?: string;
  imageUrl?: string;
  isActive: boolean;
}

export async function insertProduct(
  db: D1Database,
  accountId: AccountId,
  input: ProductInput
): Promise<ProductRow> {
  const id = crypto.randomUUID();
  await db
    .prepare(
      `INSERT INTO products (id, account_id, name, price_text, description, link, image_url, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      accountId,
      input.name,
      input.priceText ?? null,
      input.description ?? null,
      input.link ?? null,
      input.imageUrl ?? null,
      input.isActive ? 1 : 0
    )
    .run();
  const created = await getProductById(db, id, accountId);
  if (!created) throw new Error("Product insert did not persist");
  return created;
}

export async function updateProduct(
  db: D1Database,
  productId: string,
  accountId: AccountId,
  input: ProductInput
): Promise<ProductRow | null> {
  // Ownership is enforced by scoping the UPDATE to the account.
  await db
    .prepare(
      `UPDATE products
       SET name = ?, price_text = ?, description = ?, link = ?, image_url = ?, is_active = ?, updated_at = unixepoch()
       WHERE id = ? AND account_id = ?`
    )
    .bind(
      input.name,
      input.priceText ?? null,
      input.description ?? null,
      input.link ?? null,
      input.imageUrl ?? null,
      input.isActive ? 1 : 0,
      productId,
      accountId
    )
    .run();
  return getProductById(db, productId, accountId);
}

export async function deleteProduct(
  db: D1Database,
  productId: string,
  accountId: AccountId
): Promise<boolean> {
  const res = await db
    .prepare(`DELETE FROM products WHERE id = ? AND account_id = ?`)
    .bind(productId, accountId)
    .run();
  return (res.meta?.changes ?? 0) > 0;
}

// =====================================================================
// 41. CAMPAIGNS (plan.md §4.3 / Phase 3) — Pro/Studio only
// =====================================================================

export interface CampaignRow {
  id: string;
  accountId: AccountId;
  mediaId: string;
  payload: unknown;
  status: "draft" | "scheduled" | "sending" | "completed" | "failed" | "cancelled";
  scheduledAt: number;
  sentCount: number;
  failedCount: number;
  unreachableCount: number;
  usesHumanAgentTag: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface CampaignTargetRow {
  id: string;
  campaignId: string;
  leadId: LeadId;
  status: "pending" | "sent" | "failed" | "unreachable";
  failureReason?: string;
  dispatchedMid?: string;
  sentAt?: number;
}

export interface CampaignInput {
  mediaId: string;
  payload: unknown;
  status?: CampaignRow["status"];
  scheduledAt?: number;
  usesHumanAgentTag?: boolean;
}

/**
 * Meta's 24-hour messaging window (plan.md §4.3). A lead is sendable only while
 * `captured_leads.last_inbound_at` is within 24h of now. A lead who has never
 * messaged us has last_inbound_at = 0 — for them the window was opened by our
 * reply to their comment, so first_interaction_at is the anchor.
 */
export const META_MESSAGING_WINDOW_SECONDS = 24 * 60 * 60;

function mapCampaignRow(row: any): CampaignRow {
  let payload: unknown = null;
  try {
    payload = JSON.parse(row.payload_json);
  } catch {
    payload = null;
  }
  return {
    id: row.id,
    accountId: createAccountId(row.account_id),
    mediaId: row.media_id,
    payload,
    status: row.status,
    scheduledAt: Number(row.scheduled_at || 0),
    sentCount: Number(row.sent_count || 0),
    failedCount: Number(row.failed_count || 0),
    unreachableCount: Number(row.unreachable_count || 0),
    usesHumanAgentTag: Boolean(row.uses_human_agent_tag),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getCampaignsForAccount(
  db: D1Database,
  accountId: AccountId
): Promise<CampaignRow[]> {
  const { results } = await db
    .prepare(
      `SELECT * FROM campaigns
       WHERE account_id = ?
       ORDER BY created_at DESC`
    )
    .bind(accountId)
    .all();

  return (results || []).map(mapCampaignRow);
}

export async function getCampaignById(
  db: D1Database,
  campaignId: string,
  accountId: AccountId
): Promise<CampaignRow | null> {
  const row = (await db
    .prepare(`SELECT * FROM campaigns WHERE id = ? AND account_id = ? LIMIT 1`)
    .bind(campaignId, accountId)
    .first()) as any;
  return row ? mapCampaignRow(row) : null;
}

export async function insertCampaign(
  db: D1Database,
  campaignId: string,
  accountId: AccountId,
  input: CampaignInput
): Promise<CampaignRow> {
  await db
    .prepare(
      `INSERT INTO campaigns (id, account_id, media_id, payload_json, status, scheduled_at, uses_human_agent_tag)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      campaignId,
      accountId,
      input.mediaId,
      JSON.stringify(input.payload),
      input.status || "draft",
      input.scheduledAt || 0,
      input.usesHumanAgentTag ? 1 : 0
    )
    .run();
  return (await getCampaignById(db, campaignId, accountId))!;
}

export async function updateCampaign(
  db: D1Database,
  campaignId: string,
  accountId: AccountId,
  patch: Partial<CampaignInput>
): Promise<CampaignRow | null> {
  await db
    .prepare(
      `UPDATE campaigns
       SET media_id = COALESCE(?, media_id),
           payload_json = COALESCE(?, payload_json),
           status = COALESCE(?, status),
           scheduled_at = COALESCE(?, scheduled_at),
           uses_human_agent_tag = COALESCE(?, uses_human_agent_tag),
           updated_at = unixepoch()
       WHERE id = ? AND account_id = ?`
    )
    .bind(
      patch.mediaId ?? null,
      patch.payload !== undefined ? JSON.stringify(patch.payload) : null,
      patch.status ?? null,
      patch.scheduledAt ?? null,
      patch.usesHumanAgentTag === undefined ? null : patch.usesHumanAgentTag ? 1 : 0,
      campaignId,
      accountId
    )
    .run();
  return getCampaignById(db, campaignId, accountId);
}

export async function deleteCampaign(
  db: D1Database,
  campaignId: string,
  accountId: AccountId
): Promise<boolean> {
  const res = await db
    .prepare(`DELETE FROM campaigns WHERE id = ? AND account_id = ?`)
    .bind(campaignId, accountId)
    .run();
  return (res.meta?.changes ?? 0) > 0;
}

/**
 * Reachability engine (plan.md §4.3): fans a campaign out to every captured
 * lead of the account, splitting them into sendable and window-expired buckets
 * so the dashboard can always answer "X of Y commenters still reachable".
 * Targets are keyed `${campaignId}:${leadId}` and inserted with OR IGNORE, so
 * re-fanning the same campaign is idempotent.
 */
export async function fanOutCampaignTargets(
  db: D1Database,
  campaignId: string,
  accountId: AccountId,
  windowSeconds: number = META_MESSAGING_WINDOW_SECONDS
): Promise<{ total: number; reachable: number; unreachable: number }> {
  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - windowSeconds;

  const leads = (await db
    .prepare(`SELECT id, last_inbound_at, first_interaction_at FROM captured_leads WHERE account_id = ?`)
    .bind(accountId)
    .all()) as { results?: any[] };

  const rows = leads.results || [];
  let reachable = 0;
  let unreachable = 0;

  for (const lead of rows) {
    const anchor =
      Number(lead.last_inbound_at || 0) || Number(lead.first_interaction_at || 0);
    const isReachable = anchor >= windowStart;
    if (isReachable) reachable++;
    else unreachable++;

    await db
      .prepare(
        `INSERT OR IGNORE INTO campaign_targets (id, campaign_id, lead_id, status, failure_reason)
         VALUES (?, ?, ?, ?, ?)`
      )
      .bind(
        `${campaignId}:${lead.id}`,
        campaignId,
        lead.id,
        isReachable ? "pending" : "unreachable",
        isReachable ? null : "window_expired"
      )
      .run();
  }

  await db
    .prepare(
      `UPDATE campaigns
       SET unreachable_count = (SELECT COUNT(*) FROM campaign_targets WHERE campaign_id = ? AND status = 'unreachable'),
           updated_at = unixepoch()
       WHERE id = ?`
    )
    .bind(campaignId, campaignId)
    .run();

  return { total: reachable + unreachable, reachable, unreachable };
}

export async function getCampaignTargets(
  db: D1Database,
  campaignId: string
): Promise<CampaignTargetRow[]> {
  const { results } = await db
    .prepare(
      `SELECT id, campaign_id, lead_id, status, failure_reason, dispatched_mid, sent_at
       FROM campaign_targets
       WHERE campaign_id = ?
       ORDER BY status ASC`
    )
    .bind(campaignId)
    .all();
  return (results || []).map(mapCampaignTargetRow);
}

function mapCampaignTargetRow(row: any): CampaignTargetRow {
  return {
    id: row.id,
    campaignId: row.campaign_id,
    leadId: createLeadId(row.lead_id),
    status: row.status,
    failureReason: row.failure_reason || undefined,
    dispatchedMid: row.dispatched_mid || undefined,
    sentAt: row.sent_at ?? undefined,
  };
}

/**
 * Pending targets whose window is still open, oldest anchor first — this is the
 * exact batch a campaign worker may legally send right now.
 */
export async function getSendableCampaignTargets(
  db: D1Database,
  campaignId: string,
  limit: number,
  windowSeconds: number = META_MESSAGING_WINDOW_SECONDS
): Promise<
  Array<CampaignTargetRow & { instagramScopedId: string; username?: string; anchor: number }>
> {
  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - windowSeconds;
  const { results } = await db
    .prepare(
      `SELECT ct.id, ct.campaign_id, ct.lead_id, ct.status, ct.failure_reason,
              ct.dispatched_mid, ct.sent_at, cl.instagram_scoped_id, cl.username,
              cl.last_inbound_at, cl.first_interaction_at
       FROM campaign_targets ct
       JOIN captured_leads cl ON cl.id = ct.lead_id
       WHERE ct.campaign_id = ?
         AND ct.status = 'pending'
         AND (cl.last_inbound_at > 0 OR cl.first_interaction_at > 0)
       ORDER BY MAX(cl.last_inbound_at, cl.first_interaction_at) ASC
       LIMIT ?`
    )
    .bind(campaignId, limit)
    .all();

  return (results || [])
    .map((row: any) => {
      const anchor =
        Number(row.last_inbound_at || 0) || Number(row.first_interaction_at || 0);
      if (anchor < windowStart) return null; // window closed between fan-out and send
      return {
        ...mapCampaignTargetRow(row),
        instagramScopedId: row.instagram_scoped_id,
        username: row.username || undefined,
        anchor,
      };
    })
    .filter(Boolean) as Array<
    CampaignTargetRow & { instagramScopedId: string; username?: string; anchor: number }
  >;
}

export async function markCampaignTargetSent(
  db: D1Database,
  targetId: string,
  mid: string
): Promise<void> {
  await db
    .prepare(
      `UPDATE campaign_targets
       SET status = 'sent', dispatched_mid = ?, sent_at = unixepoch()
       WHERE id = ?`
    )
    .bind(mid, targetId)
    .run();
}

/** Retryable failures go back to pending; the other two are terminal. */
export async function markCampaignTargetFailed(
  db: D1Database,
  targetId: string,
  reason: "retryable" | "window_expired" | "token_dead"
): Promise<void> {
  await db
    .prepare(`UPDATE campaign_targets SET status = ?, failure_reason = ? WHERE id = ?`)
    .bind(reason === "retryable" ? "pending" : "failed", reason, targetId)
    .run();
}

export async function bumpCampaignCounters(
  db: D1Database,
  campaignId: string,
  delta: { sent?: number; failed?: number }
): Promise<void> {
  await db
    .prepare(
      `UPDATE campaigns
       SET sent_count = sent_count + ?, failed_count = failed_count + ?, updated_at = unixepoch()
       WHERE id = ?`
    )
    .bind(delta.sent || 0, delta.failed || 0, campaignId)
    .run();
}

export async function countPendingCampaignTargets(
  db: D1Database,
  campaignId: string
): Promise<number> {
  const row = (await db
    .prepare(`SELECT COUNT(*) AS total FROM campaign_targets WHERE campaign_id = ? AND status = 'pending'`)
    .bind(campaignId)
    .first()) as any;
  return Number(row?.total || 0);
}

// =====================================================================
// 42. CANVAS FLOWS (plan.md §7 Phase 3) — Studio only
// =====================================================================

export interface FlowRow {
  id: string;
  accountId: AccountId;
  name: string;
  graph: unknown;
  isActive: boolean;
  isPublished: boolean;
  createdAt: number;
  updatedAt: number;
}

function mapFlowRow(row: any): FlowRow {
  let graph: unknown = { nodes: [], edges: [] };
  try {
    graph = JSON.parse(row.graph_json);
  } catch {
    /* keep the empty graph — a corrupt row must not break the studio list */
  }
  return {
    id: row.id,
    accountId: createAccountId(row.account_id),
    name: row.name,
    graph,
    isActive: Boolean(row.is_active),
    isPublished: Boolean(row.is_published),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getFlowsForAccount(
  db: D1Database,
  accountId: AccountId
): Promise<FlowRow[]> {
  const { results } = await db
    .prepare(`SELECT * FROM flows WHERE account_id = ? ORDER BY updated_at DESC`)
    .bind(accountId)
    .all();
  return (results || []).map(mapFlowRow);
}

export async function getFlowById(
  db: D1Database,
  flowId: string,
  accountId: AccountId
): Promise<FlowRow | null> {
  const row = (await db
    .prepare(`SELECT * FROM flows WHERE id = ? AND account_id = ? LIMIT 1`)
    .bind(flowId, accountId)
    .first()) as any;
  return row ? mapFlowRow(row) : null;
}

export async function insertFlow(
  db: D1Database,
  flowId: string,
  accountId: AccountId,
  name: string,
  graph: unknown
): Promise<FlowRow> {
  await db
    .prepare(`INSERT INTO flows (id, account_id, name, graph_json) VALUES (?, ?, ?, ?)`)
    .bind(flowId, accountId, name, JSON.stringify(graph))
    .run();
  return (await getFlowById(db, flowId, accountId))!;
}

export async function saveFlow(
  db: D1Database,
  flowId: string,
  accountId: AccountId,
  patch: { name?: string; graph?: unknown; isActive?: boolean; isPublished?: boolean }
): Promise<FlowRow | null> {
  const existing = await getFlowById(db, flowId, accountId);
  if (!existing) return null;
  await db
    .prepare(
      `UPDATE flows
       SET name = ?, graph_json = ?, is_active = ?, is_published = ?, updated_at = unixepoch()
       WHERE id = ? AND account_id = ?`
    )
    .bind(
      patch.name ?? existing.name,
      patch.graph !== undefined
        ? JSON.stringify(patch.graph)
        : JSON.stringify(existing.graph),
      (patch.isActive ?? existing.isActive) ? 1 : 0,
      (patch.isPublished ?? existing.isPublished) ? 1 : 0,
      flowId,
      accountId
    )
    .run();
  return getFlowById(db, flowId, accountId);
}

export async function deleteFlow(
  db: D1Database,
  flowId: string,
  accountId: AccountId
): Promise<boolean> {
  const res = await db
    .prepare(`DELETE FROM flows WHERE id = ? AND account_id = ?`)
    .bind(flowId, accountId)
    .run();
  return (res.meta?.changes ?? 0) > 0;
}

export async function countFlowsForAccount(db: D1Database, accountId: AccountId): Promise<number> {
  const row = (await db
    .prepare(`SELECT COUNT(*) AS total FROM flows WHERE account_id = ?`)
    .bind(accountId)
    .first()) as any;
  return Number(row?.total || 0);
}

// =====================================================================
// 43. REFERRALS (plan.md §7 Phase 3)
// =====================================================================

/** Reward is one free month of Pro per qualified referral. */
export const REFERRAL_REWARD_MONTHS = 1;

export interface ReferralSummary {
  code: string;
  referredCount: number;
  qualifiedCount: number;
  rewardedCount: number;
  rewardMonthsEarned: number;
}

/**
 * Deterministic, non-secret referral code derived from the user id. Safe to put
 * in a share URL (?ref=CODE): knowing a code grants nothing on its own, the
 * reward still requires the referred person to sign up and pay.
 */
export function makeReferralCode(userId: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < userId.length; i++) {
    hash ^= userId.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return (hash.toString(36) + userId.replace(/-/g, "").slice(0, 4))
    .toUpperCase()
    .slice(0, 8);
}

export async function getReferralSummary(
  db: D1Database,
  userId: string
): Promise<ReferralSummary> {
  const row = (await db
    .prepare(
      `SELECT
         COUNT(*) AS referred,
         SUM(CASE WHEN status IN ('qualified','rewarded') THEN 1 ELSE 0 END) AS qualified,
         SUM(CASE WHEN status = 'rewarded' THEN 1 ELSE 0 END) AS rewarded
       FROM referrals WHERE referrer_user_id = ?`
    )
    .bind(userId)
    .first()) as any;

  const rewarded = Number(row?.rewarded || 0);
  return {
    code: makeReferralCode(userId),
    referredCount: Number(row?.referred || 0),
    qualifiedCount: Number(row?.qualified || 0),
    rewardedCount: rewarded,
    rewardMonthsEarned: rewarded * REFERRAL_REWARD_MONTHS,
  };
}

export async function findReferrerByCode(db: D1Database, code: string): Promise<string | null> {
  const normalized = String(code || "").trim().toUpperCase();
  if (!normalized) return null;
  const rows = (await db.prepare(`SELECT id FROM users`).all()) as {
    results?: Array<{ id: string }>;
  };
  const match = (rows.results || []).find((u) => makeReferralCode(u.id) === normalized);
  return match?.id ?? null;
}

/** Self-referral is rejected outright; the unique index blocks double-claims. */
export async function recordReferral(
  db: D1Database,
  referralId: string,
  referrerUserId: string,
  referredUserId: string,
  code: string
): Promise<boolean> {
  if (referrerUserId === referredUserId) return false;
  const res = await db
    .prepare(
      `INSERT OR IGNORE INTO referrals (id, referrer_user_id, referred_user_id, code)
       VALUES (?, ?, ?, ?)`
    )
    .bind(referralId, referrerUserId, referredUserId, code)
    .run();
  return (res.meta?.changes ?? 0) > 0;
}

/**
 * Marks a new signup's referral as qualified — called when the referred user's
 * plan is activated, so a signup that never pays earns nothing.
 */
export async function qualifyReferralsForUser(
  db: D1Database,
  referredUserId: string
): Promise<number> {
  const res = await db
    .prepare(
      `UPDATE referrals SET status = 'qualified', qualified_at = unixepoch()
       WHERE referred_user_id = ? AND status = 'pending'`
    )
    .bind(referredUserId)
    .run();
  return res.meta?.changes ?? 0;
}

/** Closes the loop: qualified -> rewarded. Safe to call repeatedly. */
export async function rewardQualifiedReferrals(
  db: D1Database,
  referredUserId: string
): Promise<number> {
  const res = await db
    .prepare(
      `UPDATE referrals SET status = 'rewarded', rewarded_at = unixepoch()
       WHERE referred_user_id = ? AND status = 'qualified'`
    )
    .bind(referredUserId)
    .run();
  return res.meta?.changes ?? 0;
}

/**
 * Admin check against the database flag.
 *
 * `users.is_admin` is the durable grant; `ADMIN_EMAILS` and the break-glass
 * `X-Admin-Secret` header are checked separately in `security/admin.ts`. This
 * function reads the flag only, and returns false when the column does not
 * exist yet (a worker deployed ahead of the migration), so authorization fails
 * closed instead of throwing a 500.
 */
export async function isUserAdmin(db: D1Database, userId: string): Promise<boolean> {
  try {
    const row = (await db
      .prepare(`SELECT is_admin FROM users WHERE id = ? LIMIT 1`)
      .bind(userId)
      .first()) as { is_admin?: number | boolean } | null;
    return Boolean(row?.is_admin);
  } catch {
    return false;
  }
}
