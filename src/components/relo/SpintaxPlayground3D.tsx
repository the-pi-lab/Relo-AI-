"use client";

import React, { useState } from "react";
import { Sparkles, ShieldCheck, RefreshCw, Cpu, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGradientPreset } from "@/lib/relo/gradients";
import { Card3D } from "./Card3D";

const SPINTAX_TEMPLATES = [
  {
    template: "{Hey|Hi|Hello} @maya, {here is|I just sent|grab your} {the free guide|the secret link|your access pass}! Check your DMs 🚀",
    variations: [
      "Hey @maya, here is the free guide! Check your DMs 🚀",
      "Hi @maya, I just sent your access pass! Check your DMs 🚀",
      "Hello @maya, grab your the secret link! Check your DMs 🚀",
      "Hey @maya, I just sent the free guide! Check your DMs 🚀",
      "Hi @maya, here is your access pass! Check your DMs 🚀",
    ],
  },
  {
    template: "{Thanks for commenting|Appreciate you|Awesome to connect}! {Sent you the VIP discount|Your code is in your inbox|Check your Direct Messages}. {Have a great day|Enjoy|Let me know if you need help}!",
    variations: [
      "Thanks for commenting! Sent you the VIP discount. Have a great day!",
      "Awesome to connect! Your code is in your inbox. Enjoy!",
      "Appreciate you! Check your Direct Messages. Let me know if you need help!",
      "Thanks for commenting! Your code is in your inbox. Have a great day!",
    ],
  },
];

export function SpintaxPlayground3D({ className }: { className?: string }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [variationIdx, setVariationIdx] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const { preset } = useGradientPreset();

  const current = SPINTAX_TEMPLATES[activeIdx];

  const roll = () => {
    setIsSpinning(true);
    setTimeout(() => {
      setVariationIdx((prev) => (prev + 1) % current.variations.length);
      setIsSpinning(false);
    }, 250);
  };

  return (
    <Card3D className={cn("p-6 sm:p-8 bg-black/60 border-white/12", className)}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/8">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="size-3" /> Anti-Shadowban Engine
            </span>
          </div>
          <h3 className="text-xl font-bold text-white tracking-tight">
            AST Spintax Permutation Visualizer
          </h3>
          <p className="mt-1 text-xs text-white/70 max-w-lg">
            Meta algorithms penalize accounts that spam identical comments. RELO enforces mathematical sentence variation so every commenter gets a unique response.
          </p>
        </div>

        <button
          type="button"
          onClick={roll}
          className="group flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold text-white transition-all shadow-md hover:scale-105 shrink-0"
          style={{
            background: `linear-gradient(135deg, ${preset.colors[1]}, ${preset.colors[2]})`,
            boxShadow: `0 4px 15px -3px ${preset.glowColor}`,
          }}
        >
          <RefreshCw className={cn("size-3.5 transition-transform duration-500", isSpinning && "rotate-180")} />
          <span>Generate Unique Permutation</span>
        </button>
      </div>

      {/* Raw Spintax Pattern */}
      <div className="mt-6 space-y-2">
        <div className="text-[11px] font-mono uppercase text-white/50 tracking-wider">
          Creator Spintax Syntax Input:
        </div>
        <div className="rounded-xl border border-white/10 bg-black/50 p-3.5 font-mono text-xs text-emerald-400 break-words leading-relaxed">
          {current.template}
        </div>
      </div>

      {/* Live Resolved Output */}
      <div className="mt-5 space-y-2">
        <div className="flex items-center justify-between text-[11px] font-mono text-white/50 uppercase tracking-wider">
          <span>Unique Comment Payload Sent to Instagram:</span>
          <span className="text-white/40">Variation #{variationIdx + 1} of 27</span>
        </div>
        <div
          className={cn(
            "relative overflow-hidden rounded-xl border border-white/15 bg-white/[0.05] p-4 text-sm font-medium text-white transition-all duration-300 shadow-inner",
            isSpinning && "opacity-50 scale-[0.99]"
          )}
        >
          <div className="flex items-start gap-3">
            <CheckCircle className="size-4 text-emerald-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{current.variations[variationIdx]}</p>
          </div>
        </div>
      </div>

      {/* Safety Matrix Footer */}
      <div className="mt-5 pt-4 border-t border-white/6 grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px] font-mono text-white/60">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-emerald-400" />
          <span>Unicode Diacritic Folding</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-cyan-400" />
          <span>Emoji & Punctuation Stripping</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-purple-400" />
          <span>100% Shadowban Proof</span>
        </div>
      </div>
    </Card3D>
  );
}
