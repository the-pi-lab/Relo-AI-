"use client";

import React, { useState } from "react";
import { ArrowRight, ChevronDown, Menu, X } from "lucide-react";
import { Button, Container, Logo, Pill, SectionHead } from "./chrome";
import { ThemeToggle } from "@/lib/relo/theme";
import { cn } from "@/lib/utils";

/* ==========================================================================
   Marketing surface.

   The page is built from three things: hairline rules, one signal colour, and
   real product UI shown at real size. No icon rows, no decorative gradients,
   no badge sitting above a headline, no scroll-triggered reveals.
   ========================================================================== */

const NAV = [
  { id: "how", label: "How it works" },
  { id: "capabilities", label: "What it does" },
  { id: "pricing", label: "Pricing" },
  { id: "faq", label: "Questions" },
];

/* ── Header ─────────────────────────────────────────────────────────────── */

function Header({ navigate }: { navigate: (to: string) => void }) {
  const [open, setOpen] = useState(false);

  const jump = (id: string) => {
    setOpen(false);
    document.getElementById(id)?.scrollIntoView({ block: "start" });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-canvas">
      <Container className="flex h-16 items-center gap-2">
        <Logo onClick={() => navigate("/")} />

        <nav aria-label="Sections" className="ml-6 hidden items-center gap-1 lg:flex">
          {NAV.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => jump(n.id)}
              className="rounded-md px-3 py-2 text-[13.5px] font-medium text-ink-2 transition-colors duration-150 ease-out hover:bg-surface-2 hover:text-ink"
            >
              {n.label}
            </button>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2.5">
          <ThemeToggle className="hidden sm:inline-flex" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/login")}
            className="hidden sm:inline-flex"
          >
            Sign in
          </Button>
          <Button variant="signal" size="sm" onClick={() => navigate("/login")}>
            Start free
          </Button>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="grid size-8 place-items-center rounded-md text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink lg:hidden"
          >
            {open ? <X className="size-4.5" /> : <Menu className="size-4.5" />}
          </button>
        </div>
      </Container>

      {open && (
        <div className="border-t border-line bg-canvas lg:hidden">
          <Container className="flex flex-col py-3">
            {NAV.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => jump(n.id)}
                className="rounded-md px-2 py-3 text-left text-[14px] font-medium text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink"
              >
                {n.label}
              </button>
            ))}
            <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
              <ThemeToggle />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setOpen(false);
                  navigate("/login");
                }}
              >
                Sign in
              </Button>
            </div>
          </Container>
        </div>
      )}
    </header>
  );
}

/* ── The hero visual: the actual thing the product sends ────────────────── */

