"use client";

import React, { useRef, useState } from "react";
import {
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Zap,
  ArrowRight,
  TrendingUp,
  MessageCircle,
  Eye,
  CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card3D } from "./Card3D";

import { useTheme } from "@/lib/relo/theme";

interface ReelItem {
  id: string;
  badge: string;
  badgeColor: string;
  title: string;
  description: string;
  keyword: string;
  triggersToday: number;
  dmsSent: number;
  clicks: number;
  conversionRate: string;
  offerType: string;
}

const REELS: ReelItem[] = [
  {
    id: "reel-1",
    badge: "Highest Converting · 74%",
    badgeColor: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    title: "Viral Blueprint Reel",
    description: "Automated guide delivered directly into DMs when commenters reply with the trigger keyword.",
    keyword: "BLUEPRINT",
    triggersToday: 842,
    dmsSent: 829,
    clicks: 614,
    conversionRate: "74.1%",
    offerType: "Free PDF Guide",
  },
  {
    id: "reel-2",
    badge: "Follower Booster · 2.4x",
    badgeColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    title: "Exclusive Pricing Reel",
    description: "Verifies viewer follows your profile before unlocking private discount code and checkout link.",
    keyword: "DISCOUNT",
    triggersToday: 512,
    dmsSent: 508,
    clicks: 412,
    conversionRate: "81.1%",
    offerType: "VIP Coupon Code",
  },
  {
    id: "reel-3",
    badge: "Viral Lead Magnet",
    badgeColor: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    title: "Notion Workspace Pack",
    description: "Hands-free link distribution with rotating responses to keep comments looking 100% natural.",
    keyword: "NOTION",
    triggersToday: 1240,
    dmsSent: 1215,
    clicks: 980,
    conversionRate: "80.6%",
    offerType: "Digital Template",
  },
  {
    id: "reel-4",
    badge: "Course Launch Special",
    badgeColor: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    title: "Masterclass Early Access",
    description: "Sends high-ticket webinar registration link with 3 interactive action buttons inside Instagram Direct.",
    keyword: "WEBINAR",
    triggersToday: 690,
    dmsSent: 678,
    clicks: 534,
    conversionRate: "78.8%",
    offerType: "Live Registration",
  },
];

