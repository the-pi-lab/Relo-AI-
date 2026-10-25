import type { Env } from "../db";
import {
  getCampaignById,
  getSendableCampaignTargets,
  markCampaignTargetSent,
  markCampaignTargetFailed,
  bumpCampaignCounters,
  updateCampaign,
  countPendingCampaignTargets,
  getCampaignsForAccount,
  META_MESSAGING_WINDOW_SECONDS,
  recordOutboundMessage,
} from "../db/queries";
import { decryptSecret } from "../crypto";
import { metaGraphClient } from "../meta/client";
import { isRetryable, TokenExpiredError, UserNotReachableError } from "../meta/errors";
import type { OutgoingMessagePayload } from "../types/meta";
import type { CampaignRow } from "../db/queries";

/**
 * Campaign worker (plan.md §4.3, Phase 3).
 *
 * Sends to captured commenters who are STILL inside Meta's 24-hour messaging
 * window. The window is re-checked per target at send time, not just at
 * fan-out — a campaign composed two hours ago may have lost half its audience
 * by the time the cron reaches it.
 *
 * Every failure is classified (retryable / window_expired / token_dead) and
 * written back to `campaign_targets`, so the dashboard can explain exactly who
 * was skipped and why rather than showing a vague "failed" count.
 */

export interface CampaignSendResult {
  campaignId: string;
  sent: number;
  failed: number;
  skipped: number;
  completed: boolean;
  errors: Array<{ targetId: string; reason: string; retryable: boolean }>;
}

/** Meta's messaging rate limits make big bursts risky; keep batches small. */
const DEFAULT_BATCH = 10;

/** Jitter between sends, in ms — matches the anti-spam posture of plan.md §1. */
const JITTER_MIN_MS = 400;
const JITTER_MAX_MS = 1200;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function jitterDelay(): number {
  return JITTER_MIN_MS + Math.random() * (JITTER_MAX_MS - JITTER_MIN_MS);
}

export function buildCampaignMessage(
  campaign: CampaignRow,
  recipientUsername?: string
): OutgoingMessagePayload {
  const payload = (campaign.payload || {}) as { kind?: string; text?: string; card?: any };
  const recipient = { id: "" as string };

  if (payload.kind === "card" && payload.card) {
    const card = payload.card;
    const buttons = Array.isArray(card.buttons) ? card.buttons.slice(0, 3) : [];
    return {
      recipient,
      message: {
        attachment: {
          type: "template",
          payload: {
            template_type: "generic",
            elements: [
              {
                title: String(card.title || "").slice(0, 80),
                subtitle: String(card.subtitle || "").slice(0, 80),
                image_url: card.imageUrl || undefined,
                buttons,
              },
            ],
          },
        },
      },
    };
  }

  let text = String(payload.text || "");
  // {username} merge keeps campaign copy from reading as a broadcast blast.
  if (recipientUsername) {
    text = text.replace(/\{username\}/gi, `@${recipientUsername}`);
  }
  return { recipient, message: { text } };
}

/**
 * Applies the HUMAN_AGENT messaging tag when the campaign opted in. Meta's tag
 * extends the messaging window from 24h to 7 days for approved tags.
 */
export function applyHumanAgentTag(
  payload: OutgoingMessagePayload,
  campaign: CampaignRow
): OutgoingMessagePayload {
  if (!campaign.usesHumanAgentTag) return payload;
  // The union must be narrowed per-variant: spreading it produces a union of
  // unions that no longer satisfies either member.
  if ("attachment" in payload.message) {
    return {
      recipient: payload.recipient,
      message: { ...payload.message, tag: "HUMAN_AGENT" },
    };
  }
  return {
    recipient: payload.recipient,
    message: { ...payload.message, tag: "HUMAN_AGENT" },
  };
}

/**
 * Meta's HUMAN_AGENT tag widens the messaging window from 24 hours to 7 days.
 * It only exists once Meta has approved the app, so the opt-in flag alone is
 * not enough — sending the tag unapproved makes Meta reject the whole message.
 */
export const HUMAN_AGENT_WINDOW_SECONDS = 7 * 24 * 60 * 60;

