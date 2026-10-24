"use client";

import {
  CalendarDays,
  ClipboardList,
  Contact,
  Gift,
  GitBranch,
  Handshake,
  LayoutDashboard,
  Lightbulb,
  Link2,
  Package,
  Send,
  Settings,
  Sparkles,
  TrendingUp,
  Users,
  Workflow,
  type LucideIcon,
} from "lucide-react";

import type { Tier } from "@/lib/relo/data";

/**
 * The studio's navigation, defined once.
 *
 * The shell, the command palette and the dashboard's quick actions all read
 * from this list, so a view can never exist in one of them and not the others.
 *
 * `status: "soon"` is deliberate. The Zorcha inventory lists twelve top-level
 * destinations; six of them (Forms, Contacts, AI Studio, Collabs, Inspiration,
 * Refer & Earn) have no route behind them yet. Rather than shipping links that
 * land nowhere, they render disabled with a "Soon" chip until their phase
 * lands — the moment a view exists, flip the flag and everything picks it up.
 */
export interface NavItem {
  view: string;
  label: string;
  icon: LucideIcon;
  /** Extra words the command palette matches on. */
  keywords?: string[];
  /** Minimum plan feature required. Locks the row rather than hiding it. */
  requires?: "campaigns" | "products" | "canvas";
  status?: "live" | "soon";
  /** Short line used by the command palette and the empty states. */
  hint?: string;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Overview",
    items: [
      {
        view: "home",
        label: "Dashboard",
        icon: LayoutDashboard,
        keywords: ["home", "overview", "today"],
        hint: "Funnel, setup progress and plan usage",
      },
      {
        view: "insights",
        label: "Insights",
        icon: TrendingUp,
        keywords: ["analytics", "stats", "clicks", "conversion"],
        hint: "Comments, DMs, clicks and conversion",
      },
    ],
  },
  {
    label: "Automate",
    items: [
      {
        view: "automations",
        label: "Automations",
        icon: Workflow,
        keywords: ["reels", "keywords", "comment", "dm", "trigger"],
        hint: "Reel + keyword rules that answer comments",
      },
      {
        view: "canvas",
        label: "Flow canvas",
        icon: GitBranch,
        requires: "canvas",
        keywords: ["builder", "nodes", "dag", "graph"],
        hint: "Node graph for multi-step flows",
      },
      {
        view: "campaigns",
        label: "Broadcasts",
        icon: Send,
        requires: "campaigns",
        keywords: ["campaign", "re-engage", "24h", "window"],
        hint: "Message everyone who commented",
      },
      {
        view: "content",
        label: "Planner",
        icon: CalendarDays,
        requires: "campaigns",
        keywords: ["calendar", "schedule", "ideas"],
        hint: "Plan Reels before they go live",
      },
    ],
  },
  {
    label: "Grow",
    items: [
      {
        view: "leads",
        label: "Audience",
        icon: Users,
        keywords: ["contacts", "crm", "people", "leads"],
        hint: "Everyone who commented, with history",
      },
      {
        view: "products",
        label: "Products",
        icon: Package,
        requires: "products",
        keywords: ["offers", "store", "links", "catalog"],
        hint: "What your DMs and bio page sell",
      },
      {
        view: "bio",
        label: "Link in bio",
        icon: Link2,
        requires: "products",
        keywords: ["page", "storefront", "linktree"],
        hint: "One page for every link you own",
      },
      {
        view: "leads",
        label: "Contacts",
        icon: Contact,
        status: "soon",
        keywords: ["crm", "custom fields", "tags"],
        hint: "Tags, custom fields and segments",
      },
    ],
  },
  {
    label: "Intelligence",
    items: [
      {
        view: "ai",
        label: "AI Studio",
        icon: Sparkles,
        status: "soon",
        keywords: ["faq", "chatbot", "credits", "copilot"],
        hint: "Answers the DMs your keywords miss",
      },
      {
        view: "collabs",
        label: "Collabs",
        icon: Handshake,
        status: "soon",
        keywords: ["brands", "deals", "marketplace"],
        hint: "Brand deals and deliverables",
      },
      {
        view: "inspiration",
        label: "Inspiration",
        icon: Lightbulb,
        status: "soon",
        keywords: ["templates", "ideas", "community"],
        hint: "Proven flows from other creators",
      },
    ],
  },
  {
    label: "Account",
    items: [
      {
        view: "refer",
        label: "Refer & earn",
        icon: Gift,
        status: "soon",
        keywords: ["affiliate", "commission", "invite"],
        hint: "Recurring commission on invites",
      },
      {
        view: "settings",
        label: "Settings",
        icon: Settings,
        keywords: ["account", "billing", "team", "token", "danger"],
        hint: "Connection, plan and billing",
      },
    ],
  },
];

/** Flat list, for the palette and for resolving the current view's label. */
export const NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((group) => group.items);

/** Count of live destinations, shown in the collapsed rail's tooltip. */
export const LIVE_NAV_COUNT = NAV_ITEMS.filter((item) => item.status !== "soon").length;

export function navItemFor(view: string): NavItem | undefined {
  return NAV_ITEMS.find((item) => item.view === view);
}

/** The plan feature a view needs, or null when it is free. */
export function lockedBy(
  item: NavItem,
  limits: { canvas: boolean; campaigns: boolean; products: boolean }
): boolean {
  return Boolean(item.requires && !limits[item.requires]);
}

export const PLAN_FEATURE_LABEL: Record<
  NonNullable<NavItem["requires"]>,
  { name: string; tier: Exclude<Tier, "free"> }
> = {
  campaigns: { name: "Broadcasts", tier: "pro" },
  products: { name: "Products", tier: "pro" },
  canvas: { name: "Flow canvas", tier: "studio" },
};
