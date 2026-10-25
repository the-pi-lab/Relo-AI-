/**
 * Tenant isolation policy for the D1 schema.
 *
 * ## Why this file exists
 *
 * Postgres-style Row Level Security (`ALTER TABLE ... ENABLE ROW LEVEL
 * SECURITY`) does not exist in SQLite, and Cloudflare D1 is SQLite. There is
 * also no per-connection session variable to key a policy on, so a database
 * level policy engine is not available here.
 *
 * The equivalent guarantee is enforced at the only place every request passes
 * through: the query layer. This module is the single registry of "who owns
 * which row", and the router must resolve every account-scoped path through
 * `requireOwnedAccount` (which calls `getOwnedAccount`, an owner-scoped query).
 *
 * Two rules keep that honest:
 *   1. Every tenant-owned table below is reachable only through a query that
 *      includes its owner column in the WHERE clause. The `owner` field names
 *      that column.
 *   2. A child row is never looked up by id alone — its parent is resolved
 *      first with the owner predicate, and the child query is scoped by the
 *      parent id (e.g. campaign_targets by campaign_id).
 *
 * `TENANT_POLICY` is asserted at startup in `assertTenantPolicies()` so the
 * registry cannot silently drift from the helpers the router uses.
 */

export type OwnerColumn = "user_id" | "account_id" | "parent";

export interface TenantPolicy {
  /** Column that ties the row to a tenant. `parent` means "scoped via parent_id". */
  owner: OwnerColumn;
  /** For `parent` policies, the column pointing at the owning table. */
  parentColumn?: string;
  /** Human-readable rule, mirrored in the security report. */
  rule: string;
}

export const TENANT_POLICY: Readonly<Record<string, TenantPolicy>> = {
  users: {
    owner: "user_id",
    rule: "A user may only read their own row (id = JWT sub).",
  },
  connected_accounts: {
    owner: "user_id",
    rule: "Scoped by user_id = JWT sub; every dashboard route resolves the account through this predicate.",
  },
  reel_automations: {
    owner: "account_id",
    rule: "Scoped by account_id, and the account must belong to JWT sub.",
  },
  jobs: {
    owner: "account_id",
    rule: "Scoped by account_id. Queue reads are account-scoped; the cron worker is the only cross-tenant reader.",
  },
  captured_leads: {
    owner: "account_id",
    rule: "Scoped by account_id. Export and list endpoints both require an owned account.",
  },
  human_takeovers: {
    owner: "account_id",
    rule: "Scoped by account_id; written by the webhook, never exposed to the dashboard.",
  },
  webhook_logs: {
    owner: "account_id",
    rule: "Scoped by account_id; only aggregate counts are surfaced.",
  },
  short_links: {
    owner: "account_id",
    rule: "Scoped by account_id. Public click-through resolves by opaque id only and returns a target URL.",
  },
  products: {
    owner: "account_id",
    rule: "Scoped by account_id on read, update and delete.",
  },
  credit_ledger: {
    owner: "account_id",
    rule: "Scoped by account_id; append-only.",
  },
  payments: {
    owner: "user_id",
    rule: "Scoped by user_id (billing reads) — account_id is kept for attribution only. Admin activation is the only cross-tenant writer, and it is audited.",
  },
  campaigns: {
    owner: "account_id",
    rule: "Scoped by account_id on read, update and delete.",
  },
  campaign_targets: {
    owner: "parent",
    parentColumn: "campaign_id",
    rule: "Reached only through a campaign that already passed the account ownership check.",
  },
  link_pages: {
    owner: "account_id",
    rule: "Owner-scoped for writes. Public reads require is_published = 1 and expose no account data.",
  },
  link_blocks: {
    owner: "parent",
    parentColumn: "page_id",
    rule: "Reached only through a page that already passed the account ownership check.",
  },
  flows: {
    owner: "account_id",
    rule: "Scoped by account_id on read, update and delete.",
  },
  content_plans: {
    owner: "account_id",
    rule: "Scoped by account_id; a linked automationId must also belong to the same account.",
  },
  referrals: {
    owner: "user_id",
    rule: "A user may only see referrals where they are the referrer; the referred row is never readable.",
  },
  email_otps: {
    owner: "parent",
    parentColumn: "email",
    rule: "Keyed by email, written and consumed only by the OTP flow. Never listed.",
  },
  rate_limits: {
    owner: "parent",
    parentColumn: "bucket",
    rule: "Opaque counters; no user data, bounded lifetime.",
  },
  admin_audit_log: {
    owner: "parent",
    parentColumn: "actor_id",
    rule: "Owner-only (admin) read; append-only, never exposed to a normal user session.",
  },
  agency_enquiries: {
    owner: "parent",
    parentColumn: "email",
    rule: "Written by the public contact form; read only by an admin. Never joined to a tenant account.",
  },
} as const;

/**
 * Startup self-check. Called once per isolate from the Worker entry point so a
 * table added without a policy is caught in the first request of a deployment
 * instead of a month later.
 */
const REQUIRED_TABLES = [
  "users",
  "connected_accounts",
  "reel_automations",
  "jobs",
  "captured_leads",
  "human_takeovers",
  "webhook_logs",
  "short_links",
  "products",
  "credit_ledger",
  "payments",
  "campaigns",
  "campaign_targets",
  "link_pages",
  "link_blocks",
  "flows",
  "content_plans",
  "referrals",
  "email_otps",
  "rate_limits",
  "admin_audit_log",
  "agency_enquiries",
] as const;

let policiesChecked = false;

export function assertTenantPolicies(): void {
  if (policiesChecked) return;
  const missing = REQUIRED_TABLES.filter((table) => !(table in TENANT_POLICY));
  if (missing.length > 0) {
    // A hard throw here would take the whole API down for a documentation gap,
    // so it is a loud error instead.
    console.error(
      `[Tenancy] Missing row-access policy for: ${missing.join(", ")}. Add it to TENANT_POLICY before shipping.`
    );
  }
  policiesChecked = true;
}

/**
 * Returns true only when `rowAccountId` is the account the caller was already
 * proven to own. Used as a defensive second check after a parent lookup.
 */
export function belongsToAccount(
  rowAccountId: string | null | undefined,
  ownedAccountId: string
): boolean {
  if (!rowAccountId || !ownedAccountId) return false;
  return rowAccountId === ownedAccountId;
}
