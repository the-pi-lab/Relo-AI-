import { v } from "convex/values";
import { internalQuery, mutation, query, type QueryCtx } from "./_generated/server";
import { getCurrentUser } from "./users";
import { ROLES } from "./schema";

/**
 * One-time lifetime licenses (Phase 9 — replaces Razorpay subscriptions).
 *
 * Model: pay once (out-of-band, e.g. Gumroad/Stripe payment link) → receive a
 * key → redeem here → lifetime software access. The customer still owns all
 * infrastructure/AI costs on their backend.
 *
 * Evaluation without a license: 1 active flow + modest central caps, so the
 * shared control plane can't be abused while users try the product.
 */

const KEY_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // unambiguous chars

function generateKey(): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  let key = "CFAI";
  for (let i = 0; i < 12; i++) {
    if (i % 4 === 0) key += "-";
    key += KEY_ALPHABET[bytes[i] % KEY_ALPHABET.length];
  }
  return key;
}

async function requireAdmin(ctx: QueryCtx) {
  const user = await getCurrentUser(ctx);
  if (!user || user.role !== ROLES.ADMIN) {
    throw new Error("Admin only");
  }
  return user;
}

/** The caller's active license, if any. */
export const myLicense = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return null;
    const license = await ctx.db
      .query("licenses")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();
    if (!license || license.status !== "active") return null;
    return {
      licenseKey: license.licenseKey,
      issuedAt: license.issuedAt,
    };
  },
});

/** Internal gate used by flow activation and central message caps. */
export const hasLicense = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const license = await ctx.db
      .query("licenses")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
    return license?.status === "active";
  },
});

/** True when no admin exists yet (shows the one-time bootstrap button). */
export const needsBootstrap = query({
  args: {},
  handler: async (ctx) => {
    const admin = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("role"), ROLES.ADMIN))
      .first();
    return admin === null;
  },
});

/** One-time bootstrap: the first user can claim admin. Fails once one exists. */
export const makeFirstAdmin = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");
    const existing = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("role"), ROLES.ADMIN))
      .first();
    if (existing) throw new Error("An admin already exists");
    await ctx.db.patch(user._id, { role: ROLES.ADMIN });
    return { ok: true };
  },
});

/** Issue an unbound key (admin only). The key itself is the bearer credential. */
export const issueLicense = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const licenseKey = generateKey();
    await ctx.db.insert("licenses", {
      licenseKey,
      status: "active",
      issuedAt: Date.now(),
    });
    return { licenseKey };
  },
});

/** Revoke a key (admin only). */
export const revokeLicense = mutation({
  args: { licenseKey: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const license = await ctx.db
      .query("licenses")
      .withIndex("by_key", (q) => q.eq("licenseKey", args.licenseKey.trim().toUpperCase()))
      .first();
    if (!license) throw new Error("License not found");
    await ctx.db.patch(license._id, { status: "revoked", revokedAt: Date.now() });
    return { ok: true };
  },
});

/** All keys, newest first (admin only). */
export const listLicenses = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query("licenses").order("desc").take(100);
  },
});

/** Bind an unbound key to the caller. One active license per user. */
export const redeemLicense = mutation({
  args: { licenseKey: v.string() },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");
    const existing = await ctx.db
      .query("licenses")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();
    if (existing?.status === "active") {
      throw new Error("You already have an active license");
    }
    const key = args.licenseKey.trim().toUpperCase();
    const license = await ctx.db
      .query("licenses")
      .withIndex("by_key", (q) => q.eq("licenseKey", key))
      .first();
    if (!license || license.status !== "active") {
      throw new Error("Invalid license key");
    }
    if (license.userId && license.userId !== user._id) {
      throw new Error("This key was already redeemed");
    }
    await ctx.db.patch(license._id, { userId: user._id });
    return { ok: true };
  },
});
