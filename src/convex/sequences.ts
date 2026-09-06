import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./users";
import { flowStatusValidator } from "./schema";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];
    
    return await ctx.db
      .query("sequences")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    steps: v.array(v.object({
      delay: v.number(),
      message: v.string(),
      mediaUrl: v.optional(v.string()),
      buttons: v.optional(v.array(v.object({
        text: v.string(),
        action: v.string(),
      }))),
    })),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");
    
    return await ctx.db.insert("sequences", {
      userId: user._id,
      name: args.name,
      description: args.description,
      status: "draft",
      steps: args.steps,
      totalSubscribers: 0,
      activeSubscribers: 0,
      completedSubscribers: 0,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("sequences"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(flowStatusValidator),
    steps: v.optional(v.array(v.object({
      delay: v.number(),
      message: v.string(),
      mediaUrl: v.optional(v.string()),
      buttons: v.optional(v.array(v.object({
        text: v.string(),
        action: v.string(),
      }))),
    }))),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");
    
    const sequence = await ctx.db.get(args.id);
    if (!sequence || sequence.userId !== user._id) {
      throw new Error("Sequence not found");
    }
    
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});
