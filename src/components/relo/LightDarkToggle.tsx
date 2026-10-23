"use client";

import React from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/lib/relo/theme";
import { cn } from "@/lib/utils";

export function LightDarkToggle({ className }: { className?: string }) {
  const { isDark, set } = useTheme();

  return (
    <button
      type="button"
      onClick={() => set(isDark ? "light" : "dark")}
      className={cn(
        "group relative flex items-center gap-2 rounded-full border border-white/12 bg-black/40 px-3 py-1.5 text-xs font-medium backdrop-blur-xl transition-all duration-300 hover:border-cyan-400/40 hover:bg-black/60 shadow-lg",
        !isDark && "border-black/15 bg-white/70 text-black hover:border-cyan-600/40 hover:bg-white",
        className
      )}
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      aria-label="Toggle light and dark theme"
    >
      <div className="relative size-4 overflow-hidden">
        {isDark ? (
          <Moon className="size-4 text-cyan-400 transition-transform duration-300 group-hover:rotate-12" />
        ) : (
          <Sun className="size-4 text-amber-500 transition-transform duration-300 group-hover:rotate-45" />
        )}
      </div>
      <span className="font-mono text-[11px] font-semibold uppercase tracking-wider">
        {isDark ? "Dark" : "Light"}
      </span>
    </button>
  );
}
