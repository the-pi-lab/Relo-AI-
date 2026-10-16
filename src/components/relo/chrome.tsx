"use client";

import React, { useRef, useState } from "react";
import { cn } from "@/lib/utils";

/* ──────────────────────────────────────────────────────────────────────
   Buttons — solid, honest states. Hover darkens the fill; nothing fades,
   shimmers, glows, or follows the cursor. No default shadcn look.
   ───────────────────────────────────────────────────────────────────── */

export type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "amber" | "ink" | "paper" | "outline" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
};

export function RButton({
  variant = "amber",
  size = "md",
  className,
  disabled,
  children,
  ...props
}: BtnProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={cn(
        "relative inline-flex items-center justify-center gap-2 rounded-lg font-semibold text-sm select-none transition-colors",
        "focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2",
        "disabled:opacity-50 disabled:pointer-events-none",
        size === "sm" && "h-9 px-3.5 text-[12.5px]",
        size === "md" && "h-10 px-4 text-[13.5px]",
        size === "lg" && "h-11 px-5 text-[15px]",
        variant === "amber" &&
          "bg-accent text-accent-ink hover:bg-accent-hover active:bg-accent-hover shadow-sm",
        variant === "ink" &&
          "bg-text text-text-inverse hover:bg-text-2 active:bg-text-2 shadow-sm",
        variant === "paper" &&
          "bg-surface-2 text-text hover:bg-surface-3 active:bg-surface-3 border border-border shadow-sm",
        variant === "outline" &&
          "border border-border bg-transparent text-text hover:border-text-3 active:bg-muted shadow-sm",
        variant === "ghost" &&
          "bg-transparent text-text-3 hover:text-text hover:bg-muted active:bg-muted",
        variant === "destructive" &&
          "bg-bad text-bad-ink hover:bg-bad active:bg-bad shadow-sm",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

/* ──────────────────────────────────────────────────────────────────────
   Logo — simple wordmark + mark. No gradient, no orbit ring, no motion.
   ───────────────────────────────────────────────────────────────────── */

export function Logo({ onClick }: { onClick?: () => void } = {}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2.5 rounded-lg font-bold text-[17px] tracking-tight select-none transition-colors hover:opacity-90 active:opacity-80"
      aria-label="RELO home"
    >
      <span
        className="grid size-7 place-items-center rounded-md bg-accent text-accent-ink font-black text-[15px] leading-none shadow-sm"
      >
        R
      </span>
      <span className="text-text">RELO</span>
      <span className="text-accent">.</span>
    </button>
  );
}

/* ──────────────────────────────────────────────────────────────────────
   Simple section header — headline + sub, no eyebrow badge above it.
   ───────────────────────────────────────────────────────────────────── */

export function SectionHead({
  title,
  sub,
}: {
  title: string;
  sub?: string;
}) {
  return (
    <div className="flex flex-wrap items-end gap-4">
      <div>
        <h2 className="h2 text-text">{title}</h2>
        {sub && <p className="mt-3 lead">{sub}</p>}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────
   Field label — consistent, no buzzwords.
   ───────────────────────────────────────────────────────────────────── */

export function FieldLabel({ label, hint }: { label: string; hint?: string }) {
  return (
    <span className="block mb-2 flex items-baseline justify-between">
      <span className="caption font-semibold">{label}</span>
      {hint && <span className="text-xs text-text-3">{hint}</span>}
    </span>
  );
}