function CommentToDm() {
  return (
    <div className="card overflow-hidden">
      {/* window bar */}
      <div className="flex items-center gap-2.5 border-b border-line px-4 py-3">
        <span className="caption">Instagram · Reel</span>
        <Pill tone="ok" className="ml-auto">
          <span className="size-1.5 rounded-full bg-ok" aria-hidden />
          armed
        </Pill>
      </div>

      {/* the trigger */}
      <div className="px-4 py-4">
        <div className="flex gap-3">
          <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-surface-3 text-[11px] font-bold text-ink-2">
            PS
          </span>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-ink">
              priya.shops
              <span className="ml-2 font-normal text-ink-3">2m</span>
            </p>
            <p className="mt-0.5 text-[14px] text-ink-2">
              price please. is it still available?
            </p>
          </div>
        </div>

        {/* the matched keyword */}
        <div className="mt-3 ml-10 inline-flex items-center gap-2 rounded-md border border-signal/25 bg-signal-wash px-2.5 py-1">
          <span className="caption !text-signal">keyword matched</span>
          <span className="font-mono text-[11.5px] font-semibold text-signal">
            &quot;price&quot;
          </span>
        </div>
      </div>

      {/* the pause, shown honestly */}
      <div className="flex items-center gap-3 px-4 pb-4">
        <span className="ml-[11px] h-6 w-px bg-line" aria-hidden />
        <span className="font-mono text-[11px] text-ink-3">
          waiting 30 to 90s so it reads like you
        </span>
      </div>

      {/* the card RELO sends */}
      <div className="border-t border-line bg-surface-2/60 px-4 py-4">
        <p className="caption mb-2.5">Direct message · sent</p>
        <div className="rounded-lg border border-line bg-surface p-4">
          <p className="text-[14px] font-semibold text-ink">
            Still available. Here is the lot.
          </p>
          <p className="mt-1 text-[13px] leading-relaxed text-ink-2">
            Three sizes left. Tap whichever you want and I will hold it for you.
          </p>
          <div className="mt-3.5 space-y-2">
            <div className="flex h-9 items-center justify-center rounded-md bg-signal text-[13px] font-semibold text-signal-ink">
              Reserve mine
            </div>
            <div className="flex h-9 items-center justify-center rounded-md border border-line-strong text-[13px] font-semibold text-ink">
              See all sizes
            </div>
            <div className="flex h-9 items-center justify-center rounded-md border border-line-strong text-[13px] font-semibold text-ink">
              Ask a question
            </div>
          </div>
        </div>
        <p className="mt-3 font-mono text-[11px] text-ink-3">
          lead captured &middot; 14:32 &middot; source: reel
        </p>
      </div>
    </div>
  );
}

function Hero({ navigate }: { navigate: (to: string) => void }) {
  return (
    <section className="border-b border-line">
      <Container className="grid items-center gap-12 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:py-24">
        <div>
          <h1 className="display text-ink">
            Your Reel comments
            <br />
            answer themselves.
          </h1>
          <p className="lead mt-6 max-w-xl">
            Someone comments a keyword on your Reel. RELO replies in public, then
            sends a three-button DM with your offer inside. You approve the words
            once and it keeps working while you film the next one.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button variant="signal" size="lg" onClick={() => navigate("/login")}>
              Start free
              <ArrowRight className="size-4" aria-hidden />
            </Button>
            <Button variant="outline" size="lg" onClick={() => navigate("/studio?demo=1")}>
              Open the studio
            </Button>
          </div>

          <p className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-ink-3">
            <span>No card needed</span>
            <span aria-hidden className="text-line-strong">
              /
            </span>
            <span>Runs on Instagram&apos;s official API</span>
            <span aria-hidden className="text-line-strong">
              /
            </span>
            <span>Disconnect any time</span>
          </p>
        </div>

        <div className="lg:pl-4">
          <CommentToDm />
        </div>
      </Container>
    </section>
  );
}

/* ── How it works: three numbered steps, no icon boxes ─────────────────── */

const STEPS = [
  {
    n: "01",
    title: "Connect the account",
    body: "You sign in on Instagram's own screen and RELO receives a scoped token. Your password never touches us, and revoking the token stops everything instantly.",
  },
  {
    n: "02",
    title: "Pick a Reel and a keyword",
    body: "Choose one of your Reels and the word your audience already types: price, link, size, kit. Write up to eight reply variations so nobody gets a copy-paste answer.",
  },
  {
    n: "03",
    title: "Let it work",
    body: "Matching comments get a public reply and a three-button DM card. A deliberate pause of 30 to 90 seconds keeps the pace human. Every tap lands in your lead list.",
  },
];

