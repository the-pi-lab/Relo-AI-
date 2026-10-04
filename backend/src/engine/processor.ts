import type { Env } from "../db";
import {
  getDueJobsBatch,
  markJobProcessing,
  markJobCompleted,
  markJobFailedOrRetry,
  markJobPublicReplyId,
  isThreadPausedByHumanTakeover,
  getAccountById,
  getAutomationById,
  getActiveAutomationsForMedia,
  upsertCapturedLead,
  markAccountTokenExpired,
  recordWebhookAuditLog,
  insertFollowUpJob,
  hasLeadRepliedSince,
  getShortLinksForAutomation,
} from "../db/queries";
import { createAutomationId, createCommentId, createJobId } from "../types/ids";
import { decryptSecret } from "../crypto";
import { pickCommentReply, spin } from "./spintax";
import { metaGraphClient } from "../meta/client";
import { isRetryable, TokenExpiredError, ResourceNotFoundError } from "../meta/errors";
import type { OutgoingMessagePayload, ReelAutomation } from "../types";

export interface BatchProcessingResult {
  processedCount: number;
  completedCount: number;
  failedCount: number;
  skippedCount: number;
  errors: Array<{ jobId: string; error: string; retryable: boolean }>;
}

/**
 * 1-Minute Cron-as-Queue Batch Processor
 * Polls due jobs (send_at <= now), verifies constraints, dispatches public replies
 * and 3-button Generic Template DMs, records leads, and manages retries.
 */
