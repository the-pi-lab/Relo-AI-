import type { D1Database } from "@cloudflare/workers-types";
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
       VALUES (?, ?, ?, ?)`
    )
    .bind(crypto.randomUUID(), accountId, threadId, pausedUntil)
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
    isFollower: boolean;
    email?: string;
  }
): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  const followerInt = lead.isFollower ? 1 : 0;

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
    followGateEnabled: Boolean(row.follow_gate_enabled),
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
    followGateEnabled: Boolean(row.follow_gate_enabled),
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

/**
 * 14. Save Email OTP code for passwordless sign-in (10 min expiry).
 * Enforces a 60-second resend throttle per email to prevent email-bombing.
 */
export async function saveEmailOtp(
  db: D1Database,
  email: string,
  code: string,
  expiresInSeconds = 600
): Promise<{ ok: true } | { ok: false; retryAfterSeconds: number }> {
  const normalizedEmail = email.toLowerCase().trim();
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = now + expiresInSeconds;
  const resendThrottleSeconds = 60;

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
      `INSERT INTO email_otps (email, code, expires_at, created_at, attempts, last_sent_at)
       VALUES (?, ?, ?, ?, 0, ?)
       ON CONFLICT (email) DO UPDATE SET
         code = excluded.code,
         expires_at = excluded.expires_at,
         created_at = excluded.created_at,
         attempts = 0,
         last_sent_at = excluded.last_sent_at`
    )
    .bind(normalizedEmail, code, expiresAt, now, now)
    .run();

  return { ok: true };
}

const MAX_OTP_ATTEMPTS = 5;

/**
 * 15. Verify and consume Email OTP code.
 * Brute-force hardened: at most MAX_OTP_ATTEMPTS failed tries invalidate the
 * code, and consumption is an atomic conditional DELETE (no TOCTOU window).
 */
export async function verifyAndConsumeEmailOtp(
  db: D1Database,
  email: string,
  code: string
): Promise<boolean> {
  const normalizedEmail = email.toLowerCase().trim();
  const now = Math.floor(Date.now() / 1000);

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

  // Atomic consume: the delete only succeeds when the code matches exactly,
  // so two concurrent verifications can never both "consume" the same OTP.
  const consume = await db
    .prepare(
      `DELETE FROM email_otps WHERE email = ? AND code = ? AND expires_at > ?`
    )
    .bind(normalizedEmail, code.trim(), now)
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
       WHERE user_id = ?
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
  }
): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  await db
    .prepare(
      `INSERT INTO connected_accounts (
        id, user_id, instagram_user_id, username, profile_picture_url,
        access_token_encrypted, token_expires_at, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
      ON CONFLICT (instagram_user_id) DO UPDATE SET
        user_id = excluded.user_id,
        username = excluded.username,
        profile_picture_url = excluded.profile_picture_url,
        access_token_encrypted = excluded.access_token_encrypted,
        token_expires_at = excluded.token_expires_at,
        is_active = 1,
        updated_at = excluded.updated_at`
    )
    .bind(
      account.id,
      account.userId,
      account.instagramUserId,
      account.username,
      account.profilePictureUrl || null,
      account.accessTokenEncrypted,
      account.tokenExpiresAt,
      now,
      now
    )
    .run();
}

/**
 * 18. Delete / disconnect connected account.
 */
export async function deleteConnectedAccount(
  db: D1Database,
  accountId: string,
  userId: string
): Promise<boolean> {
  const res = await db
    .prepare(`DELETE FROM connected_accounts WHERE id = ? AND user_id = ?`)
    .bind(accountId, userId)
    .run();
  return (res.meta?.changes ?? 0) > 0;
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
    followGateEnabled: Boolean(row.follow_gate_enabled),
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
    followGateEnabled: boolean;
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
      automation.followGateEnabled ? 1 : 0,
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
  const res = await db
    .prepare(`DELETE FROM reel_automations WHERE id = ? AND account_id = ?`)
    .bind(automationId, accountId)
    .run();
  return (res.meta?.changes ?? 0) > 0;
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
    followerStatusAtTrigger: boolean;
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
    followerStatusAtTrigger: Boolean(row.follower_status_at_trigger),
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
    followerStatusAtTrigger: row.follower_status_at_trigger ? "Follower" : "Non-Follower",
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
  followerConversionRate: number;
}> {
  const now = Math.floor(Date.now() / 1000);
  const oneDayAgo = now - 86400;

  const [
    pendingRow,
    completed24hRow,
    failed24hRow,
    leadsRow,
    followerRow,
  ] = (await Promise.all([
    db.prepare(`SELECT COUNT(*) as c FROM jobs WHERE account_id = ? AND status = 'pending'`).bind(accountId).first(),
    db.prepare(`SELECT COUNT(*) as c FROM jobs WHERE account_id = ? AND status = 'completed' AND updated_at >= ?`).bind(accountId, oneDayAgo).first(),
    db.prepare(`SELECT COUNT(*) as c FROM jobs WHERE account_id = ? AND status = 'failed' AND updated_at >= ?`).bind(accountId, oneDayAgo).first(),
    db.prepare(`SELECT COUNT(*) as c, SUM(total_dms_sent) as totalDms FROM captured_leads WHERE account_id = ?`).bind(accountId).first(),
    db.prepare(`SELECT COUNT(*) as c FROM captured_leads WHERE account_id = ? AND follower_status_at_trigger = 1`).bind(accountId).first(),
  ])) as any[];

  const pendingJobs = Number(pendingRow?.c || 0);
  const completed24h = Number(completed24hRow?.c || 0);
  const failed24h = Number(failed24hRow?.c || 0);
  const totalLeads = Number(leadsRow?.c || 0);
  const totalDmsSent = Number(leadsRow?.totalDms || 0);
  const followerCount = Number(followerRow?.c || 0);

  const conversionRate = totalLeads > 0 ? Math.round((followerCount / totalLeads) * 100) : 0;
  const status = failed24h > 20 ? "degraded" : "healthy";

  return {
    status,
    queueDepth: pendingJobs,
    pendingJobs,
    completed24h,
    failed24h,
    totalLeads,
    totalComments: completed24h + pendingJobs,
    totalDmsSent,
    followerConversionRate: conversionRate,
  };
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
  await db
    .prepare(`UPDATE connected_accounts SET free_reel_consumed = 1, updated_at = ? WHERE id = ?`)
    .bind(now, accountId)
    .run();
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
  await db
    .prepare(`DELETE FROM short_links WHERE automation_id = ?`)
    .bind(automationId)
    .run();
  for (let i = 0; i < targets.length; i++) {
    await db
      .prepare(
        `INSERT INTO short_links (id, account_id, automation_id, button_index, target_url)
         VALUES (?, ?, ?, ?, ?)`
      )
      .bind(crypto.randomUUID(), accountId, automationId, i, targets[i])
      .run();
  }
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
    commentId: CommentId;
    commenterUserId: InstagramUserId;
    commenterUsername: string;
    postId: MediaId;
    matchedAutomationId: AutomationId;
    parentJobId: JobId;
    sendAt: number;
  }
): Promise<boolean> {
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
      job.commentId,
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
): Promise<{ textsPurged: number; jobsDeleted: number; logsDeleted: number }> {
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
  return {
    textsPurged: texts.meta?.changes ?? 0,
    jobsDeleted: jobs.meta?.changes ?? 0,
    logsDeleted: logs.meta?.changes ?? 0,
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
  await db
    .prepare(
      `UPDATE connected_accounts SET ai_credits_remaining = ?, ai_credits_reset_at = ? WHERE id = ?`
    )
    .bind(limit, nextReset, account.id)
    .run();
  await db
    .prepare(`INSERT INTO credit_ledger (id, account_id, delta, reason) VALUES (?, ?, ?, ?)`)
    .bind(crypto.randomUUID(), account.id, limit, `monthly_reset_${account.plan}`)
    .run();

  return { ...account, aiCreditsRemaining: limit, aiCreditsResetAt: nextReset };
}

/**
 * 41. Atomically spend one AI credit. Returns false when exhausted.
 */
export async function spendAiCredit(db: D1Database, accountId: AccountId): Promise<boolean> {
  const res = await db
    .prepare(
      `UPDATE connected_accounts
       SET ai_credits_remaining = ai_credits_remaining - 1
       WHERE id = ? AND ai_credits_remaining > 0`
    )
    .bind(accountId)
    .run();
  const spent = (res.meta?.changes ?? 0) > 0;
  if (spent) {
    await db
      .prepare(`INSERT INTO credit_ledger (id, account_id, delta, reason) VALUES (?, ?, ?, ?)`)
      .bind(crypto.randomUUID(), accountId, -1, "ai_reply")
      .run();
  }
  return spent;
}

/**
 * 42. Owner-activated payment → set plan on ALL of the user's accounts
 * and grant the tier's monthly credits immediately.
 */
export async function activatePlanForUser(
  db: D1Database,
  userId: string,
  plan: "pro" | "studio"
): Promise<number> {
  const now = Math.floor(Date.now() / 1000);
  const limit = TIER_CREDIT_LIMITS[plan] ?? 3;
  const res = await db
    .prepare(
      `UPDATE connected_accounts
       SET plan = ?, ai_credits_remaining = ?, ai_credits_reset_at = ?, updated_at = ?
       WHERE user_id = ?`
    )
    .bind(plan, limit, now + 30 * 86400, now, userId)
    .run();

  const { results } = await db
    .prepare(`SELECT id FROM connected_accounts WHERE user_id = ?`)
    .bind(userId)
    .all();
  for (const row of results || []) {
    await db
      .prepare(`INSERT INTO credit_ledger (id, account_id, delta, reason) VALUES (?, ?, ?, ?)`)
      .bind(crypto.randomUUID(), (row as any).id, limit, `plan_activated_${plan}`)
      .run();
  }
  return res.meta?.changes ?? 0;
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
  accountId: AccountId
): Promise<{ total: number; reachable: number; unreachable: number }> {
  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - META_MESSAGING_WINDOW_SECONDS;

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
  limit: number
): Promise<
  Array<CampaignTargetRow & { instagramScopedId: string; username?: string; anchor: number }>
> {
  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - META_MESSAGING_WINDOW_SECONDS;
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