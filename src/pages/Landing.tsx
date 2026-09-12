import React, { useState } from "react";
import { Link } from "react-router";
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  Layers,
  Sparkles,
  CheckCircle2,
  X,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";

import InteractiveSimulator from "@/components/landing/InteractiveSimulator";
import SavingsCalculator from "@/components/landing/SavingsCalculator";
import ComparisonTable from "@/components/landing/ComparisonTable";
import FaqAccordion from "@/components/landing/FaqAccordion";

export default function Landing() {
  const [legalModal, setLegalModal] = useState<"privacy" | "terms" | null>(null);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-sky-200 selection:text-sky-900 flex flex-col">
      {/* Top Navigation Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-emerald-500 p-[1px] shadow-sm">
            <div className="w-full h-full bg-white rounded-[11px] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-sky-600" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-black text-lg tracking-tight text-slate-900">
              RELO <span className="text-sky-600">AI</span>
            </span>
            <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-300 w-fit">
              Meta Graph API v21.0
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            to="/login"
            className="text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors hidden sm:block"
          >
            Sign In
          </Link>
          <span className="hidden md:flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Zero Contact Tax
          </span>
          <Link to="/login">
            <Button
              size="sm"
              className="rounded-xl font-bold bg-sky-600 hover:bg-sky-500 text-white shadow-md shadow-sky-600/20 min-h-[40px] px-4"
            >
              Creator Studio — $10
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-24 pb-16 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-50 border border-sky-200 text-sky-700 text-xs font-mono font-bold tracking-wide uppercase mb-6 shadow-xs">
            <Zap className="w-3.5 h-3.5 text-sky-600" />
            The $10 One-Time ManyChat Alternative
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 leading-[1.08] max-w-4xl mx-auto mb-6">
            Stop Paying{" "}
            <span className="line-through decoration-red-400 text-slate-400 font-extrabold">
              $180+/Year
            </span>{" "}
            for Automation.{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-600 to-emerald-600">
              Own It for $10. Once.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
            Automate Instagram Reels comments into verified DMs with 3-button Generic Template cards.
            Zero server maintenance, zero contact scaling taxes, and built on the official Meta Graph API v21.0.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
            <Link to="/login" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full sm:w-auto h-14 px-8 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-base shadow-xl shadow-sky-600/25 transition-all hover:scale-105 active:scale-95"
              >
                Enter Creator Studio — $10 Lifetime
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>

            <Link to="/dashboard?demo=true" className="w-full sm:w-auto">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto h-14 px-8 rounded-2xl bg-white border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-base shadow-sm"
              >
                Explore Studio Demo
              </Button>
            </Link>
          </div>

          {/* Value Micro-Badges */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 font-semibold pt-2">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              No Monthly Subscriptions
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Unlimited Free Contacts
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Cloudflare Edge Cron-as-Queue
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              1500ms Follow-Gate Fail-Open
            </span>
          </div>
        </section>

        {/* 1. Interactive Live Instagram Simulator */}
        <InteractiveSimulator />

        {/* 2. ManyChat Tax Savings Calculator */}
        <SavingsCalculator />

        {/* 3. Feature-by-Feature Comparison Table */}
        <ComparisonTable />

        {/* 4. Three Architecture Pillars */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Engineered for Speed, Reliability & Growth
            </h2>
            <p className="text-sm sm:text-base text-slate-600 font-medium mt-2">
              Why serverless edge architecture beats legacy third-party chatbot wrappers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center mb-5">
                  <Zap className="w-6 h-6 text-sky-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  &lt;15ms ACK + 30–90s Jitter
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                  Cloudflare edge workers ingest incoming Instagram webhooks in under 15 milliseconds, then apply randomized 30–90 second human timing jitter before replying. Meta sees natural human interaction, preventing account flags.
                </p>
              </div>
            </div>

            <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mb-5">
                  <ShieldCheck className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  Biometric Follow-Gate
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                  Verify commenter follow status in real time with our 1500ms fail-open window. Encourage casual viewers to become verified profile followers before delivering high-value blueprints or resources.
                </p>
              </div>
            </div>

            <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center mb-5">
                  <Layers className="w-6 h-6 text-sky-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  Official 3-Button Generic Cards
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                  Format direct messages with official Meta Messenger Generic Templates. Include a high-res thumbnail, title, subtitle, and up to 3 interactive web and community action buttons with zero coding.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 5. Frequently Asked Questions Accordion */}
        <FaqAccordion />

        {/* 6. Final Call to Action Card */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
          <div className="rounded-3xl bg-gradient-to-r from-sky-600 to-emerald-600 text-white p-8 sm:p-14 text-center shadow-2xl shadow-sky-600/20 relative overflow-hidden">
            <div className="max-w-2xl mx-auto relative z-10 space-y-6">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-sky-100 bg-white/10 px-3.5 py-1 rounded-full border border-white/20">
                One-Time Lifetime Access License
              </span>
              <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
                Ready to Stop Paying the Monthly ManyChat Tax?
              </h2>
              <p className="text-sm sm:text-base text-sky-100 font-medium leading-relaxed">
                Connect your Instagram account and launch your first automation in minutes with 3-button Generic Template cards, Spintax rotation, and Follow-Gate.
              </p>
              <div className="pt-2">
                <Link to="/login">
                  <Button
                    size="lg"
                    className="h-14 px-8 rounded-2xl bg-white text-slate-900 hover:bg-slate-100 font-bold text-base shadow-lg transition-transform hover:scale-105 active:scale-95"
                  >
                    Get RELO for $10
                    <ArrowRight className="w-5 h-5 ml-2 text-sky-600" />
                  </Button>
                </Link>
              </div>
              <p className="text-[11px] text-sky-200 font-mono">
                One-time payment • Unlimited contacts • AES-256-GCM token encryption
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer with Legal & Navigation Links */}
      <footer className="border-t border-slate-200/90 bg-white py-10 px-4 sm:px-8 text-center text-xs font-sans text-slate-500">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-sky-600 flex items-center justify-center shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-slate-800">RELO</span>
            <span className="text-slate-400">© 2026. All rights reserved.</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-slate-600 font-medium text-[11px]">
            <Link to="/dashboard?demo=true" className="hover:text-sky-600 transition-colors">
              Studio Demo
            </Link>
            <Link to="/login" className="hover:text-sky-600 transition-colors">
              Sign In
            </Link>
            <button
              type="button"
              onClick={() => setLegalModal("terms")}
              className="hover:text-sky-600 transition-colors focus-visible:outline-none focus-visible:underline"
            >
              License Terms
            </button>
            <button
              type="button"
              onClick={() => setLegalModal("privacy")}
              className="hover:text-sky-600 transition-colors focus-visible:outline-none focus-visible:underline"
            >
              Privacy Policy
            </button>
            <a
              href="https://developers.facebook.com/docs/instagram-platform/instagram-graph-api"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 hover:text-sky-600 transition-colors"
            >
              Meta API v21.0
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
        </div>
      </footer>

      {/* Legal Dialog Modal */}
      {legalModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="legal-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl max-w-lg w-full p-6 sm:p-8 space-y-4 relative text-left">
            <button
              type="button"
              onClick={() => setLegalModal(null)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Close dialog"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 id="legal-modal-title" className="text-lg font-black text-slate-900 tracking-tight">
              {legalModal === "terms" ? "License Terms & Scope ($10 Lifetime)" : "Privacy & Data Sovereignty"}
            </h3>

            <div className="text-xs text-slate-600 leading-relaxed space-y-3 max-h-[60vh] overflow-y-auto pr-2">
              {legalModal === "terms" ? (
                <>
                  <p>
                    <strong>1. License Scope:</strong> The $10 lifetime license grants personal and commercial rights to use RELO for the lifetime of the product version. There are zero contact scaling fees, subscriber tier penalties, or recurring monthly charges.
                  </p>
                  <p>
                    <strong>2. Self-Hosted & Serverless Deployment:</strong> RELO executes on Cloudflare Workers and D1 (or your customer-hosted Postgres instance). You maintain full sovereignty over your execution environment and API access keys.
                  </p>
                  <p>
                    <strong>3. Meta Compliance:</strong> Automation uses official Meta Graph API v21.0 endpoints. Creators must adhere to Meta’s Platform Terms, maintain active app authorization, and avoid spamming behaviors.
                  </p>
                </>
              ) : (
                <>
                  <p>
                    <strong>1. Data Sovereignty:</strong> We do not sell, rent, or monetize your creator leads, followers, or customer interaction records. All lead data is stored strictly in your dedicated instance.
                  </p>
                  <p>
                    <strong>2. Token Security:</strong> Connected Instagram Page and User Access Tokens are encrypted at rest using industry-standard AES-256-GCM authenticated encryption.
                  </p>
                  <p>
                    <strong>3. Zero Third-Party Trackers:</strong> RELO uses zero third-party advertising SDKs, cross-site trackers, or surveillance scripts.
                  </p>
                </>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                type="button"
                onClick={() => setLegalModal(null)}
                className="rounded-xl font-bold bg-sky-600 text-white hover:bg-sky-500 px-5"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
