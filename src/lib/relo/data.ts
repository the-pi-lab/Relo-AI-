/**
 * RELO demo data layer — field-compatible with the production contracts
 * (src/types/contracts.ts of the Cloudflare engine) but typed simply and
 * seeded so the whole Studio works with zero backend.
 */

export type Tier = "free" | "pro" | "studio";

export interface TemplateButton {
  type: "web_url" | "postback" | "phone_number";
  title: string;
  url?: string;
  payload?: string;
}

export interface TemplateCard {
  title: string;
  subtitle?: string;
  buttons: TemplateButton[];
}

export interface Reel {
  id: string;
  caption: string;
  thumbnailHue: number;
  commentsCount: number;
  likeCount: number;
  timestamp: number;
}

export interface Automation {
  id: string;
  reelId: string;
  reelCaption: string;
  triggerKeywords: string[];
  commentReplies: string[];
  followGateEnabled: boolean;
  templateCard: TemplateCard;
  isActive: boolean;
  followUpEnabled: boolean;
  followUpDelayMinutes: number;
  createdAt: number;
  updatedAt: number;
  /* live-ish counters */
  triggersToday: number;
  dmsSent: number;
  clicks: number;
}

export interface Lead {
  id: string;
  username: string;
  followerStatusAtTrigger: boolean;
  emailCollected?: string;
  totalDmsSent: number;
  firstInteractionAt: number;
  lastInteractionAt: number;
  sourceReelCaption: string;
  clickedButton?: string;
}

export type CampaignStatus = "draft" | "scheduled" | "sending" | "completed" | "failed";

export interface Campaign {
  id: string;
  name: string;
  audienceSize: number;
  status: CampaignStatus;
  kind: "text" | "card";
  text?: string;
  cardTitle?: string;
  scheduledAt: number;
  sentCount: number;
  failedCount: number;
  unreachableCount: number;
  usesHumanAgentTag: boolean;
}

export type FlowNodeType =
  | "trigger_comment"
  | "action_reply"
  | "action_dm_card"
  | "action_dm_text"
  | "action_wait"
  | "action_condition"
  | "action_ai_text"
  | "note";

export interface FlowNode {
  id: string;
  type: FlowNodeType;
  x: number;
  y: number;
  label: string;
  detail?: string;
  /** editor parameters (keyword lists, texts, timings) — optional for
      backward compatibility with flows persisted before the editor */
  params?: Record<string, string>;
}

export interface FlowEdge {
  id: string;
  from: string;
  to: string;
}

export interface Flow {
  id: string;
  name: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
  isActive: boolean;
  isPublished: boolean;
}

export interface Product {
  id: string;
  name: string;
  priceText?: string;
  description?: string;
  link?: string;
  isActive: boolean;
  clicks: number;
}

export interface LinkBlock {
  id: string;
  label: string;
  targetUrl: string;
  productId?: string;
  clickCount: number;
  isActive: boolean;
}

export interface LinkPageData {
  headline: string;
  bio: string;
  slug: string;
  theme: "volt" | "plain" | "dark";
  isPublished: boolean;
  blocks: LinkBlock[];
}

export type ContentStatus = "idea" | "drafting" | "scheduled" | "published";

export interface ContentPlan {
  id: string;
  title: string;
  hook?: string;
  status: ContentStatus;
  plannedFor: number;
}

export interface ActivityEvent {
  id: string;
  at: number;
  kind: "comment" | "dm" | "lead" | "click" | "system";
  text: string;
  meta?: string;
}

/* ── helpers ─────────────────────────────────────────────────────────── */

const MIN = 60_000;
const HOUR = 3_600_000;
const DAY = 86_400_000;

let counter = 0;
export const uid = (prefix: string) =>
  `${prefix}_${Date.now().toString(36)}${(counter++).toString(36)}${Math.floor(Math.random() * 1e4).toString(36)}`;

/* ── seeded world: aarav.makes sells notion templates ────────────────── */

export const DEMO_REELS: Reel[] = [
  {
    id: "reel_1",
    caption: "3 Notion templates that replaced my ₹40,000 productivity stack 🤯",
    thumbnailHue: 18,
    commentsCount: 1284,
    likeCount: 24100,
    timestamp: Date.now() - 2 * DAY,
  },
  {
    id: "reel_2",
    caption: "The client dashboard I build in 9 minutes (free inside)",
    thumbnailHue: 152,
    commentsCount: 862,
    likeCount: 15900,
    timestamp: Date.now() - 5 * DAY,
  },
  {
    id: "reel_3",
    caption: "POV: your portfolio site writes itself while you sleep",
    thumbnailHue: 262,
    commentsCount: 2310,
    likeCount: 51200,
    timestamp: Date.now() - 9 * DAY,
  },
];

