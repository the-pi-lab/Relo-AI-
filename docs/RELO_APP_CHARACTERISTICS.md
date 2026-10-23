# RELO — App Characteristics & Product Behavior (Detailed Reference)

> Single source of truth for what RELO actually does, feature by feature, grounded in the real code (`backend/src/*`, `src/lib/relo/*`). Use this document when rebuilding the frontend, writing copy, designing pages, or reasoning about constraints. Nothing here is aspirational — every characteristic maps to shipped behavior.

---

## 1. What RELO Is

RELO is an **Instagram comment-to-DM engine** for creators and small brands. The core promise: *your Reel comments answer themselves* — every relevant comment gets a human-like public reply and a DM card with tappable buttons, turning commenters into leads while Meta's rules stay respected.

The founder workflow it replaces:

1. A creator posts a Reel ("Comment PRICE and I'll DM you the details").
2. Without RELO, they manually reply to hundreds of comments and DM each person by hand.
3. With RELO, the keyword is armed once, and the engine handles every matching comment forever — replying publicly, sending the DM card, capturing the lead, and letting the creator follow up with campaigns.

Everything in the app exists to serve that loop.

---

## 2. The Core Pipeline (What Actually Happens)

The real production flow, in order:

1. **Comment arrives** on a connected Reel.
2. **Keyword match** — RELO checks the comment against the automation's trigger keywords.
3. **Public reply fires** after a randomized **30–90 second "human jitter"** pause, so replies never look robotic or burst-like.
4. **DM is sent inside Meta's 24-hour messaging window** — a 3-button template card (or text DM) is delivered to the commenter.
5. **Lead is captured** with full source attribution (which reel, which keyword, which button).
6. **Optional follow-up DM** is scheduled (Pro/Studio only) if the lead never responds.
7. **Campaigns** can blast a message to everyone still reachable (inside the 24h window) — or up to 7 days with the approved HUMAN_AGENT tag.
8. **Products** in the catalog feed both the AI responder's answers and the link-in-bio page.
9. **Analytics** track the full funnel: comments seen → replies sent → DMs delivered → buttons clicked → leads.

Any rebuild must keep this behavior intact. No fake dashboards, no imaginary features.

---

## 3. Accounts & Instagram Connection

- A user can connect one or more **Instagram Business accounts** via the official Meta Graph API (Facebook Login callback: `/api/auth/meta/callback`).
- **Plan governs account count:** Free = 1 account, Studio = up to 3 connected accounts (`maxAccounts` in `tiers.ts`). Pro = 1.
- Each account is scoped to its owner: every request resolves `accountId` and asserts the authenticated user owns it (`requireOwnedAccount`). Cross-tenant access returns `404 ACCOUNT_NOT_FOUND`.
- Instagram **access tokens are stored encrypted** (`encryptSecret`/`decryptSecret` with a master key), never in plaintext.
- **Disconnecting an account stops everything** — automations stop firing for that account, queued jobs stop, and the connection is deleted (`deleteConnectedAccount`).
- Demo mode (`#/studio?demo=1`) uses local fixture data and touches no real Instagram account — labeled honestly in the UI.

---

## 4. Authentication & Sessions

- **Passwordless email OTP** is the only auth method.
  1. `POST /api/auth/otp/send` — validates email format, generates a 6-digit code, stores it with a **600-second (10 min) expiry**, and emails it via Resend.
  2. **Resend throttling** — a recent code blocks immediate re-requests (`OTP_RESEND_THROTTLED` with `retryAfterSeconds`).
  3. **CAPTCHA (Turnstile)** protects both send and verify steps.
  4. `POST /api/auth/otp/verify` — consumes the code (one-time use), then **finds or creates the user** by email.
  5. A signed **JWT session valid for 7 days** is issued. Deployments without `JWT_SECRET` fail closed (no token) rather than signing with a placeholder.
- Dev-only OTP echo exists but requires an explicit `DEBUG_OTPS=1` flag AND a non-production environment AND no Resend key configured — it is opt-in debug tooling, never default.
- Frontend demo sign-in exists separately (`Open the demo studio`) and is clearly a demo, not an auth bypass.

---

## 5. Automations (Reel-Level Comment→DM Rules)

The automation is RELO's central configuration object. Per Reel you configure:

