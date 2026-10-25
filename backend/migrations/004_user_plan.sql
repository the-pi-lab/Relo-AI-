-- =====================================================================
-- Migration 004 — subscription lives on the user, payments survive disconnect
--
-- Apply to an EXISTING D1 database:
--   wrangler d1 execute relo-d1 --remote --file=./migrations/004_user_plan.sql
--   wrangler d1 execute relo-d1 --local  --file=./migrations/004_user_plan.sql
--
-- Why: plan / credits / the free-reel slot lived on connected_accounts, and
-- payments cascaded off it. Disconnecting an Instagram account (or reconnecting
-- it, which used to delete + insert) silently downgraded a paying user to free
-- and deleted their payment history.
--
-- Fresh installs get all of this from schema.sql. On such a database the four
-- ALTERs below report "duplicate column name" — that is safe to ignore, exactly
-- like migration 001.
-- =====================================================================

ALTER TABLE users ADD COLUMN plan TEXT NOT NULL DEFAULT 'free' CHECK(plan IN ('free', 'pro', 'studio'));
ALTER TABLE users ADD COLUMN ai_credits_remaining INTEGER NOT NULL DEFAULT 3;
ALTER TABLE users ADD COLUMN ai_credits_reset_at INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN free_reel_consumed INTEGER NOT NULL DEFAULT 0;

-- Backfill from the best plan any of the user's accounts carries. A user who
-- already lost their paid row cannot be recovered here, but everything from
-- now on is durable.
UPDATE users SET
  plan = COALESCE((
    SELECT ca.plan FROM connected_accounts ca
     WHERE ca.user_id = users.id
     ORDER BY CASE ca.plan WHEN 'studio' THEN 3 WHEN 'pro' THEN 2 ELSE 1 END DESC
     LIMIT 1
  ), 'free'),
  ai_credits_remaining = COALESCE((
    SELECT ca.ai_credits_remaining FROM connected_accounts ca
     WHERE ca.user_id = users.id
     ORDER BY ca.ai_credits_remaining DESC
     LIMIT 1
  ), 3),
  ai_credits_reset_at = COALESCE((
    SELECT MAX(ca.ai_credits_reset_at) FROM connected_accounts ca
     WHERE ca.user_id = users.id
  ), 0),
  free_reel_consumed = COALESCE((
    SELECT MAX(ca.free_reel_consumed) FROM connected_accounts ca
     WHERE ca.user_id = users.id
  ), 0);

-- 2. Rebuild payments: account_id becomes nullable / ON DELETE SET NULL, a
--    durable user_id is added, and utr gets a UNIQUE index (race-safe claims).
PRAGMA defer_foreign_keys = ON;

BEGIN;

CREATE TABLE payments_new (
  id TEXT PRIMARY KEY,
  account_id TEXT REFERENCES connected_accounts(id) ON DELETE SET NULL,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK(provider IN ('lemon_squeezy', 'manual_upi')),
  external_ref TEXT,
  utr TEXT,
  plan TEXT NOT NULL CHECK(plan IN ('pro', 'studio')),
  amount_inr INTEGER,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'verified', 'rejected')),
  created_at INTEGER DEFAULT (unixepoch()),
  verified_at INTEGER
);

INSERT INTO payments_new (
  id, account_id, user_id, provider, external_ref, utr, plan, amount_inr, status,
  created_at, verified_at
)
SELECT
  p.id,
  p.account_id,
  (SELECT ca.user_id FROM connected_accounts ca WHERE ca.id = p.account_id),
  p.provider,
  p.external_ref,
  p.utr,
  p.plan,
  p.amount_inr,
  p.status,
  p.created_at,
  p.verified_at
FROM payments p;

DROP TABLE payments;

ALTER TABLE payments_new RENAME TO payments;

CREATE INDEX IF NOT EXISTS idx_payments_account ON payments(account_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_utr ON payments(utr) WHERE utr IS NOT NULL;

COMMIT;
