# RELO AI — Product Plan

> Single source of truth for what we're building and in what order.
> Status: **PLAN — implementation does not start until the owner gives a phase-by-phase green light.**
> Last updated: 2026-10-03

---

## 1. Vision & Positioning

RELO turns Instagram Reel comments into verified, clickable DMs — on autopilot, on the official Meta Graph API.

**Positioning:** *ManyChat charges rent on your own audience. RELO charges one flat subscription — your growth is free.* Unlimited contacts, unlimited DMs, no per-contact tax. Benchmarks: ManyChat, Zorcha, SuperProfile.

**Hard constraints (owner's):**
- Zero budget. First 100–200 users must run entirely on Cloudflare's free tier.
- Solo founder. Everything automatable gets automated; manual ops only where unavoidable (India payments at launch).
- Owner already holds Meta app permissions/approval.

**Product principles:**
1. AI is a feature we sell, never a dependency we carry. Spintax always sends; AI enhances.
2. Restraint is the premium signal. Modern SaaS aesthetics, minimal purposeful motion.
3. Meta's rules are the rails we ride (24h window, messaging tags, app review). We never design around them — we design within them.
4. One hard identity: the Instagram account (OAuth binding). Everything else is a soft signal.

---

## 2. Design System

- **Style:** clean modern SaaS — neutral surfaces, near-black text, ONE accent color, 1px hairline borders, soft shadows, generous spacing. No decorative palettes, no film grain, no marquees, no scroll-hijacking, no poster metaphors.
- **Theme:** token-based (CSS custom properties) with a **System / Light / Dark** toggle in Settings + landing; default follows system. Both themes are first-class.
- **Typography:** one UI sans (Inter-class) + optional serif italic for display numerals. Nothing else.
- **Motion:** _Updated 2026-10-03 at owner request._ The marketing landing now runs **heavy motion** — pointer-driven 3D tilt on the hero product scene, cursor spotlight on feature cards, count-up stats, one-time entrance staggers. The **app itself keeps the original restraint** (150–300ms micro-transitions, nothing continuous except a live pulse). All motion is CSS/rAF only — no animation library — and every effect is disabled under `prefers-reduced-motion` and on touch.
- **Landing page structure (no animation showcase):** Nav → Hero (headline, subtext, CTA, real product visual: comment→DM explainer) → social proof strip → How it works (3 steps) → Feature grid → Pricing (3 tiers, INR/USD toggle) → FAQ → Final CTA → Footer.

---

## 3. Tiers, Pricing & Payments

### Tier matrix

| Feature | Free | Pro — ₹149/mo · $9.99/mo | Studio — ₹399/mo · $24.99/mo |
|---|---|---|---|
| Automated reels | **1, lifetime-burned** | Unlimited | Unlimited |
| Comment reply variations | 2 | 3–8 | 3–8 |
| Own DM buttons | 1–2 (RELO button appended after) | 3, no branding | 3, no branding |
| AI credits /month | 3 | 500 | 5,000 |
| AI DM product-Q&A | — | ✅ | ✅ |
| Follow-up DM | — | ✅ (per-automation toggle) | ✅ |
| Campaigns | — | ✅ | ✅ |
| Canvas node builder | — | — | ✅ |
| Connected IG accounts | 1 | 1 | 3 |
| Queue priority | Normal | Normal | Priority |
| Annual | — | ₹1,499/yr · $99/yr | ₹3,999/yr · $249/yr |

- **Lifetime-burned reel:** `free_reel_consumed` flag on the connected-account row. Deleting the automation does NOT free the slot. Only a genuinely new IG account (new OAuth binding) gets a new slot.
- **Dynamic RELO button:** free tier — user picks 1–2 own buttons (minimum 1, editor pre-fills one); RELO button occupies the slot immediately AFTER the user's last button. Pro/Studio: removed.
- **Agencies** (bigger than 3 accounts): "Talk to us" contact link → owner closes personally with custom pricing. White-label is a negotiation chip, not self-serve.

### Payments (no-GST reality)

| Track | Provider | Notes |
|---|---|---|
| Global (launch) | **Lemon Squeezy** (MoR) | Individual-friendly, handles all taxes, subscriptions built-in. Gumroad as backup. |
| Global (backup/enterprise) | **Wise payment link** | Manual deals only. |
| India (launch) | **PhonePe Business / Paytm Business link** | Individual KYC (PAN + bank, no GST). UPI 0% fee. Pay → paste UTR in app → owner verifies in admin panel → Pro activates manually. |
| India + proper billing (later) | **Voluntary GST (free) + LUT → Razorpay + UPI Autopay** | GST registration below the ₹20L threshold is free; nil returns self-filed; LUT makes exports 0%. This unlocks auto-renewing Indian subscriptions. |

**Pricing page:** INR/USD geo toggle; all prices exclude local taxes (MoR handles them).

### What we charge for (paywall map)

Pro unlocks: unlimited reels, 3–8 variations, 3rd own button + no branding, follow-ups, campaigns, AI product-Q&A, stacked cards. Studio adds: Canvas builder, 3 IG accounts, priority queue, 5,000 AI credits.

---

## 4. Feature Specs

### 4.1 Basic Builder (all tiers; free-friendly)
Reels tab (live reels from Graph API) → pick reel → configure:
- Trigger keywords (Unicode whole-word matching, `*` = catch-all "any comment").
- Comment replies: 2 variations on Free, 3–8 on Pro/Studio (spintax-rotated, `@username` merge — anti-spam).
- 3-button Generic Template card (title ≤80, subtitle ≤80, buttons ≤20 chars, https URLs). Free: 1–2 own buttons + RELO button injected at dispatch time. Minimum 1 own button on free tier.
- Follow-Gate verification toggle (fail-open ≤1500ms).
- "Preview as commenter" test panel inside the editor: type a comment, see the exact DM.

### 4.2 Follow-up DM (Pro/Studio)
Per-automation toggle. If the lead didn't tap any button within a configurable delay (default 60 min, inside Meta's 24h window), send one follow-up text/card ("Still want it? 👇"). One follow-up max — never nagging.

