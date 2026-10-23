"use client";

import React, { useState } from "react";
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Check,
  Flame,
  Star,
  Users,
  MessageCircle,
  ExternalLink,
  Layers,
  Heart,
  DollarSign,
  TrendingUp,
  Sliders,
  CheckCircle,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/lib/relo/theme";
import { FlowingGradientsCanvas } from "./FlowingGradientsCanvas";
import { LightDarkToggle } from "./LightDarkToggle";
import { ReelDMSimulator3D } from "./ReelDMSimulator3D";
import { ScrollableReelGallery } from "./ScrollableReelGallery";
import { Card3D } from "./Card3D";

interface LandingProps {
  navigate: (to: string) => void;
}

const NAV_ITEMS = [
  { id: "simulator", label: "Interactive Demo" },
  { id: "how-it-works", label: "How It Works" },
  { id: "campaigns", label: "Active Campaigns" },
  { id: "calculator", label: "Savings Calculator" },
  { id: "pricing", label: "Pricing" },
  { id: "faq", label: "FAQ" },
];

const FAQS = [
  {
    q: "How does RELO protect my Instagram account from bans?",
    a: "Unlike tools that blast identical bot messages with 0ms delay, RELO uses natural 30–90 second randomized human pauses and automatic sentence rotation. Every commenter receives a unique response, making your account look 100% human to Instagram.",
  },
  {
    q: "Why is RELO's subscription so much cheaper than ManyChat?",
    a: "ManyChat charges escalating monthly fees ($45, $95, up to $235/mo) as your audience grows. RELO gives you unlimited contacts and automated DMs for a flat ₹199/month on the Pro plan, with zero per-contact penalties.",
  },
  {
    q: "How does the Follower Gate work?",
    a: "When someone comments on your Reel, RELO checks if they follow your account before unlocking the link. If they don't follow you yet, it politely prompts them with a 1-tap follow request, rapidly converting viewers into loyal followers.",
  },
  {
    q: "How long does setup take?",
    a: "Under 60 seconds. Connect your Instagram, pick the Reel, type your trigger keyword (like 'LINK' or 'PRICE'), paste your link, and hit activate. That's it.",
  },
];

