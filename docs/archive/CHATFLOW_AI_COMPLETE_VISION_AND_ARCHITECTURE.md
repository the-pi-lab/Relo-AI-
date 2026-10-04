# 🌟 ChatFlow AI — Complete Vision, Architectural Blueprint & Feature Specification

> **Document Type:** Master Vision & Technical Architecture Reference  
> **Status:** Authoritative Single Source of Truth  
> **Target Audience:** Core Product Team, Design Engineers, Backend & 3D WebGL Developers  
> **Scope:** Full-Stack Architecture, Cinematic 3D Engine, Creative Directives, Anti-Spam Systems & Deployment  

---

## 1. Executive Vision & Core Philosophy

**ChatFlow AI** is a creator-first, self-hosted Instagram DM automation engine engineered to dismantle the predatory SaaS subscription model established by ManyChat, Chatfuel, and Zorcha.

### The Problem We Are Solving
Traditional Instagram automation tools charge creators recurring monthly fees that exponentially increase as their follower count grows:
- A creator with 25,000 contacts pays **$145 to $235+ every single month**.
- If a reel goes viral and pulls in 50,000 comments, the creator is penalized with surprise overage charges.
- The SaaS company owns and stores all customer leads, follower handles, and chat histories in proprietary databases, creating extreme vendor lock-in.

### The ChatFlow AI Breakthrough
1. **$10 One-Time Lifetime License**: Users pay $10 once per connected Instagram account for lifetime access. Unlimited contacts, unlimited DMs, zero monthly fees forever.
2. **100% Data Sovereignty (BYO Backend)**: Users host their own automation engine on free-tier cloud platforms (Render, Railway, Supabase) or Docker. All customer leads, emails, and tokens are stored directly in the user’s private Postgres database.
3. **Official Meta Graph API v21.0 Compliance**: 100% compliant with Meta's official API specifications. No headless browser scraping, no unofficial reverse-engineered APIs, and zero risk of shadowbans or account suspension.
4. **Cinematic 3D Spatial Experience**: A scrollytelling visual film where users physically travel through the automation pipeline rather than reading static marketing bullet points.

---

## 2. Strict Aesthetic Directives & Creative Rules

### A. The Strict Zero-Purple Policy
- **ABSOLUTE BAN ON PURPLE**: Under no circumstances should any purple, violet, indigo, magenta, or lavender shades appear in the UI, 3D materials, GLSL shaders, glows, borders, or typography.
- **Approved Daylight Color Palette**:
  - **Porcelain White**: `#ffffff`, `#f8fafc`, `#f1f5f9` (clean, airy daylight baseline)
  - **Electric Sky Cyan**: `#0284c7`, `#0ea5e9`, `#38bdf8`, `#e0f2fe` (primary tech accent & signal routing)
  - **Vibrant Emerald Green**: `#10b981`, `#059669`, `#34d399`, `#d1fae5` (verified actions, follow-gate clearance, success states)
  - **Titanium Slate / Chrome**: `#0f172a`, `#1e293b`, `#334155`, `#94a3b8` (ultra-crisp typography, metallic chassis, high-contrast borders)

### B. Pure Daylight Light Mode Only
- No dark mode backgrounds or gloomy navy canvases.
- The aesthetic must feel like a sunlit architectural studio or an Apple hardware keynote: luminous, high-contrast, premium glassmorphism, subtle daylight ambient occlusion, and crisp shadows.

