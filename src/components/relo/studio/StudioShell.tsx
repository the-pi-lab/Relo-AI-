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
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "../chrome";
import { LiquidBackdrop } from "../ambient";
import { ThemeToggle } from "@/lib/relo/theme";
import { Meter } from "./studio-ui";
import { useRelo } from "@/lib/relo/store";
import { TIER_CREDIT_LIMITS, TIER_META } from "@/lib/relo/data";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/* ==========================================================================
   Studio shell.

   The shell owns the sidebar, the global top bar and the responsive drawer.
   It deliberately does NOT print the page title: each view renders its own
   header, which is what stops every screen announcing its name twice.
   ========================================================================== */

interface NavItem {
  view: string;
  label: string;
  icon: LucideIcon;
}

const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: "Overview",
    items: [
      { view: "home", label: "Home", icon: LayoutDashboard },
      { view: "insights", label: "Insights", icon: TrendingUp },
    ],
  },
  {
    label: "Automate",
    items: [
      { view: "automations", label: "Automations", icon: Workflow },
      { view: "canvas", label: "Canvas", icon: GitBranch },
      { view: "content", label: "Content", icon: CalendarDays },
    ],
  },
  {
    label: "Audience",
    items: [
      { view: "leads", label: "Leads", icon: Users },
      { view: "campaigns", label: "Campaigns", icon: Send },
    ],
  },
  {
    label: "Storefront",
    items: [
      { view: "products", label: "Products", icon: Package },
      { view: "bio", label: "Link in bio", icon: Globe },
    ],
  },
  {
    label: "Account",
    items: [{ view: "settings", label: "Settings", icon: Settings }],
  },
];

/* Plan gating, kept in one place so the sidebar and the views agree. */
function isLocked(view: string, plan: string) {
  if (plan === "free") {
    return ["campaigns", "products", "bio", "content"].includes(view);
  }
  if (plan === "pro") {
    return view === "canvas";
  }
  return false;
}

/* ── Nav item ───────────────────────────────────────────────────────────── */

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
  const Icon = item.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={locked}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-[13.5px] transition-all duration-200 ease-out",
        active
          ? "border-line/60 bg-surface-2/75 font-semibold text-ink shadow-[inset_0_1px_0_rgb(255_255_255/0.05)] dark:bg-white/[0.055]"
          : locked
            ? "cursor-not-allowed border-transparent font-medium text-ink-3"
            : "border-transparent font-medium text-ink-2 hover:border-line/50 hover:bg-surface-2/55 hover:text-ink dark:hover:bg-white/[0.035]"
      )}
    >
      <span
        aria-hidden
        className={cn(
          "absolute -left-2.5 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-full bg-gradient-to-b from-signal to-brand-line transition-opacity duration-200",
          active ? "opacity-100" : "opacity-0"
        )}
      />
      <Icon
        className={cn(
          "size-4 shrink-0 transition-colors",
          active ? "text-signal" : "text-ink-3 group-hover:text-ink-2"
        )}
        strokeWidth={1.75}
        aria-hidden
      />
      <span className="truncate">{item.label}</span>
      {locked && <Lock className="ml-auto size-3.5 shrink-0 text-ink-3" aria-hidden />}
    </button>
  );
}

