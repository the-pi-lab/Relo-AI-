"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, useInView, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

/* ── former magnetic wrapper — now a calm passthrough.
      Hover effects are retired everywhere except the ASCII plates:
      the world stays still, the glyphs answer instead. ────────────────── */

export function Magnetic({
  children,
  className,
}: {
  children: React.ReactNode;
  strength?: number;
  className?: string;
}) {
  return (
    <div className={className} style={{ display: "inline-block" }}>
      {children}
    </div>
  );
}

/* ── buttons ─────────────────────────────────────────────────────────── */

type BtnProps = HTMLMotionProps<"button"> & {
  variant?: "ember" | "ink" | "ghost" | "bone" | "outline";
  size?: "sm" | "md" | "lg";
};

export function RButton({ variant = "ember", size = "md", className, ...props }: BtnProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 22 }}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full font-medium cursor-pointer select-none",
        "focus-visible:outline-2 focus-visible:outline-ember",
        size === "sm" && "h-9 px-4 text-[13px]",
        size === "md" && "h-11 px-6 text-sm",
        size === "lg" && "h-[52px] px-8 text-[15px]",
        variant === "ember" && "bg-ember on-ember shadow-[var(--shadow-ember)]",
        variant === "ink" && "bg-ink text-night",
        variant === "bone" && "bg-bone text-night",
        variant === "outline" && "border border-line-strong bg-transparent text-ink",
        variant === "ghost" && "bg-ink/[0.05] text-ink",
        className
      )}
      {...props}
    />
  );
}

/* ── scroll reveal ───────────────────────────────────────────────────── */

export function Reveal({
  children,
  delay = 0,
  y = 26,
  blur = false,
  once = true,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  blur?: boolean;
  once?: boolean;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: "-10% 0px" }}
      transition={{ duration: 0.75, delay, ease: [0.21, 0.65, 0.24, 1] }}
    >
      {children}
    </motion.div>
  );
}

/* ── word-by-word headline reveal ────────────────────────────────────── */

export function WordReveal({
  text,
  className,
  wordClassName,
  delay = 0,
  stagger = 0.055,
  accentWords = [],
}: {
  text: string;
  className?: string;
  wordClassName?: string;
  delay?: number;
  stagger?: number;
  accentWords?: string[];
}) {
  const words = text.split(" ");
  return (
    <span className={cn("inline-block", className)} aria-label={text}>
      {words.map((w, i) => {
        const clean = w.replace(/[^\w’']/g, "").toLowerCase();
        const accent = accentWords.some((a) => clean.includes(a.toLowerCase()));
        return (
          <span key={i} className="inline-block overflow-hidden pb-[0.08em] -mb-[0.08em] align-bottom">
            <motion.span
              aria-hidden
              className={cn("inline-block will-change-transform", wordClassName)}
              initial={{ y: "110%", opacity: 0, rotate: 2 }}
              animate={{ y: "0%", opacity: 1, rotate: 0 }}
              transition={{
                duration: 0.9,
                delay: delay + i * stagger,
                ease: [0.22, 1, 0.28, 1],
              }}
            >
              {accent ? (
                <em className="serif-accent text-spectral pr-[0.06em]">{w}</em>
              ) : (
                w
              )}
              {i < words.length - 1 ? "\u00A0" : ""}
            </motion.span>
          </span>
        );
      })}
    </span>
  );
}

/* ── former spotlight card — now a still surface. The interiors inside
      (equalizer, spintax, DM card) carry the life; the card itself rests. ─ */

export function SpotlightCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
  glow?: string;
}) {
  return (
    <div className={cn("relative overflow-hidden rounded-3xl", className)}>
      {children}
    </div>
  );
}

/* ── former tilt card — now a steady frame. Stillness is the luxury. ──── */

export function TiltCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
  max?: number;
  glare?: boolean;
}) {
  return (
    <div className={cn("h-full", className)}>{children}</div>
  );
}

/* ── animated counter ────────────────────────────────────────────────── */

export function CountUp({
  to,
  suffix = "",
  prefix = "",
  duration = 1.6,
  decimals = 0,
  className,
}: {
  to: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  decimals?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / (duration * 1000));
      const eased = 1 - Math.pow(1 - p, 4);
      setVal(to * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, to, duration]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {val.toLocaleString("en-IN", {
        maximumFractionDigits: decimals,
        minimumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  );
}

/* ── logo — the sigil. A gradient tile inside a slow orbit ring; the
      wordmark leans in. This is the object people get stuck on. ─────── */

export function Logo({ dark = false, onClick }: { dark?: boolean; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group inline-flex items-center gap-2.5 cursor-pointer"
      aria-label="RELO home"
    >
      <span className="relative grid place-items-center">
        {/* slow orbit ring — the world keeps turning around this letter */}
        <span
          aria-hidden
          className="anim-spin-slow absolute inset-[-3px] rounded-[14px] opacity-70"
          style={{
            background:
              "conic-gradient(from 0deg, transparent 0%, rgba(139,128,249,0.9) 18%, transparent 30%, transparent 55%, rgba(242,196,141,0.8) 70%, transparent 82%)",
            mask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
            maskComposite: "exclude",
            WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
            WebkitMaskComposite: "xor",
            padding: "1.5px",
          }}
        />
        <span
          className={cn(
            "relative grid size-9 place-items-center rounded-[11px] font-display font-extrabold text-[17px] leading-none on-ember"
          )}
          style={{
            background: "linear-gradient(135deg, #a99dff 0%, #8b80f9 55%, #7366ec 100%)",
            boxShadow: "0 6px 22px -6px rgba(139,128,249,0.55), inset 0 1px 0 rgba(255,255,255,0.35)",
          }}
        >
          R
        </span>
      </span>
      <span
        className={cn(
          "font-display text-[19px] font-bold tracking-tight",
          dark ? "text-bone" : "text-ink"
        )}
      >
        RELO
        <span className="text-honey">.</span>
      </span>
    </button>
  );
}

/* ── eyebrow label ───────────────────────────────────────────────────── */

export function Eyebrow({
  children,
  tone = "light",
  className,
}: {
  children: React.ReactNode;
  tone?: "light" | "dark";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "eyebrow inline-flex items-center gap-2",
        tone === "dark" ? "eyebrow--bone" : "",
        className
      )}
    >
      <span className="inline-block size-1.5 rounded-full bg-ember" />
      {children}
    </span>
  );
}
