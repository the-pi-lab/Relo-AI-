/**
 * Shared Type Contracts between RELO Frontend and Cloudflare Workers Engine
 */

export type UserId = string & { readonly __brand: "UserId" };
export type AccountId = string & { readonly __brand: "AccountId" };
export type InstagramUserId = string & { readonly __brand: "InstagramUserId" };
export type MediaId = string & { readonly __brand: "MediaId" };
export type CommentId = string & { readonly __brand: "CommentId" };
export type JobId = string & { readonly __brand: "JobId" };
export type AutomationId = string & { readonly __brand: "AutomationId" };
export type LeadId = string & { readonly __brand: "LeadId" };

export const asUserId = (id: string): UserId => id as unknown as UserId;
export const asAccountId = (id: string): AccountId => id as unknown as AccountId;
export const asInstagramUserId = (id: string): InstagramUserId => id as unknown as InstagramUserId;
export const asMediaId = (id: string): MediaId => id as unknown as MediaId;
export const asCommentId = (id: string): CommentId => id as unknown as CommentId;
export const asJobId = (id: string): JobId => id as unknown as JobId;
export const asAutomationId = (id: string): AutomationId => id as unknown as AutomationId;
export const asLeadId = (id: string): LeadId => id as unknown as LeadId;

export type WebUrlButton = {
  type: "web_url";
  url: string;
  title: string;
};

export type PostbackButton = {
  type: "postback";
  title: string;
  payload: string;
};

export type PhoneButton = {
  type: "phone_number";
  title: string;
  payload: string;
};

export type GenericTemplateButton = WebUrlButton | PostbackButton | PhoneButton;

export interface TemplateCardConfig {
  title: string;
  subtitle?: string;
  imageUrl?: string;
  buttons: [GenericTemplateButton, ...GenericTemplateButton[]];
}

export interface ReelAutomation {
  id: AutomationId;
  accountId: AccountId;
  instagramMediaId: MediaId;
  reelPermalink: string;
  reelThumbnailUrl?: string;
  triggerKeywords: string[];
  commentReplies: string[]; // Min 3, max 8
  followGateEnabled: boolean;
  templateCard: TemplateCardConfig;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
  followUpEnabled: boolean;
  followUpDelayMinutes: number;
  shortLinks?: Array<{ id: string; buttonIndex: number; targetUrl: string; clickCount: number }>;
}

/**
 * Product library row (plan.md §4.4 / §5). Feeds AI product-Q&A and the
 * link-in-bio page. Capped at 50 per account so the catalog fits in one
 * AI prompt — no RAG at MVP.
 */
export interface Product {
  id: string;
  accountId: string;
  name: string;
  priceText?: string;
  description?: string;
  link?: string;
  imageUrl?: string;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface CapturedLead {
  id: LeadId;
  accountId: AccountId;
  instagramScopedId: InstagramUserId;
  username?: string;
  followerStatusAtTrigger: boolean;
  emailCollected?: string;
  totalDmsSent: number;
  firstInteractionAt: number;
  lastInteractionAt: number;
}

/* ── Campaigns (plan.md §4.3 / Phase 3) ── */

export type CampaignStatus =
  | "draft"
  | "scheduled"
  | "sending"
  | "completed"
  | "failed"
  | "cancelled";

export type CampaignTargetStatus = "pending" | "sent" | "failed" | "unreachable";

export type CampaignFailureReason = "retryable" | "window_expired" | "token_dead";

export interface CampaignCardPayload {
  title: string;
  subtitle?: string;
  imageUrl?: string;
  buttons: Array<{ type: string; title: string; url?: string }>;
}

export interface CampaignPayload {
  kind: "text" | "card";
  text?: string;
  card?: CampaignCardPayload;
}

export interface Campaign {
  id: string;
  accountId: AccountId;
  mediaId: string;
  payload: CampaignPayload | null;
  status: CampaignStatus;
  scheduledAt: number;
  sentCount: number;
  failedCount: number;
  unreachableCount: number;
  /** HUMAN_AGENT tag extends Meta's window from 24h to 7 days. */
  usesHumanAgentTag: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface CampaignTarget {
  id: string;
  campaignId: string;
  leadId: LeadId;
  status: CampaignTargetStatus;
  failureReason?: CampaignFailureReason;
  dispatchedMid?: string;
  sentAt?: number;
}

/** "X of Y commenters still reachable" — the number plan.md §4.3 demands. */
export interface Reachability {
  total: number;
  reachable: number;
  unreachable: number;
}

/* ── Canvas flows (plan.md §7 Phase 3) ── */

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

export interface FlowGraph {
  nodes: FlowNode[];
  edges: FlowEdge[];
}

export interface Flow {
  id: string;
  accountId: AccountId;
  name: string;
  graph: FlowGraph;
  isActive: boolean;
  isPublished: boolean;
  createdAt: number;
  updatedAt: number;
}

/* ── Referrals (plan.md §7 Phase 3) ── */

export interface ReferralSummary {
  code: string;
  shareUrl: string;
  referredCount: number;
  qualifiedCount: number;
  rewardedCount: number;
  /** Free months of Pro earned so far. */
  rewardMonthsEarned: number;
}

export interface InstagramReelMedia {
  id: MediaId;
  permalink: string;
  mediaType: "VIDEO" | "REELS";
  mediaUrl?: string;
  thumbnailUrl?: string;
  caption?: string;
  timestamp: string;
  commentsCount?: number;
  likeCount?: number;
  hasActiveAutomation: boolean;
}

export type Tier = "free" | "pro" | "studio";

export interface ConnectedAccount {
  id: AccountId;
  userId: UserId;
  instagramUserId: InstagramUserId;
  username: string;
  profilePictureUrl?: string;
  tokenExpiresAt: number;
  daysUntilExpiration: number;
  isActive: boolean;
  createdAt: number;
  plan: Tier;
  aiCreditsRemaining: number;
  aiCreditsResetAt: number;
  freeReelConsumed: boolean;
}

export interface SystemTelemetry {
  status: "healthy" | "degraded";
  queueDepth: number;
  pendingJobs: number;
  completed24h: number;
  failed24h: number;
  totalClicks?: number;
  storageRows?: number;
  plan?: Tier;
  aiCreditsRemaining?: number;
}

export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string; details?: unknown } };

/* ── Link in bio (plan.md §4.5 / Phase 2) ── */

export interface LinkPage {
  id: string;
  accountId: AccountId;
  slug?: string;
  headline?: string;
  bio?: string;
  theme: "volt" | "plain" | "dark";
  isPublished: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface LinkBlock {
  id: string;
  pageId: string;
  shortLinkId?: string;
  productId?: string;
  targetUrl: string;
  label: string;
  position: number;
  clickCount: number;
  isActive: boolean;
}

/** A product as offered by the link-page picker (a trimmed catalog row). */
export interface LinkPageProduct {
  id: string;
  name: string;
  priceText?: string | null;
  link?: string | null;
  imageUrl?: string | null;
  description?: string | null;
}

/* ── Content planning (plan.md §7 Phase 2) ── */

export type ContentStatus = "idea" | "drafting" | "scheduled" | "published";

export interface ContentPlan {
  id: string;
  accountId: AccountId;
  title: string;
  hook?: string;
  caption?: string;
  status: ContentStatus;
  plannedFor: number;
  /** Set once the creator publishes the Reel themselves and links it. */
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
  /** Published plans that went on to generate at least one DM. */
  converting: number;
}
