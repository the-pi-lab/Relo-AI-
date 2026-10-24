"use client";

/**
 * The marketing page.
 *
 * Every claim here is backed by something in `backend/`: the Graph API client,
 * the 30–90 second enqueue jitter in `index.ts`, the spintax reply picker, the
 * short-link click counter, the 24-hour broadcast window. Nothing is seeded and
 * no number is decorative, which is why the page has no metric strip.
 *
 * Colour comes from the design tokens only. There is no `isDark` branch, so the
 * theme switch repaints this page the same way it repaints the studio.
 */

import React, { useState } from "react";
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  Check,
  Clock,
  Download,
  Fingerprint,
  Layers,
  Link2,
  Menu,
  MessageCircle,
  MousePointerClick,
  Send,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from "lucide-react";

import { Button, Container, Logo, SectionHead } from "./chrome";
import { BrandAurora, LiquidBackdrop } from "./ambient";
import { Reveal, Tilt } from "./motion";
import { ThemeToggle } from "@/lib/relo/theme";
import { cn } from "@/lib/utils";

interface LandingProps {
  navigate: (to: string) => void;
}

const NAV = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#features", label: "Features" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
];

const STEPS = [
  {
    n: "01",
    title: "Connect the account that owns the Reel",
    body: "Facebook Login asks for the Page your Reels are published from. RELO stores an encrypted Page token — never your Instagram password — and warns you a week before it expires.",
  },
  {
    n: "02",
    title: "Pick a Reel and its keyword",
    body: "RELO lists the Reels it can see. Choose one, then set the words that should open the DM: “price”, “link”, “guide”. Matching is whole-word and case-insensitive.",
  },
  {
    n: "03",
    title: "Write the reply and the card",
    body: "A public reply under the comment, a DM card with up to three buttons, and an optional follow-up. Every button becomes a short link with its own click count.",
  },
];

const FEATURES = [
  {
    icon: MessageCircle,
    title: "Keyword triggers, per Reel",
    body: "Up to 12 keywords on each Reel. The comment id is deduplicated, so one comment never sends two DMs.",
  },
  {
    icon: Send,
    title: "Public reply, then a DM",
    body: "Reply variations are picked at send time, so two commenters do not receive identical text.",
  },
  {
    icon: Layers,
    title: "DM cards with three buttons",
    body: "Title, subtitle and up to three buttons — the shape Instagram actually renders in a private reply.",
  },
  {
    icon: Link2,
    title: "Tracked short links",
    body: "Each button points at a RELO short link, so clicks land in the same funnel as your leads.",
  },
  {
    icon: Clock,
    title: "Human-paced sending",
    body: "Jobs wait 30–90 seconds before they send. If you reply in the thread yourself, that conversation pauses for 30 minutes.",
  },
  {
    icon: Users,
    title: "Leads you can export",
    body: "Every commenter becomes a lead row with their DM count and timestamps. Download the whole list as CSV.",
  },
  {
    icon: CalendarDays,
    title: "Broadcasts inside the window",
    body: "Message the people who commented recently, for as long as Meta's 24-hour window allows. The skip count is shown.",
  },
  {
    icon: Sparkles,
    title: "AI answers from your catalog",
    body: "When enabled, product questions are answered from your own offers, and anything uncertain is handed to you.",
  },
  {
    icon: BarChart3,
    title: "Numbers from your account",
    body: "Queue depth, replies, DMs, leads and clicks — all read from the Worker. No benchmarks, no invented trends.",
  },
];

const FUNNEL = [
  {
    icon: MessageCircle,
    label: "Comment matched",
    detail: "Keyword hit on a Reel you armed.",
  },
  {
    icon: Send,
    label: "Public reply",
    detail: "Answer posted under the comment.",
  },
  {
    icon: Layers,
    label: "DM delivered",
    detail: "Card or text sent privately.",
  },
  {
    icon: MousePointerClick,
    label: "Link clicked",
    detail: "Tracked through a RELO short link.",
  },
];

