"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import {
  type ActivityEvent,
  type Automation,
  type Campaign,
  type ContentPlan,
  type ContentStatus,
  type Flow,
  type Lead,
  type LinkPageData,
  type Product,
  type Tier,
  DEMO_ACTIVITY,
  DEMO_AUTOMATIONS,
  DEMO_CAMPAIGNS,
  DEMO_CONTENT,
  DEMO_FLOWS,
  DEMO_LEADS,
  DEMO_LINK_PAGE,
  DEMO_PRODUCTS,
  DEMO_REELS,
  uid,
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

export function parseHash(hash: string): Route {
  /* strip any query (e.g. #/studio?demo=1) before routing */
  const h = hash.replace(/^#\/?/, "").split("?")[0];
  if (h === "" || ["simulator", "features", "architecture", "calculator", "spintax", "pricing", "faq"].includes(h)) {
    return { name: "landing" };
  }
  if (h === "login") return { name: "login" };
  if (h === "privacy") return { name: "privacy" };
  if (h === "terms") return { name: "terms" };
  if (h === "cookies") return { name: "cookies" };
  if (h === "studio" || h.startsWith("studio/")) {
    const view = h === "studio" ? "home" : h.slice("studio/".length) || "home";
    return { name: "studio", view };
  }
  return { name: "landing" };
}

/* The URL is the only source of truth for the route, so the hash is read
   through useSyncExternalStore. On the server the snapshot is empty, which
   keeps the first client render identical to the server HTML and avoids a
   hydration mismatch; React then re-reads the snapshot straight after
   hydration and re-renders if the URL already pointed somewhere else. That is
   what makes a deep link opened in a fresh tab land on the right screen
   without waiting for a hashchange to happen. */
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
    if (window.location.hash === target) return;
    window.location.hash = target;
  }, []);

  return [route, navigate];
}

/* ── studio state ────────────────────────────────────────────────────── */

export interface ReloUser {
  email: string;
  isDemo: boolean;
}

export interface StudioState {
  plan: Tier;
  aiCredits: number;
  automations: Automation[];
  leads: Lead[];
  campaigns: Campaign[];
  flows: Flow[];
  products: Product[];
  linkPage: LinkPageData;
  content: ContentPlan[];
  activity: ActivityEvent[];
}

interface Store {
  user: ReloUser | null;
  signIn: (email: string, demo?: boolean) => void;
  signOut: () => void;
  upgradePlan: (tier: Tier) => void;
  spendCredit: () => void;
  /* automations */
  saveAutomation: (a: Automation) => void;
  deleteAutomation: (id: string) => void;
  toggleAutomation: (id: string) => void;
  /* campaigns */
  saveCampaign: (c: Campaign) => void;
  deleteCampaign: (id: string) => void;
  /* flows */
  saveFlow: (f: Flow) => void;
  /* products */
  saveProduct: (p: Product) => void;
  deleteProduct: (id: string) => void;
  /* link page */
  saveLinkPage: (p: LinkPageData) => void;
  /* content */
  saveContent: (c: ContentPlan) => void;
  moveContent: (id: string, status: ContentStatus) => void;
  deleteContent: (id: string) => void;
  /* leads */
  deleteLead: (id: string) => void;
  pushActivity: (kind: "comment" | "dm" | "lead" | "click" | "system", text: string, meta?: string) => void;
}

const StoreCtx = createContext<Store | null>(null);

/* v2: the demo fixtures were rewritten (the copy no longer carries em dashes or
   emoji), so an older snapshot would keep resurrecting retired strings. The
   version suffix retires it without any migration code. */
const PERSIST_KEY = "relo-studio-v2";

interface Persisted {
  user: ReloUser | null;
  plan: Tier;
  aiCredits: number;
  automations: Automation[];
  campaigns: Campaign[];
  flows: Flow[];
  products: Product[];
  linkPage: LinkPageData;
  content: ContentPlan[];
}

function loadPersisted(): Partial<Persisted> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(PERSIST_KEY);
    return raw ? (JSON.parse(raw) as Partial<Persisted>) : {};
  } catch {
    return {};
  }
}

