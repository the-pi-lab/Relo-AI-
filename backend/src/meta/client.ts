import type {
  GenericTemplatePayload,
  OutgoingMessagePayload,
  PlainTextPayload,
} from "../types/meta";
import { parseMetaError, MetaApiError, TokenExpiredError } from "./errors";

const DEFAULT_META_GRAPH_VERSION = "v21.0";
let metaBaseUrl = `https://graph.facebook.com/${DEFAULT_META_GRAPH_VERSION}`;

/**
 * Points the client at `META_GRAPH_API_VERSION` from the Worker env.
 *
 * The version used to be a hardcoded constant, so shipping a new Graph version
 * required a code deploy. Only a well-formed `v<major>.<minor>` value is
 * accepted: interpolating arbitrary config into a URL is how a typo becomes a
 * 404 on every send.
 */
export function setMetaGraphVersion(version?: string): void {
  const candidate = (version || "").trim();
  if (!candidate) return;
  if (!/^v\d+\.\d+$/.test(candidate)) {
    console.warn(
      `[Meta] Ignoring invalid META_GRAPH_API_VERSION "${candidate}" — expected e.g. v21.0.`
    );
    return;
  }
  metaBaseUrl = `https://graph.facebook.com/${candidate}`;
}

/** The version currently in use (exposed for diagnostics/tests). */
export function getMetaGraphVersion(): string {
  return metaBaseUrl.split("/").pop() || DEFAULT_META_GRAPH_VERSION;
}

/**
 * Webhook fields, split by the Graph node that accepts them.
 *
 * Meta validates the *entire* `subscribed_fields` list against the node and
 * rejects the request if one entry is not valid there. Sending comment and
 * messaging fields together is therefore all-or-nothing: one bad field means
 * no subscription at all, including comments.
 */
export const COMMENT_WEBHOOK_FIELDS = ["comments"];
export const MESSAGING_WEBHOOK_FIELDS = ["messages", "messaging_postbacks"];

