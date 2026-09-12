import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router";
import {
  Sparkles,
  Play,
  Sliders,
  Users,
  BarChart3,
  LogOut,
  RefreshCw,
  Instagram,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import type {
  ConnectedAccount,
  InstagramReelMedia,
  CapturedLead,
  SystemTelemetry,
} from "@/types/contracts";
import {
  asAccountId,
  asUserId,
  asInstagramUserId,
  asMediaId,
  asLeadId,
} from "@/types/contracts";

import ReelsGrid from "@/components/dashboard/ReelsGrid";
import AutomationEditor from "@/components/dashboard/AutomationEditor";
import LeadsTable from "@/components/dashboard/LeadsTable";
import AnalyticsCards from "@/components/dashboard/AnalyticsCards";

export default function Dashboard() {
  const navigate = useNavigate();

  // Active Tab state
  const [activeTab, setActiveTab] = useState<"reels" | "editor" | "leads" | "analytics">("reels");

  // Account state
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);

  // Data states
  const [reels, setReels] = useState<InstagramReelMedia[]>([]);
  const [isLoadingReels, setIsLoadingReels] = useState(false);
  const [reelsError, setReelsError] = useState<string | null>(null);
  const [selectedReel, setSelectedReel] = useState<InstagramReelMedia | null>(null);

  const [leads, setLeads] = useState<CapturedLead[]>([]);
  const [leadsTotal, setLeadsTotal] = useState(0);
  const [isLoadingLeads, setIsLoadingLeads] = useState(false);
  const [leadsError, setLeadsError] = useState<string | null>(null);

  const [telemetry, setTelemetry] = useState<
    SystemTelemetry & {
      totalLeads: number;
      totalComments: number;
      totalDmsSent: number;
      followerConversionRate: number;
    }
  >({
    status: "idle",
    queueDepth: 0,
    pendingJobs: 0,
    completed24h: 0,
    failed24h: 0,
    averageLatencyMs: 0,
    rateLimitUsagePercent: 0,
    totalLeads: 0,
    totalComments: 0,
    totalDmsSent: 0,
    followerConversionRate: 0,
  });

  const isDemo = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("demo") === "true";

  // Load user accounts
  const loadAccounts = useCallback(async () => {
    setIsLoadingAccounts(true);
    try {
      const accs = await api.accounts.list();
      if (accs.length > 0) {
        setAccounts(accs);
        setSelectedAccountId(accs[0].id);
      } else if (isDemo) {
        // Provide demo connected account if in demo mode
        const demoAcc: ConnectedAccount = {
          id: asAccountId("acc_demo_pilot"),
          userId: asUserId("user_1"),
          instagramUserId: asInstagramUserId("ig_user_100"),
          username: "creator_growth",
          profilePictureUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&q=80",
          tokenExpiresAt: Math.floor(Date.now() / 1000) + 5184000,
          daysUntilExpiration: 60,
          isActive: true,
          createdAt: Math.floor(Date.now() / 1000),
        };
        setAccounts([demoAcc]);
        setSelectedAccountId(demoAcc.id);
      } else {
        setAccounts([]);
        setSelectedAccountId("");
      }
    } catch {
      if (isDemo) {
        const fallbackAcc: ConnectedAccount = {
          id: asAccountId("acc_demo_pilot"),
          userId: asUserId("user_1"),
          instagramUserId: asInstagramUserId("ig_user_100"),
          username: "creator_growth",
          tokenExpiresAt: Math.floor(Date.now() / 1000) + 5184000,
          daysUntilExpiration: 60,
          isActive: true,
          createdAt: Math.floor(Date.now() / 1000),
        };
        setAccounts([fallbackAcc]);
        setSelectedAccountId(fallbackAcc.id);
      } else {
        setAccounts([]);
        setSelectedAccountId("");
      }
    } finally {
      setIsLoadingAccounts(false);
    }
  }, [isDemo]);

  // Check auth session (allow demo mode without redirect)
  useEffect(() => {
    if (!api.auth.isAuthenticated() && !isDemo) {
      navigate("/login?redirect=/dashboard");
      return;
    }
    loadAccounts();
  }, [navigate, isDemo, loadAccounts]);

  const loadReels = useCallback(async () => {
    if (!selectedAccountId) return;
    setIsLoadingReels(true);
    setReelsError(null);
    try {
      const data = await api.reels.list(selectedAccountId);
      setReels(data);
    } catch {
      if (isDemo) {
        setReels([
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
        ]);
      } else {
        setReels([]);
        setReelsError("Couldn't load Instagram Reels. Please check your network connection or reconnect your Instagram account.");
      }
    } finally {
      setIsLoadingReels(false);
    }
  }, [selectedAccountId, isDemo]);

  const loadLeads = useCallback(async (search?: string) => {
    if (!selectedAccountId) return;
    setIsLoadingLeads(true);
    setLeadsError(null);
    try {
      const data = await api.leads.list(selectedAccountId, { search });
      setLeads(data.leads);
      setLeadsTotal(data.total);
    } catch {
      if (isDemo) {
        setLeads([
          {
            id: asLeadId("lead_1"),
            accountId: asAccountId(selectedAccountId),
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
            accountId: asAccountId(selectedAccountId),
            instagramScopedId: asInstagramUserId("ig_scoped_902"),
            username: "alex_video_edit",
            followerStatusAtTrigger: true,
            emailCollected: undefined,
            totalDmsSent: 1,
            firstInteractionAt: Math.floor(Date.now() / 1000) - 72000,
            lastInteractionAt: Math.floor(Date.now() / 1000) - 72000,
          },
          {
            id: asLeadId("lead_3"),
            accountId: asAccountId(selectedAccountId),
            instagramScopedId: asInstagramUserId("ig_scoped_903"),
            username: "dan_ecommerce",
            followerStatusAtTrigger: false,
            emailCollected: "dan@dropship.co",
            totalDmsSent: 4,
            firstInteractionAt: Math.floor(Date.now() / 1000) - 120000,
            lastInteractionAt: Math.floor(Date.now() / 1000) - 14400,
          },
        ]);
        setLeadsTotal(3);
      } else {
        setLeads([]);
        setLeadsTotal(0);
        setLeadsError("Couldn't load captured leads. Please try again.");
      }
    } finally {
      setIsLoadingLeads(false);
    }
  }, [selectedAccountId, isDemo]);

  const loadAnalytics = useCallback(async () => {
    if (!selectedAccountId) return;
    try {
      const data = await api.analytics.get(selectedAccountId);
      setTelemetry(data);
    } catch {
      // In case of error, update status to disconnected
      setTelemetry((prev) => ({ ...prev, status: "idle" }));
    }
  }, [selectedAccountId]);

  // When selected account changes, reload data for active tab
  useEffect(() => {
    if (!selectedAccountId) return;

    if (activeTab === "reels") {
      loadReels();
    } else if (activeTab === "leads") {
      loadLeads();
    } else if (activeTab === "analytics") {
      loadAnalytics();
    }
  }, [selectedAccountId, activeTab, loadReels, loadLeads, loadAnalytics]);

  const handleSelectReelToAutomate = (reel: InstagramReelMedia) => {
    setSelectedReel(reel);
    setActiveTab("editor");
  };

  const handleSaveAutomation = async (automationData: Parameters<typeof api.automations.save>[0]) => {
    await api.automations.save(automationData);
    // Mark reel as active automation in state
    setReels(
      reels.map((r) =>
        r.id === automationData.instagramMediaId ? { ...r, hasActiveAutomation: true } : r
      )
    );
    setActiveTab("reels");
  };

  const currentAccount = accounts.find((a) => a.id === selectedAccountId) || accounts[0];

  const studioTabs = ["reels", "editor", "leads", "analytics"] as const;

  const handleTabKeyDown = (e: React.KeyboardEvent, currentTab: typeof activeTab) => {
    const currentIndex = studioTabs.indexOf(currentTab);
    if (e.key === "ArrowRight") {
      e.preventDefault();
      const nextTab = studioTabs[(currentIndex + 1) % studioTabs.length];
      setActiveTab(nextTab);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      const prevTab = studioTabs[(currentIndex - 1 + studioTabs.length) % studioTabs.length];
      setActiveTab(prevTab);
    } else if (e.key === "Home") {
      e.preventDefault();
      setActiveTab(studioTabs[0]);
    } else if (e.key === "End") {
      e.preventDefault();
      setActiveTab(studioTabs[studioTabs.length - 1]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-sky-200 selection:text-sky-900 flex flex-col">
      {/* Demo Mode Banner */}
      {isDemo && (
        <div className="bg-sky-50 border-b border-sky-200/80 px-4 py-2 text-center text-xs font-semibold text-sky-800 flex items-center justify-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-sky-600 shrink-0" />
          <span>Studio Demo Mode — Exploring with sample Instagram data.</span>
          <Link to="/login" className="underline font-bold text-sky-700 hover:text-sky-900 ml-1">
            Sign in with Email
          </Link>
          <span>to connect your real account.</span>
        </div>
      )}

      {/* Top Studio Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3 flex items-center justify-between shadow-xs">
        {/* Logo and Brand */}
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-emerald-500 p-[1px] shadow-sm">
              <div className="w-full h-full bg-white rounded-[11px] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-sky-600" />
              </div>
            </div>
            <span className="font-black text-lg tracking-tight text-slate-900">
              RELO <span className="text-sky-600">AI</span>
            </span>
          </Link>

          {/* Tab Navigation Pill Group */}
          <nav
            role="tablist"
            aria-label="Studio navigation"
            className="hidden md:flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200/80 text-xs font-bold"
          >
            <button
              role="tab"
              id="tab-reels"
              aria-controls="panel-reels"
              aria-selected={activeTab === "reels"}
              tabIndex={activeTab === "reels" ? 0 : -1}
              onKeyDown={(e) => handleTabKeyDown(e, "reels")}
              onClick={() => setActiveTab("reels")}
              className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
                activeTab === "reels"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Play className="w-3.5 h-3.5 text-sky-600" />
              Reels Studio
            </button>
            <button
              role="tab"
              id="tab-editor"
              aria-controls="panel-editor"
              aria-selected={activeTab === "editor"}
              tabIndex={activeTab === "editor" ? 0 : -1}
              onKeyDown={(e) => handleTabKeyDown(e, "editor")}
              onClick={() => setActiveTab("editor")}
              className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
                activeTab === "editor"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Sliders className="w-3.5 h-3.5 text-sky-600" />
              Automation Studio
            </button>
            <button
              role="tab"
              id="tab-leads"
              aria-controls="panel-leads"
              aria-selected={activeTab === "leads"}
              tabIndex={activeTab === "leads" ? 0 : -1}
              onKeyDown={(e) => handleTabKeyDown(e, "leads")}
              onClick={() => setActiveTab("leads")}
              className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
                activeTab === "leads"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Users className="w-3.5 h-3.5 text-emerald-600" />
              Captured Leads
            </button>
            <button
              role="tab"
              id="tab-analytics"
              aria-controls="panel-analytics"
              aria-selected={activeTab === "analytics"}
              tabIndex={activeTab === "analytics" ? 0 : -1}
              onKeyDown={(e) => handleTabKeyDown(e, "analytics")}
              onClick={() => setActiveTab("analytics")}
              className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
                activeTab === "analytics"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-sky-600" />
              Telemetry
            </button>
          </nav>
        </div>

        {/* Account Selector & Profile */}
        <div className="flex items-center gap-3">
          {isLoadingAccounts ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200/80 text-xs text-slate-500 font-medium animate-pulse">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-400" />
              <span>Connecting account...</span>
            </div>
          ) : currentAccount ? (
            <div className="flex items-center gap-2 pl-3 pr-2 py-1 rounded-xl bg-slate-100 border border-slate-200/80 text-xs">
              <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-sky-400 to-emerald-400 p-[1px]">
                <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                  <Instagram className="w-3 h-3 text-slate-800" />
                </div>
              </div>
              <span className="font-bold text-slate-800">@{currentAccount.username}</span>
              <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                {currentAccount.daysUntilExpiration}d token
              </span>
            </div>
          ) : null}

          <Button
            variant="ghost"
            size="sm"
            onClick={api.auth.logout}
            className="rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 text-xs font-semibold"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Main Studio Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
        {activeTab === "reels" && (
          <div role="tabpanel" id="panel-reels" aria-labelledby="tab-reels" className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  Instagram Reels Studio
                </h1>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Published in the last 7–14 days. Click any reel to configure instant 3-button DM automation.
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={loadReels}
                disabled={isLoadingReels}
                className="rounded-xl font-bold text-xs border-slate-200 hover:bg-slate-100 self-start sm:self-auto min-h-[40px] px-4"
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoadingReels ? "animate-spin" : ""}`} />
                Sync Reels
              </Button>
            </div>

            {reelsError && (
              <div role="alert" className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="font-medium">{reelsError}</span>
              </div>
            )}

            <ReelsGrid
              reels={reels}
              isLoading={isLoadingReels}
              onSelectReel={handleSelectReelToAutomate}
            />
          </div>
        )}

        {activeTab === "editor" && (
          <div role="tabpanel" id="panel-editor" aria-labelledby="tab-editor">
            {selectedReel ? (
              <AutomationEditor
                reel={selectedReel}
                accountId={selectedAccountId}
                onSave={handleSaveAutomation}
                onCancel={() => setActiveTab("reels")}
              />
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-8 sm:p-12 text-center max-w-md mx-auto my-8 sm:my-12 shadow-sm">
                <div className="w-12 h-12 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-sky-100">
                  <Play className="w-6 h-6 ml-0.5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Select a Reel to Automate</h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1 mb-6 leading-relaxed">
                  Pick any active reel from your feed to set up comment keywords, Spintax replies, and 3-button Generic Template cards.
                </p>
                <Button
                  onClick={() => setActiveTab("reels")}
                  className="rounded-xl font-bold bg-sky-600 hover:bg-sky-500 text-white min-h-[44px] px-6 shadow-sm shadow-sky-600/20"
                >
                  Browse Recent Reels
                </Button>
              </div>
            )}
          </div>
        )}

        {activeTab === "leads" && (
          <div role="tabpanel" id="panel-leads" aria-labelledby="tab-leads" className="space-y-6">
            {leadsError && (
              <div role="alert" className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="font-medium">{leadsError}</span>
              </div>
            )}
            <LeadsTable
              leads={leads}
              total={leadsTotal}
              isLoading={isLoadingLeads}
              onSearch={loadLeads}
              onExportCsv={() => api.leads.downloadCsv(selectedAccountId, currentAccount?.username)}
            />
          </div>
        )}

        {activeTab === "analytics" && (
          <div role="tabpanel" id="panel-analytics" aria-labelledby="tab-analytics" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  System Telemetry & Health
                </h1>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Edge diagnostics, anti-spam jitter metrics, and follower conversion rates.
                </p>
              </div>
            </div>

            <AnalyticsCards telemetry={telemetry} />
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation Bar (High Touch-Target: 44px min for Mobile Creators) */}
      <nav
        role="tablist"
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-slate-200/90 px-2 py-2 flex items-center justify-around shadow-lg shadow-slate-900/5"
      >
        <button
          type="button"
          role="tab"
          id="mobile-tab-reels"
          aria-controls="panel-reels"
          aria-selected={activeTab === "reels"}
          tabIndex={activeTab === "reels" ? 0 : -1}
          onKeyDown={(e) => handleTabKeyDown(e, "reels")}
          onClick={() => setActiveTab("reels")}
          className={`flex flex-col items-center justify-center gap-1 min-h-[44px] min-w-[64px] rounded-xl transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
            activeTab === "reels"
              ? "text-sky-600 font-bold"
              : "text-slate-500 hover:text-slate-800 font-medium"
          }`}
        >
          <div
            className={`p-1.5 rounded-lg transition-colors ${
              activeTab === "reels" ? "bg-sky-50 text-sky-600" : ""
            }`}
          >
            <Play className="w-4 h-4" />
          </div>
          <span className="text-[10px] leading-none">Reels</span>
        </button>

        <button
          type="button"
          role="tab"
          id="mobile-tab-editor"
          aria-controls="panel-editor"
          aria-selected={activeTab === "editor"}
          tabIndex={activeTab === "editor" ? 0 : -1}
          onKeyDown={(e) => handleTabKeyDown(e, "editor")}
          onClick={() => setActiveTab("editor")}
          className={`flex flex-col items-center justify-center gap-1 min-h-[44px] min-w-[64px] rounded-xl transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
            activeTab === "editor"
              ? "text-sky-600 font-bold"
              : "text-slate-500 hover:text-slate-800 font-medium"
          }`}
        >
          <div
            className={`p-1.5 rounded-lg transition-colors ${
              activeTab === "editor" ? "bg-sky-50 text-sky-600" : ""
            }`}
          >
            <Sliders className="w-4 h-4" />
          </div>
          <span className="text-[10px] leading-none">Studio</span>
        </button>

        <button
          type="button"
          role="tab"
          id="mobile-tab-leads"
          aria-controls="panel-leads"
          aria-selected={activeTab === "leads"}
          tabIndex={activeTab === "leads" ? 0 : -1}
          onKeyDown={(e) => handleTabKeyDown(e, "leads")}
          onClick={() => setActiveTab("leads")}
          className={`flex flex-col items-center justify-center gap-1 min-h-[44px] min-w-[64px] rounded-xl transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
            activeTab === "leads"
              ? "text-emerald-600 font-bold"
              : "text-slate-500 hover:text-slate-800 font-medium"
          }`}
        >
          <div
            className={`p-1.5 rounded-lg transition-colors ${
              activeTab === "leads" ? "bg-emerald-50 text-emerald-600" : ""
            }`}
          >
            <Users className="w-4 h-4" />
          </div>
          <span className="text-[10px] leading-none">Leads</span>
        </button>

        <button
          type="button"
          role="tab"
          id="mobile-tab-analytics"
          aria-controls="panel-analytics"
          aria-selected={activeTab === "analytics"}
          tabIndex={activeTab === "analytics" ? 0 : -1}
          onKeyDown={(e) => handleTabKeyDown(e, "analytics")}
          onClick={() => setActiveTab("analytics")}
          className={`flex flex-col items-center justify-center gap-1 min-h-[44px] min-w-[64px] rounded-xl transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
            activeTab === "analytics"
              ? "text-sky-600 font-bold"
              : "text-slate-500 hover:text-slate-800 font-medium"
          }`}
        >
          <div
            className={`p-1.5 rounded-lg transition-colors ${
              activeTab === "analytics" ? "bg-sky-50 text-sky-600" : ""
            }`}
          >
            <BarChart3 className="w-4 h-4" />
          </div>
          <span className="text-[10px] leading-none">Telemetry</span>
        </button>
      </nav>
    </div>
  );
}
