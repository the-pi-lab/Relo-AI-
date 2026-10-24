/**
 * Demo mode: a fully local session so the studio can be explored without a
 * backend account. `api.request` short-circuits to `demoResponse` whenever
 * the stored token is DEMO_TOKEN, so no network call ever leaves the browser
 * and no write is ever attempted against the real Worker.
 *
 * Only canned READ shapes live here; writes resolve to null and the API layer
 * turns that into a friendly "demo mode" error.
 */

import type {
  Account,
  Automation,
  Billing,
  Lead,
  LinkPageSnapshot,
  Product,
  Reel,
  SessionUser,
  Telemetry,
} from "./data";

export const DEMO_TOKEN = "demo.local-session";

export const DEMO_USER: SessionUser = {
  id: "demo-user",
  email: "demo@relo.app",
  createdAt: Math.floor(Date.now() / 1000),
};

const DEMO_ACCOUNT_ID = "demo-account";
const now = Math.floor(Date.now() / 1000);
const day = 86_400;

const demoAccount: Account = {
  id: DEMO_ACCOUNT_ID,
  userId: DEMO_USER.id,
  instagramUserId: "17841400000000000",
  username: "demo.studio",
  tokenExpiresAt: now + 55 * day,
  daysUntilExpiration: 55,
  isActive: true,
  createdAt: now - 42 * day,
  plan: "pro",
  aiCreditsRemaining: 180,
  aiCreditsResetAt: now + 12 * day,
  freeReelConsumed: true,
};

const demoReels: Reel[] = [
  {
    id: "demo-reel-1",
    permalink: "https://www.instagram.com/reel/DEMO1/",
    mediaType: "VIDEO",
    caption: "5 habits that changed my mornings ☀️ comment HABIT for the checklist",
    timestamp: new Date((now - 2 * day) * 1000).toISOString(),
    hasActiveAutomation: true,
  },
  {
    id: "demo-reel-2",
    permalink: "https://www.instagram.com/reel/DEMO2/",
    mediaType: "VIDEO",
    caption: "My full skincare routine — comment GLOW and I'll DM you the links",
    timestamp: new Date((now - 6 * day) * 1000).toISOString(),
    hasActiveAutomation: true,
  },
  {
    id: "demo-reel-3",
    permalink: "https://www.instagram.com/reel/DEMO3/",
    mediaType: "VIDEO",
    caption: "Studio tour finally here 🤍",
    timestamp: new Date((now - 11 * day) * 1000).toISOString(),
    hasActiveAutomation: false,
  },
];

const demoAutomations: Automation[] = [
  {
    id: "demo-auto-1",
    accountId: DEMO_ACCOUNT_ID,
    instagramMediaId: "demo-reel-1",
    reelPermalink: demoReels[0].permalink,
    triggerKeywords: ["habit", "checklist"],
    commentReplies: [
      "Just sent it to your DMs 🤍",
      "Check your inbox — the checklist is on its way!",
    ],
    templateCard: {
      title: "The Morning Habit Checklist",
      subtitle: "Free PDF — the exact 5 habits from the Reel",
      buttons: [
        { type: "web_url", title: "Get the checklist", url: "https://demo.relo.app/checklist" },
      ],
    },
    isActive: true,
    followUpEnabled: true,
    followUpDelayMinutes: 60,
    createdAt: now - 2 * day,
    updatedAt: now - 2 * day,
    shortLinks: [
      { id: "demo-link-1", buttonIndex: 0, targetUrl: "https://demo.relo.app/checklist", clickCount: 214 },
    ],
  },
  {
    id: "demo-auto-2",
    accountId: DEMO_ACCOUNT_ID,
    instagramMediaId: "demo-reel-2",
    reelPermalink: demoReels[1].permalink,
    triggerKeywords: ["glow", "link", "links"],
    commentReplies: ["Sending you the links now ✨"],
    templateCard: {
      title: "My Skincare Shelf",
      subtitle: "Every product from the routine, linked",
      buttons: [
        { type: "web_url", title: "Shop the routine", url: "https://demo.relo.app/shelf" },
        { type: "web_url", title: "Read the guide", url: "https://demo.relo.app/guide" },
      ],
    },
    isActive: true,
    followUpEnabled: false,
    followUpDelayMinutes: 30,
    createdAt: now - 6 * day,
    updatedAt: now - 5 * day,
    shortLinks: [
      { id: "demo-link-2", buttonIndex: 0, targetUrl: "https://demo.relo.app/shelf", clickCount: 158 },
      { id: "demo-link-3", buttonIndex: 1, targetUrl: "https://demo.relo.app/guide", clickCount: 61 },
    ],
  },
];

