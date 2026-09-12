import type { D1Database } from "@cloudflare/workers-types";

export interface Env {
  DB: D1Database;
  ENVIRONMENT: string;
  META_APP_SECRET: string;
  META_VERIFY_TOKEN: string;
  META_GRAPH_API_VERSION?: string;
  JWT_SECRET: string;
  ENCRYPTION_MASTER_KEY?: string;
  RESEND_API_KEY?: string;
  LEMON_SQUEEZY_WEBHOOK_SECRET?: string;
}

export * from "./queries";
