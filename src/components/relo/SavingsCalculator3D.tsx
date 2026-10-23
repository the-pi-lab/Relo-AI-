"use client";

import React, { useState } from "react";
import { DollarSign, ShieldAlert, Check, TrendingDown, ArrowRight, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGradientPreset } from "@/lib/relo/gradients";
import { Card3D } from "./Card3D";

export function SavingsCalculator3D({ className }: { className?: string }) {
  const [contacts, setContacts] = useState(15000);
  const { preset } = useGradientPreset();

  // ManyChat pricing tier breakdown:
  // 500: $15/mo
  // 2,500: $25/mo
  // 5,000: $45/mo
  // 10,000: $65/mo
  // 15,000: $95/mo
  // 25,000: $145/mo
  // 50,000: $235/mo
  const getManyChatMonthly = (count: number) => {
    if (count <= 500) return 15;
    if (count <= 2500) return 25;
    if (count <= 5000) return 45;
    if (count <= 10000) return 65;
    if (count <= 15000) return 95;
    if (count <= 25000) return 145;
    return 235;
  };

  const manyChatMonthly = getManyChatMonthly(contacts);
  const manyChatYearly = manyChatMonthly * 12;
  const manyChatTwoYears = manyChatYearly * 2;
  const reloMonthlyUSD = 2.4; // flat ₹199/mo (approx $2.40)
  const reloTwoYears = reloMonthlyUSD * 24;
  const savedAmount = manyChatTwoYears - reloTwoYears;

  return (
    <Card3D
      className={cn("p-6 sm:p-8 bg-black/60 border-white/12", className)}
      intensity={10}
      glare={true}
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-white/8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="size-3" /> The Growth Tax Reality
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Stop Paying ManyChat $1,000+ Every Year
          </h3>
          <p className="mt-1.5 text-xs sm:text-sm text-white/70 max-w-xl">
            Why pay escalating monthly rent just because more people commented on your Reel? Slide to check your 24-month savings with RELO&apos;s flat ₹199/month Pro plan.
          </p>
        </div>

        <div className="text-right">
          <div className="font-mono text-[11px] uppercase tracking-wider text-white/40">
            Estimated 2-Year Savings
          </div>
          <div
            className="text-3xl sm:text-4xl font-extrabold font-mono tracking-tight mt-1"
            style={{ color: preset.accentColor }}
          >
            +${savedAmount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
        </div>
      </div>

      {/* Interactive Contact Slider */}
      <div className="mt-6 space-y-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-white/80 font-medium">Your Active Leads / Contacts:</span>
          <span className="font-mono font-bold text-lg text-white bg-white/10 px-3 py-1 rounded-xl border border-white/15">
            {contacts.toLocaleString()} contacts
          </span>
        </div>

        <input
          type="range"
          min={1000}
          max={50000}
          step={1000}
          value={contacts}
          onChange={(e) => setContacts(Number(e.target.value))}
          className="w-full h-2.5 rounded-lg appearance-none cursor-pointer bg-white/15 accent-cyan-400"
          style={{ accentColor: preset.accentColor }}
        />

        <div className="flex justify-between text-[11px] font-mono text-white/40">
          <span>1,000 leads</span>
          <span>15,000 leads</span>
          <span>50,000 leads</span>
        </div>
      </div>

      {/* Comparison Grid */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {/* ManyChat Box */}
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/[0.04] p-5">
          <div className="flex items-center justify-between text-xs font-mono text-rose-400 font-semibold mb-3">
            <span>ManyChat &quot;Growth Tax&quot;</span>
            <span className="rounded-md bg-rose-500/20 px-2 py-0.5">Recurring Drain</span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-white/60">Monthly Subscription:</span>
              <span className="font-mono font-bold text-white">${manyChatMonthly}/mo</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/60">12 Months Cost:</span>
              <span className="font-mono font-bold text-white">${manyChatYearly}</span>
            </div>
            <div className="flex justify-between text-sm pt-2 border-t border-rose-500/15">
              <span className="text-white/80 font-semibold">24-Month Total:</span>
              <span className="font-mono font-bold text-rose-400 text-base">${manyChatTwoYears}</span>
            </div>
          </div>
          <p className="mt-3 text-[11px] text-white/50">
            Penalizes you with higher bills whenever your reels go viral.
          </p>
        </div>

        {/* RELO Box */}
        <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.07] p-5 shadow-lg shadow-emerald-500/10">
          <div className="flex items-center justify-between text-xs font-mono text-emerald-400 font-semibold mb-3">
            <span>RELO AI Pro Plan</span>
            <span className="rounded-md bg-emerald-500/20 px-2 py-0.5">Flat ₹199 / mo</span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-white/60">Monthly Subscription:</span>
              <span className="font-mono font-bold text-emerald-400">₹199 / month (~$2.40)</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/60">Contacts Allowed:</span>
              <span className="font-mono font-bold text-white">Unlimited forever</span>
            </div>
            <div className="flex justify-between text-sm pt-2 border-t border-emerald-500/20">
              <span className="text-white/90 font-semibold">24-Month Total:</span>
              <span className="font-mono font-bold text-emerald-300 text-base">~₹4,776 (~$57)</span>
            </div>
          </div>
          <p className="mt-3 text-[11px] text-white/70">
            Flat price regardless of contact size. No escalating ManyChat growth penalties.
          </p>
        </div>
      </div>
    </Card3D>
  );
}
