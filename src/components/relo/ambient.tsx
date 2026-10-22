import { cn } from "@/lib/utils";

/* ==========================================================================
   Atmospheric surfaces.

   These are deliberately dumb: no canvas, no WebGL, no random objects. Four
   soft light fields drift on the compositor behind the product, a grain layer
   keeps them from looking like flat CSS, and one grid can be switched on where
   the page needs structure (hero, workflow canvas).
   ========================================================================== */

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
      className={cn(
        "liquid-backdrop",
        variant === "studio" && "opacity-55",
        variant === "hero" && "opacity-90",
        className
      )}
    >
      <span className="liquid-blob liquid-blob-a" />
      <span className="liquid-blob liquid-blob-b" />
      <span className="liquid-blob liquid-blob-c" />
      {variant !== "studio" && <span className="liquid-blob liquid-blob-d" />}
      {grid && <span className="absolute inset-0 liquid-grid opacity-50" />}
      <span className="absolute inset-0 grain-layer" />
    </div>
  );
}

/* The one place where a saturated brand surface is allowed to move. */
export function BrandAurora({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      <span className="absolute inset-0 brand-aurora" />
      <span className="absolute inset-0 grain-layer" />
      <span className="absolute inset-x-0 top-0 h-px bg-white/25" />
    </div>
  );
}
