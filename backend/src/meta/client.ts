import type {
  FollowGateDecision,
  FollowStatusResult,
  GenericTemplatePayload,
  OutgoingMessagePayload,
  PlainTextPayload,
} from "../types/meta";
import { parseMetaError, MetaApiError } from "./errors";

const META_GRAPH_VERSION = "v21.0";
const META_BASE_URL = `https://graph.facebook.com/${META_GRAPH_VERSION}`;

export interface MetaClientConfig {
  defaultTimeoutMs?: number;
}

export interface InstagramMediaItem {
  id: string;
  caption?: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  media_url?: string;
  permalink: string;
  thumbnail_url?: string;
  timestamp: string;
}

export interface ConnectedInstagramAccountInfo {
  pageId: string;
  pageName: string;
  pageAccessToken: string;
  instagramAccountId: string;
  instagramUsername: string;
  profilePictureUrl?: string;
}

export class MetaGraphClient {
  private defaultTimeoutMs: number;

  constructor(config: MetaClientConfig = {}) {
    this.defaultTimeoutMs = config.defaultTimeoutMs || 10000;
  }

  /**
   * Internal resilient HTTP dispatcher for Meta Graph API v21.0
   */
  private async request<T>(
    endpoint: string,
    options: {
      method?: "GET" | "POST" | "DELETE";
      token: string;
      body?: unknown;
      queryParams?: Record<string, string | number | undefined>;
      timeoutMs?: number;
    }
  ): Promise<T> {
    const method = options.method || "GET";
    const timeoutMs = options.timeoutMs || this.defaultTimeoutMs;

    const url = new URL(
      endpoint.startsWith("http") ? endpoint : `${META_BASE_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`
    );

    if (options.queryParams) {
      for (const [key, val] of Object.entries(options.queryParams)) {
        if (val !== undefined && val !== null) {
          url.searchParams.set(key, String(val));
        }
      }
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${options.token}`,
      Accept: "application/json",
    };

    let bodyPayload: string | undefined;
    if (options.body) {
      headers["Content-Type"] = "application/json";
      bodyPayload = JSON.stringify(options.body);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url.toString(), {
        method,
        headers,
        body: bodyPayload,
        signal: controller.signal,
      });

      let json: unknown;
      const text = await response.text();
      try {
        json = text ? JSON.parse(text) : {};
      } catch {
        json = { error: { message: text } };
      }

      if (!response.ok) {
        throw parseMetaError(response.status, json);
      }

      return json as T;
    } catch (err: unknown) {
      if (err instanceof MetaApiError) {
        throw err;
      }
      if (err instanceof Error && err.name === "AbortError") {
        throw new MetaApiError(`Request timed out after ${timeoutMs}ms`, {
          code: 408,
          statusCode: 408,
          isTransient: true,
        });
      }
      throw new MetaApiError(err instanceof Error ? err.message : "Network failure", {
        code: 500,
        statusCode: 500,
        isTransient: true,
      });
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * 1. Public Comment Reply:
   * Publishes a public reply comment to an Instagram Reel comment.
   * Endpoint: POST /{comment_id}/replies
   */
  async sendCommentReply(
    pageAccessToken: string,
    commentId: string,
    messageText: string
  ): Promise<{ id: string }> {
    return this.request<{ id: string }>(`/${commentId}/replies`, {
      method: "POST",
      token: pageAccessToken,
      body: {
        message: messageText,
      },
    });
  }

  /**
   * 2. Private Reply to Comment (Direct Message):
   * Dispatches an Instagram Direct Message replying to a specific comment.
   * Supports both 3-button Generic Template card or plain text spintax.
   * Endpoint: POST /me/messages (with recipient.comment_id)
   */
  async sendPrivateReply(
    pageAccessToken: string,
    payload: OutgoingMessagePayload
  ): Promise<{ recipient_id: string; message_id: string }> {
    return this.request<{ recipient_id: string; message_id: string }>(`/me/messages`, {
      method: "POST",
      token: pageAccessToken,
      body: payload,
    });
  }

  /**
   * 3. Standard Direct Message:
   * Sends a standard DM to an Instagram user ID (within the 24h interaction window).
   * Endpoint: POST /me/messages (with recipient.id)
   */
  async sendDirectMessage(
    pageAccessToken: string,
    recipientId: string,
    payload: { text?: string; attachment?: unknown }
  ): Promise<{ recipient_id: string; message_id: string }> {
    return this.request<{ recipient_id: string; message_id: string }>(`/me/messages`, {
      method: "POST",
      token: pageAccessToken,
      body: {
        recipient: { id: recipientId },
        message: payload,
      },
    });
  }

  /**
   * 4. Biometric Follow-Gate Verification:
   * Checks if an Instagram user follows the business account.
   * Implements strict 1500ms timeout with automatic fail-open to ensure
   * high-intent leads are NEVER lost due to Instagram API latency.
   */
  async getUserFollowStatus(
    accessToken: string,
    igAccountId: string,
    targetUserId: string
  ): Promise<FollowStatusResult> {
    const startTime = Date.now();
    const timeoutMs = 1500;

    try {
      // Query Graph API for user relationship / follower connection
      const result = await this.request<{ is_following?: boolean; data?: unknown }>(
        `/${igAccountId}/followers`,
        {
          method: "GET",
          token: accessToken,
          queryParams: {
            user_id: targetUserId,
          },
          timeoutMs,
        }
      );

      const latencyMs = Date.now() - startTime;
      const isFollowing = typeof result.is_following === "boolean" ? result.is_following : true;

      const decision: FollowGateDecision = isFollowing
        ? "ALLOW_VERIFIED_FOLLOWER"
        : "PROMPT_FOLLOW";

      return {
        isFollowing,
        latencyMs,
        decision,
      };
    } catch {
      // Automatic Fail-Open: allow user through rather than blocking their DM delivery
      const latencyMs = Date.now() - startTime;
      return {
        isFollowing: null,
        latencyMs,
        decision: "ALLOW_FAIL_OPEN",
      };
    }
  }

  /**
   * 5. List Recent Instagram Reels:
   * Fetches the latest 25 video/reel posts for the Creator Studio dashboard.
   */
  async getRecentReels(
    accessToken: string,
    instagramAccountId: string,
    limit = 25
  ): Promise<InstagramMediaItem[]> {
    const result = await this.request<{ data: InstagramMediaItem[] }>(
      `/${instagramAccountId}/media`,
      {
        method: "GET",
        token: accessToken,
        queryParams: {
          fields: "id,caption,media_type,media_url,permalink,thumbnail_url,timestamp",
          limit,
        },
      }
    );

    return result.data || [];
  }

  /**
   * 6. Exchange Short-Lived Token for Long-Lived Token (60 days validity):
   */
  async exchangeForLongLivedToken(
    appId: string,
    appSecret: string,
    shortLivedToken: string
  ): Promise<{ access_token: string; token_type: string; expires_in: number }> {
    return this.request<{ access_token: string; token_type: string; expires_in: number }>(
      `/oauth/access_token`,
      {
        method: "GET",
        token: shortLivedToken,
        queryParams: {
          grant_type: "fb_exchange_token",
          client_id: appId,
          client_secret: appSecret,
          fb_exchange_token: shortLivedToken,
        },
      }
    );
  }

  /**
   * 7. Fetch Connected Facebook Pages & Associated Instagram Accounts:
   */
  async getConnectedAccounts(
    userAccessToken: string
  ): Promise<ConnectedInstagramAccountInfo[]> {
    interface PageData {
      id: string;
      name: string;
      access_token: string;
      instagram_business_account?: {
        id: string;
        username: string;
        profile_picture_url?: string;
      };
    }

    const res = await this.request<{ data: PageData[] }>(`/me/accounts`, {
      method: "GET",
      token: userAccessToken,
      queryParams: {
        fields: "id,name,access_token,instagram_business_account{id,username,profile_picture_url}",
      },
    });

    const accounts: ConnectedInstagramAccountInfo[] = [];

    for (const page of res.data || []) {
      if (page.instagram_business_account) {
        accounts.push({
          pageId: page.id,
          pageName: page.name,
          pageAccessToken: page.access_token,
          instagramAccountId: page.instagram_business_account.id,
          instagramUsername: page.instagram_business_account.username,
          profilePictureUrl: page.instagram_business_account.profile_picture_url,
        });
      }
    }

    return accounts;
  }
}

/**
 * Singleton client instance for reuse across Workers requests
 */
export const metaGraphClient = new MetaGraphClient();
