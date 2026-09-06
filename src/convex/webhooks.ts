"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import {
  parseCommentEvents,
  parseMessageEvents,
  verifyWebhookSignature,
} from "./security";

export const handleInstagramWebhook = internalAction({
  args: {
    payload: v.any(),
    signature: v.optional(v.string()),
    rawBody: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { payload, signature, rawBody } = args;

    // Signature is mandatory. The raw request body must be used for HMAC —
    // re-serializing parsed JSON with JSON.stringify changes key order and
    // whitespace, which breaks verification. http.ts forwards the raw text;
    // fall back to JSON only for very old callers during migration.
    const bodyForVerification = rawBody ?? JSON.stringify(payload);
    if (!signature || !verifyWebhookSignature(bodyForVerification, signature)) {
      console.error("Invalid or missing Instagram webhook signature");
      return { success: false, error: "Invalid signature" };
    }

    // Parse with early filtering (wrong object, missing ids, self-comments,
    // echoes). Filtering here avoids pointless DB writes and job enqueues.
    const commentEvents = parseCommentEvents(payload);
    for (const event of commentEvents) {
      await ctx.runMutation(internal.webhooks_mutations.processInstagramComment, {
        commentId: event.commentId,
        postId: event.mediaId,
        text: event.commentText,
        from: { id: event.commenterId, username: event.commenterName },
        timestamp: event.timestamp ?? new Date().toISOString(),
        accountId: event.instagramAccountId,
      });
    }

    const messageEvents = parseMessageEvents(payload);
    for (const event of messageEvents) {
      await ctx.runMutation(internal.webhooks_mutations.processInstagramMessage, {
        senderId: event.senderId,
        recipientId: event.recipientId,
        message: { mid: event.messageId, text: event.text },
        timestamp: event.timestamp ?? Date.now(),
      });
    }

    return { success: true };
  },
});

// WhatsApp automation was removed in v2 (Instagram-only product).
export const handleWhatsAppWebhook = internalAction({
  args: {
    payload: v.any(),
    signature: v.optional(v.string()),
  },
  handler: async () => {
    return { success: false, error: "WhatsApp support has been removed" };
  },
});