export const DEMO_AUTOMATIONS: Automation[] = [
  {
    id: "auto_1",
    reelId: "reel_1",
    reelCaption: DEMO_REELS[0].caption,
    triggerKeywords: ["notion", "template", "send"],
    commentReplies: [
      "Just sent it 📬 check your DMs!",
      "On its way — peek at your requests 💬",
      "Fired over! Grab it from your inbox ✨",
    ],
    followGateEnabled: true,
    templateCard: {
      title: "The Creator OS — free pack",
      subtitle: "3 templates · No email needed",
      buttons: [
        { type: "web_url", title: "Download free pack", url: "https://aarav.so/creator-os" },
        { type: "web_url", title: "See all templates", url: "https://aarav.so/shop" },
        { type: "postback", title: "Talk to me", payload: "HUMAN_HANDOFF" },
      ],
    },
    isActive: true,
    followUpEnabled: true,
    followUpDelayMinutes: 60,
    createdAt: Date.now() - 2 * DAY + 3 * HOUR,
    updatedAt: Date.now() - 4 * HOUR,
    triggersToday: 87,
    dmsSent: 1204,
    clicks: 643,
  },
  {
    id: "auto_2",
    reelId: "reel_2",
    reelCaption: DEMO_REELS[1].caption,
    triggerKeywords: ["dashboard", "free"],
    commentReplies: [
      "Sent! Check your DMs 🚀",
      "DM'd you the link 💜",
      "It's in your inbox — go build!",
    ],
    followGateEnabled: false,
    templateCard: {
      title: "Client Dashboard starter",
      subtitle: "Duplicate + make it yours",
      buttons: [
        { type: "web_url", title: "Get the template", url: "https://aarav.so/dashboard" },
        { type: "web_url", title: "Watch the build", url: "https://aarav.so/reel-guide" },
      ],
    },
    isActive: true,
    followUpEnabled: false,
    followUpDelayMinutes: 30,
    createdAt: Date.now() - 5 * DAY + HOUR,
    updatedAt: Date.now() - 1 * DAY,
    triggersToday: 41,
    dmsSent: 688,
    clicks: 301,
  },
  {
    id: "auto_3",
    reelId: "reel_3",
    reelCaption: DEMO_REELS[2].caption,
    triggerKeywords: ["portfolio", "site", "me"],
    commentReplies: ["Check your DMs — it's live 🔥", "Link sent! Go claim yours ✉️"],
    followGateEnabled: true,
    templateCard: {
      title: "Portfolio-in-a-weekend",
      subtitle: "The exact system from the reel",
      buttons: [
        { type: "web_url", title: "Start building", url: "https://aarav.so/portfolio" },
        { type: "postback", title: "Send pricing", payload: "PRICING" },
      ],
    },
    isActive: false,
    followUpEnabled: true,
    followUpDelayMinutes: 120,
    createdAt: Date.now() - 9 * DAY,
    updatedAt: Date.now() - 3 * DAY,
    triggersToday: 0,
    dmsSent: 1841,
    clicks: 902,
  },
];

const LEAD_NAMES: Array<[string, boolean, string | undefined, string]> = [
  ["meghnabuilds", true, "meghna@studiokite.co", "Download free pack"],
  ["rohitcodes", false, undefined, "Get the template"],
  ["priya.designs", true, "priya@inkwell.in", "Download free pack"],
  ["thefitfoodie_", false, undefined, "See all templates"],
  ["arjun.exe", true, "arjun@pixelmint.dev", "Start building"],
  ["sanjana.mp4", true, undefined, "Download free pack"],
  ["dev.ankit", false, undefined, "Get the template"],
  ["wanderlustsha", true, "shagun@tsp.blog", "Talk to me"],
  ["notionwithneha", true, "neha@secondbrain.gg", "Download free pack"],
  ["karanftw", false, undefined, "See all templates"],
  ["lisha_makes", true, undefined, "Start building"],
  ["thequirkydev", true, "aditya@quirky.dev", "Download free pack"],
];

export const DEMO_LEADS: Lead[] = LEAD_NAMES.map(([username, follower, email, clicked], i) => ({
  id: `lead_${i + 1}`,
  username,
  followerStatusAtTrigger: follower,
  emailCollected: email,
  totalDmsSent: 1 + ((i * 7) % 4),
  firstInteractionAt: Date.now() - (14 - i) * DAY - (i % 5) * HOUR,
  lastInteractionAt: Date.now() - (i % 9) * HOUR - (i % 3) * MIN * 17,
  sourceReelCaption: DEMO_REELS[i % 3].caption,
  clickedButton: clicked,
}));

