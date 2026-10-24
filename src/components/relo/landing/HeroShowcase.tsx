"use client";

import React from "react";
import Image from "next/image";
import { ArrowRight, Check, Heart, MessageCircle, Sparkles, Zap } from "lucide-react";
import { Button } from "../chrome";
import { Reveal } from "../motion";

interface HeroShowcaseProps {
  onStartFree: () => void;
  onSeeHowItWorks: () => void;
}

export function HeroShowcase({ onStartFree, onSeeHowItWorks }: HeroShowcaseProps) {
  return (
    <section className="relative overflow-hidden pt-12 pb-16 md:pt-18 md:pb-24">
      {/* Glow aura */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-10 -translate-x-1/2 size-[650px] rounded-full opacity-25 blur-3xl"
        style={{
          background: "radial-gradient(circle, var(--signal) 0%, rgba(106,7,228,0.2) 50%, transparent 75%)",
        }}
      />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 text-center">
        {/* Top Trust Capsule */}
        <Reveal>
          <div className="inline-flex items-center gap-2 rounded-full border border-signal/25 bg-signal-wash px-3.5 py-1 text-[12px] font-semibold text-signal shadow-[var(--sh-1)]">
            <Sparkles className="size-3.5 animate-pulse" />
            <span>The #1 Instagram DM Automation OS for Creators</span>
          </div>
        </Reveal>

        {/* Main Headline */}
        <Reveal delay={0.06}>
          <h1 className="mt-5 text-4xl font-extrabold tracking-[-0.04em] text-ink sm:text-6xl md:text-7xl lg:leading-[1.08]">
            Unlimited Free <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-signal via-[#9B42F5] to-[#E22295] bg-clip-text text-transparent">
              DM Automations
            </span>
          </h1>
        </Reveal>

        {/* Subtitle */}
        <Reveal delay={0.12}>
          <p className="mx-auto mt-5 max-w-2xl text-base sm:text-lg leading-relaxed text-ink-2">
            Fuel curiosity and boost engagement with instant automated DMs. Turn every Reel comment, 
            story reply, and question into a loyal customer and measurable sale.
          </p>
        </Reveal>

        {/* CTA Buttons */}
        <Reveal delay={0.18}>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
            <Button
              variant="signal"
              size="lg"
              onClick={onStartFree}
              className="obsidian h-12 px-6 text-[15px] font-bold shadow-[0_12px_24px_-8px_rgba(106,7,228,0.4)] transition-transform hover:-translate-y-0.5"
            >
              Start for free
              <ArrowRight className="size-4 ml-1.5" />
            </Button>
            <button
              type="button"
              onClick={onSeeHowItWorks}
              className="inline-flex h-12 items-center justify-center rounded-xl border border-line bg-surface/80 px-6 text-[14.5px] font-semibold text-ink backdrop-blur-md transition-colors hover:border-line-strong hover:bg-surface-2"
            >
              See how it works
            </button>
          </div>

          <p className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-[12px] text-ink-3">
            <span className="inline-flex items-center gap-1.5">
              <Check className="size-3.5 text-ok" strokeWidth={2.5} />
              Free plan forever
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Check className="size-3.5 text-ok" strokeWidth={2.5} />
              No credit card required
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Check className="size-3.5 text-ok" strokeWidth={2.5} />
              Meta Graph API compliant
            </span>
          </p>
        </Reveal>

        {/* ── Visual Frame: The Crowd & Creator Photo with Interactive Overlays ── */}
        <Reveal delay={0.24} y={30}>
          <div className="relative mx-auto mt-12 max-w-5xl overflow-hidden rounded-3xl border border-white/20 bg-surface shadow-2xl">
            {/* The Image */}
            <div className="relative aspect-[16/9] w-full overflow-hidden">
              <Image
                src="/images/relo/hero-creator.jpg"
                alt="Creators using RELO AI with phone lights glowing"
                fill
                priority
                className="object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />
            </div>

            {/* Overlay 1: Comment Trigger (Left) */}
            <div className="absolute left-4 top-6 sm:left-8 sm:top-10 max-w-[260px] sm:max-w-[310px] text-left">
              <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-0.5 text-[10.5px] font-bold text-white/90 backdrop-blur-md border border-white/10">
                <span className="grid size-4 place-items-center rounded-full bg-signal text-[9px] font-black text-white">
                  1
                </span>
                When someone comments...
              </div>

              <div className="rounded-2xl border border-white/20 bg-black/75 p-3.5 text-white backdrop-blur-xl shadow-2xl transition-transform duration-300 hover:scale-[1.02]">
                <div className="flex items-start gap-2.5">
                  <div className="grid size-7 shrink-0 place-items-center rounded-full bg-gradient-to-tr from-amber-400 to-rose-500 text-[10px] font-black text-white">
                    P
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center justify-between text-[11px] font-bold text-white/90">
                      <span>priya.shoots</span>
                      <Heart className="size-3 text-rose-500 fill-rose-500" />
                    </p>
                    <p className="mt-0.5 text-[12px] font-medium text-white/80">
                      Send me the link for the <span className="rounded bg-signal/40 px-1 py-0.5 font-bold text-signal-bright border border-signal/50">trial</span>
                    </p>
                    <p className="mt-1 text-[9.5px] font-semibold text-white/50">Reply</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Overlay 2: Text them in DMs (Right) */}
            <div className="absolute right-4 top-14 sm:right-8 sm:top-18 max-w-[260px] sm:max-w-[320px] text-left">
              <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-0.5 text-[10.5px] font-bold text-white/90 backdrop-blur-md border border-white/10">
                <span className="grid size-4 place-items-center rounded-full bg-signal text-[9px] font-black text-white">
                  2
                </span>
                Text them in DMs
              </div>

              <div className="rounded-2xl border border-white/20 bg-black/80 p-3.5 text-white backdrop-blur-xl shadow-2xl transition-transform duration-300 hover:scale-[1.02]">
                <p className="text-[12px] font-medium text-white/90 leading-snug">
                  Here&apos;s your link! Enjoy your free trial pack ❤️
                </p>
                <div className="mt-2.5">
                  <div className="flex h-8 items-center justify-center rounded-lg bg-white text-[11.5px] font-bold text-black shadow-md transition-opacity hover:opacity-90 cursor-pointer">
                    Get Free Access
                  </div>
                </div>
              </div>
            </div>

            {/* Overlay 3: Social Proof Badge Pill (Bottom Center) */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 sm:bottom-6">
              <div className="inline-flex items-center gap-2.5 rounded-full border border-white/25 bg-black/70 px-4 py-1.5 text-white backdrop-blur-xl shadow-2xl">
                <span className="flex size-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-[13px] font-extrabold tracking-tight">50K+ Creators</span>
                <span className="text-white/50 text-[11px]">growing on RELO</span>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
