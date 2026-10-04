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
  LEMON_SQUEEZY_WEBHOOK_SECRET?: string;
  DEBUG_OTPS?: string; // Only ever set outside production
  PUBLIC_BASE_URL?: string; // Worker origin — short links (/l/:id)
  PUBLIC_APP_URL?: string; // Frontend origin — RELO branding redirect target
  ADMIN_SECRET?: string; // Owner-only payment activation endpoint
  LEMON_SQUEEZY_CHECKOUT_URL?: string; // Global card checkout link
  MANUAL_UPI_ID?: string; // India UPI id shown at upgrade
  NIM_API_KEY?: string; // NVIDIA NIM — AI product-Q&A (plan.md §4.4). Optional: without it every DM takes the owner hand-off path, never a failure.
}

export * from "./queries";