export function humanAgentTagApproved(
  campaign: { usesHumanAgentTag?: boolean },
  env: { META_HUMAN_AGENT_APPROVED?: string }
): boolean {
  return Boolean(campaign.usesHumanAgentTag) && env.META_HUMAN_AGENT_APPROVED === "1";
}

/** The window a campaign may actually use for a given deployment. */
export function campaignWindowSeconds(
  campaign: { usesHumanAgentTag?: boolean },
  env: { META_HUMAN_AGENT_APPROVED?: string }
): number {
  return humanAgentTagApproved(campaign, env)
    ? HUMAN_AGENT_WINDOW_SECONDS
    : META_MESSAGING_WINDOW_SECONDS;
}

export interface CampaignCard {
  title: string;
  subtitle?: string;
  imageUrl?: string;
  buttons: Array<{ type: "web_url"; title: string; url: string }>;
}

/**
 * Validates a campaign card against Meta's generic-template limits before it is
 * ever stored. An over-long title or a fourth button makes the whole send fail
 * per recipient, at cron time, where nobody is watching — so it is rejected at
 * compose time instead.
 */
export function normalizeCampaignCard(
  raw: unknown
): { ok: true; card: CampaignCard } | { ok: false; message: string } {
  if (!raw || typeof raw !== "object") {
    return { ok: false, message: "Card content is missing." };
  }
  const input = raw as Record<string, unknown>;

  const title = String(input.title || "").trim();
  if (!title) return { ok: false, message: "A card needs a title." };
  if (title.length > 80) {
    return { ok: false, message: "Card titles are limited to 80 characters." };
  }

  const subtitle = String(input.subtitle || "").trim();
  if (subtitle.length > 80) {
    return { ok: false, message: "Card subtitles are limited to 80 characters." };
  }

  const imageUrlRaw = String(input.imageUrl || "").trim();
  if (imageUrlRaw && !/^https:\/\//i.test(imageUrlRaw)) {
    return { ok: false, message: "Card images must use an https:// URL." };
  }

  const rawButtons = Array.isArray(input.buttons) ? input.buttons : [];
  if (rawButtons.length > 3) {
    return { ok: false, message: "A card can carry at most 3 buttons." };
  }

  const buttons: CampaignCard["buttons"] = [];
  for (const rawButton of rawButtons) {
    if (!rawButton || typeof rawButton !== "object") {
      return { ok: false, message: "Each button needs a title and an https:// URL." };
    }
    const button = rawButton as Record<string, unknown>;
    const buttonTitle = String(button.title || "").trim();
    const buttonUrl = String(button.url || "").trim();
    if (!buttonTitle || !buttonUrl) {
      return { ok: false, message: "Each button needs a title and an https:// URL." };
    }
    if (buttonTitle.length > 20) {
      return { ok: false, message: "Button labels are limited to 20 characters." };
    }
    if (!/^https:\/\//i.test(buttonUrl)) {
      return { ok: false, message: "Button URLs must start with https://." };
    }
    buttons.push({ type: "web_url", title: buttonTitle, url: buttonUrl });
  }

  return {
    ok: true,
    card: {
      title,
      subtitle: subtitle || undefined,
      imageUrl: imageUrlRaw || undefined,
      buttons,
    },
  };
}

