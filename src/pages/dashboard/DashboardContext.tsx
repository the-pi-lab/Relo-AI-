import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { api } from "@/lib/api";
import type {
  ConnectedAccount,
  InstagramReelMedia,
  CapturedLead,
  ReelAutomation,
  SystemTelemetry,
  Tier,
} from "@/types/contracts";
import {
  asAccountId,
  asUserId,
  asInstagramUserId,
  asMediaId,
  asLeadId,
} from "@/types/contracts";

export type Telemetry = SystemTelemetry & {
  totalLeads: number;
  totalComments: number;
  totalDmsSent: number;
  followerConversionRate: number;
};

const EMPTY_TELEMETRY: Telemetry = {
  status: "healthy",
  queueDepth: 0,
  pendingJobs: 0,
  completed24h: 0,
  failed24h: 0,
  totalLeads: 0,
  totalComments: 0,
  totalDmsSent: 0,
  followerConversionRate: 0,
};

const DEMO_ACCOUNT: ConnectedAccount = {
  id: asAccountId("acc_demo_pilot"),
  userId: asUserId("user_demo"),
  instagramUserId: asInstagramUserId("ig_user_100"),
  username: "creator_growth",
  tokenExpiresAt: Math.floor(Date.now() / 1000) + 5184000,
  daysUntilExpiration: 60,
  isActive: true,
  createdAt: Math.floor(Date.now() / 1000),
  plan: "free",
  aiCreditsRemaining: 3,
  aiCreditsResetAt: Math.floor(Date.now() / 1000) + 30 * 86400,
  freeReelConsumed: false,
};

const DEMO_REELS: InstagramReelMedia[] = [
  {
    id: asMediaId("reel_101"),
    permalink: "https://instagram.com/reel/demo1",
    mediaType: "VIDEO",
    thumbnailUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&q=80",
    caption: "Scaling Instagram DM funnels with zero contact taxes. Comment GUIDE for the link! 👇",
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    commentsCount: 142,
    likeCount: 890,
    hasActiveAutomation: true,
  },
  {
    id: asMediaId("reel_102"),
    permalink: "https://instagram.com/reel/demo2",
    mediaType: "VIDEO",
    thumbnailUrl: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&q=80",
    caption: "The 3-step edge automation blueprint for creators. Comment VIP for free templates.",
    timestamp: new Date(Date.now() - 172800000).toISOString(),
    commentsCount: 98,
    likeCount: 650,
    hasActiveAutomation: false,
  },
  {
    id: asMediaId("reel_103"),
    permalink: "https://instagram.com/reel/demo3",
    mediaType: "VIDEO",
    thumbnailUrl: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=600&q=80",
    caption: "Why serverless edge architecture changes Instagram automation economics forever.",
    timestamp: new Date(Date.now() - 259200000).toISOString(),
    commentsCount: 215,
    likeCount: 1420,
    hasActiveAutomation: false,
  },
];

const DEMO_LEADS: CapturedLead[] = [
  {
    id: asLeadId("lead_1"),
    accountId: asAccountId("acc_demo_pilot"),
    instagramScopedId: asInstagramUserId("ig_scoped_901"),
    username: "sarah_marketing",
    followerStatusAtTrigger: true,
    emailCollected: "sarah@growthagency.io",
    totalDmsSent: 3,
    firstInteractionAt: Math.floor(Date.now() / 1000) - 86400,
    lastInteractionAt: Math.floor(Date.now() / 1000) - 3600,
  },
  {
    id: asLeadId("lead_2"),
    accountId: asAccountId("acc_demo_pilot"),
    instagramScopedId: asInstagramUserId("ig_scoped_902"),
    username: "alex_video_edit",
    followerStatusAtTrigger: true,
    totalDmsSent: 1,
    firstInteractionAt: Math.floor(Date.now() / 1000) - 72000,
    lastInteractionAt: Math.floor(Date.now() / 1000) - 72000,
  },
  {
    id: asLeadId("lead_3"),
    accountId: asAccountId("acc_demo_pilot"),
    instagramScopedId: asInstagramUserId("ig_scoped_903"),
    username: "dan_ecommerce",
    followerStatusAtTrigger: false,
    emailCollected: "dan@dropship.co",
    totalDmsSent: 4,
    firstInteractionAt: Math.floor(Date.now() / 1000) - 120000,
    lastInteractionAt: Math.floor(Date.now() / 1000) - 14400,
  },
];

