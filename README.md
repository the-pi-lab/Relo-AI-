# RELO AI

**Comments in. Customers out.** RELO turns Instagram Reel comments into verified, 3-button Generic-Template DMs — on complete autopilot, with anti-spam human-timing built in.

One product, one runtime: a **Cloudflare Workers edge engine** backed by **D1 (SQLite)** and driven by a 1-minute Cron-as-Queue. No servers to babysit.

---

## Architecture

```
┌────────────────────────────┐
│  React 19 + Vite SPA       │  Landing · Login (OTP) · Creator Studio
│  (Vercel)                  │
└─────────────┬──────────────┘
              │ REST /api/*  (Bearer JWT)
┌─────────────▼──────────────┐
│  Cloudflare Worker Engine  │  Auth · OAuth · Automations · Leads · Telemetry
│  backend/  (Workers + D1)  │
└───────┬───────────┬────────┘
        │           │
  Meta Graph     1-min Cron-as-Queue
  API v21        webhook → jobs → DM dispatch
```

**Core flow:**

1. Creator connects an Instagram Professional account via Meta OAuth (server-side token exchange, AES-256-GCM token vault).
2. Creator picks a Reel and configures: trigger keywords (Unicode whole-word matching), 3–8 spintax comment-reply variations (mandatory anti-spam), a 3-button Generic Template card, and an optional follow-gate.
3. A viewer comments a keyword → Meta webhook (HMAC-SHA256 verified) → job enqueued in D1 with atomic deduplication and 30–90s human jitter.
4. Every minute, the cron claims due jobs and dispatches: public comment reply → private DM with the 3-button card → lead captured.
5. Manual replies by the creator (echo events) or inbound DMs auto-pause automation on that thread for 30 minutes (Human Takeover).

**Monorepo layout:**

| Path | What it is |
|---|---|
| `src/` | React 19 SPA — landing, login, Creator Studio dashboard |
| `backend/` | Cloudflare Workers engine (TypeScript, D1, cron queue) |
| `design-system/` | Brand & design tokens |
| `docs/archive/` | Superseded planning documents |

---

## Security model

- **Auth**: passwordless email OTP (6 digits, 10-minute expiry, 5-attempt lockout, 60-second resend throttle, per-IP rate limits) → HS256 JWT (7 days, mandatory `exp`, `alg` pinned).
- **Authorization**: every account-scoped route passes through an ownership gate (`getOwnedAccount`) — cross-tenant access is structurally impossible.
- **Token vault**: Instagram page tokens encrypted with AES-256-GCM (HKDF-derived key, random IV per encryption, versioned envelopes for rotation). The master key is hard-required — no fallback to the JWT secret.
- **Webhooks**: HMAC-SHA256 signature verification over the raw body with constant-time comparison; per-event fault isolation.
- **OAuth**: server-side code→token→long-lived-token exchange; Instagram bindings can never be stolen by a later connect.

See `RELO_AI_COMPLETE_ARCHITECTURE_AND_SPECIFICATION.md` for the full system design.

---

## Development

```bash
# Frontend
npm install
npm run dev          # Vite dev server
npm run build        # typecheck + production build
npm run test         # frontend unit tests

# Engine
cd backend
npm install
npm run typecheck    # tsc --noEmit
npm test             # phases 3/4/5 + e2e integration (in-memory D1)
npm run dev          # wrangler dev (local D1 + cron)
```

## Deployment

Frontend deploys to Vercel (`vercel.json` included), engine to Cloudflare Workers. Step-by-step: [`DEPLOYMENT_GUIDE.md`](./DEPLOYMENT_GUIDE.md).

## Open-source provenance

The comment-matching engine and webhook hardening patterns are adapted from [OpenReply](https://github.com/nikhilbhardwaj/openreply) (MIT).

---

Built by [The π Lab](https://www.thepilab.in) — software that behaves like magic.
