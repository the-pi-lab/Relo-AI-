"use client";

import React, { useState } from "react";
import { Check, Film, KeyRound, Rocket, Send, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Reveal } from "../motion";

const TABS = [
  {
    id: "reel",
    label: "Select Posts or Reels",
    icon: Film,
    desc: "Pick any live post or reel for DM automation.",
    content: {
      headline: "Select Active Media",
      sub: "RELO auto-syncs your newest reels and carousels via Meta Graph API.",
      action: "Selected: Reel #1042 ('How to scale in 2026')",
      badge: "Media Armed",
    },
  },
  {
    id: "keywords",
    label: "Define Keywords",
    icon: KeyRound,
    desc: "Set up key terms to trigger your reply.",
    content: {
      headline: "Keyword Match Engine",
      sub: "Enter words or phrases that trigger the automated DM (case-insensitive).",
      action: "Active triggers: 'link', 'access', 'guide', 'price'",
      badge: "Keywords Active",
    },
  },
  {
    id: "dm",
    label: "Automate DMs",
    icon: Send,
    desc: "Personalise your card and link buttons.",
    content: {
      headline: "DM Card Builder",
      sub: "Craft private message cards with tracked short-links and auto-replies.",
      action: "Card: 'Creator Pack' with 3 action buttons",
      badge: "Jitter Delay: 30-90s",
    },
  },
  {
    id: "viral",
    label: "Wait to go Viral!",
    icon: Rocket,
    desc: "Let RELO grow your audience on autopilot.",
    content: {
      headline: "Algorithmic Growth Engine",
      sub: "Every comment answered triggers an Instagram reach multiplier.",
      action: "100% automated delivery, zero manual typing",
      badge: "Viral Loop On",
    },
  },
];

export function ProcessWalkthroughTabs() {
  const [activeTab, setActiveTab] = useState(0);
  const current = TABS[activeTab];

  return (
    <section className="relative border-t border-line/70 py-20 lg:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center">
          <Reveal>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-2/60 px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-ink-2">
              <Sparkles className="size-3 text-signal" /> Process
            </span>
          </Reveal>

          <Reveal delay={0.06}>
            <h2 className="mt-4 text-3xl font-extrabold tracking-[-0.035em] text-ink sm:text-5xl">
              How RELO Automates Your{" "}
              <span className="bg-gradient-to-r from-signal via-[#BC64FF] to-[#E22295] bg-clip-text text-transparent">
                Viral
              </span>{" "}
              Journey
            </h2>
          </Reveal>

          <Reveal delay={0.12}>
            <p className="mx-auto mt-4 max-w-xl text-base text-ink-2">
              Connect your Instagram and follow these simple steps to automate DMs effortlessly.
            </p>
          </Reveal>
        </div>

        {/* 4 Process Tabs */}
        <div className="mt-14 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {TABS.map((tab, idx) => {
            const isActive = activeTab === idx;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(idx)}
                className={cn(
                  "relative flex flex-col items-start rounded-2xl border p-4 sm:p-5 text-left transition-all duration-200",
                  isActive
                    ? "border-signal/50 bg-surface shadow-[var(--sh-2)]"
                    : "border-line/70 bg-surface/40 hover:border-line hover:bg-surface"
                )}
              >
                <div
                  className={cn(
                    "grid size-8 place-items-center rounded-lg transition-colors",
                    isActive ? "bg-signal text-white" : "bg-surface-2 text-ink-3"
                  )}
                >
                  <Icon className="size-4" />
                </div>
                <p className="mt-3 text-[13.5px] font-bold text-ink">{tab.label}</p>
                <p className="mt-1 text-[11.5px] text-ink-3 leading-snug">{tab.desc}</p>

                {/* Active Underline Indicator */}
                <div
                  className={cn(
                    "absolute inset-x-4 bottom-0 h-1 rounded-t-full transition-all duration-300",
                    isActive ? "bg-signal" : "bg-transparent"
                  )}
                />
              </button>
            );
          })}
        </div>

        {/* Browser Frame App Walkthrough Mockup */}
        <div className="mt-8 overflow-hidden rounded-3xl border border-line bg-surface shadow-2xl">
          {/* Browser Bar */}
          <div className="flex h-11 items-center justify-between border-b border-line bg-surface-2/60 px-4">
            <div className="flex items-center gap-2">
              <span className="size-3 rounded-full bg-rose-500/80" />
              <span className="size-3 rounded-full bg-amber-500/80" />
              <span className="size-3 rounded-full bg-emerald-500/80" />
            </div>
            <div className="rounded-md border border-line/70 bg-surface px-6 py-1 font-mono text-[11px] text-ink-3">
              app.relo.ai/automations/{current.id}
            </div>
            <div className="w-12" />
          </div>

          {/* Canvas Preview Body */}
          <div className="relative min-h-[380px] sm:min-h-[440px] bg-gradient-to-br from-surface to-surface-2/50 p-6 sm:p-12 flex items-center justify-center">
            {/* Background Grid Pattern */}
            <div
              aria-hidden
              className="absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)",
                backgroundSize: "20px 20px",
              }}
            />

            {/* Central Modal Card corresponding to active tab */}
            <div className="relative z-10 w-full max-w-xl rounded-2xl border border-line bg-surface p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-line/80 pb-4">
                <div>
                  <h4 className="text-[16px] font-extrabold text-ink">{current.content.headline}</h4>
                  <p className="text-[12px] text-ink-3 mt-0.5">{current.content.sub}</p>
                </div>
                <span className="rounded-full bg-signal-wash px-2.5 py-1 text-[10.5px] font-bold text-signal">
                  {current.content.badge}
                </span>
              </div>

              <div className="mt-5 space-y-3">
                <div className="rounded-xl border border-line bg-surface-2/60 p-3.5">
                  <p className="text-[11px] font-bold text-ink-3 uppercase tracking-wider">Active Configuration</p>
                  <p className="mt-1 text-[13px] font-semibold text-ink">{current.content.action}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-[11.5px] font-semibold text-ink">
                    <Check className="size-3.5 text-ok" />
                    <span>Deduplication on</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-[11.5px] font-semibold text-ink">
                    <Check className="size-3.5 text-ok" />
                    <span>Spintax anti-spam</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between pt-2">
                <span className="font-mono text-[11px] text-ink-3">Auto-saved to cloud</span>
                <button
                  type="button"
                  className="obsidian h-8.5 px-4 rounded-lg text-[12px] font-bold"
                >
                  Confirm & Arm Flow
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