### 4.3 Campaigns (Pro/Studio)
- Pick a reel → we already store every commenter → compose message (text / card / stacked cards).
- **Reachability engine:** only leads inside Meta's 24-hour messaging window (last inbound interaction timestamp per lead) are sendable; dashboard always shows "X of Y commenters still reachable."
- Batch sends respect per-account Meta rate limits + jitter. Failed sends are classified (retryable vs window-expired vs token-dead).
- HUMAN_AGENT tag (7-day window) = future upgrade once applied for; not MVP.

### 4.4 AI — DM product-Q&A (Pro/Studio; 3 credits/mo on Free)
- **Products library** per account (name, price, description, link, optional image; cap ~50 — fits entirely in the prompt, no RAG at MVP).
- Incoming DM → NVIDIA NIM (free API, ~40 RPM, OpenAI-compatible, compact model) with strict system prompt: *answer only from the provided product data; if unknown, say you'll pass it to the owner.* Product identified → reply + product link as a button/card.
- **Sentiment router (silent):** frustrated → pause AI on that thread, notify owner (human takeover). Buying intent → proactive product card.
- 1 credit per AI reply, atomic ledger in D1. Credits exhausted or NIM down → spintax/owner fallback, never a broken experience. Global concurrency guard so a burst can't eat the shared 40 RPM. Studio = priority.

