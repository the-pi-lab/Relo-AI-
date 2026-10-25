"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  ChevronsUpDown,
  CircleUser,
  HelpCircle,
  Lock,
  LogOut,
  Menu,
  PanelLeftClose,
  Search,
  Settings,
  ShieldAlert,
  Sparkles,
  Sun,
  Moon,
  Monitor,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { ReloMark } from "../chrome";
import { LiquidBackdrop } from "../ambient";
import { useRelo } from "@/lib/relo/store";
import { TIER_META, planLabel } from "@/lib/relo/data";
import { AlertsBell } from "./alerts";
import { CommandPalette } from "./command-palette";
import { HelpDrawer } from "./help-drawer";
import { NAV_GROUPS, navItemFor, lockedBy, type NavItem } from "./nav-config";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const SIDEBAR_KEY = "relo-sidebar-collapsed";

/* ── Sidebar row ─────────────────────────────────────────────────────────── */

function NavRow({
  item,
  active,
  locked,
  collapsed,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  locked: boolean;
  collapsed: boolean;
  onClick: () => void;
}) {
  const Icon = item.icon;
  const soon = item.status === "soon";

  return (
    <button
      type="button"
      onClick={onClick}
      data-active={active}
      aria-current={active ? "page" : undefined}
      aria-disabled={locked || soon}
      title={collapsed ? item.label : undefined}
      className={cn(
        "nav-item",
        (locked || soon) && "cursor-not-allowed opacity-55",
        collapsed && "justify-center px-0 py-2.5"
      )}
    >
      <Icon
        className={cn(
          "size-[17px] shrink-0",
          active ? "text-signal" : "text-ink-3",
          collapsed && "size-[18px]"
        )}
        strokeWidth={1.85}
        aria-hidden
      />

      {!collapsed && (
        <>
          <span className="truncate">{item.label}</span>
          {locked && (
            <Lock
              className="ml-auto size-3 shrink-0 text-ink-3"
              aria-label="Needs a higher plan"
            />
          )}
          {soon && (
            <span className="ml-auto shrink-0 rounded-full bg-surface-2 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-ink-3">
              Soon
            </span>
          )}
        </>
      )}
    </button>
  );
}

/* ── Upgrade card ────────────────────────────────────────────────────────── */

function UpgradeCard({
  plan,
  go,
  collapsed,
}: {
  plan: "free" | "pro" | "studio";
  go: (view: string) => void;
  collapsed: boolean;
}) {
  if (plan === "studio") return null;

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={() => go("settings")}
        aria-label="Upgrade plan"
        title="Upgrade plan"
        className="mx-auto grid size-9 place-items-center rounded-lg badge-grad text-white shadow-[var(--sh-2)] transition-transform hover:-translate-y-0.5"
      >
        <Sparkles className="size-4" aria-hidden />
      </button>
    );
  }

  const target = plan === "free" ? "Pro" : "Studio";

  return (
    <div className="relative overflow-hidden rounded-2xl border border-line bg-surface p-3.5 shadow-[var(--sh-1)]">
      <span
        aria-hidden
        className="pointer-events-none absolute -right-6 -top-8 size-24 rounded-full opacity-25 blur-2xl"
        style={{ background: "var(--signal-bright)" }}
      />
      <span className="badge-grad inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.08em]">
        <Sparkles className="size-2.5" aria-hidden />
        {plan === "free" ? "Special offer" : "Next tier"}
      </span>
      <p className="mt-2 text-[12.5px] font-bold leading-snug text-ink">
        {plan === "free" ? "Unlock unlimited replies" : "Unlock the flow canvas"}
      </p>
      <p className="mt-0.5 text-[11px] leading-snug text-ink-3">
        {plan === "free"
          ? "Unlimited reels, campaigns and products."
          : "Three accounts, node builder, 5,000 credits."}
      </p>
      <button
        type="button"
        onClick={() => go("settings")}
        className="obsidian mt-2.5 h-8 w-full text-[11.5px]"
      >
        Upgrade to {target}
      </button>
    </div>
  );
}

