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
}

export interface SystemTelemetry {
  status: "healthy" | "degraded" | "error" | "idle";
  queueDepth: number;
  pendingJobs: number;
  completed24h: number;
  failed24h: number;
  averageLatencyMs: number;
  rateLimitUsagePercent: number;
}

export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string; details?: unknown } };