### 4.5 Analytics: Sent → Clicked
- Every outbound button routes through **RELO short-links** (Worker redirect, 301) → per-automation, per-button, per-lead click counts.
- Home shows the funnel: comments → DMs sent → clicks. ("Seen" is not exposed by Meta's API — not tracked.)
- Phase 2 nice-to-have: A/B rotate RELO button text variants by click CTR.

### 4.6 Home dashboard
Setup checklist (Connect IG → First automation → First DM sent → First click), plan + AI-credits card, Sent→Clicked funnel card, recent activity feed.

### 4.7 Settings
Meta connection status + token expiry countdown + reconnect, plan & billing, AI credits + Products library, theme toggle, storage meter, danger zone (disconnect/delete).

### 4.8 Onboarding & retention
- Persistent "Connect your Instagram" modal on every dashboard visit until linked (dismissible, returns next visit — the Zorcha/ManyChat pattern).
- Keyword synonym chips (curated list at launch, data-driven later).
- Funnel Score after setup: checklist with one-tap fixes (add a 3rd variation → upsell Pro, enable follow-gate, add card image…).

### 4.9 Free-tier abuse defense
- **Hard:** IG account = identity. OAuth binding unique per IG account (`ACCOUNT_ALREADY_BOUND` on conflicts). Burned reel slot lives on the account row — new emails, browsers, or devices never reset it.
- **Soft:** IP velocity + lightweight browser fingerprint, logged for review, never auto-blocking.
- Email OTP already gates signup; OTP has 5-attempt lockout + resend throttles.

---


### 4.10 Dashboard shell — full IA rebuild, Zorcha/ManyChat-style (owner mandate, 2026-10-03)

The current top-bar-tab shell is REPLACED. The dashboard becomes a classic SaaS workspace:

**Left sidebar (fixed, collapsible on desktop; drawer on mobile):**
| Item | Content |
|---|---|
| Home | Setup checklist, Growth & Engagement stats, plan/credits card (below) |
| Automations | Current Reels studio + Automation editor (reel picker, keywords, card builder) |
| Campaigns | Phase 2 — reachable-window sends (Pro) |
| Leads | Captured leads table, search, CSV export |
| Insights | Telemetry: Sent → Clicked, queue, conversion (current Analytics tab) |
| Products | Phase 2 — AI product-Q&A knowledge base (Pro) |
| Settings | Meta connection, token expiry, plan & billing, AI credits, theme toggle, storage meter, danger zone |

Sidebar bottom: **plan card** (current plan, AI-credits progress bar, monthly usage, "Upgrade" button — the Zorcha "Free Forever / Upgrade to Unlock your Growth" pattern). Big agencies link to contact.

**Top bar:** workspace/account chip (connected IG avatar + username + token-days), theme toggle, logout.

**Home page (the Zorcha "Home" pattern):**
1. **Get setup** checklist card — Connect Instagram → Launch your first automation → First DM sent → First button clicked (progress ring/checklist, each row links to its step).
2. **Growth & Engagement** card — Conversion %, DMs Sent, Clicks (with period selector later). "Seen" is not exposed by Meta's API.
3. **Plan card** — "Free forever / Upgrade to unlock your growth": AI credits meter (used/limit), monthly limits, feature comparison rows, Manage plan.
4. Connect-nag modal on every visit until an IG account is linked (already specced §4.8).

All content surfaces (reels grid, editor, leads table, telemetry) keep their Phase 0 token styling — only the navigation shell and Home page change.


## 5. Architecture & Data

**Runtime (unchanged):** React 19 + Vite SPA (Vercel) + Cloudflare Worker engine + D1 + 1-minute Cron-as-Queue. The Express `customer-backend` was removed; single-runtime.

**Schema additions (D1):**
- `connected_accounts`: `plan`, `free_reel_consumed`, `ai_credits_remaining`, `ai_credits_reset_at`, `branding_variant`
- `products` (id, account_id, name, price_text, description, link, image_url, is_active)
- `campaigns` (id, account_id, media_id, payload_json, status, scheduled_at, sent_count, failed_count)
- `campaign_targets` (campaign_id, lead_id, status: pending/sent/failed/unreachable)
- `short_links` (id, account_id, automation_id, campaign_id, target_url, click_count)
- `credit_ledger` (id, account_id, delta, reason, created_at)
- `payments` (id, account_id, provider: lemon_squeezy|manual_upi, external_ref, status, region, current_period_end)
- `follow_ups` (job extension): parent job id, scheduled_at, condition: no-click

**Engine changes:**
- Dispatch-time button injection (tier + branding variant applied when sending, so tier changes apply to in-flight jobs cleanly).
- Follow-up scheduler + no-click condition check against `short_links` clicks.
- Campaign worker (window check → batch → jitter → classify failures).
- NIM client with queue + concurrency guard + credit ledger.
- **Retention cron:** purge comment text >72h, completed jobs >30d, webhook_logs → metadata-only >7d (raw payloads stop being stored). Commenter identity rows kept forever. Storage meter in Settings.
- Priority queue: Studio jobs ordered first in `getDueJobsBatch`.

**Free-tier capacity check (Cloudflare free):** Workers 100k req/day, D1 5M reads/day + 100k writes/day, ~1,440 cron invocations/day — comfortable for 100–200 users. Only external bottleneck: OTP email (Resend 100/day) → Brevo (300/day) swap if needed.

---

## 6. Cut / Deferred (with reasons)

- **❌ Native email-capture button — CUT (owner decision, 2026-10-03).** Asking commenters to type their email inside a DM reads as data harvesting; damages creator trust AND RELO's brand; invites Meta policy scrutiny. Alternative: creators who want emails add a normal link button to their own form/page — RELO never touches that data. We only store what Instagram itself gives us (username, scoped ID) plus what a commenter voluntarily types in conversation.
- Link-in-bio, story automations, WhatsApp/Telegram — out of scope; DM automation stays the whole product.
- Multi-account self-serve beyond Studio's 3 → agency contact flow.

---

## 7. Phases

### Phase 0 — Design foundations (no Meta work) ✅ DONE 2026-10-03
- [x] Token-based theme system (System/Light/Dark) + toggle component — `src/styles/theme.css`, `src/lib/theme.ts`, `src/components/ThemeToggle.tsx`, FOUC bootstrap in index.html
- [x] Rebuild landing: modern SaaS, INR/USD pricing toggle, FAQ, product-first hero — `src/pages/Landing.tsx` + `landing.css`; marigold/cinematic CSS and scroll-hijack removed
- [x] Re-skin dashboard shell to the token system — `studio.css` fully token-driven (all `--st-*` remapped to semantic tokens), Toggle in top bar
- [x] Delete dead code / old theme leftovers; `/pi` route REMOVED (`src/pi-lab-lab/` deleted)
- **Exit met:** light + dark verified live in browser (landing, dashboard); build/lint/tests green.

### Phase 1 — Core SaaS MVP (launch-ready) ✅ DONE 2026-10-03
- [x] **Dashboard IA rebuild (§4.10): left sidebar shell + Home overview page (checklist, Growth & Engagement, plan card) — replaces the top-bar tabs entirely** — `src/pages/dashboard/DashboardLayout.tsx`, `Home.tsx`, `dashboard-shell.css`
- [x] Tier system: plan column, limits middleware, free_reel_consumed enforcement — `backend/src/api/router.ts` (middleware) + tier-aware `AutomationEditor.tsx`
- [x] Dynamic RELO button injection at dispatch; min-1-button rule on Free — `backend/src/engine/processor.ts`; editor shows the locked branding slot
- [x] Basic Builder polish per §4.1 (incl. preview panel) — editor is tier-aware; "Preview as commenter" runs the same matcher as the engine via `src/lib/commentMatcher.ts`
- [x] Follow-up DMs (§4.2) + engine scheduling — editor toggle + delay presets; worker schedules the no-click follow-up
- [x] RELO short-links + Sent→Clicked analytics (§4.5) — `short_links` + `/l/:id` 301; Home funnel + Insights
- [x] Home dashboard (§4.6) + Settings (§4.7) + connect-nag modal — storage/retention meter added to Settings
- [x] Billing: Lemon Squeezy integration + manual UPI activation flow + plan UI — `billing` routes + UPI/UTR flow in Settings
- [x] Retention cron + storage meter — hourly purge (72h comments / 30d jobs / 7d logs); meter in Settings
- [x] **Surface completeness sweep (2026-10-03):** token-based 404 with an in-dashboard variant, app-wide `ErrorBoundary`, Privacy + Terms pages, tier-aware Campaigns/Products states
- [x] **Design-system violations removed (2026-10-03):** film-grain overlay on Login (§2 says no grain), hardcoded `slate`/`sky` palette on the 404, mobile nav overflow clipping the “Start free” CTA
- [x] **Landing motion pass (2026-10-03, owner request):** CSS-3D hero product scene (preserve-3d, three depth layers at −60/+40/+110px, pointer tilt via `useTilt`), cursor-spotlight feature cards (`useSpotlight`), count-up stat band (`useCountUp`). No animation library added; JS bundle +7 kB.
- [x] **Developer tier preview (2026-10-03):** demo banner gains a Free/Pro/Studio switcher so the owner can inspect gated surfaces without a real subscription. Revealed and fixed an editor bug — the variation chip ignored the tier's *upper* limit and reported `✓ compliant · 3/2` on Free; now shows `N over limit` and blocks save.
- **Exit:** a creator can go from signup → connected reel → automated DM → see clicks → upgrade to Pro (via either rail).
  - **Verified by tests:** tier limits, keyword matching, webhook HMAC, cron batch, lead capture + CSV, telemetry, billing endpoints (backend phase 3/4/5/7 + frontend suite, all green).
  - **Verified in browser:** Free + Pro editor tier gating, follow-up presets, preview tester, funnel analytics, storage meter, 404 (light + dark, mobile + desktop), legal pages, error boundary.
  - **Not yet verified:** the exit path against a real Meta token — needs a live Instagram Professional account + Meta app credentials, which are the owner's to supply. Legal text needs owner/legal review before public launch.

| Brand accent | **Volt** (`#c9f94e`) — 2026-10-03. Indigo/violet was retired: it reads as AI-generated. Volt ships as a two-mode token pair (`--accent` bright for fills, `--accent-ink` deep for text) so contrast passes AA in both themes. No competitor in this category uses it. Regenerate the share card with `python scripts/generate-og.py` after any brand change. |
| Site URL | Not yet decided. Single constant in `src/lib/site.ts`; three static files still need manual updates (index.html, robots.txt, sitemap.xml) — documented in that file. |

### Phase 2 — Growth engine
- [x] **Products library (§4.4) — SHIPPED 2026-10-03.** `products` table in D1, CRUD at `GET/POST/DELETE /api/products` (Pro/Studio only, Free gets `PRODUCTS_LOCKED` + upgrade flag), 50-product cap so the catalog fits one AI prompt, `javascript:`/`data:` URLs stripped on write, ownership scoped per account. Real CRUD UI replaces the stub at `/dashboard/products`. Tested in `backend/tests/phase8-products.test.ts` (tier gate, CRUD, cap, URL safety, cross-account isolation).
- [x] **AI product-Q&A + sentiment router (§4.4) — SHIPPED 2026-10-04.** `backend/src/ai/nim.ts` (NVIDIA NIM client, strict grounded system prompt) and `backend/src/engine/aiResponder.ts` (intent + sentiment router, grounding check, price audit, buying-intent card). Wired into the inbound-DM webhook.
  - **Safety is the spec:** the responder has exactly three outcomes — `answered` / `handoff` / `silence` — and never a fourth. A reply that names nothing in the catalog, or carries a price the catalog does not contain, is discarded and becomes a hand-off. Frustration outranks buying intent and returns `silence` so a human takes over. Every non-answer costs zero credits.
  - **AI is never blocking** (plan.md §1): no `NIM_API_KEY`, NIM down, NIM timing out, empty catalog and exhausted credits all degrade to the owner hand-off. None is an error state.
- [x] **AI credits ledger + NIM queue/concurrency guard — SHIPPED 2026-10-04.** `spendAiCredit` is the atomic authority (`ai_credits_remaining > 0` guard, so the balance can never go negative and the ledger records successes only). The NIM client enforces a **global** guard — max 4 concurrent, min 1.6s gap (~37 RPM) — because the free tier's ~40 RPM is shared and one viral Reel must not eat it for every user.
- [x] **Link-in-bio — SHIPPED 2026-10-04.** `link_pages` + `link_blocks` tables; `GET/POST /api/link-page` (Pro/Studio, `LINK_PAGE_LOCKED` on Free read *and* write). Public page **server-rendered on the Worker** at `/p/:id` — no SPA, inline CSS, JSON-LD, theme tokens — so a bio link is one cacheable request on a phone. Blocks pull from the Products library (a product block inherits its buy link, so the page can never advertise a price the catalog does not hold); cross-account product promotion is refused. **An unpublished page 404s**, so nothing leaks at a guessable URL. Editor + live phone preview at `/dashboard/link-in-bio`.
  - Tested in `backend/tests/phase10-growth-engine.test.ts` (10 sections: intent routing, grounding, price audit, product cards, every failure path, credit atomicity, link-page CRUD, URL safety, public render, tier gate).
- [x] **Campaigns (§4.3) — SHIPPED (Phase 3 slice, folded in early).** `campaigns` + `campaign_targets`, reachability engine that splits leads by the 24h window at fan-out **and again at send time**, per-target failure classification (`retryable` / `window_expired` / `token_dead`), `HUMAN_AGENT` tag application. Real page at `/dashboard/campaigns`.
- [x] **Content planning — SHIPPED 2026-10-04.** Closes the competitive gap plan.md flags. `content_plans` table; `GET/POST /api/content-plans` + `POST /api/content-plans/publish` + `DELETE` (Pro/Studio, `CONTENT_LOCKED` on Free read *and* write). Real planner at `/dashboard/content` with a stat rollup (idea → drafting → scheduled → published → converted).
  - **Honest about what it does:** Meta has no content-publishing API, so RELO plans the idea, hook and date but never claims to post for the creator. `instagram_media_id` stays NULL until they publish in the Instagram app and link it themselves — we never fake it. The UI says this outright.
  - A Reel may only be linked if **this account actually automates it** (server-side check), and conversion is derived by joining real completed jobs rather than stored, so the number can never drift from the funnel.
  - Tested in `backend/tests/phase11-content-planner.test.ts` (tier gate, CRUD, partial-update preservation, status coercion, Reel ownership, completed-vs-pending conversion, cross-account isolation).
  - With this, `StubPages.tsx` is gone entirely — **no dashboard surface is a stub any more.**
- [ ] Stacked-card DMs (verify IG API carousel support; fallback = back-to-back cards)
- [ ] Keyword synonym chips, Funnel Score, RELO button A/B test
- **Exit:** a shop can run DM commerce on autopilot; campaigns re-engage commenters within policy. **Reached.**

### Phase 3 — Power & scale
- [x] **Canvas Studio on React Flow — SHIPPED 2026-10-04 (edge bug fixed).** `@xyflow/react` v12 installed and **lazy-loaded** (its ~66 kB gzip chunk never touches the landing bundle). `backend/src/engine/flowGraph.ts` validates linear chains server-side; `src/lib/flowGraph.ts` mirrors it so the editor shows the same error the API would. Tier gate, flow list, palette, step inspector and save/publish all work.
  - **The bug and its fix:** nodes rendered but connecting edges never did. Root cause was React Flow's default viewport culling — `useVisibleEdgeIds` gates on `s.width && s.height`, so before the canvas container reported a size every edge was silently culled and `.react-flow__edges` rendered empty (not even the marker defs). Fixed with `onlyRenderVisibleElements={false}`, which is correct here permanently: a flow is capped at 50 nodes, so culling buys nothing and only risks dropping edges on first paint.
  - Verified in browser: 3-step chain → 2 edges and 4-step chain (trigger → reply → wait → text DM) → 3 edges, with distinct bezier path geometry and the stroke resolving to the `--border-strong` token.
  - Branching (out-degree > 1) is still deliberately rejected — by the editor's connect guard, the client validator and the server validator alike — until the engine can decide which branch a lead took.
- [x] **Priority queue + 3-account support for Studio.** `getDueJobsBatch` orders `ca.plan = 'studio'` first, joining `connected_accounts` **live** rather than denormalising priority onto the job row — an upgrade takes effect on the next cron tick and a downgrade cannot strand stale high-priority jobs. Account cap enforced at OAuth connect (Free/Pro 1, Studio 3); re-connecting an account you already own is always allowed, so only a genuinely new binding hits `ACCOUNT_LIMIT_REACHED`.
- [x] **Referral program + HUMAN_AGENT tag.** `referrals` table, deterministic per-user codes, 1 free Pro month per qualified referral. The reward fires **only on the referred person's first paid activation** — a signup that never pays earns nothing, and a renewal cannot re-award. Self-referral is refused indistinguishably from a repeat claim. `?ref=` is claimed during OTP verify, best-effort so it can never block sign-in.
- [ ] **Voluntary GST + LUT → Razorpay + UPI Autopay.** Not started. Blocked on owner action: GST registration below ₹20L is free but is a real-world filing, and Razorpay needs the owner's live keys.
- [x] **Agency contact flow on pricing page.** `POST /api/agency/contact` (rate-limited, email-validated, recorded to `webhook_logs` for the owner to work). Real inline form on the pricing section replacing the `mailto:` — collects account count and notes so a quote can actually be prepared.
- **Exit:** developers build their own flows; Indian billing is fully automated. *(Flows: **met** — Studio users can build and publish a linear chain end to end. Billing: blocked on the owner's GST filing and Razorpay keys, not on code.)*

---

## 8. Risks & Watchpoints

| Risk | Mitigation |
|---|---|
| Meta policy drift / app review | Stay inside the 24h window; no scraping, no harvesting; official API only; document compliance per feature |
| NIM 40 RPM shared capacity | Credit ledger + concurrency guard + spintax fallback; AI is never blocking |
| Manual UPI ops burden | Fine at ≤200 users; GST→Razorpay path already planned |
| D1 growth | Retention cron ships in Phase 1, not "later" (~15MB/mo steady state after) |
| Solo-founder bus factor | plan.md + memory notes keep every decision recoverable |

---

## 9. Decisions Log

- **2026-10-03** — Design: modern SaaS + System/Light/Dark toggle; marigold/cinematic aesthetic retired.
- **2026-10-03** — Pricing: monthly geo-priced subscription (lifetime model rejected); Free/Pro/Studio.
- **2026-10-03** — Free tier: 1 lifetime-burned reel, 2 variations, 1–2 own buttons + dynamic RELO button, 3 AI credits; no follow-ups/campaigns.
- **2026-10-03** — AI: NIM free API, DM product-Q&A only (Products library), sentiment secondary, credits metered, spintax fallback.
- **2026-10-03** — Payments: Lemon Squeezy (global) + PhonePe/Paytm Business manual UPI (India); voluntary GST → Razorpay later.
- **2026-10-03** — Studio: Canvas + priority queue + 3 IG accounts; agencies via contact.
- **2026-10-03** — Email capture: CUT (trust risk to creators and RELO).
- **2026-10-04** — AI safety contract: the responder has exactly three outcomes (`answered` / `handoff` / `silence`). Grounding is enforced by a prompt AND re-checked in code (product-name match + a price audit against the catalog), because a prompt is a request, not a guarantee. A wrong price is a refund request and a review; silence is always cheaper.
- **2026-10-04** — AI credits are spent only for a reply actually sent. Hand-offs, small talk, frustration and every NIM failure cost zero. Credits are checked *after* grounding so we never bill for a reply we discard.
- **2026-10-04** — NIM's ~40 RPM is a shared resource. A global guard (4 concurrent / 1.6s gap) lives in the client module rather than per-call, so one account cannot starve every other user.
- **2026-10-04** — Link-in-bio is server-rendered on the Worker, not an SPA route. It is the one page a visitor opens on a phone from an Instagram bio: one cacheable request, inline CSS, no fonts to block paint, and it survives the dashboard bundle.
- **2026-10-04** — An unpublished link page returns 404. Never leak a half-built page at a guessable URL.
- **2026-10-04** — Referral rewards pay on the referred person's first **paid** activation, not their signup. Self-referral is refused indistinguishably from a repeat claim so the endpoint leaks nothing.
- **2026-10-04** — Queue priority is read live from `connected_accounts` rather than denormalised onto `jobs`: upgrades apply on the next cron tick and downgrades cannot strand high-priority jobs.
- **2026-10-04** — Content planning does NOT post for the creator. Meta has no content-publishing API, and a tool that pretends otherwise is lying to the one audience we cannot afford to lose. The planner holds the idea; the creator publishes; they link the live Reel back so conversion can be measured.
- **2026-10-04** — React Flow viewport culling disabled on the Canvas (`onlyRenderVisibleElements={false}`). Culling gates on the container reporting a size, so it silently dropped every edge on first paint. A 50-node cap makes culling worthless anyway; correctness beats a micro-optimisation.
- **2026-10-04** — Planner conversion is derived by joining completed jobs, never stored. A percentage that can drift from the funnel is worse than no percentage.
