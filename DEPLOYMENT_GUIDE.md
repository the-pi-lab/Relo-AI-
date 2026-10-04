# RELO — Deployment Guide

This guide covers production deployment for the **Frontend Application** (Vercel) and the **Cloudflare Edge Engine** (Workers + D1).

---

## Part 0 — Prerequisites

- Node.js **22+**
- A [Cloudflare](https://dash.cloudflare.com) account (free plan works)
- A [Meta developer app](https://developers.facebook.com) with Instagram Graph permissions (`instagram_business_basic`, `instagram_business_manage_messages`, `instagram_business_manage_comments`, `pages_show_list`, `pages_read_engagement`)
- A [Resend](https://resend.com) account (login-code emails)
- A [Vercel](https://vercel.com) account

---

## Part 1 — Cloudflare D1 Database

```bash
cd backend
npm install
npx wrangler login
npx wrangler d1 create relo-d1
```

Copy the `database_id` UUID from the output into `backend/wrangler.toml`, then apply the schema:

```bash
npx wrangler d1 execute relo-d1 --remote --file=./schema.sql
```

---

## Part 2 — Engine Secrets (Cloudflare Workers)

Set each secret exactly as named — the code reads these identifiers:

```bash
npx wrangler secret put META_APP_ID
npx wrangler secret put META_APP_SECRET
npx wrangler secret put META_VERIFY_TOKEN
npx wrangler secret put ENCRYPTION_MASTER_KEY   # 64 hex chars — see backend/.env.example
npx wrangler secret put JWT_SECRET
npx wrangler secret put RESEND_API_KEY
```

> **Never** skip `ENCRYPTION_MASTER_KEY` — the engine hard-fails without it.
> Generate keys: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

Deploy the engine:

```bash
npx wrangler deploy
```

Note your Worker URL, e.g. `https://relo-engine.<your-subdomain>.workers.dev`, then:

1. In the **Meta App Dashboard → Webhooks**, add the `instagram` subscription with callback URL `<worker-url>/webhook`, verify token = `META_VERIFY_TOKEN`, and subscribe to `comments` and `messages` fields.
2. Add the OAuth redirect / login origin used by the frontend to the app's allowed origins.

---

## Part 3 — Frontend (Vercel)

1. Import this repository into Vercel (framework preset: **Vite**).
2. Environment variable:

   | Name | Value |
   |---|---|
   | `VITE_API_URL` | your Worker URL from Part 2 |

3. Deploy. `vercel.json` ships the SPA rewrites, security headers, and asset caching.

---

## Part 4 — Verify

- `GET <worker-url>/health` → `{"status":"healthy",...}`
- Log in on the site with an email OTP.
- Connect an Instagram Professional account (Meta login flow).
- Automate a Reel with a keyword like `GUIDE`, then comment the keyword on that Reel from another account — within ~30–90 seconds you should see a public reply and receive the 3-button DM.

---

## Ops notes

- The cron trigger (`* * * * *` in `wrangler.toml`) is the queue consumer. Stuck `processing` jobs self-heal after a 5-minute lease.
- Rotating `ENCRYPTION_MASTER_KEY`? Re-connect Instagram accounts so tokens re-encrypt under the new key (envelopes are versioned; old ones stay decryptable until you rotate).
