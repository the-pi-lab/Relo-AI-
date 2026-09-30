# RELO AI — Complete Architecture, System Design & Product Blueprint

> **Official Product Name:** RELO (RELO AI)  
> **Repository:** [https://github.com/the-pi-lab/Relo-AI-](https://github.com/the-pi-lab/Relo-AI-)  
> **Engine Architecture:** Cloudflare Workers Edge + Cloudflare D1 (Serverless SQLite) + React 19 Frontend  
> **Status:** Production-Ready • Meta App Review Approved (`Published`) • Zero-Cost Cloud Edge  

---

## 1. Executive Summary: What Is RELO AI?

**RELO AI** is a lightweight, edge-native Instagram Comment-to-DM automation studio engineered as a creator-sovereign alternative to ManyChat. 

### The Problem in the Market Today:
1. **The "ManyChat Growth Tax"**: ManyChat penalizes creators as they grow. While they advertise starting at $15/month, pricing escalates rapidly to $45/mo, $65/mo, and up to $235/month purely based on contact list size. A creator with 15,000 leads pays over $1,000/year for simple automated link delivery.
2. **The "Spam Flagging Trap"**: Traditional tools send instant, identical bot replies to hundreds of commenters simultaneously. Instagram's modern spam algorithms detect identical payloads sent with 0ms latency and penalize creator accounts with action blocks or shadowbans.
3. **The "Complexity Curse"**: Existing platforms use complex enterprise node-graph flow builders with hundreds of confusing settings. 95% of creators only want **one specific thing**: *When someone comments a trigger keyword (e.g. "PDF", "LINK") on their Reel, send them a private DM with a high-converting button card and check if they follow the account.*

### RELO's Core Proposition:
- **Zero Growth Tax**: Free forever for 1 Reel + ₹299–₹499 ($9.99) one-time lifetime license. Unlimited contacts, $0 recurring fees.
- **Human-Safe Engine**: 30–90 second randomized human jitter delay + Spintax rotation (every commenter receives a unique sentence structure).
- **60-Second Setup**: Connect Instagram ➔ Select Reel ➔ Set Keyword ➔ Add Link ➔ Launch.
- **₹0 Infrastructure Overhead**: Built on globally distributed serverless edge infrastructure (Cloudflare Workers + D1) with 0 monthly server bills for the founder up to millions of requests.

---

## 2. Open-Source Provenance & Attribution (Where the Logic Came From)

We believe in radical engineering transparency. The foundational comment parsing and Meta Instagram messaging mechanics in this application adapt battle-tested open-source logic from the following MIT-licensed projects:

### 1. Primary Upstream Reference: `OpenReply`
- **GitHub Repository:** [https://github.com/diwenne/openreply](https://github.com/diwenne/openreply)
- **Creator / Maintainer:** Diwen Huang ([@diwenne](https://github.com/diwenne))
- **License:** MIT License (100% legal for commercial use, modification, adaptation, and rebranding).

### 2. What Logic Was Adapted From OpenReply?
- **Unicode-Aware Keyword Extraction:** The regular expression heuristics that strip emojis, symbols, and whitespace while folding Latin diacritics (e.g. `café` ➔ `cafe`) without breaking non-Latin scripts (Hindi, Japanese, Arabic, Cyrillic).
- **Meta Error Signature Parsing:** The error classifier that categorizes Meta Graph API errors into Retryable (Rate Limit 368, 5xx server errors, network dropouts) vs. Terminal (Code 190 token expired, permissions missing, comment deleted).
- **Early Webhook Filtering:** Dropping self-comments (comments made by the creator account itself) and message echo events before hitting the database.

### 3. What Did WE Build & Upgrade in RELO AI?
While OpenReply was designed as a heavy Node.js + Express + Redis + PostgreSQL monolith running on expensive servers or sleeping Render free tiers, **we completely re-architected the system into a modern, production-grade SaaS**:
1. **Engine Rewrite to Cloudflare Edge**: Rewrote the entire backend engine in TypeScript to run on Cloudflare Workers (sub-15ms global latency, runs across 300+ cities globally).
2. **Serverless SQLite (D1) State Machine**: Replaced Redis with atomic Cloudflare D1 SQLite transactions, eliminating database hosting costs.
3. **Anti-Ban Spintax Generator**: Built an AST-based Spintax permutation engine that forces 3–8 unique comment and DM variations.
4. **Randomized Human Jitter (30–90s)**: Built an asynchronous scheduling queue that mimics natural human behavior instead of instant bot firing.
5. **Fail-Open Follow-Gate Verification**: Integrated biometric follow verification with a 1500ms hard timeout so slow Instagram API calls never drop leads.
6. **Meta 3-Button Generic Template Cards**: Built rich interactive cards with thumbnail images and action buttons inside Instagram Direct.
7. **Viral Product Loop ("Automated by RELO")**: Built hotmail-style viral distribution into the template cards for free customer acquisition.
8. **Porcelain Daylight UI**: Designed a bespoke, premium UI/UX in React 19 + Tailwind v4 with zero-purple color policy and WCAG AA compliance.

---

## 3. High-Level Architecture Diagram

```
                              ┌────────────────────────────────────────────────────────┐
                              │                    INSTAGRAM CREATOR                   │
                              └───────────────────────────┬────────────────────────────┘
                                                          │
                                     Visits Dashboard     │ Comments on Reel
                                                          │
                                                          ▼
┌─────────────────────────────────┐           ┌────────────────────────────────────────┐
│     RELO FRONTEND APPLICATION   │           │          META GRAPH API v21.0          │
│   (Vite + React 19 + Tailwind)  │           │   (Instagram Webhooks & Messaging API) │
│       Hosted on Vercel Edge     │           └───────────────────┬────────────────────┘
└────────────────┬────────────────┘                               │
                 │                                                │ POST /webhook (HMAC-SHA256)
                 │ REST API (Bearer JWT)                          │ <15ms Response
                 ▼                                                ▼
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                        RELO SERVERLESS EDGE ENGINE (`backend/`)                      │
│                           Hosted on Cloudflare Workers                               │
│                                                                                      │
│  ┌─────────────────────────┐  ┌─────────────────────────┐  ┌──────────────────────┐  │
│  │     Webhook Ingest      │  │     REST API Router     │  │  1-Minute Cron Batch │  │
│  │   • HMAC Verification   │  │   • Passwordless OTP    │  │  • Spintax Selection │  │
│  │   • Early Dedupe Filter │  │   • Automations CRUD    │  │  • Follow-Gate Check │  │
│  │   • 30-90s Jitter Queue │  │   • Leads CSV Export    │  │  • 3-Button DM Dispatch││
│  └────────────┬────────────┘  └────────────┬────────────┘  └──────────┬───────────┘  │
│               │                            │                          │              │
└───────────────┼────────────────────────────┼──────────────────────────┼──────────────┘
                │                            │                          │
                ▼                            ▼                          ▼
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                               CLOUDFLARE D1 DATABASE                                 │
│                       (Creator-Owned Serverless SQLite Storage)                      │
│                                                                                      │
│  • accounts (Encrypted Meta Access Tokens via AES-256-GCM)                           │
│  • automations (Reel rules, Keywords, Spintax options, Button links)                 │
│  • queue_jobs (State Machine: pending ➔ processing ➔ completed / failed)              │
│  • leads (Captured usernames, follower status, timestamps)                           │
│  • analytics_events (Aggregated conversion telemetry)                                │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. How the DM Automation Works (Step-by-Step Flow)

### Step 1: User Comments on a Reel
1. A viewer on Instagram comments `"SEND BLUEPRINT"` on a creator's Reel.
2. Meta's webhook servers instantly dispatch a `POST /webhook` HTTPS payload to the RELO Cloudflare Worker:
   - Includes `X-Hub-Signature-256` HTTP header.
   - Body contains `comment_id`, `media_id`, `from.id`, `from.username`, and `text`.

### Step 2: Ingestion & Verification (<15ms)
1. **HMAC-SHA256 Verification**: RELO calculates `HMAC-SHA256(payload, META_APP_SECRET)` in constant-time using the Web Crypto API. If signatures do not match, returns `403 Forbidden`.
2. **Early Filtering**:
   - If `from.id === account.instagram_account_id` (the creator commenting on their own post), discard immediately.
   - If the comment has already been processed (`dedupe_hash = SHA256(comment_id + automation_id)`), discard immediately.
3. **Keyword Matching**:
   - Sanitizes text: strips emojis, symbols, and punctuation.
   - Folds Latin diacritics.
   - Performs unicode-aware whole-word regex matching against the creator's configured keywords.
4. **Human Jitter Calculation**:
   - If matched, generates a random delay between **30 and 90 seconds**:
     $$\text{send\_at} = \text{current\_time} + \text{random}(30, 90)$$
   - Writes the job to D1 `queue_jobs` with status `'pending'`.
5. **Instant ACK**: Returns `200 OK` to Meta in `<15ms` so Meta never retries or throttles the webhook.

### Step 3: 1-Minute Cron Batch Processor
1. Cloudflare Workers cron fires once every 60 seconds (`* * * * *`).
2. Queries D1 for due jobs:
   ```sql
   SELECT * FROM queue_jobs 
   WHERE status = 'pending' AND send_at <= unixepoch() 
   LIMIT 50;
   ```
3. Marks fetched jobs as `'processing'` to prevent race conditions.

### Step 4: Human Takeover Auto-Pause Check
1. Queries Meta Messaging endpoint to check recent conversation history for that user.
2. If the creator has manually sent a DM to that user within the last **15 minutes**, the automated engine auto-pauses for that conversation to prevent awkward bot interruptions during human sales conversations.

### Step 5: Follow-Gate Verification (Fail-Open)
1. If the creator enabled "Require Follow", RELO queries:
   `GET /{ig_account_id}/followers?user_id={target_user_id}`
2. **1500ms Hard Timeout**: If Meta takes longer than 1.5 seconds to reply, the system **fails-open** (`is_following = true`). Why? Because losing a hot lead due to an Instagram API lag is unacceptable.

### Step 6: Message Formatting & Dispatch
1. **Spintax Comment Reply**: Randomly selects 1 of 3–8 pre-configured Spintax replies (e.g. `"@username sent to your DMs! Check requests 🚀"`).
2. Dispatches public comment reply: `POST /{comment_id}/replies`.
3. **3-Button Generic Template Card**: Assembles the Instagram DM card:
   - **Title**: Lead Magnet Title (e.g. "Free Growth Blueprint").
   - **Subtitle**: Creator Subtitle description.
   - **Image**: High-res preview thumbnail.
   - **Button 1**: Primary Action Link (Web URL).
   - **Button 2**: Secondary Action Link (Community / Video).
   - **Button 3**: **`⚡ Automated by RELO AI`** (Free Tier viral attribution).
4. Dispatches private reply: `POST /me/messages`.
5. Logs lead to `leads` table and marks `queue_jobs` status as `'completed'`.

---

## 5. Cloudflare D1 Database Schema (Production DDL)

```sql
-- 1. Users / Creators
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  last_login_at INTEGER
);

-- 2. Connected Instagram Professional Accounts
CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  instagram_account_id TEXT UNIQUE NOT NULL,
  instagram_username TEXT NOT NULL,
  page_id TEXT NOT NULL,
  encrypted_access_token TEXT NOT NULL,
  token_iv TEXT NOT NULL,
  token_tag TEXT NOT NULL,
  profile_picture_url TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- 3. Automation Rules per Reel
CREATE TABLE IF NOT EXISTS automations (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  media_id TEXT NOT NULL,
  media_type TEXT NOT NULL DEFAULT 'REEL',
  media_url TEXT,
  permalink TEXT,
  keywords TEXT NOT NULL,                -- JSON Array of uppercase keywords
  reply_variations TEXT NOT NULL,        -- JSON Array of 3 to 8 Spintax replies
  template_card TEXT NOT NULL,           -- JSON Object (title, subtitle, imageUrl, buttons)
  require_follow INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- 4. Asynchronous Queue State Machine
CREATE TABLE IF NOT EXISTS queue_jobs (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  automation_id TEXT NOT NULL REFERENCES automations(id) ON DELETE CASCADE,
  comment_id TEXT UNIQUE NOT NULL,
  media_id TEXT NOT NULL,
  sender_id TEXT NOT NULL,
  sender_username TEXT NOT NULL,
  comment_text TEXT NOT NULL,
  dedupe_hash TEXT UNIQUE NOT NULL,
  send_at INTEGER NOT NULL,              -- Scheduled time with 30-90s jitter
  status TEXT NOT NULL DEFAULT 'pending', -- pending | processing | completed | failed
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- 5. Captured Leads (1-Click CSV Export)
CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  automation_id TEXT NOT NULL REFERENCES automations(id) ON DELETE CASCADE,
  instagram_user_id TEXT NOT NULL,
  username TEXT NOT NULL,
  comment_text TEXT NOT NULL,
  is_follower INTEGER NOT NULL DEFAULT 0,
  interaction_timestamp INTEGER NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Indexes for lightning fast lookups
CREATE INDEX IF NOT EXISTS idx_automations_lookup ON automations(account_id, media_id, active);
CREATE INDEX IF NOT EXISTS idx_queue_processing ON queue_jobs(status, send_at);
CREATE INDEX IF NOT EXISTS idx_leads_export ON leads(account_id, created_at DESC);
```

---

## 6. Security & Data Protection Guarantees

1. **AES-256-GCM Token Encryption**: Creator Instagram Long-Lived Access Tokens are **never** stored plaintext. They are encrypted using 256-bit Galois/Counter Mode with a unique 96-bit Initialization Vector (IV) and a 128-bit authentication tag per row.
2. **Zero-Password OTP Authentication**: Creators log in using a 6-digit cryptographic one-time password delivered via Resend. No passwords exist in the database to be hacked or leaked.
3. **HMAC-SHA256 Webhook Verification**: Every single webhook call from Meta is checked against the application's secret key before any compute or database logic executes.
4. **Creator Sovereignty**: Unlike ManyChat, creators can download an RFC 4180 CSV export of all captured leads in 1 click at any time with zero tier restrictions.

---

## 7. The Zero-Budget Founder Growth Engine

| Phase | Strategy | Conversion Mechanism | Expected Cost |
| :--- | :--- | :--- | :--- |
| **Phase 1: Zero-Friction Hook** | **1-Reel Free Forever** | Creators connect their account for free. They automate their best reel and experience live lead generation with 0 risk. | ₹0 |
| **Phase 2: Viral Exposure Loop** | **Button 3 Attribution** | Free tier includes *"⚡ Automated by RELO AI"*. Every DM sent introduces RELO to other creators for free. | ₹0 |
| **Phase 3: The Impulse Upgrade** | **₹299–₹499 Lifetime** | When creators want to automate multiple reels, they pay a single impulse price instead of ManyChat's ₹1,500/month subscription. | ₹0 Ad Spend |
| **Phase 4: Direct Concierge Outreach** | **Unscalable DM Outreach** | Contact 10 creators daily who sell digital products/courses and offer to automate their reel for free. Convert 15–20% to paid lifetime plans. | ₹0 Ad Spend |

---

## 8. Summary of Components & Directory Map

```
RELO AI/
├── backend/                         # Cloudflare Workers Edge Automation Engine
│   ├── src/
│   │   ├── api/router.ts            # REST API (Auth, Automations, Leads, Analytics)
│   │   ├── db/queries.ts            # D1 SQLite query wrappers & transactions
│   │   ├── engine/keyword.ts        # Unicode whole-word regex parser
│   │   ├── engine/spintax.ts        # AST Spintax variation generator
│   │   ├── engine/processor.ts      # 1-minute cron batch dispatcher
│   │   ├── meta/client.ts           # Meta Graph API v21.0 resilient client
│   │   ├── crypto.ts                # AES-256-GCM and HMAC-SHA256 crypto
│   │   └── index.ts                 # Cloudflare fetch & scheduled handler
│   ├── schema.sql                   # D1 Database Schema DDL
│   ├── wrangler.toml                # Cloudflare deployment manifest
│   └── tests/                       # Complete automated integration test suite
│
├── customer-backend/                # (Optional) Self-Hosted Docker Runtime
│   ├── src/                         # Express + Node 20 + Postgres runtime
│   └── docker-compose.yml           # Self-contained customer container
│
├── src/                             # Creator Studio Frontend Application
│   ├── components/landing/          # Interactive Simulator, Calculator, Comparison
│   ├── components/dashboard/        # Reels Grid, Automation Editor, Leads Table
│   ├── pages/Landing.tsx            # High-conversion porcelain landing page
│   ├── pages/Dashboard.tsx          # Real-time Creator Studio
│   └── lib/api.ts                   # Client-side API caller & mock fallback
│
└── .github/workflows/ci.yml         # CI Guardrails (Node 22, Tests, Lint, Build)
```
