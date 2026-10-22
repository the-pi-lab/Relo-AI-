-- =====================================================================
-- Migration 001 — security hardening
--
-- Apply to an EXISTING D1 database that was created before the security
-- review. `schema.sql` already contains all of this for fresh installs, so
-- run ONE of:
--
--   wrangler d1 execute relo-d1 --remote --file=./migrations/001_security_hardening.sql
--   wrangler d1 execute relo-d1 --local  --file=./migrations/001_security_hardening.sql
--
-- Everything here is additive and idempotent-safe on a database that has
-- already been created from the new schema.sql (SQLite has no
-- `ADD COLUMN IF NOT EXISTS`, so the ALTER below will report
-- "duplicate column name" — that error is safe to ignore).
-- =====================================================================

-- 1. Server-side admin role. Never inferred from the UI or a JWT claim.
ALTER TABLE users ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0;

-- 2. Durable rate-limit counters (login/signup/contact/admin/expensive calls).
CREATE TABLE IF NOT EXISTS rate_limits (
  bucket TEXT PRIMARY KEY,
  window_start INTEGER NOT NULL,
  count INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON rate_limits(window_start);

-- 3. Append-only admin audit trail.
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id TEXT PRIMARY KEY,
  actor_type TEXT NOT NULL CHECK(actor_type IN ('user', 'secret')),
  actor_id TEXT NOT NULL,
  actor_email TEXT,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  success INTEGER NOT NULL DEFAULT 1,
  ip TEXT,
  metadata TEXT,
  created_at INTEGER DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_created ON admin_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_actor ON admin_audit_log(actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_target ON admin_audit_log(target_type, target_id);

-- 4. Grant the owner's account admin rights. Replace the address before running.
-- UPDATE users SET is_admin = 1 WHERE email = 'owner@relo.ai';
