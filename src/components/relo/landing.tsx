"use client";

/**
 * RELO AI — World-Class Landing Page
 *
 * Designed to match and exceed Zorcha with:
 * - 16:9 Hero with authentic crowd-flashes creator photo & floating live DM interaction cards
 * - Meta Tech Provider & DPIIT verified Trust Bar
 * - "Supercharge Your Growth" Bento Grid with 10X curve & AI FAQ
 * - "Unlock the Full Potential" 4-Creator Sticky Scroll with live DM overlays
 * - "How RELO Automates Your Viral Journey" 4-tab workflow & interactive browser mockup
 * - Transparent flat pricing (₹199/mo Pro vs ManyChat's growth tax)
 * - "Where Attention Becomes Income" Creator Collective banner & 5-column Directory Footer
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
import { LiquidBackdrop } from "./ambient";
import { Reveal, Tilt } from "./motion";
import { ThemeToggle } from "@/lib/relo/theme";
import { cn } from "@/lib/utils";

import { HeroShowcase } from "./landing/HeroShowcase";
import { TrustBar } from "./landing/TrustBar";
import { GrowthBentoGrid } from "./landing/GrowthBentoGrid";
import { StickyPotentialScroll } from "./landing/StickyPotentialScroll";
import { ProcessWalkthroughTabs } from "./landing/ProcessWalkthroughTabs";
import { FooterDirectory } from "./landing/FooterDirectory";
import { SavingsCalculator } from "./landing/SavingsCalculator";

interface LandingProps {
  navigate: (to: string) => void;
}

const NAV = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#potential", label: "Product" },
  { href: "#growth", label: "Features" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
];

const FEATURES = [
  {
    icon: MessageCircle,
    title: "Keyword triggers, per Reel",
    body: "Up to 12 keywords on each Reel. The comment ID is deduplicated, so one comment never sends two duplicate DMs.",
  },
  {
    icon: Send,
    title: "Public reply, then private DM",
    body: "Reply variations are selected dynamically at send time, so no two commenters receive identical responses.",
  },
  {
    icon: Layers,
    title: "DM cards with 3 buttons",
    body: "Title, subtitle and up to 3 buttons — the native layout Instagram officially renders in a private reply.",
  },
  {
    icon: Link2,
    title: "Tracked short links",
    body: "Each button points at a RELO short link, tracking clicks and conversions in the same unified funnel.",
  },
  {
    icon: Clock,
    title: "Human-paced sending (Anti-Spam)",
    body: "Jobs wait 30–90 seconds randomized jitter before dispatching. If you reply manually, that conversation pauses for 30 minutes.",
  },
  {
    icon: Users,
    title: "1-Click CSV lead export",
    body: "Every commenter becomes an exportable lead row with contact details, DM count, and interaction timestamps.",
  },
  {
    icon: CalendarDays,
    title: "Broadcasts inside 24h window",
    body: "Re-engage recent commenters inside Meta's official 24-hour window with zero spam risk.",
  },
  {
    icon: Sparkles,
    title: "24/7 AI FAQ catalog answers",
    body: "Common product inquiries are answered directly from your offers, handing off uncertain questions to you.",
  },
  {
    icon: BarChart3,
    title: "100% measured real telemetry",
    body: "Queue depth, replies, DMs, leads, and clicks — read directly from the Cloudflare edge Worker. No fabricated stats.",
  },
];

const PLANS = [
  {
    name: "Free Starter",
    price: "₹0",
    cadence: "forever",
    blurb: "Test one Reel end to end with zero risk.",
    cta: "Start free",
    highlighted: false,
    features: [
      "1 Instagram account",
      "1 Reel automation forever",
      "2 public reply variations",
      "DM cards with 2 action buttons",
      "100 automated DMs per month",
      "Lead list and CSV export",
    ],
    missing: ["Broadcast campaigns", "Link-in-bio builder", "Flow canvas", "Custom lead forms"],
  },
  {
    name: "Pro Plan",
    price: "₹199",
    cadence: "per month",
    blurb: "For creators publishing Reels every week.",
    cta: "Choose Pro (₹199/mo)",
    highlighted: true,
    features: [
      "1 Instagram account",
      "Unlimited Reels & comment automations",
      "Unlimited contacts (no per-contact tax!)",
      "3–8 randomized reply variations",
      "DM cards with 3 action buttons",
      "Broadcasts inside 24h Meta window",
      "Link-in-bio page & content planner",
      "500 AI credits per month",
    ],
    missing: [],
  },
  {
    name: "Max Plan",
    price: "₹499",
    cadence: "per month",
    blurb: "For high-volume creators needing priority edge speed & AI.",
    cta: "Choose Max (₹499/mo)",
    highlighted: false,
    features: [
      "1 Instagram account (Priority Edge <15ms)",
      "Everything in Pro included",
      "Flow canvas blueprint builder",
      "5,000 AI credits per month",
      "Webhooks & Zapier integrations",
      "Priority VIP email support",
    ],
    missing: [],
  },
];

const FAQS = [
  {
    q: "Is RELO Meta Verified and safe for my account?",
    a: "Yes, 100%. RELO is an official Meta Tech Provider built exclusively on Instagram's official Graph API. We never ask for your password, use randomized 30-90s human jitter, and enforce Meta rate-limit safety so your account stays 100% protected.",
  },
  {
    q: "Is RELO cheaper than ManyChat?",
    a: "By a massive margin. ManyChat charges an escalating 'growth tax' that increases every time your contacts grow (charging $145 to $235+ every single month). RELO charges a flat ₹199/month for unlimited contacts with zero per-contact fees.",
  },
  {
    q: "Is RELO an Indian company? Can I pay with UPI & get a GST invoice?",
    a: "Yes! RELO is proud to be built in India by The Pi Lab, recognized under DPIIT #startupindia. You can pay seamlessly via UPI, credit/debit card, or net banking, and download automated GST-compliant tax invoices anytime.",
  },
  {
    q: "How does the Follower Gate work?",
    a: "When armed, RELO politely asks commenters in their DM to follow your page first before delivering the exclusive link. Once they tap 'I'm following', the system validates the response and delivers the download card instantly.",
  },
  {
    q: "What happens if I manually reply to a follower's DM?",
    a: "If you jump into the Instagram chat yourself, RELO automatically pauses automation for that conversation for 30 minutes, ensuring you have complete natural control without awkward bot interruptions.",
  },
  {
    q: "Can I cancel my subscription anytime?",
    a: "Yes, with zero lock-in or penalties. You can cancel with one click from your settings. Your automations remain active until the end of your billing cycle, and your audience data is always yours to export as CSV.",
  },
];

/* ── Interactive Live Exchange Card ─────────────────────────────────────── */
function ExchangeCard() {
  return (
    <Tilt strength={5}>
      <div className="glass-panel overflow-hidden rounded-3xl border border-line shadow-2xl">
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3.5 bg-surface-2/40">
          <div className="flex items-center gap-2.5">
            <span className="grid size-7 place-items-center rounded-lg bg-brand text-[11px] font-bold text-brand-ink">
              R
            </span>
            <div>
              <p className="text-[12.5px] font-bold leading-tight text-ink">Active Reel Automation</p>
              <p className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-ink-3">
                Keyword: &quot;pack&quot;
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-ok/30 bg-ok-wash px-2.5 py-0.5 text-[10.5px] font-bold text-ok">
            <span className="size-1.5 rounded-full bg-ok" aria-hidden />
            live
          </span>
        </div>

        <div className="space-y-3.5 p-5">
          {/* Incoming Comment */}
          <div className="flex items-start gap-2.5">
            <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-surface-3 text-[10px] font-bold text-ink">
              P
            </span>
            <div className="min-w-0">
              <p className="text-[11.5px] font-semibold text-ink">
                priya.shoots <span className="font-normal text-ink-3">commented</span>
              </p>
              <p className="mt-1 w-fit rounded-xl rounded-tl-sm border border-line bg-surface px-3 py-2 text-[12.5px] font-medium text-ink">
                pack please! 🔥
              </p>
            </div>
          </div>

          {/* Wire Streamer */}
          <div className="flex items-center gap-2.5 pl-9">
            <svg width="14" height="24" viewBox="0 0 14 24" aria-hidden className="shrink-0">
              <path
                d="M7 0v16"
                stroke="var(--signal)"
                strokeWidth="1.6"
                strokeDasharray="4 5"
                className="flow-wire-stream"
              />
              <path d="M2.5 14 7 19.5 11.5 14" fill="none" stroke="var(--signal)" strokeWidth="1.6" />
            </svg>
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-3">
              42s jitter delay · public reply + private DM
            </p>
          </div>

          {/* Public Reply under comment */}
          <div className="ml-9 w-fit rounded-xl rounded-tl-sm border border-line bg-surface-2/70 px-3.5 py-2 text-[12px] text-ink-2">
            Just dropped the download link in your DMs! Check your inbox 📬
          </div>

          {/* The Private DM Card */}
          <div className="ml-9 overflow-hidden rounded-xl border border-line bg-surface shadow-[var(--sh-1)]">
            <div className="flex items-center gap-2 border-b border-line/70 px-3 py-2 bg-surface-2/30">
              <span className="size-1.5 rounded-full bg-signal" aria-hidden />
              <p className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-ink-3">
                instagram direct message
              </p>
            </div>
            <div className="p-3.5">
              <p className="text-[13px] font-bold text-ink">The Creator Growth OS Pack</p>
              <p className="mt-0.5 text-[11.5px] text-ink-3">Everything you need to automate your DM pipeline.</p>
              <div className="mt-3 space-y-1.5">
                {["Get the pack (Free)", "See pricing", "Ask a question"].map((label, index) => (
                  <div
                    key={label}
                    className={cn(
                      "rounded-lg border px-3 py-1.5 text-center text-[11.5px] font-semibold transition-colors",
                      index === 0
                        ? "border-signal/40 bg-signal-wash text-signal font-bold cursor-pointer"
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
            <MousePointerClick className="size-3 text-signal" aria-hidden />
            <p className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-signal font-bold">
              button 1 clicked · lead captured in D1
            </p>
          </div>
        </div>
      </div>
    </Tilt>
  );
}

/* ── Main Landing Page ──────────────────────────────────────────────────── */
export function LandingPage({ navigate }: LandingProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const go = (to: string) => {
    setMenuOpen(false);
    navigate(to);
  };

  return (
    <div className="relative min-h-svh overflow-x-clip text-ink bg-canvas">
      <LiquidBackdrop variant="hero" grid />

      {/* Floating Glass Pill Navbar */}
      <header className="sticky top-0 z-50 border-b border-line/60 bg-canvas/80 backdrop-blur-xl">
        <Container className="flex h-16 items-center gap-3">
          <Logo onClick={() => go("/")} />

          <nav aria-label="Sections" className="ml-8 hidden items-center gap-1.5 lg:flex">
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-1.5 text-[13px] font-semibold text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2.5">
            <ThemeToggle className="hidden sm:inline-flex" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => go("/login")}
              className="hidden sm:inline-flex text-[13px] font-semibold"
            >
              Sign in
            </Button>
            <button
              type="button"
              onClick={() => go("/login")}
              className="obsidian h-9 px-4 rounded-xl text-[12.5px] font-bold shadow-md transition-transform hover:-translate-y-0.5 inline-flex items-center gap-1.5"
            >
              <span>Get started</span>
              <ArrowRight className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-label="Menu"
              className="grid size-9 place-items-center rounded-xl border border-line bg-surface text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink lg:hidden"
            >
              {menuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
            </button>
          </div>
        </Container>

        {menuOpen && (
          <div className="border-t border-line bg-canvas/95 backdrop-blur-2xl lg:hidden">
            <Container className="flex flex-col gap-1 py-4">
              {NAV.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-lg px-3 py-2 text-[14px] font-semibold text-ink-2 hover:bg-surface-2 hover:text-ink"
                >
                  {item.label}
                </a>
              ))}
              <div className="mt-2 flex items-center justify-between border-t border-line pt-3 px-2">
                <button
                  type="button"
                  onClick={() => go("/login")}
                  className="text-[14px] font-semibold text-ink hover:text-signal"
                >
                  Sign in
                </button>
                <ThemeToggle />
              </div>
            </Container>
          </div>
        )}
      </header>

      <main className="relative z-10">
        {/* 1. Hero Showcase with Crowd Flashes Photo */}
        <HeroShowcase
          onStartFree={() => go("/login")}
          onSeeHowItWorks={() => {
            const el = document.getElementById("how-it-works");
            el?.scrollIntoView({ behavior: "smooth" });
          }}
        />

        {/* 2. Trust Bar (Trustpilot, Meta Tech Provider, G2, DPIIT) */}
        <TrustBar />

        {/* 3. Supercharge Your Growth (Bento Grid with 10X Curve & AI FAQ) */}
        <div id="growth">
          <GrowthBentoGrid />
        </div>

        {/* 4. Unlock the Full Potential (4-Creator Sticky Scroll with Dynamic DMs) */}
        <div id="potential">
          <StickyPotentialScroll />
        </div>

        {/* 5. How RELO Automates Your Viral Journey (4-Tab Workflow Tabs) */}
        <div id="how-it-works">
          <ProcessWalkthroughTabs />
        </div>

        {/* 6. Live Exchange Demonstration Card */}
        <section className="border-t border-line/70 py-20 lg:py-28">
          <Container className="grid items-center gap-12 lg:grid-cols-12">
            <div className="lg:col-span-6 space-y-4 text-left">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-signal/25 bg-signal-wash px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-signal">
                <Sparkles className="size-3" /> Live Simulator
              </span>
              <h2 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
                Watch a single comment turn into a paying customer
              </h2>
              <p className="text-[14.5px] leading-relaxed text-ink-2 max-w-lg">
                RELO doesn&apos;t just send a plain text link. It posts a randomized public comment reply to boost your algorithm score, waits a human-paced 30–90 seconds, and delivers an interactive native Instagram card with tracked buttons.
              </p>
              <div className="pt-2">
                <Button variant="signal" size="lg" onClick={() => go("/login")}>
                  Test it on your own Reel
                  <ArrowRight className="size-4 ml-1.5" />
                </Button>
              </div>
            </div>

            <div className="lg:col-span-6">
              <ExchangeCard />
            </div>
          </Container>
        </section>

        {/* 7. Comprehensive Feature Matrix */}
        <section id="features" className="border-t border-line/70 py-20 lg:py-28 bg-surface/30">
          <Container>
            <SectionHead
              title="Everything your DM engine needs. Nothing it doesn't."
              sub="Built strictly on Meta's official Graph API standards with zero browser bots."
              align="center"
            />

            <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature, index) => (
                <Reveal key={feature.title} delay={(index % 3) * 0.05}>
                  <article className="glass-card h-full p-6 transition-all duration-300 hover:-translate-y-1">
                    <span className="grid size-10 place-items-center rounded-xl border border-line bg-surface-2 text-signal">
                      <feature.icon className="size-5" strokeWidth={1.9} aria-hidden />
                    </span>
                    <h3 className="mt-4 text-[15px] font-bold text-ink">{feature.title}</h3>
                    <p className="mt-2 text-[13px] leading-relaxed text-ink-3">
                      {feature.body}
                    </p>
                  </article>
                </Reveal>
              ))}
            </div>
          </Container>
        </section>

        {/* 8. Savings Calculator vs ManyChat's Growth Tax */}
        <section className="border-t border-line/70 py-20 lg:py-28">
          <Container>
            <SavingsCalculator />
          </Container>
        </section>

        {/* 9. Transparent Flat Pricing Plans */}
        <section id="pricing" className="border-t border-line/70 py-20 lg:py-28">
          <Container>
            <SectionHead
              title="Priced for real creators. Not per contact."
              sub="Zero contact taxes. Zero surprise overages. Upgrade only when your business scales."
              align="center"
            />

            <div className="mt-14 grid gap-6 lg:grid-cols-3">
              {PLANS.map((plan, index) => (
                <Reveal key={plan.name} delay={index * 0.06}>
                  <article
                    className={cn(
                      "relative flex h-full flex-col rounded-3xl border p-7 transition-all duration-300",
                      plan.highlighted
                        ? "border-signal/50 bg-surface shadow-2xl scale-[1.02]"
                        : "border-line bg-surface/50 hover:border-line-strong"
                    )}
                  >
                    {plan.highlighted && (
                      <span className="absolute -top-3 left-7 rounded-full bg-signal px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-white shadow-md">
                        Most Popular
                      </span>
                    )}

                    <p className="text-[14px] font-bold text-ink">{plan.name}</p>
                    <p className="mt-3 flex items-baseline gap-1.5">
                      <span className="font-mono text-4xl font-extrabold text-ink">
                        {plan.price}
                      </span>
                      <span className="text-[13px] font-semibold text-ink-3">/ {plan.cadence}</span>
                    </p>
                    <p className="mt-2 text-[13px] text-ink-2 leading-relaxed">
                      {plan.blurb}
                    </p>

                    <div className="my-6 h-px w-full bg-line" />

                    <ul className="flex-1 space-y-2.5">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2.5 text-[13px] text-ink-2">
                          <Check className="mt-0.5 size-4 shrink-0 text-ok" strokeWidth={2.5} />
                          <span>{feature}</span>
                        </li>
                      ))}
                      {plan.missing.map((feature) => (
                        <li key={feature} className="flex items-start gap-2.5 text-[13px] text-ink-3/70">
                          <X className="mt-0.5 size-4 shrink-0 text-ink-3/50" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      variant={plan.highlighted ? "signal" : "outline"}
                      className={cn(
                        "mt-8 w-full h-11 text-[13.5px] font-bold",
                        plan.highlighted && "obsidian"
                      )}
                      onClick={() => go("/login")}
                    >
                      {plan.cta}
                    </Button>
                  </article>
                </Reveal>
              ))}
            </div>

            <p className="mt-6 text-center text-[12.5px] text-ink-3">
              UPI, Credit/Debit cards & Net Banking accepted in India. Automated GST invoices provided.
            </p>
          </Container>
        </section>

        {/* 10. FAQ Accordion */}
        <section id="faq" className="border-t border-line/70 py-20 lg:py-28 bg-surface/30">
          <Container className="max-w-3xl">
            <SectionHead title="Frequently Asked Questions" sub="Everything you need to know about RELO AI." align="center" />

            <div className="mt-12 divide-y divide-line rounded-3xl border border-line bg-surface/70 shadow-lg backdrop-blur-xl">
              {FAQS.map((item) => (
                <details key={item.q} className="group px-6 py-5 cursor-pointer">
                  <summary className="flex list-none items-center justify-between gap-4 text-[14.5px] font-bold text-ink marker:hidden">
                    <span>{item.q}</span>
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-surface-2 text-ink-3 transition-transform duration-200 group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="mt-3 text-[13.5px] leading-relaxed text-ink-2">
                    {item.a}
                  </p>
                </details>
              ))}
            </div>
          </Container>
        </section>

        {/* 11. Footer Directory & The Creator Collective CTA Banner */}
        <FooterDirectory
          onStartFree={() => go("/login")}
          onNavigate={(path) => go(path)}
        />
      </main>
    </div>
  );
}
