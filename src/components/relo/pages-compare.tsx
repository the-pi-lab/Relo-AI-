"use client";

import React, { useEffect, useState } from "react";
import { ArrowRight, Check, Sparkles, X, ShieldCheck, Zap, ArrowLeft, Star, Heart } from "lucide-react";
import { Button, Container, Logo } from "./chrome";
import { ThemeToggle } from "@/lib/relo/theme";
import { LiquidBackdrop } from "./ambient";
import { Reveal } from "./motion";

interface CompareProps {
  competitor: string;
  navigate: (to: string) => void;
}

interface CompetitorData {
  name: string;
  tagline: string;
  pricingTax: string;
  pricingTaxSub: string;
  verdict: string;
  reloAdvantage: string;
  switchTime: string;
}

const COMPETITORS: Record<string, CompetitorData> = {
  manychat: {
    name: "ManyChat",
    tagline: "Stop paying the 'Contact Tax'. Switch to ₹199/mo flat unlimited.",
    pricingTax: "$15/mo base + $25/mo per 5K contacts",
    pricingTaxSub: "At 50,000 subscribers, ManyChat bills ~₹12,500/month. RELO is ₹199.",
    verdict: "ManyChat penalizes you for going viral by charging more as your audience grows. RELO gives you unlimited DMs and contacts for one flat Indian-creator friendly fee.",
    reloAdvantage: "No subscriber penalties, native UPI/Razorpay integration, and dedicated Indian edge servers for instant DM delivery.",
    switchTime: "90 seconds (1-click template import)",
  },
  linkdm: {
    name: "LinkDM",
    tagline: "Enterprise reliability at 1/5th of the price.",
    pricingTax: "$29 to $99/month for basic limits",
    pricingTaxSub: "Strict monthly DM caps and expensive add-on tiers.",
    verdict: "LinkDM offers solid Instagram automation but at steep dollar pricing without integrated bio links or AI product catalogs. RELO gives you the full creator monetization stack.",
    reloAdvantage: "Built-in 24/7 AI FAQ catalog, drag-and-drop Flow Canvas, and integrated Link-in-Bio builder.",
    switchTime: "2 minutes",
  },
  chatfuel: {
    name: "Chatfuel",
    tagline: "Modern Instagram Graph API v21 without legacy complexity.",
    pricingTax: "$14.99/mo base + tiered usage billing",
    pricingTaxSub: "Complex interface originally built for Facebook Messenger bots.",
    verdict: "Chatfuel was designed a decade ago for Messenger. RELO is built from the ground up in 2026 for Instagram Reels, Carousels, and modern Creator-first commerce.",
    reloAdvantage: "Instagram-native UI, human-paced sending anti-spam algorithms, and 1-click CSV audience export.",
    switchTime: "2 minutes",
  },
  linktodm: {
    name: "LinktoDM",
    tagline: "More power, transparent billing, and zero artificial limits.",
    pricingTax: "Expensive per-account pricing tiers",
    pricingTaxSub: "Restricted feature sets on lower tier plans.",
    verdict: "Why compromise on features when RELO gives you unlimited keyword triggers, automated story replies, and unlimited lead exports on every plan?",
    reloAdvantage: "Visual Flow Canvas, multi-condition branches, and real edge telemetry.",
    switchTime: "1 minute",
  },
  superprofile: {
    name: "SuperProfile",
    tagline: "Full-funnel DM automation that actually drives conversions.",
    pricingTax: "High commission on sales + monthly subscription",
    pricingTaxSub: "Takes a percentage of creator product transactions.",
    verdict: "SuperProfile takes cuts from your earnings. RELO connects directly to your own Razorpay/Stripe keys with 0% platform transaction fees.",
    reloAdvantage: "0% commission on your digital sales + automated Instagram DM delivery on payment completion.",
    switchTime: "2 minutes",
  },
  instantdm: {
    name: "InstantDM",
    tagline: "Faster delivery, official Meta compliance, and higher deliverability.",
    pricingTax: "Tiered pricing with restrictive DM velocity limits",
    pricingTaxSub: "Basic reply templates without dynamic anti-spam jitter.",
    verdict: "RELO's proprietary Anti-Spam Human Pacing protects your Instagram account with randomized 30-90s delays and manual override detection.",
    reloAdvantage: "Meta-certified Graph API compliance, 99.98% delivery success, and localized rupee billing.",
    switchTime: "90 seconds",
  },
};