const demoLeads: Lead[] = [
  { id: "demo-lead-1", accountId: DEMO_ACCOUNT_ID, instagramScopedId: "s1", username: "priya.creates", followerStatusAtTrigger: true, emailCollected: "priya@example.com", totalDmsSent: 2, firstInteractionAt: now - 1 * day, lastInteractionAt: now - 20 * 3600 },
  { id: "demo-lead-2", accountId: DEMO_ACCOUNT_ID, instagramScopedId: "s2", username: "arjun.fit", followerStatusAtTrigger: true, totalDmsSent: 1, firstInteractionAt: now - 1 * day, lastInteractionAt: now - 18 * 3600 },
  { id: "demo-lead-3", accountId: DEMO_ACCOUNT_ID, instagramScopedId: "s3", username: "meera.makes", followerStatusAtTrigger: false, emailCollected: "meera@example.com", totalDmsSent: 2, firstInteractionAt: now - 2 * day, lastInteractionAt: now - 30 * 3600 },
  { id: "demo-lead-4", accountId: DEMO_ACCOUNT_ID, instagramScopedId: "s4", username: "kabir.codes", followerStatusAtTrigger: true, totalDmsSent: 1, firstInteractionAt: now - 2 * day, lastInteractionAt: now - 2 * day },
  { id: "demo-lead-5", accountId: DEMO_ACCOUNT_ID, instagramScopedId: "s5", username: "ana.eats", followerStatusAtTrigger: true, emailCollected: "ana@example.com", totalDmsSent: 3, firstInteractionAt: now - 3 * day, lastInteractionAt: now - 2 * day },
  { id: "demo-lead-6", accountId: DEMO_ACCOUNT_ID, instagramScopedId: "s6", username: "rohan.reads", followerStatusAtTrigger: false, totalDmsSent: 1, firstInteractionAt: now - 4 * day, lastInteractionAt: now - 4 * day },
  { id: "demo-lead-7", accountId: DEMO_ACCOUNT_ID, instagramScopedId: "s7", username: "tara.travels", followerStatusAtTrigger: true, totalDmsSent: 1, firstInteractionAt: now - 5 * day, lastInteractionAt: now - 5 * day },
  { id: "demo-lead-8", accountId: DEMO_ACCOUNT_ID, instagramScopedId: "s8", username: "dev.sketches", followerStatusAtTrigger: true, emailCollected: "dev@example.com", totalDmsSent: 2, firstInteractionAt: now - 6 * day, lastInteractionAt: now - 5 * day },
];

