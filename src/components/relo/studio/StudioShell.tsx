"use client";

import React, { useEffect, useState } from "react";
import {
  CalendarDays,
  GitBranch,
  Globe,
  LayoutDashboard,
  LogOut,
  Lock,
  Menu,
  Package,
  Send,
  Settings,
  TrendingUp,
  Users,
  Workflow,
  X,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "../chrome";
import { FlowingGradientsCanvas } from "../FlowingGradientsCanvas";
import { LightDarkToggle } from "../LightDarkToggle";
import { Meter } from "./studio-ui";
import { useRelo } from "@/lib/relo/store";
import { useTheme } from "@/lib/relo/theme";
import { TIER_CREDIT_LIMITS, TIER_META } from "@/lib/relo/data";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavItem {
  view: string;
  label: string;
  icon: LucideIcon;
}

const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: "Overview",
    items: [
      { view: "home", label: "Dashboard", icon: LayoutDashboard },
      { view: "insights", label: "Analytics", icon: TrendingUp },
    ],
  },
  {
    label: "Automate",
    items: [
      { view: "automations", label: "Reels & Keywords", icon: Workflow },
      { view: "canvas", label: "Visual Flow", icon: GitBranch },
      { view: "content", label: "Planner", icon: CalendarDays },
    ],
  },
  {
    label: "Audience",
    items: [
      { view: "leads", label: "Captured Leads", icon: Users },
      { view: "campaigns", label: "Broadcasts", icon: Send },
    ],
  },
  {
    label: "Storefront",
    items: [
      { view: "products", label: "Offers & Links", icon: Package },
      { view: "bio", label: "Bio Page", icon: Globe },
    ],
  },
  {
    label: "Account",
    items: [{ view: "settings", label: "Settings", icon: Settings }],
  },
];

function isLocked(view: string, plan: string) {
  if (plan === "free") {
    return ["campaigns", "products", "bio", "content"].includes(view);
  }
  if (plan === "pro") {
    return view === "canvas";
  }
  return false;
}

function NavRow({
  item,
  active,
  locked,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  locked: boolean;
  onClick: () => void;
}) {
  const { isDark } = useTheme();
  const Icon = item.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={locked}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex w-full items-center gap-2.5 rounded-xl border px-3 py-2 text-xs font-medium transition-all duration-200",
        active
          ? isDark
            ? "border-cyan-400/30 bg-cyan-500/15 text-cyan-300 font-semibold shadow-lg shadow-black/40"
            : "border-cyan-500/40 bg-cyan-500/15 text-cyan-900 font-bold shadow-md shadow-cyan-500/10"
          : locked
            ? isDark
              ? "cursor-not-allowed border-transparent text-white/30"
              : "cursor-not-allowed border-transparent text-zinc-400"
            : isDark
              ? "border-transparent text-white/65 hover:border-white/8 hover:bg-white/5 hover:text-white"
              : "border-transparent text-zinc-600 hover:border-black/5 hover:bg-black/5 hover:text-zinc-900"
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "absolute -left-2.5 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-full bg-cyan-400 shadow-[0_0_8px_#00e5ff] transition-opacity duration-200",
          active ? "opacity-100" : "opacity-0"
        )}
      />
      <Icon
        className={cn(
          "size-4 shrink-0 transition-colors",
          active ? (isDark ? "text-cyan-400" : "text-cyan-600") : undefined
        )}
        strokeWidth={1.8}
        aria-hidden="true"
      />
      <span className="truncate">{item.label}</span>
      {locked && (
        <Lock
          className={cn("ml-auto size-3 shrink-0", isDark ? "text-white/30" : "text-zinc-400")}
          aria-hidden="true"
        />
      )}
    </button>
  );
}

