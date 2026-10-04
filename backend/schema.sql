-- =====================================================================
-- RELO AI — Cloudflare D1 Production Database Schema
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
  updated_at INTEGER DEFAULT (unixepoch()),
  -- Tier system (plan.md §3): subscription is set on all of a user's accounts
  plan TEXT NOT NULL DEFAULT 'free' CHECK(plan IN ('free', 'pro', 'studio')),
  ai_credits_remaining INTEGER NOT NULL DEFAULT 3,
  ai_credits_reset_at INTEGER NOT NULL DEFAULT 0,
  free_reel_consumed INTEGER NOT NULL DEFAULT 0 -- lifetime 1-reel slot (free tier)
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
  updated_at INTEGER DEFAULT (unixepoch()),
  -- Follow-up DMs (Pro/Studio, plan.md §4.2)
  follow_up_enabled INTEGER NOT NULL DEFAULT 0,
  follow_up_delay_minutes INTEGER NOT NULL DEFAULT 60
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
  public_reply_id TEXT, -- Public comment reply ID (prevents duplicate replies on retry)
  parent_job_id TEXT REFERENCES jobs(id) ON DELETE SET NULL, -- set when this job is a follow-up DM
  is_follow_up INTEGER NOT NULL DEFAULT 0,
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
  last_interaction_at INTEGER DEFAULT (unixepoch()),
  last_inbound_at INTEGER DEFAULT 0 -- last time THIS lead messaged us (24h window anchor)
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


-- 9. Short Links (Sent → Clicked tracking, plan.md §4.5)
CREATE TABLE IF NOT EXISTS short_links (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES connected_accounts(id) ON DELETE CASCADE,
  automation_id TEXT NOT NULL REFERENCES reel_automations(id) ON DELETE CASCADE,
  button_index INTEGER NOT NULL,
  target_url TEXT NOT NULL,
  click_count INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_short_links_account ON short_links(account_id);
CREATE INDEX IF NOT EXISTS idx_short_links_automation ON short_links(automation_id);

-- 9b. Products library (plan.md §4.4 / §5)
-- Knowledge base for AI product-Q&A and the link-in-bio page. Capped at ~50
-- rows per account so the whole catalog fits in a prompt with no RAG at MVP.
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES connected_accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price_text TEXT,
  description TEXT,
  link TEXT,
  image_url TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_products_account ON products(account_id, is_active, created_at DESC);

-- 10. AI Credit Ledger (plan.md §4.4 — every grant/spend is auditable)
CREATE TABLE IF NOT EXISTS credit_ledger (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES connected_accounts(id) ON DELETE CASCADE,
  delta INTEGER NOT NULL,
  reason TEXT NOT NULL,
  created_at INTEGER DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_credit_ledger_account ON credit_ledger(account_id, created_at DESC);

-- 11. Payments (Lemon Squeezy + manual UPI, plan.md §3)
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES connected_accounts(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK(provider IN ('lemon_squeezy', 'manual_upi')),
  external_ref TEXT, -- LS order id (when applicable)
  utr TEXT, -- UPI transaction reference (manual India flow)
  plan TEXT NOT NULL CHECK(plan IN ('pro', 'studio')),
  amount_inr INTEGER,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'verified', 'rejected')),
  created_at INTEGER DEFAULT (unixepoch()),
  verified_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_payments_account ON payments(account_id, created_at DESC);

-- 12. Campaigns (plan.md §4.3 / Phase 3) — Pro/Studio only
-- A campaign re-engages every captured commenter of one reel, but ONLY those
-- still inside Meta's 24h messaging window (reachability is computed from
-- captured_leads.last_inbound_at at send time, never at compose time).
CREATE TABLE IF NOT EXISTS campaigns (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES connected_accounts(id) ON DELETE CASCADE,
  media_id TEXT NOT NULL,
  payload_json TEXT NOT NULL, -- { kind: 'text'|'card', text?, card? } (shared with Canvas nodes)
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'scheduled', 'sending', 'completed', 'failed', 'cancelled')),
  scheduled_at INTEGER NOT NULL DEFAULT 0,
  sent_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  unreachable_count INTEGER NOT NULL DEFAULT 0,
  -- HUMAN_AGENT messaging tag: applied per-recipient inside Meta's 7-day
  -- window. Off by default; one tag per campaign send.
  uses_human_agent_tag INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_campaigns_account ON campaigns(account_id, status, created_at DESC);

