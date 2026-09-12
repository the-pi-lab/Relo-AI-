import React, { useState } from "react";
import { DollarSign, TrendingUp, ArrowRight } from "lucide-react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";

import { calculateManyChatAnnual, calculateThreeYearSavings } from "@/lib/calculator";

export default function SavingsCalculator() {
  const [contacts, setContacts] = useState(5000);

  const manyChatAnnual = calculateManyChatAnnual(contacts);
  const threeYearManyChat = manyChatAnnual * 3;
  const threeYearSavings = calculateThreeYearSavings(contacts, 10);

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto font-sans">
      <div className="text-center max-w-3xl mx-auto mb-12">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-mono font-bold tracking-wide uppercase mb-3">
          <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
          The ManyChat Tax Calculator
        </div>
        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          How Much Are You Overpaying for Automation?
        </h2>
        <p className="text-sm sm:text-base text-slate-600 font-medium mt-2">
          ManyChat penalizes your growth by increasing monthly charges as your contact list grows.
          Calculate your 3-year savings with RELO.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-10 shadow-xl shadow-slate-200/60">
        {/* Slider Section */}
        <div className="space-y-4 mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label htmlFor="contacts-slider" className="text-sm font-bold text-slate-800">
              Estimated Monthly Active Contacts / Leads
            </label>
            <div className="flex items-center gap-2">
              <span className="text-2xl sm:text-3xl font-black text-sky-600 font-mono">
                {contacts.toLocaleString()}
              </span>
              <span className="text-xs font-semibold text-slate-500">contacts</span>
            </div>
          </div>

          <input
            id="contacts-slider"
            type="range"
            min="500"
            max="50000"
            step="500"
            value={contacts}
            onChange={(e) => setContacts(Number(e.target.value))}
            className="w-full h-3 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-400"
            aria-label="Estimated Monthly Active Contacts"
          />

          <div className="flex justify-between text-[11px] font-mono font-semibold text-slate-400">
            <span>500 (Starter)</span>
            <span>10,000 (Growing)</span>
            <span>25,000 (Pro)</span>
            <span>50,000+ (Scale)</span>
          </div>
        </div>

        {/* Cost Comparison Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 mb-10">
          {/* ManyChat Recurring Tax Card */}
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  ManyChat Recurring
                </span>
                <span className="text-[10px] font-mono font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                  Monthly Tax
                </span>
              </div>
              <div className="text-3xl sm:text-4xl font-black text-slate-900 font-mono tracking-tight mb-1">
                ${manyChatAnnual.toLocaleString()}
                <span className="text-sm text-slate-500 font-normal"> / year</span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                ${(manyChatAnnual / 12).toFixed(0)}/month base + mandatory contact scaling tier.
              </p>
            </div>

            <div className="pt-6 border-t border-slate-200/80 mt-6 space-y-2 text-xs text-slate-600">
              <div className="flex items-center justify-between">
                <span>1-Year Cost:</span>
                <span className="font-mono font-bold text-slate-800">${manyChatAnnual.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>3-Year Cost:</span>
                <span className="font-mono font-bold text-red-600">${threeYearManyChat.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* RELO Lifetime Card */}
          <div className="p-6 rounded-2xl bg-gradient-to-b from-sky-50/70 to-emerald-50/70 border-2 border-emerald-400 shadow-md flex flex-col justify-between relative overflow-hidden">
            <div aria-hidden="true" className="absolute -top-6 -right-6 w-24 h-24 bg-emerald-400/10 rounded-full blur-xl pointer-events-none" />

            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                  RELO Engine
                </span>
                <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full">
                  Lifetime License
                </span>
              </div>
              <div className="text-3xl sm:text-4xl font-black text-slate-900 font-mono tracking-tight mb-1">
                $10
                <span className="text-sm text-emerald-700 font-bold"> once. Forever.</span>
              </div>
              <p className="text-xs text-slate-600 font-medium">
                100% serverless edge engine. Unlimited contacts. Zero monthly charges.
              </p>
            </div>

            <div className="pt-6 border-t border-emerald-200 mt-6 space-y-2 text-xs text-slate-700">
              <div className="flex items-center justify-between">
                <span>1-Year Cost:</span>
                <span className="font-mono font-bold text-slate-900">$10</span>
              </div>
              <div className="flex items-center justify-between">
                <span>3-Year Cost:</span>
                <span className="font-mono font-bold text-emerald-700 text-sm">$10</span>
              </div>
            </div>
          </div>
        </div>

        {/* Big Savings Highlight Banner */}
        <div className="p-6 rounded-2xl bg-emerald-600 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-lg shadow-emerald-600/20">
          <div className="space-y-1 text-center sm:text-left">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-100 flex items-center justify-center sm:justify-start gap-1.5">
              <TrendingUp className="w-4 h-4" />
              Your 3-Year Capital Saved
            </span>
            <div className="text-3xl sm:text-5xl font-black tracking-tight font-mono">
              +${threeYearSavings.toLocaleString()}
            </div>
            <p className="text-xs text-emerald-100 max-w-md">
              Reinvest this cash into high-converting paid ads or content production instead of paying SaaS rent.
            </p>
          </div>

          <Link to="/login" className="w-full sm:w-auto shrink-0">
            <Button
              size="lg"
              className="w-full sm:w-auto h-12 px-6 rounded-xl bg-white text-slate-900 hover:bg-slate-100 font-bold text-sm shadow-md"
            >
              Claim $10 License
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </Link>
        </div>

        {/* Footnote & Sourcing Transparency */}
        <div className="pt-6 mt-6 border-t border-slate-100 text-[11px] text-slate-400 font-sans leading-relaxed">
          * Competitor pricing verified based on published ManyChat Pro pricing tiers (September 2026): $15/month entry tier (up to 500 contacts, billed annually at $180/year), scaling to $25/mo (1,000), $35/mo (2,500), $45/mo (5,000), $65/mo (10,000), $145/mo (25,000), and $235/mo (50,000+). RELO operates on serverless edge architecture with a flat $10 lifetime license and zero contact scaling fees.
        </div>
      </div>
    </section>
  );
}