| Field | Behavior |
|---|---|
| `reelId` / `reelCaption` | The Instagram Reel this automation watches |
| `triggerKeywords` | Comment text that activates the flow (keyword matching in `engine/keyword.ts`) |
| `commentReplies` | Public reply variations (spintax-validated in `engine/spintax.ts`; Free is pinned to exactly 2) |
| `followGateEnabled` | Require the commenter to follow before the DM (follower status is recorded on the lead) |
| `templateCard` | The DM card: `title`, optional `subtitle`, plus 1–3 buttons of type `web_url` / `postback` / `phone_number` |
| `isActive` | Live/paused toggle — pausing stops the engine for that reel |
| `followUpEnabled` / `followUpDelayMinutes` | One follow-up DM, sent only if the lead hasn't messaged since the original DM; delay defaults to 60 minutes |

Live counters maintained per automation: `triggersToday`, `dmsSent`, `clicks`.

**Plan-gated automation rules (server-enforced, `tiers.ts`):**

| Limit | Free | Pro | Studio |
|---|---|---|---|
| Reply variations | exactly 2 | 3–8 | 3–8 |
| Own DM buttons | 1–2 | 1–3 | 1–3 |
| RELO branded button injected | yes | no | no |
| Follow-up DMs | no | yes | yes |
| Campaigns | no | yes | yes |
| Canvas flow builder | no | no | yes |
| Connected accounts | 1 | 1 | 3 |
| Cron queue priority | normal | normal | **priority** |
| Monthly AI credits | 3 | 500 | 5000 |
| Products library | no | yes | yes |

A plan gate passes when the account's tier is **at least as high** as the required tier (`planSatisfies`), so Studio satisfies every Pro gate. Gates are enforced in the API router — hiding the UI button is not the control.

**Free-plan reel consumption:** a free account's assignable reels are tracked and consumed (`markFreeReelConsumed`) so the free tier stays honest about what it can run.

---

## 6. The Engine (Posting, Jitter, Timing, No Spam)

`backend/src/engine/processor.ts` (cron-driven) and friends implement the anti-spam posture:

- **Human jitter:** public replies fire after a randomized **30–90 s** pause; campaign sends carry their own **400–1200 ms** jitter between individual DMs (`campaignWorker.ts`). Nothing is ever sent in an instantly identical burst.
- **24-hour window respected at send time:** reachability is **re-checked per target when the send actually happens**, not just when the campaign was created. Expired targets are skipped and counted (`window_expired`).
- **Follow-up discipline:** a follow-up job sends **only if the lead has NOT messaged us since the original DM**, and only within the human takeover + 24h window. Free plan never schedules follow-ups.
- **HUMAN_AGENT tag:** when a campaign opts in, Meta's approved tag extends that message's window from 24h to **7 days**. The toggle is explicit on every campaign.
- **Failure classification:** every send failure is classified as `retryable` / `window_expired` / `token_dead` (`classifyCampaignFailure`), so campaigns fail with an honest reason instead of silently vanishing.
- **AI responder catalog window:** Studio accounts get a wider product-catalog window before AI answering stops (grounding: the responder answers from the product catalog; answers stop when the catalog window is exceeded).
- **Queue priority:** Studio jobs jump ahead of Normal in the cron batch — paid priority is real, not decorative.
- **Monthly AI credits** reset when due (`resetMonthlyCreditsIfDue`); each AI action spends a credit (`spendCredit` in the demo store mirrors the contract).

---

## 7. Leads

Every lead is a captured identity with full attribution:

- `username`, `followerStatusAtTrigger` (follow-gate state at the moment of the comment)
- `emailCollected` (when a lead hands over an email)
- `totalDmsSent`, `firstInteractionAt`, `lastInteractionAt`
- `sourceReelCaption` — exactly which reel produced them
- `clickedButton` — which DM-card button converted

**Reachability is a first-class status:** each lead is Reachable / Window-expired depending on their standing against Meta's 24h window. The UI explains this in plain text — never color-only.

**Export:** leads export to CSV (`getAllCapturedLeadsForExport`) with RFC 4180 escaping **and spreadsheet formula-injection neutralization** (`=`, `+`, `-`, `@`, tab, CR are neutralized) — a real security characteristic, not a detail.

