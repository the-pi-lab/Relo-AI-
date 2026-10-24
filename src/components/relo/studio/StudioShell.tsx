"use client";

import React, { useEffect, useState } from "react";
import {
  CalendarDays,
  ChevronsUpDown,
  GitBranch,
  Globe,
  LayoutDashboard,
  LogOut,
  Lock,
  Menu,
  Package,
  RefreshCw,
  Send,
  Settings,
  ShieldAlert,
  TrendingUp,
  Users,
  Workflow,
  X,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Logo } from "../chrome";
import { LiquidBackdrop } from "../ambient";
import { Meter } from "./studio-ui";
import { useRelo } from "@/lib/relo/store";
import { ThemeToggle } from "@/lib/relo/theme";
import { TIER_META, planLabel } from "@/lib/relo/data";
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
  requires?: "campaigns" | "products" | "canvas";
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
      { view: "automations", label: "Reels & keywords", icon: Workflow },
      { view: "canvas", label: "Flow canvas", icon: GitBranch, requires: "canvas" },
      { view: "content", label: "Planner", icon: CalendarDays, requires: "campaigns" },
    ],
  },
  {
    label: "Audience",
    items: [
      { view: "leads", label: "Captured leads", icon: Users },
      { view: "campaigns", label: "Broadcasts", icon: Send, requires: "campaigns" },
    ],
  },
  {
    label: "Storefront",
    items: [
      { view: "products", label: "Offers & links", icon: Package, requires: "products" },
      { view: "bio", label: "Bio page", icon: Globe, requires: "products" },
    ],
  },
  {
    label: "Account",
    items: [{ view: "settings", label: "Settings", icon: Settings }],
  },
];

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
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] transition-colors duration-150",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal",
        active
          ? "bg-signal-wash font-semibold text-ink"
          : "font-medium text-ink-2 hover:bg-surface-2/60 hover:text-ink"
      )}
    >
      <span
        aria-hidden
        className={cn(
          "absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-full bg-signal transition-opacity",
          active ? "opacity-100" : "opacity-0"
        )}
      />
      <Icon
        className={cn("size-4 shrink-0", active ? "text-signal" : "text-ink-3")}
        strokeWidth={1.8}
        aria-hidden
      />
      <span className="truncate">{item.label}</span>
      {locked && (
        <Lock className="ml-auto size-3 shrink-0 text-ink-3" aria-label="Needs a higher plan" />
      )}
    </button>
  );
}

