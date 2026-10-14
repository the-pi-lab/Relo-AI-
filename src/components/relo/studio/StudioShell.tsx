"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  Zap,
  Megaphone,
  Users,
  BarChart3,
  Package,
  Link2,
  CalendarDays,
  Settings as SettingsIcon,
  Workflow,
  LogOut,
  Menu,
  X,
  Sparkles,
  Instagram,
  FlaskConical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "../chrome";
import { DustMotes, Starfield } from "../world";
import { ThemeToggle } from "@/lib/relo/theme";
import { Meter } from "./studio-ui";
import { useRelo } from "@/lib/relo/store";
import { TIER_CREDIT_LIMITS, TIER_META } from "@/lib/relo/data";

export const STUDIO_NAV: {
  view: string;
  label: string;
  icon: typeof Home;
  badge?: string;
}[] = [
  { view: "home", label: "Home", icon: Home },
  { view: "automations", label: "Automations", icon: Zap },
  { view: "campaigns", label: "Campaigns", icon: Megaphone, badge: "Pro" },
  { view: "canvas", label: "Canvas", icon: Workflow, badge: "Studio" },
  { view: "leads", label: "Leads", icon: Users },
  { view: "insights", label: "Insights", icon: BarChart3 },
  { view: "products", label: "Products", icon: Package, badge: "Pro" },
  { view: "bio", label: "Link in bio", icon: Link2, badge: "Pro" },
  { view: "content", label: "Content", icon: CalendarDays, badge: "Pro" },
  { view: "settings", label: "Settings", icon: SettingsIcon },
];