const demoTelemetry: Telemetry = {
  status: "healthy",
  queueDepth: 0,
  pendingJobs: 0,
  completed24h: 96,
  failed24h: 1,
  totalLeads: 412,
  totalComments: 1_284,
  totalDmsSent: 1_102,
  totalCommentsHeard: 1_284,
  totalDmsDelivered: 1_087,
  totalClicks: 433,
  storageRows: 3_210,
  plan: "pro",
  aiCreditsRemaining: 180,
  daily: Array.from({ length: 14 }, (_, index) => {
    const offset = 13 - index;
    const wave = Math.sin(index / 2.2) * 0.5 + 0.5;
    const comments = Math.round(40 + wave * 70 + (index % 3) * 8);
    return {
      day: new Date((now - offset * day) * 1000).toISOString().slice(0, 10),
      comments,
      dms: Math.round(comments * 0.86),
      leads: Math.round(comments * 0.32),
    };
  }),
  activity: [
    { id: "demo-ev-1", username: "priya.creates", comment: "HABIT please!!", status: "completed", at: now - 3600, triggerKeywords: ["habit"], isFollowUp: false },
    { id: "demo-ev-2", username: "arjun.fit", comment: "checklist 🙌", status: "completed", at: now - 2 * 3600, triggerKeywords: ["checklist"], isFollowUp: false },
    { id: "demo-ev-3", username: "meera.makes", comment: "glow ✨", status: "completed", at: now - 5 * 3600, triggerKeywords: ["glow"], isFollowUp: true },
    { id: "demo-ev-4", username: "kabir.codes", comment: "link?", status: "completed", at: now - 9 * 3600, triggerKeywords: ["link"], isFollowUp: false },
    { id: "demo-ev-5", username: "ana.eats", comment: "Habit", status: "failed", at: now - 14 * 3600, triggerKeywords: ["habit"], isFollowUp: false },
  ],
};

const demoProducts: Product[] = [
  {
    id: "demo-product-1",
    accountId: DEMO_ACCOUNT_ID,
    name: "Morning Habit Checklist (PDF)",
    priceText: "Free",
    description: "The 5-habit checklist from the Reel, as a printable PDF.",
    link: "https://demo.relo.app/checklist",
    isActive: true,
    createdAt: now - 20 * day,
    updatedAt: now - 2 * day,
  },
  {
    id: "demo-product-2",
    accountId: DEMO_ACCOUNT_ID,
    name: "Skincare Shelf Guide",
    priceText: "₹499",
    description: "Every product from the routine, with dupes and links.",
    link: "https://demo.relo.app/guide",
    isActive: true,
    createdAt: now - 15 * day,
    updatedAt: now - 6 * day,
  },
];

const demoBilling: Billing = {
  plan: "pro",
  aiCreditsRemaining: 180,
  payments: [
    {
      id: "demo-pay-1",
      provider: "upi",
      plan: "pro",
      amount_inr: 199,
      status: "verified",
      utr: "DEMO0000001",
      created_at: now - 30 * day,
      verified_at: now - 30 * day + 3600,
    },
  ],
  checkout: { lemonSqueezyUrl: null, upiId: "demo@upi" },
};

const demoLinkPage: LinkPageSnapshot = {
  page: null,
  blocks: [],
  products: demoProducts.map((p) => ({
    id: p.id,
    name: p.name,
    priceText: p.priceText,
    link: p.link,
    imageUrl: p.imageUrl,
  })),
  publicUrl: null,
};

/**
 * Returns the canned payload for a GET path, or null when the path is a
 * write or unknown — the API layer turns null into a demo-mode error.
 */
export function demoResponse(path: string, method: string): unknown | null {
  if (method !== "GET") return null;
  switch (path) {
    case "/api/accounts":
      return { accounts: [demoAccount] };
    case "/api/reels":
      return { reels: demoReels };
    case "/api/automations":
      return { automations: demoAutomations };
    case "/api/leads":
      return { leads: demoLeads, total: demoLeads.length };
    case "/api/analytics":
      return { telemetry: demoTelemetry };
    case "/api/billing":
      return demoBilling;
    case "/api/products":
      return { products: demoProducts };
    case "/api/campaigns":
      return { campaigns: [] };
    case "/api/flows":
      return { flows: [] };
    case "/api/link-page":
      return demoLinkPage;
    case "/api/content-plans":
      return { plans: [], stats: { idea: 0, drafting: 0, scheduled: 0, published: 0, converting: 0 } };
    default:
      return null;
  }
}
