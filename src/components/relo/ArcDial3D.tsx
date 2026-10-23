"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { useGradientPreset } from "@/lib/relo/gradients";
import { useTheme } from "@/lib/relo/theme";

interface ArcDialProps {
  score?: number; // 0 to 100
  title?: string;
  sub?: string;
  className?: string;
  segmentsCount?: number;
}

export function ArcDial3D({
  score = 78,
  title = "Conversion Health",
  sub = "Optimal anti-spam & delivery",
  className,
  segmentsCount = 28,
}: ArcDialProps) {
  const { preset } = useGradientPreset();
  const { isDark } = useTheme();

  // Calculate needle angle (-110deg to +110deg)
  const angle = -110 + (score / 100) * 220;

  return (
    <div className={cn("relative flex flex-col items-center justify-center p-4", className)}>
      <div className="relative size-48 flex items-center justify-center">
        {/* SVG Segmented Arc Ticks */}
        <svg viewBox="0 0 200 200" className="size-full overflow-visible">
          <defs>
            <linearGradient id="arcGlow" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="60%" stopColor={preset.accentColor} />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>

          {/* Render individual segmented arc ticks */}
          {Array.from({ length: segmentsCount }).map((_, i) => {
            const tickFraction = i / (segmentsCount - 1);
            const tickAngle = -220 + tickFraction * 220; // in degrees
            const rad = (tickAngle * Math.PI) / 180;
            const rOuter = 85;
            const rInner = 73;
            
            const x1 = 100 + rInner * Math.cos(rad);
            const y1 = 105 + rInner * Math.sin(rad);
            const x2 = 100 + rOuter * Math.cos(rad);
            const y2 = 105 + rOuter * Math.sin(rad);

            const isLit = tickFraction <= score / 100;

            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={isLit ? "url(#arcGlow)" : isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.12)"}
                strokeWidth={isLit ? 3.5 : 2}
                strokeLinecap="round"
                className="transition-all duration-500"
              />
            );
          })}

          {/* Center Hub Glass Circle */}
          <circle
            cx="100"
            cy="105"
            r="42"
            fill={isDark ? "rgba(10, 10, 15, 0.85)" : "rgba(255, 255, 255, 0.95)"}
            stroke={isDark ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.1)"}
            strokeWidth="1.5"
          />

          {/* Rotating Needle */}
          <g
            style={{
              transform: `rotate(${angle}deg)`,
              transformOrigin: "100px 105px",
              transition: "transform 1s cubic-bezier(0.34, 1.56, 0.64, 1)",
            }}
          >
            <polygon
              points="97,105 103,105 100,32"
              fill={preset.accentColor}
              style={{ filter: `drop-shadow(0 0 6px ${preset.accentColor})` }}
            />
            <circle cx="100" cy="105" r="5" fill={isDark ? "#ffffff" : "#09090b"} />
          </g>
        </svg>

        {/* Center Score readout */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-8 text-center pointer-events-none">
          <span
            className={cn(
              "font-mono text-3xl font-extrabold tracking-tight transition-colors",
              isDark ? "text-white" : "text-zinc-900"
            )}
          >
            {score}%
          </span>
          <span
            className={cn(
              "font-mono text-[9px] uppercase tracking-widest",
              isDark ? "text-white/50" : "text-zinc-500"
            )}
          >
            DM Rate
          </span>
        </div>
      </div>

      <div className="mt-1 text-center">
        <h4
          className={cn(
            "text-sm font-bold tracking-tight transition-colors",
            isDark ? "text-white" : "text-zinc-900"
          )}
        >
          {title}
        </h4>
        <p className={cn("text-[11px] font-mono mt-0.5", isDark ? "text-white/60" : "text-zinc-500")}>
          {sub}
        </p>
      </div>

      <div
        className={cn(
          "mt-3 flex items-center gap-4 text-[10px] font-mono border-t pt-2.5 w-full justify-center",
          isDark ? "border-white/6 text-white/50" : "border-black/6 text-zinc-500"
        )}
      >
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-emerald-400" /> Human Pace
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-cyan-400" /> Meta Approved
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-purple-400" /> 0% Flagging
        </span>
      </div>
    </div>
  );
}
