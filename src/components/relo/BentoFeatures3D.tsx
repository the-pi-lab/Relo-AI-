"use client";

import React from "react";
import {
  Zap,
  ShieldCheck,
  Cpu,
  Globe2,
  Database,
  Lock,
  MessageSquare,
  Sparkles,
  ArrowUpRight,
  Fingerprint,
  Layers,
  Infinity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useGradientPreset } from "@/lib/relo/gradients";
import { Card3D, Card3DLayer } from "./Card3D";

export function BentoFeatures3D({ className }: { className?: string }) {
  const { preset } = useGradientPreset();

  return (
    <div className={cn("space-y-6", className)}>
      <div className="text-center max-w-2xl mx-auto mb-12">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-mono uppercase tracking-widest text-white/80 mb-4">
          <Sparkles className="size-3.5" style={{ color: preset.accentColor }} />
          <span>Architectural Superiority</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
          Engineered for Creator Sovereignty
        </h2>
        <p className="mt-3 text-sm sm:text-base text-white/70 leading-relaxed">
          Not another slow Node.js wrapper. Built on Cloudflare Workers edge runtime and serverless D1 SQLite for sub-15ms execution with zero growth taxes.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Large Feature 1: Sub-15ms Cloudflare Edge Architecture */}
        <Card3D
          intensity={12}
          className="md:col-span-2 p-7 bg-gradient-to-br from-white/[0.07] to-white/[0.02]"
        >
          <div className="flex flex-col h-full justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/8">
                <span className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
                  <Globe2 className="size-4" /> Global Edge Runtime · 300+ Cities
                </span>
                <span className="font-mono text-xs text-white/50 bg-white/8 px-2.5 py-1 rounded-full border border-white/10">
                  14ms Latency
                </span>
              </div>
              <h3 className="text-2xl font-bold text-white tracking-tight">
                Zero Cold Starts. Zero Infrastructure Costs.
              </h3>
              <p className="mt-2 text-sm text-white/70 leading-relaxed max-w-xl">
                Traditional automation tools run on heavy server fleets that sleep on free tiers or incur massive AWS bills. RELO executes on Cloudflare Workers edge nodes globally, keeping your operational cost at exactly ₹0.
              </p>
            </div>

            {/* Interactive edge telemetry visualizer */}
            <div className="mt-8 rounded-2xl border border-white/10 bg-black/50 p-4 font-mono text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-white/8 text-[11px] text-white/40 uppercase">
                <span>Edge Node Location</span>
                <span>Webhook Ingestion</span>
                <span>D1 SQLite State</span>
              </div>
              <div className="mt-3 space-y-2 text-white/80 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-emerald-400 animate-pulse" /> IAD (Ashburn, US)
                  </span>
                  <span className="text-emerald-400">12ms ACK</span>
                  <span className="text-white/60">Atomic Commit</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-emerald-400" /> BOM (Mumbai, IN)
                  </span>
                  <span className="text-emerald-400">14ms ACK</span>
                  <span className="text-white/60">Atomic Commit</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-emerald-400" /> LHR (London, UK)
                  </span>
                  <span className="text-emerald-400">15ms ACK</span>
                  <span className="text-white/60">Atomic Commit</span>
                </div>
              </div>
            </div>
          </div>
        </Card3D>

        {/* Feature 2: Meta Generic Template Cards */}
        <Card3D intensity={12} className="p-7 bg-gradient-to-br from-white/[0.07] to-white/[0.02]">
          <div className="flex flex-col h-full justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-rose-400 mb-4">
                <MessageSquare className="size-4" /> 3-Button Template Cards
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight">
                High-Converting Rich DMs
              </h3>
              <p className="mt-2 text-xs text-white/70 leading-relaxed">
                Send official Meta 3-button cards with high-res thumbnails, deep links, and postbacks. 3.4x higher click-through rates compared to plain text replies.
              </p>
            </div>

            <div className="mt-6 rounded-xl border border-white/10 bg-black/60 p-3 space-y-2">
              <div className="h-2 w-24 rounded bg-white/20" />
              <div className="h-6 w-full rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-[10px] font-mono text-cyan-300 flex items-center justify-center font-bold">
                1. Access Resource
              </div>
              <div className="h-6 w-full rounded-lg bg-white/5 border border-white/10 text-[10px] font-mono text-white/60 flex items-center justify-center">
                2. View Free Case Study
              </div>
            </div>
          </div>
        </Card3D>

        {/* Feature 3: Fail-Open Follow-Gate */}
        <Card3D intensity={12} className="p-7 bg-gradient-to-br from-white/[0.07] to-white/[0.02]">
          <div className="flex flex-col h-full justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-amber-400 mb-4">
                <Fingerprint className="size-4" /> Biometric Follow-Gate
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight">
                Turn Commenters into Loyal Followers
              </h3>
              <p className="mt-2 text-xs text-white/70 leading-relaxed">
                Verifies follower status in real-time. If they don&apos;t follow, asks them politely with a 1-tap follow prompt before unlocking your high-ticket links.
              </p>
            </div>

            <div className="mt-6 flex items-center justify-between rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs font-mono text-amber-300">
              <span>Follower Verified</span>
              <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold">1500ms Timeout</span>
            </div>
          </div>
        </Card3D>

        {/* Feature 4: Human-Safe Randomized Jitter */}
        <Card3D intensity={12} className="p-7 bg-gradient-to-br from-white/[0.07] to-white/[0.02]">
          <div className="flex flex-col h-full justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 mb-4">
                <ShieldCheck className="size-4" /> 30s–90s Human Jitter
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight">
                Zero Bot Flagging Traps
              </h3>
              <p className="mt-2 text-xs text-white/70 leading-relaxed">
                Instant 0ms bots get creator accounts shadowbanned. RELO staggers replies with natural human-like jitter delays so Instagram thinks you typed it yourself.
              </p>
            </div>

            <div className="mt-6 rounded-xl border border-white/10 bg-black/60 p-3">
              <div className="flex justify-between text-[11px] font-mono text-white/50 mb-1.5">
                <span>Jitter Distribution</span>
                <span className="text-emerald-400 font-bold">48s avg</span>
              </div>
              <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 w-3/5" />
              </div>
            </div>
          </div>
        </Card3D>

        {/* Feature 5: Sovereign Data & No Growth Tax */}
        <Card3D intensity={12} className="p-7 bg-gradient-to-br from-white/[0.07] to-white/[0.02]">
          <div className="flex flex-col h-full justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-purple-400 mb-4">
                <Infinity className="size-4" /> Unlimited Contacts
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight">
                Never Pay Per Contact Again
              </h3>
              <p className="mt-2 text-xs text-white/70 leading-relaxed">
                Store 5,000 or 500,000 leads with zero extra fees. Export your entire contact CRM to CSV with one click anytime you want.
              </p>
            </div>

            <div className="mt-6 flex items-center justify-between rounded-xl border border-white/10 bg-black/60 p-3 text-xs font-mono text-white/80">
              <span>Leads Limit:</span>
              <span className="text-emerald-400 font-bold">UNLIMITED ∞</span>
            </div>
          </div>
        </Card3D>
      </div>
    </div>
  );
}
