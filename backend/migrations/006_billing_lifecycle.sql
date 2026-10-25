-- =====================================================================
-- Migration 006 — billing lifecycle + migration ledger
--
-- Apply to an EXISTING D1 database (or let scripts/migrate.mjs do it):
--   wrangler d1 execute relo-d1 --remote --file=./migrations/006_billing_lifecycle.sql
--   wrangler d1 execute relo-d1 --local  --file=./migrations/006_billing_lifecycle.sql
--
-- What changes and why:
--   1. A provider order can only be activated once. Lemon Squeezy retries
--      webhooks aggressively; this unique index makes the handler idempotent
--      at the database level instead of trusting application logic.
--   2. schema_migrations is the ledger scripts/migrate.mjs reads, so a
--      deployment can tell which files have already run.
--   3. users.plan_expires_at records when a paid plan lapses. 0 means "no
--      expiry recorded" (comped / grandfathered) and is never auto-downgraded.
--
-- The ALTER is deliberately last: SQLite has no `ADD COLUMN IF NOT EXISTS`, so
-- on a database created from schema.sql it reports "duplicate column name".
-- Keeping the index and ledger above it means those still exist even if the
-- client stops at that (safe) error.
-- =====================================================================

CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_external_ref
  ON payments(provider, external_ref) WHERE external_ref IS NOT NULL;

CREATE TABLE IF NOT EXISTS schema_migrations (
  version TEXT PRIMARY KEY,
  applied_at INTEGER NOT NULL DEFAULT (unixepoch())
);

ALTER TABLE users ADD COLUMN plan_expires_at INTEGER NOT NULL DEFAULT 0;
