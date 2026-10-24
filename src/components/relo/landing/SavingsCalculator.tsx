"use client";

import React, { useState } from "react";
import { Check, ShieldAlert, Sparkles, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function SavingsCalculator({ className }: { className?: string }) {
  const [contacts, setContacts] = useState(15000);

  // ManyChat pricing tier breakdown (USD):
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
  const manyChatTwoYears = manyChatMonthly * 24;
  const reloMonthlyUSD = 2.4; // flat ₹199/mo (approx $2.40 USD)
  const reloTwoYears = Math.round(reloMonthlyUSD * 24);
  const savedAmount = manyChatTwoYears - reloTwoYears;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl border border-line bg-surface p-6 sm:p-10 shadow-2xl backdrop-blur-xl",
        className
      )}
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-line">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="rounded-full bg-rose-500/15 text-rose-500 border border-rose-500/30 px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="size-3" /> The Growth Tax Reality
            </span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
            Stop Paying ManyChat $1,000+ Every Year
          </h3>
          <p className="mt-1.5 text-xs sm:text-sm text-ink-2 max-w-xl">
            Why pay escalating monthly rent just because more people commented on your Reel? Slide to check your 24-month savings with RELO&apos;s flat ₹199/month Pro plan.
          </p>
        </div>

        <div className="lg:text-right">
          <div className="font-mono text-[11px] uppercase tracking-wider text-ink-3 font-semibold">
            Estimated 2-Year Savings
          </div>
          <div className="text-3xl sm:text-5xl font-extrabold font-mono tracking-tight text-emerald-500 mt-1">
            +${savedAmount.toLocaleString()}
          </div>
          <div className="text-[11.5px] text-ink-3">~₹{(savedAmount * 85).toLocaleString()} saved in your pocket</div>
        </div>
      </div>

      {/* Interactive Contact Slider */}
      <div className="mt-8 space-y-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-ink font-semibold">Your Active Leads / Commenters:</span>
          <span className="font-mono font-extrabold text-lg text-signal bg-signal-wash px-3.5 py-1 rounded-xl border border-signal/25">
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
          className="w-full h-3 rounded-lg appearance-none cursor-pointer bg-surface-2 accent-[#6A07E4]"
        />

        <div className="flex justify-between text-[11.5px] font-mono text-ink-3 font-medium">
          <span>1,000 contacts</span>
          <span>15,000 contacts</span>
          <span>50,000 contacts</span>
        </div>
      </div>

      {/* Comparison Grid */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {/* ManyChat Box */}
        <div className="rounded-2xl border border-rose-500/25 bg-rose-500/[0.04] p-6 text-left">
          <div className="flex items-center justify-between text-xs font-mono text-rose-500 font-bold mb-3">
            <span>ManyChat &quot;Growth Tax&quot;</span>
            <span className="rounded-md bg-rose-500/15 px-2 py-0.5">Recurring Drain</span>
          </div>

          <div className="space-y-2.5">
            <div className="flex justify-between text-sm">
              <span className="text-ink-2">Monthly Subscription:</span>
              <span className="font-mono font-bold text-ink">${manyChatMonthly}/mo</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-ink-2">12 Months Cost:</span>
              <span className="font-mono font-bold text-ink">${manyChatMonthly * 12}</span>
            </div>
            <div className="flex justify-between text-sm pt-2.5 border-t border-rose-500/15">
              <span className="text-ink font-bold">24-Month Total:</span>
              <span className="font-mono font-extrabold text-rose-500 text-lg">${manyChatTwoYears}</span>
            </div>
          </div>
          <p className="mt-4 text-[12px] text-ink-3 leading-relaxed">
            ManyChat penalizes you with higher monthly bills every time your Reels go viral.
          </p>
        </div>

        {/* RELO Box */}
        <div className="relative overflow-hidden rounded-2xl border border-emerald-500/35 bg-emerald-500/[0.06] p-6 text-left shadow-lg">
          <div className="flex items-center justify-between text-xs font-mono text-emerald-600 font-bold mb-3">
            <span>RELO AI Pro Plan</span>
            <span className="rounded-md bg-emerald-500/20 px-2.5 py-0.5 text-emerald-600">Flat ₹199 / mo</span>
          </div>

          <div className="space-y-2.5">
            <div className="flex justify-between text-sm">
              <span className="text-ink-2">Monthly Subscription:</span>
              <span className="font-mono font-bold text-emerald-600">₹199 / mo (~$2.40)</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-ink-2">Contacts Allowed:</span>
              <span className="font-mono font-bold text-ink">Unlimited (0 extra fees)</span>
            </div>
            <div className="flex justify-between text-sm pt-2.5 border-t border-emerald-500/20">
              <span className="text-ink font-bold">24-Month Total:</span>
              <span className="font-mono font-extrabold text-emerald-600 text-lg">~₹4,776 (~$57)</span>
            </div>
          </div>
          <p className="mt-4 text-[12px] text-ink-2 leading-relaxed font-medium">
            Flat price regardless of your audience size. No hidden growth penalties.
          </p>
        </div>
      </div>
    </div>
  );
}
