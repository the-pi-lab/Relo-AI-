-- =====================================================================
-- ChatFlow AI — Cloudflare D1 Production Database Schema
-- Architecture: Serverless SQLite Edge Database with Cron-as-Queue Engine
-- =====================================================================

-- 1. Master Users Table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at INTEGER DEFAULT (unixepoch())
);

-- 2. Connected Instagram Accounts (100% Meta Graph API v21.0 Compliant)
CREATE TABLE IF NOT EXISTS connected_accounts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  instagram_user_id TEXT UNIQUE NOT NULL,
  username TEXT NOT NULL,
  profile_picture_url TEXT,
  access_token_encrypted TEXT NOT NULL, -- AES-GCM encrypted
  token_expires_at INTEGER NOT NULL, -- Unix timestamp (60 days)
  is_active INTEGER DEFAULT 1,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_connected_accounts_user ON connected_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_connected_accounts_ig ON connected_accounts(instagram_user_id);

-- 3. Reel Automation Rules
CREATE TABLE IF NOT EXISTS reel_automations (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES connected_accounts(id) ON DELETE CASCADE,
  instagram_media_id TEXT NOT NULL,
  reel_permalink TEXT NOT NULL,
  reel_thumbnail_url TEXT,
  trigger_keywords TEXT NOT NULL, -- JSON array of normalized strings e.g. ["GUIDE", "VIP"]
  comment_replies TEXT NOT NULL, -- JSON array of min 3, max 8 variations with {spintax}
  follow_gate_enabled INTEGER DEFAULT 1,
  template_card TEXT NOT NULL, -- JSON object: { title, subtitle, imageUrl, buttons }
  is_active INTEGER DEFAULT 1,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_automations_account_media ON reel_automations(account_id, instagram_media_id);

-- 4. Jobs Table (The Cron-as-Queue Engine)
-- comment_id is UNIQUE NOT NULL to enforce atomic deduplication at the DB level!
CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES connected_accounts(id) ON DELETE CASCADE,
  comment_id TEXT UNIQUE NOT NULL, -- ATOMIC ZERO-COST DEDUPLICATION KEY
  commenter_user_id TEXT NOT NULL,
  commenter_username TEXT NOT NULL,
  comment_text TEXT NOT NULL,
  post_id TEXT NOT NULL,
  matched_automation_id TEXT REFERENCES reel_automations(id),
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'processing', 'completed', 'failed')),
  retry_count INTEGER DEFAULT 0,
  send_at INTEGER NOT NULL, -- Unix timestamp (now + 30-90s human anti-spam jitter)
  error_message TEXT,
  response_mid TEXT, -- Message ID returned by Meta on successful DM dispatch
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
);

-- Partial index for high-speed 1-minute Cron consumer polling (<2ms execution)
CREATE INDEX IF NOT EXISTS idx_jobs_cron_poll ON jobs(status, send_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_jobs_account ON jobs(account_id);

-- 5. Captured Leads (100% User-Owned Data Sovereignty)
CREATE TABLE IF NOT EXISTS captured_leads (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES connected_accounts(id) ON DELETE CASCADE,
  instagram_scoped_id TEXT NOT NULL,
  username TEXT,
  follower_status_at_trigger INTEGER, -- 1 = Follower, 0 = Non-follower
  email_collected TEXT,
  total_dms_sent INTEGER DEFAULT 1,
  first_interaction_at INTEGER DEFAULT (unixepoch()),
  last_interaction_at INTEGER DEFAULT (unixepoch())
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_leads_account_user ON captured_leads(account_id, instagram_scoped_id);
CREATE INDEX IF NOT EXISTS idx_leads_account_time ON captured_leads(account_id, last_interaction_at DESC);

-- 6. Intelligent Human Takeover Auto-Pause Log
CREATE TABLE IF NOT EXISTS human_takeovers (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES connected_accounts(id) ON DELETE CASCADE,
  thread_id TEXT NOT NULL,
  paused_until INTEGER NOT NULL, -- Unix timestamp (now + 30 mins)
  created_at INTEGER DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_takeover_lookup ON human_takeovers(account_id, thread_id, paused_until);

-- 7. Webhook Audit & Delivery Logs
CREATE TABLE IF NOT EXISTS webhook_logs (
  id TEXT PRIMARY KEY,
  account_id TEXT REFERENCES connected_accounts(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  payload TEXT,
  error_message TEXT,
  created_at INTEGER DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_webhook_logs_account ON webhook_logs(account_id, created_at DESC);

-- 8. Passwordless Email OTP Authentication
CREATE TABLE IF NOT EXISTS email_otps (
  email TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER DEFAULT (unixepoch())
);
