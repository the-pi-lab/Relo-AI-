-- Chat Flow AI customer backend — initial schema (v1).
-- Postgres-backed queue, no Redis. All dedup enforced with UNIQUE constraints.

CREATE TABLE IF NOT EXISTS schema_migrations (
  version TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Connected Instagram accounts. Tokens are customer-owned and never leave
-- this database. Stored as "enc:<base64>" (AES-256-GCM) when ENCRYPTION_KEY
-- is set, otherwise "plain:<token>" with a boot warning.
CREATE TABLE IF NOT EXISTS ig_accounts (
  instagram_id TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  access_token TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Automation flows (pushed from Chat Flow AI control panel, ids originate
-- there so future sync stays consistent).
CREATE TABLE IF NOT EXISTS flows (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  post_id TEXT,
  match_any_post BOOLEAN NOT NULL DEFAULT FALSE,
  keywords TEXT[] NOT NULL DEFAULT '{}',
  whole_word_match BOOLEAN NOT NULL DEFAULT TRUE,
  dm_trigger_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  dm_message TEXT NOT NULL DEFAULT '',
  public_reply_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  public_reply_message TEXT,
  require_follow BOOLEAN NOT NULL DEFAULT FALSE,
  follow_prompt_message TEXT,
  ai_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  ai_prompt TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_flows_active ON flows (is_active);

-- Seen-event ledger. A row here means "already handled" — the shared dedup
-- set for webhooks (retries/redeliveries hit the UNIQUE constraint and stop).
CREATE TABLE IF NOT EXISTS processed_events (
  event_key TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  account_id TEXT NOT NULL,
  seen_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_processed_events_seen ON processed_events (seen_at);

-- Durable job queue. Deterministic job_keys make enqueue idempotent:
-- the same comment+automation can never create two jobs.
CREATE TABLE IF NOT EXISTS jobs (
  id BIGSERIAL PRIMARY KEY,
  job_key TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  attempts INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 5,
  next_run_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  payload JSONB NOT NULL,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_jobs_poll ON jobs (status, next_run_at);

-- DM outcomes. UNIQUE(automation_id, comment_id) enforces Meta's rule of
-- exactly one private reply per comment, across all automations.
CREATE TABLE IF NOT EXISTS dm_logs (
  id BIGSERIAL PRIMARY KEY,
  automation_id TEXT NOT NULL REFERENCES flows (id) ON DELETE CASCADE,
  account_id TEXT NOT NULL,
  commenter_id TEXT NOT NULL,
  commenter_name TEXT,
  comment_text TEXT NOT NULL DEFAULT '',
  comment_id TEXT NOT NULL,
  matched_keyword TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  attempts INT NOT NULL DEFAULT 0,
  ai_used BOOLEAN NOT NULL DEFAULT FALSE,
  dm_sent_at TIMESTAMPTZ,
  public_reply_sent_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (automation_id, comment_id)
);
CREATE INDEX IF NOT EXISTS idx_dm_logs_comment ON dm_logs (comment_id);
CREATE INDEX IF NOT EXISTS idx_dm_logs_status ON dm_logs (status);

-- Minimal contact ledger (powers {username} personalization + future CRM).
CREATE TABLE IF NOT EXISTS contacts (
  id BIGSERIAL PRIMARY KEY,
  account_id TEXT NOT NULL,
  ig_user_id TEXT NOT NULL,
  username TEXT,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (account_id, ig_user_id)
);

-- Hourly per-account send counters (Meta: 750 private replies/hour/account).
CREATE TABLE IF NOT EXISTS rate_counters (
  account_id TEXT PRIMARY KEY,
  window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  count INT NOT NULL DEFAULT 0
);