/* ── Sidebar ─────────────────────────────────────────────────────────────── */

function Sidebar({
  view,
  go,
  collapsed,
  onToggleCollapse,
  mobile,
}: {
  view: string;
  go: (view: string) => void;
  collapsed: boolean;
  onToggleCollapse?: () => void;
  mobile?: boolean;
}) {
  const { plan, limits, credits } = useRelo();
  const tier = TIER_META[plan];
  const creditsPct = limits.credits > 0 ? Math.min(100, (credits / limits.credits) * 100) : 0;

  return (
    <div className="flex h-full flex-col border-r border-line bg-surface/85 backdrop-blur-2xl">
      <div
        className={cn(
          "flex h-16 shrink-0 items-center border-b border-line",
          collapsed ? "justify-center px-2" : "justify-between px-4"
        )}
      >
        <button
          type="button"
          onClick={() => go("home")}
          aria-label="RELO, dashboard"
          className="inline-flex items-center gap-2.5 rounded-md"
        >
          <span className="flex h-7 shrink-0 items-center justify-center">
            <ReloMark className="h-7 w-auto" />
          </span>
          {!collapsed && (
            <span className="text-[17px] font-extrabold tracking-[-0.045em] text-ink">
              RELO<span className="text-signal">.</span>
            </span>
          )}
        </button>

        {!collapsed && onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label="Collapse sidebar"
            className="grid size-7 place-items-center rounded-md text-ink-3 transition-colors hover:bg-surface-2 hover:text-ink"
          >
            <PanelLeftClose className="size-4" aria-hidden />
          </button>
        )}
      </div>

      <nav
        aria-label="Studio"
        className={cn(
          "flex-1 overflow-y-auto overscroll-contain py-3",
          collapsed ? "space-y-1.5 px-2" : "space-y-4 px-3"
        )}
      >
        {collapsed && onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label="Expand sidebar"
            className="mx-auto mb-1 grid size-8 place-items-center rounded-md text-ink-3 transition-colors hover:bg-surface-2 hover:text-ink"
          >
            <ChevronsRight className="size-4" aria-hidden />
          </button>
        )}

        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            {!collapsed ? (
              <p className="px-2.5 pb-1.5 text-[10px] font-bold uppercase tracking-[0.11em] text-ink-3">
                {group.label}
              </p>
            ) : (
              <div className="mx-auto mb-1.5 h-px w-6 bg-line" aria-hidden />
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavRow
                  key={`${group.label}:${item.label}`}
                  item={item}
                  active={view === item.view && !item.status}
                  locked={lockedBy(item, limits)}
                  collapsed={collapsed}
                  onClick={() => {
                    if (item.status === "soon" || lockedBy(item, limits)) return;
                    go(item.view);
                  }}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className={cn("shrink-0 space-y-2 border-t border-line p-3", collapsed && "px-2")}>
        {!collapsed && (
          <div className="rounded-xl bg-surface-2/70 px-3 py-2">
            <div className="flex items-baseline justify-between">
              <span className="text-[11px] font-semibold text-ink-2">{tier.name} plan</span>
              <span className="font-mono text-[10px] text-ink-3">{tier.price}</span>
            </div>
            <div className="mt-1.5 flex items-center gap-2">
              <div className="quota-track h-1.5 flex-1">
                <div className="quota-fill" style={{ width: `${creditsPct}%` }} />
              </div>
              <span className="font-mono text-[9.5px] tabular-nums text-ink-3">
                {credits}/{limits.credits}
              </span>
            </div>
          </div>
        )}

        <UpgradeCard plan={plan} go={go} collapsed={collapsed} />

        {!mobile && (
          <button
            type="button"
            onClick={() => go("settings")}
            title={collapsed ? "Settings" : undefined}
            className={cn(
              "nav-item",
              view === "settings" && "bg-surface-2 text-ink",
              collapsed && "justify-center px-0 py-2.5"
            )}
          >
            <Settings
              className={cn("size-[17px] shrink-0", collapsed ? "text-ink-3" : "text-ink-3")}
              strokeWidth={1.85}
              aria-hidden
            />
            {!collapsed && <span>Workspace settings</span>}
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Workspace switcher (header) ─────────────────────────────────────────── */

function WorkspaceSwitcher({ go }: { go: (view: string) => void }) {
  const { accounts, account, selectAccount, plan } = useRelo();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="group inline-flex max-w-[260px] items-center gap-2 rounded-xl border border-transparent px-1.5 py-1 transition-colors hover:border-line hover:bg-surface-2/60"
        >
          {account?.profilePictureUrl ? (
            <img
              src={account.profilePictureUrl}
              alt=""
              className="size-7 rounded-lg object-cover"
            />
          ) : (
            <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-brand text-[11px] font-bold text-brand-ink">
              R
            </span>
          )}

          <span className="hidden min-w-0 flex-col items-start leading-tight sm:flex">
            <span className="max-w-[150px] truncate text-[12.5px] font-bold text-ink">
              {account ? `@${account.username}` : "RELO AI"}
            </span>
            <span className="text-[10px] font-medium text-ink-3">
              {planLabel(plan)} workspace
            </span>
          </span>

          <ChevronsUpDown className="size-3.5 shrink-0 text-ink-3" aria-hidden />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-[272px]">
        <DropdownMenuLabel className="text-[10.5px] font-bold uppercase tracking-[0.11em] text-ink-3">
          Workspaces
        </DropdownMenuLabel>

        {accounts.length === 0 ? (
          <div className="px-2.5 pb-2 pt-1">
            <p className="text-[12px] leading-relaxed text-ink-3">
              No Instagram account connected yet.
            </p>
          </div>
        ) : (
          accounts.map((item) => (
            <DropdownMenuItem
              key={item.id}
              onSelect={() => selectAccount(item.id)}
              className="gap-2.5"
            >
              <span
                className={cn(
                  "grid size-7 shrink-0 place-items-center rounded-lg text-[11px] font-bold",
                  item.id === account?.id
                    ? "bg-brand text-brand-ink"
                    : "bg-surface-2 text-ink-2"
                )}
              >
                {item.username.slice(0, 1).toUpperCase()}
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-[12.5px] font-semibold text-ink">
                  @{item.username}
                </span>
                <span className="text-[10.5px] text-ink-3">
                  {planLabel(item.plan)} · {item.aiCreditsRemaining} credits
                </span>
              </span>
              {item.id === account?.id && (
                <span className="ml-auto size-1.5 rounded-full bg-signal" aria-hidden />
              )}
            </DropdownMenuItem>
          ))
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => go("settings")} className="gap-2 text-[12.5px]">
          <CircleUser className="size-3.5" aria-hidden />
          {accounts.length === 0 ? "Connect Instagram" : "Manage accounts"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}


/* ── Shell ───────────────────────────────────────────────────────────────── */

export function StudioShell({
  view,
  go,
  onRefresh,
  children,
}: {
  view: string;
  go: (view: string) => void;
  onRefresh?: () => void;
  children: React.ReactNode;
}) {
  const { user, plan, signOut, accounts, account } = useRelo();
  const [collapsed, setCollapsed] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [palette, setPalette] = useState(false);
  const [help, setHelp] = useState(false);

  /* Read the stored preference after mount: rendering it on the server would
     produce a collapsed rail for everyone and then flip on hydration. */
  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(SIDEBAR_KEY) === "1");
    } catch {
      /* private mode — keep the default */
    }
  }, []);

  const toggleCollapse = useCallback(() => {
    setCollapsed((next) => {
      try {
        localStorage.setItem(SIDEBAR_KEY, next ? "0" : "1");
      } catch {
        /* ignore */
      }
      return !next;
    });
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [view]);

  /* ⌘K / Ctrl-K and "/" open the palette. Registered once, at the shell. */
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPalette((open) => !open);
        return;
      }
      if (event.key === "/" && !typing && !palette) {
        event.preventDefault();
        setPalette(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [palette]);

  useEffect(() => {
    if (!drawer) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDrawer(false);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [drawer]);

  const current = useMemo(() => navItemFor(view), [view]);
  const initial = (user?.email?.[0] ?? "R").toUpperCase();
  const expiring = Boolean(account && account.daysUntilExpiration <= 7);

  return (
    <div className="relative isolate min-h-screen">
      <LiquidBackdrop variant="studio" />

      {/* Desktop rail */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-20 hidden transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] lg:block",
          collapsed ? "w-[72px]" : "w-[260px]"
        )}
      >
        <Sidebar
          view={view}
          go={go}
          collapsed={collapsed}
          onToggleCollapse={toggleCollapse}
        />
      </aside>

      {/* Mobile drawer */}
      {drawer && (
        <div className="lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setDrawer(false)}
            className="fixed inset-0 z-30 bg-overlay backdrop-blur-sm"
          />
          <aside className="fixed inset-y-0 left-0 z-40 w-[272px]">
            <Sidebar
              view={view}
              go={(next) => {
                go(next);
                setDrawer(false);
              }}
              collapsed={false}
              mobile
            />
            <button
              type="button"
              onClick={() => setDrawer(false)}
              aria-label="Close menu"
              className="absolute right-3 top-4 grid size-8 place-items-center rounded-lg text-ink-3 hover:bg-surface-2 hover:text-ink"
            >
              <X className="size-4" aria-hidden />
            </button>
          </aside>
        </div>
      )}

      <div
        className={cn(
          "relative z-10 transition-[padding] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          collapsed ? "lg:pl-[72px]" : "lg:pl-[260px]"
        )}
      >
        <header className="sticky top-0 z-30 border-b border-line bg-canvas/80 backdrop-blur-2xl">
          <div className="flex h-16 items-center gap-2 px-3 sm:gap-3 sm:px-5 lg:px-7">
            <button
              type="button"
              onClick={() => setDrawer(true)}
              aria-label="Open menu"
              className="grid size-9 shrink-0 place-items-center rounded-lg border border-line bg-surface/70 text-ink-2 transition-colors hover:text-ink lg:hidden"
            >
              <Menu className="size-4" aria-hidden />
            </button>

            {accounts.length === 0 ? (
              <button
                type="button"
                onClick={() => go("settings")}
                className="inline-flex items-center gap-2 rounded-xl border border-warn/30 bg-warn-wash px-3 py-1.5 text-[12px] font-semibold text-warn"
              >
                <ShieldAlert className="size-3.5" aria-hidden />
                Connect Instagram
              </button>
            ) : (
              <WorkspaceSwitcher go={go} />
            )}

            <span className="hidden h-5 w-px bg-line md:block" aria-hidden />

            {/* Breadcrumb / current view */}
            <nav aria-label="Breadcrumb" className="hidden items-center gap-1.5 md:flex">
              <button
                type="button"
                onClick={() => go("home")}
                className="rounded px-1 py-0.5 text-[12.5px] font-medium text-ink-3 transition-colors hover:text-ink"
              >
                Home
              </button>
              {view !== "home" && current && (
                <>
                  <ChevronDown className="size-3 -rotate-90 text-ink-3/60" aria-hidden />
                  <span className="px-1 text-[12.5px] font-semibold text-ink">
                    {current.label}
                  </span>
                </>
              )}
            </nav>

            {expiring && (
              <button
                type="button"
                onClick={() => go("settings")}
                title={`Instagram token expires in ${Math.max(0, account?.daysUntilExpiration ?? 0)} day(s)`}
                className="ml-1 hidden items-center gap-1.5 rounded-full border border-warn/30 bg-warn-wash px-2.5 py-1 text-[11px] font-semibold text-warn lg:inline-flex"
              >
                <ShieldAlert className="size-3.5" aria-hidden />
                Reconnect in {Math.max(0, account?.daysUntilExpiration ?? 0)}d
              </button>
            )}

            <div className="ml-auto flex items-center gap-1 sm:gap-1.5">
              {/* Search / palette trigger */}
              <button
                type="button"
                onClick={() => setPalette(true)}
                className="hidden h-9 items-center gap-2 rounded-xl border border-line bg-surface/70 px-2.5 text-[12.5px] font-medium text-ink-3 transition-colors hover:border-line-strong hover:text-ink sm:inline-flex"
              >
                <Search className="size-3.5" aria-hidden />
                <span className="hidden lg:inline">Search</span>
                <kbd className="ml-1 hidden rounded border border-line bg-surface-2 px-1.5 py-0.5 font-mono text-[9.5px] font-semibold lg:inline">
                  ⌘K
                </kbd>
              </button>

              <button
                type="button"
                onClick={() => setPalette(true)}
                aria-label="Search"
                className="grid size-9 place-items-center rounded-lg text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink sm:hidden"
              >
                <Search className="size-[18px]" strokeWidth={1.8} aria-hidden />
              </button>

              <button
                type="button"
                onClick={() => setHelp(true)}
                aria-label="Help and documentation"
                title="Help"
                className="hidden size-9 place-items-center rounded-lg text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink sm:grid"
              >
                <HelpCircle className="size-[18px]" strokeWidth={1.8} aria-hidden />
              </button>

              <AlertsBell go={go} />

              <span className="mx-0.5 h-5 w-px bg-line" aria-hidden />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    aria-label="Account menu"
                    className="grid size-9 place-items-center rounded-full border border-line bg-brand text-[11.5px] font-bold text-brand-ink transition-transform hover:-translate-y-0.5"
                  >
                    {initial}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[248px]">
                  <DropdownMenuLabel className="flex flex-col gap-0.5">
                    <span className="truncate text-[12.5px] font-semibold text-ink">
                      {user?.email ?? "Signed in"}
                    </span>
                    <span className="text-[10.5px] text-ink-3">
                      {TIER_META[plan].name} · {TIER_META[plan].price}
                    </span>
                  </DropdownMenuLabel>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem onSelect={() => go("settings")} className="gap-2 text-[12.5px]">
                    <Settings className="size-3.5" aria-hidden />
                    Workspace settings
                  </DropdownMenuItem>
                  {onRefresh && (
                    <DropdownMenuItem
                      onSelect={() => void onRefresh()}
                      className="gap-2 text-[12.5px]"
                    >
                      <ChevronsLeft className="size-3.5" aria-hidden />
                      Refresh data
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onSelect={() => setHelp(true)} className="gap-2 text-[12.5px]">
                    <HelpCircle className="size-3.5" aria-hidden />
                    Help centre
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={() => {
                      signOut();
                      window.location.hash = "#/";
                    }}
                    className="gap-2 text-[12.5px] text-bad focus:text-bad"
                  >
                    <LogOut className="size-3.5" aria-hidden />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <main className="mx-auto min-h-[calc(100vh-4rem)] w-full max-w-[1320px] px-4 py-6 sm:px-6 sm:py-7 lg:px-8 lg:py-8">
          <div key={view} className="view-enter">
            {children}
          </div>
        </main>
      </div>

      <CommandPalette
        open={palette}
        onClose={() => setPalette(false)}
        go={go}
        onOpenHelp={() => setHelp(true)}
      />

      <HelpDrawer open={help} onClose={() => setHelp(false)} go={go} />
    </div>
  );
}
