import { v } from "convex/values";
import { internalQuery, mutation, query } from "./_generated/server";
import { getCurrentUser } from "./users";
import { internal } from "./_generated/api";
import { triggerTypeValidator, flowStatusValidator } from "./schema";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];
    
    return await ctx.db
      .query("flows")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
  },
});

export const get = query({
  args: { id: v.id("flows") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return null;
    
    const flow = await ctx.db.get(args.id);
    if (!flow || flow.userId !== user._id) return null;
    
    return flow;
  },
});

const aiValidator = v.optional(v.object({
  enabled: v.boolean(),
  prompt: v.optional(v.string()),
}));

export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    ai: aiValidator,
    trigger: v.object({
      type: triggerTypeValidator,
      keywords: v.optional(v.array(v.string())),
      conditions: v.optional(v.any()),
      postId: v.optional(v.string()),
      scheduleTime: v.optional(v.string()),
      requireFollow: v.optional(v.boolean()),
    }),
    actions: v.array(v.object({
      type: v.string(),
      config: v.any(),
    })),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");

    // Check plan limits if creating an active flow (default is draft, but good to check if we allow setting status)
    // Since this creates as "draft", we don't strictly need to check active limit here, 
    // but we should check if they are allowed to create flows at all if there was a total limit.
    // The prompt says "Up to X active automation flows". So draft creation is fine.
    
    return await ctx.db.insert("flows", {
      userId: user._id,
      name: args.name,
      description: args.description,
      ai: args.ai,
      status: "draft",
      trigger: args.trigger,
      actions: args.actions,
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("flows"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    ai: aiValidator,
    status: v.optional(flowStatusValidator),
    trigger: v.optional(v.object({
      type: triggerTypeValidator,
      keywords: v.optional(v.array(v.string())),
      conditions: v.optional(v.any()),
      postId: v.optional(v.string()),
      scheduleTime: v.optional(v.string()),
      requireFollow: v.optional(v.boolean()),
    })),
    actions: v.optional(v.array(v.object({
      type: v.string(),
      config: v.any(),
    }))),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");
    
    const flow = await ctx.db.get(args.id);
    if (!flow || flow.userId !== user._id) {
      throw new Error("Flow not found");
    }

    // License gate: evaluation allows 1 active flow; a lifetime license
    // unlocks unlimited automations (they run on the user's own backend).
    if (args.status === "active" && flow.status !== "active") {
      const activeFlows = await ctx.db
        .query("flows")
        .withIndex("by_user_and_status", (q) =>
          q.eq("userId", user._id).eq("status", "active")
        )
        .collect();

      const licensed = await ctx.runQuery(internal.licenses.hasLicense, {
        userId: user._id,
      });

      if (!licensed && activeFlows.length >= 1) {
        throw new Error(
          "Evaluation allows 1 active flow — redeem a lifetime license to unlock unlimited automations."
        );
      }
    }
    
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

export const remove = mutation({
  args: { id: v.id("flows") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");
    
    const flow = await ctx.db.get(args.id);
    if (!flow || flow.userId !== user._id) {
      throw new Error("Flow not found");
    }
    
    await ctx.db.delete(args.id);
  },
});

/** All flows for a user (raw docs) — used by config-push sync to the customer backend. */
export const listForSync = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("flows")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

export const getStats = query({
  args: { id: v.id("flows") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return null;
    
    const flow = await ctx.db.get(args.id);
    if (!flow || flow.userId !== user._id) return null;
    
    return {
      totalExecutions: flow.totalExecutions || 0,
      successfulExecutions: flow.successfulExecutions || 0,
      failedExecutions: flow.failedExecutions || 0,
      successRate: flow.totalExecutions 
        ? ((flow.successfulExecutions || 0) / flow.totalExecutions * 100).toFixed(1)
        : "0",
    };
  },
});