export function ScrollableReelGallery({ className }: { className?: string }) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const { isDark } = useTheme();

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const cardWidth = 360;
    const scrollAmount = direction === "left" ? -cardWidth : cardWidth;
    scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
  };

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const scrollLeft = scrollRef.current.scrollLeft;
    const cardWidth = 360;
    const newIdx = Math.round(scrollLeft / cardWidth);
    setActiveIdx(Math.min(Math.max(newIdx, 0), REELS.length - 1));
  };

  return (
    <div className={cn("relative w-full py-6", className)}>
      {/* Header controls with navigation arrows */}
      <div className="flex items-center justify-between mb-6 px-2">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-cyan-400 animate-pulse" />
          <span
            className={cn(
              "font-mono text-xs uppercase tracking-wider transition-colors",
              isDark ? "text-white/60" : "text-zinc-600"
            )}
          >
            Interactive Automation Showcase ({REELS.length} Active Campaigns)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => scroll("left")}
            aria-label="Scroll left"
            className={cn(
              "flex size-9 items-center justify-center rounded-full border backdrop-blur-xl transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm",
              isDark
                ? "border-white/12 bg-white/5 text-white/80 hover:border-cyan-400/50 hover:bg-white/15 hover:text-white"
                : "border-black/10 bg-white/80 text-zinc-700 hover:border-cyan-500/50 hover:bg-white hover:text-black"
            )}
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => scroll("right")}
            aria-label="Scroll right"
            className={cn(
              "flex size-9 items-center justify-center rounded-full border backdrop-blur-xl transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm",
              isDark
                ? "border-white/12 bg-white/5 text-white/80 hover:border-cyan-400/50 hover:bg-white/15 hover:text-white"
                : "border-black/10 bg-white/80 text-zinc-700 hover:border-cyan-500/50 hover:bg-white hover:text-black"
            )}
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      {/* Side-by-Side Horizontal Scroll Container */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex gap-5 overflow-x-auto pb-6 pt-2 scroll-smooth no-scrollbar snap-x snap-mandatory"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {REELS.map((item, idx) => (
          <div
            key={item.id}
            className="w-[320px] sm:w-[360px] shrink-0 snap-center transition-all duration-300"
          >
            <Card3D
              intensity={10}
              className={cn(
                "h-full p-6 backdrop-blur-xl transition-colors",
                isDark
                  ? "bg-gradient-to-br from-white/[0.08] to-black/80 border-white/12 hover:border-cyan-400/40 text-white"
                  : "bg-white/85 border-black/10 hover:border-cyan-500/50 text-zinc-900 shadow-xl shadow-cyan-950/5"
              )}
            >
              {/* Badge & Type */}
              <div
                className={cn(
                  "flex items-center justify-between pb-4 border-b mb-4",
                  isDark ? "border-white/8" : "border-black/8"
                )}
              >
                <span
                  className={cn(
                    "rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider",
                    item.badgeColor
                  )}
                >
                  {item.badge}
                </span>
                <span className={cn("font-mono text-[11px]", isDark ? "text-white/40" : "text-zinc-400")}>
                  {item.offerType}
                </span>
              </div>

              {/* Title & Description */}
              <div className="space-y-1.5 mb-5 min-h-[72px]">
                <h3
                  className={cn(
                    "text-base font-bold tracking-tight flex items-center justify-between",
                    isDark ? "text-white" : "text-zinc-900"
                  )}
                >
                  <span>{item.title}</span>
                  <Sparkles className="size-3.5 text-cyan-400 opacity-80" />
                </h3>
                <p className={cn("text-xs leading-relaxed", isDark ? "text-white/70" : "text-zinc-600")}>
                  {item.description}
                </p>
              </div>

              {/* Keyword Trigger Pill */}
              <div
                className={cn(
                  "mb-4 rounded-xl border p-3 flex items-center justify-between",
                  isDark
                    ? "border-cyan-400/25 bg-cyan-400/10"
                    : "border-cyan-500/25 bg-cyan-50/70"
                )}
              >
                <span className={cn("text-[11px] font-mono", isDark ? "text-white/70" : "text-zinc-700")}>
                  Comment Trigger:
                </span>
                <span
                  className={cn(
                    "font-mono font-bold text-xs px-2.5 py-1 rounded-lg border",
                    isDark
                      ? "text-cyan-300 bg-black/40 border-cyan-400/30"
                      : "text-cyan-800 bg-white border-cyan-500/30 shadow-sm"
                  )}
                >
                  &quot;{item.keyword}&quot;
                </span>
              </div>

              {/* Live Metric Readouts */}
              <div
                className={cn(
                  "grid grid-cols-3 gap-2 rounded-xl p-3 text-center mb-4 border",
                  isDark ? "bg-black/40 border-white/6" : "bg-black/[0.03] border-black/6"
                )}
              >
                <div>
                  <div className={cn("text-[10px] font-mono uppercase", isDark ? "text-white/40" : "text-zinc-400")}>
                    DMs Sent
                  </div>
                  <div
                    className={cn(
                      "text-xs font-mono font-bold mt-0.5",
                      isDark ? "text-white" : "text-zinc-900"
                    )}
                  >
                    {item.dmsSent.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className={cn("text-[10px] font-mono uppercase", isDark ? "text-white/40" : "text-zinc-400")}>
                    Clicks
                  </div>
                  <div className="text-xs font-mono font-bold text-cyan-500 mt-0.5">
                    {item.clicks.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className={cn("text-[10px] font-mono uppercase", isDark ? "text-white/40" : "text-zinc-400")}>
                    Conv. Rate
                  </div>
                  <div className="text-xs font-mono font-bold text-emerald-500 mt-0.5">
                    {item.conversionRate}
                  </div>
                </div>
              </div>

              {/* Bottom interactive action */}
              <div
                className={cn(
                  "pt-2 flex items-center justify-between text-xs font-mono",
                  isDark ? "text-white/60" : "text-zinc-600"
                )}
              >
                <span className="flex items-center gap-1.5 text-emerald-500">
                  <CheckCircle className="size-3" /> Live & Armed
                </span>
                <span
                  className={cn(
                    "transition-colors flex items-center gap-1 font-medium cursor-pointer",
                    isDark ? "text-white hover:text-cyan-400" : "text-zinc-900 hover:text-cyan-600"
                  )}
                >
                  Simulate <ArrowRight className="size-3" />
                </span>
              </div>
            </Card3D>
          </div>
        ))}
      </div>

      {/* Pagination progress dots */}
      <div className="mt-2 flex justify-center gap-2">
        {REELS.map((_, i) => (
          <button
            key={i}
            onClick={() => {
              if (!scrollRef.current) return;
              scrollRef.current.scrollTo({ left: i * 360, behavior: "smooth" });
              setActiveIdx(i);
            }}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              activeIdx === i
                ? "w-8 bg-cyan-400"
                : isDark
                  ? "w-1.5 bg-white/20 hover:bg-white/40"
                  : "w-1.5 bg-black/20 hover:bg-black/40"
            )}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
