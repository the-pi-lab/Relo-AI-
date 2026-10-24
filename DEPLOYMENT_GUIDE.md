# RELO — Deployment Guide

Production deployment for the **frontend** (Next.js on Vercel) and the **Cloudflare Edge Engine** (Workers + D1).

---

## Part 0 — Prerequisites

- Node.js **22+**
- A [Cloudflare](https://dash.cloudflare.com) account (free plan works)
- A [Meta developer app](https://developers.facebook.com), type **Business**, with **Facebook Login for Business** and the Instagram Graph API product added
- A [Resend](https://resend.com) account (login-code emails)
- A [Vercel](https://vercel.com) account
- Optional: a [Cloudflare Turnstile](https://developers.cloudflare.com/turnstile/) site (login captcha)

---

## Part 1 — Cloudflare D1 database

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

## Part 2 — Engine secrets (Cloudflare Workers)

Set each secret exactly as named — the code reads these identifiers. The full annotated list is in `backend/.env.example`.

```bash
cd backend
npx wrangler secret put META_APP_ID
npx wrangler secret put META_APP_SECRET
npx wrangler secret put META_VERIFY_TOKEN
npx wrangler secret put ENCRYPTION_MASTER_KEY   # 64 hex chars — see backend/.env.example
npx wrangler secret put JWT_SECRET
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put PUBLIC_BASE_URL         # e.g. https://api.relo.ai
npx wrangler secret put PUBLIC_APP_URL          # e.g. https://app.relo.ai
npx wrangler secret put ALLOWED_ORIGINS         # e.g. https://app.relo.ai,https://relo.ai
```

Optional:

```bash
npx wrangler secret put TURNSTILE_SECRET_KEY     # enables the login captcha
npx wrangler secret put MANUAL_UPI_ID            # India UPI upgrades
npx wrangler secret put NIM_API_KEY              # AI product Q&A in DMs
npx wrangler secret put LEMON_SQUEEZY_CHECKOUT_URL
npx wrangler secret put LEMON_SQUEEZY_WEBHOOK_SECRET
npx wrangler secret put ADMIN_SECRET
```

> **Never** skip `ENCRYPTION_MASTER_KEY` — the engine hard-fails without it.
> Generate keys: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

Deploy the engine:

```bash
npx wrangler deploy
```

Note your Worker URL, e.g. `https://relo-engine.<your-subdomain>.workers.dev`.

### CORS

The Worker only answers browser requests from `ALLOWED_ORIGINS` plus `PUBLIC_APP_URL`. Localhost is allowed automatically outside production. If the frontend is served from a new domain, add it to `ALLOWED_ORIGINS` and redeploy — otherwise every `fetch` fails preflight.

### Meta app configuration

1. **Webhooks** → add an `instagram` subscription with callback URL `<worker-url>/webhook`, verify token = `META_VERIFY_TOKEN`, and subscribe to the `comments` and `messages` fields.
2. **Facebook Login for Business → Settings → Valid OAuth Redirect URIs** → add the exact redirect URI used by the frontend: `https://<your-frontend>/auth/meta/callback`. It must match `NEXT_PUBLIC_META_REDIRECT_URI` byte-for-byte, including the trailing path.
3. **App Review** → request `instagram_basic`, `instagram_manage_comments`, `instagram_manage_messages`, `pages_show_list`, `pages_read_engagement`, `pages_manage_metadata`. Until review passes, only users with a role on the Meta app can connect an account.

---

## Part 3 — Frontend (Vercel)

1. Import this repository into Vercel. Framework preset: **Next.js** (do not override the build command; `next build` is correct, and `src/proxy.ts` supplies the CSP).
2. Environment variables:

   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_API_URL` | your Worker URL from Part 2 |
   | `NEXT_PUBLIC_APP_URL` | `https://your-frontend-domain` |
   | `NEXT_PUBLIC_META_APP_ID` | the same Meta app id as `META_APP_ID` |
   | `NEXT_PUBLIC_META_REDIRECT_URI` | `https://your-frontend-domain/auth/meta/callback` |
   | `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | optional, only if `TURNSTILE_SECRET_KEY` is set on the Worker |

3. Deploy.

`NEXT_PUBLIC_*` values are inlined at build time — changing one requires a redeploy, not just a restart.

---

## Part 4 — Verify

- `GET <worker-url>/health` → `{"status":"healthy",...}`
- Log in on the site with an email OTP.
- Connect an Instagram Professional account (Meta login flow) — you should land back on `#/studio/settings` with the account listed and a token expiry about 60 days out.
- Automate a Reel with a keyword like `GUIDE`, then comment the keyword on that Reel from another account. Within ~30–90 seconds you should see a public reply and receive the 3-button DM.
- Open `#/studio/analytics`: the comment, DM and lead counts should now be 1.

---

## Part 5 — Local development

Run the Worker and the frontend side by side; nothing else is needed.

```bash
# 1. Worker secrets for local runs (git-ignored)
cd backend
cp .env.example .dev.vars     # then set ENVIRONMENT=development and DEBUG_OTPS=1

# 2. Local D1 + the Worker on :8787
npm run d1:migrate:local
npm run dev          # wrangler dev

# 3. Frontend on :3000, pointed at the local Worker
cd ..
echo "NEXT_PUBLIC_API_URL=http://localhost:8787" > .env.local
echo "NEXT_PUBLIC_APP_URL=http://localhost:3000" >> .env.local
npm run dev
```

With `DEBUG_OTPS=1` the Worker returns the login code in the response and the sign-in
screen prints it, so no email is sent. Miniflare does not fire cron triggers on its
own — add `--test-scheduled` and call `/__scheduled` if you want to exercise the queue
consumer or the token refresh job locally.

`NEXT_PUBLIC_API_URL` must be `https://…` in production: the CSP in `src/proxy.ts`
only allows `http://localhost:*` while `NODE_ENV=development`.

---

## Ops notes

- **Cron** (`* * * * *` in `wrangler.toml`) is the queue consumer. Stuck `processing` jobs self-heal after a 5-minute lease.
- **Token refresh**: the same cron renews long-lived Instagram tokens that expire within 10 days. A rejected refresh is logged and retried at most once every 12 hours; the creator sees a "reconnect" prompt in Settings, which is the only fix for a revoked grant.
- **Pricing**: ₹199 Pro / ₹499 Studio. The UPI amount is decided server-side in `backend/src/api/router.ts`; changing it in the UI does nothing.
- **Follower gate**: removed. Meta exposes no follower lookup for a commenter, so RELO does not claim one and stores `NULL`.
- Rotating `ENCRYPTION_MASTER_KEY`? Re-connect Instagram accounts so tokens re-encrypt under the new key (envelopes are versioned; old ones stay decryptable until you rotate).