const LEADS_PAGE_SIZE = 25;

const DEMO_TELEMETRY: Telemetry = {
  status: "healthy",
  queueDepth: 2,
  pendingJobs: 2,
  completed24h: 47,
  failed24h: 1,
  totalLeads: 128,
  totalComments: 49,
  totalDmsSent: 131,
  followerConversionRate: 71,
  totalClicks: 39,
  storageRows: 131,
  plan: "free",
  aiCreditsRemaining: 2,
};

interface DashboardContextValue {
  isDemo: boolean;
  exitDemo: () => void;
  accounts: ConnectedAccount[];
  selectedAccountId: string;
  currentAccount: ConnectedAccount | undefined;
  /** Demo-only plan override, so the owner can inspect Pro/Studio surfaces. */
  previewPlan: Tier | null;
  setPreviewPlan: (plan: Tier | null) => void;
  isLoadingAccounts: boolean;
  accountsError: string | null;
  selectAccount: (id: string) => void;
  reloadAccounts: () => Promise<void>;

  reels: InstagramReelMedia[];
  isLoadingReels: boolean;
  reelsError: string | null;
  loadReels: () => Promise<void>;
  activeAutomationCount: number;

  selectedReel: InstagramReelMedia | null;
  editingAutomation: ReelAutomation | null;
  selectReelForAutomation: (reel: InstagramReelMedia) => Promise<void>;
  clearEditor: () => void;
  saveAutomation: (data: Parameters<typeof api.automations.save>[0]) => Promise<void>;
  deleteAutomation: () => Promise<void>;

  leads: CapturedLead[];
  leadsTotal: number;
  leadsPage: number;
  isLoadingLeads: boolean;
  leadsError: string | null;
  loadLeads: (search?: string, page?: number) => Promise<void>;

  telemetry: Telemetry;
  isLoadingAnalytics: boolean;
  analyticsError: string | null;
  loadAnalytics: () => Promise<void>;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

export function useDashboard(): DashboardContextValue {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error("useDashboard must be used within DashboardProvider");
  return ctx;
}

export function DashboardProvider({ children }: { children: ReactNode }) {
  // Demo mode must survive in-app navigation: sidebar NavLinks point at bare
  // /dashboard/*, which would drop ?demo=true and bounce the user to /login.
  // sessionStorage makes the flag sticky for the whole browsing session.
  const [isDemo, setIsDemo] = useState(() => {
    if (typeof window === "undefined") return false;
    return (
      new URLSearchParams(window.location.search).get("demo") === "true" ||
      sessionStorage.getItem("relo.demo") === "1"
    );
  });

  useEffect(() => {
    if (isDemo) sessionStorage.setItem("relo.demo", "1");
    else sessionStorage.removeItem("relo.demo");
  }, [isDemo]);

  /** Leave the sample workspace and return to the real sign-in flow. */
  const exitDemo = useCallback(() => {
    sessionStorage.removeItem("relo.demo");
    sessionStorage.removeItem("relo.preview_plan");
    setPreviewPlan(null);
    setIsDemo(false);
    window.location.assign("/login");
  }, []);

  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);
  const [accountsError, setAccountsError] = useState<string | null>(null);

  const [reels, setReels] = useState<InstagramReelMedia[]>([]);
  const [isLoadingReels, setIsLoadingReels] = useState(false);
  const [reelsError, setReelsError] = useState<string | null>(null);
  const [selectedReel, setSelectedReel] = useState<InstagramReelMedia | null>(null);
  const [editingAutomation, setEditingAutomation] = useState<ReelAutomation | null>(null);

  const [leads, setLeads] = useState<CapturedLead[]>([]);
  const [leadsTotal, setLeadsTotal] = useState(0);
  const [leadsPage, setLeadsPage] = useState(0);
  const [isLoadingLeads, setIsLoadingLeads] = useState(false);
  const [leadsError, setLeadsError] = useState<string | null>(null);

