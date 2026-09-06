/**
 * Managed-backend provider adapters (Phase 7).
 *
 * Honest scope: Chat Flow AI does NOT provision infrastructure on the user's
 * behalf — that would require holding the user's provider credentials and
 * billing, which contradicts the BYO model. Each adapter therefore describes
 * the best-supported guided flow (deploy buttons where providers genuinely
 * offer them, step-by-steps elsewhere) that ends in the same verified
 * "Connect backend" handshake.
 *
 * Adding a provider = adding one object to providers.ts. No app rewrite.
 */

export interface ProviderLink {
  label: string;
  url: string;
}

export interface ManagedProvider {
  /** Stable id, persisted on the backendRegistry row (e.g. "railway"). */
  id: string;
  name: string;
  tagline: string;
  bestFor: string;
  /** How Postgres is obtained on this provider. */
  postgres: string;
  /** Sleep/idle behavior that affects webhook reliability. */
  sleeps: string;
  /** Cost picture in one line (re-check provider pricing; it changes). */
  cost: string;
  /** Ordered setup steps shown in the UI and mirrored in customer-backend README. */
  steps: string[];
  /** Env vars the user must set (shared set lives in REQUIRED_ENV). */
  envVars: string[];
  links: ProviderLink[];
}

/** Env vars every deployment needs, regardless of provider. */
export const REQUIRED_ENV: string[] = [
  "DATABASE_URL",
  "META_APP_SECRET",
  "WEBHOOK_VERIFY_TOKEN",
  "BACKEND_AUTH_TOKEN",
  "IG_ACCOUNT_ID / IG_USERNAME / META_ACCESS_TOKEN",
  "ENCRYPTION_KEY (recommended)",
  "AI_PROVIDER + provider key (optional)",
];
