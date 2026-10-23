"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { FlowingGradientsCanvas } from "./FlowingGradientsCanvas";

export function LiquidBackdrop({
  variant = "page",
  grid = false,
  className,
}: {
  variant?: "page" | "studio" | "hero";
  grid?: boolean;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none fixed inset-0 -z-10 overflow-hidden", className)}
    >
      <FlowingGradientsCanvas
        variant={variant === "hero" ? "hero" : variant === "studio" ? "subtle" : "full"}
      />
      {grid && (
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.08) 1px, transparent 1px)`,
            backgroundSize: "48px 48px",
          }}
        />
      )}
    </div>
  );
}

export function BrandAurora({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      <FlowingGradientsCanvas variant="subtle" showNoise={false} />
      <span className="absolute inset-x-0 top-0 h-px bg-white/25" />
    </div>
  );
}
