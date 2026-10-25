import type { D1Database } from "@cloudflare/workers-types";

export interface Env {
  DB: D1Database;
  ENVIRONMENT: string;
  META_APP_ID: string;
  META_APP_SECRET: string;
  META_VERIFY_TOKEN: string;
  META_GRAPH_API_VERSION?: string;
  JWT_SECRET: string;
  ENCRYPTION_MASTER_KEY?: string; // Required at runtime — no secret fallback
  RESEND_API_KEY?: string;
  RESEND_FROM_EMAIL?: string;
  LEMON_SQUEEZY_WEBHOOK_SECRET?: string;
  DEBUG_OTPS?: string; // Only ever set outside production
  /**
   * Pepper for hashing login OTPs. Falls back to `JWT_SECRET` so an existing
   * deployment keeps working, but a dedicated value is preferred: rotating the
   * JWT secret should not silently invalidate in-flight login codes.
   */
  OTP_PEPPER?: string;
  /**
   * Set to "1" once Meta has approved the HUMAN_AGENT tag for this app. Until
   * then the tag stays off the wire and campaigns keep the 24-hour window,
   * even if a campaign row says `usesHumanAgentTag`.
   */
  META_HUMAN_AGENT_APPROVED?: string;
  PUBLIC_BASE_URL?: string; // Worker origin — short links (/l/:id)
  PUBLIC_APP_URL?: string; // Frontend origin — RELO branding redirect target
  ADMIN_SECRET?: string; // Owner-only payment activation endpoint
  ADMIN_EMAILS?: string; // Comma-separated bootstrap admin emails (before is_admin is set)
  /** Comma-separated CORS allowlist. Never a wildcard. */
  ALLOWED_ORIGINS?: string;
  /** Cloudflare Turnstile secret for login/signup/contact. Missing = CAPTCHA skipped (logged). */
  TURNSTILE_SECRET_KEY?: string;
  /** Set to "1" to make a missing Turnstile secret a hard failure instead of a warning. */
  REQUIRE_CAPTCHA?: string;
  LEMON_SQUEEZY_CHECKOUT_URL?: string; // Global card checkout link
  /** Lemon Squeezy variant ids → tier. Without these the webhook cannot map a purchase. */
  LEMON_SQUEEZY_PRO_VARIANT_ID?: string;
  LEMON_SQUEEZY_STUDIO_VARIANT_ID?: string;
  MANUAL_UPI_ID?: string; // India UPI id shown at upgrade
  NIM_API_KEY?: string; // NVIDIA NIM — AI product-Q&A (plan.md §4.4). Optional: without it every DM takes the owner hand-off path, never a failure.
}

export * from "./queries";
