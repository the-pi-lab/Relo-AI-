-- =====================================================================
-- Migration 007 — server-side session ledger (JWT revocation)
--
-- Apply to an EXISTING D1 database (or let scripts/migrate.mjs do it):
--   wrangler d1 execute relo-d1 --remote --file=./migrations/007_sessions.sql
--   wrangler d1 execute relo-d1 --local  --file=./migrations/007_sessions.sql
--
-- A signed JWT is valid until it expires, which means "log out" and "sign out
-- everywhere" cannot actually revoke anything on their own. Every token now
-- carries a `jti`; the API only accepts a token whose `jti` has a live row in
-- this table. Logging out sets revoked_at, and authentication stops there.
--
-- Fresh installs get this table from schema.sql (CREATE IF NOT EXISTS makes
-- this migration harmless on such a database).
-- =====================================================================

CREATE TABLE IF NOT EXISTS sessions (
  jti TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  expires_at INTEGER NOT NULL,
  revoked_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id, revoked_at);
CREATE INDEX IF NOT EXISTS idx_sessions_expiry ON sessions(expires_at);
