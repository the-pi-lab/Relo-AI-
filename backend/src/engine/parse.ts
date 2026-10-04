import type { CommentId, InstagramUserId, MediaId } from "../types/ids";
import type { MetaWebhookEnvelope, MetaWebhookChange, MetaWebhookMessaging } from "../types/meta";

/**
 * Clean domain events extracted from raw Meta Webhook payloads
 */
export interface ParsedCommentEvent {
  type: "comment";
  accountId: string; // The Instagram Account ID that received the webhook
  commentId: CommentId;
  commenterId: InstagramUserId;
  commenterUsername: string;
  mediaId: MediaId;
  text: string;
  createdTime: number;
}

export interface ParsedMessageEvent {
  type: "message";
  accountId: string;
  senderId: InstagramUserId;
  recipientId: string;
  mid: string;
  text?: string;
  quickReplyPayload?: string;
  /** True when the message is an echo of one sent by the account itself —
   *  i.e. the creator replied manually. Used for Human Takeover pausing. */
  isEcho: boolean;
  timestamp: number;
}

export type ParsedWebhookEvent = ParsedCommentEvent | ParsedMessageEvent;

export interface ParseWebhookOptions {
  /**
   * If provided, comments made by this account ID (self-comments / bot replies)
   * will be immediately dropped to prevent infinite self-trigger loops.
   */
  ignoreSenderId?: string;
}

/**
 * Ingests a raw Meta Webhook envelope and extracts actionable events.
 * Implements OpenReply early-filtering heuristics:
 *  1. Drops non-Instagram webhook payloads
 *  2. Filters out echo messages (messages sent by our own bot)
 *  3. Filters out deleted messages
 *  4. Drops self-comments (creators replying to their own reel or bot's own replies)
 *  5. Rejects empty, corrupt, or unsupported events early
 */
export function parseWebhookEnvelope(
  envelope: MetaWebhookEnvelope | unknown,
  options: ParseWebhookOptions = {}
): ParsedWebhookEvent[] {
  if (!envelope || typeof envelope !== "object") {
    return [];
  }

  const raw = envelope as Partial<MetaWebhookEnvelope>;

  // Only handle Instagram platform events
  if (raw.object !== "instagram" || !Array.isArray(raw.entry)) {
    return [];
  }

  const events: ParsedWebhookEvent[] = [];

  for (const entry of raw.entry) {
    const accountId = entry.id;
    if (!accountId) continue;

    // 1. Process Comment Changes
    if (Array.isArray(entry.changes)) {
      for (const change of entry.changes) {
        const commentEvent = parseCommentChange(change, accountId, options);
        if (commentEvent) {
          events.push(commentEvent);
        }
      }
    }

    // 2. Process Direct Messaging Events
    if (Array.isArray(entry.messaging)) {
      for (const msg of entry.messaging) {
        const messageEvent = parseMessagingEvent(msg, accountId, options);
        if (messageEvent) {
          events.push(messageEvent);
        }
      }
    }
  }

  return events;
}

/**
 * Parses and validates an individual comment change event
 */
function parseCommentChange(
  change: MetaWebhookChange,
  accountId: string,
  options: ParseWebhookOptions
): ParsedCommentEvent | null {
  if (change.field !== "comments" || !change.value) {
    return null;
  }

  const val = change.value;
  const commentId = (val.id || val.comment_id) as CommentId | undefined;
  const text = (val.text || "").trim();
  const commenter = val.from;
  const mediaId = (val.media?.id || val.media_id) as MediaId | undefined;

  // Validation: must have valid comment ID, commenter, media ID, and non-empty text
  if (!commentId || !commenter || !commenter.id || !mediaId || !text) {
    return null;
  }

  // Early filter: Drop self-comments (comment from the receiving account or ignored sender)
  if (commenter.id === accountId) {
    return null;
  }
  if (options.ignoreSenderId && commenter.id === options.ignoreSenderId) {
    return null;
  }

  return {
    type: "comment",
    accountId,
    commentId,
    commenterId: commenter.id as InstagramUserId,
    commenterUsername: commenter.username || "",
    mediaId,
    text,
    createdTime: val.created_time || Math.floor(Date.now() / 1000),
  };
}

/**
 * Parses and validates an individual DM / messaging event
 */
function parseMessagingEvent(
  msg: MetaWebhookMessaging,
  accountId: string,
  options: ParseWebhookOptions
): ParsedMessageEvent | null {
  if (!msg.sender || !msg.sender.id) {
    return null;
  }

  const senderId = msg.sender.id as InstagramUserId;
  const isEcho = Boolean(msg.message?.is_echo);

  // Self-sends that are NOT echoes are structurally invalid — drop them.
  // Echoes (messages the page/account itself sent, e.g. the creator replying
  // manually) are preserved so Human Takeover auto-pause can key off them.
  if (!isEcho && (senderId === accountId || (options.ignoreSenderId && senderId === options.ignoreSenderId))) {
    return null;
  }

  const message = msg.message;
  if (!message) {
    return null;
  }

  // Early filter: Deleted messages or unsupported payloads
  if (message.is_deleted || message.is_unsupported) {
    return null;
  }

  const mid = message.mid;
  if (!mid) {
    return null;
  }

  const text = message.text ? message.text.trim() : undefined;
  const quickReplyPayload = message.quick_reply?.payload;

  // Echoes drive takeover pausing and don't need content; real messages must
  // contain either text or a quick-reply action payload
  if (!isEcho && !text && !quickReplyPayload) {
    return null;
  }

  return {
    type: "message",
    accountId,
    senderId,
    recipientId: msg.recipient?.id || accountId,
    mid,
    text,
    quickReplyPayload,
    isEcho,
    timestamp: msg.timestamp || Date.now(),
  };
}