export const DEMO_CAMPAIGNS: Campaign[] = [
  {
    id: "cmp_1",
    name: "Creator OS v2 launch",
    audienceSize: 743,
    status: "completed",
    kind: "card",
    cardTitle: "Creator OS v2 — 40% off for past grabbers",
    scheduledAt: Date.now() - 6 * DAY,
    sentCount: 691,
    failedCount: 12,
    unreachableCount: 40,
    usesHumanAgentTag: true,
  },
  {
    id: "cmp_2",
    name: "Weekend workshop invites",
    audienceSize: 512,
    status: "sending",
    kind: "text",
    text: "Yo! I'm hosting a free 45-min workshop on Notion dashboards this Sunday 7pm. Want a seat? 🎟️",
    scheduledAt: Date.now() - 2 * HOUR,
    sentCount: 214,
    failedCount: 3,
    unreachableCount: 58,
    usesHumanAgentTag: false,
  },
  {
    id: "cmp_3",
    name: "Black Friday waitlist",
    audienceSize: 0,
    status: "draft",
    kind: "card",
    cardTitle: "You're on the list ⚡",
    scheduledAt: Date.now() + 12 * DAY,
    sentCount: 0,
    failedCount: 0,
    unreachableCount: 0,
    usesHumanAgentTag: false,
  },
];

export const DEMO_FLOWS: Flow[] = [
  {
    id: "flow_1",
    name: "Free pack → upsell",
    isActive: true,
    isPublished: true,
    nodes: [
      { id: "n1", type: "trigger_comment", x: 30, y: 130, label: "Comment: “notion”", detail: "Whole-word match" },
      { id: "n2", type: "action_reply", x: 240, y: 50, label: "Public reply", detail: "“Just sent it 📬”" },
      { id: "n3", type: "action_dm_card", x: 240, y: 215, label: "DM: free pack", detail: "3-button card" },
      { id: "n4", type: "action_wait", x: 460, y: 215, label: "Wait 60 min", detail: "Human-paced" },
      { id: "n5", type: "action_dm_text", x: 670, y: 215, label: "Follow-up text", detail: "“Made it useful?”" },
    ],
    edges: [
      { id: "e1", from: "n1", to: "n2" },
      { id: "e2", from: "n1", to: "n3" },
      { id: "e3", from: "n3", to: "n4" },
      { id: "e4", from: "n4", to: "n5" },
    ],
  },
];

export const DEMO_PRODUCTS: Product[] = [
  {
    id: "prod_1",
    name: "Creator OS (free pack)",
    priceText: "Free",
    description: "3 Notion templates: content calendar, CRM, launch tracker.",
    link: "https://aarav.so/creator-os",
    isActive: true,
    clicks: 643,
  },
  {
    id: "prod_2",
    name: "Second Brain Pro",
    priceText: "₹1,499",
    description: "The full PARA-based system with weekly reviews baked in.",
    link: "https://aarav.so/second-brain",
    isActive: true,
    clicks: 288,
  },
  {
    id: "prod_3",
    name: "Client Dashboard Kit",
    priceText: "₹999",
    description: "Freelancer command centre — invoices, projects, pipeline.",
    link: "https://aarav.so/dashboard",
    isActive: true,
    clicks: 301,
  },
  {
    id: "prod_4",
    name: "Portfolio Sprint (cohort)",
    priceText: "₹4,999",
    description: "5-day live sprint. Ship a portfolio that sells you.",
    link: "https://aarav.so/sprint",
    isActive: false,
    clicks: 57,
  },
];

export const DEMO_LINK_PAGE: LinkPageData = {
  headline: "Aarav makes Notion feel like magic ✨",
  bio: "Templates, sprints and the occasional 3am reel. Everything I make, one tap away.",
  slug: "aarav",
  theme: "volt",
  isPublished: true,
  blocks: [
    { id: "lb1", label: "⚡ Creator OS — free pack", targetUrl: "https://aarav.so/creator-os", productId: "prod_1", clickCount: 1204, isActive: true },
    { id: "lb2", label: "🧠 Second Brain Pro", targetUrl: "https://aarav.so/second-brain", productId: "prod_2", clickCount: 566, isActive: true },
    { id: "lb3", label: "🗂 Client Dashboard Kit", targetUrl: "https://aarav.so/dashboard", productId: "prod_3", clickCount: 431, isActive: true },
    { id: "lb4", label: "🎙 The Build Log (podcast)", targetUrl: "https://aarav.so/podcast", clickCount: 190, isActive: true },
    { id: "lb5", label: "💌 Join 42k readers", targetUrl: "https://aarav.so/newsletter", clickCount: 878, isActive: false },
  ],
};

