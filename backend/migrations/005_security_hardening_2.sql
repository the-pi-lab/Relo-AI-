-- =====================================================================
-- Migration 005 — security hardening, part 2
--
-- Apply to an EXISTING D1 database:
--   wrangler d1 execute relo-d1 --remote --file=./migrations/005_security_hardening_2.sql
--   wrangler d1 execute relo-d1 --local  --file=./migrations/005_security_hardening_2.sql
--
-- Fresh installs already get all of this from schema.sql. On such a database
-- the ALTERs report "duplicate column name" — safe to ignore, exactly like
-- migrations 001 and 004.
--
-- What changes and why:
--   1. OTP codes are stored hashed, not in plaintext.
--   2. connected_accounts keeps the long-lived USER token, because Meta's
--      fb_exchange_token grant cannot renew a page token.
--   3. human_takeovers is unique per thread, so the pause upsert cannot grow
--      the table by one row per inbound DM.
--   4. message_mids dedupes webhook redeliveries and recognizes our own echoes.
--   5. ai_thread_state holds the per-thread AI reply cooldown.
-- =====================================================================

-- 1. OTP hashing -------------------------------------------------------
-- SQLite cannot rename a column in place on older engines, so add the new
-- column, then drop the old plaintext one by rebuilding the table.
ALTER TABLE email_otps ADD COLUMN code_hash TEXT;
-- Legacy rows cannot be re-hashed (the plaintext is what we are removing), and
-- every code expires within 10 minutes: clearing them is the safe choice.
DELETE FROM email_otps;

CREATE TABLE email_otps_new (
  email TEXT PRIMARY KEY,
  code_hash TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER DEFAULT (unixepoch()),
  attempts INTEGER NOT NULL DEFAULT 0,
  last_sent_at INTEGER DEFAULT 0
);

INSERT INTO email_otps_new (email, code_hash, expires_at, created_at, attempts, last_sent_at)
SELECT email, COALESCE(code_hash, ''), expires_at, created_at, attempts, last_sent_at
FROM email_otps;

DROP TABLE email_otps;
ALTER TABLE email_otps_new RENAME TO email_otps;

-- 2. Long-lived user token --------------------------------------------
ALTER TABLE connected_accounts ADD COLUMN user_token_encrypted TEXT;
ALTER TABLE connected_accounts ADD COLUMN user_token_expires_at INTEGER NOT NULL DEFAULT 0;

-- 3. One takeover pause per (account, thread) -------------------------
-- Collapse duplicates first, keeping the latest pause, so the unique index
-- can be created on a database that already accumulated rows.
DELETE FROM human_takeovers
 WHERE id NOT IN (
   SELECT id FROM (
     SELECT id,
            ROW_NUMBER() OVER (
              PARTITION BY account_id, thread_id
              ORDER BY paused_until DESC, created_at DESC
            ) AS rn
       FROM human_takeovers
   ) WHERE rn = 1
 );

CREATE UNIQUE INDEX IF NOT EXISTS idx_takeover_thread
  ON human_takeovers(account_id, thread_id);

-- 4. Message-id ledger ------------------------------------------------
CREATE TABLE IF NOT EXISTS message_mids (
  mid TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES connected_accounts(id) ON DELETE CASCADE,
  thread_id TEXT NOT NULL,
  direction TEXT NOT NULL CHECK(direction IN ('in', 'out')),
  created_at INTEGER DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_message_mids_thread
  ON message_mids(account_id, thread_id, created_at DESC);

-- 5. AI per-thread cooldown -------------------------------------------
CREATE TABLE IF NOT EXISTS ai_thread_state (
  account_id TEXT NOT NULL REFERENCES connected_accounts(id) ON DELETE CASCADE,
  thread_id TEXT NOT NULL,
  last_ai_reply_at INTEGER NOT NULL DEFAULT 0,
  last_inbound_at INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (account_id, thread_id)
);