export function ReloProvider({ children }: { children: React.ReactNode }) {
  const [persisted] = useState<Partial<Persisted>>(() => loadPersisted());

  const [user, setUser] = useState<ReloUser | null>(persisted.user ?? null);
  const [plan, setPlan] = useState<Tier>(persisted.plan ?? "pro");
  const [aiCredits, setAiCredits] = useState<number>(persisted.aiCredits ?? 500);

  const [automations, setAutomations] = useState<Automation[]>(persisted.automations ?? DEMO_AUTOMATIONS);
  const [leads, setLeads] = useState<Lead[]>(DEMO_LEADS);
  const [campaigns, setCampaigns] = useState<Campaign[]>(persisted.campaigns ?? DEMO_CAMPAIGNS);
  const [flows, setFlows] = useState<Flow[]>(persisted.flows ?? DEMO_FLOWS);
  const [products, setProducts] = useState<Product[]>(persisted.products ?? DEMO_PRODUCTS);
  const [linkPage, setLinkPage] = useState<LinkPageData>(persisted.linkPage ?? DEMO_LINK_PAGE);
  const [content, setContent] = useState<ContentPlan[]>(persisted.content ?? DEMO_CONTENT);
  const [activity, setActivity] = useState<ActivityEvent[]>(DEMO_ACTIVITY);

  /* persist */
  useEffect(() => {
    try {
      const snapshot: Persisted = {
        user,
        plan,
        aiCredits,
        automations,
        campaigns,
        flows,
        products,
        linkPage,
        content,
      };
      window.localStorage.setItem(PERSIST_KEY, JSON.stringify(snapshot));
    } catch {
      /* storage full or unavailable, which is fine for the demo */
    }
  }, [user, plan, aiCredits, automations, campaigns, flows, products, linkPage, content]);

  const pushActivity = useCallback<Store["pushActivity"]>((kind, text, meta) => {
    setActivity((prev) => [{ id: uid("ev"), at: Date.now(), kind, text, meta }, ...prev].slice(0, 40));
  }, []);

  const store = useMemo<Store>(
    () => ({
      user,
      signIn: (email, demo = false) => setUser({ email, isDemo: demo }),
      signOut: () => setUser(null),
      upgradePlan: (tier) => {
        setPlan(tier);
        setAiCredits(tier === "free" ? 3 : tier === "pro" ? 500 : 5000);
      },
      spendCredit: () => setAiCredits((c) => Math.max(0, c - 1)),
      saveAutomation: (a) =>
        setAutomations((prev) => {
          const idx = prev.findIndex((x) => x.id === a.id);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = a;
            return next;
          }
          return [...prev, a];
        }),
      deleteAutomation: (id) => setAutomations((prev) => prev.filter((a) => a.id !== id)),
      toggleAutomation: (id) =>
        setAutomations((prev) => prev.map((a) => (a.id === id ? { ...a, isActive: !a.isActive } : a))),
      saveCampaign: (c) =>
        setCampaigns((prev) => {
          const idx = prev.findIndex((x) => x.id === c.id);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = c;
            return next;
          }
          return [c, ...prev];
        }),
      deleteCampaign: (id) => setCampaigns((prev) => prev.filter((c) => c.id !== id)),
      saveFlow: (f) =>
        setFlows((prev) => {
          const idx = prev.findIndex((x) => x.id === f.id);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = f;
            return next;
          }
          return [...prev, f];
        }),
      saveProduct: (p) =>
        setProducts((prev) => {
          const idx = prev.findIndex((x) => x.id === p.id);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = p;
            return next;
          }
          return [...prev, p];
        }),
      deleteProduct: (id) => setProducts((prev) => prev.filter((p) => p.id !== id)),
      saveLinkPage: (p) => setLinkPage(p),
      saveContent: (c) =>
        setContent((prev) => {
          const idx = prev.findIndex((x) => x.id === c.id);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = c;
            return next;
          }
          return [...prev, c];
        }),
      moveContent: (id, status) =>
        setContent((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c))),
      deleteContent: (id) => setContent((prev) => prev.filter((c) => c.id !== id)),
      deleteLead: (id) => setLeads((prev) => prev.filter((l) => l.id !== id)),
      pushActivity,
    }),
    [user, plan, aiCredits, automations, campaigns, flows, products, linkPage, content, pushActivity]
  );

  /* expose read-only slices through the same context */
  const value = useMemo(
    () => ({
      ...store,
      plan,
      aiCredits,
      automations,
      campaigns,
      flows,
      products,
      linkPage,
      content,
      leads,
      activity,
      reels: DEMO_REELS,
    }),
    [store, plan, aiCredits, automations, campaigns, flows, products, linkPage, content, leads, activity]
  );

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export interface ReloStore extends Store {
  plan: Tier;
  aiCredits: number;
  automations: Automation[];
  campaigns: Campaign[];
  flows: Flow[];
  products: Product[];
  linkPage: LinkPageData;
  content: ContentPlan[];
  leads: Lead[];
  activity: ActivityEvent[];
  reels: typeof DEMO_REELS;
}

export function useRelo(): ReloStore {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error("useRelo must be used inside <ReloProvider>");
  return ctx as ReloStore;
}