function AccountSwitcher() {
  const { accounts, account, selectAccount, plan } = useRelo();

  if (!account) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-warn/30 bg-warn-wash px-3 py-1 text-[12px] font-semibold text-warn">
        <ShieldAlert className="size-3.5" aria-hidden />
        No Instagram connected
      </span>
    );
  }

  const expiring = account.daysUntilExpiration <= 7;

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="inline-flex max-w-[280px] items-center gap-2 rounded-full border border-line bg-surface/70 py-1 pl-1 pr-2.5 text-[12.5px] font-medium text-ink backdrop-blur-md transition-colors hover:border-line-strong hover:bg-surface"
          >
            {account.profilePictureUrl ? (
              <img
                src={account.profilePictureUrl}
                alt=""
                className="size-6 rounded-full object-cover"
              />
            ) : (
              <span className="grid size-6 place-items-center rounded-full bg-brand text-[10px] font-bold text-brand-ink">
                {account.username.slice(0, 1).toUpperCase()}
              </span>
            )}
            <span className="truncate">@{account.username}</span>
            <ChevronsUpDown className="size-3.5 shrink-0 text-ink-3" aria-hidden />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuLabel className="caption">
            Instagram accounts
          </DropdownMenuLabel>
          {accounts.map((item) => (
            <DropdownMenuItem
              key={item.id}
              onSelect={() => selectAccount(item.id)}
              className="gap-2.5"
            >
              <span className="grid size-6 place-items-center rounded-full bg-surface-2 text-[10px] font-bold text-ink-2">
                {item.username.slice(0, 1).toUpperCase()}
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-[12.5px] font-semibold text-ink">
                  @{item.username}
                </span>
                <span className="text-[11px] text-ink-3">
                  {planLabel(item.plan)} · {item.aiCreditsRemaining} credits
                </span>
              </span>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => {
              window.location.hash = "#/studio/settings";
            }}
            className="text-[12.5px]"
          >
            {plan === "studio" ? "Manage accounts" : "Connect another account"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {expiring && (
        <button
          type="button"
          onClick={() => {
            window.location.hash = "#/studio/settings";
          }}
          title={`This Page token expires in ${Math.max(0, account.daysUntilExpiration)} day(s)`}
          className="inline-flex items-center gap-1.5 rounded-full border border-warn/30 bg-warn-wash px-2.5 py-1 text-[11.5px] font-semibold text-warn"
        >
          <ShieldAlert className="size-3.5" aria-hidden />
          Reconnect in {Math.max(0, account.daysUntilExpiration)}d
        </button>
      )}
    </div>
  );
}

function Sidebar({
  view,
  go,
  limits,
}: {
  view: string;
  go: (view: string) => void;
  limits: ReturnType<typeof useRelo>["limits"];
}) {
  const { credits, plan } = useRelo();
  const tier = TIER_META[plan];
  const pct = limits.credits > 0 ? Math.round((credits / limits.credits) * 100) : 0;

  return (
    <div className="flex h-full flex-col border-r border-line bg-surface/55 backdrop-blur-2xl">
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-4">
        <Logo onClick={() => go("home")} />
      </div>

      <nav aria-label="Studio" className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="caption px-2.5 pb-1.5">{group.label}</p>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavRow
                  key={item.view}
                  item={item}
                  active={view === item.view}
                  locked={Boolean(item.requires && !limits[item.requires])}
                  onClick={() => go(item.view)}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t border-line p-3">
        <div className="rounded-xl border border-line bg-surface-2/40 p-3">
          <div className="flex items-baseline justify-between">
            <span className="text-[12.5px] font-semibold text-ink">{tier.name}</span>
            <span className="font-mono text-[10.5px] text-ink-3">{tier.price}</span>
          </div>
          <div className="mt-2 flex items-baseline justify-between font-mono text-[11px]">
            <span className="text-ink-3">AI credits</span>
            <span className="font-bold text-ink tnum">
              {credits} / {limits.credits}
            </span>
          </div>
          <div className="mt-1.5">
            <Meter pct={pct} label="AI credits remaining" />
          </div>
          {plan !== "studio" && (
            <button
              type="button"
              onClick={() => go("settings")}
              className="mt-2.5 w-full rounded-md border border-line-strong bg-surface px-2 py-1.5 text-[11.5px] font-semibold text-ink transition-colors hover:border-ink-3"
            >
              {plan === "free" ? "Compare plans" : "Upgrade to Studio"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

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
  const [drawer, setDrawer] = useState(false);
  const { user, limits, plan, signOut, accounts } = useRelo();

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [view]);

  useEffect(() => {
    if (!drawer) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDrawer(false);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [drawer]);

  const initial = (user?.email?.[0] ?? "R").toUpperCase();

  return (
    <div className="relative isolate min-h-screen">
      <LiquidBackdrop variant="studio" />

      <aside className="fixed inset-y-0 left-0 z-20 hidden w-[248px] lg:block">
        <Sidebar view={view} go={go} limits={limits} />
      </aside>

      {drawer && (
        <div className="lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setDrawer(false)}
            className="fixed inset-0 z-30 bg-overlay backdrop-blur-sm"
          />
          <aside className="fixed inset-y-0 left-0 z-40 w-[268px]">
            <Sidebar
              view={view}
              go={(next) => {
                go(next);
                setDrawer(false);
              }}
              limits={limits}
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

      <div className="relative z-10 lg:pl-[248px]">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-canvas/75 px-4 backdrop-blur-2xl sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => setDrawer(true)}
            aria-label="Open menu"
            className="grid size-9 shrink-0 place-items-center rounded-lg border border-line bg-surface/60 text-ink-2 transition-colors hover:text-ink lg:hidden"
          >
            <Menu className="size-4" aria-hidden />
          </button>

          {accounts.length === 0 ? (
            <button
              type="button"
              onClick={() => go("settings")}
              className="inline-flex items-center gap-2 rounded-full border border-warn/30 bg-warn-wash px-3 py-1 text-[12px] font-semibold text-warn"
            >
              <ShieldAlert className="size-3.5" aria-hidden />
              Connect Instagram
            </button>
          ) : (
            <AccountSwitcher />
          )}

          <div className="ml-auto flex items-center gap-2">
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                aria-label="Refresh data"
                title="Refresh data"
                className="grid size-8 place-items-center rounded-lg text-ink-3 transition-colors hover:bg-surface-2 hover:text-ink"
              >
                <RefreshCw className="size-4" aria-hidden />
              </button>
            )}

            <ThemeToggle />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="Account menu"
                  className="grid size-8 shrink-0 place-items-center rounded-full border border-line-strong bg-ink text-[11.5px] font-bold text-ink-invert"
                >
                  {initial}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuLabel className="flex flex-col gap-0.5">
                  <span className="truncate text-[12.5px] font-semibold text-ink">
                    {user?.email ?? "Signed in"}
                  </span>
                  <span className="font-mono text-[10.5px] text-ink-3">
                    {planLabel(plan)} plan
                  </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => go("settings")}
                  className="gap-2 text-[12.5px]"
                >
                  <Settings className="size-3.5" aria-hidden />
                  Settings
                </DropdownMenuItem>
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
        </header>

        <div className="mx-auto min-h-[calc(100vh-4rem)] max-w-[1180px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div key={view} className="view-enter">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