function HowItWorks() {
  return (
    <section id="how" className="section border-b border-line scroll-mt-16">
      <Container>
        <SectionHead
          title="Three steps, then it runs without you"
          sub="Nothing here needs a developer, and nothing needs to stay open in a browser tab."
        />
        <div className="mt-14 grid gap-x-10 gap-y-12 md:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="border-t border-line-strong pt-6">
              <span className="font-mono text-[12px] font-semibold tracking-[0.12em] text-signal">
                {s.n}
              </span>
              <h3 className="h3 mt-4 text-ink">{s.title}</h3>
              <p className="mt-3 text-[14.5px] leading-relaxed text-ink-2">{s.body}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

/* ── Capabilities: an editorial list, not a wall of cards ──────────────── */

const CAPABILITIES = [
  {
    title: "Replies that do not sound automated",
    body: "A randomised pause and up to eight rotating variations per Reel, so two commenters never receive the same sentence.",
  },
  {
    title: "Three-button DM cards",
    body: "Every reply carries a card with up to three buttons. Whichever one they tap becomes a tracked lead with its source attached.",
  },
  {
    title: "The 24-hour rule, respected",
    body: "Meta only allows a DM within 24 hours of someone's last message. RELO shows you exactly who is still reachable before any campaign goes out.",
  },
  {
    title: "A lead list you actually own",
    body: "Search it, filter it, export it as CSV. Nothing is held hostage behind a per-contact fee.",
  },
  {
    title: "Campaigns for the people who have gone quiet",
    body: "Broadcast to everyone still inside the window, with the same human pacing applied to every message.",
  },
  {
    title: "Tokens encrypted at rest",
    body: "Access tokens are encrypted before they are stored. One disconnect ends every automation on that account.",
  },
];

function Capabilities() {
  return (
    <section id="capabilities" className="section border-b border-line scroll-mt-16">
      <Container className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <h2 className="h2 text-ink">Built for accounts that sell</h2>
          <p className="lead mt-4">
            Six things, done properly. No dashboard full of features nobody opens
            twice.
          </p>
          <div className="mt-8 flex items-center gap-6">
            <div>
              <p className="font-mono text-[26px] font-bold leading-none text-ink tnum">
                30–90s
              </p>
              <p className="caption mt-2">reply delay</p>
            </div>
            <span className="h-10 w-px bg-line" aria-hidden />
            <div>
              <p className="font-mono text-[26px] font-bold leading-none text-ink tnum">
                ₹0
              </p>
              <p className="caption mt-2">per contact</p>
            </div>
          </div>
        </div>

        <ul className="divide-y divide-line border-t border-line">
          {CAPABILITIES.map((c, i) => (
            <li key={c.title} className="grid gap-2 py-7 sm:grid-cols-[auto_1fr] sm:gap-8">
              <span className="font-mono text-[12px] text-ink-3 tnum">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <h3 className="h4 text-ink">{c.title}</h3>
                <p className="mt-2 max-w-xl text-[14.5px] leading-relaxed text-ink-2">
                  {c.body}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

/* ── Pricing ────────────────────────────────────────────────────────────── */

type Tier = {
  name: string;
  monthly: { inr: string; usd: string };
  annual: { inr: string; usd: string } | null;
  blurb: string;
  includes: string[];
  excludes?: string[];
  featured?: boolean;
};

const TIERS: Tier[] = [
  {
    name: "Free",
    monthly: { inr: "0", usd: "0" },
    annual: null,
    blurb: "Prove it on a single Reel.",
    includes: [
      "1 automated Reel",
      "2 reply variations",
      "2 buttons plus a RELO credit",
      "3 AI credits each month",
      "Lead capture and CSV export",
    ],
    excludes: ["Follow-ups and campaigns", "AI product answers"],
  },
  {
    name: "Pro",
    monthly: { inr: "149", usd: "9.99" },
    annual: { inr: "1,499", usd: "99" },
    blurb: "For creators who sell from the comments.",
    includes: [
      "Unlimited automated Reels",
      "3 to 8 rotating reply variations",
      "3 buttons, no RELO branding",
      "Follow-up DMs and campaigns",
      "AI product answers, 500 credits monthly",
      "Analytics down to the tap",
    ],
    featured: true,
  },
  {
    name: "Studio",
    monthly: { inr: "399", usd: "24.99" },
    annual: { inr: "3,999", usd: "249" },
    blurb: "For builders running several accounts.",
    includes: [
      "Everything in Pro",
      "Canvas flow builder",
      "3 connected Instagram accounts",
      "Priority queue, 5,000 AI credits monthly",
    ],
  },
];

function Pricing({ navigate }: { navigate: (to: string) => void }) {
  const [cur, setCur] = useState<"inr" | "usd">("inr");
  const [annual, setAnnual] = useState(false);

  const price = (t: Tier) => {
    const v = annual && t.annual ? t.annual[cur] : t.monthly[cur];
    return cur === "inr" ? `₹${v}` : `$${v}`;
  };
  const period = (t: Tier) => (annual && t.annual ? "/year" : "/month");

  return (
    <section id="pricing" className="section border-b border-line scroll-mt-16">
      <Container>
        <SectionHead
          title="One flat fee, no per-contact tax"
          sub="Start free and upgrade from inside the studio once the DMs are paying for it. Every lead stays yours either way."
          actions={
            <div className="flex flex-wrap items-center gap-3">
              <div
                role="radiogroup"
                aria-label="Currency"
                className="inline-flex items-center gap-0.5 rounded-full border border-line bg-surface-2 p-0.5"
              >
                {(["inr", "usd"] as const).map((c) => (
                  <button
                    key={c}
                    type="button"
                    role="radio"
                    aria-checked={cur === c}
                    onClick={() => setCur(c)}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-[12.5px] font-semibold transition-colors duration-150 ease-out",
                      cur === c
                        ? "bg-surface text-ink shadow-[var(--sh-1)]"
                        : "text-ink-3 hover:text-ink"
                    )}
                  >
                    {c === "inr" ? "₹ INR" : "$ USD"}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setAnnual((v) => !v)}
                aria-pressed={annual}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-[12.5px] font-semibold transition-colors duration-150 ease-out",
                  annual
                    ? "border-signal/35 bg-signal-wash text-signal"
                    : "border-line text-ink-3 hover:border-line-strong hover:text-ink"
                )}
              >
                Annual, two months free
              </button>
            </div>
          }
        />

        <div className="mt-14 grid items-start gap-6 lg:grid-cols-3">
          {TIERS.map((t) => (
            <div
              key={t.name}
              className={cn(
                "relative flex h-full flex-col rounded-xl border bg-surface p-7",
                t.featured
                  ? "border-line-strong shadow-[var(--sh-2)] lg:-mt-4 lg:pb-9"
                  : "border-line shadow-[var(--sh-1)]"
              )}
            >
              {t.featured && (
                <span
                  aria-hidden
                  className="absolute inset-x-7 -top-px h-0.5 rounded-full bg-signal"
                />
              )}

              <div className="flex items-center gap-2.5">
                <h3 className="h4 text-ink">{t.name}</h3>
                {t.featured && <Pill tone="signal">Most chosen</Pill>}
              </div>
              <p className="mt-2 text-[13.5px] leading-relaxed text-ink-3">{t.blurb}</p>

              <p className="mt-6 flex items-baseline gap-1.5">
                <span className="font-mono text-[34px] font-bold leading-none tracking-tight text-ink tnum">
                  {price(t)}
                </span>
                <span className="text-[13px] text-ink-3">{period(t)}</span>
              </p>
              {annual && t.annual && (
                <p className="mt-2 text-[12.5px] text-ink-3">
                  Equivalent to {cur === "inr" ? "₹124" : "$8.25"} a month
                </p>
              )}

              <ul className="mt-7 space-y-3 border-t border-line pt-7">
                {t.includes.map((f) => (
                  <li key={f} className="flex gap-3 text-[14px] leading-relaxed text-ink-2">
                    <svg
                      viewBox="0 0 16 16"
                      className="mt-1 size-3.5 shrink-0 text-signal"
                      aria-hidden
                    >
                      <path
                        d="M3 8.5 6.2 11.5 13 4.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    {f}
                  </li>
                ))}
                {t.excludes?.map((f) => (
                  <li key={f} className="flex gap-3 text-[14px] leading-relaxed text-ink-3">
                    <span className="mt-[9px] h-px w-3.5 shrink-0 bg-line-strong" aria-hidden />
                    {f}
                  </li>
                ))}
              </ul>

              <div className="mt-8 pt-2">
                <Button
                  variant={t.featured ? "signal" : "outline"}
                  size="lg"
                  className="w-full"
                  onClick={() => navigate("/login")}
                >
                  {t.name === "Free" ? "Start free" : `Choose ${t.name}`}
                </Button>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-10 max-w-3xl text-[13px] leading-relaxed text-ink-3">
          Prices are in Indian rupees and US dollars and exclude GST where it
          applies. Running more than three accounts? Write to{" "}
          <a
            href="mailto:hello@thepilab.in"
            className="font-medium text-signal underline decoration-signal/35 underline-offset-2 transition-colors hover:decoration-signal"
          >
            hello@thepilab.in
          </a>{" "}
          and we will quote it directly.
        </p>
      </Container>
    </section>
  );
}

/* ── FAQ ────────────────────────────────────────────────────────────────── */

const FAQS = [
  {
    q: "Is this allowed by Instagram?",
    a: "RELO is built entirely on Instagram's official API using an account you connect yourself. There is no scraping and no unofficial client. Automation still carries the risk Meta sets for every tool, which is why replies go out at human pace with hard ceilings built in.",
  },
  {
    q: "How quickly do the DMs go out?",
    a: "The comment is acknowledged the moment it arrives, then RELO waits a deliberate 30 to 90 seconds before sending. A bot that fires instantly is the fastest way to get an account flagged.",
  },
  {
    q: "What is the 24-hour window?",
    a: "Instagram only permits an account to DM somebody within 24 hours of that person's last message. Before any campaign, RELO lists exactly who is still inside the window and quietly skips everybody else.",
  },
  {
    q: "Do I need a professional account?",
    a: "Yes. Meta requires a Creator or Business account for API access. Switching takes about a minute inside the Instagram app and costs nothing.",
  },
  {
    q: "What happens to my data?",
    a: "Your access token is encrypted at rest and can be revoked whenever you like. Your leads belong to you, and you can export the whole list as CSV or delete it outright.",
  },
  {
    q: "Can I see it working before I pay?",
    a: "Yes. The studio opens straight into a demo workspace with automations, leads and analytics already populated, so you can try every screen without connecting an account.",
  },
];

function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="section border-b border-line scroll-mt-16">
      <Container className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <div>
          <h2 className="h2 text-ink">Questions, answered plainly</h2>
          <p className="lead mt-4">
            If something is missing, email{" "}
            <a
              href="mailto:hello@thepilab.in"
              className="font-medium text-signal underline decoration-signal/35 underline-offset-2 hover:decoration-signal"
            >
              hello@thepilab.in
            </a>
            .
          </p>
        </div>

        <div className="divide-y divide-line border-t border-line">
          {FAQS.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={f.q}>
                <h3>
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center gap-4 py-5 text-left transition-colors duration-150 ease-out hover:text-signal"
                  >
                    <span
                      className={cn(
                        "flex-1 text-[15.5px] font-semibold transition-colors",
                        isOpen ? "text-signal" : "text-ink"
                      )}
                    >
                      {f.q}
                    </span>
                    <ChevronDown
                      className={cn(
                        "size-4 shrink-0 transition-transform duration-200 ease-out",
                        isOpen ? "rotate-180 text-signal" : "text-ink-3"
                      )}
                      aria-hidden
                    />
                  </button>
                </h3>
                {isOpen && (
                  <p className="max-w-2xl pb-6 text-[14.5px] leading-relaxed text-ink-2">
                    {f.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

/* ── Closing band ───────────────────────────────────────────────────────── */

function Closing({ navigate }: { navigate: (to: string) => void }) {
  return (
    /* Inverted band. In light mode this is near-black; in dark mode it flips to
       near-white. Same mark-up, same tokens, real contrast in both. */
    <section className="bg-ink text-ink-invert">
      <Container className="py-20 md:py-28">
        <div className="max-w-3xl">
          <h2 className="h1">
            The next thousand customers are already in your comments.
          </h2>
          <p className="mt-6 max-w-xl text-[15.5px] leading-relaxed opacity-70">
            RELO answers every one of them while you film the next Reel. Set it up
            once and it keeps going at 2am without you.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Button
              variant="signal"
              size="lg"
              onClick={() => navigate("/login")}
              className="!text-signal-ink"
            >
              Start free
              <ArrowRight className="size-4" aria-hidden />
            </Button>
            <button
              type="button"
              onClick={() => navigate("/studio?demo=1")}
              className="inline-flex h-11 items-center justify-center rounded-md border border-current/25 px-5 text-[14.5px] font-semibold transition-colors duration-150 ease-out hover:bg-current/10"
            >
              Open the studio
            </button>
          </div>
        </div>
      </Container>
    </section>
  );
}

/* ── Footer ─────────────────────────────────────────────────────────────── */

function Footer({ navigate }: { navigate: (to: string) => void }) {
  return (
    <footer className="border-t border-line bg-canvas">
      <Container className="py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Logo onClick={() => navigate("/")} />
            <p className="mt-5 max-w-sm text-[13.5px] leading-relaxed text-ink-3">
              RELO turns Instagram Reel comments into verified, three-button DMs
              through Instagram&apos;s official API. Built by The Pi Lab.
            </p>
            <div className="mt-6">
              <ThemeToggle />
            </div>
          </div>

          <div>
            <p className="caption">Product</p>
            <ul className="mt-4 space-y-2.5 text-[13.5px]">
              {NAV.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() =>
                      document.getElementById(n.id)?.scrollIntoView({ block: "start" })
                    }
                    className="text-ink-2 transition-colors hover:text-ink"
                  >
                    {n.label}
                  </button>
                </li>
              ))}
              <li>
                <button
                  type="button"
                  onClick={() => navigate("/studio?demo=1")}
                  className="text-ink-2 transition-colors hover:text-ink"
                >
                  Demo studio
                </button>
              </li>
            </ul>
          </div>

          <div>
            <p className="caption">Company</p>
            <ul className="mt-4 space-y-2.5 text-[13.5px]">
              <li>
                <button
                  type="button"
                  onClick={() => navigate("/privacy")}
                  className="text-ink-2 transition-colors hover:text-ink"
                >
                  Privacy
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigate("/terms")}
                  className="text-ink-2 transition-colors hover:text-ink"
                >
                  Terms
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigate("/cookies")}
                  className="text-ink-2 transition-colors hover:text-ink"
                >
                  Cookies
                </button>
              </li>
              <li>
                <a
                  href="mailto:hello@thepilab.in"
                  className="text-ink-2 transition-colors hover:text-ink"
                >
                  hello@thepilab.in
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-line pt-6 text-[12.5px] text-ink-3 md:flex-row md:items-center md:justify-between">
          <p>&copy; 2026 The Pi Lab. All rights reserved.</p>
          <p className="max-w-xl md:text-right">
            RELO is an independent product. It is not affiliated with, endorsed by
            or sponsored by Meta or Instagram.
          </p>
        </div>
      </Container>
    </footer>
  );
}

/* ── Page ───────────────────────────────────────────────────────────────── */

/* ReloApp owns the single <main id="main-content"> for the whole app, so the
   page body here is a plain element. A nested <main> would duplicate the id
   and break the skip link's target. */
export function LandingPage({ navigate }: { navigate: (to: string) => void }) {
  return (
    <div className="bg-canvas">
      <Header navigate={navigate} />
      <Hero navigate={navigate} />
      <HowItWorks />
      <Capabilities />
      <Pricing navigate={navigate} />
      <Faq />
      <Closing navigate={navigate} />
      <Footer navigate={navigate} />
    </div>
  );
}