export interface WebhookSubscriptionResult {
  /** True when the comment subscription (the Reel automation path) worked. */
  success: boolean;
  commentsReady: boolean;
  messagingReady: boolean;
  /** What Meta reports as subscribed, read back after the write. */
  verifiedComments: boolean;
  verifiedMessaging: boolean;
  subscribedFields: string[];
  pageId: string | null;
  /** Per-node failures, so a creator can be told exactly what Meta refused. */
  errors: Array<{ node: string; fields: string[]; message: string }>;
}

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
      endpoint.startsWith("http") ? endpoint : `${metaBaseUrl}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`
    );

    if (options.queryParams) {
      for (const [key, val] of Object.entries(options.queryParams)) {
        if (val !== undefined && val !== null) {
          url.searchParams.set(key, String(val));
        }
      }
    }

    const headers: Record<string, string> = {
      Accept: "application/json",
    };
    if (options.token) {
      headers.Authorization = `Bearer ${options.token}`;
    }

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
   * Supports both graph.instagram.com and graph.facebook.com endpoints.
   */
  async sendCommentReply(
    pageAccessToken: string,
    commentId: string,
    messageText: string
  ): Promise<{ id: string }> {
    try {
      const igUrl = new URL(`https://graph.instagram.com/v21.0/${commentId}/replies`);
      igUrl.searchParams.set("access_token", pageAccessToken);
      const res = await fetch(igUrl.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ message: messageText }),
      });
      const data = (await res.json()) as any;
      if (res.ok && data?.id) {
        return data;
      }
    } catch (_) {}

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
   * Supports both graph.instagram.com and graph.facebook.com endpoints.
   */
  async sendPrivateReply(
    pageAccessToken: string,
    payload: OutgoingMessagePayload
  ): Promise<{ recipient_id: string; message_id: string }> {
    try {
      const igUrl = new URL(`https://graph.instagram.com/v21.0/me/messages`);
      igUrl.searchParams.set("access_token", pageAccessToken);
      const res = await fetch(igUrl.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as any;
      if (res.ok && data?.message_id) {
        return data;
      }
    } catch (_) {}

    return this.request<{ recipient_id: string; message_id: string }>(`/me/messages`, {
      method: "POST",
      token: pageAccessToken,
      body: payload,
    });
  }

  /**
   * 3. Standard Direct Message:
   * Sends a standard DM to an Instagram user ID (within the 24h interaction window).
   * Supports both graph.instagram.com and graph.facebook.com endpoints.
   */
  async sendDirectMessage(
    pageAccessToken: string,
    recipientId: string,
    payload: { text?: string; attachment?: unknown }
  ): Promise<{ recipient_id: string; message_id: string }> {
    try {
      const igUrl = new URL(`https://graph.instagram.com/v21.0/me/messages`);
      igUrl.searchParams.set("access_token", pageAccessToken);
      const res = await fetch(igUrl.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          recipient: { id: recipientId },
          message: payload,
        }),
      });
      const data = (await res.json()) as any;
      if (res.ok && data?.message_id) {
        return data;
      }
    } catch (_) {}

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
   * A single Graph call with a short timeout. Subscription bookkeeping is never
   * allowed to hold a request open — a hung Meta call used to stall the whole
   * connect/automation-save request behind a 10s default timeout.
   */
  private async graphCall(
    url: URL,
    method: "GET" | "POST"
  ): Promise<{ ok: boolean; status: number; data: any }> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    try {
      const res = await fetch(url.toString(), {
        method,
        headers: { Accept: "application/json" },
        signal: controller.signal,
      });
      const text = await res.text();
      let data: any = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = { error: { message: text } };
      }
      return { ok: res.ok, status: res.status, data };
    } catch (error: any) {
      return {
        ok: false,
        status: 0,
        data: {
          error: {
            message:
              error?.name === "AbortError"
                ? "Request timed out after 8000ms"
                : error?.message || "Network failure",
          },
        },
      };
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * POST /{node}/subscribed_apps.
   *
   * Meta answers a successful subscribe with `{ success: true }`. A 200 that
   * carries `{ data: [] }` is an *empty listing*, not a success — the old
   * `data.success || data.data` check read the empty array as truthy and
   * reported success while nothing had been subscribed. Only an explicit
   * `success === true`, or a non-empty `data` array, counts here.
   */
  private async subscribeFieldsOnNode(
    accessToken: string,
    nodeId: string,
    fields: string[],
    host: "graph.facebook.com" | "graph.instagram.com"
  ): Promise<{ ok: boolean; data: any }> {
    const url = new URL(`https://${host}/${getMetaGraphVersion()}/${nodeId}/subscribed_apps`);
    url.searchParams.set("subscribed_fields", fields.join(","));
    url.searchParams.set("access_token", accessToken);
    const res = await this.graphCall(url, "POST");
    const success =
      res.ok &&
      (res.data?.success === true ||
        (Array.isArray(res.data?.data) && res.data.data.length > 0));
    return { ok: success, data: res.data };
  }

  /**
   * The page that owns this token, when one exists.
   *
   * Facebook Login returns a Page token, and Meta scopes *messaging* webhook
   * fields to the Page node. Instagram Business Login has no page at all, so
   * this returns null and the caller keeps messaging fields on the IG node.
   * Best effort: a failure here must not block the comment subscription.
   */
  async getPageIdForToken(accessToken: string): Promise<string | null> {
    const url = new URL(`https://graph.facebook.com/${getMetaGraphVersion()}/me`);
    url.searchParams.set("fields", "id");
    url.searchParams.set("access_token", accessToken);
    const res = await this.graphCall(url, "GET");
    const id = res.ok ? String(res.data?.id || "").trim() : "";
    return id && /^\d{5,}$/.test(id) ? id : null;
  }

  /**
   * Reads back what Meta says is actually subscribed. `GET` returns
   * `{ data: [{ subscribed_fields: [...] }] }`; anything else means "unknown",
   * which is reported as an empty list rather than guessed at.
   */
  async getSubscribedApps(
    accessToken: string,
    instagramAccountId: string,
    pageId?: string | null
  ): Promise<string[]> {
    const nodes: Array<{ id: string; host: "graph.facebook.com" | "graph.instagram.com" }> = [
      { id: instagramAccountId, host: "graph.facebook.com" },
      { id: instagramAccountId, host: "graph.instagram.com" },
    ];
    if (pageId) nodes.push({ id: pageId, host: "graph.facebook.com" });

    const fields = new Set<string>();
    for (const node of nodes) {
      const url = new URL(
        `https://${node.host}/${getMetaGraphVersion()}/${node.id}/subscribed_apps`
      );
      url.searchParams.set("access_token", accessToken);
      const res = await this.graphCall(url, "GET");
      if (!res.ok || !Array.isArray(res.data?.data)) continue;
      for (const entry of res.data.data) {
        const list = entry?.subscribed_fields;
        if (Array.isArray(list)) for (const f of list) fields.add(String(f));
      }
    }
    return Array.from(fields);
  }

  /**
   * Read-only view of webhook readiness for the health endpoint.
   *
   * Deliberately does not subscribe: a GET must never mutate Meta state. It
   * reports what Meta says is live so the dashboard can show "comments not
   * subscribed" instead of a green "connected" badge over a dead pipeline.
   */
  async getWebhookReadiness(
    accessToken: string,
    instagramAccountId: string
  ): Promise<{
    pageId: string | null;
    subscribedFields: string[];
    commentsReady: boolean;
    messagingReady: boolean;
  }> {
    const pageId = await this.getPageIdForToken(accessToken);
    const subscribedFields = await this.getSubscribedApps(
      accessToken,
      instagramAccountId,
      pageId
    );
    return {
      pageId,
      subscribedFields,
      commentsReady: subscribedFields.includes("comments"),
      messagingReady: subscribedFields.includes("messages"),
    };
  }

  /**
   * Subscribes the account to the webhook fields RELO actually needs.
   *
   * Two things used to break real deployments while every test passed:
   *
   *  1. `comments`, `messages` and `messaging_postbacks` were sent as ONE
   *     `subscribed_fields` value on ONE node. Meta rejects the whole request
   *     when any field is invalid for that node — so a messaging field the
   *     account cannot use also killed the comment subscription, and no
   *     comment webhook was ever delivered. Fields are now grouped by node.
   *  2. The failure was logged with `console.warn` and swallowed, so the
   *     dashboard happily said "connected" while nothing was subscribed.
   *     The caller now gets a structured result it can show the creator.
   *
   * `success` reflects the comment subscription, because that is the path the
   * Reel automation depends on; messaging readiness is reported separately.
   */
  async subscribeAppToInstagram(
    accessToken: string,
    instagramAccountId: string,
    pageIdHint?: string | null
  ): Promise<WebhookSubscriptionResult> {
    const errors: WebhookSubscriptionResult["errors"] = [];

    // 1. Comment webhooks live on the Instagram account node. Facebook Login
    //    tokens need graph.facebook.com; Instagram Login tokens need
    //    graph.instagram.com. Try both, first success wins.
    let commentsReady = false;
    for (const host of ["graph.facebook.com", "graph.instagram.com"] as const) {
      const attempt = await this.subscribeFieldsOnNode(
        accessToken,
        instagramAccountId,
        COMMENT_WEBHOOK_FIELDS,
        host
      );
      if (attempt.ok) {
        commentsReady = true;
        break;
      }
      errors.push({
        node: `${host}/${instagramAccountId}`,
        fields: COMMENT_WEBHOOK_FIELDS,
        message: String(attempt.data?.error?.message || "subscribe failed"),
      });
    }

    // 2. Messaging webhooks live on the Page node for Facebook Login (the page
    //    token knows its page) and on the IG node for Instagram Login. A hint
    //    equal to the IG id is the IG Login case, not a page.
    const hint =
      pageIdHint && String(pageIdHint).trim() !== String(instagramAccountId).trim()
        ? String(pageIdHint).trim()
        : null;
    const pageId = hint || (await this.getPageIdForToken(accessToken));
    let messagingReady = false;
    const messagingNodes: Array<{
      id: string;
      host: "graph.facebook.com" | "graph.instagram.com";
    }> = pageId
      ? [{ id: pageId, host: "graph.facebook.com" }]
      : [
          { id: instagramAccountId, host: "graph.facebook.com" },
          { id: instagramAccountId, host: "graph.instagram.com" },
        ];

    for (const node of messagingNodes) {
      const attempt = await this.subscribeFieldsOnNode(
        accessToken,
        node.id,
        MESSAGING_WEBHOOK_FIELDS,
        node.host
      );
      if (attempt.ok) {
        messagingReady = true;
        break;
      }
      errors.push({
        node: `${node.host}/${node.id}`,
        fields: MESSAGING_WEBHOOK_FIELDS,
        message: String(attempt.data?.error?.message || "subscribe failed"),
      });
    }

    // 3. Read back the truth. This is what the health view renders, so a
    //    creator can see `comments` missing instead of guessing why nothing
    //    fires.
    const subscribedFields = await this.getSubscribedApps(
      accessToken,
      instagramAccountId,
      pageId
    );
    const verifiedComments =
      subscribedFields.length === 0 ? commentsReady : subscribedFields.includes("comments");
    const verifiedMessaging =
      subscribedFields.length === 0
        ? messagingReady
        : subscribedFields.includes("messages");

    if (!commentsReady) {
      console.warn(
        `[Meta] Could not subscribe @${instagramAccountId} to comment webhooks:`,
        errors
      );
    }

    return {
      success: commentsReady,
      commentsReady,
      messagingReady,
      verifiedComments,
      verifiedMessaging,
      subscribedFields,
      pageId,
      errors,
    };
  }

  /**
   * 4. List Recent Instagram Reels / Posts:
   * Fetches the latest 25 video/reel posts for the Creator Studio dashboard.
   * Supports Direct Instagram Graph API (graph.instagram.com) with Facebook Graph fallback.
   */
  async getRecentReels(
    accessToken: string,
    instagramAccountId: string,
    limit = 25
  ): Promise<InstagramMediaItem[]> {
    const fields = "id,caption,media_type,media_url,permalink,thumbnail_url,timestamp";

    // 1. First try Direct Instagram Graph API (/me/media) for Instagram Business Login
    try {
      const igUrl = new URL("https://graph.instagram.com/v21.0/me/media");
      igUrl.searchParams.set("fields", fields);
      igUrl.searchParams.set("limit", String(limit));
      igUrl.searchParams.set("access_token", accessToken);

      const res = await fetch(igUrl.toString(), {
        headers: { Accept: "application/json" },
      });
      const data = (await res.json()) as any;
      if (res.ok && Array.isArray(data.data)) {
        return data.data;
      }
      if (data?.error) {
        const parsed = parseMetaError(res.status, data);
        if (parsed instanceof TokenExpiredError || parsed.code === 190) {
          throw parsed;
        }
        console.warn("[Meta] graph.instagram.com/me/media:", parsed.message);
      }
    } catch (err) {
      if (err instanceof TokenExpiredError || (err instanceof MetaApiError && err.code === 190)) {
        throw err;
      }
    }

    // 2. Try Direct Instagram Graph API with accountId
    if (instagramAccountId && instagramAccountId !== "ig_user") {
      try {
        const igUrl = new URL(`https://graph.instagram.com/v21.0/${instagramAccountId}/media`);
        igUrl.searchParams.set("fields", fields);
        igUrl.searchParams.set("limit", String(limit));
        igUrl.searchParams.set("access_token", accessToken);

        const res = await fetch(igUrl.toString(), {
          headers: { Accept: "application/json" },
        });
        const data = (await res.json()) as any;
        if (res.ok && Array.isArray(data.data)) {
          return data.data;
        }
        if (data?.error) {
          const parsed = parseMetaError(res.status, data);
          if (parsed instanceof TokenExpiredError || parsed.code === 190) {
            throw parsed;
          }
        }
      } catch (err) {
        if (err instanceof TokenExpiredError || (err instanceof MetaApiError && err.code === 190)) {
          throw err;
        }
      }
    }

    // 3. Fallback to Facebook Graph API for legacy Facebook Page tokens
    const result = await this.request<{ data: InstagramMediaItem[] }>(
      `/${instagramAccountId}/media`,
      {
        method: "GET",
        token: accessToken,
        queryParams: {
          fields,
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
   * 6b. Exchange the OAuth authorization code for a short-lived user token
   * (server-side login flow). The redirect_uri must exactly match the one
   * used when the code was minted.
   */
  async exchangeCodeForToken(
    appId: string,
    appSecret: string,
    code: string,
    redirectUri?: string
  ): Promise<{ access_token: string; token_type: string }> {
    return this.request<{ access_token: string; token_type: string }>(
      `/oauth/access_token`,
      {
        method: "GET",
        token: "",
        queryParams: {
          client_id: appId,
          client_secret: appSecret,
          code,
          ...(redirectUri ? { redirect_uri: redirectUri } : {}),
        },
      }
    );
  }

  /**
   * 6c. Exchange Instagram OAuth Code for short-lived user token (Instagram Business Login).
   */
  async exchangeInstagramCodeForToken(
    appId: string,
    appSecret: string,
    code: string,
    redirectUri?: string
  ): Promise<{ access_token: string; user_id: string | number }> {
    const cleanCode = code.replace(/#_$/, "");
    const cleanUri = (redirectUri || "").replace(/#_$/, "");
    const params = new URLSearchParams({
      client_id: appId,
      client_secret: appSecret,
      grant_type: "authorization_code",
      redirect_uri: cleanUri,
      code: cleanCode,
    });
    const res = await fetch("https://api.instagram.com/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: params.toString(),
    });
    const data = (await res.json()) as any;
    if (!res.ok || data.error_type || data.error) {
      const msg = data.error_message || data.error?.message || `HTTP ${res.status}`;
      throw new MetaApiError(`Instagram token exchange failed: ${msg}`, {
        code: res.status,
        statusCode: res.status,
        errorType: data.error_type || "OAuthException",
      });
    }
    return {
      access_token: data.access_token,
      user_id: String(data.user_id),
    };
  }

  /**
   * 6d. Upgrade short-lived Instagram token to 60-day long-lived token.
   */
  async exchangeInstagramForLongLivedToken(
    appSecret: string,
    shortLivedToken: string
  ): Promise<{ access_token: string; token_type: string; expires_in: number }> {
    const url = new URL("https://graph.instagram.com/access_token");
    url.searchParams.set("grant_type", "ig_exchange_token");
    url.searchParams.set("client_secret", appSecret);
    url.searchParams.set("access_token", shortLivedToken);

    const res = await fetch(url.toString(), {
      method: "GET",
      headers: { Accept: "application/json" },
    });
    const data = (await res.json()) as any;
    if (!res.ok || data.error) {
      const msg = data.error?.message || `HTTP ${res.status}`;
      throw new MetaApiError(`Instagram long-lived token exchange failed: ${msg}`, {
        code: res.status,
        statusCode: res.status,
      });
    }
    return {
      access_token: data.access_token,
      token_type: data.token_type || "bearer",
      expires_in: data.expires_in || 60 * 24 * 60 * 60,
    };
  }

  /**
   * 7b. Fetch Instagram Professional Profile directly (no Facebook Page required).
   */
  async getInstagramUserProfile(
    token: string,
    userId?: string
  ): Promise<{ id: string; username: string; profile_picture_url?: string }> {
    const url = new URL(
      userId ? `https://graph.instagram.com/v21.0/${userId}` : "https://graph.instagram.com/v21.0/me"
    );
    url.searchParams.set("fields", "id,username,profile_picture_url");
    url.searchParams.set("access_token", token);

    let res = await fetch(url.toString(), {
      method: "GET",
      headers: { Accept: "application/json" },
    });
    let data = (await res.json()) as any;
    if (!res.ok || data.error) {
      const fallbackUrl = new URL("https://graph.instagram.com/me");
      fallbackUrl.searchParams.set("fields", "id,username,profile_picture_url");
      fallbackUrl.searchParams.set("access_token", token);
      const fallbackRes = await fetch(fallbackUrl.toString(), {
        headers: { Accept: "application/json" },
      });
      data = (await fallbackRes.json()) as any;
    }
    const resolvedId = String(data.id || data.user_id || userId || "ig_user");
    const resolvedUsername = data.username || `ig_${resolvedId.slice(-6)}`;
    return {
      id: resolvedId,
      username: resolvedUsername,
      profile_picture_url: data.profile_picture_url,
    };
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
