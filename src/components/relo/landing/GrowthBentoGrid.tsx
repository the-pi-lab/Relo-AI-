"use client";

import React from "react";
import Image from "next/image";
import { ArrowUpRight, CheckCircle2, MessageCircle, MousePointerClick, Sparkles, TrendingUp, Zap } from "lucide-react";
import { Reveal } from "../motion";

export function GrowthBentoGrid() {
  return (
    <section className="relative border-t border-line/70 py-20 lg:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center">
          <Reveal>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-signal/25 bg-signal-wash px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-signal">
              <Sparkles className="size-3" /> Gains
            </span>
          </Reveal>

          <Reveal delay={0.06}>
            <h2 className="mt-4 text-3xl font-extrabold tracking-[-0.035em] text-ink sm:text-5xl">
              Supercharge your{" "}
              <span className="bg-gradient-to-r from-signal via-[#BC64FF] to-[#E22295] bg-clip-text text-transparent">
                growth
              </span>
            </h2>
          </Reveal>

          <Reveal delay={0.12}>
            <p className="mx-auto mt-4 max-w-xl text-base text-ink-2">
              Grow your following — and your bank account with automated engagement loops.
            </p>
          </Reveal>
        </div>

        {/* Bento Grid */}
        <div className="mt-14 grid gap-6 md:grid-cols-12">
          {/* Card 1: Top Wide Card (Increase Engagement by 10X) */}
          <div className="group relative overflow-hidden rounded-3xl border border-line bg-surface p-6 sm:p-10 shadow-[var(--sh-1)] transition-transform duration-300 hover:-translate-y-1 md:col-span-12">
            <div className="grid items-center gap-8 lg:grid-cols-12">
              <div className="lg:col-span-5">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1 text-[11.5px] font-bold text-ink">
                  <TrendingUp className="size-3.5 text-signal" />
                  Algorithm Multiplier
                </span>
                <h3 className="mt-4 text-2xl sm:text-3xl font-extrabold tracking-tight text-ink">
                  Increase Engagement <br />
                  <span className="text-signal">by 10X</span>
                </h3>
                <p className="mt-3 text-[14px] leading-relaxed text-ink-2">
                  Fuel curiosity and boost engagement with automated DMs. Drive your Reels to viral 
                  with every comment turned into an interactive conversation that Instagram&apos;s algorithm rewards.
                </p>
                <div className="mt-5 flex items-center gap-3">
                  <div className="rounded-xl border border-line bg-surface-2/60 px-3.5 py-2">
                    <p className="text-[11px] font-bold text-ink-3">AVG. COMMENT LIFT</p>
                    <p className="text-[20px] font-extrabold text-ink">+340%</p>
                  </div>
                  <div className="rounded-xl border border-line bg-surface-2/60 px-3.5 py-2">
                    <p className="text-[11px] font-bold text-ink-3">DM OPEN RATE</p>
                    <p className="text-[20px] font-extrabold text-signal">92.4%</p>
                  </div>
                </div>
              </div>

              {/* Rising Upward Growth Curve Graphic */}
              <div className="relative flex items-end justify-center lg:col-span-7">
                <div className="relative w-full aspect-[16/8] overflow-hidden rounded-2xl border border-line/70 bg-gradient-to-b from-surface-2/30 to-surface-2/80 p-4">
                  {/* Grid lines */}
                  <div className="absolute inset-0 grid grid-cols-6 grid-rows-3 opacity-20">
                    {Array.from({ length: 18 }).map((_, i) => (
                      <div key={i} className="border-b border-r border-line" />
                    ))}
                  </div>

                  {/* Upward Line Graphic */}
                  <svg viewBox="0 0 500 200" className="size-full overflow-visible" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="curveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#6A07E4" stopOpacity="0.3" />
                        <stop offset="60%" stopColor="#BC64FF" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#E22295" stopOpacity="1" />
                      </linearGradient>
                      <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#E22295" stopOpacity="0.18" />
                        <stop offset="100%" stopColor="#6A07E4" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    {/* Fill */}
                    <path
                      d="M0,170 Q150,160 250,110 T500,20 L500,200 L0,200 Z"
                      fill="url(#areaGradient)"
                    />
                    {/* Line */}
                    <path
                      d="M0,170 Q150,160 250,110 T500,20"
                      fill="none"
                      stroke="url(#curveGradient)"
                      strokeWidth="4"
                      strokeLinecap="round"
                    />
                    {/* Pulsing Target Dot */}
                    <circle cx="500" cy="20" r="6" fill="#E22295" />
                    <circle cx="500" cy="20" r="12" fill="#E22295" opacity="0.3" className="animate-ping" />
                  </svg>

                  {/* "after RELO" Tag */}
                  <div className="absolute right-6 top-8 rounded-xl border border-signal/30 bg-signal-wash px-3 py-1.5 backdrop-blur-md shadow-lg">
                    <p className="flex items-center gap-1.5 text-[11px] font-bold text-signal">
                      <Zap className="size-3 fill-current" /> after RELO
                    </p>
                    <p className="text-[13px] font-extrabold text-ink">10X Inbound Traffic</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Bottom Left (Maximise Link Clicks) */}
          <div className="group relative overflow-hidden rounded-3xl border border-line bg-surface p-6 sm:p-8 shadow-[var(--sh-1)] transition-transform duration-300 hover:-translate-y-1 md:col-span-6">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1 text-[11.5px] font-bold text-ink">
              <MousePointerClick className="size-3.5 text-signal" />
              Conversion Focus
            </span>
            <h3 className="mt-4 text-xl sm:text-2xl font-extrabold tracking-tight text-ink">
              Maximise Link Clicks
            </h3>
            <p className="mt-2 text-[13.5px] leading-relaxed text-ink-2">
              Stop relying on bio links that get lost. Instantly send clickable, trackable links directly 
              into their DM inbox, multiplying your conversion rates.
            </p>

            {/* Interactive Flow Diagram */}
            <div className="mt-6 rounded-2xl border border-line bg-surface-2/50 p-4 space-y-3">
              <div className="flex items-center justify-between rounded-xl border border-line bg-surface p-3 text-[12px] font-semibold text-ink">
                <span className="flex items-center gap-2">
                  <MessageCircle className="size-3.5 text-signal" />
                  When comment includes <span className="font-mono text-signal font-bold">&quot;Pack&quot;</span>
                </span>
                <span className="rounded bg-ok-wash px-2 py-0.5 text-[10px] font-bold text-ok">
                  Trigger
                </span>
              </div>

              <div className="mx-auto flex h-4 w-px bg-signal/60" />

              <div className="flex items-center justify-between rounded-xl border border-signal/30 bg-signal-wash p-3 text-[12px] font-bold text-signal">
                <span>Send DM with Tracked Link</span>
                <ArrowUpRight className="size-4" />
              </div>

              <div className="flex items-center justify-between pt-1 text-[11px] font-medium text-ink-3">
                <span>Link Click Tracking</span>
                <span className="font-bold text-ink">98.2% Deliverability</span>
              </div>
            </div>
          </div>

          {/* Card 3: Bottom Right (Answer Frequently Asked Questions with bento-effortless.jpg) */}
          <div className="group relative overflow-hidden rounded-3xl border border-line bg-surface p-6 sm:p-8 shadow-[var(--sh-1)] transition-transform duration-300 hover:-translate-y-1 md:col-span-6">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1 text-[11.5px] font-bold text-ink">
              <Sparkles className="size-3.5 text-signal" />
              24/7 Autopilot
            </span>
            <h3 className="mt-4 text-xl sm:text-2xl font-extrabold tracking-tight text-ink">
              Answer FAQs on Autopilot
            </h3>
            <p className="mt-2 text-[13.5px] leading-relaxed text-ink-2">
              Let 24/7 AI handle your most common product queries with instant responses while you relax.
            </p>

            {/* Creator Photo with Floating Q&A overlay */}
            <div className="relative mt-6 aspect-[16/10] w-full overflow-hidden rounded-2xl border border-line">
              <Image
                src="/images/relo/bento-effortless.jpg"
                alt="Creator relaxing while RELO AI handles customer questions"
                fill
                className="object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

              {/* Floating FAQ Dialog */}
              <div className="absolute bottom-3 left-3 right-3 space-y-1.5 text-white">
                <div className="rounded-xl border border-white/20 bg-black/70 p-2.5 backdrop-blur-md text-[11.5px]">
                  <p className="text-white/70 text-[10px] font-bold uppercase tracking-wider">Customer Query</p>
                  <p className="font-medium text-white/95">Do you ship worldwide? 🌍</p>
                </div>
                <div className="rounded-xl border border-signal/30 bg-signal/80 p-2.5 backdrop-blur-md text-[11.5px]">
                  <p className="text-white/70 text-[10px] font-bold uppercase tracking-wider">RELO Instant AI</p>
                  <p className="font-medium text-white">Yes! Free worldwide delivery on orders above ₹999 ✈️</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
