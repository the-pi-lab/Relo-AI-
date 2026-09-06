"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

export const fetchUserMedia = internalAction({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args): Promise<any> => {
    // Get Instagram integration
    const integration: any = await ctx.runQuery(internal.integrations.getByTypeInternal, {
      type: "instagram",
      userId: args.userId,
    });
    
    if (!integration) {
      throw new Error("Instagram not connected");
    }

    // Phase 5: tokenless rows mean the token lives in the connected customer
    // backend (media sync runs there, not centrally).
    if (!integration.accessToken) {
      throw new Error(
        "Instagram media is synced by your connected backend — no central token available"
      );
    }
    
    try {
      // Fetch user's media from Instagram Graph API
      const response: Response = await fetch(
        `https://graph.facebook.com/v18.0/${integration.platformUserId}/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count&access_token=${integration.accessToken}`
      );
      
      if (!response.ok) {
        throw new Error(`Instagram API error: ${await response.text()}`);
      }
      
      const data: any = await response.json();
      
      // Filter for reels only
      const reels: any[] = data.data.filter((media: any) => 
        media.media_type === "VIDEO" || media.media_type === "REELS"
      );
      
      // Store or update media in database
      for (const reel of reels) {
        await ctx.runMutation(internal.media.upsertMedia, {
          userId: args.userId,
          mediaId: reel.id,
          caption: reel.caption || "",
          mediaType: reel.media_type,
          mediaUrl: reel.media_url,
          thumbnailUrl: reel.thumbnail_url,
          permalink: reel.permalink,
          timestamp: reel.timestamp,
          likeCount: reel.like_count || 0,
          commentsCount: reel.comments_count || 0,
        });
      }
      
      return reels;
    } catch (error) {
      console.error("Error fetching Instagram media:", error);
      throw error;
    }
  },
});

export const checkUserFollowsBusiness = internalAction({
  args: {
    userId: v.id("users"),
    platformUserId: v.string(),
  },
  handler: async (ctx, args): Promise<boolean> => {
    // Get Instagram integration
    const integration: any = await ctx.runQuery(internal.integrations.getByTypeInternal, {
      type: "instagram",
      userId: args.userId,
    });
    
    if (!integration) {
      return false; // Cannot verify, assume false or handle error
    }
    
    // Phase 14: real check via the Messaging profile API (same field the
    // customer backend uses). Fail OPEN when Meta doesn't answer — a real
    // follower must never be trapped by an API hiccup.
    if (!integration.accessToken) {
      return true;
    }
    try {
      const response: Response = await fetch(
        `https://graph.facebook.com/v18.0/${args.platformUserId}?fields=is_user_follow_business&access_token=${integration.accessToken}`
      );
      if (!response.ok) {
        console.warn(`Follow check unavailable for ${args.platformUserId}, failing open`);
        return true;
      }
      const data: any = await response.json();
      return data.is_user_follow_business !== false;
    } catch (error) {
      console.error("Error checking follow status, failing open:", error);
      return true;
    }
  },
});