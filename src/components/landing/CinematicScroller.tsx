import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { updateGlobalScroll } from "./3d/CinematicCanvas";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router";
import {
  ArrowRight,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Cpu,
  Layers,
  MousePointerClick,
  ExternalLink,
  Crown,
} from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

/**
 * DOM/UI layer of the film: four scenes floating over the dark 3D world.
 * GSAP scrub drives scroll progress → the WebGL timeline (fully scrubbable).
 * Copy is product-honest: $10 lifetime, BYO backend, Instagram-only.
 */
export function CinematicScroller() {
  const navigate = useNavigate();
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!wrapperRef.current) return;
    const trigger = ScrollTrigger.create({
      trigger: wrapperRef.current,
      start: "top top",
      end: "bottom bottom",
      scrub: 0.5,
      onUpdate: (self) => {
        updateGlobalScroll(self.progress);
      },
    });
    return () => {
      trigger.kill();
    };
  }, []);

  return (
    <div ref={wrapperRef} className="relative z-10 w-full text-slate-900">
      {/* ================= SCENE 1: THE SIGNAL ================= */}
      <section className="min-h-screen flex flex-col justify-center items-start max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20 pointer-events-none">
        <div className="max-w-xl lg:max-w-[580px] pointer-events-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-50 border border-slate-200 backdrop-blur-xl text-xs font-bold mb-6"
          >
            <Sparkles className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
            <span className="text-sky-700 font-extrabold">Meta Official DM Architecture</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-slate-500 font-medium">Scroll to play the film</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-4xl sm:text-6xl xl:text-7xl font-black tracking-tight text-slate-900 leading-[1.06] mb-6"
          >
            Stop Paying{" "}
            <span className="line-through decoration-red-500/80 text-slate-500 font-bold">
              $180/Year
            </span>{" "}
            to ManyChat.
            <br />
            <span className="bg-gradient-to-r from-sky-600 via-sky-600 to-emerald-600 bg-clip-text text-transparent">
              Own Your Automation for $10 Once.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-lg sm:text-xl text-slate-600 mb-8 leading-relaxed font-medium"
          >
            Bring your own backend (Render, Railway, Supabase). Connect your Instagram using our{" "}
            <strong className="text-slate-900 font-bold">Meta-Approved App</strong>. Deliver expressive,{" "}
            <span className="text-sky-700 font-bold underline decoration-sky-400/40">
              on-brand DM replies
            </span>{" "}
            with zero monthly subscriptions, zero contact limits, and 100% private data.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 mb-10"
          >
            <Button
              size="lg"
              onClick={() => navigate("/auth")}
              className="h-14 px-8 text-base font-bold rounded-xl bg-gradient-to-r from-sky-500 via-cyan-500 to-emerald-500 hover:from-sky-400 hover:to-emerald-400 text-white shadow-xl shadow-cyan-500/25 border-0 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
            >
              <span>Claim $10 Lifetime License</span>
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>

            <div className="inline-flex items-center px-4 py-3 text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200 rounded-xl backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping mr-2.5" />
              Scroll — the camera is rolling ↓
            </div>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs font-semibold text-slate-500 pt-5 border-t border-slate-200">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Meta Business Approved</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
              <span>Unlimited DMs Forever</span>
            </div>
            <div className="flex items-center gap-2 col-span-2 sm:col-span-1">
              <Layers className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>You Own the Backend</span>
            </div>
          </div>
        </div>
      </section>

      {/* ================= SCENE 2: YOUR BACKEND ASSEMBLES ================= */}
      <section className="min-h-screen flex flex-col justify-center items-start max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-28 pointer-events-none">
        <div className="max-w-lg pointer-events-auto p-8 sm:p-10 rounded-3xl bg-white/95 backdrop-blur-2xl border border-slate-200 shadow-[0_20px_60px_rgba(0,0,0,0.08)] text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-50 border border-sky-200 text-xs font-bold text-sky-700 mb-4">
            <Cpu className="w-3.5 h-3.5" />
            <span>Scene 2: Your Backend Assembles</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight mb-4">
            Your Infrastructure.<br />
            <span className="text-sky-700">Clicking Into Place.</span>
          </h2>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-medium mb-6">
            Watch the three chrome satellites lock into orbit — that&apos;s your backend coming together:
            your database, your queue and worker, your webhook receiver. Your tokens and keys
            never leave infrastructure you control.
          </p>

          <div className="space-y-2.5 mb-6 text-xs font-semibold text-slate-200">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
                <span>Postgres ➔ your database, your data</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[10px] font-bold">Yours</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span>Queue + worker ➔ your automation engine</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-sky-100 text-sky-700 text-[10px] font-bold">No Redis needed</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span>Webhooks ➔ Meta events, deduplicated</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-white/10 text-slate-600 text-[10px] font-bold">Free-tier tuned</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-sky-50 border border-sky-200 flex items-center gap-2.5 text-xs text-sky-800 font-bold">
            <ShieldCheck className="w-4 h-4 text-sky-700 shrink-0" />
            <span>One Docker container plus Postgres — deployable to Railway, Render, Fly.io, or any VPS.</span>
          </div>
        </div>
      </section>

      {/* ================= SCENE 3: THE SEND ================= */}
      <section className="min-h-screen flex flex-col justify-center items-start max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-28 pointer-events-none">
        <div className="max-w-lg pointer-events-auto p-8 sm:p-10 rounded-3xl bg-white/95 backdrop-blur-2xl border border-slate-200 shadow-[0_20px_60px_rgba(0,0,0,0.08)] text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-700 mb-4">
            <MousePointerClick className="w-3.5 h-3.5" />
            <span>Scene 3: The Send</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight mb-4">
            Replies That Land.<br />
            <span className="text-emerald-700">Flying Past the Camera.</span>
          </h2>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-medium mb-6">
            Track alongside three glass DM cards as they launch toward the viewer.
            Keyword-matched, personalized with the commenter&apos;s name, optionally AI-written —
            each DM is logged with its outcome so you always know what went out.
          </p>

          <div className="space-y-2 mb-6">
            <div className="p-3 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 text-white font-bold text-xs flex items-center justify-between shadow-lg shadow-sky-500/20">
              <span>Card 1: 👉 Access Free Notion Masterclass</span>
              <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded flex items-center gap-1">
                <ExternalLink className="w-2.5 h-2.5" /> Direct URL
              </span>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500 text-white font-bold text-xs flex items-center justify-between shadow-lg shadow-emerald-500/20">
              <span>Card 2: 🔥 Claim 50% Off Lifetime Discount</span>
              <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded">Promo Code</span>
            </div>
            <div className="p-3 rounded-xl bg-white border-2 border-slate-200 text-slate-900 font-bold text-xs flex items-center justify-between shadow-lg">
              <span>Card 3: 🔗 View Pricing &amp; Details</span>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">Your Link</span>
            </div>
          </div>

          <p className="text-xs text-slate-500 font-semibold">
            ✨ Every reply puts your link one tap away, right inside the Instagram chat.
          </p>
        </div>
      </section>

      {/* ================= SCENE 4: OWNERSHIP (FINALE) ================= */}
      <section className="min-h-screen flex flex-col justify-end items-center max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 pt-32 text-center pointer-events-none">
        <div className="pointer-events-auto p-8 sm:p-10 rounded-3xl bg-white/95 backdrop-blur-2xl border border-emerald-200 shadow-[0_30px_80px_rgba(16,185,129,0.18)]">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-500 text-white text-xs font-extrabold mb-4 shadow-sm">
            <Crown className="w-3.5 h-3.5" />
            <span>Finale: Ownership</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight mb-4">
            $10 Once. Infinite DMs. Forever.
          </h2>

          <p className="text-slate-600 text-base sm:text-lg font-medium max-w-xl mx-auto mb-8">
            The emerald crystal settling above represents absolute ownership.
            ManyChat charges $180 to $1,200 every single year. Chat Flow AI gives you lifetime software access for $10 one-time.
          </p>

          <Button
            size="lg"
            onClick={() => navigate("/auth")}
            className="h-14 px-10 rounded-xl text-base font-extrabold bg-gradient-to-r from-sky-500 via-cyan-500 to-emerald-500 hover:from-sky-400 hover:to-emerald-400 text-white shadow-xl shadow-emerald-500/25 border-0 hover:scale-105 transition-all mb-4 cursor-pointer"
          >
            <span>Claim $10 Lifetime Access Now</span>
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>

          <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Instant Setup • 1-Click Meta Approved Connect • 100% Private</span>
          </div>
        </div>
      </section>
    </div>
  );
}
