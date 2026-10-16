"use client";

import React from "react";
import { cn } from "@/lib/utils";

/* ==========================================================================
   Shared primitives.

   Rules these enforce, so no page has to remember them:
   · hover changes colour or border, never just opacity
   · press is a real 1px settle, not a fade
   · focus is always visible
   · one radius set, one border colour, one elevation step
   ========================================================================== */

export function Container({
  className,
  children,
  as: As = "div",
}: {
  className?: string;
  children: React.ReactNode;
  as?: React.ElementType;
}) {
  return <As className={cn("wrap", className)}>{children}</As>;
}

/* ── Button ─────────────────────────────────────────────────────────────── */

export type ButtonVariant =
  | "signal"
  | "ink"
  | "outline"
  | "ghost"
  | "destructive";

export type ButtonSize = "sm" | "md" | "lg";

export const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant;
    size?: ButtonSize;
  }
>(function Button(
  { variant = "ink", size = "md", className, disabled, children, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      type="button"
      disabled={disabled}
      className={cn(
        "relative inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap rounded-md font-semibold",
        "transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-out",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal",
        "active:translate-y-px",
        "disabled:pointer-events-none disabled:opacity-45",
        size === "sm" && "h-8 px-3 text-[12.5px]",
        size === "md" && "h-9 px-3.5 text-[13.5px]",
        size === "lg" && "h-11 px-5 text-[14.5px]",
        variant === "signal" &&
          "bg-signal text-signal-ink shadow-[var(--sh-1)] hover:bg-signal-hover",
        variant === "ink" &&
          "bg-ink text-ink-invert shadow-[var(--sh-1)] hover:bg-ink/88",
        variant === "outline" &&
          "border border-line-strong bg-surface text-ink hover:border-ink-3 hover:bg-surface-2",
        variant === "ghost" &&
          "text-ink-2 hover:bg-surface-2 hover:text-ink",
        variant === "destructive" && "bg-bad text-bad-ink hover:bg-bad/88",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
});

/* ── Logo ───────────────────────────────────────────────────────────────── */

/* The mark says what the product does: a comment, and an arrow leaving it. */
function ReloMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M11.5 5.5H5.5A2.5 2.5 0 0 0 3 8v5a2.5 2.5 0 0 0 2.5 2.5H7v3.2L11 15.5h.5" />
      <path d="M14.5 10.5h6.5m0 0-2.8-2.8m2.8 2.8-2.8 2.8" />
    </svg>
  );
}

export function Logo({
  onClick,
  className,
  size = "md",
}: {
  onClick?: () => void;
  className?: string;
  size?: "md" | "lg";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="RELO, home"
      className={cn(
        "group inline-flex select-none items-center gap-2.5 rounded-md",
        "transition-colors duration-150 ease-out",
        className
      )}
    >
      <span
        className={cn(
          "grid shrink-0 place-items-center rounded-[7px] bg-ink text-canvas",
          "transition-colors duration-150 ease-out group-hover:bg-signal group-hover:text-signal-ink",
          size === "md" ? "size-7" : "size-8"
        )}
      >
        <ReloMark className={size === "md" ? "size-[17px]" : "size-5"} />
      </span>
      <span
        className={cn(
          "font-extrabold tracking-[-0.045em] text-ink",
          size === "md" ? "text-[17px]" : "text-[19px]"
        )}
      >
        RELO
        <span className="text-signal">.</span>
      </span>
    </button>
  );
}

/* ── Section head ───────────────────────────────────────────────────────── */

/* Headline, optional standfirst, optional actions. No badge above it. */
export function SectionHead({
  title,
  sub,
  actions,
  align = "start",
  className,
}: {
  title: React.ReactNode;
  sub?: React.ReactNode;
  actions?: React.ReactNode;
  align?: "start" | "center";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-end justify-between gap-x-8 gap-y-5",
        align === "center" && "flex-col items-center text-center",
        className
      )}
    >
      <div className={cn("max-w-2xl", align === "center" && "max-w-3xl")}>
        <h2 className="h2 text-ink">{title}</h2>
        {sub && <p className="lead mt-3.5">{sub}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2.5">{actions}</div>}
    </div>
  );
}

/* ── Field ──────────────────────────────────────────────────────────────── */

export function Field({
  label,
  hint,
  htmlFor,
  children,
  className,
}: {
  label: string;
  hint?: React.ReactNode;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("block", className)}>
      <label
        htmlFor={htmlFor}
        className="mb-2 flex items-baseline justify-between gap-3"
      >
        <span className="caption">{label}</span>
        {hint && <span className="text-[12px] text-ink-3">{hint}</span>}
      </label>
      {children}
    </div>
  );
}

/* Shared input shell so every text field in the product is identical. */
export const inputClass = cn(
  "w-full rounded-md border border-line-strong bg-surface px-3 py-2 text-[14px] text-ink",
  "placeholder:text-ink-3",
  "transition-[border-color,box-shadow] duration-150 ease-out",
  "hover:border-ink-3",
  "focus:border-signal focus:outline-none focus:ring-[3px] focus:ring-signal/18"
);

/* ── Pill ───────────────────────────────────────────────────────────────── */

export type PillTone = "neutral" | "signal" | "ok" | "warn" | "bad";

const PILL: Record<PillTone, string> = {
  neutral: "border-line bg-surface-2 text-ink-2",
  signal: "border-signal/30 bg-signal-wash text-signal",
  ok: "border-ok/30 bg-ok-wash text-ok",
  warn: "border-warn/30 bg-warn-wash text-warn",
  bad: "border-bad/30 bg-bad-wash text-bad",
};

export function Pill({
  tone = "neutral",
  className,
  children,
}: {
  tone?: PillTone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold leading-5",
        PILL[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

/* A small filled dot, for use inside a Pill or beside a label. */
export function Dot({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("size-1.5 shrink-0 rounded-full bg-current", className)}
    />
  );
}
