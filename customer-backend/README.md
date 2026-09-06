# Chat Flow AI — Customer Backend (v1)

Your automation runtime. You own it: your Postgres, your secrets, your API
usage. Chat Flow AI's cloud never sees your Meta tokens or AI keys.

- **Stack:** Node 20 + Express + Postgres. No Redis.
- **Processes:** one container runs the API **and** the embedded worker.
- **License:** MIT.

## Quick start (local)

```bash
cp .env.example .env   # fill in values (see table below)
docker compose up --build
```

Health: `GET http://localhost:3000/health` → `{"ok":true,...}`

## Environment

| Var | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | yes | Your Postgres connection string |
| `META_APP_SECRET` | yes* | *or `FACEBOOK_APP_SECRET`/`INSTAGRAM_APP_SECRET` (any one) |
| `WEBHOOK_VERIFY_TOKEN` | yes | Must match Meta app dashboard exactly |
| `BACKEND_AUTH_TOKEN` | yes | Random 64-hex; Chat Flow AI pushes config with it |
| `IG_ACCOUNT_ID` / `IG_USERNAME` / `META_ACCESS_TOKEN` | bootstrap | Single account via env; more via config push |
| `ENCRYPTION_KEY` | recommended | 64-hex; enables AES-256-GCM token encryption at rest |
| `AI_PROVIDER` | no | `none` (default) / `openai` / `gemini` + provider key/model |
| `META_GRAPH_HOST` / `META_GRAPH_API_VERSION` | no | Defaults `graph.instagram.com` / `v25.0` |
| `POLL_INTERVAL_MS` / `RATE_LIMIT_MAX` | no | Defaults `2000` / `750` (Meta's hourly cap) |

Generate secrets: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

## Deploy options

### Railway (recommended: app + Postgres in one project)
1. Railway → New Project → Deploy from GitHub repo (service root: `customer-backend/`; the Dockerfile is auto-detected).
2. New → Database → Postgres (same project).
3. App service → Variables: `DATABASE_URL=${{Postgres.DATABASE_URL}}` plus every var from `.env.example` (Meta, webhook token, `BACKEND_AUTH_TOKEN`, Instagram account, `ENCRYPTION_KEY`).
4. Settings → Networking → Generate Domain. That URL is your backend URL — paste it in Chat Flow AI → Backend → Connect.

### Render + Neon/Supabase (free tier with sleep)
1. Create a free Postgres at Neon or Supabase; copy the connection string (use the pooled host if offered). Do NOT use Render's free Postgres for automation — it expires 30 days after creation and is then deleted.
2. Render → New → Blueprint → connect your repo (`render.yaml` is included).
3. Set env vars with `DATABASE_URL` pointing at Neon/Supabase.
4. Deploy, copy the `https://xxx.onrender.com` URL, connect it in Chat Flow AI → Backend.
5. Free Render services sleep after 15 idle minutes and wake in ~1 minute on the next request (Meta retries redeliver in the meantime). Only if you observe missed events, add a free UptimeRobot monitor on `<url>/health` every 5 minutes — note a 24/7 ping consumes Render's 750 free instance hours/month, roughly the entire allowance for one service.

### Supabase as database only
Create a Supabase project → Database settings → connection string (port 6543 pooler host for hosted apps) → deploy the app on Railway/Render/Fly with that `DATABASE_URL`. Free Supabase projects pause after inactivity; resume from the dashboard and the app reconnects on its own.

### Fly.io
```bash
fly auth login
fly launch        # Dockerfile detected; skip Fly Postgres if using Neon/Supabase
fly secrets set DATABASE_URL=... META_APP_SECRET=... WEBHOOK_VERIFY_TOKEN=... BACKEND_AUTH_TOKEN=... IG_ACCOUNT_ID=... IG_USERNAME=... META_ACCESS_TOKEN=... ENCRYPTION_KEY=...
fly deploy        # URL: https://<app-name>.fly.dev
```
Set `auto_stop_machines = off` (or `min_machines_running = 1`) — the webhook receiver must not sleep through events.

### VPS / Docker
`docker build -t chatflow-backend . && docker run -p 3000:3000 --env-file .env chatflow-backend` against any reachable Postgres.

**Migrations** run automatically at boot (`schema_migrations` table).

## Meta webhook setup

1. Meta app dashboard → Instagram webhook → Callback URL: `https://<your-backend>/webhooks/instagram`, Verify Token: your `WEBHOOK_VERIFY_TOKEN`.
2. Subscribe to `comments` + `messages` fields.
3. Post a test comment → `GET /api/status` shows `webhooksReceived` incrementing.

## Sleeping backends

Free web services sleep when idle. If you observe missed events, add a free **UptimeRobot** monitor pinging `GET /health` every 5 minutes — but weigh the cost: on Render a 24/7 ping consumes the 750h monthly free budget almost entirely. Webhook traffic wakes a sleeping service on its own (~1 min cold start, which Meta retries cover), so start without the ping and add it only on evidence. Only use keep-awake pings where the provider's terms allow them.

## API

- `GET /health` — liveness + DB check (public).
- `GET /webhooks/instagram` — Meta verification handshake.
- `POST /webhooks/instagram` — Meta event ingress (HMAC enforced, 401 otherwise).
- `POST /api/config/push` — `Authorization: Bearer <BACKEND_AUTH_TOKEN>`. Body: `{ flows: [...], igAccounts: [...] }`. Tokens accepted here ONLY over server-to-server TLS (control-plane handoff) — browsers never hold them. Validation rejects flows without keywords or `dm_message`; stale flows are deactivated via `is_active:false` (never deleted, so `dm_logs` history survives).
- `GET /api/status` — public operational snapshot (accounts, flow counts, queue depth, AI configured?, counters). Contains **no secrets**.

## Free-tier design

- Webhook path: verify → filter → dedupe (`processed_events` UNIQUE) → match cached flows → enqueue **only on match**. 1000 irrelevant events = 0 Postgres writes.
- Queue: Postgres `jobs` table, `FOR UPDATE SKIP LOCKED` claiming, durable `next_run_at` delays, exponential backoff, retention cleanup (completed 7d, failed 30d, seen events 30d).
- Rate limit: per-account 750/hour counter; overflow jobs reschedule to the window reset (max 3 requeues worth of patience, then `skipped_rate_limit`).
- Disconnected accounts fail terminally with a reconnect error instead of retrying forever; Meta calls time out (30s sends, 15s profile) so a hung socket can never stall the worker.
- AI: invoked only for `ai_enabled` flows; keyword-only flows never call it. AI failure falls back to the template message.

## AI setup (optional)

1. On this backend set `AI_PROVIDER=openai` (plus `OPENAI_API_KEY`, optional `OPENAI_MODEL`) or `AI_PROVIDER=gemini` (plus `GEMINI_API_KEY`, optional `GEMINI_MODEL`). `OPENAI_BASE_URL` / `GEMINI_BASE_URL` overrides exist for proxies and tests.
2. Restart/redeploy. `/api/status` reports `{ provider, configured, model }` — keys are never exposed.
3. In Chat Flow AI → Flows, enable “AI-generated reply” per automation and add instructions. The template DM stays as the fallback.
4. Billing is yours: every AI reply consumes YOUR provider quota. Keep AI off for high-volume keyword flows.

## Honest v1 limits

- **Follow-gating is one-shot per comment** (no postback/button infra yet): a non-follower gets the follow prompt as the comment's private reply; the link goes out when they comment again after following. Tappable follow-check buttons are a planned enhancement.
- **One private reply per comment** is a Meta rule, enforced across all automations (`skipped_dedup`).
- **Single Graph host** (`META_GRAPH_HOST`): if sends fail with permission errors, confirm your token type matches the host.
- No inbox UI, no link tracking, no polling reconciler in v1 — webhooks are the event source.