const PLANS = [
  {
    name: "Free",
    price: "₹0",
    cadence: "forever",
    blurb: "Test one Reel end to end.",
    cta: "Start free",
    highlighted: false,
    features: [
      "1 Instagram account",
      "1 Reel, lifetime",
      "2 public reply variations",
      "DM cards with 2 buttons",
      "3 AI credits",
      "Lead list and CSV export",
    ],
    missing: ["Broadcasts", "Offers and link in bio", "Content planner", "Canvas"],
  },
  {
    name: "Pro",
    price: "₹199",
    cadence: "per month",
    blurb: "For a creator running Reels every week.",
    cta: "Choose Pro",
    highlighted: true,
    features: [
      "1 Instagram account",
      "Unlimited Reels",
      "3–8 reply variations",
      "DM cards with 3 buttons",
      "Broadcasts inside the 24h window",
      "Offers, link-in-bio page, content planner",
      "500 AI credits a month",
    ],
    missing: [],
  },
  {
    name: "Studio",
    price: "₹499",
    cadence: "per month",
    blurb: "For a small team or a manager with several accounts.",
    cta: "Choose Studio",
    highlighted: false,
    features: [
      "3 Instagram accounts",
      "Everything in Pro",
      "Canvas flow blueprints",
      "5,000 AI credits a month",
      "Priority support by email",
    ],
    missing: [],
  },
];

const FAQS = [
  {
    q: "Do I have to give RELO my Instagram password?",
    a: "No. You sign in through Facebook Login, choose the Page your Instagram account is linked to, and Meta issues a Page access token. RELO never sees your password, and disconnecting deletes the stored token.",
  },
  {
    q: "Will this get my account restricted?",
    a: "RELO uses the official Graph API, waits a random 30–90 seconds before replying, varies the reply text, deduplicates comments and stops when you take over a conversation. Those choices lower the risk that a burst of identical messages gets flagged. No automation tool can promise immunity, and we will not claim to.",
  },
  {
    q: "Does RELO check whether someone follows me?",
    a: "No, and neither can any other app: Meta does not expose a follower lookup. RELO will not pretend to gate a link on something it cannot verify. Everyone who comments your keyword gets the reply.",
  },
  {
    q: "Can RELO post my Reels for me?",
    a: "No. Meta has no content-publishing API for third parties. The content planner holds the idea, hook and date; you publish in Instagram, then link the live Reel back so its automation is attached.",
  },
  {
    q: "What if I answer a DM myself?",
    a: "Your reply pauses that thread for 30 minutes. RELO will not talk over you.",
  },
  {
    q: "What happens when the access token expires?",
    a: "A long-lived Page token lasts about 60 days. The studio shows the days remaining and turns amber a week out; reconnecting is the same two-click flow you used the first time.",
  },
  {
    q: "Can I cancel whenever I want?",
    a: "Yes. Plans are monthly and there is no lock-in. If you cancel, your automations stop at the end of the period and your data stays available to export.",
  },
];

/* ── the exchange: a comment turning into a DM ────────────────────────── */

