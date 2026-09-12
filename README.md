# ChatFlow AI — Instagram Automation Studio

> The $10 One-Time Lifetime Alternative to ManyChat's $180+/Year Recurring Contact Tax. Built on the official Meta Graph API v21.0.

ChatFlow AI automates Instagram Reels comment-to-DM funnels with 3-button Generic Template cards, Spintax comment rotation, Follow-Gate verification, and 1-click lead capture — without charging recurring monthly contact scaling penalties.

---

## 🏗️ System Architecture & Backend Decision Matrix

ChatFlow AI supports two deployment architectures to give creators complete infrastructure sovereignty:

| Feature / Attribute | ⚡ Cloudflare Edge Engine (`backend/`) | 🐳 Self-Hosted Container (`customer-backend/`) |
| :--- | :--- | :--- |
| **Target Runtime** | Cloudflare Workers + D1 Database | Node.js (Express 4) + Postgres |
| **Best For** | Zero-maintenance serverless hosting on Cloudflare's free tier | Self-hosting on private VPS, Railway, Render, or Supabase |
| **Ingress Latency** | `< 15ms` edge webhook ACK globally | Depends on single-region VPS location (`~50–150ms`) |
| **Queue Engine** | Cron-as-Queue (1-minute atomic batch worker in D1) | Postgres table-backed queue with atomic `FOR UPDATE` |
| **Anti-Spam Jitter** | 30–90 second deterministic human-like delay | 30–90 second configurable jitter |
| **Token Encryption** | AES-256-GCM authenticated encryption | AES-256-GCM authenticated encryption |
| **Meta Rate Limits** | Proactive token bucket tracking Meta's 750/hr cap | In-memory sliding window + atomic Postgres counter |
| **Deployment Command** | `npm run deploy` (via Wrangler) | `npm start` / `docker compose up` |

---

## 📦 Repository Structure

```
chatflow-ai-main/
├── src/                          # Modern React 19 + Tailwind CSS v4 Frontend
│   ├── components/
│   │   ├── dashboard/            # Creator Studio (ReelsGrid, AutomationEditor, LeadsTable, AnalyticsCards)
│   │   ├── landing/              # Porcelain Daylight Landing (SavingsCalculator, Simulator, Comparison, FAQ)
│   │   └── ui/                   # Minimal design tokens (button.tsx, input.tsx, switch.tsx)
│   ├── lib/                      # Typed REST client, pricing calculators, URL/keyword sanitization
│   └── pages/                    # Landing.tsx, Login.tsx, Dashboard.tsx, NotFound.tsx
├── backend/                      # Cloudflare Workers + D1 Serverless Engine
│   ├── src/                      # Router, Crypto, Meta Graph API v21.0, Spintax AST, Cron-as-Queue
│   └── tests/                    # Automated test suites (Phase 3, Phase 4, Phase 5, Phase 7 E2E)
├── customer-backend/             # Customer-owned Express + Postgres Automation Runtime
│   ├── src/                      # Ingress webhook, Postgres queue, rate-limiter, HMAC verification
│   └── test/                     # 27 Node.js native test suites
├── tests/                        # Frontend unit test suite (pricing tiers, anti-XSS, WAI-ARIA navigation)
└── package.json                  # Lean dependency footprint (~11 runtime packages)
```

---

## 🚀 Quick Start (Development)

### 1. Frontend Setup
```bash
# Install dependencies
npm install

# Run frontend development server
npm run dev

# Run frontend automated unit tests
npm test

# Build production bundle
npm run build
```

### 2. Cloudflare Edge Engine (`backend/`)
```bash
cd backend

# Run automated integration tests (Crypto, Webhook, Cron Worker, REST API, E2E)
npm test

# Run local Worker emulator
npx wrangler dev
```

### 3. Customer-Hosted Backend (`customer-backend/`)
```bash
cd customer-backend

# Copy environment variables
cp .env.example .env

# Run automated test suites (27 unit tests)
npm test

# Start server
npm start
```

---

## 🛡️ Security, Privacy & Meta Compliance

1. **Official Meta Graph API v21.0**: Built directly on Meta's official webhook protocols and Messaging API. Supports 3-button Generic Template cards, dynamic username personalization, and Spintax variation to safeguard account authenticity.
2. **AES-256-GCM Encryption**: Page access tokens are encrypted at rest using AES-256-GCM authenticated encryption. Plaintext storage is rejected in production.
3. **WCAG 2.1 AA Accessibility**: Full keyboard navigation support (WAI-ARIA tabs and accordions), accessible data table captions with column and row scopes, focus rings, and high contrast ratios ($\ge 4.5:1$).
4. **Zero Contact Tax**: Contact lists and leads belong 100% to the creator with 1-click RFC 4180 CSV export.
