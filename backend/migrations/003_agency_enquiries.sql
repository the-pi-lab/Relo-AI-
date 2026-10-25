-- =====================================================================
-- Migration 003 — durable agency enquiries
--
-- Apply to an EXISTING D1 database:
--   wrangler d1 execute relo-d1 --remote --file=./migrations/003_agency_enquiries.sql
--   wrangler d1 execute relo-d1 --local  --file=./migrations/003_agency_enquiries.sql
--
-- Agency/contact-form leads used to be written to webhook_logs, which the
-- retention job deletes after 7 days. They now live in their own table, which
-- the purge never touches. Additive and idempotent.
-- =====================================================================

CREATE TABLE IF NOT EXISTS agency_enquiries (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  account_count INTEGER NOT NULL DEFAULT 0,
  plan_interest TEXT NOT NULL DEFAULT 'custom',
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK(status IN ('new', 'contacted', 'closed')),
  created_at INTEGER DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_agency_enquiries_created ON agency_enquiries(created_at DESC);

-- Preserve any enquiries that are still inside the 7-day window.
INSERT OR IGNORE INTO agency_enquiries (id, email, account_count, plan_interest, notes, status, created_at)
SELECT
  id,
  COALESCE(json_extract(payload, '$.email'), 'unknown@relo.local'),
  COALESCE(json_extract(payload, '$.accountCount'), 0),
  COALESCE(json_extract(payload, '$.planInterest'), 'custom'),
  json_extract(payload, '$.notes'),
  'new',
  created_at
FROM webhook_logs
WHERE event_type = 'agency_contact';
