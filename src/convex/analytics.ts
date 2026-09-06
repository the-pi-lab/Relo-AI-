import { v } from "convex/values";
import { query } from "./_generated/server";
import { getCurrentUser } from "./users";

export const getDashboardStats = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return null;
    
    // Get today's date
    const today = new Date().toISOString().split('T')[0];
    
    // Get today's analytics
    const todayAnalytics = await ctx.db
      .query("analytics")
      .withIndex("by_user_and_date", (q) => 
        q.eq("userId", user._id).eq("date", today)
      )
      .first();
    
    // Get active flows count
    const activeFlows = await ctx.db
      .query("flows")
      .withIndex("by_user_and_status", (q) => 
        q.eq("userId", user._id).eq("status", "active")
      )
      .collect();
    
    // Get integrations count
    const integrations = await ctx.db
      .query("integrations")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
    
    // Get products count
    const products = await ctx.db
      .query("products")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    
    const license = await ctx.db
      .query("licenses")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    return {
      messagesUsedToday: user.messagesUsedToday || 0,
      licensed: license?.status === "active",
      activeFlowsCount: activeFlows.length,
      integrationsCount: integrations.length,
      productsCount: products.length,
      todayStats: todayAnalytics || {
        totalMessages: 0,
        sentMessages: 0,
        deliveredMessages: 0,
        failedMessages: 0,
        instagramMessages: 0,
        whatsappMessages: 0,
        flowExecutions: 0,
      },
    };
  },
});

export const getRecentMessages = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];
    
    return await ctx.db
      .query("messages")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(args.limit || 50);
  },
});

export const getMessagesByFlow = query({
  args: { flowId: v.id("flows") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];
    
    return await ctx.db
      .query("messages")
      .withIndex("by_user_and_flow", (q) => 
        q.eq("userId", user._id).eq("flowId", args.flowId)
      )
      .collect();
  },
});

export const getWeeklyStats = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];
    
    const stats = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayStats = await ctx.db
        .query("analytics")
        .withIndex("by_user_and_date", (q) => 
          q.eq("userId", user._id).eq("date", dateStr)
        )
        .first();
      
      stats.push({
        date: dateStr,
        totalMessages: dayStats?.totalMessages || 0,
        sentMessages: dayStats?.sentMessages || 0,
        deliveredMessages: dayStats?.deliveredMessages || 0,
        failedMessages: dayStats?.failedMessages || 0,
      });
    }
    
    return stats;
  },
});
