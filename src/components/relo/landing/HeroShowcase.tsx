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
    <section className="relative px-4 sm:px-6 lg:px-8 pt-4 pb-16">
      {/* ── Main Hero Frame Container with Full Photo Background ── */}
      <div className="relative mx-auto max-w-[1360px] min-h-[820px] md:min-h-[880px] lg:min-h-[920px] rounded-3xl sm:rounded-[36px] overflow-hidden border border-white/20 shadow-2xl flex flex-col justify-between p-6 sm:p-10 md:p-14 text-center">
        {/* The Full Background Photo */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/relo/hero-creator.jpg"
            alt="RELO Creators celebrating viral growth with glowing phone flashlights"
            fill
            priority
            className="object-cover object-[center_35%]"
          />
          {/* Multi-layered cinematic gradient overlays for high-contrast typography and subtle bottom vignette */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/40 to-black/90 pointer-events-none" />
          <div 
            aria-hidden
            className="absolute inset-0 pointer-events-none opacity-30"
            style={{
              background: "radial-gradient(ellipse at 50% 20%, rgba(106,7,228,0.6) 0%, transparent 65%)"
            }}
          />
        </div>

        {/* ── Top Region: Badges, Headline, Subtitle, and CTAs ── */}
        <div className="relative z-10 mx-auto max-w-4xl flex flex-col items-center pt-4 sm:pt-8">
          {/* Trust Capsule */}
          <Reveal>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-[12px] sm:text-[13px] font-semibold text-white backdrop-blur-xl shadow-lg">
              <Sparkles className="size-3.5 text-signal-bright animate-pulse" />
              <span>The #1 Instagram DM Automation OS for Creators</span>
            </div>
          </Reveal>

          {/* Main Headline */}
          <Reveal delay={0.06}>
            <h1 className="mt-6 text-4xl sm:text-6xl md:text-7xl lg:text-[76px] font-black tracking-[-0.04em] text-white leading-[1.05]">
              Unlimited Free <br />
              <span className="bg-gradient-to-r from-[#C084FC] via-[#F472B6] to-[#FB7185] bg-clip-text text-transparent drop-shadow-sm">
                DM Automations
              </span>
            </h1>
          </Reveal>

          {/* Subtitle */}
          <Reveal delay={0.12}>
            <p className="mt-5 max-w-2xl text-base sm:text-lg md:text-xl leading-relaxed text-white/85 font-medium">
              Fuel curiosity and boost engagement with instant automated DMs. Turn every Reel comment, 
              story reply, and question into a loyal customer and measurable sale.
            </p>
          </Reveal>

          {/* CTA Buttons */}
          <Reveal delay={0.18}>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <button
                type="button"
                onClick={onStartFree}
                className="obsidian h-13 px-8 text-[15.5px] font-extrabold rounded-2xl shadow-[0_12px_32px_-8px_rgba(106,7,228,0.7)] transition-all hover:scale-105 active:scale-95 inline-flex items-center gap-2"
              >
                <span>Start for free</span>
                <ArrowRight className="size-4" />
              </button>
              <button
                type="button"
                onClick={onSeeHowItWorks}
                className="h-13 px-7 text-[15px] font-bold text-white rounded-2xl border border-white/25 bg-white/10 backdrop-blur-xl transition-all hover:bg-white/20 hover:border-white/40"
              >
                See how it works
              </button>
            </div>

            {/* Guarantees */}
            <div className="mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[12.5px] font-semibold text-white/80">
              <span className="inline-flex items-center gap-1.5">
                <Check className="size-4 text-emerald-400" strokeWidth={3} />
                Free plan forever
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="size-4 text-emerald-400" strokeWidth={3} />
                No credit card required
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="size-4 text-emerald-400" strokeWidth={3} />
                Official Meta Graph API compliant
              </span>
            </div>
          </Reveal>
        </div>

        {/* ── Lower Region: Floating Interactive Overlay Cards Across the Crowd Scene ── */}
        <Reveal delay={0.24} y={25}>
          <div className="relative z-10 mx-auto w-full max-w-5xl pt-10 sm:pt-14 pb-4">
            <div className="grid grid-cols-1 md:grid-cols-3 items-end gap-6">
              
              {/* Overlay 1: Comment Trigger (Left Column) */}
              <div className="text-left w-full max-w-[340px] mx-auto md:mx-0">
                <div className="mb-2.5 inline-flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1 text-[11px] font-bold text-white/95 backdrop-blur-xl border border-white/15 shadow-md">
                  <span className="grid size-4 place-items-center rounded-full bg-signal text-[9.5px] font-black text-white">
                    1
                  </span>
                  When someone comments...
                </div>

                <div className="rounded-2xl border border-white/25 bg-black/80 p-4 text-white backdrop-blur-2xl shadow-2xl transition-transform duration-300 hover:scale-[1.02]">
                  <div className="flex items-start gap-3">
                    <div className="grid size-8 shrink-0 place-items-center rounded-full bg-gradient-to-tr from-amber-400 to-rose-500 text-[11px] font-black text-white shadow">
                      P
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center justify-between text-[11.5px] font-bold text-white">
                        <span>priya.shoots</span>
                        <Heart className="size-3.5 text-rose-500 fill-rose-500" />
                      </p>
                      <p className="mt-1 text-[12.5px] font-medium text-white/90">
                        Send me the link for the <span className="rounded bg-signal/60 px-1.5 py-0.5 font-bold text-white border border-signal">trial</span>
                      </p>
                      <p className="mt-1.5 text-[10px] font-semibold text-white/50">2m ago · Reply</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Overlay 2: Center Social Proof Badge */}
              <div className="flex justify-center order-last md:order-none">
                <div className="inline-flex items-center gap-3 rounded-full border border-white/30 bg-black/80 px-5 py-2.5 text-white backdrop-blur-2xl shadow-2xl">
                  <span className="relative flex size-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full size-2.5 bg-emerald-500" />
                  </span>
                  <div className="text-left">
                    <p className="text-[13.5px] font-extrabold tracking-tight">60,000+ Creators</p>
                    <p className="text-[10.5px] text-white/60 font-medium">growing with RELO in 2026</p>
                  </div>
                </div>
              </div>

              {/* Overlay 3: Text them in DMs (Right Column) */}
              <div className="text-left w-full max-w-[340px] mx-auto md:ml-auto md:mr-0">
                <div className="mb-2.5 inline-flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1 text-[11px] font-bold text-white/95 backdrop-blur-xl border border-white/15 shadow-md">
                  <span className="grid size-4 place-items-center rounded-full bg-signal text-[9.5px] font-black text-white">
                    2
                  </span>
                  Text them in DMs
                </div>

                <div className="rounded-2xl border border-white/25 bg-black/85 p-4 text-white backdrop-blur-2xl shadow-2xl transition-transform duration-300 hover:scale-[1.02]">
                  <p className="text-[12.5px] font-medium text-white/95 leading-snug">
                    Here&apos;s your link! Enjoy your free trial pack ❤️
                  </p>
                  <div className="mt-3">
                    <div 
                      onClick={onStartFree}
                      className="flex h-9 items-center justify-center rounded-xl bg-white text-[12px] font-bold text-black shadow-md transition-opacity hover:opacity-90 cursor-pointer"
                    >
                      Get Free Access →
                    </div>
                  </div>
                  <p className="mt-2 text-right text-[10px] font-semibold text-white/50">Delivered · Seen</p>
                </div>
              </div>

            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