-- 12b. Campaign recipients — one row per lead, with the classification the
-- campaign worker records so the dashboard can show "X of Y still reachable".
CREATE TABLE IF NOT EXISTS campaign_targets (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  lead_id TEXT NOT NULL REFERENCES captured_leads(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'sent', 'failed', 'unreachable')),
  failure_reason TEXT, -- retryable | window_expired | token_dead
  dispatched_mid TEXT,
  sent_at INTEGER,
  created_at INTEGER DEFAULT (unixepoch())
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_campaign_targets_unique ON campaign_targets(campaign_id, lead_id);
CREATE INDEX IF NOT EXISTS idx_campaign_targets_pending ON campaign_targets(campaign_id, status);

-- 12c. Link-in-bio (plan.md §4.5 / Phase 2)
-- One public page per connected account. Blocks either point at an existing
-- short_link (so clicks feed the same Sent → Clicked funnel) or carry their own
-- target_url, which is registered as a short link on first publish.
CREATE TABLE IF NOT EXISTS link_pages (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL UNIQUE REFERENCES connected_accounts(id) ON DELETE CASCADE,
  slug TEXT UNIQUE, -- vanity path; NULL means fall back to /p/:accountId
  headline TEXT,
  bio TEXT,
  theme TEXT NOT NULL DEFAULT 'volt' CHECK(theme IN ('volt', 'plain', 'dark')),
  is_published INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_link_pages_account ON link_pages(account_id);

-- 12d. Link-in-bio blocks. One row per tappable button on the public page.
CREATE TABLE IF NOT EXISTS link_blocks (
  id TEXT PRIMARY KEY,
  page_id TEXT NOT NULL REFERENCES link_pages(id) ON DELETE CASCADE,
  short_link_id TEXT REFERENCES short_links(id) ON DELETE SET NULL,
  product_id TEXT REFERENCES products(id) ON DELETE SET NULL,
  target_url TEXT NOT NULL,
  label TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  click_count INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_link_blocks_page ON link_blocks(page_id, position ASC);

-- 13. Canvas Flows (plan.md §7 Phase 3) — Studio-only node builder.
-- A flow is stored as a versioned graph JSON: linear chains first
-- (trigger -> action -> action), branching later.
CREATE TABLE IF NOT EXISTS flows (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES connected_accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  graph_json TEXT NOT NULL, -- { nodes: [{ id, type, position, config }], edges: [...] }
  is_active INTEGER NOT NULL DEFAULT 0,
  is_published INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_flows_account ON flows(account_id, is_published, updated_at DESC);

-- 14. Referrals (plan.md §7 Phase 3) — one row per invited person.
-- Reward is granted when the referred account completes its first paid
-- activation, so a self-referral or a churned signup earns nothing.
CREATE TABLE IF NOT EXISTS referrals (
  id TEXT PRIMARY KEY,
  referrer_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referred_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code TEXT NOT NULL, -- the code that was used at signup
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'qualified', 'rewarded', 'rejected')),
  qualified_at INTEGER,
  rewarded_at INTEGER,
  created_at INTEGER DEFAULT (unixepoch())
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_referrals_referred ON referrals(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_user_id, status);


-- 15. Content planning (plan.md §7 Phase 2 — the competitive gap)
-- Closes the gap plan.md §4.10 flags: rivals bundle planning WITH automation.
-- A planned post carries its own hook/caption/date, and once its Reel goes live
-- the creator links it to the automation that handles the comments.
CREATE TABLE IF NOT EXISTS content_plans (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES connected_accounts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  hook TEXT,
  caption TEXT,
  status TEXT NOT NULL DEFAULT 'idea' CHECK(status IN ('idea', 'drafting', 'scheduled', 'published')),
  planned_for INTEGER NOT NULL DEFAULT 0, -- unix timestamp of the intended publish
  instagram_media_id TEXT, -- set once the Reel is actually live
  automation_id TEXT REFERENCES reel_automations(id) ON DELETE SET NULL,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_content_plans_account ON content_plans(account_id, planned_for DESC);

-- 8. Passwordless Email OTP Authentication (brute-force hardened)
CREATE TABLE IF NOT EXISTS email_otps (
  email TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER DEFAULT (unixepoch()),
  attempts INTEGER NOT NULL DEFAULT 0, -- Failed verification attempts (5 = lockout)
  last_sent_at INTEGER DEFAULT 0 -- 60s resend throttle
);
