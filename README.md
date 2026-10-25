# RELO AI

**Comments in. Customers out.** RELO turns Instagram Reel comments into verified, 3-button Generic-Template DMs — on complete autopilot, with anti-spam human-timing built in.

One product, one runtime: a **Cloudflare Workers edge engine** backed by **D1 (SQLite)** and driven by a 1-minute Cron-as-Queue. No servers to babysit.

---

## Architecture

```
┌────────────────────────────┐
│  Next.js 16 + React 19     │  Landing · Login (OTP) · Creator Studio
│  src/app  (Vercel)         │
└─────────────┬──────────────┘
              │ REST /api/*  (Bearer JWT, revocable session)
┌─────────────▼──────────────┐
│  Cloudflare Worker Engine  │  Auth · OAuth · Automations · Leads · Billing
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
| `src/app/` | Next.js App Router — landing, login, Creator Studio dashboard |
| `src/components/`, `src/lib/` | UI system, RELO design tokens, API client |
| `backend/` | Cloudflare Workers engine (TypeScript, D1, cron queue) |
| `backend/migrations/` | Ordered, idempotent SQL upgrades (`npm run migrate`) |
| `design-system/` | Brand & design tokens |
| `docs/archive/` | Superseded planning documents |

---

## Security model

- **Auth**: passwordless email OTP (6 digits, 10-minute expiry, 5-attempt lockout, 60-second resend throttle, per-IP rate limits), stored as an HMAC hash rather than plaintext → HS256 JWT (7 days, mandatory `exp`, `alg` pinned, unique `jti`).
- **Revocation**: every token needs a live `sessions` row. `POST /api/auth/logout` revokes one session; `/api/auth/logout-all` revokes every session for the user.
- **Authorization**: every account-scoped route passes through an ownership gate (`getOwnedAccount`) — cross-tenant access is structurally impossible. Admin routes re-read `users.is_admin` server-side.
- **Token vault**: Instagram page tokens encrypted with AES-256-GCM (HKDF-derived key, random IV per encryption, versioned envelopes for rotation). The master key is hard-required — no fallback to the JWT secret.
- **Webhooks**: Meta and Lemon Squeezy signatures are HMAC-SHA256 verified over the raw body with constant-time comparison; per-event fault isolation.
- **Billing**: plans live on the user, Lemon Squeezy orders activate exactly once (unique provider reference), and expired plans downgrade on cron. The client never grants a plan.
- **Disconnect**: disconnecting an account is a soft delete — history survives, credentials are wiped, the plan slot is freed.
- **AI**: replies are grounded in the creator's catalog, prices are audited against it, and customer text is passed as untrusted data. On any doubt the bot hands off to the creator instead of guessing.
- **OAuth**: server-side code→token→long-lived-token exchange; Instagram bindings can never be stolen by a later connect.

See `RELO_AI_COMPLETE_ARCHITECTURE_AND_SPECIFICATION.md` for the full system design.

---

## Development

```bash
# Frontend (Next.js)
npm install
npm run dev          # next dev on :3000
npm run build        # production build
npm run lint
npm run test         # frontend unit tests

# Engine
cd backend
npm install
npm run typecheck    # tsc --noEmit
npm test             # phases 3–14 + e2e (in-memory D1)
npm run dev          # wrangler dev (local D1 + cron)
npm run migrate:dry  # show pending SQL migrations
npm run migrate      # apply pending migrations to remote D1
```

## Deployment

Frontend deploys to Vercel (`vercel.json` included), engine to Cloudflare Workers. Step-by-step: [`DEPLOYMENT_GUIDE.md`](./DEPLOYMENT_GUIDE.md).

## Open-source provenance

The comment-matching engine and webhook hardening patterns are adapted from [OpenReply](https://github.com/nikhilbhardwaj/openreply) (MIT).

---

Built by [The π Lab](https://www.thepilab.in) — software that behaves like magic.
