import { useEffect, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { AlertTriangle, CheckCircle2, Database, ShieldAlert, Cpu, Sparkles, TrendingUp } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

export function ParallaxStory() {
  const containerRef = useRef<HTMLDivElement>(null);
  const card1Ref = useRef<HTMLDivElement>(null);
  const card2Ref = useRef<HTMLDivElement>(null);
  const card3Ref = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const glowOpacity = useTransform(scrollYProgress, [0.2, 0.5, 0.8], [0.1, 0.4, 0.1]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        card1Ref.current,
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          scrollTrigger: {
            trigger: card1Ref.current,
            start: "top 82%",
            toggleActions: "play none none reverse",
          },
        }
      );

      gsap.fromTo(
        card2Ref.current,
        { y: 70, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.9,
          delay: 0.1,
          scrollTrigger: {
            trigger: card2Ref.current,
            start: "top 80%",
            toggleActions: "play none none reverse",
          },
        }
      );

      gsap.fromTo(
        card3Ref.current,
        { y: 90, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1.0,
          delay: 0.2,
          scrollTrigger: {
            trigger: card3Ref.current,
            start: "top 78%",
            toggleActions: "play none none reverse",
          },
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={containerRef} className="relative py-28 md:py-36 overflow-hidden bg-slate-50/60 border-y border-slate-200/80">
      {/* Daylight Ambient Glow */}
      <motion.div
        style={{ opacity: glowOpacity }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] bg-gradient-to-r from-rose-400/10 via-sky-400/15 to-emerald-400/15 blur-[130px] pointer-events-none -z-10 rounded-full"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-bold text-slate-700 mb-4 shadow-sm">
            <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
            <span>Why The Old Model Is Broken</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight mb-6">
            The Dirty Secret of Traditional Chatbot Subscriptions
          </h2>
          <p className="text-slate-600 text-base sm:text-lg leading-relaxed font-medium">
            ManyChat and closed SaaS platforms punish your success. As soon as your Reel goes viral,
            they hold your leads hostage and hit you with endless upgrade popups.
          </p>
        </div>

        {/* 3-Column Parallax Narrative Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Card 1: The Trap */}
          <div
            ref={card1Ref}
            className="p-8 rounded-3xl bg-white border border-rose-200/90 shadow-[0_10px_30px_rgba(244,63,94,0.05)] relative overflow-hidden flex flex-col justify-between group hover:border-rose-400/60 transition-all duration-300"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center mb-6 text-rose-600 shadow-sm">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-rose-600">
                Phase 1: The Trap
              </span>
              <h3 className="text-xl font-bold text-slate-900 mt-1.5 mb-3">
                The &ldquo;Contact Tax&rdquo; Scam
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed font-medium">
                You pay $15/mo for 500 contacts. Your next Reel gets 3,000 comments. Instantly,
                your automations freeze until you upgrade to $45/mo, then $85/mo, then $150/mo.
                You are penalized for growing.
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-rose-100">
              <div className="flex items-center gap-2 text-xs font-bold text-rose-700">
                <ShieldAlert className="w-4 h-4" />
                <span>Average Creator Loss: $600–$1,800 every year</span>
              </div>
            </div>
          </div>

          {/* Card 2: The Breakthrough */}
          <div
            ref={card2Ref}
            className="p-8 rounded-3xl bg-white border border-blue-200/90 shadow-[0_10px_30px_rgba(2,132,199,0.06)] relative overflow-hidden flex flex-col justify-between group hover:border-blue-400/60 transition-all duration-300"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center mb-6 text-blue-600 shadow-sm">
                <Database className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                Phase 2: The Liberation
              </span>
              <h3 className="text-xl font-bold text-slate-900 mt-1.5 mb-3">
                Bring Your Own Database
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed font-medium">
                Why pay a platform when free cloud databases (Render, Supabase, Neon) give you 500MB
                for $0? Chat Flow AI routes your automations through your private backend.
                We charge zero monthly fees.
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-sky-100">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-700">
                <Cpu className="w-4 h-4 text-blue-600" />
                <span>100% Private: Your leads stay in your database</span>
              </div>
            </div>
          </div>

          {/* Card 3: The Superpower */}
          <div
            ref={card3Ref}
            className="p-8 rounded-3xl bg-white border border-emerald-200/90 shadow-[0_10px_30px_rgba(16,185,129,0.06)] relative overflow-hidden flex flex-col justify-between group hover:border-emerald-400/60 transition-all duration-300"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mb-6 text-emerald-600 shadow-sm">
                <Sparkles className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                Phase 3: The Superpower
              </span>
              <h3 className="text-xl font-bold text-slate-900 mt-1.5 mb-3">
                ManyChat-Grade Button Cards
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed font-medium">
                No boring plain text replies. Deliver official Instagram Interactive Cards with 1 to 3
                custom buttons (*&ldquo;Claim Discount&rdquo;*, *&ldquo;Watch Video&rdquo;*). Taps open links directly in Instagram with 92% CTR.
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-emerald-100">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-700">
                <CheckCircle2 className="w-4 h-4" />
                <span>3x Higher Link Clicks than plain text DMs</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
