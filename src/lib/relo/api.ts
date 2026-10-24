/**
 * The only place the frontend talks to the Worker.
 *
 * Every call goes through `request`, which:
 *   - attaches the JWT,
 *   - unwraps the `{ success, data }` envelope,
 *   - turns `{ success: false, error }` into a typed `ApiError`, and
 *   - clears the session on a 401 so the UI cannot sit on a dead token.
 *
 * Nothing here fabricates a response. If the Worker is unreachable the caller
 * gets `NETWORK_ERROR` and decides what to show.
 */

import { API_URL, metaOAuthUrl } from "./config";
import { DEMO_TOKEN, demoResponse } from "./demo";
import type {
  Account,
  Automation,
  AutomationInput,
  Billing,
  Campaign,
  ContentPlan,
  ContentPlanInput,
  ContentStats,
  Flow,
  LeadsPage,
  LinkPageInput,
  LinkPageSnapshot,
  Product,
  Reachability,
  Reel,
  SessionUser,
  Telemetry,
} from "./data";

/* ── errors ───────────────────────────────────────────────────────────── */

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details: Record<string, unknown>;

  constructor(
    code: string,
    message: string,
    status = 0,
    details: Record<string, unknown> = {}
  ) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.details = details;
  }

  /** The plan does not include this feature; show an upgrade path. */
  get isLocked(): boolean {
    return this.status === 403 && this.code.endsWith("_LOCKED");
  }

  /** A Meta-side failure the user can usually fix by reconnecting. */
  get isGraphError(): boolean {
    return this.code === "GRAPH_API_ERROR";
  }

  get retryAfterSeconds(): number | undefined {
    const value = this.details.retryAfterSeconds;
    return typeof value === "number" ? value : undefined;
  }
}

export const errorMessage = (error: unknown): string => {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Something went wrong.";
};

/* ── session storage ──────────────────────────────────────────────────── */

const TOKEN_KEY = "relo.token.v1";
const USER_KEY = "relo.user.v1";

const store = {
  get(key: string): string | null {
    if (typeof window === "undefined") return null;
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key: string, value: string) {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(key, value);
    } catch {
      /* private mode / quota: the session simply does not persist */
    }
  },
  remove(key: string) {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  },
};

export const getToken = (): string | null => store.get(TOKEN_KEY);

export const getStoredUser = (): SessionUser | null => {
  const raw = store.get(USER_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as SessionUser;
    return parsed?.id && parsed?.email ? parsed : null;
  } catch {
    return null;
  }
};

export const saveSession = (token: string, user: SessionUser) => {
  store.set(TOKEN_KEY, token);
  store.set(USER_KEY, JSON.stringify(user));
};

export const clearSession = () => {
  store.remove(TOKEN_KEY);
  store.remove(USER_KEY);
};

/** Fired whenever the Worker rejects our token, so the shell can log out. */
const unauthorizedListeners = new Set<() => void>();

export const onUnauthorized = (listener: () => void): (() => void) => {
  unauthorizedListeners.add(listener);
  return () => unauthorizedListeners.delete(listener);
};

/* ── request plumbing ─────────────────────────────────────────────────── */

type Query = Record<string, string | number | boolean | undefined | null>;

const withQuery = (path: string, query?: Query): string => {
  if (!query) return path;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
};

interface RequestOptions {
  method?: "GET" | "POST" | "DELETE";
  body?: unknown;
  query?: Query;
  signal?: AbortSignal;
  /** Login/signup calls are public and must not trigger a global sign-out. */
  publicCall?: boolean;
}