function ExchangeCard() {
  return (
    <Tilt strength={5}>
      <div className="glass-panel overflow-hidden rounded-[22px]">
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="grid size-7 place-items-center rounded-full bg-brand text-[11px] font-bold text-brand-ink">
              R
            </span>
            <div>
              <p className="text-[12.5px] font-semibold leading-tight text-ink">Your Reel</p>
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
                automation armed
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-ok/30 bg-ok-wash px-2 py-0.5 text-[10.5px] font-semibold text-ok">
            <span className="size-1.5 rounded-full bg-ok" aria-hidden />
            live
          </span>
        </div>

        <div className="space-y-3 p-4">
          {/* the comment */}
          <div className="flex items-start gap-2.5">
            <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-surface-3 text-[10px] font-bold text-ink">
              P
            </span>
            <div className="min-w-0">
              <p className="text-[11.5px] font-semibold text-ink">
                priya.shoots{" "}
                <span className="font-normal text-ink-3">commented</span>
              </p>
              <p className="mt-1 w-fit rounded-xl rounded-tl-sm border border-line bg-surface px-3 py-2 text-[12.5px] text-ink">
                price?
              </p>
            </div>
          </div>

          {/* the wire */}
          <div className="flex items-center gap-2.5 pl-9">
            <svg width="14" height="26" viewBox="0 0 14 26" aria-hidden className="shrink-0">
              <path
                d="M7 0v18"
                stroke="var(--signal)"
                strokeWidth="1.6"
                strokeDasharray="4 5"
                className="flow-wire-stream"
              />
              <path d="M2.5 15.5 7 21l4.5-5.5" fill="none" stroke="var(--signal)" strokeWidth="1.6" />
            </svg>
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-3">
              42s later · public reply + DM
            </p>
          </div>

          {/* public reply */}
          <div className="ml-9 w-fit rounded-xl rounded-tl-sm border border-line bg-surface-2/70 px-3 py-2 text-[12px] text-ink-2">
            Sent it to your DMs — check your inbox.
          </div>

          {/* the DM */}
          <div className="ml-9 overflow-hidden rounded-xl border border-line bg-surface shadow-[var(--sh-1)]">
            <div className="flex items-center gap-2 border-b border-line/70 px-3 py-2">
              <span className="size-1.5 rounded-full bg-signal" aria-hidden />
              <p className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-ink-3">
                direct message
              </p>
            </div>
            <div className="p-3">
              <p className="text-[12.5px] font-bold text-ink">The Creator OS pack</p>
              <p className="mt-0.5 text-[11.5px] text-ink-3">Three templates, one link.</p>
              <div className="mt-2.5 space-y-1.5">
                {["Get the pack", "See pricing", "Ask a question"].map((label, index) => (
                  <div
                    key={label}
                    className={cn(
                      "rounded-md border px-2.5 py-1.5 text-center text-[11.5px] font-semibold",
                      index === 0
                        ? "border-signal/40 bg-signal-wash text-signal"
                        : "border-line bg-surface-2/60 text-ink-2"
                    )}
                  >
                    {label}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="ml-9 flex items-center gap-1.5 pt-0.5">
            <MousePointerClick className="size-3 text-ink-3" aria-hidden />
            <p className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-ink-3">
              button 1 clicked · short link counted
            </p>
          </div>
        </div>
      </div>
    </Tilt>
  );
}

/* ── page ─────────────────────────────────────────────────────────────── */

export function LandingPage({ navigate }: LandingProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const go = (to: string) => {
    setMenuOpen(false);
    navigate(to);
  };

  return (
    <div className="relative min-h-svh overflow-x-clip text-ink">
      <LiquidBackdrop variant="hero" grid />

      <header className="sticky top-0 z-50 border-b border-line/70 bg-canvas/80 backdrop-blur-xl">
        <Container className="flex h-16 items-center gap-3">
          <Logo onClick={() => go("/")} />

          <nav aria-label="Sections" className="ml-6 hidden items-center gap-1 lg:flex">
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-md px-2.5 py-1.5 text-[13px] font-medium text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle className="hidden sm:inline-flex" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => go("/login")}
              className="hidden sm:inline-flex"
            >
              Sign in
            </Button>
            <Button variant="signal" size="sm" onClick={() => go("/login")}>
              Start free
              <ArrowRight className="size-3.5" strokeWidth={2} aria-hidden />
            </Button>
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-label="Menu"
              className="grid size-8 place-items-center rounded-md text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink lg:hidden"
            >
              {menuOpen ? <X className="size-4" aria-hidden /> : <Menu className="size-4" aria-hidden />}
            </button>
          </div>
        </Container>

        {menuOpen && (
          <div className="border-t border-line bg-canvas/95 backdrop-blur-xl lg:hidden">
            <Container className="flex flex-col gap-1 py-3">
              {NAV.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-md px-2 py-2 text-[13.5px] font-medium text-ink-2 hover:bg-surface-2 hover:text-ink"
                >
                  {item.label}
                </a>
              ))}
              <button
                type="button"
                onClick={() => go("/login")}
                className="rounded-md px-2 py-2 text-left text-[13.5px] font-medium text-ink-2 hover:bg-surface-2 hover:text-ink"
              >
                Sign in
              </button>
              <div className="mt-2 px-2">
                <ThemeToggle />
              </div>
            </Container>
          </div>
        )}
      </header>

      <div className="relative z-10">
        {/* ── hero ── */}
        <section className="section pb-16 pt-14 md:pb-24 md:pt-20">
          <Container className="grid items-center gap-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
            <Reveal>
              <p className="caption">Instagram comment automation</p>
              <h1 className="display mt-4 max-w-[13ch] text-ink">
                Comments in.
                <br />
                Customers out.
              </h1>
              <p className="lead mt-6 max-w-xl">
                RELO watches the Reels you choose. When someone comments your
                keyword, it answers in public and sends a DM card with your link —
                through Instagram&rsquo;s official API, not a browser bot.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button variant="signal" size="lg" onClick={() => go("/login")}>
                  Start free
                  <ArrowRight className="size-4" strokeWidth={2} aria-hidden />
                </Button>
                <a
                  href="#how-it-works"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-line-strong bg-surface px-5 text-[14.5px] font-semibold text-ink transition-colors hover:border-ink-3 hover:bg-surface-2"
                >
                  See how it works
                </a>
              </div>

              <p className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12.5px] text-ink-3">
                <span className="inline-flex items-center gap-1.5">
                  <Check className="size-3.5 text-ok" strokeWidth={2.4} aria-hidden />
                  Free plan: one Reel
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Check className="size-3.5 text-ok" strokeWidth={2.4} aria-hidden />
                  No card to start
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Check className="size-3.5 text-ok" strokeWidth={2.4} aria-hidden />
                  Cancel any month
                </span>
              </p>
            </Reveal>

            <Reveal delay={0.12} y={34}>
              <ExchangeCard />
            </Reveal>
          </Container>
        </section>

        {/* ── how it works ── */}
        <section id="how-it-works" className="section scroll-mt-20 border-t border-line/70">
          <Container>
            <SectionHead
              title="Three steps, then it runs quietly"
              sub="Connection, keywords and copy. There is no flow builder to learn before your first Reel is armed."
            />

            <div className="mt-12 grid gap-8 md:grid-cols-3 md:gap-6">
              {STEPS.map((step, index) => (
                <Reveal key={step.n} delay={index * 0.06}>
                  <article className="relative h-full">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[12px] font-semibold text-signal tnum">
                        {step.n}
                      </span>
                      <span className="h-px flex-1 bg-line" aria-hidden />
                    </div>
                    <h3 className="h4 mt-4 text-ink">{step.title}</h3>
                    <p className="mt-2 text-[13.5px] leading-relaxed text-ink-2">{step.body}</p>
                  </article>
                </Reveal>
              ))}
            </div>

            <Reveal delay={0.1}>
              <div className="mt-12 grid gap-4 rounded-2xl border border-line bg-surface/50 p-5 sm:grid-cols-3">
                {[
                  ["30–90s", "Random pause before a job sends"],
                  ["12", "Keywords allowed per Reel"],
                  ["3", "Buttons on a DM card"],
                ].map(([value, label]) => (
                  <div key={label}>
                    <p className="font-mono text-[24px] font-bold leading-none text-ink tnum">
                      {value}
                    </p>
                    <p className="mt-1.5 text-[12.5px] text-ink-3">{label}</p>
                  </div>
                ))}
              </div>
            </Reveal>
          </Container>
        </section>

        {/* ── features ── */}
        <section id="features" className="section scroll-mt-20 border-t border-line/70">
          <Container>
            <SectionHead
              title="Everything the DM needs, and nothing it does not"
              sub="A small surface, built around what the official API actually allows."
            />

            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature, index) => (
                <Reveal key={feature.title} delay={(index % 3) * 0.05}>
                  <article className="glass-card h-full p-5">
                    <span className="grid size-9 place-items-center rounded-lg border border-line bg-surface-2/70 text-signal">
                      <feature.icon className="size-[17px]" strokeWidth={1.8} aria-hidden />
                    </span>
                    <h3 className="mt-4 text-[13.5px] font-semibold text-ink">{feature.title}</h3>
                    <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-2">
                      {feature.body}
                    </p>
                  </article>
                </Reveal>
              ))}
            </div>
          </Container>
        </section>

        {/* ── funnel ── */}
        <section className="section border-t border-line/70">
          <Container>
            <div className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center">
              <Reveal>
                <SectionHead
                  title="One funnel, four honest steps"
                  sub="Every figure on the dashboard is a row from your own account. RELO never shows a benchmark it cannot measure."
                />
                <p className="mt-5 text-[13px] leading-relaxed text-ink-2">
                  Clicks are counted through RELO short links so a DM button and a
                  bio-page block land in the same number. If a step has no data yet,
                  the studio says so instead of drawing a trend.
                </p>
                <Button variant="outline" className="mt-6" onClick={() => go("/login")}>
                  Open the studio
                  <ArrowRight className="size-4" strokeWidth={2} aria-hidden />
                </Button>
              </Reveal>

              <Reveal delay={0.1}>
                <div className="glass-panel p-5">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {FUNNEL.map((step, index) => (
                      <div
                        key={step.label}
                        className="rounded-xl border border-line bg-surface/60 p-4"
                      >
                        <div className="flex items-center justify-between">
                          <step.icon className="size-4 text-signal" strokeWidth={1.8} aria-hidden />
                          <span className="font-mono text-[10px] text-ink-3 tnum">
                            0{index + 1}
                          </span>
                        </div>
                        <p className="mt-3 text-[13px] font-semibold text-ink">{step.label}</p>
                        <p className="mt-1 text-[12px] leading-relaxed text-ink-3">
                          {step.detail}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center gap-2 rounded-lg border border-line bg-surface-2/50 px-3 py-2">
                    <Download className="size-3.5 text-ink-3" aria-hidden />
                    <p className="text-[11.5px] text-ink-3">
                      The lead list exports as CSV, including DM count and timestamps.
                    </p>
                  </div>
                </div>
              </Reveal>
            </div>
          </Container>
        </section>

        {/* ── limits / trust ── */}
        <section id="security" className="section scroll-mt-20 border-t border-line/70">
          <Container>
            <SectionHead
              title="What RELO refuses to fake"
              sub="A few things other tools imply, and this one states plainly. It is a shorter list than a feature grid, and a more useful one."
            />

            <div className="mt-10 grid gap-4 md:grid-cols-2">
              {[
                {
                  icon: Fingerprint,
                  title: "No follower gate",
                  body: "Meta does not let apps look up followers. RELO does not pretend to check, and does not withhold your link on a guess.",
                },
                {
                  icon: CalendarDays,
                  title: "No auto-posting",
                  body: "Meta has no publishing API for third parties. The planner holds the idea and the date; publishing stays in your hands.",
                },
                {
                  icon: ShieldCheck,
                  title: "No browser bots",
                  body: "Everything runs on the Graph API with a Page token that is encrypted at rest. Meta errors surface in the studio; they are not hidden.",
                },
                {
                  icon: Users,
                  title: "No per-contact pricing",
                  body: "Your audience can grow without the bill following it. The plan is monthly and the limits are the ones printed below.",
                },
              ].map((item, index) => (
                <Reveal key={item.title} delay={(index % 2) * 0.05}>
                  <article className="flex h-full gap-3 rounded-xl border border-line bg-surface/45 p-5">
                    <item.icon
                      className="mt-0.5 size-4 shrink-0 text-ink-2"
                      strokeWidth={1.8}
                      aria-hidden
                    />
                    <div>
                      <h3 className="text-[13.5px] font-semibold text-ink">{item.title}</h3>
                      <p className="mt-1 text-[12.5px] leading-relaxed text-ink-2">{item.body}</p>
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
          </Container>
        </section>

        {/* ── pricing ── */}
        <section id="pricing" className="section scroll-mt-20 border-t border-line/70">
          <Container>
            <SectionHead
              title="Priced for one creator, not one contact"
              sub="Every plan includes the public reply, DM card, tracked links and CSV export. Upgrade when you need more Reels or more accounts."
              align="center"
            />

            <div className="mt-12 grid gap-4 lg:grid-cols-3">
              {PLANS.map((plan, index) => (
                <Reveal key={plan.name} delay={index * 0.06}>
                  <article
                    className={cn(
                      "relative flex h-full flex-col rounded-2xl border p-6",
                      plan.highlighted
                        ? "border-signal/45 bg-surface shadow-[var(--sh-2)]"
                        : "border-line bg-surface/50"
                    )}
                  >
                    {plan.highlighted && (
                      <span className="absolute -top-2.5 left-6 rounded-full bg-signal px-2.5 py-0.5 font-mono text-[9.5px] font-semibold uppercase tracking-[0.12em] text-signal-ink">
                        Most chosen
                      </span>
                    )}

                    <p className="text-[13px] font-semibold text-ink">{plan.name}</p>
                    <p className="mt-3 flex items-baseline gap-1.5">
                      <span className="font-mono text-[32px] font-bold leading-none text-ink tnum">
                        {plan.price}
                      </span>
                      <span className="text-[12px] text-ink-3">{plan.cadence}</span>
                    </p>
                    <p className="mt-2 text-[12.5px] leading-relaxed text-ink-2">
                      {plan.blurb}
                    </p>

                    <ul className="mt-5 flex-1 space-y-2">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex gap-2 text-[12.5px] text-ink-2">
                          <Check
                            className="mt-0.5 size-3.5 shrink-0 text-ok"
                            strokeWidth={2.4}
                            aria-hidden
                          />
                          {feature}
                        </li>
                      ))}
                      {plan.missing.map((feature) => (
                        <li key={feature} className="flex gap-2 text-[12.5px] text-ink-3">
                          <X className="mt-0.5 size-3.5 shrink-0" strokeWidth={2} aria-hidden />
                          {feature}
                        </li>
                      ))}
                    </ul>

                    <Button
                      variant={plan.highlighted ? "signal" : "outline"}
                      className="mt-6 w-full"
                      onClick={() => go("/login")}
                    >
                      {plan.cta}
                    </Button>
                  </article>
                </Reveal>
              ))}
            </div>

            <p className="mt-6 text-center text-[12px] text-ink-3">
              Pro and Studio can be paid by UPI in India. Prices are in INR and
              include GST where it applies.
            </p>
          </Container>
        </section>

        {/* ── faq ── */}
        <section id="faq" className="section scroll-mt-20 border-t border-line/70">
          <Container className="max-w-3xl">
            <SectionHead title="Questions worth answering" align="center" />

            <div className="mt-10 divide-y divide-line rounded-2xl border border-line bg-surface/40">
              {FAQS.map((item) => (
                <details key={item.q} className="group px-5 py-4">
                  <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-[13.5px] font-semibold text-ink marker:hidden">
                    {item.q}
                    <span
                      aria-hidden
                      className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border border-line text-ink-3 transition-transform duration-200 group-open:rotate-45"
                    >
                      <span className="relative block size-2.5">
                        <span className="absolute left-1/2 top-0 h-2.5 w-px -translate-x-1/2 bg-current" />
                        <span className="absolute left-0 top-1/2 h-px w-2.5 -translate-y-1/2 bg-current" />
                      </span>
                    </span>
                  </summary>
                  <p className="mt-2.5 max-w-2xl text-[13px] leading-relaxed text-ink-2">
                    {item.a}
                  </p>
                </details>
              ))}
            </div>
          </Container>
        </section>

        {/* ── closing band ── */}
        <section className="relative overflow-hidden">
          <BrandAurora />
          <Container className="relative z-10 py-16 md:py-20">
            <Reveal>
              <div className="max-w-2xl">
                <p className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-white/65">
                  Ready when your next Reel is
                </p>
                <h2 className="h1 mt-3 text-white">
                  Connect one account. Arm one Reel. Watch the first DM land.
                </h2>
                <p className="mt-4 max-w-xl text-[14px] leading-relaxed text-white/75">
                  The free plan is enough to see the whole exchange work on a real
                  comment. No card, no trial timer, no lock-in.
                </p>
                <div className="mt-7 flex flex-wrap items-center gap-3">
                  <a
                    href="#/login"
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-white px-5 text-[14.5px] font-semibold text-brand transition-[background-color,transform] duration-150 hover:bg-white/90 active:translate-y-px"
                  >
                    Start free
                    <ArrowRight className="size-4" strokeWidth={2} aria-hidden />
                  </a>
                  <a
                    href="mailto:hello@thepilab.in"
                    className="inline-flex h-11 items-center justify-center rounded-md border border-white/25 px-5 text-[14.5px] font-semibold text-white transition-colors hover:bg-white/10"
                  >
                    Ask a question
                  </a>
                </div>
              </div>
            </Reveal>
          </Container>
        </section>

        {/* ── footer ── */}
        <footer className="border-t border-line bg-canvas/70 backdrop-blur-xl">
          <Container className="flex flex-col gap-6 py-10 md:flex-row md:items-start md:justify-between">
            <div className="max-w-xs">
              <Logo onClick={() => go("/")} />
              <p className="mt-3 text-[12.5px] leading-relaxed text-ink-3">
                Comment automation for Instagram creators, built on the official
                Graph API by The Pi Lab.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-x-12 gap-y-2 text-[12.5px] sm:grid-cols-3">
              <div className="space-y-1.5">
                <p className="caption mb-1">Product</p>
                {NAV.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="block text-ink-2 transition-colors hover:text-ink"
                  >
                    {item.label}
                  </a>
                ))}
              </div>
              <div className="space-y-1.5">
                <p className="caption mb-1">Legal</p>
                <a href="#/privacy" className="block text-ink-2 hover:text-ink">
                  Privacy
                </a>
                <a href="#/terms" className="block text-ink-2 hover:text-ink">
                  Terms
                </a>
                <a href="#/cookies" className="block text-ink-2 hover:text-ink">
                  Cookies
                </a>
              </div>
              <div className="space-y-1.5">
                <p className="caption mb-1">Contact</p>
                <a href="mailto:hello@thepilab.in" className="block text-ink-2 hover:text-ink">
                  hello@thepilab.in
                </a>
                <a href="#/login" className="block text-ink-2 hover:text-ink">
                  Sign in
                </a>
              </div>
            </div>
          </Container>

          <Container className="flex flex-wrap items-center justify-between gap-3 border-t border-line py-5">
            <p className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-ink-3">
              © {new Date().getFullYear()} The Pi Lab
            </p>
            <p className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-ink-3">
              Instagram is a trademark of Meta Platforms, Inc.
            </p>
          </Container>
        </footer>
      </div>
    </div>
  );
}
