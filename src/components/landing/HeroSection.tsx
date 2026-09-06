import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Zap, Layers, Sparkles, ExternalLink, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router";
import { HeroScene } from "./3d/HeroScene";

export function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-[92vh] pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden flex items-center bg-gradient-to-b from-white via-slate-50/70 to-white">
      {/* Daylight Ambient Gradients (Sky, Cyan, Mint) */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[550px] bg-gradient-to-br from-sky-400/15 via-blue-500/10 to-emerald-400/15 blur-[120px] pointer-events-none -z-10 rounded-full" />
      <div className="absolute top-1/3 -left-40 w-96 h-96 bg-cyan-400/15 blur-[100px] pointer-events-none -z-10 rounded-full" />
      <div className="absolute top-2/3 -right-40 w-96 h-96 bg-emerald-400/15 blur-[100px] pointer-events-none -z-10 rounded-full" />

      {/* Elegant Light Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a08_1px,transparent_1px),linear-gradient(to_bottom,#0f172a08_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Value Prop & CTAs */}
          <div className="lg:col-span-7 flex flex-col items-start text-left z-10">
            
            {/* Top Pill */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 border border-slate-200 shadow-sm text-xs font-bold text-slate-700 mb-6 backdrop-blur-md"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
              <span className="text-blue-600 font-extrabold">The Anti-Subscription Movement</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-slate-600 font-medium">No monthly contact taxes</span>
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-6xl xl:text-7xl font-black tracking-tight text-slate-900 leading-[1.08] mb-6"
            >
              Stop Paying{" "}
              <span className="line-through decoration-red-500/80 text-slate-400 font-bold">
                $180/Year
              </span>{" "}
              to ManyChat.
              <br />
              <span className="bg-gradient-to-r from-blue-600 via-sky-600 to-emerald-600 bg-clip-text text-transparent">
                Own Your Automation for $19 Once.
              </span>
            </motion.h1>

            {/* Subhead */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg sm:text-xl text-slate-600 mb-8 max-w-2xl leading-relaxed font-normal"
            >
              Bring your own free database (Render, Railway, Supabase). Connect your Instagram using our
              <strong className="text-slate-900 font-bold"> Meta-Approved App</strong>. Send official{" "}
              <span className="text-blue-600 font-bold underline decoration-blue-400/40">
                3-Button Interactive Cards
              </span>{" "}
              with zero monthly subscriptions, zero contact limits, and 100% private data.
            </motion.p>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mb-10"
            >
              <Button
                size="lg"
                onClick={() => navigate("/auth")}
                className="h-14 px-8 text-base font-bold rounded-xl bg-gradient-to-r from-blue-600 via-sky-600 to-emerald-500 hover:from-blue-700 hover:to-emerald-600 text-white shadow-xl shadow-blue-600/25 border-0 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <span>Claim $19 Lifetime License</span>
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>

              <a
                href="#interactive-demo"
                className="inline-flex items-center justify-center h-14 px-7 text-base font-bold rounded-xl bg-white hover:bg-slate-50 text-slate-800 border-2 border-slate-200 hover:border-slate-300 shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Zap className="w-4 h-4 mr-2 text-blue-600" />
                <span>Test Live 3D Demo</span>
              </a>
            </motion.div>

            {/* Micro-Trust Badges */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs font-semibold text-slate-600 pt-5 border-t border-slate-200 w-full max-w-xl"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Meta Business Approved</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Unlimited DMs Forever</span>
              </div>
              <div className="flex items-center gap-2 col-span-2 sm:col-span-1">
                <Layers className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>3x Multi-Backend Pool</span>
              </div>
            </motion.div>

          </div>

          {/* Right Column: Interactive 3D Canvas + Overlay UI */}
          <div className="lg:col-span-5 relative w-full h-full min-h-[480px] lg:min-h-[580px] flex items-center justify-center">
            
            {/* 3D Scene */}
            <HeroScene />

            {/* Floating Live Simulation Overlay Card 1: Incoming Comment */}
            <motion.div
              initial={{ opacity: 0, x: 30, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="absolute top-8 -left-4 sm:left-4 z-20 max-w-[260px] p-4 rounded-2xl bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-[0_12px_36px_rgba(0,0,0,0.08)]"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-sky-500 to-emerald-400 flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
                  @
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-900">@viral_creator</span>
                  <span className="text-[10px] text-slate-500 font-medium">Reel Comment • Just now</span>
                </div>
              </div>
              <p className="text-xs text-slate-800 font-semibold pl-8">
                &ldquo;SEND ME THE TEMPLATE! 🔥&rdquo;
              </p>
              <div className="mt-2 pl-8 flex items-center gap-1.5 text-[10px] font-bold text-emerald-600">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                <span>Matched Keyword: TEMPLATE</span>
              </div>
            </motion.div>

            {/* Floating Live Simulation Overlay Card 2: Interactive Button Card Output */}
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.7 }}
              className="absolute -bottom-4 -right-2 sm:right-4 z-20 max-w-[280px] p-4 rounded-2xl bg-white/95 backdrop-blur-xl border border-sky-400/40 shadow-[0_15px_45px_rgba(2,132,199,0.12)]"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-blue-600" />
                  Instant DM Delivered (0.3s)
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 font-bold font-mono border border-sky-200">
                  Generic Template
                </span>
              </div>
              <p className="text-xs font-bold text-slate-900 mb-2.5">
                Hey @viral_creator! Here is your 2026 Growth Playbook 👇
              </p>

              {/* 2 Action Buttons */}
              <div className="space-y-1.5">
                <div className="px-3 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-emerald-500 text-[11px] font-bold text-white text-center flex items-center justify-center gap-1 shadow-md shadow-blue-500/20">
                  <span>👉 Download Free PDF</span>
                  <ExternalLink className="w-3 h-3" />
                </div>
                <div className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-[11px] font-bold text-slate-800 text-center flex items-center justify-center gap-1 border border-slate-200">
                  <span>🔥 Claim 50% Off Code</span>
                </div>
              </div>
            </motion.div>

          </div>

        </div>
      </div>
    </section>
  );
}
