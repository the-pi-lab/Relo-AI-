"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import * as api from "./api";
import { ApiError, errorMessage } from "./api";
import {
  type Account,
  type Automation,
  type AutomationInput,
  type Billing,
  type Campaign,
  type ContentPlan,
  type ContentPlanInput,
  type ContentStats,
  type Flow,
  type LeadsPage,
  type LinkPageInput,
  type LinkPageSnapshot,
  type Product,
  type Reel,
  type SessionUser,
  type Telemetry,
  type Tier,
  TIER_LIMITS,
} from "./data";

/* ── hash router ─────────────────────────────────────────────────────── */

export type Route =
  | { name: "landing" }
  | { name: "login" }
  | { name: "studio"; view: string }
  | { name: "privacy" }
  | { name: "terms" }
  | { name: "cookies" }
  | { name: "notfound" };

const LANDING_SECTIONS = [
  "how-it-works",
  "features",
  "pricing",
  "faq",
  "security",
];

/** Old or hand-typed view names that should resolve to a real studio view. */
const VIEW_ALIASES: Record<string, string> = {
  analytics: "insights",
  reels: "automations",
  flows: "canvas",
  flow: "canvas",
  plan: "settings",
  billing: "settings",
};

export function parseHash(hash: string): Route {
  const h = hash.replace(/^#\/?/, "").split("?")[0];
  if (h === "" || LANDING_SECTIONS.includes(h)) return { name: "landing" };
  if (h === "login") return { name: "login" };
  if (h === "privacy") return { name: "privacy" };
  if (h === "terms") return { name: "terms" };
  if (h === "cookies") return { name: "cookies" };
  if (h === "studio" || h.startsWith("studio/")) {
    const raw = h === "studio" ? "home" : h.slice("studio/".length) || "home";
    return { name: "studio", view: VIEW_ALIASES[raw] ?? raw };
  }
  return { name: "notfound" };
}

const subscribeToHash = (onChange: () => void) => {
  window.addEventListener("hashchange", onChange);
  window.addEventListener("popstate", onChange);
  return () => {
    window.removeEventListener("hashchange", onChange);
    window.removeEventListener("popstate", onChange);
  };
};

export function useHashRoute(): [Route, (to: string) => void] {
  const hash = useSyncExternalStore(
    subscribeToHash,
    () => window.location.hash,
    () => ""
  );
  const route = useMemo(() => parseHash(hash), [hash]);

  const navigate = useCallback((to: string) => {
    const target = `#${to.startsWith("/") ? to : `/${to}`}`;
    if (window.location.hash === target) {
      window.dispatchEvent(new HashChangeEvent("hashchange"));
      return;
    }
    window.location.hash = target;
  }, []);

  return [route, navigate];
}

/* ── helpers ─────────────────────────────────────────────────────────── */

export type AuthStatus = "loading" | "signed-out" | "signed-in";

const toApiError = (error: unknown): ApiError =>
  error instanceof ApiError
    ? error
    : new ApiError("UNEXPECTED", errorMessage(error), 0);

const EMPTY_LEADS: LeadsPage = { leads: [], total: 0 };

interface Resource<T> {
  data: T;
  loading: boolean;
  error: ApiError | null;
  refresh: () => Promise<void>;
}

/**
 * Loads a resource for the active account and reloads it whenever the account
 * changes. A monotonically increasing epoch means a slow response for the
 * previous account can never overwrite the current one.
 */
function useAccountResource<T>(
  accountId: string | null,
  initial: T,
  fetcher: (accountId: string) => Promise<T>,
  enabled = true
): Resource<T> {
  const initialRef = useRef(initial);
  const [data, setData] = useState<T>(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const epoch = useRef(0);

  const refresh = useCallback(async () => {
    if (!accountId || !enabled) {
      epoch.current += 1;
      setData(initialRef.current);
      setLoading(false);
      setError(null);
      return;
    }
    const mine = ++epoch.current;
    setLoading(true);
    setError(null);
    try {
      const next = await fetcher(accountId);
      if (epoch.current !== mine) return;
      setData(next);
      setLoading(false);
    } catch (caught) {
      if (epoch.current !== mine) return;
      setData(initialRef.current);
      setError(toApiError(caught));
      setLoading(false);
    }
  }, [accountId, enabled, fetcher]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return useMemo(
    () => ({ data, loading, error, refresh }),
    [data, loading, error, refresh]
  );
}

/* Module-level fetchers keep the identity stable across renders, so the
   effect above only re-runs when the account or plan actually changes. */
const fetchReels = (id: string) => api.getReels(id).then((r) => r.reels);
const fetchAutomations = (id: string) => api.getAutomations(id).then((r) => r.automations);
const fetchTelemetry = (id: string) => api.getAnalytics(id).then((r) => r.telemetry);
const fetchCampaigns = (id: string) => api.getCampaigns(id).then((r) => r.campaigns);
const fetchProducts = (id: string) => api.getProducts(id).then((r) => r.products);
const fetchFlows = (id: string) => api.getFlows(id).then((r) => r.flows);
const fetchLinkPage = (id: string) => api.getLinkPage(id);
const fetchContent = (id: string) => api.getContentPlans(id);

const NO_REELS: Reel[] = [];
const NO_AUTOMATIONS: Automation[] = [];
const NO_CAMPAIGNS: Campaign[] = [];
const NO_PRODUCTS: Product[] = [];
const NO_FLOWS: Flow[] = [];
const NO_PLANS: ContentPlan[] = [];
const NO_STATS: ContentStats = {
  idea: 0,
  drafting: 0,
  scheduled: 0,
  published: 0,
  converting: 0,
};

/* ── store contract ──────────────────────────────────────────────────── */

export interface ReloStore {
  /* session */
  status: AuthStatus;
  user: SessionUser | null;
  completeSignIn: (user: SessionUser) => void;
  signOut: () => void;

  /* accounts */
  accounts: Account[];
  account: Account | null;
  plan: Tier;
  limits: (typeof TIER_LIMITS)[Tier];
  credits: number;
  accountsLoading: boolean;
  accountsError: ApiError | null;
  selectAccount: (id: string) => void;
  refreshAccounts: () => Promise<void>;
  disconnectAccount: (id: string) => Promise<void>;

  /* resources */
  reels: Resource<Reel[]>;
  automations: Resource<Automation[]>;
  telemetry: Resource<Telemetry | null>;
  campaigns: Resource<Campaign[]>;
  products: Resource<Product[]>;
  flows: Resource<Flow[]>;
  linkPage: Resource<LinkPageSnapshot | null>;
  content: Resource<{ plans: ContentPlan[]; stats: ContentStats }>;

  /* leads (server-paged) */
  leads: LeadsPage;
  leadsLoading: boolean;
  leadsError: ApiError | null;
  loadLeads: (params?: { search?: string; limit?: number; offset?: number }) => Promise<void>;

  /* billing */
  billing: Billing | null;
  billingLoading: boolean;
  billingError: ApiError | null;
  refreshBilling: () => Promise<void>;
  submitUpi: (plan: "pro" | "studio", utr: string) => Promise<string>;

  /* mutations */
  saveAutomation: (input: AutomationInput) => Promise<void>;
  deleteAutomation: (id: string) => Promise<void>;
  saveProduct: (input: api.ProductInput) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  saveCampaign: (input: api.CampaignInput) => Promise<{ reachability: import("./data").Reachability }>;
  deleteCampaign: (id: string) => Promise<void>;
  saveFlow: (input: api.FlowInput) => Promise<Flow>;
  deleteFlow: (id: string) => Promise<void>;
  saveLinkPage: (input: LinkPageInput) => Promise<string>;
  saveContentPlan: (input: ContentPlanInput) => Promise<void>;
  publishPlan: (id: string, mediaId: string) => Promise<void>;
  deleteContentPlan: (id: string) => Promise<void>;

  /* misc */
  refreshAll: () => Promise<void>;
}

const StoreCtx = createContext<ReloStore | null>(null);

/* ── provider ────────────────────────────────────────────────────────── */

export function ReloProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<SessionUser | null>(null);

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [accountsError, setAccountsError] = useState<ApiError | null>(null);

  const [billing, setBilling] = useState<Billing | null>(null);
  const [billingLoading, setBillingLoading] = useState(false);
  const [billingError, setBillingError] = useState<ApiError | null>(null);

  const [leads, setLeads] = useState<LeadsPage>(EMPTY_LEADS);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [leadsError, setLeadsError] = useState<ApiError | null>(null);
  const leadsEpoch = useRef(0);

  const account = useMemo(
    () => accounts.find((item) => item.id === accountId) ?? accounts[0] ?? null,
    [accounts, accountId]
  );
  const plan: Tier = account?.plan ?? "free";
  const limits = TIER_LIMITS[plan];
  const credits = account?.aiCreditsRemaining ?? 0;

  /* ── session bootstrap ─────────────────────────────────────────────── */

  const refreshAccounts = useCallback(async () => {
    if (!api.getToken()) return;
    setAccountsLoading(true);
    setAccountsError(null);
    try {
      const { accounts: next } = await api.getAccounts();
      setAccounts(next);
      setAccountId((current) =>
        current && next.some((item) => item.id === current)
          ? current
          : next[0]?.id ?? null
      );
    } catch (caught) {
      const error = toApiError(caught);
      if (error.status !== 401) {
        setAccountsError(error);
      }
      setAccounts([]);
    } finally {
      setAccountsLoading(false);
    }
  }, []);

  const signOut = useCallback(() => {
    api.clearSession();
    setStatus("signed-out");
    setUser(null);
    setAccounts([]);
    setAccountId(null);
    setBilling(null);
    setLeads(EMPTY_LEADS);
  }, []);

  const completeSignIn = useCallback(
    (next: SessionUser) => {
      setUser(next);
      setStatus("signed-in");
      void refreshAccounts();
    },
    [refreshAccounts]
  );

  useEffect(() => {
    let cancelled = false;
    const stored = api.getStoredUser();
    if (!api.getToken() || !stored) {
      setStatus("signed-out");
      return;
    }
    setUser(stored);
    setStatus("signed-in");
    void (async () => {
      try {
        const { accounts: next } = await api.getAccounts();
        if (cancelled) return;
        setAccounts(next);
        setAccountId(next[0]?.id ?? null);
      } catch (caught) {
        if (cancelled) return;
        const error = toApiError(caught);
        if (error.status === 401) {
          signOut();
        } else {
          setAccountsError(error);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [signOut]);

  /* A 401 on any call clears the session inside the API layer; mirror that
     into React state so the UI leaves the studio immediately. */
  useEffect(() => api.onUnauthorized(() => signOut()), [signOut]);

  /* ── account-scoped resources ──────────────────────────────────────── */

  const activeId = account?.id ?? null;

  const reels = useAccountResource(activeId, NO_REELS, fetchReels);
  const automations = useAccountResource(activeId, NO_AUTOMATIONS, fetchAutomations);
  const telemetry = useAccountResource<Telemetry | null>(activeId, null, fetchTelemetry);
  const campaigns = useAccountResource(
    activeId,
    NO_CAMPAIGNS,
    fetchCampaigns,
    limits.campaigns
  );
  const products = useAccountResource(
    activeId,
    NO_PRODUCTS,
    fetchProducts,
    limits.products
  );
  const flows = useAccountResource(activeId, NO_FLOWS, fetchFlows, limits.canvas);
  const linkPage = useAccountResource<LinkPageSnapshot | null>(
    activeId,
    null,
    fetchLinkPage,
    limits.products
  );
  const content = useAccountResource(
    activeId,
    { plans: NO_PLANS, stats: NO_STATS },
    fetchContent,
    limits.campaigns
  );

  /* ── leads ─────────────────────────────────────────────────────────── */

  const loadLeads = useCallback<ReloStore["loadLeads"]>(
    async (params = {}) => {
      if (!activeId) {
        setLeads(EMPTY_LEADS);
        return;
      }
      const mine = ++leadsEpoch.current;
      setLeadsLoading(true);
      setLeadsError(null);
      try {
        const next = await api.getLeads(activeId, { limit: 50, ...params });
        if (leadsEpoch.current !== mine) return;
        setLeads(next);
      } catch (caught) {
        if (leadsEpoch.current !== mine) return;
        setLeads(EMPTY_LEADS);
        setLeadsError(toApiError(caught));
      } finally {
        if (leadsEpoch.current === mine) setLeadsLoading(false);
      }
    },
    [activeId]
  );

  useEffect(() => {
    setLeads(EMPTY_LEADS);
    void loadLeads();
  }, [loadLeads]);

  /* ── billing ───────────────────────────────────────────────────────── */

  const refreshBilling = useCallback(async () => {
    if (!api.getToken()) return;
    setBillingLoading(true);
    setBillingError(null);
    try {
      setBilling(await api.getBilling());
    } catch (caught) {
      setBillingError(toApiError(caught));
    } finally {
      setBillingLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "signed-in") void refreshBilling();
  }, [status, refreshBilling]);

  const submitUpi = useCallback<ReloStore["submitUpi"]>(
    async (tier, utr) => {
      const result = await api.submitUpiPayment(tier, utr);
      await refreshBilling();
      return result.message;
    },
    [refreshBilling]
  );

  /* ── mutations ─────────────────────────────────────────────────────── */

  const saveAutomation = useCallback<ReloStore["saveAutomation"]>(
    async (input) => {
      await api.saveAutomation(input);
      await Promise.all([automations.refresh(), reels.refresh()]);
    },
    [automations.refresh, reels.refresh]
  );

  const deleteAutomation = useCallback<ReloStore["deleteAutomation"]>(
    async (id) => {
      if (!activeId) return;
      await api.deleteAutomation(activeId, id);
      await Promise.all([automations.refresh(), reels.refresh()]);
    },
    [activeId, automations.refresh, reels.refresh]
  );

  const saveProduct = useCallback<ReloStore["saveProduct"]>(
    async (input) => {
      await api.saveProduct(input);
      await Promise.all([products.refresh(), linkPage.refresh()]);
    },
    [products.refresh, linkPage.refresh]
  );

  const deleteProduct = useCallback<ReloStore["deleteProduct"]>(
    async (id) => {
      if (!activeId) return;
      await api.deleteProduct(activeId, id);
      await Promise.all([products.refresh(), linkPage.refresh()]);
    },
    [activeId, products.refresh, linkPage.refresh]
  );

  const saveCampaign = useCallback<ReloStore["saveCampaign"]>(
    async (input) => {
      const result = await api.saveCampaign(input);
      await campaigns.refresh();
      return { reachability: result.reachability };
    },
    [campaigns.refresh]
  );

  const deleteCampaign = useCallback<ReloStore["deleteCampaign"]>(
    async (id) => {
      if (!activeId) return;
      await api.deleteCampaign(activeId, id);
      await campaigns.refresh();
    },
    [activeId, campaigns.refresh]
  );

  const saveFlow = useCallback<ReloStore["saveFlow"]>(
    async (input) => {
      const result = await api.saveFlow(input);
      await flows.refresh();
      return result.flow;
    },
    [flows.refresh]
  );

  const deleteFlow = useCallback<ReloStore["deleteFlow"]>(
    async (id) => {
      if (!activeId) return;
      await api.deleteFlow(activeId, id);
      await flows.refresh();
    },
    [activeId, flows.refresh]
  );

  const saveLinkPage = useCallback<ReloStore["saveLinkPage"]>(
    async (input) => {
      if (!activeId) throw new ApiError("NO_ACCOUNT", "Connect an Instagram account first.", 400);
      const result = await api.saveLinkPage(activeId, input);
      await linkPage.refresh();
      return result.publicUrl;
    },
    [activeId, linkPage.refresh]
  );

  const saveContentPlan = useCallback<ReloStore["saveContentPlan"]>(
    async (input) => {
      if (!activeId) throw new ApiError("NO_ACCOUNT", "Connect an Instagram account first.", 400);
      await api.saveContentPlan(activeId, input);
      await content.refresh();
    },
    [activeId, content.refresh]
  );

  const publishPlan = useCallback<ReloStore["publishPlan"]>(
    async (id, mediaId) => {
      if (!activeId) throw new ApiError("NO_ACCOUNT", "Connect an Instagram account first.", 400);
      await api.publishContentPlan(activeId, id, mediaId);
      await content.refresh();
    },
    [activeId, content.refresh]
  );

  const deleteContentPlan = useCallback<ReloStore["deleteContentPlan"]>(
    async (id) => {
      if (!activeId) return;
      await api.deleteContentPlan(activeId, id);
      await content.refresh();
    },
    [activeId, content.refresh]
  );

  const disconnectAccount = useCallback<ReloStore["disconnectAccount"]>(
    async (id) => {
      await api.disconnectAccount(id);
      setAccountId((current) => (current === id ? null : current));
      await refreshAccounts();
    },
    [refreshAccounts]
  );

  const refreshAll = useCallback(async () => {
    await Promise.allSettled([
      refreshAccounts(),
      refreshBilling(),
      reels.refresh(),
      automations.refresh(),
      telemetry.refresh(),
      campaigns.refresh(),
      products.refresh(),
      flows.refresh(),
      linkPage.refresh(),
      content.refresh(),
      loadLeads(),
    ]);
  }, [
    refreshAccounts,
    refreshBilling,
    reels.refresh,
    automations.refresh,
    telemetry.refresh,
    campaigns.refresh,
    products.refresh,
    flows.refresh,
    linkPage.refresh,
    content.refresh,
    loadLeads,
  ]);

  const value = useMemo<ReloStore>(
    () => ({
      status,
      user,
      completeSignIn,
      signOut,
      accounts,
      account,
      plan,
      limits,
      credits,
      accountsLoading,
      accountsError,
      selectAccount: setAccountId,
      refreshAccounts,
      disconnectAccount,
      reels,
      automations,
      telemetry,
      campaigns,
      products,
      flows,
      linkPage,
      content,
      leads,
      leadsLoading,
      leadsError,
      loadLeads,
      billing,
      billingLoading,
      billingError,
      refreshBilling,
      submitUpi,
      saveAutomation,
      deleteAutomation,
      saveProduct,
      deleteProduct,
      saveCampaign,
      deleteCampaign,
      saveFlow,
      deleteFlow,
      saveLinkPage,
      saveContentPlan,
      publishPlan,
      deleteContentPlan,
      refreshAll,
    }),
    [
      status,
      user,
      completeSignIn,
      signOut,
      accounts,
      account,
      plan,
      limits,
      credits,
      accountsLoading,
      accountsError,
      refreshAccounts,
      disconnectAccount,
      reels,
      automations,
      telemetry,
      campaigns,
      products,
      flows,
      linkPage,
      content,
      leads,
      leadsLoading,
      leadsError,
      loadLeads,
      billing,
      billingLoading,
      billingError,
      refreshBilling,
      submitUpi,
      saveAutomation,
      deleteAutomation,
      saveProduct,
      deleteProduct,
      saveCampaign,
      deleteCampaign,
      saveFlow,
      deleteFlow,
      saveLinkPage,
      saveContentPlan,
      publishPlan,
      deleteContentPlan,
      refreshAll,
    ]
  );

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useRelo(): ReloStore {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error("useRelo must be used inside <ReloProvider>");
  return ctx;
}
