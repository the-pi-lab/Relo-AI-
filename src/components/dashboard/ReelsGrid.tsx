import React from "react";
import { Play, Sparkles, Plus, CheckCircle2, MessageCircle, Heart, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { InstagramReelMedia } from "@/types/contracts";

interface ReelsGridProps {
  reels: InstagramReelMedia[];
  isLoading: boolean;
  onSelectReel: (reel: InstagramReelMedia) => void;
}

export default function ReelsGrid({
  reels,
  isLoading,
  onSelectReel,
}: ReelsGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div
            key={i}
            className="h-80 rounded-2xl bg-white border border-slate-200/80 p-3 animate-pulse flex flex-col justify-between"
          >
            <div className="w-full h-52 bg-slate-100 rounded-xl" />
            <div className="space-y-2 py-2">
              <div className="w-3/4 h-3.5 bg-slate-100 rounded" />
              <div className="w-1/2 h-3 bg-slate-100 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (reels.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-slate-200/80 p-8">
        <div className="w-12 h-12 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-sky-100">
          <Play className="w-6 h-6 ml-0.5" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-1">No Recent Reels Detected</h3>
        <p className="text-sm text-slate-500 max-w-sm mx-auto mb-6">
          Publish a new Instagram Reel from your connected account, and it will appear here automatically for 1-click comment-to-DM automation.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {reels.map((reel) => {
        return (
          <div
            key={reel.id}
            className="group bg-white rounded-2xl border border-slate-200/80 hover:border-sky-300 hover:shadow-xl hover:shadow-sky-100/50 transition-all duration-300 flex flex-col overflow-hidden"
          >
            {/* Reel Thumbnail Header */}
            <div className="relative aspect-[9/12] w-full bg-slate-900 overflow-hidden">
              <img
                src={reel.thumbnailUrl || reel.mediaUrl || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&q=80"}
                alt={reel.caption || "Instagram Reel"}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/20" />

              {/* Status Badge */}
              <div className="absolute top-3 left-3">
                {reel.hasActiveAutomation ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500 text-white shadow-sm shadow-emerald-950/30">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Active Rule
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/90 text-slate-700 backdrop-blur-sm shadow-sm">
                    No Automation
                  </span>
                )}
              </div>

              {/* External Link icon */}
              <a
                href={reel.permalink}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-md transition-colors"
                title="View on Instagram"
                aria-label="View on Instagram"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              {/* Play Button Overlay on Hover */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/40 shadow-lg text-white">
                  <Play className="w-5 h-5 ml-0.5 fill-white/80" />
                </div>
              </div>

              {/* Metrics Bar */}
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white/90 text-xs font-semibold">
                <div className="flex items-center gap-3">
                  {reel.commentsCount !== undefined && (
                    <span className="flex items-center gap-1">
                      <MessageCircle className="w-3.5 h-3.5" />
                      {reel.commentsCount}
                    </span>
                  )}
                  {reel.likeCount !== undefined && (
                    <span className="flex items-center gap-1">
                      <Heart className="w-3.5 h-3.5" />
                      {reel.likeCount}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-white/70 font-mono">
                  {new Date(reel.timestamp).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                </span>
              </div>
            </div>

            {/* Caption & Action footer */}
            <div className="p-4 flex-1 flex flex-col justify-between">
              <p className="text-xs text-slate-600 line-clamp-2 font-medium mb-4 leading-relaxed">
                {reel.caption || "Untitled Reel (No caption)"}
              </p>

              <Button
                onClick={() => onSelectReel(reel)}
                size="sm"
                className={`w-full rounded-xl font-bold text-xs min-h-[40px] transition-all ${
                  reel.hasActiveAutomation
                    ? "bg-slate-100 hover:bg-slate-200 text-slate-800"
                    : "bg-sky-600 hover:bg-sky-500 text-white shadow-md shadow-sky-600/20"
                }`}
              >
                {reel.hasActiveAutomation ? (
                  <>
                    <Sparkles className="w-3.5 h-3.5 mr-1.5 text-sky-600" />
                    Edit Automation
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5 mr-1.5" />
                    Automate Reel
                  </>
                )}
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