  const [telemetry, setTelemetry] = useState<Telemetry>(EMPTY_TELEMETRY);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);

  /* ── accounts ── */
  const loadAccounts = useCallback(async () => {
    setIsLoadingAccounts(true);
    setAccountsError(null);
    try {
      const accs = await api.accounts.list();
      if (accs.length > 0) {
        setAccounts(accs);
        setSelectedAccountId(accs[0].id);
      } else {
        setAccounts([]);
        setSelectedAccountId("");
      }
    } catch {
      if (isDemo) {
        setAccounts([DEMO_ACCOUNT]);
        setSelectedAccountId(DEMO_ACCOUNT.id);
      } else {
        setAccounts([]);
        setSelectedAccountId("");
        setAccountsError("Couldn't load your connected accounts. Please refresh to retry.");
      }
    } finally {
      setIsLoadingAccounts(false);
    }
  }, [isDemo]);

  useEffect(() => {
    if (isDemo) {
      setAccounts([DEMO_ACCOUNT]);
      setSelectedAccountId(DEMO_ACCOUNT.id);
      setIsLoadingAccounts(false);
      return;
    }
    if (!api.auth.isAuthenticated()) {
      window.location.assign("/login?redirect=/dashboard");
      return;
    }
    loadAccounts();
  }, [isDemo, loadAccounts]);

  const selectAccount = useCallback((id: string) => {
    setSelectedAccountId(id);
  }, []);

  // Account switch: clear dependent state so stale data never bleeds across.
  // Skipped on the initial "" → id hand-off — child effects already fetched for
  // that id, and resetting here would wipe their fresh telemetry.
  const lastAccountId = useRef(selectedAccountId);
  useEffect(() => {
    const prev = lastAccountId.current;
    lastAccountId.current = selectedAccountId;
    if (!prev || prev === selectedAccountId) return;
    setSelectedReel(null);
    setEditingAutomation(null);
    setTelemetry(EMPTY_TELEMETRY);
  }, [selectedAccountId]);

  const currentAccountBase = useMemo(
    () => accounts.find((a) => a.id === selectedAccountId) || accounts[0],
    [accounts, selectedAccountId]
  );

  /* ── developer tier preview ──
     In demo mode the owner can flip the plan to inspect Pro/Studio surfaces
     without a real subscription. Outside demo this is inert. Persisted like
     the demo flag, so a refresh doesn't silently drop you back to Free.
     sessionStorage values are user-editable, so the read is validated. */
  const PREVIEW_KEY = "relo.preview_plan";
  const readPreviewPlan = (): Tier | null => {
    try {
      const v = sessionStorage.getItem(PREVIEW_KEY);
      return v === "free" || v === "pro" || v === "studio" ? v : null;
    } catch {
      return null;
    }
  };

  const [previewPlan, setPreviewPlan] = useState<Tier | null>(readPreviewPlan);

  useEffect(() => {
    try {
      if (previewPlan) sessionStorage.setItem(PREVIEW_KEY, previewPlan);
      else sessionStorage.removeItem(PREVIEW_KEY);
    } catch {
      /* storage unavailable — the preview simply won't persist */
    }
  }, [previewPlan]);

  const currentAccount = useMemo(() => {
    if (!currentAccountBase) return currentAccountBase;
    if (!isDemo || !previewPlan || previewPlan === currentAccountBase.plan) {
      return currentAccountBase;
    }
    return {
      ...currentAccountBase,
      plan: previewPlan,
      aiCreditsRemaining:
        previewPlan === "free" ? 3 : previewPlan === "pro" ? 500 : 5000,
    };
  }, [currentAccountBase, isDemo, previewPlan]);

  /* ── reels (race-guarded) ── */
  const reelsRequestId = useRef(0);
  const loadReels = useCallback(async () => {
    if (!selectedAccountId) return;
    const requestId = ++reelsRequestId.current;
    setIsLoadingReels(true);
    setReelsError(null);
    try {
      const data = await api.reels.list(selectedAccountId);
      if (reelsRequestId.current === requestId) setReels(data);
    } catch {
      if (reelsRequestId.current !== requestId) return;
      if (isDemo) {
        setReels(DEMO_REELS);
      } else {
        setReels([]);
        setReelsError(
          "Couldn't load your Reels. Check your connection, or reconnect your Instagram account if the token expired."
        );
      }
    } finally {
      if (reelsRequestId.current === requestId) setIsLoadingReels(false);
    }
  }, [selectedAccountId, isDemo]);

  /* ── leads (race-guarded + paginated) ── */
  const leadsRequestId = useRef(0);
  const loadLeads = useCallback(
    async (search?: string, page = 0) => {
      if (!selectedAccountId) return;
      const requestId = ++leadsRequestId.current;
      setIsLoadingLeads(true);
      setLeadsError(null);
      try {
        const data = await api.leads.list(selectedAccountId, {
          search,
          limit: LEADS_PAGE_SIZE,
          offset: page * LEADS_PAGE_SIZE,
        });
        if (leadsRequestId.current !== requestId) return;
        setLeads(data.leads);
        setLeadsTotal(data.total);
        setLeadsPage(page);
      } catch {
        if (leadsRequestId.current !== requestId) return;
        if (isDemo) {
          setLeads(DEMO_LEADS);
          setLeadsTotal(DEMO_LEADS.length);
        } else {
          setLeads([]);
          setLeadsTotal(0);
          setLeadsError("Couldn't load captured leads. Please try again.");
        }
      } finally {
        if (leadsRequestId.current === requestId) setIsLoadingLeads(false);
      }
    },
    [selectedAccountId, isDemo]
  );

  /* ── analytics ── */
  const loadAnalytics = useCallback(async () => {
    if (!selectedAccountId) return;
    setIsLoadingAnalytics(true);
    setAnalyticsError(null);
    try {
      if (isDemo) {
        setTelemetry(DEMO_TELEMETRY);
      } else {
        const data = await api.analytics.get(selectedAccountId);
        setTelemetry(data);
      }
    } catch {
      setAnalyticsError("Telemetry is unreachable right now. The engine may be warming up.");
    } finally {
      setIsLoadingAnalytics(false);
    }
  }, [selectedAccountId, isDemo]);

  /* ── automation actions ── */
  const selectReelForAutomation = useCallback(
    async (reel: InstagramReelMedia) => {
      setSelectedReel(reel);
      setEditingAutomation(null);
      if (!isDemo && selectedAccountId) {
        try {
          const automations = await api.automations.list(selectedAccountId);
          const existing = automations.find((a) => a.instagramMediaId === reel.id && a.isActive);
          if (existing) setEditingAutomation(existing);
        } catch {
          // Editor opens in create mode — acceptable fallback
        }
      }
    },
    [isDemo, selectedAccountId]
  );

  const clearEditor = useCallback(() => {
    setSelectedReel(null);
    setEditingAutomation(null);
  }, []);

  const saveAutomation = useCallback(
    async (automationData: Parameters<typeof api.automations.save>[0]) => {
      await api.automations.save(automationData);
      setReels((prev) =>
        prev.map((r) =>
          r.id === automationData.instagramMediaId ? { ...r, hasActiveAutomation: true } : r
        )
      );
      clearEditor();
    },
    [clearEditor]
  );

  const deleteAutomation = useCallback(async () => {
    if (!editingAutomation || !selectedAccountId) return;
    await api.automations.delete(editingAutomation.id, selectedAccountId);
    setReels((prev) =>
      prev.map((r) =>
        r.id === editingAutomation.instagramMediaId ? { ...r, hasActiveAutomation: false } : r
      )
    );
    clearEditor();
  }, [editingAutomation, selectedAccountId, clearEditor]);

  const activeAutomationCount = useMemo(
    () => reels.filter((r) => r.hasActiveAutomation).length,
    [reels]
  );

  const value: DashboardContextValue = {
    isDemo,
    accounts,
    selectedAccountId,
    currentAccount,
    previewPlan,
    setPreviewPlan,
    isLoadingAccounts,
    accountsError,
    selectAccount,
    reloadAccounts: loadAccounts,
    reels,
    isLoadingReels,
    reelsError,
    loadReels,
    activeAutomationCount,
    selectedReel,
    editingAutomation,
    selectReelForAutomation,
    clearEditor,
    saveAutomation,
    deleteAutomation,
    leads,
    leadsTotal,
    leadsPage,
    isLoadingLeads,
    leadsError,
    loadLeads,
    telemetry,
    isLoadingAnalytics,
    analyticsError,
    loadAnalytics,
    exitDemo,
  };

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}
