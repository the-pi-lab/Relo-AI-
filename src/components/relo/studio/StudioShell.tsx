"use client";

import React, { useEffect, useState } from "react";
import { LogOut, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "../chrome";
import { ThemeToggle } from "@/lib/relo/theme";
import { Meter } from "./studio-ui";
import { useRelo } from "@/lib/relo/store";
import { TIER_CREDIT_LIMITS, TIER_META } from "@/lib/relo/data";

export const STUDIO_NAV: { view: string; label: string }[] = [
  { view: "home", label: "Home" },
  { view: "automations", label: "Automations" },
  { view: "campaigns", label: "Campaigns" },
  { view: "canvas", label: "Canvas" },
  { view: "leads", label: "Leads" },
  { view: "insights", label: "Insights" },
  { view: "products", label: "Products" },
  { view: "bio", label: "Link in bio" },
  { view: "content", label: "Content" },
  { view: "settings", label: "Settings" },
];

export const VIEW_TITLES: Record<string, { title: string; sub: string }> = {
  home: { title: "Home", sub: "Your automations at a glance." },
  automations: { title: "Automations", sub: "Pick a reel, arm the keywords, design the DM card." },
  campaigns: { title: "Campaigns", sub: "Message everyone still inside Meta's 24-hour window." },
  canvas: { title: "Canvas", sub: "Drag steps, wire ports, test the run, publish the flow." },
  leads: { title: "Leads", sub: "Every commenter who raised a hand — searchable, exportable, yours." },
  insights: { title: "Insights", sub: "From comments to clicks — the funnel, honestly." },
  products: { title: "Products", sub: "Your catalog feeds the AI answers and your link in bio." },
  bio: { title: "Link in bio", sub: "One page with your whole shop — one link." },
  content: { title: "Content", sub: "The pipeline from idea to published reel." },
  settings: { title: "Settings", sub: "Connection, plan, referrals — the important drawer." },
};

function SidebarInner({
  view,
  go,
  onClose,
}: {
  view: string;
  go: (v: string) => void;
  onClose?: () => void;
}) {
  const { plan, aiCredits, user, signOut } = useRelo();
  const limit = TIER_CREDIT_LIMITS[plan];
  const pct = limit > 0 ? Math.round((aiCredits / limit) * 100) : 0;
  const tier = TIER_META[plan];

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-5 pt-5 pb-2">
        <Logo onClick={() => go("home")} />
        {onClose && (
          <button
            onClick={onClose}
            className="size-9 shrink-0 place-items-center rounded-md border border-border text-text-3 hover:text-text"
            aria-label="Close menu"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {user?.isDemo && (
        <div className="mx-4 mt-3 flex items-center gap-2 rounded-md border border-accent-wash bg-accent-wash/50 px-3 py-2">
          <span className="size-1.5 rounded-full bg-accent" aria-hidden />
          <p className="text-[11px] font-semibold text-accent">
            Demo studio<span className="text-accent/70"> — play freely, nothing is real</span>
          </p>
        </div>
      )}

      <nav className="mt-5 flex-1 space-y-0.5 overflow-y-auto px-3 pb-5" aria-label="Studio">
        {STUDIO_NAV.map((item) => {
          const active = view === item.view;
          const locked =
            (item.view === "campaigns" && plan === "free") ||
            (item.view === "canvas" && plan !== "studio") ||
            (item.view === "products" && plan === "free") ||
            (item.view === "bio" && plan === "free") ||
            (item.view === "content" && plan === "free");
          return (
            <button
              key={item.view}
              onClick={() => {
                go(item.view);
                onClose?.();
              }}
              className={cn(
                "group relative flex w-full items-center gap-3 rounded-md px-3.5 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-accent text-accent-ink"
                  : locked
                    ? "text-text-3"
                    : "text-text-2 hover:text-text hover:bg-surface-2"
              )}
              aria-current={active ? "page" : undefined}
              disabled={locked}
            >
              {item.label}
              {locked && (
                <span className="ml-auto text-[10px] font-semibold text-text-3 uppercase tracking-wider">
                  locked
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* plan card */}
      <div className="mx-4 mb-5 rounded-lg border border-border bg-surface p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <p className="caption">{tier.name} plan</p>
          <span className="size-1.5 rounded-full bg-accent" aria-hidden />
        </div>
        <p className="text-xs text-text-2">{tier.blurb}</p>
        <div className="mt-4 flex items-center justify-between text-xs">
          <span className="text-text-3">AI credits</span>
          <span className="font-semibold text-text tnum">{aiCredits} / {limit}</span>
        </div>
        <div className="mt-2">
          <Meter pct={pct} tone={pct < 20 ? "amber" : "ok"} />
        </div>
        <button
          onClick={() => go("settings")}
          className="mt-4 w-full rounded-md bg-text py-2.5 text-[12px] font-semibold text-text-inverse transition-colors hover:bg-text-2"
        >
          Manage plan
        </button>
      </div>

      {/* user */}
      <div className="mx-4 mb-4 flex items-center gap-2.5 rounded-md px-2 py-2">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-surface-2 font-bold text-[13px] text-text">
          {(user?.email?.[0] ?? "A").toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-text">{user?.isDemo ? "Demo guest" : user?.email}</p>
          <p className="flex items-center gap-1.5 text-[10px] text-text-3">
            <span className="relative flex size-2 items-center justify-center">
              <span className="absolute inline-flex size-full rounded-full bg-ok opacity-80" />
              <span className="relative inline-flex size-1.5 rounded-full bg-ok" />
            </span>
            instagram
          </p>
        </div>
        <button
          onClick={signOut}
          aria-label="Sign out"
          className="size-8 shrink-0 place-items-center rounded-md text-text-3 hover:text-text transition-colors"
        >
          <LogOut className="size-4" />
        </button>
      </div>
    </div>
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
  const { leads } = useRelo();

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [view]);

  const meta = VIEW_TITLES[view] ?? { title: "Studio", sub: "" };

  return (
    <div className="min-h-screen bg-surface">
      {/* desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-[250px] border-r border-border bg-surface lg:block">
        <SidebarInner view={view} go={go} />
      </aside>

      {/* mobile top bar */}
      <div className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-surface px-4 py-3 lg:hidden">
        <button
          onClick={() => setDrawer(true)}
          className="size-9 shrink-0 place-items-center rounded-md border border-border text-text-3 hover:text-text"
          aria-label="Open menu"
        >
          <Menu className="size-4" />
        </button>
        <Logo onClick={() => go("home")} />
        <span className="ml-auto font-mono text-[11px] text-text-3 tnum">{leads.length} leads</span>
        <ThemeToggle className="ml-2" />
      </div>

      {/* mobile drawer */}
      {drawer && (
        <>
          <div
            onClick={() => setDrawer(false)}
            className="fixed inset-0 z-30 bg-surface/60 backdrop-blur-sm lg:hidden"
          />
          <aside
            className="fixed inset-y-0 left-0 z-40 w-[260px] bg-surface border-r border-border lg:hidden transform transition-transform duration-300"
            style={{ transform: drawer ? "translateX(0)" : "translateX(-100%)" }}
          >
            <SidebarInner view={view} go={go} onClose={() => setDrawer(false)} />
          </aside>
        </>
      )}

      <main className="lg:pl-[250px]">
        {/* desktop top bar */}
        <div className="sticky top-0 z-10 hidden items-baseline gap-4 border-b border-border bg-surface px-6 py-4 lg:flex">
          <div className="flex items-baseline gap-3">
            <h2 className="h3 text-text">{meta.title}</h2>
            <p className="hidden text-xs text-text-3 xl:block">{meta.sub}</p>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span className="flex items-center gap-1.5 rounded-md border border-ok/30 bg-ok/10 px-3 py-1.5 text-xs font-semibold text-ok uppercase tracking-wider">
              <span className="size-1.5 rounded-full bg-ok" aria-hidden />
              engine healthy
            </span>
            <ThemeToggle className="ml-2" />
          </div>
        </div>

        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
