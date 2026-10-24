"use client";

import { cn } from "@/lib/utils";

/**
 * Warm daylight backdrop: three soft ember glows over the paper canvas.
 * Pure CSS so it costs nothing on any page.
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
    <div aria-hidden className={cn("pointer-events-none fixed inset-0 -z-10 overflow-hidden warm-aurora", className)}>
      {variant !== "studio" && (
        <>
          <span className="liquid-blob liquid-blob-a" />
          <span className="liquid-blob liquid-blob-c" />
        </>
      )}
      {grid && <div className="liquid-grid absolute inset-0" />}
      <span className="grain-layer absolute inset-0" style={{ opacity: "var(--grain-opacity)" }} />
    </div>
  );
}

export function BrandAurora({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("brand-aurora pointer-events-none absolute inset-0", className)}>
      <span className="absolute inset-x-0 top-0 h-px bg-white/20" />
      <span className="grain-layer absolute inset-0 opacity-40" />
    </div>
  );
}
