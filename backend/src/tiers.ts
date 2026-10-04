/**
 * Tier limits — the single source of truth for plan.md §3.
 *
 * Everything the router enforces lives here so the Pro/Studio gates can never
 * drift between endpoints, and so tests can assert the matrix directly.
 */

export type Plan = "free" | "pro" | "studio";

export const PLAN_ORDER: Record<Plan, number> = { free: 0, pro: 1, studio: 2 };

export interface TierLimits {
  /** Comment-reply variations. Free is pinned to exactly 2. */
  minVariations: number;
  maxVariations: number;
  /** Own DM buttons the user configures (RELO's branded button is extra on Free). */
  minOwnButtons: number;
  maxOwnButtons: number;
  /** RELO injects its own branded button on Free only. */
  brandedButton: boolean;
  /** Follow-up DMs (§4.2). */
  followUps: boolean;
  /** Campaigns (§4.3). */
  campaigns: boolean;
  /** Canvas node builder. */
  canvas: boolean;
  /** Connected Instagram accounts (§3). */
  maxAccounts: number;
  /** Queue priority (§5): Studio jumps ahead of Normal in the cron batch. */
  queuePriority: "normal" | "priority";
  /** Monthly AI credits (§3). */
  aiCredits: number;
  /** Products library (§4.4). */
  products: boolean;
}

export const TIER_LIMITS: Record<Plan, TierLimits> = {
  free: {
    minVariations: 2,
    maxVariations: 2,
    minOwnButtons: 1,
    maxOwnButtons: 2,
    brandedButton: true,
    followUps: false,
    campaigns: false,
    canvas: false,
    maxAccounts: 1,
    queuePriority: "normal",
    aiCredits: 3,
    products: false,
  },
  pro: {
    minVariations: 3,
    maxVariations: 8,
    minOwnButtons: 1,
    maxOwnButtons: 3,
    brandedButton: false,
    followUps: true,
    campaigns: true,
    canvas: false,
    maxAccounts: 1,
    queuePriority: "normal",
    aiCredits: 500,
    products: true,
  },
  studio: {
    minVariations: 3,
    maxVariations: 8,
    minOwnButtons: 1,
    maxOwnButtons: 3,
    brandedButton: false,
    followUps: true,
    campaigns: true,
    canvas: true,
    maxAccounts: 3,
    queuePriority: "priority",
    aiCredits: 5000,
    products: true,
  },
};

export function isPlan(value: unknown): value is Plan {
  return value === "free" || value === "pro" || value === "studio";
}

export function normalizePlan(value: unknown): Plan {
  return isPlan(value) ? value : "free";
}

export function limitsFor(plan: unknown): TierLimits {
  return TIER_LIMITS[normalizePlan(plan)];
}

/**
 * Plan ranking. A plan gate passes when the account's tier is at least as high
 * as the required tier (e.g. Studio satisfies a Pro gate).
 */
export function planSatisfies(actual: unknown, required: Plan): boolean {
  return PLAN_ORDER[normalizePlan(actual)] >= PLAN_ORDER[required];
}