# RELO — Deployment Guide

This guide covers production deployment for the **Frontend Application**, the **Cloudflare Edge Engine**, and the **Customer Self-Hosted Backend**.

---

## 1. Frontend Deployment (Vercel / Cloudflare Pages / Netlify)

The frontend is a static Vite application built on React 19 and Tailwind CSS v4.

### Build Configuration:
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Node Version**: `>= 20.x`
- **Environment Variables**:
  - `VITE_API_BASE_URL`: URL of your deployed Cloudflare Worker (or customer backend API), e.g. `https://api.yourdomain.com`

---

## 2. Serverless Edge Engine Deployment (`backend/`)

The primary backend executes on Cloudflare Workers and Cloudflare D1 SQL database.

### Prerequisites:
- A Cloudflare account (free tier supports up to 100k requests/day and 5M D1 row reads/day).
- Cloudflare Wrangler CLI (`npx wrangler`).

### Deployment Steps:
1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   ```
2. Authenticate with Cloudflare:
   ```bash
   npx wrangler login
   ```
3. Initialize the D1 database:
   ```bash
   npx wrangler d1 create relo-d1
   ```
4. Apply the SQL schema to production:
   ```bash
   npx wrangler d1 execute relo-d1 --remote --file=./schema.sql
   ```
5. Set production secrets in Cloudflare:
   ```bash
   npx wrangler secret put META_APP_SECRET
   npx wrangler secret put WEBHOOK_VERIFY_TOKEN
   npx wrangler secret put ENCRYPTION_KEY
   npx wrangler secret put JWT_SECRET
   npx wrangler secret put RESEND_API_KEY
   ```
6. Deploy the Worker:
   ```bash
   npx wrangler deploy
   ```

---

## 3. Self-Hosted Backend Deployment (`customer-backend/`)

For creators who prefer single-tenant hosting on Railway, Render, Fly.io, or their own VPS.

### Prerequisites:
- Node.js `>= 20.0.0`
- PostgreSQL `>= 14` database

### Deployment Steps:
1. Set up your environment variables in your hosting provider:
   - `DATABASE_URL`: Your PostgreSQL connection string.
   - `META_APP_SECRET`: App Secret from developers.facebook.com.
   - `WEBHOOK_VERIFY_TOKEN`: Random secure string matching Meta webhook setup.
   - `ENCRYPTION_KEY`: 64-hex char AES-256 key (required in production).
   - `BACKEND_AUTH_TOKEN`: High-entropy Bearer token for server-to-server config pushes.
   - `NODE_ENV`: `production`
2. Run database migrations:
   ```bash
   psql $DATABASE_URL -f migrations/001_initial.sql
   ```
3. Start the application:
   ```bash
   npm start
   ```

---

## 4. Meta Webhook Verification

Once your backend is running:
1. Open the [Meta App Dashboard](https://developers.facebook.com).
2. Under **Instagram > Configuration > Webhooks**:
   - **Callback URL**: `https://your-worker-or-backend/webhook` (or `/webhooks/instagram`)
   - **Verify Token**: Must match your `WEBHOOK_VERIFY_TOKEN`.
3. Click **Verify and Save**.
4. Subscribe to the `comments` and `messages` fields.