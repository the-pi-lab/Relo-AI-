/**
 * Frontend types.
 *
 * These mirror what the Cloudflare Worker actually returns (`backend/src/
 * api/router.ts` and `backend/src/db/queries.ts`), not an idealised schema.
 * Where the wire format is unix seconds, we say so and convert at the edge.
 *
 * There is no seeded demo data in this file on purpose. Every number the UI
 * shows comes from an endpoint.
 */

export type Tier = "free" | "pro" | "studio";

/* ── Instagram connection ─────────────────────────────────────────────── */

export interface Account {
  id: string;
  userId: string;
  instagramUserId: string;
  username: string;
  profilePictureUrl?: string;
  /** unix seconds */
  tokenExpiresAt: number;
  daysUntilExpiration: number;
  isActive: boolean;
  /** unix seconds */
  createdAt: number;
  plan: Tier;
  aiCreditsRemaining: number;
  aiCreditsResetAt: number;
  freeReelConsumed: boolean;
}

export interface Reel {
  id: string;
  permalink: string;
  mediaType: string;
  mediaUrl?: string;
  thumbnailUrl?: string;
  caption?: string;
  /** ISO 8601 from the Graph API */
  timestamp: string;
  hasActiveAutomation: boolean;
}

/* ── Automations ──────────────────────────────────────────────────────── */

export type TemplateButtonType = "web_url" | "postback" | "phone_number";

export interface TemplateButton {
  type: TemplateButtonType;
  title: string;
  url?: string;
  payload?: string;
}

export interface TemplateCard {
  title: string;
  subtitle?: string;
  imageUrl?: string;
  buttons: TemplateButton[];
}

export interface Automation {
  id: string;
  accountId: string;
  instagramMediaId: string;
  reelPermalink: string;
  reelThumbnailUrl?: string;
  triggerKeywords: string[];
  commentReplies: string[];
  templateCard: TemplateCard;
  isActive: boolean;
  followUpEnabled: boolean;
  followUpDelayMinutes: number;
  /** unix seconds */
  createdAt: number;
  updatedAt: number;
  shortLinks?: Array<{
    id: string;
    buttonIndex: number;
    targetUrl: string;
    clickCount: number;
  }>;
}

export interface AutomationInput {
  id?: string;
  accountId: string;
  instagramMediaId: string;
  reelPermalink: string;
  reelThumbnailUrl?: string;
  triggerKeywords: string[];
  commentReplies: string[];
  templateCard: TemplateCard;
  isActive: boolean;
  followUpEnabled: boolean;
  followUpDelayMinutes: number;
}

/* ── Leads ────────────────────────────────────────────────────────────── */

export interface Lead {
  id: string;
  accountId: string;
  instagramScopedId: string;
  username?: string;
  followerStatusAtTrigger: boolean;
  emailCollected?: string;
  totalDmsSent: number;
  /** unix seconds */
  firstInteractionAt: number;
  /** unix seconds */
  lastInteractionAt: number;
}

export interface LeadsPage {
  leads: Lead[];
  total: number;
}

/* ── Telemetry ────────────────────────────────────────────────────────── */

export interface Telemetry {
  status: "healthy" | "degraded" | "error";
  queueDepth: number;
  pendingJobs: number;
  completed24h: number;
  failed24h: number;
  totalLeads: number;
  totalComments: number;
  totalDmsSent: number;
  totalClicks: number;
  storageRows: number;
  plan: Tier;
  aiCreditsRemaining: number;
}

/* ── Campaigns ────────────────────────────────────────────────────────── */

export type CampaignStatus =
  | "draft"
  | "scheduled"
  | "sending"
  | "completed"
  | "failed"
  | "cancelled";

export interface CampaignCard {
  title: string;
  subtitle?: string;
  imageUrl?: string;
  buttons: Array<{ type: string; title: string; url?: string }>;
}

export interface CampaignPayload {
  kind: "text" | "card";
  text?: string;
  card?: CampaignCard;
}