interface Envelope<T> {
  success?: boolean;
  data?: T;
  error?: { code?: string; message?: string; details?: Record<string, unknown> };
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, query, signal, publicCall } = options;
  const token = getToken();

  /* Demo mode: serve canned reads locally, refuse writes with a friendly
     error. No request ever leaves the browser. */
  if (token === DEMO_TOKEN) {
    const canned = demoResponse(path, method);
    if (canned === null) {
      throw new ApiError(
        "DEMO_MODE",
        "Demo mode is read-only. Sign in with a real account to save changes.",
        403
      );
    }
    return canned as T;
  }

  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(`${API_URL}${withQuery(path, query)}`, {
      method,
      headers,
      credentials: "omit",
      cache: "no-store",
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ApiError(
      "NETWORK_ERROR",
      API_URL
        ? `Could not reach the RELO API at ${API_URL}. Check your connection and try again.`
        : "Could not reach the RELO API. NEXT_PUBLIC_API_URL is not set for this build.",
      0
    );
  }

  const text = await response.text();
  let parsed: Envelope<T> | null = null;
  if (text) {
    try {
      parsed = JSON.parse(text) as Envelope<T>;
    } catch {
      parsed = null;
    }
  }

  if (response.status === 401 && token && !publicCall) {
    clearSession();
    unauthorizedListeners.forEach((listener) => {
      try {
        listener();
      } catch {
        /* a broken listener must not mask the API error */
      }
    });
  }

  if (!response.ok || parsed?.success === false) {
    const code = parsed?.error?.code || `HTTP_${response.status}`;
    const message =
      parsed?.error?.message ||
      (response.status === 0
        ? "The API could not be reached."
        : `Request failed (${response.status}).`);
    throw new ApiError(code, message, response.status, parsed?.error?.details ?? {});
  }

  if (parsed === null) {
    throw new ApiError(
      "INVALID_RESPONSE",
      "The API returned a response RELO could not read.",
      response.status
    );
  }

  return (parsed.data ?? ({} as T)) as T;
}

/* ── auth ─────────────────────────────────────────────────────────────── */

export interface OtpSent {
  message: string;
  /** Present only on a dev Worker with DEBUG_OTPS=1 and no mail provider. */
  debugCode?: string;
}

export interface AuthResult {
  user: SessionUser;
  token: string;
}

export const sendOtp = (email: string, captchaToken?: string): Promise<OtpSent> =>
  request<OtpSent>("/api/auth/otp/send", {
    method: "POST",
    publicCall: true,
    body: { email, captchaToken },
  });

export const verifyOtp = async (
  email: string,
  code: string,
  captchaToken?: string
): Promise<AuthResult> => {
  const result = await request<AuthResult>("/api/auth/otp/verify", {
    method: "POST",
    publicCall: true,
    body: { email, code, captchaToken },
  });
  saveSession(result.token, result.user);
  return result;
};

/* ── Meta OAuth ───────────────────────────────────────────────────────── */

const OAUTH_STATE_KEY = "relo.oauth.state.v1";

/** True when sessionStorage can actually be read and written. */
const stateStorageUsable = (): boolean => {
  try {
    const probe = `${OAUTH_STATE_KEY}.probe`;
    window.sessionStorage.setItem(probe, "1");
    window.sessionStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
};

const randomState = (): string => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
};

/**
 * Starts the Facebook Login dialog. The state value is kept in sessionStorage so
 * the callback page can prove the response belongs to this tab.
 */
export const beginMetaOAuth = (): string => {
  const state = randomState();
  try {
    window.sessionStorage.setItem(OAUTH_STATE_KEY, state);
  } catch {
    /* if storage is blocked, the callback still works — it just cannot verify */
  }
  const url = metaOAuthUrl(state);
  window.location.assign(url);
  return url;
};

export const consumeOAuthState = (state: string | null): boolean => {
  let expected: string | null = null;
  try {
    expected = window.sessionStorage.getItem(OAUTH_STATE_KEY);
    window.sessionStorage.removeItem(OAUTH_STATE_KEY);
  } catch {
    // Storage is blocked in this browser: we cannot verify, so we do not strand
    // the user. The Worker still refuses to attach an account to a session
    // without a valid code, and Meta validates the redirect URI.
    return true;
  }
  if (!expected) {
    // Storage works but nothing was ever written for this tab. That is either a
    // replay or a callback the user did not start here, so reject it.
    return !stateStorageUsable();
  }
  return Boolean(state) && state === expected;
};

