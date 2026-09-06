import { v } from "convex/values";
import { mutation, query, internalMutation, internalQuery } from "./_generated/server";
import { getCurrentUser } from "./users";
import { integrationTypeValidator } from "./schema";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];
    
    return await ctx.db
      .query("integrations")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
  },
});

export const getByType = query({
  args: { type: integrationTypeValidator },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return null;
    
    const integrations = await ctx.db
      .query("integrations")
      .withIndex("by_user_and_type", (q) => 
        q.eq("userId", user._id).eq("type", args.type)
      )
      .collect();
    
    return integrations[0] || null;
  },
});

/** All integrations for a user — used by legacy token migration. */
export const listAllForUser = internalQuery({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("integrations")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

export const getByTypeInternal = internalQuery({
  args: { 
    type: integrationTypeValidator,
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const integrations = await ctx.db
      .query("integrations")
      .withIndex("by_user_and_type", (q) => 
        q.eq("userId", args.userId).eq("type", args.type)
      )
      .collect();
    
    return integrations[0] || null;
  },
});

export const create = internalMutation({
  args: {
    type: integrationTypeValidator,
    // Optional since Phase 5: omitted when the token was handed to the
    // connected customer backend instead of persisted centrally.
    accessToken: v.optional(v.string()),
    refreshToken: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
    platformUserId: v.string(),
    platformUsername: v.optional(v.string()),
    phoneNumberId: v.optional(v.string()),
    businessAccountId: v.optional(v.string()),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Check if integration already exists
    const existing = await ctx.db
      .query("integrations")
      .withIndex("by_user_and_type", (q) => 
        q.eq("userId", args.userId).eq("type", args.type)
      )
      .first();
    
    if (existing) {
      // Update existing integration
      await ctx.db.patch(existing._id, {
        accessToken: args.accessToken,
        refreshToken: args.refreshToken,
        expiresAt: args.expiresAt,
        platformUserId: args.platformUserId,
        platformUsername: args.platformUsername,
        phoneNumberId: args.phoneNumberId,
        businessAccountId: args.businessAccountId,
        isActive: true,
        lastTokenRefresh: Date.now(),
      });
      return existing._id;
    }
    
    return await ctx.db.insert("integrations", {
      userId: args.userId,
      type: args.type,
      accessToken: args.accessToken,
      refreshToken: args.refreshToken,
      expiresAt: args.expiresAt,
      platformUserId: args.platformUserId,
      platformUsername: args.platformUsername,
      phoneNumberId: args.phoneNumberId,
      businessAccountId: args.businessAccountId,
      isActive: true,
      lastTokenRefresh: Date.now(),
    });
  },
});

export const disconnect = mutation({
  args: { id: v.id("integrations") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");
    
    const integration = await ctx.db.get(args.id);
    if (!integration || integration.userId !== user._id) {
      throw new Error("Integration not found");
    }
    
    await ctx.db.patch(args.id, { isActive: false });
  },
});

/**
 * Remove a centrally stored token after handoff/migration to the customer
 * backend (also clears expiry so refresh scans skip the row).
 */
export const clearToken = internalMutation({
  args: {
    integrationId: v.id("integrations"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.integrationId, {
      accessToken: undefined,
      expiresAt: undefined,
      lastTokenRefresh: Date.now(),
    });
  },
});

export const updateToken = internalMutation({
  args: {
    integrationId: v.id("integrations"),
    accessToken: v.string(),
    expiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.integrationId, {
      accessToken: args.accessToken,
      expiresAt: args.expiresAt,
      lastTokenRefresh: Date.now(),
    });
  },
});

export const markForReauth = internalMutation({
  args: {
    integrationId: v.id("integrations"),
    error: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.integrationId, {
      isActive: false,
      lastError: args.error,
      needsReauth: true,
    });
  },
});

export const getExpiringSoon = internalQuery({
  args: {},
  handler: async (ctx) => {
    const sevenDaysFromNow = Date.now() + (7 * 24 * 60 * 60 * 1000);
    
    const allIntegrations = await ctx.db
      .query("integrations")
      .collect();
    
    return allIntegrations.filter(integration => 
      integration.isActive && 
      integration.expiresAt && 
      integration.expiresAt < sevenDaysFromNow &&
      integration.expiresAt > Date.now()
    );
  },
});