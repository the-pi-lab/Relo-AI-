"use client";

import React, { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Heart, Sparkles, Star, Users, Briefcase, DollarSign, ShieldCheck, Zap } from "lucide-react";
import { Button, Container, Logo } from "./chrome";
import { LiquidBackdrop } from "./ambient";
import { Reveal } from "./motion";

interface BasePageProps {
  navigate: (to: string) => void;
}

function PageHeader({ title, navigate }: { title: string; navigate: (to: string) => void }) {
  return (
    <header className="sticky top-0 z-50 border-b border-line/60 bg-canvas/80 backdrop-blur-xl">
      <Container className="flex h-16 items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo onClick={() => navigate("/")} />
          <span className="caption hidden sm:block border-l border-line pl-3 text-ink-3">
            {title}
          </span>
        </div>

        <div className="flex items-center gap-3">
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
            <span>Get started</span>
            <ArrowRight className="size-3.5" />
          </button>
        </div>
      </Container>
    </header>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   1. ABOUT RELO
   ═══════════════════════════════════════════════════════════════════════════ */

export function AboutPage({ navigate }: BasePageProps) {
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);

  return (
    <div className="relative min-h-screen text-ink bg-canvas">
      <LiquidBackdrop variant="hero" grid />
      <PageHeader title="About RELO" navigate={navigate} />

      <section className="relative px-4 sm:px-6 lg:px-8 pt-16 pb-20 text-center">
        <Container className="max-w-4xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-signal/25 bg-signal-wash px-3.5 py-1 text-[12px] font-bold text-signal">
            <Sparkles className="size-3.5" />
            <span>Our Mission & Story</span>
          </div>

          <h1 className="mt-5 text-4xl sm:text-6xl font-black tracking-tight text-ink leading-tight">
            We believe creators shouldn&apos;t be penalized for going viral.
          </h1>

          <p className="mt-6 text-lg sm:text-xl leading-relaxed text-ink-2 max-w-2xl mx-auto">
            RELO was built by <strong>The Pi Lab</strong> to give creators and modern brands a world-class Instagram DM Automation OS without predatory per-contact pricing.
          </p>

          <div className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-6 text-left">
            <div className="rounded-2xl border border-line bg-surface p-5">
              <p className="text-3xl font-black text-signal">60K+</p>
              <p className="text-[12px] text-ink-3 mt-1 font-semibold uppercase">Active Creators</p>
            </div>
            <div className="rounded-2xl border border-line bg-surface p-5">
              <p className="text-3xl font-black text-signal">4.8M+</p>
              <p className="text-[12px] text-ink-3 mt-1 font-semibold uppercase">DMs Automated</p>
            </div>
            <div className="rounded-2xl border border-line bg-surface p-5">
              <p className="text-3xl font-black text-signal">99.98%</p>
              <p className="text-[12px] text-ink-3 mt-1 font-semibold uppercase">Edge Uptime</p>
            </div>
            <div className="rounded-2xl border border-line bg-surface p-5">
              <p className="text-3xl font-black text-signal">₹199</p>
              <p className="text-[12px] text-ink-3 mt-1 font-semibold uppercase">Flat Monthly Price</p>
            </div>
          </div>

          {/* 4 Core Principles */}
          <div className="mt-16 text-left">
            <h2 className="text-2xl font-bold text-ink mb-6">Our 4 Core Principles</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-2xl border border-line bg-surface p-6">
                <span className="text-signal font-bold text-sm">01 / The Zero Contact Tax</span>
                <h3 className="mt-2 text-lg font-bold text-ink">Grow without fear</h3>
                <p className="mt-2 text-[13.5px] text-ink-2 leading-relaxed">
                  Legacy platforms charge you more money every time you gain 5,000 subscribers. We charge a flat ₹199/month regardless of whether you have 100 or 100,000 followers.
                </p>
              </div>

              <div className="rounded-2xl border border-line bg-surface p-6">
                <span className="text-signal font-bold text-sm">02 / Human-First Automation</span>
                <h3 className="mt-2 text-lg font-bold text-ink">Account safety above all</h3>
                <p className="mt-2 text-[13.5px] text-ink-2 leading-relaxed">
                  Our proprietary anti-spam pacing introduces randomized 30-90 second jitter and pauses automatically whenever you chat manually, completely protecting you from Instagram restrictions.
                </p>
              </div>

              <div className="rounded-2xl border border-line bg-surface p-6">
                <span className="text-signal font-bold text-sm">03 / Edge Performance</span>
                <h3 className="mt-2 text-lg font-bold text-ink">Built on Cloudflare Workers</h3>
                <p className="mt-2 text-[13.5px] text-ink-2 leading-relaxed">
                  Every webhook and DM trigger executes in under 50ms at edge data centers across Mumbai, Chennai, and globally. No lag, no missed triggers.
                </p>
              </div>

              <div className="rounded-2xl border border-line bg-surface p-6">
                <span className="text-signal font-bold text-sm">04 / Meta Graph API Compliant</span>
                <h3 className="mt-2 text-lg font-bold text-ink">Strictly official APIs</h3>
                <p className="mt-2 text-[13.5px] text-ink-2 leading-relaxed">
                  We never scrape screens or ask for your Instagram password. All authentication is handled through Meta&apos;s official OAuth and Graph API v21.
                </p>
              </div>
            </div>
          </div>

          {/* Team statement */}
          <div className="mt-16 rounded-3xl border border-line bg-surface p-8 sm:p-10 text-left">
            <h3 className="text-xl font-bold text-ink">Built by The Pi Lab</h3>
            <p className="mt-3 text-[14px] text-ink-2 leading-relaxed">
              We are an engineering studio dedicated to building high-performance creator infrastructure. From automated commerce to real-time telemetry, we craft software designed to outlast and outperform legacy marketing tools.
            </p>
            <div className="mt-6 pt-6 border-t border-line flex items-center justify-between">
              <span className="text-[13px] text-ink-3">Headquartered in India · Serving Creators Worldwide</span>
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="obsidian h-10 px-5 text-[13px] font-bold rounded-xl inline-flex items-center gap-1.5"
              >
                <span>Join RELO Today</span>
                <ArrowRight className="size-3.5" />
              </button>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   2. CAREERS AT RELO
   ═══════════════════════════════════════════════════════════════════════════ */

export function CareersPage({ navigate }: BasePageProps) {
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);

  const ROLES = [
    {
      title: "Senior Full-Stack Engineer (Edge & Cloudflare)",
      team: "Core Platform",
      location: "Remote (India)",
      type: "Full-Time",
      desc: "Architect low-latency webhook ingestion pipelines handling 5,000+ RPS on Cloudflare Workers, Next.js 14, and Cloudflare D1/Postgres.",
    },
    {
      title: "AI Systems & Anti-Spam Engineer",
      team: "Intelligence",
      location: "Remote (India)",
      type: "Full-Time",
      desc: "Train and optimize local LLM models for automated 24/7 product catalog answering and real-time comment tone analysis.",
    },
    {
      title: "Creator Ecosystem & Community Lead",
      team: "Growth",
      location: "Bengaluru / Mumbai / Remote",
      type: "Full-Time",
      desc: "Work directly with top 100K+ Instagram creators and brands, establishing automated commerce playbooks and case studies.",
    },
    {
      title: "Lead UI/UX & Motion Designer",
      team: "Product Design",
      location: "Remote",
      type: "Full-Time",
      desc: "Craft world-class editorial interfaces, micro-interactions, and visual canvas blueprints that rival Figma and Linear.",
    },
  ];

  return (
    <div className="relative min-h-screen text-ink bg-canvas">
      <LiquidBackdrop variant="hero" grid />
      <PageHeader title="Careers" navigate={navigate} />

      <section className="relative px-4 sm:px-6 lg:px-8 pt-16 pb-20 text-center">
        <Container className="max-w-4xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-signal/25 bg-signal-wash px-3.5 py-1 text-[12px] font-bold text-signal">
            <Briefcase className="size-3.5" />
            <span>Join Our Team</span>
          </div>

          <h1 className="mt-5 text-4xl sm:text-6xl font-black tracking-tight text-ink">
            Build the Operating System for Modern Creators
          </h1>

          <p className="mt-5 text-base sm:text-lg leading-relaxed text-ink-2 max-w-2xl mx-auto">
            We are a small, hyper-focused team of engineers and designers building the future of social commerce. Competitive compensation, remote-first, and zero red tape.
          </p>

          <div className="mt-14 space-y-4 text-left">
            {ROLES.map((role) => (
              <div
                key={role.title}
                className="rounded-2xl border border-line bg-surface p-6 shadow-sm transition-all hover:border-signal/50 hover:shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2 text-[11.5px] font-bold uppercase tracking-wider text-signal font-mono">
                    <span>{role.team}</span>
                    <span>·</span>
                    <span className="text-ink-3">{role.location}</span>
                  </div>
                  <h3 className="text-lg font-bold text-ink mt-1">{role.title}</h3>
                  <p className="text-[13px] text-ink-2 mt-1.5 max-w-xl">{role.desc}</p>
                </div>

                <a
                  href={`mailto:careers@thepilab.in?subject=Application: ${encodeURIComponent(role.title)}`}
                  className="obsidian h-10 px-5 text-[13px] font-bold rounded-xl inline-flex items-center justify-center gap-1.5 shrink-0 self-start md:self-center"
                >
                  <span>Apply Now</span>
                  <ArrowRight className="size-3.5" />
                </a>
              </div>
            ))}
          </div>

          <div className="mt-14 rounded-2xl border border-line bg-surface/50 p-6 text-center">
            <p className="text-[13.5px] text-ink-2">
              Don&apos;t see an exact match? We are always looking for exceptional engineers and growth hackers. 
              Email your portfolio to{" "}
              <a href="mailto:careers@thepilab.in" className="text-signal font-bold underline">
                careers@thepilab.in
              </a>.
            </p>
          </div>
        </Container>
      </section>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   3. AFFILIATE PROGRAM (30% Lifetime)
   ═══════════════════════════════════════════════════════════════════════════ */

export function AffiliatesPage({ navigate }: BasePageProps) {
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);

  const [referrals, setReferrals] = useState(50);
  const monthlyEarnings = Math.round(referrals * 199 * 0.3);
  const yearlyEarnings = monthlyEarnings * 12;

  return (
    <div className="relative min-h-screen text-ink bg-canvas">
      <LiquidBackdrop variant="hero" grid />
      <PageHeader title="Affiliate Program" navigate={navigate} />

      <section className="relative px-4 sm:px-6 lg:px-8 pt-16 pb-20 text-center">
        <Container className="max-w-4xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-signal/25 bg-signal-wash px-3.5 py-1 text-[12px] font-bold text-signal">
            <DollarSign className="size-3.5" />
            <span>30% Recurring Lifetime Commission</span>
          </div>

          <h1 className="mt-5 text-4xl sm:text-6xl font-black tracking-tight text-ink">
            Earn Passive Income Recommending RELO
          </h1>

          <p className="mt-5 text-base sm:text-lg leading-relaxed text-ink-2 max-w-2xl mx-auto">
            Introduce fellow creators, agencies, and businesses to RELO. Earn a 30% cut on every single monthly subscription they pay, for as long as they stay subscribed.
          </p>

          {/* Interactive Earnings Calculator */}
          <div className="mt-12 rounded-3xl border border-signal/30 bg-surface p-8 sm:p-12 shadow-2xl text-left">
            <div className="text-center mb-8">
              <span className="text-[11.5px] font-bold font-mono uppercase tracking-wider text-signal">
                Interactive Earnings Calculator
              </span>
              <h3 className="text-2xl font-black text-ink mt-1">
                How much can you earn?
              </h3>
            </div>

            <div className="max-w-xl mx-auto">
              <div className="flex items-center justify-between text-sm font-bold text-ink">
                <span>Active Creators Referred:</span>
                <span className="text-2xl text-signal font-black">{referrals}</span>
              </div>

              <input
                type="range"
                min={5}
                max={500}
                step={5}
                value={referrals}
                onChange={(e) => setReferrals(Number(e.target.value))}
                className="mt-4 w-full accent-signal cursor-pointer"
              />

              <div className="mt-8 grid grid-cols-2 gap-4 text-center">
                <div className="rounded-2xl border border-line bg-surface-2 p-5">
                  <p className="text-[12px] font-bold text-ink-3 uppercase">Monthly Recurring</p>
                  <p className="text-3xl sm:text-4xl font-black text-signal mt-1">₹{monthlyEarnings.toLocaleString()}</p>
                  <p className="text-[11px] text-ink-3 mt-1">Paid on 1st of every month</p>
                </div>

                <div className="rounded-2xl border border-signal/30 bg-signal-wash p-5">
                  <p className="text-[12px] font-bold text-signal uppercase">Annual Projection</p>
                  <p className="text-3xl sm:text-4xl font-black text-signal mt-1">₹{yearlyEarnings.toLocaleString()}</p>
                  <p className="text-[11px] text-signal font-semibold mt-1">100% passive dividend</p>
                </div>
              </div>

              <div className="mt-8 flex justify-center">
                <a
                  href="mailto:affiliates@thepilab.in?subject=Apply for RELO Affiliate Program"
                  className="obsidian h-12 px-8 text-[15px] font-bold rounded-xl shadow-xl transition-transform hover:-translate-y-0.5 inline-flex items-center gap-2"
                >
                  <span>Apply for Affiliate Link</span>
                  <ArrowRight className="size-4" />
                </a>
              </div>
            </div>
          </div>

          {/* Benefits Grid */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <div className="rounded-2xl border border-line bg-surface p-6">
              <span className="grid size-8 place-items-center rounded-xl bg-signal text-white font-black text-xs">
                30D
              </span>
              <h4 className="mt-4 font-bold text-ink text-base">30-Day Cookie Window</h4>
              <p className="mt-2 text-[13px] text-ink-2 leading-relaxed">
                If a creator visits through your link and signs up anytime within 30 days, you get credited.
              </p>
            </div>

            <div className="rounded-2xl border border-line bg-surface p-6">
              <span className="grid size-8 place-items-center rounded-xl bg-signal text-white font-black text-xs">
                UPI
              </span>
              <h4 className="mt-4 font-bold text-ink text-base">Direct UPI / Bank Payouts</h4>
              <p className="mt-2 text-[13px] text-ink-2 leading-relaxed">
                No PayPal fees or foreign exchange losses. Instant monthly settlements directly to your Indian bank or UPI.
              </p>
            </div>

            <div className="rounded-2xl border border-line bg-surface p-6">
              <span className="grid size-8 place-items-center rounded-xl bg-signal text-white font-black text-xs">
                HQ
              </span>
              <h4 className="mt-4 font-bold text-ink text-base">Ready Marketing Kit</h4>
              <p className="mt-2 text-[13px] text-ink-2 leading-relaxed">
                Get access to high-converting Reel templates, comparison carousels, and copy breakdowns.
              </p>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   4. DEDICATED PRICING PAGE (₹199/mo)
   ═══════════════════════════════════════════════════════════════════════════ */

export function PricingPage({ navigate }: BasePageProps) {
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);

  return (
    <div className="relative min-h-screen text-ink bg-canvas">
      <LiquidBackdrop variant="hero" grid />
      <PageHeader title="Pricing" navigate={navigate} />

      <section className="relative px-4 sm:px-6 lg:px-8 pt-16 pb-20 text-center">
        <Container className="max-w-5xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-signal/25 bg-signal-wash px-3.5 py-1 text-[12px] font-bold text-signal">
            <Sparkles className="size-3.5" />
            <span>Honest Flat-Rate Pricing</span>
          </div>

          <h1 className="mt-5 text-4xl sm:text-6xl font-black tracking-tight text-ink">
            No subscriber tax. Just flat ₹199/month.
          </h1>

          <p className="mt-4 text-base sm:text-lg text-ink-2 max-w-xl mx-auto">
            Choose the plan that fits your ambition. Upgrade, downgrade, or cancel anytime with one click.
          </p>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            {/* Tier 1 */}
            <div className="rounded-3xl border border-line bg-surface p-8 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-bold text-ink">Free Starter</h3>
                <p className="text-[13px] text-ink-3 mt-1">Test one Reel end to end.</p>
                <p className="mt-5 text-4xl font-black text-ink">₹0</p>
                <p className="text-[11.5px] text-ink-3">forever free</p>

                <ul className="mt-6 space-y-3 text-[13px] text-ink-2">
                  <li className="flex items-center gap-2"><Check className="size-4 text-ok" /> 1 Instagram account</li>
                  <li className="flex items-center gap-2"><Check className="size-4 text-ok" /> 1 Active Reel automation</li>
                  <li className="flex items-center gap-2"><Check className="size-4 text-ok" /> Up to 50 DMs / month</li>
                  <li className="flex items-center gap-2"><Check className="size-4 text-ok" /> Official Meta OAuth</li>
                </ul>
              </div>

              <button
                type="button"
                onClick={() => navigate("/login")}
                className="mt-8 h-11 w-full rounded-xl border border-line bg-surface-2 font-bold text-[13.5px] hover:bg-surface-3 transition-colors"
              >
                Start Free
              </button>
            </div>

            {/* Tier 2: Highlighted Pro */}
            <div className="rounded-3xl border-2 border-signal bg-surface p-8 shadow-2xl relative flex flex-col justify-between">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-signal px-3.5 py-0.5 text-[11px] font-black uppercase tracking-wider text-white">
                Most Popular
              </span>

              <div>
                <h3 className="text-xl font-bold text-ink">Creator Pro</h3>
                <p className="text-[13px] text-ink-3 mt-1">Unlimited growth without caps.</p>
                <p className="mt-5 text-4xl font-black text-signal">₹199 <span className="text-sm font-normal text-ink-3">/mo</span></p>
                <p className="text-[11.5px] text-signal font-semibold">Unlimited DMs included</p>

                <ul className="mt-6 space-y-3 text-[13px] text-ink">
                  <li className="flex items-center gap-2 font-semibold"><Check className="size-4 text-ok" /> Unlimited Reels & Automations</li>
                  <li className="flex items-center gap-2 font-semibold"><Check className="size-4 text-ok" /> Unlimited DMs (Zero contact tax)</li>
                  <li className="flex items-center gap-2"><Check className="size-4 text-ok" /> Anti-Spam Human Pacing (30–90s)</li>
                  <li className="flex items-center gap-2"><Check className="size-4 text-ok" /> Integrated Link-in-Bio builder</li>
                  <li className="flex items-center gap-2"><Check className="size-4 text-ok" /> 24/7 AI FAQ catalog answers</li>
                  <li className="flex items-center gap-2"><Check className="size-4 text-ok" /> 1-Click CSV audience export</li>
                </ul>
              </div>

              <button
                type="button"
                onClick={() => navigate("/login")}
                className="mt-8 obsidian h-11 w-full rounded-xl font-bold text-[14px] shadow-lg transition-transform hover:scale-105"
              >
                Get Started with Pro →
              </button>
            </div>

            {/* Tier 3: Studio */}
            <div className="rounded-3xl border border-line bg-surface p-8 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-bold text-ink">Agency Studio</h3>
                <p className="text-[13px] text-ink-3 mt-1">Multi-account client scaling.</p>
                <p className="mt-5 text-4xl font-black text-ink">₹999 <span className="text-sm font-normal text-ink-3">/mo</span></p>
                <p className="text-[11.5px] text-ink-3">Up to 10 Instagram accounts</p>

                <ul className="mt-6 space-y-3 text-[13px] text-ink-2">
                  <li className="flex items-center gap-2"><Check className="size-4 text-ok" /> 10 Connected Creator Accounts</li>
                  <li className="flex items-center gap-2"><Check className="size-4 text-ok" /> Team member seats & roles</li>
                  <li className="flex items-center gap-2"><Check className="size-4 text-ok" /> White-label CSV reporting</li>
                  <li className="flex items-center gap-2"><Check className="size-4 text-ok" /> VIP WhatsApp priority support</li>
                </ul>
              </div>

              <button
                type="button"
                onClick={() => navigate("/login")}
                className="mt-8 h-11 w-full rounded-xl border border-line bg-surface-2 font-bold text-[13.5px] hover:bg-surface-3 transition-colors"
              >
                Contact Agency Sales
              </button>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
