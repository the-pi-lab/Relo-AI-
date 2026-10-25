-- =====================================================================
-- Migration 002 — jobs.matched_automation_id → ON DELETE SET NULL
--
-- Apply to an EXISTING D1 database created before this fix. Fresh installs
-- already get the corrected foreign key from schema.sql, so this file is a
-- no-op for them (it rebuilds the table with identical data).
--
--   wrangler d1 execute relo-d1 --remote --file=./migrations/002_jobs_automation_fk.sql
--   wrangler d1 execute relo-d1 --local  --file=./migrations/002_jobs_automation_fk.sql
--
-- Why: deleting an automation that had ever matched a job failed with
-- "FOREIGN KEY constraint failed". The application also detaches jobs before
-- deleting (see deleteReelAutomation), so this migration is an extra guard
-- rather than the only line of defence. It is safe to run more than once.
--
-- SQLite cannot ALTER a foreign key, so the table is rebuilt inside a single
-- transaction: create → copy → drop → rename. Indexes are recreated after.
-- =====================================================================

PRAGMA defer_foreign_keys = ON;

BEGIN;

CREATE TABLE jobs_new (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES connected_accounts(id) ON DELETE CASCADE,
  comment_id TEXT UNIQUE NOT NULL,
  commenter_user_id TEXT NOT NULL,
  commenter_username TEXT NOT NULL,
  comment_text TEXT NOT NULL,
  post_id TEXT NOT NULL,
  matched_automation_id TEXT REFERENCES reel_automations(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'processing', 'completed', 'failed')),
  retry_count INTEGER DEFAULT 0,
  send_at INTEGER NOT NULL,
  error_message TEXT,
  response_mid TEXT,
  public_reply_id TEXT,
  parent_job_id TEXT REFERENCES jobs_new(id) ON DELETE SET NULL,
  is_follow_up INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
);

INSERT INTO jobs_new (
  id, account_id, comment_id, commenter_user_id, commenter_username,
  comment_text, post_id, matched_automation_id, status, retry_count,
  send_at, error_message, response_mid, public_reply_id, parent_job_id,
  is_follow_up, created_at, updated_at
)
SELECT
  id, account_id, comment_id, commenter_user_id, commenter_username,
  comment_text, post_id, matched_automation_id, status, retry_count,
  send_at, error_message, response_mid, public_reply_id, parent_job_id,
  is_follow_up, created_at, updated_at
FROM jobs;

DROP TABLE jobs;

ALTER TABLE jobs_new RENAME TO jobs;

CREATE INDEX IF NOT EXISTS idx_jobs_cron_poll ON jobs(status, send_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_jobs_account ON jobs(account_id);

COMMIT;
