# 🚀 ChatFlow AI — Master Product Specification & Feature Blueprint

> **A comprehensive document consolidating all vision, architectural guidelines, feature ideas, and implementation requirements established for ChatFlow AI.**

---

## 1. Executive Vision & Core Philosophy

**ChatFlow AI** is a self-hosted, creator-first Instagram DM automation engine built to liberate creators, influencers, and businesses from expensive SaaS subscriptions (e.g., ManyChat's \$15–\$235+/month contact taxes).

### Core Pillars:
1. **Zero Contact Tax ($10 One-Time Lifetime License)**: Buy once for \$10 per connected Instagram account. Unlimited contacts, unlimited DMs, zero monthly recurring fees.
2. **100% Data Sovereignty (BYO Backend)**: Leads, follower profiles, and conversations stay in the user's private database (Render, Railway, Supabase).
3. **Strict Meta Compliance**: Exclusively uses official Meta Graph API v21.0 endpoints. No browser scraping, no shadow bans, 100% account safety.
4. **Extreme 3D & Luminous Aesthetics**: Cinema-grade 3D motion graphics inspired by `sharplink.com`, `otsuka-air.jp`, and `void.sbs` with an uncompromising **Light Mode** and **Zero-Purple Policy**.

---

## 2. Pricing & Account Licensing Model

| Parameter | ChatFlow AI | Traditional SaaS (ManyChat / Zorcha) |
| :--- | :--- | :--- |
| **Pricing Model** | **\$10 One-Time Lifetime License** | \$15 to \$235+ / month (recurring) |
| **Contact Penalties** | **Zero Tax (Unlimited Contacts)** | Pay extra for every 500–10,000 contacts |
| **Database Ownership** | **100% User-Owned (Postgres/SQLite)** | Hosted in proprietary SaaS cloud |
| **Multi-Account Policy** | Separate \$10 license per account | Forced upgrades to expensive Agency tiers |
| **Compute Model** | Free-tier BYO (Render / Railway / Supabase) | Monopolized server infrastructure |

*Note: If a user wishes to manage multiple Instagram accounts, they simply register a new account/license, maintaining clean isolation.*

---

## 3. Reels Management & Anti-Spam Architecture

### A. Recent Reels Grid (7 to 14 Days)
- **Time Window**: Displays all active Instagram Reels published within the last **7 or 14 days** in a responsive visual grid.
- **Rate-Limit Exhaustion Protection**:
  - *Problem Identified*: Repeatedly fetching reel media from Instagram's Graph API burns through Meta's API rate limits rapidly.
  - *Solution*: 
    - Intelligent caching layer with Redis / memory cache.
    - TTL (Time-To-Live) cache policy (e.g., 30-minute stale-while-revalidate).
    - Webhook-driven cache invalidation (only re-fetch media metadata when Instagram sends a media update webhook).
    - Manual "Sync Reels" button with an active countdown cooldown timer (minimum 5-minute throttle).

### B. Per-Reel Custom DM & Comment Reply Configuration
- **Granular Customization**: Creators can specify distinct, reel-specific automation rules and payloads for every individual reel.
- **Mandatory 3 to 8 Reply Variations**:
  - **Minimum 3 Variations (Mandatory)**: To prevent Instagram's spam detection algorithms from flagging automated replies, the system enforces at least 3 distinct comment reply messages.
  - **Up to 7–8 Variations**: Users can configure up to 8 customized text responses that rotate randomly or sequentially.
  - **Mandatory `@username` Mention**: Every public comment reply automatically mentions the commenter’s handle (`@username`), creating personal engagement and passing Instagram's authenticity heuristic.
  - **Spintax & Dynamic Variations**: Support dynamic syntax like `{Hey|Hello|Hi} @username, {check your DMs|sent you the link|just messaged you}! 🚀`.

---

## 4. Dual-Mode Automation Builder

To accommodate both casual creators and advanced automation engineers, ChatFlow AI features two interchangeable workflows with 100% parity:

```
┌────────────────────────────────────────────────────────┐
│                   ChatFlow AI Engine                   │
├───────────────────────────┬────────────────────────────┤
│        CASUAL MODE        │          PRO MODE          │
│  (Creator Card Studio)    │   (n8n-Style Node Canvas)  │
│                           │                            │
│  • 3-Step Wizard          │  • Infinite Drag & Drop    │
│  • Select Reel            │  • Trigger & Action Nodes  │
│  • Trigger Keywords       │  • Branching & Logic Gates │
│  • 3–8 Reply Variations   │  • Webhooks & External APIs│
│  • Follow-Gate Toggle     │  • Fallbacks & AI Handlers │
└───────────────────────────┴────────────────────────────┘
```

### A. Casual Mode (Card-Based Studio)
- Designed for creators and non-technical social media managers.
- Select a Reel from the 7/14-day grid.
- Type target trigger keywords (Unicode-aware keyword matching, e.g., "GUIDE", "VIP").
- Enter 3 to 8 reply variations with automatic `@username` mentions.
- Set up the official Generic Template DM card (Title, Subtitle, Image, 1–3 Buttons).
- Toggle Follow-Gate verification on or off with tactile feedback.

### B. Pro Mode (n8n-Style Node Canvas)
- Visual node graph builder inspired by n8n, Flowise, and Make.
- **Node Types**:
  1. **Trigger Nodes**: Comment on Reel, DM Received, Story Mention, Story Reply.
  2. **Filter & Condition Nodes**: Keyword Match (Regex/Exact/Fuzzy), Follow-Status Check, User Follower Count, Sentiment Analysis.
  3. **Action Nodes**: Send Official Generic Template Card, Send Text with `@mention`, Send Quick Replies, Like Comment.
  4. **Integration Nodes**: Send to Google Sheets, Fire Custom Webhook, Call Stripe/Gumroad, Store in Custom Postgres.
  5. **AI Logic Nodes**: Optional OpenAI / Google Gemini node with fallback to hardcoded template if AI quota expires.
  6. **Flow Control Nodes**: Delay Timer (e.g., wait 45 seconds), Random Split (A/B testing), Human Takeover Check.

---

## 5. Multi-Backend Power Pool (BYO Architecture)

```
                            ┌───► Backend 1 (Render.com)  ──► Reel #1 & #2 (Viral)
Instagram Webhook ──► Router ├───► Backend 2 (Railway.app) ──► Reel #3 & #4 (E-comm)
                            └───► Backend 3 (Supabase Edge)──► General Account DMs
```

- **Triple Free-Tier Capacity**: Users can connect up to **3 customer-hosted backends** (Render, Railway, Supabase).
- **Workload Distribution**: Assign high-traffic viral reels to specific backends to prevent rate caps and memory spikes.
- **Zero Cold-Start Queue**: BullMQ / Redis queues process webhook bursts in under 80 milliseconds.
- **Private Data Storage**: Access tokens, leads, and customer interaction logs are encrypted with AES-256-GCM and stored exclusively in the customer’s private database.

---

## 6. Official Meta Graph API & Interactive DM Features

### A. Official 3-Button Generic Template Cards
- Supports Meta’s official **Generic Template** format:
  - 1:1 or 1.91:1 High-Resolution Header Image.
  - Card Title (bold headline, up to 80 chars).
  - Card Subtitle (description, up to 80 chars).
  - Up to **3 interactive CTA buttons**:
    1. **Web URL Button**: Direct link with custom UTM tags.
    2. **Postback Button**: Triggers secondary bot sub-flow.
    3. **Call/Support Button**: Opens direct inquiry channel.

### B. Follow-Gate Verification Engine
- Verifies if the commenter follows the Instagram account before dispatching the requested link.
- **Fail-Open Policy**: If Instagram's Graph API is temporarily unresponsive or rate-limited during a follow check, the system gracefully delivers the DM rather than penalizing a legitimate follower.

### C. 30-Minute Human Takeover Auto-Pause
- When a human creator or team member manually replies to a customer DM from the Instagram mobile app or Meta Business Suite, ChatFlow AI detects the manual outgoing message and pauses automation for that conversation for **30 minutes**.
- Prevents awkward collisions between automated bot flows and live customer conversations.

---

## 7. Mandatory Step-by-Step Onboarding Wizard

To guarantee zero setup errors, user confusion, or broken webhooks, the system enforces a strict sequential 4-step gate before granting access to the main dashboard:

```
[ Step 1: Connect Instagram ]
           │
           ▼
[ Step 2: Deploy Customer Backend (1-Click Template) ]
           │
           ▼
[ Step 3: Webhook Verification Handshake ]
           │
           ▼
[ Step 4: Configure First Reel Automation ]
           │
           ▼
=== ACCESS TO DASHBOARD UNLOCKED ===
```

1. **Step 1: Meta Graph API Handshake**:
   - Creator logs in via Facebook / Meta OAuth.
   - Selects Instagram Creator/Business account.
   - Grants official `instagram_manage_messages`, `instagram_manage_comments`, and `pages_show_list` permissions.
2. **Step 2: Deploy Backend Template**:
   - 1-click deploy to Render, Railway, or Supabase.
   - Automatically generates secure database schema and webhook endpoints.
3. **Step 3: Webhook Handshake & Verification**:
   - Enters Webhook URL and Secret.
   - ChatFlow AI triggers a simulated test comment to confirm bidirectional handshake.
4. **Step 4: Configure First Live Reel**:
   - Selects one reel, sets keyword, enters 3 mandatory variations, and tests live send.
   - **Dashboard Unlocks Only Upon Step 4 Completion.**

---

## 8. Dashboard & Analytics Suite

### A. Daily Analytics with Interactive Bar Charts
- **Visual Metrics**:
  - Daily Comment Inflow (by keyword trigger).
  - DMs Dispatched vs. Delivered.
  - Follow-Gate Conversion Rate (% of non-followers who followed to unlock the link).
  - Link Click-Through Rate (CTR) on 3-button cards.
- **Interactive Chart Controls**: Switch between 7-day, 14-day, 30-day, and custom date filters.

### B. Proactive Alert & Health Monitoring System
- **Delivery Channels**:
  - **Transactional Email via Resend**: Immediate alert if access token expires, Meta permissions are revoked, or backend fails health checks.
  - **In-App Notification Center**: Live toasts and badges tracking automation status.
  - **Webhook Failure Log**: Real-time inspection table displaying error codes (`429 Rate Limit`, `400 Bad Token`, etc.) with 1-click retry.

---

## 9. Extreme 3D Landing Page Architecture (ThreeUI Integration)

### A. Aesthetic Rules & Strict Constraints
1. **STRICT ZERO-PURPLE POLICY**:
   - Absolute zero purple, violet, indigo, magenta, or lavender anywhere across backgrounds, typography, borders, glows, or 3D shaders.
   - Approved Palette:
     - **Porcelain White**: `#ffffff`, `#f8fafc`, `#f1f5f9`
     - **Electric Cyan / Sky Blue**: `#0284c7`, `#0ea5e9`, `#38bdf8`, `#bae6fd`
     - **Vibrant Emerald Green**: `#10b981`, `#059669`, `#34d399`
     - **Titanium Slate / Chrome**: `#0f172a`, `#1e293b`, `#334155`, `#94a3b8`
2. **STRICT LIGHT MODE ONLY**:
   - Luminous, airy daylight aesthetic. High visual clarity, soft glassmorphism, clean inset shadows, and daylight ambiance. No dark mode backgrounds.
3. **Cinema-Grade Motion Graphics**:
   - Inspired by `sharplink.com`, `otsuka-air.jp`, `void.sbs`.
   - Continuous scrollytelling where 3D elements rotate, float, settle, and respond to scroll velocity.

### B. Integrated ThreeUI Components ([MengTo/threeui](https://github.com/MengTo/threeui.git))
1. **Tactile 3D Skeuomorphic Follow-Gate Switch (`TactileFollowToggle`)**:
   - Inset light bevels, micro-grooves, radial light rays, ambient wave ripples, and physical spring toggle between "Follow-Gate Active" and "Open DM".
2. **360° Conic Laser Beam CTA (`BeamCtaButton`)**:
   - Continuous rotating conic laser beam (`#0284c7` cyan to `#10b981` emerald), micro-dot matrix pattern inside, optical glass refraction, and spring bounce on hover.
3. **Global Connectivity Nexus (`ConnectivityNexus`)**:
   - High-performance HTML5 Canvas particle stream where hundreds of radiant cyan/emerald particles arc upward along vectors with speed variations, glowing heads, and gradient tails.
4. **3D Isometric Diagnostics Panel (`IsometricDiagnosticsPanel`)**:
   - 3 interactive cards featuring live projected isometric 3D canvas wireframes:
     - *Card 1*: 3D Floating Isometric Slabs (Private SQLite / Token Encryption).
     - *Card 2*: 3D Rotating Isometric Cubes (Render/Railway Worker Cluster).
     - *Card 3*: 3D Elastic Grid Wave (Meta Graph API v21.0 Queue).
     - Equipped with flashlight mouse illumination and shooting border laser beams.
5. **Luminous Fluid Wave Shader (`LuminousFluidShader`)**:
   - Custom WebGL shader plane running smooth sine-modulated caustics with cyan/emerald highlights over daylight white.

---

## 10. Technical Architecture & Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Framer Motion, GSAP + ScrollTrigger.
- **3D & WebGL Engine**: Three.js (`three`), `@react-three/fiber`, `@react-three/drei`, Custom GLSL Shaders, HTML5 2D Canvas.
- **Control Plane & Auth**: Convex, `@convex-dev/auth`, Passwordless Email OTP via Resend.
- **Customer Backend**: Node.js / Express / Hono, BullMQ, Redis, PostgreSQL / SQLite, Meta Graph API SDK.
- **Components & UI**: Radix UI primitives, Lucide Icons, ThreeUI ported modules.

---

*Document compiled and verified on September 6, 2026. This file serves as the definitive reference blueprint for ChatFlow AI development.*