export interface ConnectedAccountSummary {
  id: string;
  instagramUserId: string;
  username: string;
  profilePictureUrl?: string;
}

export const completeMetaOAuth = (
  code: string,
  redirectUri: string
): Promise<{ connectedAccounts: ConnectedAccountSummary[] }> =>
  request("/api/auth/meta/callback", {
    method: "POST",
    body: { code, redirectUri },
  });

/* ── accounts ─────────────────────────────────────────────────────────── */

export const getAccounts = (): Promise<{ accounts: Account[] }> =>
  request("/api/accounts");

export const disconnectAccount = (accountId: string): Promise<{ deleted: boolean }> =>
  request(`/api/accounts/${encodeURIComponent(accountId)}`, { method: "DELETE" });

/* ── reels ────────────────────────────────────────────────────────────── */

export const getReels = (accountId: string): Promise<{ reels: Reel[] }> =>
  request("/api/reels", { query: { accountId } });

/* ── automations ──────────────────────────────────────────────────────── */

export const getAutomations = (accountId: string): Promise<{ automations: Automation[] }> =>
  request("/api/automations", { query: { accountId } });

export const saveAutomation = (
  input: AutomationInput
): Promise<{ automation: Partial<Automation> }> =>
  request("/api/automations", { method: "POST", body: input });

export const deleteAutomation = (
  accountId: string,
  automationId: string
): Promise<{ deleted: boolean }> =>
  request(`/api/automations/${encodeURIComponent(automationId)}`, {
    method: "DELETE",
    query: { accountId },
  });

/* ── leads ────────────────────────────────────────────────────────────── */

export const getLeads = (
  accountId: string,
  params: { search?: string; limit?: number; offset?: number } = {}
): Promise<LeadsPage> =>
  request("/api/leads", {
    query: {
      accountId,
      search: params.search,
      limit: params.limit,
      offset: params.offset,
    },
  });

/** CSV export is a raw stream, not an envelope, so it bypasses `request`. */
export const downloadLeadsCsv = async (accountId: string): Promise<Blob> => {
  const token = getToken();
  if (token === DEMO_TOKEN) {
    throw new ApiError(
      "DEMO_MODE",
      "Exports are disabled in demo mode. Sign in with a real account to download your leads.",
      403
    );
  }
  const response = await fetch(
    `${API_URL}${withQuery("/api/leads/export", { accountId })}`,
    {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      credentials: "omit",
      cache: "no-store",
    }
  );
  if (!response.ok) {
    throw new ApiError(
      "EXPORT_FAILED",
      "The export could not be generated. Try again in a moment.",
      response.status
    );
  }
  return response.blob();
};

/* ── analytics ────────────────────────────────────────────────────────── */

export const getAnalytics = (accountId: string): Promise<{ telemetry: Telemetry }> =>
  request("/api/analytics", { query: { accountId } });

/* ── billing ──────────────────────────────────────────────────────────── */

export const getBilling = (): Promise<Billing> => request("/api/billing");

export const submitUpiPayment = (
  plan: "pro" | "studio",
  utr: string
): Promise<{ message: string }> =>
  request("/api/billing/manual-upi", { method: "POST", body: { plan, utr } });

/* ── products ─────────────────────────────────────────────────────────── */

export interface ProductInput {
  id?: string;
  accountId: string;
  name: string;
  priceText?: string;
  description?: string;
  link?: string;
  imageUrl?: string;
  isActive?: boolean;
}

export const getProducts = (accountId: string): Promise<{ products: Product[] }> =>
  request("/api/products", { query: { accountId } });

export const saveProduct = (input: ProductInput): Promise<{ product: Product }> =>
  request("/api/products", { method: "POST", body: input });

