"use node";

import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internalAction, action } from "./_generated/server";
import { internal } from "./_generated/api";
import { createOAuthState, verifyOAuthState } from "./security";

// Approved Instagram scopes for Chat Flow AI (must match Meta App Review).
// Covers messaging + comments management for Business/Creator accounts.
const INSTAGRAM_SCOPES = [
  "instagram_business_basic",
  "instagram_business_manage_messages",
  "instagram_business_manage_comments",
  "instagram_basic",
  "instagram_manage_messages",
  "instagram_manage_comments",
  "pages_show_list",
  "pages_read_engagement",
  "business_management",
  "public_profile",
].join(",");

export const getAuthUrl = action({
  args: {
    platform: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.platform !== "instagram") {
      throw new Error(
        "Only Instagram is supported. WhatsApp automation has been removed in v2."
      );
    }

    const authUserId = await getAuthUserId(ctx);
    if (!authUserId) {
      throw new Error("Not authenticated");
    }

    const appId = process.env.META_APP_ID;
    const siteUrl = process.env.SITE_URL;

    if (!appId) {
      throw new Error("META_APP_ID is not configured in environment variables");
    }

    if (!siteUrl) {
      throw new Error("SITE_URL is not configured in environment variables");
    }

    // Bind the OAuth flow to the current user with a signed, expiring state
    // token. The Meta redirect cannot carry Convex auth headers, so the
    // callback verifies this state instead of relying on session cookies.
    const state = createOAuthState(authUserId as unknown as string);
    const redirectUri = `${siteUrl}/api/oauth/callback/instagram`;

    const params = new URLSearchParams({
      client_id: appId,
      redirect_uri: redirectUri,
      scope: INSTAGRAM_SCOPES,
      response_type: "code",
      state,
    });

    return `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`;
  },
});

export const handleInstagramCallback = internalAction({
  args: {
    code: v.string(),
    state: v.string(),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    // Identity comes ONLY from the signed state token (the Meta redirect
    // cannot carry Convex auth headers). CSRF / code-injection attempts fail
    // here when the signature or expiry check rejects the state.
    const verified = verifyOAuthState(args.state);
    if (!verified) {
      throw new Error("Invalid OAuth state");
    }
    if (args.userId && verified.userId !== args.userId) {
      throw new Error("Invalid OAuth state");
    }
    const userId = (args.userId ?? verified.userId) as never;

    const appId = process.env.META_APP_ID;
    const appSecret = process.env.META_APP_SECRET;
    const redirectUri = `${process.env.SITE_URL}/api/oauth/callback/instagram`;

    // Exchange code for access token
    const tokenResponse = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${appId}&client_secret=${appSecret}&code=${args.code}&redirect_uri=${encodeURIComponent(redirectUri)}`
    );

    if (!tokenResponse.ok) {
      throw new Error("Failed to exchange code for token");
    }

    const tokenData = await tokenResponse.json();
    const shortLivedToken = tokenData.access_token;
    if (!shortLivedToken) {
      throw new Error("Failed to exchange code for token");
    }

    // Upgrade to a long-lived token (~60 days). The customer backend has no
    // refresh loop of its own yet, so handing over a 2-hour short-lived token
    // would silently break automation the same day. Fail loudly instead.
    const longLivedResponse = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortLivedToken}`
    );
    if (!longLivedResponse.ok) {
      throw new Error(
        `Failed to exchange for a long-lived token: ${await longLivedResponse.text()}`
      );
    }
    const longLivedData = await longLivedResponse.json();
    const accessToken = longLivedData.access_token;
    if (!accessToken) {
      throw new Error("Failed to exchange for a long-lived token");
    }
    const expiresAt =
      Date.now() + (longLivedData.expires_in || 5184000) * 1000;

    // Get user's Instagram Business Account
    const accountResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`
    );

    if (!accountResponse.ok) {
      throw new Error("Failed to fetch Instagram account");
    }

    const accountData = await accountResponse.json();
    const pageId = accountData.data[0]?.id;

    if (!pageId) {
      throw new Error("No Instagram Business Account found");
    }

    // Get Instagram Business Account ID
    const igResponse = await fetch(
      `https://graph.facebook.com/v18.0/${pageId}?fields=instagram_business_account&access_token=${accessToken}`
    );

    const igData = await igResponse.json();
    const igAccountId = igData.instagram_business_account?.id;

    if (!igAccountId) {
      throw new Error("No Instagram Business Account linked to this page");
    }

    // Get Instagram username
    const profileResponse = await fetch(
      `https://graph.facebook.com/v18.0/${igAccountId}?fields=username&access_token=${accessToken}`
    );

    const profileData = await profileResponse.json();

    const username = profileData.username ?? igAccountId;

    // Phase 5 handoff: when a customer backend is connected, the token is
    // pushed server-to-server to THAT backend and never persisted centrally.
    // pushAccountToken throws on failure — the token is then discarded (retry
    // OAuth) rather than silently stored in the wrong place.
    const connected = await ctx.runQuery(
      internal.backendRegistry.getConnectedBackend,
      { userId }
    );
    if (connected) {
      await ctx.runAction(internal.backendActions.pushAccountToken, {
        userId,
        instagramId: igAccountId,
        username,
        accessToken,
      });
      await ctx.runMutation(internal.integrations.create, {
        type: "instagram",
        accessToken: undefined,
        platformUserId: igAccountId,
        platformUsername: username,
        userId: userId,
      });
      return { success: true, handedOff: true };
    }

    // Legacy path (no customer backend connected yet): central storage until
    // the user connects a backend, at which point verify migrates + clears it.
    await ctx.runMutation(internal.integrations.create, {
      type: "instagram",
      accessToken: accessToken,
      expiresAt,
      platformUserId: igAccountId,
      platformUsername: username,
      userId: userId,
    });

    return { success: true, handedOff: false };
  },
});

// WhatsApp automation was removed in v2 (Instagram-only product).
// This stub preserves the export shape so old scheduled jobs fail loudly
// instead of silently, and will be deleted once no references remain.
export const handleWhatsAppCallback = internalAction({
  args: {
    code: v.string(),
    userId: v.id("users"),
  },
  handler: async () => {
    throw new Error(
      "WhatsApp automation has been removed. Chat Flow AI v2 supports Instagram only."
    );
  },
});