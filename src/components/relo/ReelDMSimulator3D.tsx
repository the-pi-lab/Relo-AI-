"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  ShieldCheck,
  Zap,
  Send,
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  CheckCircle2,
  Lock,
  ArrowRight,
  RefreshCw,
  Sliders,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useGradientPreset } from "@/lib/relo/gradients";
import { useTheme } from "@/lib/relo/theme";

const SAMPLE_TRIGGERS = [
  { keyword: "LINK", comment: "send the link please!!", action: "Access Granted" },
  { keyword: "PRICE", comment: "how much is this? looking to join", action: "Pricing Sheet" },
  { keyword: "VIP", comment: "VIP pass please! love your work", action: "VIP Access" },
  { keyword: "EBOOK", comment: "Can I get the free guide?", action: "PDF Delivered" },
];

export function ReelDMSimulator3D({ className }: { className?: string }) {
  const { preset } = useGradientPreset();
  const { isDark } = useTheme();
  const [activeTrigger, setActiveTrigger] = useState(SAMPLE_TRIGGERS[0]);
  const [step, setStep] = useState<"idle" | "matched" | "jitter" | "delivered">("delivered");
  const [jitterTime, setJitterTime] = useState(48);
  const [customComment, setCustomComment] = useState("");
  const [hasFollowed, setHasFollowed] = useState(true);
  const [clickCount, setClickCount] = useState(1842);
  const [liked, setLiked] = useState(true);

  // Auto progression demo or manual trigger
  const runSimulation = (trig = activeTrigger) => {
    setActiveTrigger(trig);
    setStep("matched");
    setJitterTime(42);

    const t1 = setTimeout(() => {
      setStep("jitter");
    }, 600);

    const t2 = setTimeout(() => {
      setStep("delivered");
      setClickCount((c) => c + 1);
    }, 2200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  };

  return (
    <div className={cn("relative mx-auto w-full max-w-xl", className)}>
      {/* Outer dimensional ambient glow behind phone chassis */}
      <div
        aria-hidden="true"
        className="absolute -inset-4 rounded-3xl opacity-40 blur-2xl transition-colors duration-700 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${preset.accentColor}, transparent 70%)`,
        }}
      />

      {/* 3D Physical Chassis */}
      <div
        style={{
          boxShadow: isDark
            ? `0 30px 100px -20px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.12), inset 0 1px 0 rgba(255,255,255,0.2)`
            : `0 30px 80px -20px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.8)`,
        }}
        className={cn(
          "relative overflow-hidden rounded-[28px] border backdrop-blur-2xl p-5 sm:p-6 transition-all duration-300",
          isDark
            ? "border-white/12 bg-black/75 text-white"
            : "border-black/10 bg-white/90 text-zinc-900 shadow-2xl shadow-cyan-950/10"
        )}
      >
        {/* Top bar with simulation controls and status */}
        <div
          className={cn(
            "flex items-center justify-between pb-4 mb-5 border-b",
            isDark ? "border-white/8" : "border-black/8"
          )}
        >
          <div className="flex items-center gap-2.5">
            <span className="relative flex size-2.5">
              <span
                className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
                style={{ backgroundColor: preset.accentColor }}
              />
              <span
                className="relative inline-flex size-2.5 rounded-full"
                style={{ backgroundColor: preset.accentColor }}
              />
            </span>
            <span
              className={cn(
                "font-mono text-[11px] font-semibold uppercase tracking-wider",
                isDark ? "text-white/90" : "text-zinc-800"
              )}
            >
              Live Reel & DM Simulator · Interactive
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-mono text-emerald-500 font-medium flex items-center gap-1">
              <ShieldCheck className="size-3" /> Anti-Spam Active
            </span>
            <button
              onClick={() => runSimulation()}
              type="button"
              className={cn(
                "group flex size-7 items-center justify-center rounded-full border transition-all",
                isDark
                  ? "border-white/10 bg-white/5 text-white/60 hover:border-white/20 hover:bg-white/10 hover:text-white"
                  : "border-black/10 bg-black/5 text-zinc-600 hover:border-black/20 hover:bg-black/10 hover:text-zinc-900"
              )}
              title="Re-run simulation"
            >
              <RefreshCw className="size-3 transition-transform group-hover:rotate-180 duration-500" />
            </button>
          </div>
        </div>

        {/* Trigger chips bar */}
        <div className="mb-5">
          <div
            className={cn(
              "text-[11px] font-mono uppercase tracking-wider mb-2 flex items-center justify-between",
              isDark ? "text-white/40" : "text-zinc-500"
            )}
          >
            <span>Test a Reel Comment:</span>
            <span className="text-[10px]">Click to fire</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_TRIGGERS.map((item) => (
              <button
                key={item.keyword}
                type="button"
                onClick={() => runSimulation(item)}
                className={cn(
                  "flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-mono transition-all duration-200 border cursor-pointer",
                  activeTrigger.keyword === item.keyword
                    ? isDark
                      ? "border-white/30 bg-white/15 text-white font-semibold shadow-md shadow-black/40 scale-105"
                      : "border-cyan-500/50 bg-cyan-500/15 text-cyan-900 font-bold shadow-md shadow-cyan-500/15 scale-105"
                    : isDark
                    ? "border-white/6 bg-white/3 text-white/60 hover:border-white/15 hover:bg-white/8 hover:text-white"
                    : "border-black/6 bg-black/[0.03] text-zinc-600 hover:border-black/15 hover:bg-black/[0.06] hover:text-zinc-900"
                )}
              >
                <Zap className="size-3" style={{ color: preset.accentColor }} />
                <span>&quot;{item.keyword}&quot;</span>
              </button>
            ))}
          </div>
        </div>

        {/* Simulated Reel Comment Event */}
        <div
          className={cn(
            "relative mb-4 rounded-2xl border p-4 transition-colors",
            isDark ? "border-white/8 bg-white/[0.03]" : "border-black/8 bg-black/[0.02]"
          )}
        >
          <div className="flex items-start gap-3">
            <div className="size-9 rounded-full bg-gradient-to-tr from-purple-600 to-amber-500 p-0.5 shrink-0">
              <div className="size-full rounded-full bg-black flex items-center justify-center font-bold text-xs text-white">
                MK
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span
                  className={cn(
                    "text-xs font-semibold",
                    isDark ? "text-white/90" : "text-zinc-900"
                  )}
                >
                  @maya_creator
                </span>
                <span
                  className={cn(
                    "text-[10px] font-mono",
                    isDark ? "text-white/40" : "text-zinc-400"
                  )}
                >
                  just now
                </span>
              </div>
              <p
                className={cn(
                  "mt-1 text-sm",
                  isDark ? "text-white/80" : "text-zinc-700"
                )}
              >
                {activeTrigger.comment}
              </p>

              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                <span
                  className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-mono uppercase font-semibold"
                  style={{
                    backgroundColor: `${preset.accentColor}20`,
                    color: isDark ? preset.accentColor : "#0284c7",
                    border: `1px solid ${preset.accentColor}40`,
                  }}
                >
                  <Sparkles className="size-2.5" /> Trigger: {activeTrigger.keyword}
                </span>

                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-mono",
                    isDark
                      ? "bg-white/5 border-white/10 text-white/60"
                      : "bg-black/[0.04] border-black/10 text-zinc-600"
                  )}
                >
                  <ShieldCheck className="size-2.5 text-emerald-500" /> Follower Verified
                </span>
              </div>
            </div>

            <button
              onClick={() => setLiked(!liked)}
              className={cn(
                "transition-colors p-1",
                isDark ? "text-white/40 hover:text-rose-500" : "text-zinc-400 hover:text-rose-500"
              )}
            >
              <Heart className={cn("size-4", liked && "text-rose-500 fill-rose-500")} />
            </button>
          </div>
        </div>

        {/* Anti-Spam Jitter Engine Status Indicator */}
        <div
          className={cn(
            "mb-4 flex items-center justify-between rounded-xl border px-3.5 py-2",
            isDark ? "border-white/6 bg-white/[0.02]" : "border-black/6 bg-black/[0.02]"
          )}
        >
          <div
            className={cn(
              "flex items-center gap-2 text-xs",
              isDark ? "text-white/70" : "text-zinc-600"
            )}
          >
            <span className="size-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="font-mono text-[11px]">Human Jitter Delay:</span>
            <span
              className={cn(
                "font-mono font-semibold",
                isDark ? "text-white" : "text-zinc-900"
              )}
            >
              30s–90s band (holding at {jitterTime}s)
            </span>
          </div>
          <span
            className={cn(
              "text-[10px] font-mono",
              isDark ? "text-white/40" : "text-zinc-400"
            )}
          >
            100% Natural Timing
          </span>
        </div>

        {/* 3-Button Card (Instagram DM Delivery) */}
        <div
          className={cn(
            "relative overflow-hidden rounded-2xl border p-4 shadow-xl",
            isDark
              ? "border-white/15 bg-gradient-to-b from-white/[0.07] to-white/[0.02] shadow-black/50"
              : "border-black/10 bg-gradient-to-b from-white to-zinc-50/80 shadow-zinc-200/50"
          )}
        >
          <div
            className={cn(
              "flex items-center justify-between pb-3 border-b mb-3",
              isDark ? "border-white/8" : "border-black/8"
            )}
          >
            <div className="flex items-center gap-2">
              <div className="size-5 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-[10px] text-white font-bold">
                R
              </div>
              <span
                className={cn(
                  "text-xs font-semibold",
                  isDark ? "text-white" : "text-zinc-900"
                )}
              >
                RELO · Instagram Direct
              </span>
            </div>
            <span className="font-mono text-[10px] text-emerald-500 font-semibold flex items-center gap-1">
              <CheckCircle2 className="size-3" /> Delivered Instantly
            </span>
          </div>

          <div className="space-y-3">
            {/* Template Card Graphic & Headline */}
            <div
              className={cn(
                "relative overflow-hidden rounded-xl border p-3.5",
                isDark ? "border-white/10 bg-black/40" : "border-black/8 bg-zinc-50"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4
                    className={cn(
                      "text-sm font-bold tracking-tight",
                      isDark ? "text-white" : "text-zinc-900"
                    )}
                  >
                    {activeTrigger.action}: Exclusive Access Pack
                  </h4>
                  <p
                    className={cn(
                      "mt-1 text-xs leading-relaxed",
                      isDark ? "text-white/70" : "text-zinc-600"
                    )}
                  >
                    Hey Maya! Here is your custom access bundle. You qualify because you follow the account.
                  </p>
                </div>
                <div
                  className="size-10 rounded-xl flex items-center justify-center shrink-0 shadow-lg"
                  style={{
                    background: `linear-gradient(135deg, ${preset.colors[1]}, ${preset.colors[2]})`,
                  }}
                >
                  <Sparkles className="size-5 text-white" />
                </div>
              </div>
            </div>

            {/* 3 High-Converting Meta Template Action Buttons */}
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => setClickCount((c) => c + 1)}
                className="w-full relative overflow-hidden group flex items-center justify-between rounded-xl px-4 py-2.5 text-xs font-semibold text-white transition-all duration-300 shadow-md hover:scale-[1.01] cursor-pointer"
                style={{
                  background: `linear-gradient(135deg, ${preset.colors[1]}, ${preset.colors[2]})`,
                  boxShadow: `0 4px 15px -3px ${preset.glowColor}`,
                }}
              >
                <span>1. Open {activeTrigger.action}</span>
                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
              </button>

              <button
                type="button"
                onClick={() => setClickCount((c) => c + 1)}
                className={cn(
                  "w-full flex items-center justify-between rounded-xl border px-4 py-2 text-xs font-medium transition-colors cursor-pointer",
                  isDark
                    ? "border-white/10 bg-white/5 hover:bg-white/10 text-white/80"
                    : "border-black/10 bg-white hover:bg-zinc-100 text-zinc-800 shadow-sm"
                )}
              >
                <span>2. View Creator Case Studies</span>
                <span
                  className={cn(
                    "font-mono text-[10px]",
                    isDark ? "text-white/40" : "text-zinc-400"
                  )}
                >
                  PDF
                </span>
              </button>

              <button
                type="button"
                onClick={() => setClickCount((c) => c + 1)}
                className={cn(
                  "w-full flex items-center justify-between rounded-xl border px-4 py-2 text-xs font-medium transition-colors cursor-pointer",
                  isDark
                    ? "border-white/10 bg-white/5 hover:bg-white/10 text-white/80"
                    : "border-black/10 bg-white hover:bg-zinc-100 text-zinc-800 shadow-sm"
                )}
              >
                <span>3. Ask Maya a Question</span>
                <span
                  className={cn(
                    "font-mono text-[10px]",
                    isDark ? "text-white/40" : "text-zinc-400"
                  )}
                >
                  DM
                </span>
              </button>
            </div>
          </div>

          {/* Viral Distribution Footer */}
          <div
            className={cn(
              "mt-3.5 pt-2.5 border-t flex items-center justify-between text-[10px] font-mono",
              isDark ? "border-white/6 text-white/40" : "border-black/6 text-zinc-400"
            )}
          >
            <span>Automated safely by RELO AI</span>
            <span>{clickCount.toLocaleString()} total clicks</span>
          </div>
        </div>
      </div>
    </div>
  );
}