export async function sendCampaignBatch(
  env: Env,
  campaignId: string,
  options: { accountId: string; batchLimit?: number; jitter?: boolean } 
): Promise<CampaignSendResult> {
  const result: CampaignSendResult = {
    campaignId,
    sent: 0,
    failed: 0,
    skipped: 0,
    completed: false,
    errors: [],
  };

  const campaign = await getCampaignById(env.DB, campaignId, options.accountId as any);
  if (!campaign) {
    throw new Error(`Campaign ${campaignId} not found for that account.`);
  }
  if (campaign.status === "completed" || campaign.status === "cancelled") {
    result.completed = true;
    return result;
  }

  if (!env.ENCRYPTION_MASTER_KEY) {
    throw new Error(
      "ENCRYPTION_MASTER_KEY is not configured. Refusing to send campaigns without the token vault key."
    );
  }

  await updateCampaign(env.DB, campaignId, options.accountId as any, { status: "sending" });

  const account = await env.DB
    .prepare(`SELECT * FROM connected_accounts WHERE id = ? LIMIT 1`)
    .bind(options.accountId)
    .first() as any;

  if (!account) {
    await updateCampaign(env.DB, campaignId, options.accountId as any, { status: "failed" });
    throw new Error("Connected Instagram account not found.");
  }

  const token = await decryptSecret(account.access_token_encrypted, env.ENCRYPTION_MASTER_KEY);
  const targets = await getSendableCampaignTargets(
    env.DB,
    campaignId,
    options.batchLimit || DEFAULT_BATCH,
    campaignWindowSeconds(campaign, env)
  );

  for (const target of targets) {
    try {
      let payload = buildCampaignMessage(campaign, target.username);
      payload = { ...payload, recipient: { id: target.instagramScopedId } };
      if (humanAgentTagApproved(campaign, env)) {
        payload = applyHumanAgentTag(payload, campaign);
      }

      const response = await metaGraphClient.sendPrivateReply(token, payload);
      await recordOutboundMessage(
        env.DB,
        campaign.accountId,
        target.instagramScopedId,
        response.message_id
      );
      await markCampaignTargetSent(env.DB, target.id, response.message_id);
      result.sent++;
      await bumpCampaignCounters(env.DB, campaignId, { sent: 1 });
    } catch (err) {
      const reason = classifyCampaignFailure(err);
      await markCampaignTargetFailed(env.DB, target.id, reason);
      result.failed++;
      result.errors.push({ targetId: target.id, reason, retryable: isRetryable(err) });
      await bumpCampaignCounters(env.DB, campaignId, { failed: 1 });

      // A dead token stops the whole campaign — every remaining send would fail.
      if (reason === "token_dead") {
        await updateCampaign(env.DB, campaignId, options.accountId as any, { status: "failed" });
        result.completed = true;
        return result;
      }
    }

    if (options.jitter !== false) {
      await sleep(jitterDelay());
    }
  }

  // Nothing left to send -> the campaign is done. Reachability was re-checked
  // per target, so anything that aged out simply never appeared in the batch.
  const remaining = await countPendingCampaignTargets(env.DB, campaignId);
  if (remaining === 0) {
    await updateCampaign(env.DB, campaignId, options.accountId as any, { status: "completed" });
    result.completed = true;
  }

  return result;
}

/**
 * Maps a Meta failure to one of the three campaign failure buckets the
 * dashboard reports (plan.md §4.3).
 */
export function classifyCampaignFailure(err: unknown): "retryable" | "window_expired" | "token_dead" {
  if (err instanceof TokenExpiredError) return "token_dead";
  if (err instanceof UserNotReachableError) return "window_expired";
  if (isRetryable(err)) return "retryable";
  return "window_expired";
}

/**
 * Picks up campaigns that are scheduled to go out now and sends one batch of
 * each. Called from the 1-minute cron; a campaign with 500 recipients needs
 * ~50 ticks to drain, which is deliberate — it keeps Meta's rate limits happy.
 */
export async function processScheduledCampaigns(
  env: Env,
  options: { accounts: Array<{ accountId: string }>; batchLimit?: number } = { accounts: [] }
): Promise<CampaignSendResult[]> {
  const now = Math.floor(Date.now() / 1000);
  const results: CampaignSendResult[] = [];

  for (const { accountId } of options.accounts) {
    const campaigns = await getCampaignsForAccount(env.DB, accountId as any);
    for (const campaign of campaigns) {
      const due =
        campaign.status === "sending" ||
        (campaign.status === "scheduled" && campaign.scheduledAt <= now);
      if (!due) continue;
      try {
        results.push(
          await sendCampaignBatch(env, campaign.id, {
            accountId,
            batchLimit: options.batchLimit,
          })
        );
      } catch (err) {
        console.error(`[Campaign ${campaign.id}] batch failed:`, err);
      }
    }
  }

  return results;
}