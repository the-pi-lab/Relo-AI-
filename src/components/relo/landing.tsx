"use client";

import React, { useState } from "react";
import { Logo, RButton, SectionHead, FieldLabel } from "./chrome";
import { ThemeToggle } from "@/lib/relo/theme";

/* ──────────────────────────────────────────────────────────────────────
   Nav
   ───────────────────────────────────────────────────────────────────── */

function Nav({ navigate }: { navigate: (to: string) => void }) {
  const [open, setOpen] = useState(false);
  const go = (id: string) => {
    setOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <header className="fixed inset-x-0 top-0 z-40 flex justify-center px-4 pt-3">
      <div className="flex w-full max-w-6xl items-center gap-3 rounded-lg border border-border bg-surface px-3.5 py-2">
        <Logo onClick={() => navigate("/")} />
        <nav className="ml-4 hidden items-center gap-1 md:flex" aria-label="Primary">
          {[
            ["how-it-works", "How it works"],
            ["pricing", "Pricing"],
            ["faq", "FAQ"],
          ].map(([id, label]) => (
            <button
              key={id}
              onClick={() => go(id)}
              className="rounded-md px-3 py-1.5 text-xs font-semibold text-text-3 transition-colors hover:text-text hover:bg-surface-2"
            >
              {label}
            </button>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <RButton variant="ghost" size="sm" onClick={() => navigate("/studio?demo=1")}>
            Tour the studio
          </RButton>
          <RButton size="sm" onClick={() => navigate("/login")}>
            Sign in
          </RButton>
        </div>
        <button
          className="ml-auto hidden size-9 shrink-0 place-items-center rounded-md border border-border text-text md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Menu"
          aria-expanded={open}
        >
          <svg className="size-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
      {open && (
        <div className="absolute left-4 right-4 top-14 z-40 flex flex-col gap-1 rounded-lg border border-border bg-surface p-3 shadow-lg">
          {[
            ["how-it-works", "How it works"],
            ["pricing", "Pricing"],
            ["faq", "FAQ"],
          ].map(([id, label]) => (
            <button key={id} onClick={() => go(id)} className="w-full text-left rounded-md px-3 py-2 text-sm font-semibold text-text-3 hover:bg-surface-2 hover:text-text">
              {label}
            </button>
          ))}
          <div className="mt-2 pt-2 flex gap-2 border-t border-border">
            <RButton variant="ghost" size="sm" className="flex-1" onClick={() => navigate("/studio?demo=1")}>
              Tour the studio
            </RButton>
            <RButton size="sm" className="flex-1" onClick={() => navigate("/login")}>
              Sign in
            </RButton>
          </div>
        </div>
      )}
    </header>
  );
}

/* ──────────────────────────────────────────────────────────────────────
   Hero
   ───────────────────────────────────────────────────────────────────── */

function Hero({ navigate }: { navigate: (to: string) => void }) {
  return (
    <section id="top" className="relative min-h-[90svh] flex flex-col justify-center px-4 pt-20 sm:px-6 sm:pt-28 lg:px-8">
      <div className="mx-auto max-w-3xl text-center">
        <SectionHead
          title="Your Reel comments answer themselves."
          sub="Connect your Instagram account, pick a reel, and choose a keyword. Every matching comment gets a public reply and a 3-button DM card — automatically. Set it once, keep selling."
        />
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:justify-center">
          <RButton size="lg" onClick={() => navigate("/login")}>
            Start free <span className="text-accent-hover">→</span>
          </RButton>
          <RButton variant="outline" size="lg" onClick={() => navigate("/studio?demo=1")}>
            Try the studio
          </RButton>
        </div>
        <div className="mt-10 flex flex-col items-center gap-2 sm:flex-row sm:justify-center text-xs text-text-3">
          <span>No credit card.</span>
          <span aria-hidden>·</span>
          <span>Cancel anytime.</span>
          <span aria-hidden>·</span>
          <span>Your data stays yours.</span>
        </div>
      </div>
      <div className="mx-auto mt-16 max-w-5xl">
        <HeroPreview />
      </div>
    </section>
  );
}

/* A honest, static preview of what a comment → DM looks like. No shader. */
function HeroPreview() {
  return (
    <div className="rounded-xl border border-border bg-surface-2 shadow-lg overflow-hidden">
      <div className="border-b border-border bg-surface px-4 py-3 flex items-center gap-3">
        <span className="grid size-6 place-items-center rounded-full bg-accent text-accent-ink font-black text-xs">R</span>
        <div>
          <p className="text-xs font-bold text-text">RELO · @aarav.makes</p>
          <p className="text-[10px] text-text-3 uppercase tracking-wider">just now · automated</p>
        </div>
        <span className="ml-auto text-[10px] font-bold text-accent uppercase tracking-wider">delivered</span>
      </div>
      <div className="px-4 py-4">
        <div className="h-16 rounded-lg border border-border mb-3" style={{ background: "linear-gradient(180deg, var(--surface-3), var(--surface-2))" }}>
          <div className="px-3 py-2 text-center">
            <p className="text-[10px] text-text-3 uppercase tracking-wider mb-0.5">creator os pack</p>
            <p className="text-xs font-bold text-text">The Creator OS — free pack</p>
          </div>
        </div>
        <p className="text-sm font-bold text-text">Grab the free Creator OS pack</p>
        <p className="mt-0.5 text-xs text-text-3">12 templates plus the exact comment scripts I use. No email needed.</p>
        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between rounded-md bg-accent px-3 py-2 text-center text-accent-ink text-xs font-bold">
            Download free pack
          </div>
          <div className="flex items-center justify-between rounded-md border border-accent-wash px-3 py-2 text-center text-accent text-xs font-bold">
            See all templates
          </div>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────
   How it works — three numbered steps, no icon boxes.
   ───────────────────────────────────────────────────────────────────── */

function HowItWorks() {
  const steps = [
    {
      num: "01",
      title: "Connect your Instagram",
      body: "Log in through Instagram's official screen. RELO never sees your password.",
    },
    {
      num: "02",
      title: "Pick a reel and a keyword",
      body: "Choose one of your reels and the word your fans already type in the comments.",
    },
    {
      num: "03",
      title: "Comments become DMs",
      body: "Every matching comment gets your reply and a 3-button DM card. Clicks are tracked as leads.",
    },
  ];

  return (
    <section id="how-it-works" className="px-4 py-16 sm:px-6 sm:py-24 lg:px-8 border-t border-border">
      <SectionHead
        title="How it works"
        sub="Three steps, then the reel works while you film the next one."
      />
      <div className="mt-12 grid gap-8 sm:grid-cols-3">
        {steps.map((s) => (
          <div key={s.num} className="rounded-xl border border-border bg-surface p-6">
            <p className="mb-3 text-xs font-bold text-accent tracking-wider uppercase">{s.num}</p>
            <h3 className="h3 text-text">{s.title}</h3>
            <p className="mt-3 text-sm text-text-2">{s.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────────────
   Features — one column, direct copy, no decorative icons.
   ───────────────────────────────────────────────────────────────────── */

function Features() {
  const items = [
    {
      title: "Human timing, not bot blitz",
      body: "RELO waits a random 30 to 90 seconds after each comment so replies look like you, not automation.",
    },
    {
      title: "Your words, rotated",
      body: "Write up to eight reply variations per reel. RELO rotates them so no commenter gets the same message twice.",
    },
    {
      title: "3-button DM cards",
      body: "Each reply sends a template card with up to three buttons. Every click becomes a tracked lead.",
    },
    {
      title: "Leads you own",
      body: "Every commenter who taps a button becomes a lead. Export the full list to CSV with one click.",
    },
    {
      title: "24-hour window, respected",
      body: "RELO shows which leads are still reachable under Meta's rules and skips everyone else.",
    },
    {
      title: "Tokens sealed",
      body: "Your access token is encrypted at rest. You can disconnect Instagram at any time and every automation stops.",
    },
  ];

  return (
    <section id="features" className="px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <SectionHead
        title="Everything a selling account needs"
        sub="Nothing it does not."
      />
      <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {items.map((it) => (
          <div key={it.title} className="rounded-xl border border-border bg-surface p-6">
            <h3 className="h4 text-text">{it.title}</h3>
            <p className="mt-3 text-sm text-text-2">{it.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────────────
   Pricing — three tiers, INR / USD toggle.
   ───────────────────────────────────────────────────────────────────── */

const TIERS = [
  {
    name: "Free",
    price: { inr: "0", usd: "0" },
    period: "/mo",
    annual: null,
    description: "Try it on one reel.",
    features: [
      "1 automated reel",
      "2 reply variations",
      "2 buttons plus the RELO button",
      "3 AI credits a month",
      "Lead capture and CSV export",
    ],
    gated: ["Follow-ups and campaigns", "AI product answers"],
  },
  {
    name: "Pro",
    price: { inr: "149", usd: "9.99" },
    period: "/mo",
    annual: { inr: "1,499", usd: "99" },
    description: "For creators who sell.",
    features: [
      "Unlimited automated reels",
      "3 to 8 rotated reply variations",
      "3 buttons, no RELO branding",
      "Follow-up DMs and campaigns",
      "AI product answers · 500 credits a month",
      "Sent to clicked analytics",
    ],
    highlight: true,
  },
  {
    name: "Studio",
    price: { inr: "399", usd: "24.99" },
    period: "/mo",
    annual: { inr: "3,999", usd: "249" },
    description: "For builders and agencies.",
    features: [
      "Everything in Pro",
      "Canvas flow builder",
      "3 connected Instagram accounts",
      "Priority queue · 5,000 AI credits a month",
    ],
  },
];

function Pricing({ navigate }: { navigate: (to: string) => void }) {
  const [cur, setCur] = useState<"inr" | "usd">("inr");
  const price = (t: typeof TIERS[number]) =>
    cur === "inr" ? `₹${t.price.inr}` : `$${t.price.usd}`;
  const annual = (t: typeof TIERS[number]) =>
    cur === "inr" ? `₹${t.annual!.inr}/yr` : `$${t.annual!.usd}/yr`;

  return (
    <section id="pricing" className="px-4 py-16 sm:px-6 sm:py-24 lg:px-8 border-t border-border">
      <div className="mx-auto max-w-3xl">
        <SectionHead
          title="One flat fee. No contact tax."
          sub="Start free, upgrade in-app when the DMs start paying for it. Your leads are yours."
        />
        <div className="mt-8 flex items-center gap-2 rounded-lg border border-border bg-surface px-1" role="radiogroup" aria-label="Currency">
          {(["inr", "usd"] as const).map((c) => (
            <button
              key={c}
              role="radio"
              aria-checked={cur === c}
              onClick={() => setCur(c)}
              className={`relative rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                cur === c ? "bg-accent text-accent-ink" : "text-text-3 hover:text-text"
              }`}
            >
              {c === "inr" ? "₹ India" : "$ Global"}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-14 grid gap-6 md:grid-cols-3">
        {TIERS.map((t) => (
          <div key={t.name} className={`rounded-xl p-7 border ${
            t.highlight ? "border-accent bg-accent-wash" : "border-border bg-surface"
          }`}>
            {t.highlight && (
              <p className="mb-2 text-xs font-bold text-accent tracking-wider uppercase">Most popular</p>
            )}
            <h3 className="h4 text-text">{t.name}</h3>
            <p className="mt-1 text-xs text-text-3">{t.description}</p>
            <div className="mt-5 flex items-baseline gap-1">
              <span className="text-3xl font-bold text-text">{price(t)}</span>
              <span className="text-sm text-text-3">{t.period}</span>
            </div>
            {t.annual && (
              <p className="mt-2 text-xs text-text-3">or {annual(t)} — two months free</p>
            )}
            <ul className="mt-7 space-y-3">
              {t.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-text-2">
                  <span className="mt-0.5 size-1.5 rounded-full bg-accent" />
                  {f}
                </li>
              ))}
              {t.gated?.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-text-3 line-through decoration-border/60">
                  <span className="mt-0.5 size-1.5 rounded-full bg-surface-2" />
                  {f}
                </li>
              ))}
            </ul>
            <RButton
              variant={t.highlight ? "amber" : "outline"}
              size="md"
              className="mt-7 w-full"
              onClick={() => navigate("/login")}
            >
              Start free{t.highlight ? ", upgrade in-app" : ""}
            </RButton>
          </div>
        ))}
      </div>

      <div className="mt-12 mx-auto max-w-2xl text-center">
        <p className="text-sm text-text-2">
          Running more than three creators? Agency plans are priced personally —{" "}
          <a href="mailto:hello@thepilab.in" className="text-accent underline underline-offset-2 hover:underline-offset-4">
            hello@thepilab.in
          </a>
        </p>
        <p className="mt-3 text-xs text-text-3">
          Prices exclude GST where applicable · plan features may evolve with 30 days of email notice ·
          cancel anytime, no lock-in
        </p>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────────────
   FAQ
   ───────────────────────────────────────────────────────────────────── */

const FAQS = [
  {
    q: "Is this allowed by Instagram?",
    a: "RELO is built entirely on Instagram's official API using your own connected account. There is no scraping. Automation still carries the risk Meta sets for every tool, which is why RELO replies at human pace with built-in ceilings.",
  },
  {
    q: "How fast do the DMs go out?",
    a: "RELO acknowledges the webhook immediately, then waits a deliberate 30 to 90 seconds so the reply feels human — never a bot blitz that gets accounts flagged.",
  },
  {
    q: "What is the 24-hour window?",
    a: "Instagram only lets an account DM a user within 24 hours of that user's last message. RELO shows you exactly which leads are still reachable before any campaign.",
  },
  {
    q: "Do I need an Instagram Professional account?",
    a: "Yes. Meta requires a Professional (Creator or Business) account for API access. Switching is free and takes about a minute in the Instagram app.",
  },
  {
    q: "What happens to my data?",
    a: "Your access token is encrypted at rest and can be revoked anytime. Your leads are yours — export the full list to CSV with one click, or delete everything.",
  },
];

function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="px-4 py-16 sm:px-6 sm:py-24 lg:px-8 border-t border-border">
      <div className="mx-auto max-w-3xl">
        <SectionHead
          title="Questions, answered plainly"
          sub="Pick one to read the answer."
        />
        <div className="mt-12 space-y-3">
          {FAQS.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={f.q} className="rounded-xl border border-border bg-surface overflow-hidden">
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-surface-2"
                  aria-expanded={isOpen}
                >
                  <span className="text-xs font-bold text-text">{String(i + 1).padStart(2, "0")}</span>
                  <span className="flex-1 text-sm font-semibold text-text">{f.q}</span>
                  <svg className="size-4 shrink-0 text-text-3 transition-transform" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0)" }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isOpen && (
                  <div className="px-5 pb-4 pl-[52px] text-sm text-text-2 leading-relaxed">
                    {f.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────────────
   Final CTA + Footer
   ───────────────────────────────────────────────────────────────────── */

function Cta({ navigate }: { navigate: (to: string) => void }) {
  return (
    <section className="px-4 py-16 sm:px-6 sm:py-24 lg:px-8 border-t border-border bg-surface-2">
      <div className="mx-auto max-w-2xl text-center rounded-xl p-10 border border-border bg-surface">
        <h2 className="h2 text-text">Your next thousand customers are already commenting.</h2>
        <p className="mt-4 text-sm text-text-2 leading-relaxed">
          RELO answers every single comment while you film the next reel.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <RButton size="lg" onClick={() => navigate("/login")}>
            Start free <span className="text-accent-hover">→</span>
          </RButton>
          <RButton variant="outline" size="lg" onClick={() => navigate("/studio?demo=1")}>
            Try the studio
          </RButton>
        </div>
      </div>
    </section>
  );
}

function Footer({ navigate }: { navigate: (to: string) => void }) {
  return (
    <footer className="border-t border-border bg-surface px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
      <div className="mx-auto max-w-6xl flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <Logo onClick={() => navigate("/")} />
          <span className="text-xs font-semibold text-text">RELO</span>
        </div>
        <p className="text-xs text-text-3">
          Built by The π Lab — software that does what it says. RELO is an independent
          product, not affiliated with, endorsed by, or sponsored by Meta or Instagram.
        </p>
        <div className="flex flex-wrap items-center gap-4 text-xs text-text-3">
          <button onClick={() => navigate("/privacy")} className="hover:text-text transition-colors">
            Privacy
          </button>
          <button onClick={() => navigate("/terms")} className="hover:text-text transition-colors">
            Terms
          </button>
          <button onClick={() => navigate("/cookies")} className="hover:text-text transition-colors">
            Cookies
          </button>
          <a href="mailto:hello@thepilab.in" className="text-accent hover:text-accent-hover underline underline-offset-2">
            hello@thepilab.in
          </a>
        </div>
      </div>
    </footer>
  );
}

export function LandingPage({ navigate }: { navigate: (to: string) => void }) {
  return (
    <div className="relative">
      <Nav navigate={navigate} />
      <main>
        <Hero navigate={navigate} />
        <HowItWorks />
        <Features />
        <Pricing navigate={navigate} />
        <Faq />
        <Cta navigate={navigate} />
        <Footer navigate={navigate} />
      </main>
    </div>
  );
}
