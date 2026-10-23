"use client";

import React, { useState } from "react";
import { GRADIENT_PRESETS, GradientPresetId, useGradientPreset } from "@/lib/relo/gradients";
import { Sparkles, Check, ChevronDown, Flame } from "lucide-react";
import { cn } from "@/lib/utils";

interface GradientPresetPickerProps {
  compact?: boolean;
  className?: string;
}

export function GradientPresetPicker({ compact = false, className }: GradientPresetPickerProps) {
  const { presetId, setPresetId, preset } = useGradientPreset();
  const [isOpen, setIsOpen] = useState(false);

  if (compact) {
    return (
      <div className={cn("relative inline-block", className)}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="group flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-1.5 text-xs font-medium text-white/90 backdrop-blur-xl transition-all duration-300 hover:border-white/25 hover:bg-black/60 shadow-lg shadow-black/30"
          title="Switch live flowing gradient preset"
        >
          {/* Animated gradient preview swatch */}
          <span
            className="size-3 rounded-full ring-1 ring-white/30 animate-pulse"
            style={{
              background: `linear-gradient(135deg, ${preset.colors[1]}, ${preset.colors[2]})`,
              boxShadow: `0 0 10px ${preset.accentColor}`,
            }}
          />
          <span className="hidden sm:inline font-mono text-[11px] uppercase tracking-wider text-white/80">
            {preset.name}
          </span>
          <ChevronDown className={cn("size-3 text-white/50 transition-transform duration-200", isOpen && "rotate-180")} />
        </button>

        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <div className="absolute right-0 top-full mt-2 z-50 w-64 rounded-2xl border border-white/12 bg-black/85 p-2 shadow-2xl shadow-black/80 backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-white/40 flex items-center justify-between">
                <span>Gradient Shaders</span>
                <span className="text-[9px] text-white/30">Live 60fps</span>
              </div>
              <div className="space-y-1">
                {GRADIENT_PRESETS.map((p) => {
                  const active = p.id === presetId;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setPresetId(p.id);
                        setIsOpen(false);
                      }}
                      className={cn(
                        "w-full flex items-center gap-3 rounded-xl px-3 py-2 text-left text-xs transition-all duration-200 group",
                        active ? "bg-white/12 text-white font-semibold" : "text-white/70 hover:bg-white/6 hover:text-white"
                      )}
                    >
                      <span
                        className="size-4 shrink-0 rounded-full border border-white/20 shadow-sm"
                        style={{
                          background: `linear-gradient(135deg, ${p.colors[1]}, ${p.colors[2]})`,
                          boxShadow: active ? `0 0 12px ${p.accentColor}` : "none",
                        }}
                      />
                      <div className="flex-1 truncate">
                        <div className="truncate text-[12px]">{p.name}</div>
                        <div className="truncate text-[10px] text-white/40 font-mono">{p.category}</div>
                      </div>
                      {active && <Check className="size-3.5 text-white shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // Expanded pill strip (as seen in the screenshots)
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {GRADIENT_PRESETS.map((p) => {
        const active = p.id === presetId;
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => setPresetId(p.id)}
            className={cn(
              "group relative flex items-center gap-2.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all duration-300",
              active
                ? "bg-white/15 text-white ring-1 ring-white/30 shadow-lg shadow-black/40 scale-105"
                : "bg-black/30 text-white/60 hover:bg-white/8 hover:text-white/90 border border-white/8"
            )}
            style={{
              boxShadow: active ? `0 0 18px ${p.glowColor}` : undefined,
            }}
          >
            <span
              className="size-2.5 rounded-full ring-1 ring-white/30"
              style={{
                background: `linear-gradient(135deg, ${p.colors[1]}, ${p.colors[2]})`,
              }}
            />
            <span className="text-[12px] font-mono tracking-tight">{p.name}</span>
          </button>
        );
      })}
    </div>
  );
}