export const DEMO_CONTENT: ContentPlan[] = [
  { id: "cp1", title: "“I automated my DMs for 30 days — here's what happened”", hook: "Day 1 vs Day 30 numbers side by side", status: "published", plannedFor: Date.now() - 3 * DAY },
  { id: "cp2", title: "Notion template teardown: my ₹40k stack", hook: "Show, don't tell — screen recording", status: "published", plannedFor: Date.now() - 9 * DAY },
  { id: "cp3", title: "“The DM is the new landing page”", hook: "Cold open with a real DM screenshot", status: "scheduled", plannedFor: Date.now() + 2 * DAY },
  { id: "cp4", title: "Client dashboard in 9 minutes", hook: "Timelapse + downloadable at the end", status: "drafting", plannedFor: Date.now() + 5 * DAY },
  { id: "cp5", title: "Steal my launch week checklist", hook: "Carousel → reel hybrid", status: "idea", plannedFor: Date.now() + 9 * DAY },
  { id: "cp6", title: "“Why I turned off link comments”", hook: "Contrarian take, soft CTA", status: "idea", plannedFor: Date.now() + 12 * DAY },
];

export const DEMO_ACTIVITY: ActivityEvent[] = [
  { id: "ev1", at: Date.now() - 42_000, kind: "comment", text: "@notionwithneha commented “notion”", meta: "Reel · Creator OS" },
  { id: "ev2", at: Date.now() - 51_000, kind: "dm", text: "DM delivered to @meghnabuilds", meta: "3-button card · 38s human delay" },
  { id: "ev3", at: Date.now() - 96_000, kind: "lead", text: "New lead captured — @priya.designs", meta: "Follower · via “template”" },
  { id: "ev4", at: Date.now() - 140_000, kind: "click", text: "@meghnabuilds clicked “Download free pack”", meta: "short link · aarav.so/c/os" },
  { id: "ev5", at: Date.now() - 240_000, kind: "comment", text: "@rohitcodes commented “dashboard”", meta: "Reel · Client Dashboard" },
  { id: "ev6", at: Date.now() - 320_000, kind: "dm", text: "DM delivered to @rohitcodes", meta: "2-button card · 61s human delay" },
  { id: "ev7", at: Date.now() - 480_000, kind: "system", text: "Human takeover on @wanderlustsha", meta: "Manual reply · auto-paused 30 min" },
  { id: "ev8", at: Date.now() - 620_000, kind: "lead", text: "New lead captured — @arjun.exe", meta: "Non-follower · followed after gate" },
];

/* 14-day chart series (comments, dms, clicks) */
export const DM_SERIES: { day: string; comments: number; dms: number; clicks: number }[] = [
  { day: "Sep 27", comments: 212, dms: 168, clicks: 74 },
  { day: "Sep 28", comments: 258, dms: 201, clicks: 89 },
  { day: "Sep 29", comments: 301, dms: 246, clicks: 112 },
  { day: "Sep 30", comments: 284, dms: 233, clicks: 104 },
  { day: "Oct 1", comments: 342, dms: 296, clicks: 141 },
  { day: "Oct 2", comments: 398, dms: 341, clicks: 167 },
  { day: "Oct 3", comments: 455, dms: 388, clicks: 202 },
  { day: "Oct 4", comments: 421, dms: 362, clicks: 188 },
  { day: "Oct 5", comments: 502, dms: 431, clicks: 226 },
  { day: "Oct 6", comments: 547, dms: 472, clicks: 251 },
  { day: "Oct 7", comments: 590, dms: 511, clicks: 278 },
  { day: "Oct 8", comments: 561, dms: 489, clicks: 263 },
  { day: "Oct 9", comments: 634, dms: 552, clicks: 297 },
  { day: "Oct 10", comments: 689, dms: 601, clicks: 331 },
];

export const TIER_CREDIT_LIMITS: Record<Tier, number> = { free: 3, pro: 500, studio: 5000 };

export const TIER_META: Record<Tier, { name: string; price: string; blurb: string }> = {
  free: { name: "Free", price: "₹0", blurb: "1 automated reel · 3 AI credits" },
  pro: { name: "Pro", price: "₹149/mo", blurb: "Unlimited reels · 500 AI credits" },
  studio: { name: "Studio", price: "₹399/mo", blurb: "3 accounts · Canvas · 5,000 credits" },
};

export const timeAgo = (ts: number): string => {
  const diff = Date.now() - ts;
  if (diff < MIN) return `${Math.max(1, Math.floor(diff / 1000))}s ago`;
  if (diff < HOUR) return `${Math.floor(diff / MIN)}m ago`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)}h ago`;
  return `${Math.floor(diff / DAY)}d ago`;
};

export const fmtNum = (n: number): string =>
  n >= 1000 ? `${(n / 1000).toFixed(n >= 10_000 ? 0 : 1)}k` : String(n);
