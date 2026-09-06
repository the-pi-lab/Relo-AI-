import { v } from "convex/values";
import { internalQuery, internalMutation } from "./_generated/server";
import { triggerTypeValidator, integrationTypeValidator } from "./schema";

export const getActiveFlows = internalQuery({
  args: {
    userId: v.id("users"),
    triggerType: triggerTypeValidator,
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("flows")
      .withIndex("by_user_and_status", (q) =>
        q.eq("userId", args.userId).eq("status", "active")
      )
      .filter((q) => q.eq(q.field("trigger.type"), args.triggerType))
      .collect();
  },
});

export const getIntegration = internalQuery({
  args: {
    userId: v.id("users"),
    type: integrationTypeValidator,
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("integrations")
      .withIndex("by_user_and_type", (q) =>
        q.eq("userId", args.userId).eq("type", args.type)
      )
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();
  },
});

export const updateFlowStats = internalMutation({
  args: {
    flowId: v.id("flows"),
    success: v.boolean(),
  },
  handler: async (ctx, args) => {
    const flow = await ctx.db.get(args.flowId);
    if (!flow) return;
    
    await ctx.db.patch(args.flowId, {
      totalExecutions: (flow.totalExecutions || 0) + 1,
      successfulExecutions: args.success
        ? (flow.successfulExecutions || 0) + 1
        : flow.successfulExecutions,
      failedExecutions: !args.success
        ? (flow.failedExecutions || 0) + 1
        : flow.failedExecutions,
    });
  },
});

export const logMessage = internalMutation({
  args: {
    userId: v.id("users"),
    platform: integrationTypeValidator,
    recipientId: v.string(),
    content: v.string(),
    direction: v.union(v.literal("inbound"), v.literal("outbound")),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("messages", {
      userId: args.userId,
      platform: args.platform,
      direction: args.direction,
      recipientId: args.recipientId,
      messageType: "text",
      content: args.content,
      status: "sent",
    });
  },
});

export const searchProducts = internalQuery({
  args: {
    userId: v.id("users"),
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (!args.query) {
      return await ctx.db
        .query("products")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .take(args.limit || 10);
    }
    
    return await ctx.db
      .query("products")
      .withSearchIndex("search_products", (q) => 
        q.search("name", args.query).eq("userId", args.userId)
      )
      .take(args.limit || 10);
  },
});

export const upsertContact = internalMutation({
  args: {
    userId: v.id("users"),
    platform: integrationTypeValidator,
    platformUserId: v.string(),
    username: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("contacts")
      .withIndex("by_platform_user", (q) => q.eq("platformUserId", args.platformUserId))
      .first();
    
    if (existing) {
      await ctx.db.patch(existing._id, {
        username: args.username || existing.username,
        email: args.email || existing.email,
        phone: args.phone || existing.phone,
        name: args.name || existing.name,
        lastInteractionAt: Date.now(),
        totalMessages: (existing.totalMessages || 0) + 1,
      });
      return existing._id;
    }
    
    return await ctx.db.insert("contacts", {
      userId: args.userId,
      platform: args.platform,
      platformUserId: args.platformUserId,
      username: args.username,
      email: args.email,
      phone: args.phone,
      name: args.name,
      tags: [],
      lastInteractionAt: Date.now(),
      totalMessages: 1,
      isSubscribed: true,
    });
  },
});

export const addTagToContact = internalMutation({
  args: {
    userId: v.id("users"),
    platform: integrationTypeValidator,
    platformUserId: v.string(),
    tag: v.string(),
  },
  handler: async (ctx, args) => {
    const contact = await ctx.db
      .query("contacts")
      .withIndex("by_platform_user", (q) => q.eq("platformUserId", args.platformUserId))
      .first();
    
    if (!contact) {
      // Create contact if doesn't exist
      await ctx.db.insert("contacts", {
        userId: args.userId,
        platform: args.platform,
        platformUserId: args.platformUserId,
        tags: [args.tag],
        lastInteractionAt: Date.now(),
        totalMessages: 0,
        isSubscribed: true,
      });
      return;
    }
    
    if (!contact.tags.includes(args.tag)) {
      await ctx.db.patch(contact._id, {
        tags: [...contact.tags, args.tag],
      });
    }
  },
});

export const subscribeToSequence = internalMutation({
  args: {
    userId: v.id("users"),
    platform: integrationTypeValidator,
    platformUserId: v.string(),
    sequenceId: v.id("sequences"),
  },
  handler: async (ctx, args) => {
    const contact = await ctx.db
      .query("contacts")
      .withIndex("by_platform_user", (q) => q.eq("platformUserId", args.platformUserId))
      .first();
    
    if (!contact) {
      throw new Error("Contact not found");
    }
    
    // Check if already subscribed
    const existing = await ctx.db
      .query("sequenceSubscriptions")
      .withIndex("by_contact", (q) => q.eq("contactId", contact._id))
      .filter((q) => q.eq(q.field("sequenceId"), args.sequenceId))
      .first();
    
    if (existing) {
      return; // Already subscribed
    }
    
    await ctx.db.insert("sequenceSubscriptions", {
      sequenceId: args.sequenceId,
      contactId: contact._id,
      currentStep: 0,
      status: "active",
      nextStepAt: Date.now(),
    });
  },
});