import type { AccountId, AutomationId, MediaId } from "./ids";
import type { GenericTemplateButton } from "./meta";

/**
 * Enforces mandatory minimum of 3 and maximum of 8 reply variations
 * to satisfy Instagram anti-spam safety heuristics.
 */
export type MinimumThreeReplies = [string, string, string, ...string[]];

export type ReplyVariations = MinimumThreeReplies & {
  length: 3 | 4 | 5 | 6 | 7 | 8;
};

/**
 * Spintax Abstract Syntax Tree (AST) Types
 */
export type SpintaxNode =
  | { type: "literal"; value: string }
  | { type: "choice"; options: SpintaxNode[][] };

/**
 * 3-Button Generic Template configuration
 */
export interface TemplateCardConfig {
  title: string; // Bold headline (1 to 80 chars)
  subtitle?: string; // Descriptive supporting text (up to 80 chars)
  imageUrl?: string;
  buttons: [GenericTemplateButton, ...GenericTemplateButton[]]; // 1 to 3 buttons max
}

/**
 * Reel Automation Definition
 */
export interface ReelAutomation {
  id: AutomationId;
  accountId: AccountId;
  instagramMediaId: MediaId;
  reelPermalink: string;
  reelThumbnailUrl?: string;
  triggerKeywords: string[]; // Normalized keywords (e.g. ["GUIDE", "VIP"])
  commentReplies: string[]; // Min 3, Max 8 variations with {spintax}
  followGateEnabled: boolean;
  templateCard: TemplateCardConfig;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}