const COMPARISON_ROWS = [
  {
    feature: "Pricing Model",
    relo: "Flat ₹199/month (Unlimited)",
    comp: "Tiered / Subscriber Tax ($15–$150+/mo)",
    reloWin: true,
  },
  {
    feature: "Per-Contact Subscriber Fee",
    relo: "₹0 (Never charged for your growth)",
    comp: "Up to ₹10,000+/mo as list expands",
    reloWin: true,
  },
  {
    feature: "Official Meta Graph API v21",
    relo: "Verified Meta Tech Provider",
    comp: "Yes (Standard API access)",
    reloWin: true,
  },
  {
    feature: "Anti-Spam Human Pacing (30–90s)",
    relo: "Dynamic jitter + manual pause safeguard",
    comp: "Instant blast (Higher shadowban risk)",
    reloWin: true,
  },
  {
    feature: "Integrated Link-in-Bio Builder",
    relo: "Included free with analytics",
    comp: "Requires separate tool (Linktree, etc.)",
    reloWin: true,
  },
  {
    feature: "24/7 AI FAQ Catalog Answers",
    relo: "Auto-replies from your store offers",
    comp: "Extra $30–$50/mo add-on",
    reloWin: true,
  },
  {
    feature: "Platform Transaction Cut",
    relo: "0% (Direct to your Razorpay/Stripe)",
    comp: "5%–10% on creator checkouts",
    reloWin: true,
  },
  {
    feature: "1-Click CSV Lead Export",
    relo: "Unlimited rows & full timestamps",
    comp: "Limited or gated on Pro tiers",
    reloWin: true,
  },
  {
    feature: "Localized Rupee (INR) Invoicing & GST",
    relo: "Instant GST invoices & UPI billing",
    comp: "USD only with foreign transaction fees",
    reloWin: true,
  },
];