---

## 8. Campaigns

One-shot message blasts to reachable audiences:

- **Fields:** name, kind (`text` or `card`), message text or card title, audience size, scheduled time, `usesHumanAgentTag`.
- **Status machine:** `draft → scheduled → sending → completed | failed`.
- **Real counters:** `sentCount`, `failedCount`, `unreachableCount` + `processed` percentage.
- **Fan-out:** `fanOutCampaignTargets` expands the audience into per-target jobs; the worker sends with jitter, re-checking reachability per target at send time.
- **HUMAN_AGENT opt-in** extends the window to 7 days for approved accounts — surfaced as an explicit toggle during creation.
- Campaigns are Pro/Studio only. Free plan has no campaign surface.

---

## 9. Canvas — Visual Flow Builder (Studio Only)

A node-graph editor for building automation flows visually.

- **Node types (exactly these):** `trigger_comment`, `action_reply`, `action_dm_card`, `action_dm_text`, `action_wait`, `action_condition`, `action_ai_text`, `note`.
- **Nodes** carry position (x/y), label, detail, and optional editor `params` (keyword lists, texts, timings).
- **Edges** define execution order; validation in `engine/flowGraph.ts` enforces:
  - exactly one trigger,
  - every action reachable from the trigger (no orphan nodes),
  - the trigger not wired into a cycle.
- A **starter graph** is created for new flows so the canvas never opens empty.
- Flows have `isActive` and `isPublished` states; `flowSaveSchema` validates the graph server-side.
- Canvas building is **Studio-gated** — Pro sees the nav locked; Free likewise.

---

## 10. Products Catalog