export const VIEW_TITLES: Record<string, { title: string; sub: string }> = {
  home: { title: "Studio", sub: "Your autopilot at a glance — comments becoming customers while you read this." },
  automations: { title: "Automations", sub: "One reel, one keyword set, one 3-button card — running forever." },
  campaigns: { title: "Campaigns", sub: "Blast your reachable leads inside Meta's 24-hour window." },
  canvas: { title: "Canvas", sub: "The node editor — drag steps, wire ports, test the run, publish the flow." },
  leads: { title: "Leads", sub: "Every commenter who raised a hand — searchable, exportable, yours." },
  insights: { title: "Insights", sub: "Where comments become clicks. The funnel, honestly." },
  products: { title: "Products", sub: "Your catalog feeds the AI answers and your link-in-bio." },
  bio: { title: "Link in bio", sub: "A tiny page with your whole shop — themes, blocks, one link." },
  content: { title: "Content", sub: "The pipeline from idea to published reel with its own automation." },
  settings: { title: "Settings", sub: "Connection, plan, referrals — the boring-but-important drawer." },
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
  const { plan, aiCredits, user, signOut, leads } = useRelo();
  const limit = TIER_CREDIT_LIMITS[plan];
  const pct = Math.round((aiCredits / limit) * 100);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-5 pt-5 pb-2">
        <Logo onClick={() => go("home")} />
        {onClose && (
          <button
            onClick={onClose}
            className="grid size-9 place-items-center rounded-full lg:hidden"
            aria-label="Close menu"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {/* demo strip */}
      {user?.isDemo && (
        <div className="mx-4 mt-3 flex items-center gap-2 rounded-xl border border-honey/40 bg-honey/10 px-3 py-2">
          <FlaskConical className="size-3.5 shrink-0 text-honey" />
          <p className="text-[11px] font-medium text-honey">
            Demo studio <span className="text-honey/70">— play freely, nothing is real</span>
          </p>
        </div>
      )}

      <nav className="mt-4 flex-1 space-y-0.5 overflow-y-auto px-3 pb-4" aria-label="Studio">
        {STUDIO_NAV.map((item) => {
          const active = view === item.view;
          const locked = (item.badge === "Pro" && plan === "free") || (item.badge === "Studio" && plan !== "studio");
          return (
            <button
              key={item.view}
              onClick={() => {
                go(item.view);
                onClose?.();
              }}
              className={cn(
                "group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition-colors",
                active ? "text-ink" : "text-ink-3 "
              )}
            >
              {active && (
                <motion.span
                  layoutId="nav-pill"
                  className="absolute inset-0 rounded-xl bg-ember/[0.13] ring-1 ring-ember/25"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
              <Icon_ icon={item.icon} active={active} />
              <span className="relative">{item.label}</span>
              {item.badge && (
                <span
                  className={cn(
                    "relative ml-auto rounded-md px-1.5 py-0.5 font-mono text-[9px] tracking-wider uppercase",
                    locked ? "bg-ink/5 text-ink-4" : "bg-ember-wash text-ember-deep"
                  )}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* plan card */}
      <div className="mx-3 mb-3 rounded-2xl border border-line bg-card p-4 shadow-[var(--shadow-soft)]">
        <div className="flex items-center justify-between">
          <p className="font-mono text-[10px] tracking-[0.18em] text-ink-3 uppercase">
            {TIER_META[plan].name} plan
          </p>
          <Sparkles className="size-3.5 text-honey" />
        </div>
        <p className="mt-1 text-[12px] text-ink-3">{TIER_META[plan].blurb}</p>
        <div className="mt-3 flex items-center justify-between font-mono text-[11px]">
          <span className="text-ink-4">AI credits</span>
          <span className="font-medium">{aiCredits} / {limit}</span>
        </div>
        <div className="mt-1.5">
          <Meter pct={pct} tone={pct < 20 ? "ember" : "moss"} />
        </div>
        <button
          onClick={() => go("settings")}
          className="mt-3 w-full rounded-lg bg-ink py-2 text-[12px] font-medium text-night transition-colors "
        >
          Manage plan
        </button>
      </div>

      {/* user */}
      <div className="mx-3 mb-4 flex items-center gap-2.5 rounded-2xl px-2 py-2">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-tr from-ember to-honey font-display text-[13px] font-bold text-[var(--on-ember)]">
          {(user?.email?.[0] ?? "A").toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12.5px] font-semibold">{user?.isDemo ? "Demo guest" : user?.email}</p>
          <p className="flex items-center gap-1.5 font-mono text-[10px] text-moss">
            <span className="relative flex size-2 items-center justify-center">
              <span className="absolute inline-flex size-full rounded-full bg-moss opacity-75 radar-ring" />
              <span className="relative inline-flex size-1.5 rounded-full bg-moss" />
            </span>
            <Instagram className="size-2.5" /> @aarav.makes
          </p>
        </div>
        <button
          onClick={signOut}
          aria-label="Sign out"
          title="Sign out"
          className="grid size-8 place-items-center rounded-lg text-ink-4 transition-colors "
        >
          <LogOut className="size-4" />
        </button>
      </div>
    </div>
  );
}

function Icon_({ icon: Icon, active }: { icon: typeof Home; active: boolean }) {
  return (
    <span className={cn("relative transition-transform duration-300 ", active && "text-ember")}>
      <Icon className="size-4.5" />
    </span>
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
    <div className="min-h-screen bg-paper">
      {/* the world follows you indoors — faint aurora light + drifting dust */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div
          className="anim-breathe absolute -top-32 right-[12%] size-[420px] rounded-full opacity-40 blur-3xl"
          style={{ background: "radial-gradient(closest-side, rgba(139,128,249,0.16), transparent)" }}
        />
        <div
          className="anim-drift absolute bottom-[-120px] left-[28%] size-[380px] rounded-full opacity-35 blur-3xl"
          style={{ background: "radial-gradient(closest-side, rgba(242,196,141,0.09), transparent)" }}
        />
        <Starfield density={40} opacity={0.35} />
        <DustMotes density={16} opacity={0.4} />
      </div>

      {/* desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[248px] border-r border-line bg-sidebar lg:block">
        <SidebarInner view={view} go={go} />
      </aside>

      {/* mobile top bar */}
      <div className="glass sticky top-0 z-40 flex items-center gap-3 border-b border-line px-4 py-2.5 lg:hidden">
        <button
          onClick={() => setDrawer(true)}
          className="grid size-9 place-items-center rounded-full border border-line"
          aria-label="Open menu"
        >
          <Menu className="size-4" />
        </button>
        <Logo onClick={() => go("home")} />
        <span className="ml-auto font-mono text-[10px] text-ink-4 tnum">{leads.length} leads</span>
        <ThemeToggle />
      </div>

      {/* mobile drawer */}
      <AnimatePresence>
        {drawer && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawer(false)}
              className="fixed inset-0 z-50 bg-night/70 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="fixed inset-y-0 left-0 z-50 w-[280px] bg-sidebar lg:hidden"
            >
              <SidebarInner view={view} go={go} onClose={() => setDrawer(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* main */}
      <main className="lg:pl-[248px]">
        {/* desktop topbar */}
        <div className="glass sticky top-0 z-30 hidden items-baseline gap-4 border-b border-line px-8 py-4 lg:flex">
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
              className="flex items-baseline gap-4"
            >
              <h2 className="font-display text-[15px] font-bold">{meta.title}</h2>
              <p className="hidden max-w-xl truncate text-[12.5px] text-ink-4 xl:block">{meta.sub}</p>
            </motion.div>
          </AnimatePresence>
          <span className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-moss/30 bg-moss/10 px-3 py-1 font-mono text-[10px] tracking-wider text-moss uppercase">
            <span className="size-1.5 animate-pulse-soft rounded-full bg-moss" /> engine healthy
          </span>
          <ThemeToggle className="ml-2" />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 18, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -12, filter: "blur(4px)" }}
            transition={{ duration: 0.38, ease: [0.22, 1, 0.28, 1] }}
            className="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-8"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