### C. Visual References & Aesthetic Benchmarks
The design takes direct inspiration from world-class 3D motion websites:
1. **[SharpLink](https://www.sharplink.com/)**: Clean architectural 3D camera travel, spatial depth, and fluid transitions.
2. **[Otsuka Air](https://otsuka-air.jp/)**: Physical continuity across scroll where elements rotate, float into motion, and settle naturally.
3. **[Void](https://void.sbs/)**: High-end dimensional art direction, tactile interactions, and uncompromising typography.
4. **[ThreeUI](https://github.com/MengTo/threeui.git)**: Tactile skeuomorphic toggles, laser beam buttons, particle conduits, and projected isometric diagnostics.

### D. Anti-Clutter & Composition Rules
- **No Cluttered Messes**: 3D objects must never collide, overlap randomly, or clip through each other.
- **No Solitary Floating Phone**: Avoid boring single-object scenes. The scene must represent an interconnected spatial ecosystem with distinct zones (Input Device → Logic Gate → Dispatch Slab → Server Racks → Private Vault → Outcome Matrix).
- **Subtle Glass Cards**: Text and narrative copy must be elegantly proportioned and never mask or obscure active 3D focal points.

---

## 3. High-Level Web App Architecture

The system is separated into three decoupled tiers: the **Control Plane & Licensing**, the **Customer Sovereign Backend**, and the **Meta Graph API Gateway**.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           CHATFLOW AI ECOSYSTEM                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│   ┌───────────────────────────┐                ┌────────────────────────────┐   │
│   │      CLIENT FRONTEND      │                │    CENTRAL CONTROL PLANE   │   │
│   │  (React 19 + Three.js)    │◄─── Auth ─────►│       (Convex + Resend)    │   │
│   │ • Cinematic 3D Landing    │                │ • $10 Lifetime License     │   │
│   │ • Casual / Pro Studio     │                │ • User Authentication      │   │
│   │ • Live Simulator & Charts │                │ • System Health Telemetry  │   │
│   └─────────────┬─────────────┘                └─────────────┬──────────────┘   │
│                 │                                            │                  │
│                 │ Direct Encrypted RPC                       │ License Token    │
│                 ▼                                            ▼                  │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │                    CUSTOMER SOVEREIGN BACKEND POOL                      │   │
│   │                      (BYO - Bring Your Own Cloud)                       │   │
│   │                                                                         │   │
│   │   ┌──────────────────────┐  ┌─────────────────────┐  ┌───────────────┐  │   │
│   │   │     Render.com       │  │     Railway.app     │  │ Supabase Edge │  │   │
│   │   │  (Viral Reels #1-#2) │  │  (E-comm Automation)│  │ (DMs & Leads) │  │   │
│   │   └──────────┬───────────┘  └──────────┬──────────┘  └───────┬───────┘  │   │
│   │              │                         │                     │          │   │
│   │              └─────────────────────────┼─────────────────────┘          │   │
│   │                                        ▼                                │   │
│   │                       ┌─────────────────────────────────┐               │   │
│   │                       │   BullMQ Redis Queue (<80ms)    │               │   │
│   │                       └────────────────┬────────────────┘               │   │
│   │                                        ▼                                │   │
│   │                       ┌─────────────────────────────────┐               │   │
│   │                       │   Private Customer Postgres DB  │               │   │
│   │                       │    (AES-256 Encrypted Leads)    │               │   │
│   │                       └────────────────┬────────────────┘               │   │
│   └────────────────────────────────────────┼────────────────────────────────┘   │
│                                            │                                    │
│                 ┌──────────────────────────┴──────────────────────────┐         │
│                 ▼                                                     ▼         │
│   ┌───────────────────────────┐                         ┌───────────────────┐   │
│   │  OFFICIAL META GRAPH API  │                         │ INSTAGRAM MOBILE  │   │
│   │           v21.0           │                         │ (Human Takeover)  │   │
│   │ • Webhook Ingestion       │                         │ • 30-min Bot Halt │   │
│   │ • Follower Verification   │                         │ • Live Chat Sync  │   │
│   │ • Generic Template DMs    │                         │                   │   │
│   └───────────────────────────┘                         └───────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. The 6-Act Cinematic 3D Journey (Scrollytelling Specification)

The landing page experience is choreographed as a continuous 6-act spatial journey over 550vh of scroll:

```
[0% Scroll]                                                                     [100% Scroll]
Act 1: SIGNAL ──► Act 2: FOLLOW-GATE ──► Act 3: DISPATCH ──► Act 4: SERVERS ──► Act 5: VAULT ──► Act 6: OUTCOMES
(Phone & Comment)   (Biometric Laser)    (3-Button Card)      (Blade Cluster)    (Postgres Lock)   (Telemetry Deck)
```

### Act 1: The Native Signal Detect (0% – 18% Scroll)
- **Visual Subject**: Physically modeled smartphone with titanium beveled rails displaying a live, clean daylight Instagram comment thread.
- **Motion Choreography**:
  - The smartphone rests at `x: -1.2, y: 0.2, z: 0`.
  - At scroll `p = 0.12`, a user comment (e.g., `"Send Guide!"`) physically detaches from the glass screen.
  - The comment encapsulates into a glowing cyan 3D data capsule with an inner luminous core.
- **Copy Focus**: *"Every Instagram Comment Becomes a Verified Lead in 400ms."*
- **Key Badges**: `● ZERO LATENCY WEBHOOKS`, `● 100% OFFICIAL META GRAPH API`.

### Act 2: The Biometric Follow-Gate (18% – 38% Scroll)
- **Visual Subject**: A holographic circular scanner ring (`FollowGateRing`) hovering in space with twin branching physical fiber conduits.
- **Motion Choreography**:
  - The camera dollies smoothly from the phone toward the scanner ring (`x: 0, y: 0.2, z: -0.2`).
  - The comment capsule enters the scanner center; a vertical emerald laser plane sweeps across it.
  - The pipeline branches into two physical light conduits:
    - **Conduit A (Emerald Green - YES)**: Follower verified → data packet accelerates forward to dispatch.
    - **Conduit B (Titanium Slate - NO)**: Non-follower detected → routed to polite "Follow account to unlock" sequence.
- **Copy Focus**: *"Weed Out Non-Followers Automatically Before Sending Any Link."*
- **Metric Highlight**: *"3.4x faster organic follower growth without paying for Instagram Ads."*

### Act 3: Rich Carousel Dispatch (38% – 58% Scroll)
- **Visual Subject**: Floating 3D frosted-glass Generic Template slabs (`TemplateSlabs`) featuring high-resolution graphics and 3 distinct depressible mechanical buttons.
- **Motion Choreography**:
  - The verified capsule slots into the template card.
  - The card rotates into view (`x: 1.2, y: 0.3, z: 0`), angling toward the camera.
  - 3 action buttons highlight sequentially with subtle spring-like micro-depressions:
    1. *Direct Web Link Button (e.g. "Download Free PDF")*
    2. *Secondary Flow Button (e.g. "Watch 5-Min Video")*
    3. *Direct Inquiry Button (e.g. "Chat with Founder")*
- **Copy Focus**: *"Deliver Official 3-Button Generic Templates Right Inside Direct Messages."*
- **Key Badges**: `● ZERO LINK THROTTLING`, `● NO SPAM SCORE PENALTIES`.

### Act 4: Sovereign Engine Cluster (58% – 78% Scroll)
- **Visual Subject**: Triple floating server chassis blades (`ServerCluster`) arranged vertically in an architectural stack:
  1. *Blade #1*: Render.com Worker (Primary Viral Webhook Intake)
  2. *Blade #2*: Railway.app Worker (E-commerce & Conversion Flow)
  3. *Blade #3*: Supabase DB & Edge Node (Authentication & State)
- **Motion Choreography**:
  - The camera rises and dollies to `x: 1.8, y: 0.8, z: 6.0`.
  - LED status matrices on the server blades pulse with live cyan and emerald activity.
  - Fiber-optic interconnects glow as data packets distribute evenly across the 3 nodes.
- **Copy Focus**: *"Your Cloud. Your Rules. 1-Click Deploy on Render, Railway or Docker for $0/Month."*
- **Key Badges**: `● TRIPLE REDUNDANCY`, `● ZERO VENDOR MONOPOLY`.

### Act 5: Ciphered Database Vault (78% – 90% Scroll)
- **Visual Subject**: A crystalline hexagonal vault (`DatabaseVault`) surrounded by dual interlocking brushed titanium rings and floating lead tokens.
- **Motion Choreography**:
  - The camera orbits around the vault.
  - Incoming customer leads (email tokens, Instagram IDs) physically slot into the cryptographic core.
  - The outer lock rings spin and mechanically lock into place with an emerald pulse.
- **Copy Focus**: *"100% Data Sovereignty. Every Lead Stored Exclusively in Your Private Postgres."*
- **Key Badges**: `● AES-256-GCM ENCRYPTED`, `● ZERO THIRD-PARTY TELEMETRY`.

### Act 6: The Outcome Matrix & Lifetime License (90% – 100% Scroll)
- **Visual Subject**: A luminous glass telemetry pedestal (`TelemetryDeck`) with 4 dynamic 3D bar columns extruding upwards in direct synchronization with scroll progress.
- **Motion Choreography**:
  - All scene actors gracefully align into a grand convergent isometric perspective.
  - The 4 metric columns rise:
    - Bar 1: *Comment Inflow (+340%)*
    - Bar 2: *Follower Conversion (+82%)*
    - Bar 3: *DM Delivery Rate (99.8%)*
    - Bar 4: *Cost Savings ($180/yr → $0/mo)*
  - The central CTA appears: *"Claim Lifetime License — $10 Once. Forever."*
- **Copy Focus**: *"Own the Full System For Life. No Subscriptions, No Per-Contact Penalties."*

---

## 5. Instagram Reels & Anti-Spam Architecture

Instagram employs sophisticated automated heuristics to detect bot activity. ChatFlow AI is engineered with multi-layer defensive systems to guarantee 100% account safety:

```
                          ┌───► Variation 1: "Hey @alex, sent you the guide! 🚀"
Incoming Comment ──► Split ├───► Variation 2: "Just sent the link to your DMs @alex! Check it out."
  (on Reel)               ├───► Variation 3: "Check your inbox @alex, the blueprint is ready! 📁"
                          └───► Variation 4: "@alex dm sent! Let me know what you think."
```

### A. The 7-to-14 Day Recent Reels Grid
- **Problem**: Querying Instagram's Graph API for all reels repeatedly causes rapid rate-limit depletion (`Error 429: Application-level rate limit exceeded`).
- **Engineered Solution**:
  - The dashboard displays only active Reels published within the last **7 to 14 days**.
  - **Redis Cache Layer**: Reels metadata is cached with a 30-minute TTL (stale-while-revalidate).
  - **Webhook Cache Invalidation**: The cache is only updated when Instagram sends a `media_update` webhook notification.
  - **Sync Cooldown Throttle**: The manual "Sync Reels" button enforces a strict 5-minute cooldown timer with a live countdown display.

### B. Mandatory 3-to-8 Reply Variations System
- **Mandatory 3 Variations (Strict Requirement)**: The system blocks automation deployment unless at least 3 distinct comment reply variations are provided.
- **Up to 8 Variations**: Users can configure up to 8 customized text responses that rotate using weighted random or round-robin algorithms.
- **Mandatory `@username` Mention**: Every public comment reply automatically injects the commenter's handle (`@username`). Replies without `@mention` are flagged as spam by Instagram’s anti-bot algorithms.
- **Dynamic Spintax Support**: Supports inline spinning:
  ```text
  {Hey|Hello|Hi} @username, {just sent you the master link|check your direct messages|the guide is in your inbox}! 🚀
  ```

---

## 6. Dual-Mode Automation Studio

To cater to creators, solopreneurs, and elite automation engineers alike, ChatFlow AI offers two unified workflow builders with 100% state synchronization:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   CHATFLOW AI UNIFIED BUILDER ENGINE                   │
├───────────────────────────────────┬────────────────────────────────────┤
│            CASUAL MODE            │              PRO MODE              │
│       (Creator Card Studio)       │      (n8n-Style Node Canvas)       │
├───────────────────────────────────┼────────────────────────────────────┤
│ • 3-Step Guided Wizard            │ • Infinite React Flow Drag & Drop  │
│ • Visual Reel Selection           │ • Multi-Trigger & Action Nodes     │
│ • Keyword Tag Chips               │ • Conditional Branches & Logic     │
│ • 3–8 Variation Inputs            │ • External Webhooks & API Fetch    │
│ • Tactile Follow-Gate Switch      │ • AI Quota Fallback Handlers       │
│ • Live Generic Template Preview   │ • Split-Testing & Delay Buffers    │
└───────────────────────────────────┴────────────────────────────────────┘
```

### A. Casual Mode (Creator Card Studio)
- Step 1: Select Reel from the 7/14-day visual grid.
- Step 2: Define trigger keywords (`"GUIDE"`, `"BLUEPRINT"`, `"FLOW"`).
- Step 3: Configure 3 to 8 randomized reply variations with `@username`.
- Step 4: Toggle the Biometric Follow-Gate with tactile feedback.
- Step 5: Upload card image and configure 1 to 3 CTA button links.

### B. Pro Mode (n8n-Style Node Canvas)
- **Trigger Nodes**:
  - `Comment on Specific Reel`
  - `Comment on Any Reel`
  - `DM Received Containing Keyword`
  - `Story Reply / Story Mention`
- **Logic & Condition Nodes**:
  - `Follower Verification Gate` (Branch A: Follower, Branch B: Non-Follower)
  - `Sentiment Filter` (Positive, Neutral, Inquiry)
  - `Account Minimum Age / Follower Count Threshold`
- **Action Nodes**:
  - `Send Official Generic Template (3 Buttons)`
  - `Send Multi-Card Carousel (up to 10 cards)`
  - `Public Comment Reply with @username`
  - `Like Comment`
- **Integration Nodes**:
  - `Push Lead to Google Sheets`
  - `Fire Custom Webhook to Zapier/Make/Stripe`
  - `Write to Private Postgres / Supabase Table`
- **AI Logic Nodes**:
  - OpenAI GPT-4o-mini / Google Gemini 2.0 Flash node for contextual answers.
  - **Graceful Quota Fallback**: If AI token budget is exhausted, the system automatically falls back to hardcoded template responses without dropping conversations.

---

## 7. Multi-Backend Power Pool (BYO Architecture)

```
Instagram Webhooks ──► Load Balancer ──┬──► Worker Instance #1 (Render)  ──► Viral Reels #1 & #2
                                       ├──► Worker Instance #2 (Railway) ──► E-comm & Checkout
                                       └──► Worker Instance #3 (Supabase)──► General Inquiries
```

- **Triple Free-Tier Distribution**: Users can link up to 3 separate free-tier cloud instances (Render, Railway, Supabase).
- **Traffic Isolation**: Assign high-velocity viral reels to dedicated workers to prevent CPU or memory throttling on primary services.
- **Zero Cold-Start Buffering**: Powered by BullMQ and Redis. Incoming webhooks respond with HTTP 200 within 40ms, buffering jobs into the queue to prevent Meta timeout re-deliveries.
- **Failover Redundancy**: If Instance #1 encounters rate limits, traffic seamlessly switches to Instance #2 without user intervention.

---

## 8. Meta Official Graph API & Interactive DM Engine

### A. Meta Generic Template DM Specifications
- Compliant with Meta Messenger Platform Generic Template specs:
  - Card Title: Bold headline (up to 80 characters).
  - Card Subtitle: Descriptive supporting text (up to 80 characters).
  - Card Image: 1.91:1 horizontal ratio or 1:1 square format.
  - **Up to 3 Action Buttons**:
    1. `web_url`: Direct URL navigation with automated UTM tracking parameters.
    2. `postback`: Dispatches secondary conversational flow without leaving Instagram.
    3. `phone_number`: Initiates direct call or VIP support hotline.

### B. Biometric Follow-Gate Logic & Fail-Open Resilience
- Before sending the high-value link, ChatFlow AI executes a Graph API check against the commenter’s Instagram Scoped ID (IGSID).
- **Fail-Open Policy**: If Meta's Graph API experiences transient outages or latency spikes (>800ms) during the follower check, the system defaults to "Approved" and delivers the DM to protect customer experience.

### C. 30-Minute Human Takeover Auto-Pause
- **Problem**: Automated bots interrupting a human creator who is actively conversing with a VIP customer.
- **Solution**:
  - The webhook listener monitors outgoing messages from the account.
  - If an outgoing message is sent from the Instagram mobile app or Meta Business Suite (and not from ChatFlow AI's API token), the system triggers a **30-minute automation pause** for that specific thread.
  - A subtle badge appears in the dashboard: `⏸️ Human Takeover Active (28m remaining)`.
  - Automation automatically resumes once the timer expires.

---

## 9. Mandatory 4-Step Onboarding Guardrail

To prevent setup failures, broken webhook URLs, or invalid permissions, users cannot access the main dashboard until completing the sequential 4-step wizard:

```
[ Step 1: Connect Meta Account ]
             │ (OAuth handshake: instagram_manage_messages, instagram_manage_comments)
             ▼
[ Step 2: Deploy Backend Template ]
             │ (1-click deploy to Render, Railway, or Supabase)
             ▼
[ Step 3: Webhook Verification Handshake ]
             │ (ChatFlow triggers simulated test comment & verifies response)
             ▼
[ Step 4: Configure First Live Reel Automation ]
             │ (Select reel, enter 3 variations, verify live DM delivery)
             ▼
=== ACCESS TO DASHBOARD UNLOCKED ===
```

---

## 10. Dashboard, Telemetry & Proactive Alerts

### A. Real-Time Telemetry Metrics
- **Comment Inflow**: Real-time graph of comments ingested by reel and keyword.
- **DM Delivery Rate**: Percentage of successfully delivered direct messages (SLA target: 99.8%).
- **Follow-Gate Conversion**: Exact percentage of non-followers who followed the account to unlock their requested resource.
- **Link Click-Through Rate (CTR)**: Click metrics tracked across each of the 3 template buttons.

### B. Proactive Alerting Channels
1. **Transactional Email via Resend**:
   - Critical alerts sent if Meta access token approaches 60-day expiration.
   - Immediate notification if customer backend fails consecutive health checks.
2. **In-App Toast & Status Center**:
   - Real-time notification banners for rate-limit warnings or queue backlogs.
3. **Webhook Failure Inspection Table**:
   - Detailed log displaying timestamp, comment text, error code (`429 Rate Limit`, `400 Bad Token`, `500 Backend Down`), and a **1-Click Retry** button.

---

## 11. Database Schema & Data Sovereignty

All customer data is stored in the user's private Postgres database with AES-256-GCM encryption for all sensitive tokens:

```sql
-- Connected Instagram Accounts
CREATE TABLE connected_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instagram_user_id VARCHAR(64) UNIQUE NOT NULL,
  username VARCHAR(64) NOT NULL,
  profile_picture_url TEXT,
  access_token_encrypted TEXT NOT NULL,
  token_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reel Automation Configurations
CREATE TABLE reel_automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES connected_accounts(id) ON DELETE CASCADE,
  instagram_media_id VARCHAR(64) NOT NULL,
  reel_permalink TEXT NOT NULL,
  reel_thumbnail_url TEXT,
  trigger_keywords TEXT[] NOT NULL,
  comment_replies TEXT[] NOT NULL, -- Min 3, max 8 variations
  follow_gate_enabled BOOLEAN DEFAULT TRUE,
  template_title VARCHAR(80) NOT NULL,
  template_subtitle VARCHAR(80),
  template_image_url TEXT,
  button_1_label VARCHAR(20),
  button_1_url TEXT,
  button_2_label VARCHAR(20),
  button_2_url TEXT,
  button_3_label VARCHAR(20),
  button_3_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Captured Leads & Contact History (100% Private to User)
CREATE TABLE captured_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES connected_accounts(id) ON DELETE CASCADE,
  instagram_scoped_id VARCHAR(64) NOT NULL,
  username VARCHAR(64),
  first_interaction_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  follower_status_at_trigger BOOLEAN,
  email_collected VARCHAR(255),
  tags TEXT[],
  total_dms_sent INT DEFAULT 1,
  last_interaction_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit & Webhook Failure Log
CREATE TABLE webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES connected_accounts(id),
  event_type VARCHAR(64) NOT NULL,
  comment_id VARCHAR(64),
  status_code INT NOT NULL,
  error_message TEXT,
  payload JSONB,
  resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 12. Implementation Roadmap & Current Status

| Component | Status | Description |
| :--- | :---: | :--- |
| **Control Plane & Auth** | ✅ Complete | Convex backend, passwordless email OTP, session management |
| **BYO Customer Backend** | ✅ Complete | Node.js/Hono/BullMQ engine with Dockerfile and 1-click deploy scripts |
| **Meta Graph API Client** | ✅ Complete | Webhook verification, token encryption, Generic Template builders |
| **Recent Reels Grid** | ✅ Complete | 7/14-day windowing, Redis caching, anti-spam variation engine |
| **Dual-Mode Studio** | ✅ Complete | Casual 3-step wizard and Pro React-Flow node canvas |
| **Multi-Backend Visualizer**| ✅ Complete | Interactive dashboard component showcasing 3-instance load balancing |
| **Savings Calculator** | ✅ Complete | Real-time slider comparing $10 lifetime vs $180/yr ManyChat tax |
| **3D Cinematic Landing Page**| 🔄 In Refinement | Transitioning from cluttered experimental prototypes to clean, polished, world-class spatial storytelling |

---

*Authored and approved as the definitive technical and design specification for ChatFlow AI.*