/* ── Sidebar ────────────────────────────────────────────────────────────── */

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
  const limit = TIER_CREDIT_LIMITS[plan];
  const pct = limit > 0 ? Math.round((aiCredits / limit) * 100) : 0;
  const tier = TIER_META[plan];

  return (
    <div className="relative flex h-full flex-col bg-surface/70 backdrop-blur-2xl dark:bg-surface-2/70">
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-line/55 px-5">
        <Logo onClick={() => go("home")} />
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="grid size-8 place-items-center rounded-lg text-ink-3 transition-colors hover:bg-surface-2/70 hover:text-ink"
          >
            <X className="size-4" aria-hidden />
          </button>
        )}
      </div>

      {user?.isDemo && (
        <div className="glass-chip mx-3 mb-3 mt-3 flex items-start gap-2.5 rounded-xl px-3 py-2.5">
          <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-signal shadow-[0_0_10px_var(--signal)]" aria-hidden />
          <p className="text-[12px] leading-snug text-ink-2">
            <span className="font-semibold text-ink">Demo workspace.</span> Every
            screen is populated. Nothing you do here is saved to a real account.
          </p>
        </div>
      )}

      <nav aria-label="Studio" className="flex-1 overflow-y-auto px-5 pb-4 pt-2">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-5">
            <p className="caption mb-2 px-1">{group.label}</p>
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

      <div className="shrink-0 border-t border-line/55 p-3">
        <div className="mb-2.5 flex items-center justify-between rounded-xl border border-line/50 bg-surface-2/35 px-3 py-2 backdrop-blur-md lg:hidden">
          <span className="text-[12px] font-medium text-ink-3">Theme</span>
          <ThemeToggle />
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-line/60 bg-gradient-to-br from-surface-2/80 to-surface/45 p-4 backdrop-blur-xl">
          <span
            aria-hidden
            className="pointer-events-none absolute -right-10 -top-12 size-32 rounded-full bg-[radial-gradient(circle,var(--glow-3),transparent_68%)] opacity-80"
          />
          <div className="relative flex items-baseline justify-between gap-2">
            <p className="text-[13px] font-semibold text-ink">{tier.name} plan</p>
            <span className="caption">{tier.price}</span>
          </div>
          <p className="relative mt-1.5 text-[12px] leading-snug text-ink-3">
            {tier.blurb}
          </p>

          <div className="relative mt-3.5 flex items-baseline justify-between text-[12px]">
            <span className="text-ink-3">AI credits</span>
            <span className="font-mono font-semibold text-ink tnum">
              {aiCredits} / {limit}
            </span>
          </div>
          <div className="relative mt-2">
            <Meter pct={pct} tone={pct < 20 ? "warn" : "signal"} label="AI credits used" />
          </div>

          <button
            type="button"
            onClick={() => {
              go("settings");
              onClose?.();
            }}
            className="relative mt-4 w-full rounded-xl bg-signal py-2 text-[12.5px] font-semibold text-signal-ink shadow-[0_10px_30px_-16px_var(--signal)] transition-all duration-150 ease-out hover:bg-signal-hover active:translate-y-px"
          >
            {plan === "studio" ? "Manage plan" : "Upgrade plan"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Top bar ────────────────────────────────────────────────────────────── */

function TopBar({ onMenu, onHome }: { onMenu: () => void; onHome: () => void }) {
  const { plan, aiCredits, user, signOut } = useRelo();
  const limit = TIER_CREDIT_LIMITS[plan];
  const pct = limit > 0 ? Math.round((aiCredits / limit) * 100) : 0;
  const who = user?.isDemo ? "Demo guest" : user?.email ?? "Account";
  const initial = (user?.email?.[0] ?? "R").toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line/60 bg-canvas/65 px-4 backdrop-blur-2xl sm:px-6 lg:px-8">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-signal/25 to-transparent"
      />
      <button
        type="button"
        onClick={onMenu}
        aria-label="Open menu"
        className="grid size-9 shrink-0 place-items-center rounded-xl border border-line/70 bg-surface/45 text-ink-2 backdrop-blur-md transition-colors hover:text-ink lg:hidden"
      >
        <Menu className="size-4" aria-hidden />
      </button>
      <Logo onClick={onHome} className="lg:hidden" />

      <div className="hidden items-center gap-2 lg:flex">
        <span className="glass-chip inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[12px] font-medium text-ink-2">
          <span className="size-1.5 rounded-full bg-ok shadow-[0_0_8px_var(--ok)]" aria-hidden />
          Instagram connected
        </span>
      </div>

      <div className="ml-auto flex items-center gap-2.5">
        <div className="glass-chip hidden items-center gap-3 rounded-full py-1 pl-3 pr-2.5 md:flex">
          <span className="font-mono text-[12px] text-ink-2 tnum">
            {aiCredits} credits
          </span>
          <span className="w-14">
            <Meter pct={pct} tone={pct < 20 ? "warn" : "signal"} label="AI credits used" />
          </span>
        </div>

        <ThemeToggle className="hidden sm:inline-flex" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Account menu"
              className="glass-chip grid size-9 shrink-0 place-items-center rounded-full text-[13px] font-bold text-ink transition-colors duration-150 hover:border-line-strong"
            >
              {initial}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuLabel className="flex flex-col gap-0.5">
              <span className="text-[13px] font-semibold text-ink">{who}</span>
              <span className="caption">{TIER_META[plan].name} plan</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={signOut} className="gap-2.5">
              <LogOut className="size-4" strokeWidth={1.75} aria-hidden />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

/* ── Shell ──────────────────────────────────────────────────────────────── */

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

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [view]);

  useEffect(() => {
    if (!drawer) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawer(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawer]);

  return (
    <div className="relative isolate min-h-screen bg-canvas">
      <LiquidBackdrop variant="studio" />

      <aside className="fixed inset-y-0 left-0 z-20 hidden w-[248px] border-r border-line/60 lg:block">
        <Sidebar view={view} go={go} />
      </aside>

      {drawer && (
        <div className="lg:hidden">
          <div
            onClick={() => setDrawer(false)}
            className="fixed inset-0 z-30 bg-overlay backdrop-blur-sm"
            aria-hidden
          />
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Studio menu"
            className="fixed inset-y-0 left-0 z-40 w-[272px] border-r border-line/70 shadow-[0_30px_90px_-30px_rgb(0_0_0/0.8)]"
          >
            <Sidebar view={view} go={go} onClose={() => setDrawer(false)} />
          </aside>
        </div>
      )}

      <div className="relative z-10 lg:pl-[248px]">
        <TopBar onMenu={() => setDrawer(true)} onHome={() => go("home")} />
        <div className="mx-auto min-h-[calc(100vh-4rem)] max-w-[1320px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div key={view} className="view-enter">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
