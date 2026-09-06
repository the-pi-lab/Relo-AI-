import { v } from "convex/values";
import { internalMutation, internalQuery, query } from "./_generated/server";
import { getCurrentUser } from "./users";

/**
 * Customer-backend registry (thin control plane).
 *
 * Phase 4 webhook migration: when a user has a CONNECTED customer backend,
 * that backend owns Instagram automation execution and the legacy central
 * flowEngine path must stand down (otherwise both runtimes would DM the
 * same commenter). Webhook mutations consult getConnectedBackend before
 * doing any central work.
 *
 * This table stores endpoint + auth-token HASH only — never Meta tokens,
 * AI keys, or database credentials.
 */

export const getConnectedBackend = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const entry = await ctx.db
      .query("backendRegistry")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
    if (!entry || entry.status !== "connected") return null;
    return entry;
  },
});

/** Where should this user's Instagram automation execute? */
export const getRouting = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args): Promise<
    { mode: "customer"; backendUrl: string } | { mode: "control-plane" }
  > => {
    const entry = await ctx.db
      .query("backendRegistry")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
    if (entry && entry.status === "connected") {
      return { mode: "customer", backendUrl: entry.backendUrl };
    }
    return { mode: "control-plane" };
  },
});

/** Full registry row (including sealed token) — node actions only. */
export const getRawRegistration = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("backendRegistry")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
  },
});

/** Upsert a backend registration (sealed token written by node actions). */
export const saveRegistration = internalMutation({
  args: {
    userId: v.id("users"),
    backendUrl: v.string(),
    provider: v.optional(v.string()),
    authTokenHash: v.string(),
    authTokenEnc: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("backendRegistry")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, {
        backendUrl: args.backendUrl,
        provider: args.provider,
        authTokenHash: args.authTokenHash,
        authTokenEnc: args.authTokenEnc,
        status: "pending",
        lastError: undefined,
      });
      return existing._id;
    }
    return await ctx.db.insert("backendRegistry", {
      userId: args.userId,
      backendUrl: args.backendUrl,
      provider: args.provider,
      authTokenHash: args.authTokenHash,
      authTokenEnc: args.authTokenEnc,
      status: "pending",
    });
  },
});

/** Delete a backend registration (disconnect / switch backends). */
export const removeRegistration = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("backendRegistry")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
    if (existing) await ctx.db.delete(existing._id);
  },
});

export const updateBackendStatus = internalMutation({
  args: {
    userId: v.id("users"),
    status: v.union(
      v.literal("pending"),
      v.literal("connected"),
      v.literal("needs_attention"),
      v.literal("offline"),
      v.literal("incompatible")
    ),
    backendVersion: v.optional(v.string()),
    lastError: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("backendRegistry")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
    if (!existing) throw new Error("No backend registered");
    await ctx.db.patch(existing._id, {
      status: args.status,
      backendVersion: args.backendVersion,
      lastError: args.lastError,
      lastSeenAt: Date.now(),
    });
  },
});

/**
 * Non-sensitive backend connection status for the dashboard / onboarding UI.
 * Exposes endpoint + health only — the auth token hash stays server-side.
 */
export const myBackendStatus = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return null;
    const entry = await ctx.db
      .query("backendRegistry")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();
    if (!entry) return null;
    return {
      backendUrl: entry.backendUrl,
      provider: entry.provider ?? null,
      status: entry.status,
      backendVersion: entry.backendVersion ?? null,
      lastSeenAt: entry.lastSeenAt ?? null,
      lastError: entry.lastError ?? null,
    };
  },
});