export function ComparisonPage({ competitor, navigate }: CompareProps) {
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [competitor]);

  const slug = competitor.toLowerCase().replace(/^vs-?/, "").trim();
  const data = COMPETITORS[slug] ?? COMPETITORS["manychat"];

  return (
    <div className="relative min-h-screen text-ink bg-canvas">
      <LiquidBackdrop variant="hero" grid />

      {/* Top Header */}
      <header className="sticky top-0 z-50 border-b border-line/60 bg-canvas/80 backdrop-blur-xl">
        <Container className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo onClick={() => navigate("/")} />
            <span className="caption hidden sm:block border-l border-line pl-3 text-ink-3">
              Compare
            </span>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => navigate("/")}
              className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-2 hover:text-ink transition-colors mr-2"
            >
              <ArrowLeft className="size-3.5" />
              <span>Back home</span>
            </button>
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="obsidian h-9 px-4 rounded-xl text-[12.5px] font-bold shadow-md transition-transform hover:-translate-y-0.5 inline-flex items-center gap-1.5"
            >
              <span>Switch to RELO</span>
              <ArrowRight className="size-3.5" />
            </button>
          </div>
        </Container>
      </header>

      {/* Hero Section */}
      <section className="relative px-4 sm:px-6 lg:px-8 pt-14 pb-16 text-center">
        <Container className="max-w-4xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-signal/25 bg-signal-wash px-3.5 py-1 text-[12px] font-bold text-signal shadow-sm">
            <Sparkles className="size-3.5" />
            <span>RELO vs {data.name} Breakdown</span>
          </div>

          <h1 className="mt-5 text-4xl sm:text-5xl md:text-6xl font-black tracking-[-0.035em] text-ink leading-[1.1]">
            RELO vs {data.name}
          </h1>

          <p className="mt-4 text-xl sm:text-2xl font-bold bg-gradient-to-r from-signal via-[#BC64FF] to-[#E22295] bg-clip-text text-transparent">
            {data.tagline}
          </p>

          <p className="mt-4 text-base sm:text-lg leading-relaxed text-ink-2 max-w-2xl mx-auto">
            {data.verdict}
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="obsidian h-12 px-7 text-[15px] font-bold rounded-xl shadow-xl transition-transform hover:-translate-y-0.5 inline-flex items-center gap-2"
            >
              <span>Start Free (Migrate in {data.switchTime})</span>
              <ArrowRight className="size-4" />
            </button>
            <a
              href="#matrix"
              className="h-12 px-6 rounded-xl border border-line bg-surface/80 text-[14px] font-semibold text-ink inline-flex items-center justify-center hover:bg-surface-2 transition-colors"
            >
              View Full Feature Matrix
            </a>
          </div>

          {/* Savings Callout Card */}
          <div className="mt-12 rounded-3xl border border-signal/30 bg-gradient-to-br from-signal-wash/80 via-surface to-surface p-6 sm:p-8 text-left shadow-xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div>
                <span className="text-[11.5px] font-bold uppercase tracking-wider text-signal font-mono">
                  Why Creators Switch
                </span>
                <h3 className="text-xl sm:text-2xl font-black tracking-tight text-ink mt-1">
                  The {data.name} Growth Penalty
                </h3>
                <p className="mt-2 text-[13.5px] text-ink-2 leading-relaxed">
                  With {data.name}, your bill increases every time your Reels go viral:
                </p>
                <div className="mt-3 rounded-xl bg-bad-wash border border-bad/20 p-3.5 text-bad text-[13px] font-medium">
                  ❌ {data.name}: {data.pricingTax}
                  <p className="text-[11.5px] text-ink-3 mt-1">{data.pricingTaxSub}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-ok/30 bg-ok-wash/40 p-5 text-ink">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-ok font-mono">
                  <Check className="size-3.5" /> The RELO Guarantee
                </span>
                <p className="text-2xl sm:text-3xl font-black text-ink mt-2">
                  ₹199 <span className="text-sm font-normal text-ink-3">/ month flat</span>
                </p>
                <p className="mt-2 text-[13px] text-ink-2 font-medium">
                  Unlimited DMs. Unlimited contacts. Unlimited triggers. You keep 100% of your growth dividends.
                </p>
                <div className="mt-4 pt-3 border-t border-line/60 flex items-center justify-between text-[11.5px] text-ink-3">
                  <span>Switch time: {data.switchTime}</span>
                  <span className="font-bold text-signal">Zero downtime</span>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Side-by-Side Comparison Matrix */}
      <section id="matrix" className="py-16 border-t border-line bg-surface/40">
        <Container className="max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
              Side-by-Side Feature Comparison
            </h2>
            <p className="mt-3 text-base text-ink-2">
              Everything you get with RELO compared directly to {data.name}.
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-xl">
            <div className="grid grid-cols-12 bg-surface-2 border-b border-line py-4 px-6 text-[13px] font-black uppercase tracking-wider text-ink">
              <div className="col-span-6 sm:col-span-6">Feature / Capability</div>
              <div className="col-span-3 sm:col-span-3 text-center text-signal font-extrabold">RELO AI</div>
              <div className="col-span-3 sm:col-span-3 text-center text-ink-3">{data.name}</div>
            </div>

            <div className="divide-y divide-line">
              {COMPARISON_ROWS.map((row, idx) => (
                <div
                  key={row.feature}
                  className={`grid grid-cols-12 py-4 px-6 items-center text-[13.5px] transition-colors ${
                    idx % 2 === 0 ? "bg-surface" : "bg-surface-2/40"
                  }`}
                >
                  <div className="col-span-6 font-semibold text-ink flex items-center gap-2">
                    <span className="size-1.5 rounded-full bg-signal" />
                    {row.feature}
                  </div>
                  <div className="col-span-3 text-center font-bold text-ok flex flex-col items-center justify-center">
                    <span className="inline-flex items-center gap-1 text-[12.5px] bg-ok-wash px-2 py-0.5 rounded-lg border border-ok/20">
                      <Check className="size-3.5" />
                      {row.relo}
                    </span>
                  </div>
                  <div className="col-span-3 text-center text-ink-3 text-[12.5px] font-medium">
                    {row.comp}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Migration Steps */}
          <div className="mt-16 text-center">
            <h3 className="text-2xl font-bold text-ink">
              How to switch from {data.name} to RELO in 3 steps
            </h3>
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              <div className="rounded-2xl border border-line bg-surface p-6">
                <span className="grid size-8 place-items-center rounded-xl bg-signal text-white font-black text-sm">
                  1
                </span>
                <h4 className="mt-4 font-bold text-ink text-base">Connect your Instagram</h4>
                <p className="mt-2 text-[13px] text-ink-2 leading-relaxed">
                  Log in via official Meta OAuth. No password sharing, 100% compliant.
                </p>
              </div>

              <div className="rounded-2xl border border-line bg-surface p-6">
                <span className="grid size-8 place-items-center rounded-xl bg-signal text-white font-black text-sm">
                  2
                </span>
                <h4 className="mt-4 font-bold text-ink text-base">Pick your trigger keyword</h4>
                <p className="mt-2 text-[13px] text-ink-2 leading-relaxed">
                  Select your Reel, type your keyword (e.g. &quot;LINK&quot; or &quot;TRIAL&quot;), and draft your DM reply.
                </p>
              </div>

              <div className="rounded-2xl border border-line bg-surface p-6">
                <span className="grid size-8 place-items-center rounded-xl bg-signal text-white font-black text-sm">
                  3
                </span>
                <h4 className="mt-4 font-bold text-ink text-base">Turn on Human Pacing</h4>
                <p className="mt-2 text-[13px] text-ink-2 leading-relaxed">
                  Activate RELO and cancel your {data.name} subscription. Keep all your savings.
                </p>
              </div>
            </div>
          </div>

          {/* CTA Box */}
          <div className="mt-16 rounded-3xl border border-signal/25 bg-gradient-to-r from-signal/10 via-surface to-signal/10 p-8 sm:p-12 text-center shadow-2xl">
            <h3 className="text-3xl font-extrabold text-ink tracking-tight">
              Ready to stop overpaying for DMs?
            </h3>
            <p className="mt-3 text-base text-ink-2 max-w-xl mx-auto">
              Join 60,000+ creators who made the switch to RELO. Get started for free today.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="obsidian h-12 px-7 text-[15px] font-bold rounded-xl shadow-xl transition-transform hover:-translate-y-0.5 inline-flex items-center gap-2"
              >
                <span>Claim Free Plan Forever</span>
                <ArrowRight className="size-4" />
              </button>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