function Sidebar({
  view,
  go,
  onClose,
}: {
  view: string;
  go: (v: string) => void;
  onClose?: () => void;
}) {
  const { plan, aiCredits, user } = useRelo();
  const { isDark } = useTheme();
  const limit = TIER_CREDIT_LIMITS[plan];
  const pct = limit > 0 ? Math.round((aiCredits / limit) * 100) : 0;
  const tier = TIER_META[plan];

  return (
    <div
      className={cn(
        "relative flex h-full flex-col border-r backdrop-blur-2xl transition-colors duration-300",
        isDark
          ? "border-white/8 bg-black/60"
          : "border-black/8 bg-white/75 shadow-xl shadow-zinc-200/50"
      )}
    >
      <div
        className={cn(
          "flex h-16 shrink-0 items-center justify-between border-b px-5",
          isDark ? "border-white/8" : "border-black/8"
        )}
      >
        <div
          onClick={() => go("home")}
          className="flex items-center gap-2 cursor-pointer group"
        >
          <div className="size-7 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-xs text-white shadow-md shadow-cyan-500/20">
            R
          </div>
          <span className={cn("font-bold tracking-tight text-sm", isDark ? "text-white" : "text-zinc-900")}>
            RELO<span className="text-cyan-500">.AI</span>
          </span>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className={cn(
              "grid size-8 place-items-center rounded-lg transition-colors",
              isDark ? "text-white/50 hover:bg-white/10 hover:text-white" : "text-zinc-500 hover:bg-black/5 hover:text-zinc-900"
            )}
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {user?.isDemo && (
        <div
          className={cn(
            "mx-3 my-3 flex items-start gap-2 rounded-xl border p-2.5",
            isDark
              ? "border-white/8 bg-white/[0.03]"
              : "border-cyan-500/20 bg-cyan-50/50"
          )}
        >
          <span className="mt-1 size-1.5 shrink-0 rounded-full bg-cyan-400 animate-pulse" />
          <p className={cn("text-[11px] leading-snug", isDark ? "text-white/70" : "text-zinc-600")}>
            <strong className={isDark ? "text-white" : "text-zinc-900"}>Demo Workspace.</strong> Preloaded with active sample campaigns.
          </p>
        </div>
      )}

      <nav aria-label="Studio" className="flex-1 overflow-y-auto px-4 pb-4 pt-1 space-y-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p
              className={cn(
                "px-2 pb-1.5 text-[10px] font-mono uppercase tracking-widest",
                isDark ? "text-white/40" : "text-zinc-400"
              )}
            >
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavRow
                  key={item.view}
                  item={item}
                  active={view === item.view}
                  locked={isLocked(item.view, plan)}
                  onClick={() => {
                    go(item.view);
                    onClose?.();
                  }}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className={cn("shrink-0 border-t p-3.5", isDark ? "border-white/8" : "border-black/8")}>
        <div
          className={cn(
            "relative overflow-hidden rounded-2xl border p-3.5 transition-colors",
            isDark
              ? "border-white/10 bg-white/[0.03]"
              : "border-black/8 bg-black/[0.02]"
          )}
        >
          <div className="flex items-baseline justify-between text-xs">
            <span className={cn("font-semibold", isDark ? "text-white" : "text-zinc-900")}>
              {tier.name} Plan
            </span>
            <span className={cn("font-mono text-[10px]", isDark ? "text-white/50" : "text-zinc-500")}>
              {tier.price}
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between text-[11px] font-mono">
            <span className={isDark ? "text-white/50" : "text-zinc-500"}>Credits</span>
            <span className={cn("font-bold", isDark ? "text-white" : "text-zinc-900")}>
              {aiCredits} / {limit}
            </span>
          </div>
          <div className={cn("mt-1.5 h-1 w-full rounded-full overflow-hidden", isDark ? "bg-white/10" : "bg-black/10")}>
            <div
              className="h-full rounded-full bg-cyan-400 transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function TopBar({ onMenu, onHome }: { onMenu: () => void; onHome: () => void }) {
  const { plan, aiCredits, user, signOut } = useRelo();
  const { isDark } = useTheme();
  const who = user?.isDemo ? "Demo Creator" : user?.email ?? "Account";
  const initial = (user?.email?.[0] ?? "R").toUpperCase();

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-16 items-center gap-3 border-b px-4 backdrop-blur-2xl transition-colors duration-300 sm:px-6 lg:px-8",
        isDark
          ? "border-white/8 bg-black/40 text-white"
          : "border-black/8 bg-white/70 text-zinc-900 shadow-sm"
      )}
    >
      <button
        type="button"
        onClick={onMenu}
        aria-label="Open menu"
        className={cn(
          "grid size-9 shrink-0 place-items-center rounded-xl border lg:hidden transition-colors",
          isDark
            ? "border-white/10 bg-white/5 text-white/70 hover:text-white"
            : "border-black/10 bg-black/5 text-zinc-600 hover:text-zinc-900"
        )}
      >
        <Menu className="size-4" />
      </button>

      <div className="hidden items-center gap-2.5 lg:flex">
        <span
          className={cn(
            "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-mono font-medium",
            isDark
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
              : "border-emerald-600/25 bg-emerald-50 text-emerald-800"
          )}
        >
          <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Instagram Connected · @relo.studio
        </span>
      </div>

      <div className="ml-auto flex items-center gap-3">
        {/* Dark/Light Mode Toggle */}
        <LightDarkToggle />

        <div
          className={cn(
            "hidden sm:inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-xs",
            isDark
              ? "border-white/10 bg-white/5 text-white/80"
              : "border-black/10 bg-black/5 text-zinc-700"
          )}
        >
          <span>{aiCredits} credits</span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={cn(
                "grid size-9 shrink-0 place-items-center rounded-full border text-xs font-bold transition-all shadow-md",
                isDark
                  ? "border-white/15 bg-white/10 text-white hover:bg-white/20"
                  : "border-black/15 bg-zinc-800 text-white hover:bg-zinc-700"
              )}
            >
              {initial}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className={cn(
              "w-56 shadow-2xl backdrop-blur-xl",
              isDark
                ? "bg-black/90 border-white/12 text-white"
                : "bg-white/95 border-black/10 text-zinc-900"
            )}
          >
            <DropdownMenuLabel className="flex flex-col gap-0.5">
              <span className={cn("text-xs font-semibold", isDark ? "text-white" : "text-zinc-900")}>
                {who}
              </span>
              <span className={cn("text-[10px] font-mono", isDark ? "text-white/40" : "text-zinc-500")}>
                {TIER_META[plan].name} Plan
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className={isDark ? "bg-white/10" : "bg-black/10"} />
            <DropdownMenuItem onSelect={signOut} className="gap-2 text-xs text-rose-500 focus:text-rose-600">
              <LogOut className="size-3.5" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

