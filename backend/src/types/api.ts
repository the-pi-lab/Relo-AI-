import type { AccountId, InstagramUserId, LeadId, MediaId, UserId } from "./ids";

/**
 * Standard API Result Envelope Pattern
 */
export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string; details?: unknown } };

/**
 * User & Connected Account
 */
export interface UserProfile {
  id: UserId;
  email: string;
  createdAt: number;
}

export interface ConnectedAccount {
  id: AccountId;
  userId: UserId;
  instagramUserId: InstagramUserId;
  username: string;
  profilePictureUrl?: string;
  tokenExpiresAt: number; // Unix timestamp
  daysUntilExpiration: number;
  isActive: boolean;
  createdAt: number;
}

/**
 * Captured Lead Model (100% User Owned)
 */
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

/**
 * Recent Reel Media
 */
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

/**
 * System Health & Telemetry Metrics
 */
export interface SystemTelemetry {
  status: "healthy" | "degraded" | "error" | "idle";
  queueDepth: number;
  pendingJobs: number;
  completed24h: number;
  failed24h: number;
  averageLatencyMs: number;
  rateLimitUsagePercent: number;
}
