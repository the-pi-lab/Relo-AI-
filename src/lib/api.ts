import type {
  ApiResponse,
  ConnectedAccount,
  InstagramReelMedia,
  ReelAutomation,
  CapturedLead,
  Product,
  SystemTelemetry,
  TemplateCardConfig,
  Campaign,
  CampaignPayload,
  CampaignTarget,
  Reachability,
  Flow,
  FlowGraph,
  ReferralSummary,
  LinkPage,
  LinkBlock,
  LinkPageProduct,
  ContentPlan,
  ContentStats,
  ContentStatus,
} from "../types/contracts";

const API_BASE_URL = import.meta.env.VITE_API_URL || "";

export interface UserSession {
  id: string;
  email: string;
  createdAt: number;
}

/**
 * Storage helpers
 */
const TOKEN_KEY = "relo_auth_token";
const USER_KEY = "relo_user_session";

export const authStorage = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },
  setToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
  },
  getUser(): UserSession | null {
    const raw = localStorage.getItem(USER_KEY);
    try {
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
  setUser(user: UserSession) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  clear() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
};

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

function handleAuthFailure() {
  authStorage.clear();
  window.location.assign("/login");
}

/**
 * Internal typed fetch wrapper: status checking, JSON safety, request
 * timeouts, abort passthrough, and one-shot 401 recovery.
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit & { timeoutMs?: number } = {}
): Promise<T> {
  const { timeoutMs = 20_000, signal, ...init } = options;
  const token = authStorage.getToken();
  const headers: Record<string, string> = {
    ...(init.headers as Record<string, string>),
  };

  if (init.body) {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const url = `${API_BASE_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;
  const timeoutSignal = AbortSignal.timeout(timeoutMs);
  const compositeSignal = signal
    ? AbortSignal.any([signal, timeoutSignal])
    : timeoutSignal;

  let response: Response;
  try {
    response = await fetch(url, { ...init, headers, signal: compositeSignal });
  } catch (err) {
    if (err instanceof Error && err.name === "TimeoutError") {
      throw new ApiError("The request timed out. Please try again.", 408);
    }
    throw new ApiError("Network error — check your connection and try again.", 0);
  }

  if (response.status === 401) {
    handleAuthFailure();
    throw new ApiError("Your session expired. Please sign in again.", 401);
  }

  let json: ApiResponse<T> | null = null;
  try {
    json = await response.json();
  } catch {
    if (!response.ok) {
      throw new ApiError(`Request failed (${response.status}).`, response.status);
    }
    throw new ApiError("The server returned an unexpected response.", response.status);
  }

  if (!json || !json.success) {
    const message =
      json && !json.success && json.error?.message
        ? json.error.message
        : `Request failed (${response.status}).`;
    throw new ApiError(message, response.status, json && !json.success ? json.error?.code : undefined);
  }

  return json.data;
}

/**
 * Frontend Client API Interface
 */
export const api = {
  // 1. Authentication
  auth: {
    async sendOtp(email: string): Promise<{ message: string; debugCode?: string }> {
      return apiRequest<{ message: string; debugCode?: string }>("/api/auth/otp/send", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
    },

    async verifyOtp(email: string, code: string): Promise<{ user: UserSession; token: string }> {
      const data = await apiRequest<{ user: UserSession; token: string }>("/api/auth/otp/verify", {
        method: "POST",
        body: JSON.stringify({ email, code }),
      });
      authStorage.setToken(data.token);
      authStorage.setUser(data.user);
      return data;
    },

    logout() {
      authStorage.clear();
      window.location.assign("/login");
    },

    getUser(): UserSession | null {
      return authStorage.getUser();
    },

    isAuthenticated(): boolean {
      return Boolean(authStorage.getToken());
    },
  },

  // 2. Connected Accounts
  accounts: {
    async list(): Promise<ConnectedAccount[]> {
      const data = await apiRequest<{ accounts: ConnectedAccount[] }>("/api/accounts");
      return data.accounts;
    },

    async disconnect(accountId: string): Promise<boolean> {
      const data = await apiRequest<{ deleted: boolean }>(`/api/accounts/${accountId}`, {
        method: "DELETE",
      });
      return data.deleted;
    },

    async connectMeta(accessToken: string): Promise<{ connectedAccounts: unknown[] }> {
      return apiRequest("/api/auth/meta/callback", {
        method: "POST",
        body: JSON.stringify({ accessToken }),
      });
    },
  },

  // 3. Reels Studio
  reels: {
    async list(accountId: string): Promise<InstagramReelMedia[]> {
      const data = await apiRequest<{ reels: InstagramReelMedia[] }>(
        `/api/reels?accountId=${encodeURIComponent(accountId)}`
      );
      return data.reels;
    },
  },

  // 4. Automations Studio
  automations: {
    async list(accountId: string): Promise<ReelAutomation[]> {
      const data = await apiRequest<{ automations: ReelAutomation[] }>(
        `/api/automations?accountId=${encodeURIComponent(accountId)}`
      );
      return data.automations;
    },

    async save(automation: {
      id?: string;
      accountId: string;
      instagramMediaId: string;
      reelPermalink: string;
      reelThumbnailUrl?: string;
      triggerKeywords: string[];
      commentReplies: string[];
      followGateEnabled: boolean;
      templateCard: TemplateCardConfig;
      isActive?: boolean;
      followUpEnabled?: boolean;
      followUpDelayMinutes?: number;
    }): Promise<ReelAutomation> {
      const data = await apiRequest<{ automation: ReelAutomation }>("/api/automations", {
        method: "POST",
        body: JSON.stringify(automation),
      });
      return data.automation;
    },

    async delete(automationId: string, accountId: string): Promise<boolean> {
      const data = await apiRequest<{ deleted: boolean }>(
        `/api/automations/${encodeURIComponent(automationId)}?accountId=${encodeURIComponent(accountId)}`,
        { method: "DELETE" }
      );
      return data.deleted;
    },
  },

  // 5. Leads Management & CSV Export
  leads: {
    async list(
      accountId: string,
      options: { search?: string; limit?: number; offset?: number; signal?: AbortSignal } = {}
    ): Promise<{ leads: CapturedLead[]; total: number }> {
      const { signal, ...rest } = options;
      const params = new URLSearchParams({
        accountId,
        ...(rest.search ? { search: rest.search } : {}),
        ...(rest.limit ? { limit: String(rest.limit) } : {}),
        ...(rest.offset ? { offset: String(rest.offset) } : {}),
      });

      return apiRequest<{ leads: CapturedLead[]; total: number }>(`/api/leads?${params.toString()}`, {
        signal,
      });
    },

    async downloadCsv(accountId: string, accountUsername = "instagram"): Promise<void> {
      const token = authStorage.getToken();
      const response = await fetch(
        `${API_BASE_URL}/api/leads/export?accountId=${encodeURIComponent(accountId)}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          signal: AbortSignal.timeout(60_000),
        }
      );

      if (response.status === 401) {
        handleAuthFailure();
        throw new ApiError("Your session expired. Please sign in again.", 401);
      }
      if (!response.ok) {
        throw new ApiError(`Failed to download CSV export (${response.status}).`, response.status);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `relo-leads-${accountUsername}-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
  },

  // 5b. Products library (plan.md §4.4) — Pro/Studio only
  products: {
    async list(accountId: string): Promise<{ products: Product[] }> {
      return apiRequest(`/api/products?accountId=${encodeURIComponent(accountId)}`);
    },

    async save(
      accountId: string,
      input: {
        id?: string;
        name: string;
        priceText?: string;
        description?: string;
        link?: string;
        imageUrl?: string;
        isActive?: boolean;
      }
    ): Promise<{ product: Product }> {
      return apiRequest("/api/products", {
        method: "POST",
        body: JSON.stringify({ accountId, ...input }),
      });
    },

    async remove(accountId: string, productId: string): Promise<{ deleted: boolean }> {
      return apiRequest(
        `/api/products/${encodeURIComponent(productId)}?accountId=${encodeURIComponent(accountId)}`,
        { method: "DELETE" }
      );
    },
  },

  // 6. Campaigns (plan.md §4.3 / Phase 3) — Pro/Studio only
  campaigns: {
    async list(accountId: string): Promise<{ campaigns: Campaign[] }> {
      return apiRequest(`/api/campaigns?accountId=${encodeURIComponent(accountId)}`);
    },

    async detail(
      accountId: string,
      campaignId: string
    ): Promise<{ campaign: Campaign; targets: CampaignTarget[]; reachability: Reachability }> {
      return apiRequest(
        `/api/campaigns/${encodeURIComponent(campaignId)}?accountId=${encodeURIComponent(accountId)}`
      );
    },

    async save(
      accountId: string,
      input: {
        id?: string;
        mediaId: string;
        kind?: "text" | "card";
        text?: string;
        card?: CampaignPayload extends { card?: infer C } ? C : never;
        status?: "draft" | "scheduled";
        scheduledAt?: number;
        usesHumanAgentTag?: boolean;
      }
    ): Promise<{ campaign: Campaign; reachability: Reachability }> {
      return apiRequest("/api/campaigns", {
        method: "POST",
        body: JSON.stringify({ accountId, ...input }),
      });
    },

    async remove(accountId: string, campaignId: string): Promise<{ deleted: boolean }> {
      return apiRequest(
        `/api/campaigns/${encodeURIComponent(campaignId)}?accountId=${encodeURIComponent(accountId)}`,
        { method: "DELETE" }
      );
    },
  },

  // 7. Canvas flows (plan.md §7 Phase 3) — Studio only
  flows: {
    async list(accountId: string): Promise<{ flows: Flow[] }> {
      return apiRequest(`/api/flows?accountId=${encodeURIComponent(accountId)}`);
    },

    async save(
      accountId: string,
      input: {
        id?: string;
        name?: string;
        graph?: FlowGraph;
        isActive?: boolean;
        isPublished?: boolean;
      }
    ): Promise<{ flow: Flow }> {
      return apiRequest("/api/flows", {
        method: "POST",
        body: JSON.stringify({ accountId, ...input }),
      });
    },

    async remove(accountId: string, flowId: string): Promise<{ deleted: boolean }> {
      return apiRequest(
        `/api/flows/${encodeURIComponent(flowId)}?accountId=${encodeURIComponent(accountId)}`,
        { method: "DELETE" }
      );
    },
  },

  // 8. Referrals (plan.md §7 Phase 3)
  referrals: {
    async get(): Promise<{ referral: ReferralSummary }> {
      return apiRequest("/api/referrals");
    },

    async claim(code: string): Promise<{ recorded: boolean }> {
      return apiRequest("/api/referrals", {
        method: "POST",
        body: JSON.stringify({ code }),
      });
    },
  },

  // 9. Agency intake (plan.md §3) — bigger than 3 accounts is a conversation
  agency: {
    async contact(input: {
      email?: string;
      accountCount?: number;
      notes?: string;
      plan?: "studio" | "custom";
    }): Promise<{ message: string }> {
      return apiRequest("/api/agency/contact", {
        method: "POST",
        body: JSON.stringify(input),
      });
    },
  },

  // 10. Link in bio (plan.md §4.5 / Phase 2) — Pro/Studio only
  linkPage: {
    async get(accountId: string): Promise<{
      page: LinkPage | null;
      blocks: LinkBlock[];
      products: LinkPageProduct[];
      publicUrl: string | null;
    }> {
      return apiRequest("/api/link-page?accountId=" + encodeURIComponent(accountId));
    },

    async save(
      accountId: string,
      input: {
        headline?: string;
        bio?: string;
        slug?: string;
        theme?: "volt" | "plain" | "dark";
        isPublished?: boolean;
        blocks: Array<{ id?: string; label: string; targetUrl?: string; productId?: string }>;
      }
    ): Promise<{ page: LinkPage; blocks: LinkBlock[]; publicUrl: string }> {
      return apiRequest("/api/link-page?accountId=" + encodeURIComponent(accountId), {
        method: "POST",
        body: JSON.stringify(input),
      });
    },
  },

  // 11. Content planning (plan.md §7 Phase 2) — Pro/Studio only
  contentPlans: {
    async list(accountId: string): Promise<{ plans: ContentPlan[]; stats: ContentStats }> {
      return apiRequest("/api/content-plans?accountId=" + encodeURIComponent(accountId));
    },

    async save(
      accountId: string,
      input: {
        id?: string;
        title: string;
        hook?: string;
        caption?: string;
        status?: ContentStatus;
        plannedFor?: number;
        automationId?: string;
      }
    ): Promise<{ plan: ContentPlan }> {
      return apiRequest("/api/content-plans?accountId=" + encodeURIComponent(accountId), {
        method: "POST",
        body: JSON.stringify(input),
      });
    },

    async publish(accountId: string, id: string, mediaId: string): Promise<{ plan: ContentPlan }> {
      return apiRequest("/api/content-plans/publish?accountId=" + encodeURIComponent(accountId), {
        method: "POST",
        body: JSON.stringify({ id, mediaId }),
      });
    },

    async remove(accountId: string, planId: string): Promise<{ deleted: boolean }> {
      return apiRequest(
        "/api/content-plans/" + encodeURIComponent(planId) + "?accountId=" + encodeURIComponent(accountId),
        { method: "DELETE" }
      );
    },
  },

  // 12. Billing (plan.md §3)
  billing: {
    async get(): Promise<{
      plan: "free" | "pro" | "studio";
      aiCreditsRemaining: number;
      payments: Array<{
        id: string;
        provider: string;
        plan: string;
        amount_inr: number | null;
        status: string;
        utr: string | null;
        created_at: number;
        verified_at: number | null;
      }>;
      checkout: { lemonSqueezyUrl: string | null; upiId: string | null };
    }> {
      return apiRequest("/api/billing");
    },

    async submitManualUpi(plan: "pro" | "studio", utr: string): Promise<{ message: string }> {
      return apiRequest("/api/billing/manual-upi", {
        method: "POST",
        body: JSON.stringify({ plan, utr }),
      });
    },
  },

  // 7. Analytics Telemetry
  analytics: {
    async get(
      accountId: string
    ): Promise<
      SystemTelemetry & {
        totalLeads: number;
        totalComments: number;
        totalDmsSent: number;
        followerConversionRate: number;
      }
    > {
      const data = await apiRequest<{
        telemetry: SystemTelemetry & {
          totalLeads: number;
          totalComments: number;
          totalDmsSent: number;
          followerConversionRate: number;
        };
      }>(`/api/analytics?accountId=${encodeURIComponent(accountId)}`);
      return data.telemetry;
    },
  },
};