export async function processDueJobsBatch(
  env: Env,
  options: { batchLimit?: number } = {}
): Promise<BatchProcessingResult> {
  const limit = options.batchLimit || 50;
  const dueJobs = await getDueJobsBatch(env.DB, limit);

  const result: BatchProcessingResult = {
    processedCount: dueJobs.length,
    completedCount: 0,
    failedCount: 0,
    skippedCount: 0,
    errors: [],
  };

  if (dueJobs.length === 0) {
    return result;
  }

  // Hard-required: no silent fallback to the JWT secret.
  if (!env.ENCRYPTION_MASTER_KEY) {
    throw new Error(
      "ENCRYPTION_MASTER_KEY is not configured. Refusing to dispatch DMs without the token vault key."
    );
  }
  const masterKey = env.ENCRYPTION_MASTER_KEY;

  for (const job of dueJobs) {
    // 1. Atomic lock: transition status from 'pending' to 'processing'
    const locked = await markJobProcessing(env.DB, job.id);
    if (!locked) {
      // Job was claimed concurrently by another worker
      continue;
    }

    try {
      // 2. Check 30-minute Human Takeover auto-pause
      const isPaused = await isThreadPausedByHumanTakeover(
        env.DB,
        job.accountId,
        job.commenterUserId
      );

      if (isPaused) {
        await markJobCompleted(env.DB, job.id, "SKIPPED_HUMAN_TAKEOVER");
        result.skippedCount++;
        continue;
      }

      // 2b. Follow-up DMs: send only if the lead hasn't messaged us since the
      // original DM (respecting the human takeover + 24h window).
      if (job.isFollowUp) {
        const parentDoneAt = job.createdAt;
        const replied = await hasLeadRepliedSince(
          env.DB,
          job.accountId,
          job.commenterUserId,
          parentDoneAt
        );
        if (replied) {
          await markJobCompleted(env.DB, job.id, "SKIPPED_LEAD_REPLIED");
          result.skippedCount++;
          continue;
        }
      }

      // 3. Fetch connected Instagram account
      const account = await getAccountById(env.DB, job.accountId);
      if (!account || !account.isActive) {
        throw new Error("Connected Instagram account not found or inactive.");
      }

      // 4. Decrypt Page Access Token
      const decryptedToken = await decryptSecret(account.accessTokenEncrypted, masterKey);

      // 5. Fetch matched Automation Rule
      let automation: ReelAutomation | null = null;
      if (job.matchedAutomationId) {
        automation = await getAutomationById(env.DB, job.matchedAutomationId);
      }
      if (!automation) {
        const automations = await getActiveAutomationsForMedia(env.DB, job.accountId, job.postId);
        automation = automations[0] || null;
      }

      if (!automation || !automation.isActive) {
        await markJobCompleted(env.DB, job.id, "SKIPPED_NO_ACTIVE_AUTOMATION");
        result.skippedCount++;
        continue;
      }

      // 6. Biometric Follow-Gate Verification (if enabled)
      let isFollowerVerified = false;
      let followDecision = "ALLOW_VERIFIED_FOLLOWER";

      if (automation.followGateEnabled) {
        const followStatus = await metaGraphClient.getUserFollowStatus(
          decryptedToken,
          account.instagramUserId,
          job.commenterUserId
        );
        followDecision = followStatus.decision;
        isFollowerVerified = followStatus.decision === "ALLOW_VERIFIED_FOLLOWER";
      } else {
        isFollowerVerified = true;
      }

      // 7. Dispatch Public Comment Reply (if configured)
      // Skip when a previous attempt already posted it — re-dispatching would
      // create visible duplicate comments and spam-flag the account.
      let publicReplyId: string | undefined = job.publicReplyId;
      if (!publicReplyId && automation.commentReplies && automation.commentReplies.length > 0) {
        try {
          const selectedReply = pickCommentReply(automation.commentReplies);
          const spunCommentText = spin(selectedReply).replace(
            /@username/gi,
            `@${job.commenterUsername}`
          );

          const commentRes = await metaGraphClient.sendCommentReply(
            decryptedToken,
            job.commentId,
            spunCommentText
          );
          publicReplyId = commentRes.id;
          // Persist immediately: a retryable failure later in this job must
          // not produce a second public reply on the next attempt.
          await markJobPublicReplyId(env.DB, job.id, publicReplyId);
        } catch (commentErr) {
          // If comment was deleted or comment reply blocked, log but don't fail entire DM flow
          console.warn(`[Comment Reply Warning] Job ${job.id}:`, commentErr);
          if (commentErr instanceof ResourceNotFoundError) {
            // Comment was deleted by the user before our reply was dispatched
            await markJobCompleted(env.DB, job.id, "SKIPPED_COMMENT_DELETED");
            result.skippedCount++;
            continue;
          }
        }
      }

      // 8. Construct & Dispatch Private Reply (Direct Message)
      let dmPayload: OutgoingMessagePayload;

      if (followDecision === "PROMPT_FOLLOW") {
        // Follow-Gate Gatekeeper Message
        dmPayload = {
          recipient: { comment_id: job.commentId },
          message: {
            text: `Hey @${job.commenterUsername}! 👋 Please follow our account first so we can send you the exclusive link! Once you've followed, reply here to unlock it.`,
          },
        };
      } else if (automation.templateCard && automation.templateCard.buttons?.length > 0) {
        // High-converting 3-Button Generic Template Card.
        // Buttons route through RELO short links for Sent → Clicked tracking.
        const links = await getShortLinksForAutomation(env.DB, automation.id);
        let buttons = automation.templateCard.buttons.map((btn, i) => {
          const link = links.find((l) => l.buttonIndex === i);
          if (btn.type === "web_url" && link) {
            const base = env.PUBLIC_BASE_URL || "";
            if (base) {
              return { ...btn, url: `${base.replace(/\/$/, "")}/l/${link.id}` };
            }
          }
          return btn;
        });

        // Free tier: RELO branding button occupies the slot AFTER the user's
        // last button (plan.md §3 — the viral loop, injected at dispatch so
        // tier changes apply to in-flight jobs immediately).
        if (account.plan === "free") {
          const brandingUrl = `${(env.PUBLIC_APP_URL || "https://relo.ai").replace(/\/$/, "")}/?ref=${account.id}`;
          buttons = [
            ...buttons,
            { type: "web_url" as const, title: "⚡ Automated by RELO", url: brandingUrl },
          ];
        }
        const finalButtons = buttons.slice(0, 3) as typeof automation.templateCard.buttons;

        dmPayload = {
          recipient: { comment_id: job.commentId },
          message: {
            attachment: {
              type: "template",
              payload: {
                template_type: "generic",
                elements: [
                  {
                    title: automation.templateCard.title,
                    subtitle: automation.templateCard.subtitle,
                    image_url: automation.templateCard.imageUrl,
                    buttons: finalButtons,
                  },
                ],
              },
            },
          },
        };
      } else {
        // Fallback plain-text DM
        dmPayload = {
          recipient: { comment_id: job.commentId },
          message: {
            text: `Hey @${job.commenterUsername}! Here is your requested link! Check it out.`,
          },
        };
      }

      const dmResponse = await metaGraphClient.sendPrivateReply(decryptedToken, dmPayload);

      // 9. Upsert Lead into Captured Leads Database
      await upsertCapturedLead(env.DB, {
        accountId: job.accountId,
        instagramScopedId: job.commenterUserId,
        username: job.commenterUsername,
        isFollower: isFollowerVerified,
      });

      // 10. Mark Job as Successfully Completed
      await markJobCompleted(env.DB, job.id, dmResponse.message_id || publicReplyId);
      result.completedCount++;

      // 10b. Schedule the one follow-up DM (Pro/Studio only, plan.md §4.2):
      // fires N minutes later unless the lead messages us first.
      if (!job.isFollowUp && automation.followUpEnabled && account.plan !== "free") {
        const nowSec = Math.floor(Date.now() / 1000);
        await insertFollowUpJob(env.DB, {
          id: createJobId(crypto.randomUUID()),
          accountId: job.accountId,
          commentId: job.commentId,
          commenterUserId: job.commenterUserId,
          commenterUsername: job.commenterUsername,
          postId: job.postId,
          matchedAutomationId: automation.id,
          parentJobId: job.id,
          sendAt: nowSec + (automation.followUpDelayMinutes ?? 60) * 60,
        });
      }

      // Audit log success
      await recordWebhookAuditLog(env.DB, {
        accountId: job.accountId,
        eventType: "cron_job_delivered",
        statusCode: 200,
        payload: JSON.stringify({ jobId: job.id, dmId: dmResponse.message_id }),
      });
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      const retryable = isRetryable(err);

      result.errors.push({ jobId: job.id, error: errMsg, retryable });
      result.failedCount++;

      if (err instanceof TokenExpiredError) {
        // Revoke / disable account token in DB to halt further failed API calls
        await markAccountTokenExpired(env.DB, job.accountId);
        await markJobFailedOrRetry(env.DB, job.id, `Token Expired (Re-auth required): ${errMsg}`, 999, 3);
      } else if (err instanceof ResourceNotFoundError) {
        // Comment or Media deleted -> Never retry
        await markJobCompleted(env.DB, job.id, "SKIPPED_COMMENT_DELETED");
      } else if (retryable && job.retryCount < 3) {
        // Exponential backoff retry
        await markJobFailedOrRetry(env.DB, job.id, errMsg, job.retryCount, 3);
      } else {
        // Terminal failure
        await markJobFailedOrRetry(env.DB, job.id, errMsg, 999, 3);
      }

      await recordWebhookAuditLog(env.DB, {
        accountId: job.accountId,
        eventType: "cron_job_failed",
        statusCode: 500,
        errorMessage: errMsg,
      });
    }
  }

  return result;
}
