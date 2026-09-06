"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

// Refresh a single integration's token
export const refreshIntegrationToken = internalAction({
  args: {
    integrationId: v.id("integrations"),
  },
  handler: async (ctx, args): Promise<{ success: boolean; error?: string }> => {
    // Get integration details - fetch directly from DB
    const integration = await ctx.runQuery(
      internal.integrations.getExpiringSoon,
      {}
    ).then(integrations => integrations.find(i => i._id === args.integrationId));

    if (!integration) {
      console.error(`Integration ${args.integrationId} not found`);
      return { success: false, error: "Integration not found" };
    }

    // Phase 5: rows without a central token are managed by the connected
    // customer backend — nothing to refresh here.
    if (!integration.accessToken) {
      return { success: true };
    }

    const appId = process.env.META_APP_ID;
    const appSecret = process.env.META_APP_SECRET;

    if (!appId || !appSecret) {
      console.error("META_APP_ID or META_APP_SECRET not configured");
      return { success: false, error: "App credentials not configured" };
    }

    try {
      // Exchange short-lived token for long-lived token
      const response: Response = await fetch(
        `https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${integration.accessToken}`
      );

      if (!response.ok) {
        const errorText: string = await response.text();
        console.error(`Token refresh failed: ${errorText}`);
        
        // Mark integration for re-authentication
        await ctx.runMutation(internal.integrations.markForReauth, {
          integrationId: args.integrationId,
          error: `Token refresh failed: ${errorText}`,
        });
        
        return { success: false, error: errorText };
      }

      const data = await response.json();
      const newAccessToken = data.access_token;
      const expiresIn = data.expires_in || 5184000; // Default 60 days
      const newExpiresAt = Date.now() + (expiresIn * 1000);

      // Update integration with new token
      await ctx.runMutation(internal.integrations.updateToken, {
        integrationId: args.integrationId,
        accessToken: newAccessToken,
        expiresAt: newExpiresAt,
      });

      console.log(`Successfully refreshed token for integration ${args.integrationId}`);
      return { success: true };
    } catch (error) {
      console.error(`Error refreshing token for ${args.integrationId}:`, error);
      
      await ctx.runMutation(internal.integrations.markForReauth, {
        integrationId: args.integrationId,
        error: String(error),
      });
      
      return { success: false, error: String(error) };
    }
  },
});

// Refresh all expiring tokens
export const refreshExpiringTokens = internalAction({
  args: {},
  handler: async (ctx): Promise<{ total: number; results: Array<{ integrationId: any; success: boolean; error?: string }> }> => {
    const expiringIntegrations: Array<any> = await ctx.runQuery(
      internal.integrations.getExpiringSoon,
      {}
    );

    console.log(`Found ${expiringIntegrations.length} integrations needing token refresh`);

    const results: Array<{ integrationId: any; success: boolean; error?: string }> = [];
    for (const integration of expiringIntegrations) {
      const result: { success: boolean; error?: string } = await ctx.runAction(internal.tokenRefresh.refreshIntegrationToken, {
        integrationId: integration._id,
      });
      results.push({ integrationId: integration._id, ...result });
    }

    return {
      total: expiringIntegrations.length,
      results,
    };
  },
});