export const deleteProduct = (
  accountId: string,
  productId: string
): Promise<{ deleted: boolean }> =>
  request(`/api/products/${encodeURIComponent(productId)}`, {
    method: "DELETE",
    query: { accountId },
  });

/* ── campaigns ────────────────────────────────────────────────────────── */

export interface CampaignInput {
  id?: string;
  accountId: string;
  mediaId: string;
  kind: "text" | "card";
  text?: string;
  card?: unknown;
  status: "draft" | "scheduled";
  scheduledAt: number;
  usesHumanAgentTag?: boolean;
}

export const getCampaigns = (accountId: string): Promise<{ campaigns: Campaign[] }> =>
  request("/api/campaigns", { query: { accountId } });

export const getCampaign = (
  accountId: string,
  campaignId: string
): Promise<{ campaign: Campaign; targets: unknown[]; reachability: Reachability }> =>
  request(`/api/campaigns/${encodeURIComponent(campaignId)}`, { query: { accountId } });

export const saveCampaign = (
  input: CampaignInput
): Promise<{ campaign: Campaign; reachability: Reachability }> =>
  request("/api/campaigns", { method: "POST", body: input });

export const deleteCampaign = (
  accountId: string,
  campaignId: string
): Promise<{ deleted: boolean }> =>
  request(`/api/campaigns/${encodeURIComponent(campaignId)}`, {
    method: "DELETE",
    query: { accountId },
  });

/* ── canvas flows ─────────────────────────────────────────────────────── */

export interface FlowInput {
  id?: string;
  accountId: string;
  name?: string;
  graph?: Flow["graph"];
  isActive?: boolean;
  isPublished?: boolean;
}

export const getFlows = (accountId: string): Promise<{ flows: Flow[] }> =>
  request("/api/flows", { query: { accountId } });

export const saveFlow = (input: FlowInput): Promise<{ flow: Flow }> =>
  request("/api/flows", { method: "POST", body: input });

export const deleteFlow = (
  accountId: string,
  flowId: string
): Promise<{ deleted: boolean }> =>
  request(`/api/flows/${encodeURIComponent(flowId)}`, {
    method: "DELETE",
    query: { accountId },
  });

/* ── link in bio ──────────────────────────────────────────────────────── */

export const getLinkPage = (accountId: string): Promise<LinkPageSnapshot> =>
  request("/api/link-page", { query: { accountId } });

export const saveLinkPage = (
  accountId: string,
  input: LinkPageInput
): Promise<{
  page: NonNullable<LinkPageSnapshot["page"]>;
  blocks: LinkPageSnapshot["blocks"];
  publicUrl: string;
}> => request("/api/link-page", { method: "POST", query: { accountId }, body: input });

/* ── content planner ──────────────────────────────────────────────────── */

export const getContentPlans = (
  accountId: string
): Promise<{ plans: ContentPlan[]; stats: ContentStats }> =>
  request("/api/content-plans", { query: { accountId } });

export const saveContentPlan = (
  accountId: string,
  input: ContentPlanInput
): Promise<{ plan: ContentPlan }> =>
  request("/api/content-plans", { method: "POST", query: { accountId }, body: input });

export const publishContentPlan = (
  accountId: string,
  id: string,
  mediaId: string
): Promise<{ plan: ContentPlan }> =>
  request("/api/content-plans/publish", {
    method: "POST",
    query: { accountId },
    body: { id, mediaId },
  });

export const deleteContentPlan = (
  accountId: string,
  planId: string
): Promise<{ deleted: boolean }> =>
  request(`/api/content-plans/${encodeURIComponent(planId)}`, {
    method: "DELETE",
    query: { accountId },
  });

/* ── misc ─────────────────────────────────────────────────────────────── */

export const sendAgencyEnquiry = (input: {
  email?: string;
  accountCount?: number;
  plan?: "studio" | "custom";
  notes?: string;
  captchaToken?: string;
}): Promise<{ message: string }> =>
  request("/api/agency/contact", { method: "POST", publicCall: true, body: input });