export interface Campaign {
  id: string;
  accountId: string;
  mediaId: string;
  payload: CampaignPayload | null;
  status: CampaignStatus;
  /** unix seconds */
  scheduledAt: number;
  sentCount: number;
  failedCount: number;
  unreachableCount: number;
  usesHumanAgentTag: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Reachability {
  total: number;
  reachable: number;
  unreachable: number;
}

/* ── Products ─────────────────────────────────────────────────────────── */

export interface Product {
  id: string;
  accountId?: string;
  name: string;
  priceText?: string;
  description?: string;
  link?: string;
  imageUrl?: string;
  isActive: boolean;
  createdAt?: number;
  updatedAt?: number;
}

/* ── Canvas flows (backend graph shape) ───────────────────────────────── */

export type FlowNodeType =
  | "trigger_comment"
  | "action_reply"
  | "action_dm_card"
  | "action_dm_text"
  | "action_wait";

export interface FlowNode {
  id: string;
  type: FlowNodeType;
  position: { x: number; y: number };
  config: Record<string, unknown>;
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
}

export interface Flow {
  id: string;
  accountId: string;
  name: string;
  graph: { nodes: FlowNode[]; edges: FlowEdge[] };
  isActive: boolean;
  isPublished: boolean;
  createdAt: number;
  updatedAt: number;
}

/* ── Link in bio ──────────────────────────────────────────────────────── */

export type LinkTheme = "volt" | "plain" | "dark";

export interface LinkPage {
  id: string;
  accountId: string;
  slug?: string;
  headline?: string;
  bio?: string;
  theme: LinkTheme;
  isPublished: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface LinkBlock {
  id: string;
  pageId: string;
  productId?: string;
  targetUrl: string;
  label: string;
  position: number;
  clickCount: number;
  isActive: boolean;
}

export interface LinkPageSnapshot {
  page: LinkPage | null;
  blocks: LinkBlock[];
  products: Array<Pick<Product, "id" | "name" | "priceText" | "link" | "imageUrl">>;
  publicUrl: string | null;
}

export interface LinkPageInput {
  slug?: string;
  headline?: string;
  bio?: string;
  theme: LinkTheme;
  isPublished: boolean;
  blocks: Array<{ label: string; targetUrl: string; productId?: string }>;
}

/* ── Content planning ─────────────────────────────────────────────────── */

export type ContentStatus = "idea" | "drafting" | "scheduled" | "published";

export interface ContentPlan {
  id: string;
  accountId: string;
  title: string;
  hook?: string;
  caption?: string;
  status: ContentStatus;
  /** unix seconds */
  plannedFor: number;
  instagramMediaId?: string;
  automationId?: string;
  createdAt: number;
  updatedAt: number;
}

export interface ContentStats {
  idea: number;
  drafting: number;
  scheduled: number;
  published: number;
  converting: number;
}

export interface ContentPlanInput {
  id?: string;
  title: string;
  hook?: string;
  caption?: string;
  status: ContentStatus;
  plannedFor: number;
  automationId?: string;
}

/* ── Billing ──────────────────────────────────────────────────────────── */

export interface BillingPayment {
  id: string;
  provider: string;
  plan: string;
  amount_inr: number;
  status: string;
  utr: string | null;
  created_at: number;
  verified_at: number | null;
}

export interface Billing {
  plan: Tier;
  aiCreditsRemaining: number;
  payments: BillingPayment[];
  checkout: {
    lemonSqueezyUrl: string | null;
    upiId: string | null;
  };
}

/* ── User ─────────────────────────────────────────────────────────────── */

export interface SessionUser {
  id: string;
  email: string;
  createdAt?: number;
}

/* ── Plan catalogue ───────────────────────────────────────────────────── */

export const TIER_CREDIT_LIMITS: Record<Tier, number> = {
  free: 3,
  pro: 500,
  studio: 5000,
};

export const TIER_META: Record<
  Tier,
  { name: string; price: string; blurb: string }
> = {
  free: { name: "Free", price: "₹0", blurb: "One reel, two reply variations" },
  pro: { name: "Pro", price: "₹199/mo", blurb: "Unlimited reels, DMs, campaigns" },
  studio: { name: "Studio", price: "₹499/mo", blurb: "Three accounts, canvas, 5,000 credits" },
};

export const TIER_LIMITS: Record<
  Tier,
  {
    maxAccounts: number;
    replyMin: number;
    replyMax: number;
    buttons: number;
    canvas: boolean;
    campaigns: boolean;
    products: boolean;
    followUps: boolean;
    credits: number;
  }
> = {
  free: {
    maxAccounts: 1,
    replyMin: 2,
    replyMax: 2,
    buttons: 2,
    canvas: false,
    campaigns: false,
    products: false,
    followUps: false,
    credits: 3,
  },
  pro: {
    maxAccounts: 1,
    replyMin: 3,
    replyMax: 8,
    buttons: 3,
    canvas: false,
    campaigns: true,
    products: true,
    followUps: true,
    credits: 500,
  },
  studio: {
    maxAccounts: 3,
    replyMin: 3,
    replyMax: 8,
    buttons: 3,
    canvas: true,
    campaigns: true,
    products: true,
    followUps: true,
    credits: 5000,
  },
};

/* ── Format helpers ───────────────────────────────────────────────────── */

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** The Worker stores most timestamps as unix seconds; JS wants milliseconds. */
export const toMs = (value: number | string | undefined | null): number => {
  if (value === undefined || value === null) return 0;
  const n = typeof value === "number" ? value : Date.parse(value);
  if (!Number.isFinite(n)) return 0;
  return n < 1e12 ? n * 1000 : n;
};

export const timeAgo = (value: number | string | undefined | null): string => {
  const ts = toMs(value);
  if (!ts) return "—";
  const diff = Date.now() - ts;
  if (diff < 0) {
    const ahead = Math.abs(diff);
    if (ahead < HOUR) return `in ${Math.max(1, Math.floor(ahead / MINUTE))}m`;
    if (ahead < DAY) return `in ${Math.floor(ahead / HOUR)}h`;
    return `in ${Math.floor(ahead / DAY)}d`;
  }
  if (diff < MINUTE) return "just now";
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)}m ago`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)}h ago`;
  if (diff < 30 * DAY) return `${Math.floor(diff / DAY)}d ago`;
  return new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

export const fmtNum = (n: number | undefined | null): string => {
  const value = Number(n ?? 0);
  if (value >= 1000) {
    return `${(value / 1000).toFixed(value >= 10_000 ? 0 : 1)}k`;
  }
  return String(value);
};

export const fmtDate = (value: number | string | undefined | null): string =>
  new Date(toMs(value)).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });

export const dayInputValue = (value: number | string | undefined | null): string => {
  const ms = toMs(value);
  return ms ? new Date(ms).toISOString().slice(0, 10) : "";
};

let counter = 0;
/** Client-side temporary id. The server replaces it on insert. */
export const uid = (prefix: string): string =>
  `${prefix}_${Date.now().toString(36)}${(counter++).toString(36)}${Math.floor(
    Math.random() * 1e4
  ).toString(36)}`;

export const planLabel = (tier: Tier): string =>
  tier === "studio" ? "Studio" : tier === "pro" ? "Pro" : "Free";
