"use client";

import React, { useState } from "react";
import { ArrowDownRight, ArrowUpRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

/* ==========================================================================
   Studio primitives.

   These exist so all ten views share one card shape, one field shape and one
   pill shape. If a view needs something these do not provide, it should be
   added here rather than improvised locally.
   ========================================================================== */

/* ── View header ──────────────────────────────────────────────────────────
   Each view owns its own title. The shell deliberately does not repeat it in
   the top bar, which is what made every page show its name twice. */

export function ViewHead({
  title,
  sub,
  children,
}: {
  title: string;
  sub?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
      <div>
        <h1 className="h3 text-ink">{title}</h1>
        {sub && (
          <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed text-ink-2">{sub}</p>
        )}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

/* ── Panel ────────────────────────────────────────────────────────────────
   The one container shape for a group of content. */

export function Panel({
  title,
  actions,
  children,
  className,
  bodyClassName,
}: {
  title?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-xl border border-line bg-surface shadow-[var(--sh-1)]",
        className
      )}
    >
      {(title || actions) && (
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3.5">
          {typeof title === "string" ? (
            <h2 className="text-[13.5px] font-semibold text-ink">{title}</h2>
          ) : (
            title
          )}
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={cn("p-5", bodyClassName)}>{children}</div>
    </section>
  );
}

/* ── Stat ─────────────────────────────────────────────────────────────────
   A figure, a label, and an optional movement. Monospace figures so two
   cards side by side never jitter against each other. */

export function StatCard({
  label,
  value,
  delta,
  suffix = "",
  prefix = "",
  hint,
}: {
  label: string;
  value: number | string;
  delta?: string;
  suffix?: string;
  prefix?: string;
  hint?: string;
}) {
  const up = delta?.startsWith("+");
  return (
    <div className="rounded-xl border border-line bg-surface p-5 shadow-[var(--sh-1)]">
      <p className="caption">{label}</p>
      <p className="mt-3.5 font-mono text-[26px] font-bold leading-none tracking-tight text-ink tnum">
        {prefix}
        {value}
        {suffix}
      </p>
      {(delta || hint) && (
        <p className="mt-3.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12.5px]">
          {delta && (
            <>
              <span
                className={cn(
                  "inline-flex items-center gap-1 font-semibold",
                  up ? "text-ok" : "text-bad"
                )}
              >
                {up ? (
                  <ArrowUpRight className="size-3.5" aria-hidden />
                ) : (
                  <ArrowDownRight className="size-3.5" aria-hidden />
                )}
                {delta.replace(/^[+-]/, "")}
              </span>
              <span className="text-ink-3">against last period</span>
            </>
          )}
          {hint && !delta && <span className="text-ink-3">{hint}</span>}
        </p>
      )}
    </div>
  );
}

/* ── Status ─────────────────────────────────────────────────────────────── */

const PILL_TONES: Record<string, string> = {
  live: "border-ok/30 bg-ok-wash text-ok",
  active: "border-ok/30 bg-ok-wash text-ok",
  completed: "border-ok/30 bg-ok-wash text-ok",
  sent: "border-ok/30 bg-ok-wash text-ok",
  sending: "border-signal/30 bg-signal-wash text-signal",
  scheduled: "border-signal/30 bg-signal-wash text-signal",
  failed: "border-bad/30 bg-bad-wash text-bad",
  paused: "border-line bg-surface-2 text-ink-3",
  draft: "border-line bg-surface-2 text-ink-3",
  locked: "border-line bg-surface-2 text-ink-3",
};

export function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold capitalize leading-5",
        PILL_TONES[status] ?? PILL_TONES.draft
      )}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {status}
    </span>
  );
}

/* ── Tag input ────────────────────────────────────────────────────────────
   Neutral chips, because keywords are data rather than actions. */

export function TagInput({
  tags,
  onChange,
  placeholder,
  max = 12,
}: {
  tags: string[];
  onChange: (t: string[]) => void;
  placeholder?: string;
  max?: number;
}) {
  const [draft, setDraft] = useState("");

  const add = () => {
    const v = draft.trim().toLowerCase().replace(/\s+/g, "");
    if (!v || tags.includes(v) || tags.length >= max) return;
    onChange([...tags, v]);
    setDraft("");
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-line-strong bg-surface p-1.5 transition-[border-color,box-shadow] duration-150 ease-out focus-within:border-signal focus-within:ring-[3px] focus-within:ring-signal/18">
      {tags.map((t) => (
        <span
          key={t}
          className="inline-flex items-center gap-1 rounded border border-line bg-surface-2 py-0.5 pl-2 pr-1 text-[12px] font-medium text-ink"
        >
          {t}
          <button
            type="button"
            onClick={() => onChange(tags.filter((x) => x !== t))}
            className="grid size-4 place-items-center rounded text-ink-3 transition-colors hover:bg-surface-3 hover:text-ink"
            aria-label={`Remove ${t}`}
          >
            <X className="size-3" aria-hidden />
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === ",") && draft.trim()) {
            e.preventDefault();
            add();
          }
          if (e.key === "Backspace" && !draft && tags.length) {
            onChange(tags.slice(0, -1));
          }
        }}
        onBlur={add}
        placeholder={tags.length ? "" : placeholder}
        className="min-w-[110px] flex-1 bg-transparent px-1.5 py-1 text-[13.5px] text-ink outline-none placeholder:text-ink-3"
      />
    </div>
  );
}

/* ── Field ──────────────────────────────────────────────────────────────── */

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 flex items-baseline justify-between gap-3">
        <span className="caption">{label}</span>
        {hint && <span className="text-[12px] text-ink-3">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

export const inputCls = cn(
  "w-full rounded-md border border-line-strong bg-surface px-3 py-2 text-[13.5px] text-ink",
  "placeholder:text-ink-3 outline-none",
  "transition-[border-color,box-shadow] duration-150 ease-out",
  "hover:border-ink-3",
  "focus:border-signal focus:ring-[3px] focus:ring-signal/18"
);

/* ── Empty state ────────────────────────────────────────────────────────── */

export function EmptyState({
  title,
  sub,
  children,
}: {
  title: string;
  sub: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-line-strong px-6 py-14 text-center">
      <h3 className="h4 text-ink">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-[13.5px] leading-relaxed text-ink-2">
        {sub}
      </p>
      {children && <div className="mt-6 flex justify-center">{children}</div>}
    </div>
  );
}

/* ── Meter ──────────────────────────────────────────────────────────────── */

export function Meter({
  pct,
  tone = "signal",
}: {
  pct: number;
  tone?: "signal" | "amber" | "ok" | "warn";
}) {
  const fill = tone === "ok" ? "bg-ok" : tone === "warn" ? "bg-warn" : "bg-signal";
  return (
    <div
      className="h-1.5 w-full overflow-hidden rounded-full bg-surface-3"
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn("h-full rounded-full transition-[width] duration-300 ease-out", fill)}
        style={{ width: `${Math.min(100, Math.max(pct > 0 ? 3 : 0, pct))}%` }}
      />
    </div>
  );
}