export function StudioShell({
  view,
  go,
  children,
}: {
  view: string;
  go: (v: string) => void;
  children: React.ReactNode;
}) {
  const [drawer, setDrawer] = useState(false);
  const { isDark } = useTheme();

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [view]);

  return (
    <div
      className={cn(
        "relative isolate min-h-screen transition-colors duration-300",
        isDark ? "text-white" : "text-zinc-900"
      )}
    >
      {/* 60fps Live Tide Swirl Blue Flowing Gradient Background */}
      <FlowingGradientsCanvas variant="subtle" />

      <aside className="fixed inset-y-0 left-0 z-20 hidden w-[240px] lg:block">
        <Sidebar view={view} go={go} />
      </aside>

      {drawer && (
        <div className="lg:hidden">
          <div
            onClick={() => setDrawer(false)}
            className="fixed inset-0 z-30 bg-black/70 backdrop-blur-sm"
          />
          <aside className="fixed inset-y-0 left-0 z-40 w-[260px]">
            <Sidebar view={view} go={go} onClose={() => setDrawer(false)} />
          </aside>
        </div>
      )}

      <div className="relative z-10 lg:pl-[240px]">
        <TopBar onMenu={() => setDrawer(true)} onHome={() => go("home")} />
        <div className="mx-auto min-h-[calc(100vh-4rem)] max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div key={view} className="view-enter">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