export function LandingPage({ navigate }: LandingProps) {
  const { isDark } = useTheme();
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [contacts, setContacts] = useState(15000);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Smooth scroll handler that accounts for floating navbar
  const scrollTo = (id: string) => {
    setMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Savings math
  const getManyChatMonthly = (count: number) => {
    if (count <= 500) return 15;
    if (count <= 2500) return 25;
    if (count <= 5000) return 45;
    if (count <= 10000) return 65;
    if (count <= 15000) return 95;
    if (count <= 25000) return 145;
    return 235;
  };

  const monthly = getManyChatMonthly(contacts);
  const twoYearsManyChat = monthly * 24;
  const reloMonthlyUSD = 2.4; // approx ₹199/month in USD
  const twoYearsRelo = reloMonthlyUSD * 24;
  const twoYearsSavings = twoYearsManyChat - twoYearsRelo;

  return (
    <div
      className={cn(
        "relative min-h-screen transition-colors duration-500 selection:bg-cyan-500/30",
        isDark ? "text-white" : "text-zinc-900"
      )}
    >
      {/* 60fps Live Tide Swirl Blue Flowing Gradient Background */}
      <FlowingGradientsCanvas variant="hero" />

      {/* Floating Pill Navigation Header */}
      <header className="sticky top-4 z-50 px-4 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div
            className={cn(
              "flex h-14 items-center justify-between rounded-full border px-4 pl-5 shadow-2xl backdrop-blur-2xl transition-all",
              isDark
                ? "border-white/12 bg-black/60 shadow-black/80"
                : "border-black/10 bg-white/75 shadow-zinc-200/80"
            )}
          >
            {/* Logo */}
            <div
              onClick={() => scrollTo("hero")}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <div className="size-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-sm text-white shadow-lg shadow-cyan-500/30 transition-transform group-hover:scale-105">
                R
              </div>
              <span className="font-extrabold tracking-tight text-lg">
                RELO<span className="text-cyan-400">.AI</span>
              </span>
            </div>

            {/* In-Page Navigation Buttons (Desktop) */}
            <nav className="hidden md:flex items-center gap-5 text-xs font-mono font-medium">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => scrollTo(item.id)}
                  className={cn(
                    "transition-colors hover:text-cyan-400 cursor-pointer",
                    isDark ? "text-white/70" : "text-zinc-700 hover:text-cyan-600"
                  )}
                >
                  {item.label}
                </button>
              ))}
            </nav>

            {/* Right Controls: Dark/Light Mode Toggle & Studio CTA & Mobile Toggle */}
            <div className="flex items-center gap-2 sm:gap-3">
              <LightDarkToggle />

              <button
                type="button"
                onClick={() => navigate("/studio?demo=1")}
                className="relative group overflow-hidden rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 px-3.5 sm:px-4 py-1.5 text-xs font-semibold text-white shadow-lg shadow-cyan-500/25 transition-all duration-300 hover:scale-105 hover:shadow-cyan-500/40 cursor-pointer"
              >
                <span className="relative z-10 flex items-center gap-1">
                  <span className="hidden sm:inline">Launch Demo</span>
                  <span className="sm:hidden">Studio</span>
                  <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
                </span>
              </button>

              {/* Mobile Hamburger Button */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={cn(
                  "flex size-9 items-center justify-center rounded-full border md:hidden transition-colors cursor-pointer",
                  isDark
                    ? "border-white/10 bg-white/5 text-white/80 hover:bg-white/10"
                    : "border-black/10 bg-black/5 text-zinc-800 hover:bg-black/10"
                )}
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
              </button>
            </div>
          </div>

          {/* Mobile Dropdown Menu Drawer */}
          {mobileMenuOpen && (
            <div
              className={cn(
                "mt-2 rounded-2xl border p-4 shadow-2xl backdrop-blur-2xl md:hidden transition-all animate-in fade-in slide-in-from-top-2 duration-200",
                isDark
                  ? "border-white/12 bg-black/80 text-white"
                  : "border-black/10 bg-white/95 text-zinc-900 shadow-xl"
              )}
            >
              <div className="flex flex-col gap-2">
                {NAV_ITEMS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => scrollTo(item.id)}
                    className={cn(
                      "flex items-center justify-between rounded-xl px-4 py-2.5 text-xs font-mono font-medium transition-colors text-left",
                      isDark
                        ? "hover:bg-white/10 text-white/80 hover:text-white"
                        : "hover:bg-black/5 text-zinc-700 hover:text-black"
                    )}
                  >
                    <span>{item.label}</span>
                    <ChevronRight className="size-3.5 opacity-40" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 px-4 sm:px-6 pt-12 pb-24 space-y-28 max-w-7xl mx-auto">
        {/* ── 1. Hero Section ────────────────────────────────────────────── */}
        <section id="hero" className="scroll-mt-28 text-center pt-8 sm:pt-16 max-w-4xl mx-auto space-y-7">
          {/* Badge */}
          <div
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-mono shadow-lg backdrop-blur-xl animate-in fade-in slide-in-from-top-4 duration-500",
              isDark
                ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-300"
                : "border-cyan-600/25 bg-cyan-50/80 text-cyan-800 shadow-sm"
            )}
          >
            <span className="size-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>100% Instagram Safe</span>
            <span className="opacity-40">·</span>
            <span>Flat ₹199/mo · Zero Contact Tax</span>
          </div>

          {/* Master Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.08]">
            Turn Reel comments into customers.{" "}
            <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500 bg-clip-text text-transparent italic font-serif font-normal">
              Hands-free.
            </span>
          </h1>

          <p
            className={cn(
              "max-w-2xl mx-auto text-base sm:text-lg leading-relaxed transition-colors",
              isDark ? "text-white/70" : "text-zinc-600"
            )}
          >
            Instantly send private links, discount codes, and digital guides whenever someone comments on your Instagram Reels. Human-safe delays prevent spam blocks. Flat plans from ₹199/month.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <button
              type="button"
              onClick={() => navigate("/studio?demo=1")}
              className="group relative flex items-center gap-2.5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 px-7 py-3.5 text-sm font-semibold text-white shadow-2xl shadow-cyan-500/30 transition-all duration-300 hover:scale-105 hover:shadow-cyan-500/50 cursor-pointer"
            >
              <span>Explore Live Dashboard Demo</span>
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </button>

            <button
              type="button"
              onClick={() => scrollTo("pricing")}
              className={cn(
                "rounded-full border px-6 py-3.5 text-sm font-semibold transition-all backdrop-blur-xl cursor-pointer",
                isDark
                  ? "border-white/15 bg-black/40 text-white/80 hover:bg-white/10 hover:text-white"
                  : "border-black/15 bg-white/80 text-zinc-800 hover:bg-white hover:text-black shadow-sm"
              )}
            >
              Pro Plan · ₹199/mo
            </button>
          </div>
        </section>

        {/* ── 2. Interactive 3D Reel Simulator ──────────────────────────── */}
        <section id="simulator" className="scroll-mt-28 pt-2">
          <div className="text-center mb-6">
            <span
              className={cn(
                "font-mono text-xs uppercase tracking-wider",
                isDark ? "text-cyan-400 font-semibold" : "text-sky-700 font-bold"
              )}
            >
              Live Interactive Playground
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold mt-1 tracking-tight">
              Test How a Comment Turns into a Direct Message
            </h2>
            <p className={cn("text-xs sm:text-sm mt-1 transition-colors", isDark ? "text-white/60" : "text-zinc-600")}>
              Click any keyword below to see the automated reply and follower verification in real-time.
            </p>
          </div>
          <ReelDMSimulator3D />
        </section>

        {/* ── 3. 4 Headline Metric Cards ────────────────────────────────── */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card3D
            intensity={10}
            className={cn(
              "p-5 backdrop-blur-xl transition-all duration-300",
              isDark
                ? "bg-black/60 border-white/12 text-white"
                : "bg-white/85 border-black/10 text-zinc-900 shadow-xl shadow-cyan-950/5"
            )}
          >
            <div
              className={cn(
                "text-[11px] font-mono uppercase tracking-wider",
                isDark ? "text-white/50" : "text-zinc-500 font-medium"
              )}
            >
              Delivery Speed
            </div>
            <div
              className={cn(
                "text-2xl sm:text-3xl font-extrabold font-mono mt-1",
                isDark ? "text-cyan-400" : "text-sky-600"
              )}
            >
              Under 15ms
            </div>
            <div
              className={cn(
                "text-xs mt-1 flex items-center gap-1 font-medium",
                isDark ? "text-emerald-400" : "text-emerald-600"
              )}
            >
              <Zap className="size-3" /> Instant edge response
            </div>
          </Card3D>

          <Card3D
            intensity={10}
            className={cn(
              "p-5 backdrop-blur-xl transition-all duration-300",
              isDark
                ? "bg-black/60 border-white/12 text-white"
                : "bg-white/85 border-black/10 text-zinc-900 shadow-xl shadow-cyan-950/5"
            )}
          >
            <div
              className={cn(
                "text-[11px] font-mono uppercase tracking-wider",
                isDark ? "text-white/50" : "text-zinc-500 font-medium"
              )}
            >
              Pro Plan
            </div>
            <div
              className={cn(
                "text-2xl sm:text-3xl font-extrabold font-mono mt-1",
                isDark ? "text-emerald-400" : "text-emerald-600"
              )}
            >
              ₹199 / mo
            </div>
            <div className={cn("text-xs mt-1", isDark ? "text-white/70" : "text-zinc-600")}>
              Flat fee · Unlimited contacts
            </div>
          </Card3D>

          <Card3D
            intensity={10}
            className={cn(
              "p-5 backdrop-blur-xl transition-all duration-300",
              isDark
                ? "bg-black/60 border-white/12 text-white"
                : "bg-white/85 border-black/10 text-zinc-900 shadow-xl shadow-cyan-950/5"
            )}
          >
            <div
              className={cn(
                "text-[11px] font-mono uppercase tracking-wider",
                isDark ? "text-white/50" : "text-zinc-500 font-medium"
              )}
            >
              Anti-Ban Delay
            </div>
            <div
              className={cn(
                "text-2xl sm:text-3xl font-extrabold font-mono mt-1",
                isDark ? "text-white" : "text-zinc-900"
              )}
            >
              30–90s
            </div>
            <div
              className={cn(
                "text-xs mt-1 flex items-center gap-1 font-medium",
                isDark ? "text-emerald-400" : "text-emerald-600"
              )}
            >
              <ShieldCheck className="size-3" /> Natural human jitter
            </div>
          </Card3D>

          <Card3D
            intensity={10}
            className={cn(
              "p-5 backdrop-blur-xl transition-all duration-300",
              isDark
                ? "bg-black/60 border-white/12 text-white"
                : "bg-white/85 border-black/10 text-zinc-900 shadow-xl shadow-cyan-950/5"
            )}
          >
            <div
              className={cn(
                "text-[11px] font-mono uppercase tracking-wider",
                isDark ? "text-white/50" : "text-zinc-500 font-medium"
              )}
            >
              Audience Limit
            </div>
            <div
              className={cn(
                "text-2xl sm:text-3xl font-extrabold font-mono mt-1",
                isDark ? "text-white" : "text-zinc-900"
              )}
            >
              Unlimited
            </div>
            <div className={cn("text-xs mt-1", isDark ? "text-white/70" : "text-zinc-600")}>
              Zero contact list caps
            </div>
          </Card3D>
        </section>

        {/* ── 4. How It Works: 3 Steps ──────────────────────────────────── */}
        <section id="how-it-works" className="scroll-mt-28 space-y-8">
          <div className="text-center max-w-2xl mx-auto">
            <span
              className={cn(
                "font-mono text-xs uppercase tracking-wider",
                isDark ? "text-cyan-400 font-semibold" : "text-sky-700 font-bold"
              )}
            >
              Simple 3-Step Setup
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-1">
              Ready in Under 60 Seconds
            </h2>
            <p className={cn("text-sm mt-2 transition-colors", isDark ? "text-white/70" : "text-zinc-600")}>
              No complicated flow charts or engineering degrees required.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <Card3D
              intensity={8}
              className={cn(
                "p-7 backdrop-blur-xl transition-all duration-300",
                isDark
                  ? "bg-black/60 border-white/12 text-white"
                  : "bg-white/85 border-black/10 text-zinc-900 shadow-xl shadow-cyan-950/5"
              )}
            >
              <div
                className={cn(
                  "size-10 rounded-xl flex items-center justify-center font-bold text-lg mb-5 border",
                  isDark
                    ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/30"
                    : "bg-cyan-50 text-sky-700 border-cyan-200 shadow-sm"
                )}
              >
                1
              </div>
              <h3 className={cn("text-lg font-bold", isDark ? "text-white" : "text-zinc-900")}>
                Pick Your Reel & Keyword
              </h3>
              <p className={cn("mt-2 text-xs leading-relaxed", isDark ? "text-white/70" : "text-zinc-600")}>
                Select your video and set the trigger word your audience will comment—like &quot;LINK&quot;, &quot;PRICE&quot;, or &quot;VIP&quot;.
              </p>
            </Card3D>

            <Card3D
              intensity={8}
              className={cn(
                "p-7 backdrop-blur-xl transition-all duration-300",
                isDark
                  ? "bg-black/60 border-white/12 text-white"
                  : "bg-white/85 border-black/10 text-zinc-900 shadow-xl shadow-cyan-950/5"
              )}
            >
              <div
                className={cn(
                  "size-10 rounded-xl flex items-center justify-center font-bold text-lg mb-5 border",
                  isDark
                    ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                    : "bg-blue-50 text-blue-700 border-blue-200 shadow-sm"
                )}
              >
                2
              </div>
              <h3 className={cn("text-lg font-bold", isDark ? "text-white" : "text-zinc-900")}>
                Attach Your Link & Offer
              </h3>
              <p className={cn("mt-2 text-xs leading-relaxed", isDark ? "text-white/70" : "text-zinc-600")}>
                Provide your destination URL, digital product, or calendar. Add up to 3 interactive action buttons in Direct Message.
              </p>
            </Card3D>

            <Card3D
              intensity={8}
              className={cn(
                "p-7 backdrop-blur-xl transition-all duration-300",
                isDark
                  ? "bg-black/60 border-white/12 text-white"
                  : "bg-white/85 border-black/10 text-zinc-900 shadow-xl shadow-cyan-950/5"
              )}
            >
              <div
                className={cn(
                  "size-10 rounded-xl flex items-center justify-center font-bold text-lg mb-5 border",
                  isDark
                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                    : "bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm"
                )}
              >
                3
              </div>
              <h3 className={cn("text-lg font-bold", isDark ? "text-white" : "text-zinc-900")}>
                Watch Conversions Roll In
              </h3>
              <p className={cn("mt-2 text-xs leading-relaxed", isDark ? "text-white/70" : "text-zinc-600")}>
                RELO replies to comments with natural sentence variations and delivers the DM automatically 24/7 while you sleep.
              </p>
            </Card3D>
          </div>
        </section>

        {/* ── 5. Side-by-Side Scrollable Reel Gallery (Fixed from 3-stack) ─ */}
        <section id="campaigns" className="scroll-mt-28 space-y-4">
          <div className="text-center max-w-xl mx-auto mb-2">
            <span
              className={cn(
                "font-mono text-xs uppercase tracking-wider",
                isDark ? "text-cyan-400 font-semibold" : "text-sky-700 font-bold"
              )}
            >
              Live Showcase
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-1">
              Active Reel Automation Gallery
            </h2>
            <p className={cn("text-xs sm:text-sm mt-1 transition-colors", isDark ? "text-white/70" : "text-zinc-600")}>
              Slide horizontally to inspect different campaign setups and conversion rates.
            </p>
          </div>

          <ScrollableReelGallery />
        </section>

        {/* ── 6. Savings Calculator ──────────────────────────────────────── */}
        <section id="calculator" className="scroll-mt-28 space-y-4">
          <div className="text-center max-w-xl mx-auto mb-4">
            <span
              className={cn(
                "font-mono text-xs uppercase tracking-wider",
                isDark ? "text-cyan-400 font-semibold" : "text-sky-700 font-bold"
              )}
            >
              The ManyChat Tax vs RELO
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-1">
              Calculate Your 24-Month Savings
            </h2>
          </div>

          <Card3D
            intensity={8}
            className={cn(
              "p-6 sm:p-8 backdrop-blur-2xl transition-all duration-300",
              isDark
                ? "bg-black/60 border-white/12 text-white"
                : "bg-white/85 border-black/10 text-zinc-900 shadow-2xl shadow-cyan-950/10"
            )}
          >
            <div
              className={cn(
                "flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b",
                isDark ? "border-white/8" : "border-black/8"
              )}
            >
              <div>
                <h3 className={cn("text-xl sm:text-2xl font-bold", isDark ? "text-white" : "text-zinc-900")}>
                  Stop Paying Monthly Rent for Your Own Leads
                </h3>
                <p className={cn("text-xs mt-1 max-w-xl", isDark ? "text-white/70" : "text-zinc-600")}>
                  Slide to select your active contact list size and see how much you save by switching to RELO.
                </p>
              </div>

              <div className="text-right">
                <div
                  className={cn(
                    "text-[11px] font-mono uppercase",
                    isDark ? "text-white/40" : "text-zinc-500 font-medium"
                  )}
                >
                  2-Year Savings
                </div>
                <div
                  className={cn(
                    "text-3xl sm:text-4xl font-extrabold font-mono mt-0.5",
                    isDark ? "text-cyan-400" : "text-sky-600"
                  )}
                >
                  +${twoYearsSavings.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </div>
              </div>
            </div>

            {/* Contact Slider */}
            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className={cn("font-medium", isDark ? "text-white/80" : "text-zinc-700")}>
                  Your Instagram Contact Size:
                </span>
                <span
                  className={cn(
                    "font-mono font-bold text-base px-3 py-1 rounded-xl border shadow-sm",
                    isDark
                      ? "text-cyan-300 bg-white/10 border-white/15"
                      : "text-sky-800 bg-sky-50 border-sky-200"
                  )}
                >
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
                className={cn(
                  "w-full h-2 rounded-lg appearance-none cursor-pointer accent-cyan-500",
                  isDark ? "bg-white/15" : "bg-zinc-200"
                )}
              />

              <div
                className={cn(
                  "flex justify-between text-[11px] font-mono",
                  isDark ? "text-white/40" : "text-zinc-500 font-medium"
                )}
              >
                <span>1,000</span>
                <span>15,000</span>
                <span>50,000+</span>
              </div>
            </div>

            {/* Comparison Cards */}
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div
                className={cn(
                  "rounded-2xl border p-5 transition-colors",
                  isDark
                    ? "border-rose-500/20 bg-rose-500/[0.04]"
                    : "border-rose-200 bg-rose-50/70 shadow-sm"
                )}
              >
                <div
                  className={cn(
                    "text-xs font-mono font-semibold mb-2",
                    isDark ? "text-rose-400" : "text-rose-700"
                  )}
                >
                  ManyChat Recurring Model
                </div>
                <div className={cn("text-2xl font-bold font-mono", isDark ? "text-white" : "text-zinc-900")}>
                  ${monthly}/mo
                </div>
                <div className={cn("text-xs mt-1", isDark ? "text-rose-300" : "text-rose-800")}>
                  Costs <strong>${twoYearsManyChat.toLocaleString()}</strong> over 24 months
                </div>
              </div>

              <div
                className={cn(
                  "rounded-2xl border p-5 shadow-lg transition-colors",
                  isDark
                    ? "border-emerald-500/30 bg-emerald-500/[0.08] shadow-emerald-500/10"
                    : "border-emerald-200 bg-emerald-50/80 shadow-emerald-500/10"
                )}
              >
                <div
                  className={cn(
                    "text-xs font-mono font-semibold mb-2",
                    isDark ? "text-emerald-400" : "text-emerald-700"
                  )}
                >
                  RELO Pro Plan
                </div>
                <div
                  className={cn(
                    "text-2xl font-bold font-mono",
                    isDark ? "text-emerald-400" : "text-emerald-600"
                  )}
                >
                  ₹199 / month
                </div>
                <div className={cn("text-xs mt-1", isDark ? "text-emerald-300" : "text-emerald-800")}>
                  <strong>Only ~₹4,776 over 24 months</strong> · Unlimited contacts
                </div>
              </div>
            </div>
          </Card3D>
        </section>

        {/* ── 7. Transparent Pricing ─────────────────────────────────────── */}
        <section id="pricing" className="scroll-mt-28 pt-4">
          <div className="text-center max-w-xl mx-auto mb-10">
            <span
              className={cn(
                "font-mono text-xs uppercase tracking-wider",
                isDark ? "text-cyan-400 font-semibold" : "text-sky-700 font-bold"
              )}
            >
              Simple Monthly Plans
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-1">
              Flat Monthly Pricing. No Contact Tax.
            </h2>
            <p className={cn("text-xs sm:text-sm mt-1 transition-colors", isDark ? "text-white/70" : "text-zinc-600")}>
              No per-contact fees. Cancel anytime. Full automation power.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
            {/* Free Starter */}
            <Card3D
              intensity={10}
              className={cn(
                "p-7 flex flex-col justify-between backdrop-blur-xl transition-all duration-300",
                isDark
                  ? "bg-black/60 border-white/10 text-white"
                  : "bg-white/85 border-black/10 text-zinc-900 shadow-xl shadow-cyan-950/5"
              )}
            >
              <div>
                <div
                  className={cn(
                    "text-xs font-mono uppercase mb-1",
                    isDark ? "text-white/50" : "text-zinc-500 font-medium"
                  )}
                >
                  Testing
                </div>
                <h3 className={cn("text-xl font-bold", isDark ? "text-white" : "text-zinc-900")}>
                  Free Starter
                </h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className={cn("text-4xl font-extrabold font-mono", isDark ? "text-white" : "text-zinc-900")}>
                    ₹0
                  </span>
                  <span className={cn("text-xs font-mono", isDark ? "text-white/50" : "text-zinc-500")}>
                    / forever
                  </span>
                </div>
                <p className={cn("mt-2 text-xs", isDark ? "text-white/70" : "text-zinc-600")}>
                  Ideal for testing your first Instagram Reel DM automation.
                </p>

                <div className={cn("mt-6 space-y-2.5 text-xs", isDark ? "text-white/80" : "text-zinc-700")}>
                  <div className="flex items-center gap-2">
                    <Check className="size-4 text-emerald-500 shrink-0" /> 1 Connected Account
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="size-4 text-emerald-500 shrink-0" /> 1 Active Reel Automation
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="size-4 text-emerald-500 shrink-0" /> Up to 100 Contacts/mo
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="size-4 text-emerald-500 shrink-0" /> 30–90s Human Anti-Spam Jitter
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="size-4 text-emerald-500 shrink-0" /> 3-Button Template Cards
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate("/studio?demo=1")}
                className={cn(
                  "mt-8 w-full rounded-xl border py-2.5 text-xs font-semibold transition-colors cursor-pointer",
                  isDark
                    ? "border-white/15 bg-white/5 text-white hover:bg-white/10"
                    : "border-black/10 bg-black/5 text-zinc-800 hover:bg-black/10 shadow-sm"
                )}
              >
                Start Free
              </button>
            </Card3D>

            {/* Pro Plan (Featured) */}
            <Card3D
              intensity={12}
              className={cn(
                "p-7 flex flex-col justify-between relative shadow-2xl transition-all duration-300",
                isDark
                  ? "bg-gradient-to-b from-cyan-950/40 via-black/80 to-black/90 border-cyan-400/40 text-white shadow-cyan-500/10"
                  : "bg-gradient-to-b from-cyan-50/80 via-white to-sky-50/50 border-cyan-500/40 text-zinc-900 shadow-2xl shadow-cyan-500/15"
              )}
            >
              <div className="absolute top-4 right-4">
                <span className="rounded-full bg-cyan-400 px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-black shadow-md">
                  Most Popular
                </span>
              </div>

              <div>
                <div
                  className={cn(
                    "text-xs font-mono uppercase mb-1",
                    isDark ? "text-cyan-300" : "text-sky-700 font-bold"
                  )}
                >
                  For Creators & Growth
                </div>
                <h3 className={cn("text-xl font-bold", isDark ? "text-white" : "text-zinc-900")}>
                  Pro Plan
                </h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span
                    className={cn(
                      "text-4xl font-extrabold font-mono",
                      isDark ? "text-cyan-400" : "text-sky-600"
                    )}
                  >
                    ₹199
                  </span>
                  <span className={cn("text-xs font-mono", isDark ? "text-white/50" : "text-zinc-500")}>
                    / month
                  </span>
                </div>
                <p className={cn("mt-2 text-xs", isDark ? "text-white/70" : "text-zinc-600")}>
                  Full power automation for your personal brand or business.
                </p>

                <div className={cn("mt-6 space-y-2.5 text-xs", isDark ? "text-white/90" : "text-zinc-800")}>
                  <div className="flex items-center gap-2 font-semibold">
                    <Check className="size-4 text-emerald-500 shrink-0" /> 1 Connected Account
                  </div>
                  <div className="flex items-center gap-2 font-semibold">
                    <Check className="size-4 text-emerald-500 shrink-0" /> Unlimited Active Reels
                  </div>
                  <div className="flex items-center gap-2 font-semibold">
                    <Check className="size-4 text-emerald-500 shrink-0" /> Unlimited Contacts & Leads
                  </div>
                  <div className="flex items-center gap-2 font-semibold">
                    <Check className="size-4 text-emerald-500 shrink-0" /> Follower Gate Verification
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="size-4 text-emerald-500 shrink-0" /> Smart Comment Variation Spinner
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="size-4 text-emerald-500 shrink-0" /> Instant CSV Lead Vault Export
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate("/studio?demo=1")}
                className="mt-8 w-full group relative overflow-hidden rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 py-3 text-xs font-bold text-white shadow-xl shadow-cyan-500/30 transition-all hover:scale-[1.02] cursor-pointer"
              >
                <span>Get Pro Plan · ₹199/mo</span>
              </button>
            </Card3D>

            {/* Max Plan (replacing Agency Studio) */}
            <Card3D
              intensity={10}
              className={cn(
                "p-7 flex flex-col justify-between backdrop-blur-xl transition-all duration-300",
                isDark
                  ? "bg-black/60 border-white/10 text-white"
                  : "bg-white/85 border-black/10 text-zinc-900 shadow-xl shadow-cyan-950/5"
              )}
            >
              <div>
                <div
                  className={cn(
                    "text-xs font-mono uppercase mb-1",
                    isDark ? "text-white/50" : "text-zinc-500 font-medium"
                  )}
                >
                  High Volume & Brands
                </div>
                <h3 className={cn("text-xl font-bold", isDark ? "text-white" : "text-zinc-900")}>
                  Max Plan
                </h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className={cn("text-4xl font-extrabold font-mono", isDark ? "text-white" : "text-zinc-900")}>
                    ₹499
                  </span>
                  <span className={cn("text-xs font-mono", isDark ? "text-white/50" : "text-zinc-500")}>
                    / month
                  </span>
                </div>
                <p className={cn("mt-2 text-xs", isDark ? "text-white/70" : "text-zinc-600")}>
                  For high-traffic creators and businesses requiring priority throughput and AI.
                </p>

                <div className={cn("mt-6 space-y-2.5 text-xs", isDark ? "text-white/80" : "text-zinc-700")}>
                  <div className="flex items-center gap-2">
                    <Check className="size-4 text-emerald-500 shrink-0" /> 1 High-Volume Account
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="size-4 text-emerald-500 shrink-0" /> Everything in Pro Included
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="size-4 text-emerald-500 shrink-0" /> Priority Edge DM Delivery (&lt;15ms)
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="size-4 text-emerald-500 shrink-0" /> AI Dynamic Reply Variations
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="size-4 text-emerald-500 shrink-0" /> Webhook & CRM Export
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="size-4 text-emerald-500 shrink-0" /> 24/7 Priority Support
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate("/studio?demo=1")}
                className={cn(
                  "mt-8 w-full rounded-xl border py-2.5 text-xs font-semibold transition-colors cursor-pointer",
                  isDark
                    ? "border-white/15 bg-white/5 text-white hover:bg-white/10"
                    : "border-black/10 bg-black/5 text-zinc-800 hover:bg-black/10 shadow-sm"
                )}
              >
                Get Max Plan · ₹499/mo
              </button>
            </Card3D>
          </div>
        </section>

        {/* ── 8. FAQ Accordion ───────────────────────────────────────────── */}
        <section id="faq" className="scroll-mt-28 max-w-3xl mx-auto space-y-4 pt-4">
          <div className="text-center mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-3">
            {FAQS.map((item, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className={cn(
                    "rounded-2xl border overflow-hidden backdrop-blur-xl transition-all duration-200",
                    isDark
                      ? "border-white/10 bg-black/40 text-white"
                      : "border-black/10 bg-white/80 text-zinc-900 shadow-md shadow-zinc-200/50"
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className={cn(
                      "w-full flex items-center justify-between p-5 text-left text-sm font-semibold transition-colors cursor-pointer",
                      isDark
                        ? "text-white hover:bg-white/5"
                        : "text-zinc-900 hover:bg-zinc-50"
                    )}
                  >
                    <span>{item.q}</span>
                    <ChevronDown
                      className={cn(
                        "size-4 transition-transform duration-200 shrink-0 ml-4",
                        isDark ? "text-white/50" : "text-zinc-400",
                        isOpen && (isDark ? "rotate-180 text-white" : "rotate-180 text-zinc-900")
                      )}
                    />
                  </button>
                  {isOpen && (
                    <div
                      className={cn(
                        "px-5 pb-5 pt-1 text-xs sm:text-sm leading-relaxed border-t",
                        isDark
                          ? "text-white/70 border-white/6"
                          : "text-zinc-600 border-black/6"
                      )}
                    >
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* Modern Adaptive Footer */}
      <footer
        className={cn(
          "border-t backdrop-blur-2xl px-6 py-10 text-xs font-mono transition-colors",
          isDark
            ? "border-white/8 bg-black/80 text-white/50"
            : "border-black/10 bg-white/85 text-zinc-600 shadow-lg"
        )}
      >
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="size-6 rounded-lg bg-cyan-500/20 text-cyan-500 flex items-center justify-center font-bold text-xs">
              R
            </div>
            <span className={cn("font-bold tracking-tight", isDark ? "text-white" : "text-zinc-900")}>
              RELO AI
            </span>
            <span>· Instagram Comment Automation Studio</span>
          </div>

          <div className="flex items-center gap-6">
            <button
              onClick={() => navigate("/privacy")}
              className={cn("transition-colors cursor-pointer", isDark ? "hover:text-white" : "hover:text-zinc-900")}
            >
              Privacy
            </button>
            <button
              onClick={() => navigate("/terms")}
              className={cn("transition-colors cursor-pointer", isDark ? "hover:text-white" : "hover:text-zinc-900")}
            >
              Terms
            </button>
            <button
              onClick={() => navigate("/cookies")}
              className={cn("transition-colors cursor-pointer", isDark ? "hover:text-white" : "hover:text-zinc-900")}
            >
              Cookies
            </button>
            <button
              onClick={() => navigate("/studio?demo=1")}
              className="text-cyan-500 hover:underline font-semibold cursor-pointer"
            >
              Launch Studio
            </button>
          </div>

          <div>
            <span>© {new Date().getFullYear()} RELO AI. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
