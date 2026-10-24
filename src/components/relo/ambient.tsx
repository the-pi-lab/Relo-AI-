"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { FlowingGradientsCanvas } from "./FlowingGradientsCanvas";

/**
 * The living background: the Tide Swirl canvas paints slow blue ribbons behind
 * every page, and each surface above it stays translucent so the motion shows
 * through. `variant` controls how loudly it reads — `hero` on the marketing
 * page, `page` on auth and legal screens, `studio` inside the app where text
 * legibility comes first.
 */
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
          className="pointer-events-none absolute inset-0 opacity-[0.16]"
          style={{
            backgroundImage:
              "linear-gradient(rgb(255 255 255 / 0.09) 1px, transparent 1px), linear-gradient(90deg, rgb(255 255 255 / 0.09) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage:
              "radial-gradient(ellipse at 50% 0%, black 10%, transparent 72%)",
          }}
        />
      )}
    </div>
  );
}

/**
 * The deeper navy panel used behind brand moments (login aside, closing band).
 * It is painted with gradients, not a second canvas, so it costs nothing while
 * the page already has one animation running.
 */
export function BrandAurora({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("brand-aurora pointer-events-none absolute inset-0", className)}>
      <span className="absolute inset-x-0 top-0 h-px bg-white/20" />
      <span className="grain-layer absolute inset-0 opacity-40" />
    </div>
  );
}
