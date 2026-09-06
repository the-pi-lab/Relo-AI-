import { v } from "convex/values";
import { internalMutation, type MutationCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

/**
 * Phase 4 migration guard: when the user owns a CONNECTED customer backend,
 * that backend executes automation — central flowEngine must stand down so
 * the same commenter never gets two DMs (one per runtime).
 */
async function hasConnectedBackend(
  ctx: MutationCtx,
  userId: Id<"users">
): Promise<boolean> {
  const entry = await ctx.db
    .query("backendRegistry")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .first();
  return entry?.status === "connected";
}

async function isDuplicate(ctx: MutationCtx, dedupeKey: string): Promise<boolean> {
  const existing = await ctx.db
    .query("webhookEvents")
    .withIndex("by_dedupe", (q) => q.eq("dedupeKey", dedupeKey))
    .first();
  return existing !== null;
}

export const processInstagramMessage = internalMutation({
  args: {
    senderId: v.string(),
    recipientId: v.string(),
    message: v.any(),
    timestamp: v.number(),
  },
  handler: async (ctx, args) => {
    // Cheap guards before any DB write: drop self-sends and empty payloads.
    // (Meta rejects DMing yourself; echoes would let an autoreply retrigger
    // itself on its own keyword.)
    if (!args.senderId || !args.recipientId) return;
    if (args.senderId === args.recipientId) return;

    // Find the integration for this Instagram account
    const integration = await ctx.db
      .query("integrations")
      .filter((q) =>
        q.and(
          q.eq(q.field("type"), "instagram"),
          q.eq(q.field("platformUserId"), args.recipientId),
          q.eq(q.field("isActive"), true)
        )
      )
      .first();
    
    if (!integration) {
      console.log("No active Instagram integration found");
      return;
    }

    // Migration guard: customer backend owns execution when connected.
    if (await hasConnectedBackend(ctx, integration.userId)) {
      console.log(
        `Skipping central DM execution for user ${integration.userId} (customer backend connected)`
      );
      return;
    }

    // Redelivery dedupe: Meta retries webhooks; the same message must never
    // schedule two flow executions.
    const messageId =
      (args.message as { mid?: string } | undefined)?.mid ??
      `${args.senderId}:${args.recipientId}:${args.timestamp}`;
    const dedupeKey = `ig-dm:${integration.userId}:${messageId}`;
    if (await isDuplicate(ctx, dedupeKey)) {
      console.log(`Skipping duplicate Instagram DM ${messageId}`);
      return;
    }

    // Store the webhook event
    await ctx.db.insert("webhookEvents", {
      userId: integration.userId,
      platform: "instagram",
      eventType: "message",
      payload: args,
      processed: false,
      dedupeKey,
    });
    
    // Trigger flow execution
    await ctx.scheduler.runAfter(0, internal.flowEngine.executeFlows, {
      userId: integration.userId,
      triggerType: "instagram_dm",
      context: {
        senderId: args.senderId,
        message: args.message,
      },
    });
  },
});

export const processInstagramComment = internalMutation({
  args: {
    commentId: v.string(),
    postId: v.optional(v.string()),
    text: v.string(),
    from: v.any(),
    timestamp: v.string(),
    // Instagram account the comment belongs to (entry.id). When provided,
    // the comment routes to that single integration instead of fanning out
    // to every account the user ever connected.
    accountId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!args.commentId) return;

    // Find integration by checking all Instagram integrations
    const integrations = await ctx.db
      .query("integrations")
      .filter((q) =>
        q.and(
          q.eq(q.field("type"), "instagram"),
          q.eq(q.field("isActive"), true)
        )
      )
      .collect();

    if (integrations.length === 0) return;

    // Process for each integration (in case multiple accounts)
    for (const integration of integrations) {
      // Targeted routing: skip accounts this comment does not belong to.
      if (args.accountId && integration.platformUserId !== args.accountId) {
        continue;
      }
      // Skip the account's own comments (Meta rejects DMing yourself).
      if (args.from?.id && args.from.id === integration.platformUserId) {
        continue;
      }

      // Migration guard: customer backend owns execution when connected.
      if (await hasConnectedBackend(ctx, integration.userId)) {
        continue;
      }

      // Redelivery dedupe per user+comment.
      const dedupeKey = `ig-comment:${integration.userId}:${args.commentId}`;
      if (await isDuplicate(ctx, dedupeKey)) {
        continue;
      }

      // License gate: evaluation is capped to protect shared infra;
      // licensed users run on their own backend (no central caps).
      const user = await ctx.db.get(integration.userId);
      if (!user) continue;

      const licensed = await ctx.runQuery(internal.licenses.hasLicense, {
        userId: integration.userId,
      });
      const limit = licensed ? Infinity : 50;
      const today = new Date().toISOString().split('T')[0];
      
      // Reset counter if new day
      if (user.lastResetDate !== today) {
        await ctx.db.patch(integration.userId, {
          messagesUsedToday: 0,
          lastResetDate: today,
        });
      }
      
      // Check if limit exceeded
      if ((user.messagesUsedToday || 0) >= limit) {
        console.log(`User ${user._id} exceeded message limit`);
        continue;
      }
      
      await ctx.db.insert("webhookEvents", {
        userId: integration.userId,
        platform: "instagram",
        eventType: "comment",
        payload: args,
        processed: false,
        dedupeKey,
      });
      
      await ctx.scheduler.runAfter(0, internal.flowEngine.executeFlows, {
        userId: integration.userId,
        triggerType: "instagram_comment",
        context: {
          commentId: args.commentId,
          postId: args.postId,
          text: args.text,
          from: args.from,
        },
      });
      
      // Increment message counter
      await ctx.db.patch(integration.userId, {
        messagesUsedToday: (user.messagesUsedToday || 0) + 1,
      });
    }
  },
});

// WhatsApp automation was removed in v2 (Instagram-only product).
// Kept as a no-op so any in-flight scheduler references fail safe.
export const processWhatsAppMessage = internalMutation({
  args: {
    messageId: v.string(),
    from: v.string(),
    timestamp: v.string(),
    type: v.string(),
    text: v.optional(v.string()),
  },
  handler: async () => {
    return;
  },
});