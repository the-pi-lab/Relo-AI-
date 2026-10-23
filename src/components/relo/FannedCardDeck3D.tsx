"use client";

import React, { useState } from "react";
import { Sparkles, ShieldCheck, Zap, CreditCard, ChevronRight, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGradientPreset } from "@/lib/relo/gradients";

interface AutomationCardData {
  id: string;
  name: string;
  caption: string;
  keyword: string;
  triggersToday: number;
  dmsSent: number;
  clicks: number;
  tag: string;
  accent: string;
}

const CARDS: AutomationCardData[] = [
  {
    id: "card-1",
    name: "VIP Blueprint Reel",
    caption: "How I generated 14,000 leads with ₹0 server bills...",
    keyword: "BLUEPRINT",
    triggersToday: 842,
    dmsSent: 829,
    clicks: 614,
    tag: "High Converting · 74%",
    accent: "from-cyan-500/20 via-blue-600/30 to-indigo-900/60",
  },
  {
    id: "card-2",
    name: "Pricing Matrix Reel",
    caption: "Stop paying the ManyChat $235/mo growth tax...",
    keyword: "CALCULATOR",
    triggersToday: 512,
    dmsSent: 508,
    clicks: 412,
    tag: "Follow-Gated",
    accent: "from-rose-500/20 via-pink-600/30 to-purple-900/60",
  },
  {
    id: "card-3",
    name: "Free Notion Template",
    caption: "Dropping our complete creator system in your DM...",
    keyword: "NOTION",
    triggersToday: 1240,
    dmsSent: 1215,
    clicks: 980,
    tag: "Spintax v2 Active",
    accent: "from-amber-500/20 via-orange-600/30 to-zinc-900/60",
  },
];

export function FannedCardDeck3D({ className }: { className?: string }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const { preset } = useGradientPreset();

  return (
    <div
      className={cn("relative mx-auto w-full max-w-lg py-12", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ perspective: "1200px" }}
    >
      <div className="relative h-72 w-full">
        {CARDS.map((card, idx) => {
          // Calculate fanned 3D transform
          const isSelected = selectedIndex === idx;
          const offset = idx - selectedIndex;
          
          let rotateZ = offset * 7;
          let translateY = Math.abs(offset) * 14;
          let translateX = offset * (isHovered ? 40 : 20);
          let translateZ = -Math.abs(offset) * 45;
          let scale = 1 - Math.abs(offset) * 0.05;

          if (isHovered) {
            rotateZ = offset * 11;
            translateY = Math.abs(offset) * 8;
          }

          if (isSelected) {
            translateZ = 30;
            scale = 1.02;
          }

          return (
            <div
              key={card.id}
              onClick={() => setSelectedIndex(idx)}
              style={{
                transform: `translateX(${translateX}px) translateY(${translateY}px) translateZ(${translateZ}px) rotateZ(${rotateZ}deg) scale(${scale})`,
                transformStyle: "preserve-3d",
                zIndex: isSelected ? 30 : 20 - Math.abs(offset),
              }}
              className={cn(
                "absolute inset-x-4 top-0 cursor-pointer overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-br p-6 backdrop-blur-2xl transition-all duration-300 ease-out shadow-2xl",
                card.accent
              )}
            >
              {/* Holographic foil rim line */}
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />

              {/* Card Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
                <div className="flex items-center gap-2">
                  <div className="size-3 rounded-full bg-white/80 ring-2 ring-white/20" />
                  <span className="font-mono text-xs uppercase tracking-widest text-white/90 font-bold">
                    RELO AUTONOMY · #{idx + 1}
                  </span>
                </div>
                <span className="rounded-full bg-white/10 px-3 py-1 font-mono text-[10px] text-white/90 border border-white/15">
                  {card.tag}
                </span>
              </div>

              {/* Reel Info */}
              <div className="space-y-1 mb-5">
                <h4 className="text-base font-bold text-white tracking-tight">{card.name}</h4>
                <p className="text-xs text-white/70 truncate">{card.caption}</p>
              </div>

              {/* Keyword & Live Stats Row */}
              <div className="grid grid-cols-3 gap-3 rounded-2xl bg-black/40 border border-white/8 p-3 text-center">
                <div>
                  <div className="text-[10px] font-mono uppercase text-white/40">Trigger</div>
                  <div className="text-xs font-mono font-bold text-white mt-0.5">&quot;{card.keyword}&quot;</div>
                </div>
                <div>
                  <div className="text-[10px] font-mono uppercase text-white/40">DMs Sent</div>
                  <div className="text-xs font-mono font-bold text-white mt-0.5">{card.dmsSent}</div>
                </div>
                <div>
                  <div className="text-[10px] font-mono uppercase text-white/40">Clicks</div>
                  <div
                    className="text-xs font-mono font-bold mt-0.5"
                    style={{ color: preset.accentColor }}
                  >
                    {card.clicks}
                  </div>
                </div>
              </div>

              {/* Footer chip */}
              <div className="mt-4 flex items-center justify-between text-[11px] text-white/60">
                <span className="font-mono text-[10px]">Cloudflare D1 SQLite State</span>
                <span className="flex items-center gap-1 text-white hover:underline text-xs font-medium">
                  Inspect Reel <ChevronRight className="size-3" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selector dots underneath deck */}
      <div className="mt-6 flex justify-center gap-2">
        {CARDS.map((_, i) => (
          <button
            key={i}
            onClick={() => setSelectedIndex(i)}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              selectedIndex === i ? "w-6 bg-white" : "w-1.5 bg-white/30"
            )}
          />
        ))}
      </div>
    </div>
  );
}
