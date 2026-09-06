import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./users";
import { integrationTypeValidator } from "./schema";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];
    
    return await ctx.db
      .query("broadcasts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    message: v.string(),
    platform: integrationTypeValidator,
    targetAudience: v.optional(v.object({
      tags: v.optional(v.array(v.string())),
      segments: v.optional(v.array(v.string())),
      excludeTags: v.optional(v.array(v.string())),
    })),
    scheduledFor: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");
    
    return await ctx.db.insert("broadcasts", {
      userId: user._id,
      name: args.name,
      message: args.message,
      platform: args.platform,
      targetAudience: args.targetAudience,
      scheduledFor: args.scheduledFor,
      status: args.scheduledFor ? "scheduled" : "draft",
      totalRecipients: 0,
      sentCount: 0,
      deliveredCount: 0,
      failedCount: 0,
      openedCount: 0,
      clickedCount: 0,
    });
  },
});

export const send = mutation({
  args: { id: v.id("broadcasts") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");
    
    const broadcast = await ctx.db.get(args.id);
    if (!broadcast || broadcast.userId !== user._id) {
      throw new Error("Broadcast not found");
    }
    
    await ctx.db.patch(args.id, { status: "sending" });
    
    // Schedule the actual sending via action
    // This would be implemented in a separate action file
  },
});
