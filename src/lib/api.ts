import type {
  ApiResponse,
  ConnectedAccount,
  InstagramReelMedia,
  ReelAutomation,
  CapturedLead,
  SystemTelemetry,
  TemplateCardConfig,
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

/**
 * Internal typed fetch wrapper
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = authStorage.getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const url = `${API_BASE_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers,
  });

  const json: ApiResponse<T> = await response.json();

  if (!json.success) {
    throw new Error(json.error?.message || "API request failed");
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
      window.location.href = "/login";
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
      options: { search?: string; limit?: number; offset?: number } = {}
    ): Promise<{ leads: CapturedLead[]; total: number }> {
      const params = new URLSearchParams({
        accountId,
        ...(options.search ? { search: options.search } : {}),
        ...(options.limit ? { limit: String(options.limit) } : {}),
        ...(options.offset ? { offset: String(options.offset) } : {}),
      });

      return apiRequest<{ leads: CapturedLead[]; total: number }>(`/api/leads?${params.toString()}`);
    },

    getExportUrl(accountId: string): string {
      const token = authStorage.getToken();
      return `${API_BASE_URL}/api/leads/export?accountId=${encodeURIComponent(accountId)}&token=${encodeURIComponent(token || "")}`;
    },

    async downloadCsv(accountId: string, accountUsername = "instagram"): Promise<void> {
      const token = authStorage.getToken();
      const response = await fetch(
        `${API_BASE_URL}/api/leads/export?accountId=${encodeURIComponent(accountId)}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      if (!response.ok) {
        throw new Error("Failed to download CSV export.");
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

  // 6. Analytics Telemetry
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
