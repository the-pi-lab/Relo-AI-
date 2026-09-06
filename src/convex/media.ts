import { v } from "convex/values";
import { query, mutation, action, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { getCurrentUser } from "./users";

export const listReels = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];
    
    return await ctx.db
      .query("instagramMedia")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();
  },
});

export const syncInstagramMedia = action({
  args: {},
  handler: async (ctx) => {
    // Get current user ID from auth
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    
    // Get user from database
    const user = await ctx.runQuery(internal.users.getCurrentUserInternal);
    if (!user) throw new Error("User not found");
    
    await ctx.runAction(internal.instagram.fetchUserMedia, {
      userId: user._id,
    });
  },
});

export const getFlowsForPost = query({
  args: { postId: v.string() },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];
    
    const flows = await ctx.db
      .query("flows")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    
    return flows.filter(flow => flow.trigger.postId === args.postId);
  },
});

export const upsertMedia = internalMutation({
  args: {
    userId: v.id("users"),
    mediaId: v.string(),
    caption: v.string(),
    mediaType: v.string(),
    mediaUrl: v.string(),
    thumbnailUrl: v.optional(v.string()),
    permalink: v.string(),
    timestamp: v.string(),
    likeCount: v.number(),
    commentsCount: v.number(),
  },
  handler: async (ctx, args) => {
    // Check if media already exists
    const existing = await ctx.db
      .query("instagramMedia")
      .withIndex("by_media_id", (q) => q.eq("mediaId", args.mediaId))
      .first();
    
    if (existing) {
      // Update existing media
      await ctx.db.patch(existing._id, {
        caption: args.caption,
        likeCount: args.likeCount,
        commentsCount: args.commentsCount,
        lastFetched: Date.now(),
      });
      return existing._id;
    }
    
    // Insert new media
    return await ctx.db.insert("instagramMedia", {
      userId: args.userId,
      mediaId: args.mediaId,
      caption: args.caption,
      mediaType: args.mediaType,
      mediaUrl: args.mediaUrl,
      thumbnailUrl: args.thumbnailUrl,
      permalink: args.permalink,
      timestamp: args.timestamp,
      likeCount: args.likeCount,
      commentsCount: args.commentsCount,
      lastFetched: Date.now(),
    });
  },
});