- **Fields:** name, `priceText` (freeform, e.g. "₹499" or "$19"), description, `link` (URL-validated `safeHttpUrl`), `isActive`, click counter.
- Consumed by **two systems**: the AI responder's grounded answers (products it may recommend/link in DMs) and the **link-in-bio page** (blocks can attach to products).
- The catalog has a **plan-based size limit** (Studio's window is larger, §4.4 of the plan) before AI answering stops recommending — not an arbitrary decoration.
- `productSaveSchema` validates every save server-side; count enforcement (`countProductsForAccount`) keeps the cap honest.

---

## 11. Link-in-Bio

A shareable public page per account:

- **Identity:** `headline`, `bio`, **public slug** (`/l/<slug>`, pattern `[a-z0-9_-]{3–60}`), theme (`volt` | `plain` | `dark`), `isPublished`.
- **Blocks:** label, `targetUrl`, optional `productId` (product-backed block), `clickCount`, `isActive`.
- Publish/unpublish is explicit; each block's clicks are counted; the server (`api/linkPageHtml.ts`) renders the final HTML for the public slug.
- Block editor lives in Studio next to a phone-preview frame; product-backed blocks keep catalog and page in sync.

---

## 12. Content Planner

- **Fields:** title, hook, `plannedFor` date, `status`.
- **Status flow:** `idea → drafting → scheduled → published` (validated by `isContentStatus`).
- Content is the intake side of the loop: *plan the reel so every future comment has an obvious automation to land on*. Publish flow (`contentPlanPublishSchema`) moves a plan to Published.
- Stats (`getContentStats`) summarize pipeline state.

---

## 13. Analytics & Activity

- **Funnel tracked end to end:** comments seen → replies sent → DMs delivered → buttons clicked (`getAnalyticsSummary`, `getAccountClickStats`).
- **Activity feed (`ActivityEvent`):** kinds `comment` | `dm` | `lead` | `click` | `system`, capped at the **40 most recent** events.
- KPIs and charts (Home/Insights) render only from real summaries or demo fixtures — the demo states this honestly.
- **Insights views:** 7d/14d ranges, funnel meters with conversion percentages, reachability breakdown, top buttons clicked, lead-source leaderboard.

---

## 14. Routing & Studio Shell

- **Hash-based routing** (`#/...`), URL is the only route source of truth; deep links land correctly in fresh tabs (`useSyncExternalStore` on the hash):
  - `#/` landing · `#/login` · `#/studio/<view>` (views: `home`, `insights`, `automations`, `canvas`, `content`, `leads`, `campaigns`, `products`, `linkbio`, `settings`) · `#/privacy` · `#/terms` · `#/cookies` · 404 for anything else.
- `?demo=1` on the studio hash activates demo mode.
- **Studio shell:** left chrome rail (nav groups Overview / Automate / Content / Audience / Storefront / Account), sticky glass topbar (Instagram connection chip, AI-credits meter, theme toggle, account menu), bottom plan card with upgrade CTA. Locked plan features show lock icons in nav — but the real gate is always server-side.
- **State:** `ReloProvider` holds user, plan, credits, automations, campaigns, flows, products, linkPage, content, activity; persisted to `localStorage` under key `relo-studio-v2` (versioned key retires stale snapshots without migration code). Leads and activity stay session-scoped demo data.

---

## 15. Security Characteristics (Real, Enforced)

- **CORS allowlist at the boundary** — `handleApiRequest` decorates every response; handlers cannot widen policy. Disallowed cross-origin browser requests are refused outright (`403 ORIGIN_NOT_ALLOWED`).
- **Rate limiting** on sensitive endpoints (per-IP and per-email for OTP; general limits elsewhere) with `Retry-After` and `X-RateLimit-*` headers.
- **CAPTCHA (Turnstile)** on OTP send/verify.
- **Encrypted secrets at rest** for Instagram tokens (`crypto.ts` master key).
- **Tenant isolation** — every account-scoped query asserts ownership; `assertTenantPolicies` self-checks row-level policies at startup.
- **Schema-validated bodies** (`parseBody` + zod schemas) for every mutating endpoint; safe IDs, URL validation, integer clamping.
- **CSV formula-injection defense** in exports.
- **Admin routes pre-guarded** — `requireAdmin` runs on the `/api/admin/*` prefix *before* any handler, with admin audit records; a new admin route cannot ship without the check.
- **Fail-closed configuration** — missing `JWT_SECRET` yields no sessions rather than insecure ones.
- **Payment / billing surface:** manual UPI entries, admin payment records, agency contact requests — all schema-validated and admin-audited.

---

## 16. Plans & Monetization Surface

- Three tiers: **Free / Pro / Studio** (`tiers.ts` matrix in §5 above is the contract; `plan.md` §3 is its origin).
- Upgrade paths surface in the shell (plan card, locked nav items) and Settings; server-side activation via `activatePlanForUser`.
- **AI credits** are the usage meter: Free 3 / Pro 500 / Studio 5000 per month, reset monthly when due.
- **Referral system:** referral code lookup (`findReferrerByCode`), referral recording, qualification, and reward issuance; shareable links to `https://relo.ai`.
- Public site origin constant: `SITE_URL = https://relo.ai` (used for share/referral links).

---

## 17. Demo Mode (Honest by Design)

- `#/studio?demo=1` seeds the entire Studio from `DEMO_*` fixtures (`src/lib/relo/data.ts`) — automations, leads, campaigns, flows, products, link page, content, activity.
- Demo data is field-compatible with production contracts (`src/types/contracts.ts` of the Cloudflare engine), so designers and stakeholders see real shapes, not mockups of imaginary features.
- The UI labels demo state clearly; demo never touches real Meta tokens or sends anything.

---

## 18. Non-Negotiable Invariants (Summary Checklist)

When evaluating any rebuild or redesign of RELO, these must remain true:

1. Keyword match → public reply with 30–90s jitter → 3-button DM within 24h is the heartbeat; nothing may fake it.
2. Plan gates are enforced server-side (`tiers.ts`), regardless of UI.
3. Every lead carries attribution: reel, keyword, button, follow status.
4. Reachability (24h window) is re-checked at send time; failures are classified honestly.
5. Follow-ups apply only to silent leads, Pro/Studio only.
6. Campaigns jitter, respect HUMAN_AGENT opt-in (7d), and count sent/failed/unreachable truthfully.
7. Canvas validation: single trigger, no orphan actions, server-validated graphs.
8. Token encryption, tenant isolation, rate limits, captcha, CORS allowlist, CSV injection defense — all present, all real.
9. Demo mode is clearly labeled and backend-free.
10. No invented dashboards, fake metrics, or decorative filler anywhere in the product.

---

*Last verified against code: 2026-10-23 (commit `38087d9` lineage — liquid-glass pass).*
