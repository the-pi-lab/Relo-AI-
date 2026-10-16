"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

/* ──────────────────────────────────────────────────────────────────────
   Section head — headline + sub. No eyebrow badge above the headline.
   ───────────────────────────────────────────────────────────────────── */

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
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="h2 text-text">{title}</h1>
        {sub && <p className="mt-2 text-sm text-text-2 leading-relaxed">{sub}</p>}
      </div>
      {children && <div className="flex items-center gap-3">{children}</div>}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────
   Stat card — clean, no shimmer, no icon box, consistent spacing.
   ───────────────────────────────────────────────────────────────────── */

export function StatCard({
  label,
  value,
  delta,
  suffix = "",
  prefix = "",
}: {
  label: string;
  value: number | string;
  delta?: string;
  suffix?: string;
  prefix?: string;
}) {
  const up = delta?.startsWith("+");
  return (
    <div className="rounded-lg border border-border bg-surface p-5 shadow-sm">
      <p className="caption">{label}</p>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="text-[24px] font-bold text-text tnum">{prefix}{value}{suffix}</span>
      </div>
      {delta && (
        <p className="mt-3 text-xs flex items-center gap-1">
          <span
            className={`size-1.5 rounded-full ${up ? "bg-ok" : "bg-bad"}`}
            aria-hidden
          />
          <span className={cn(up ? "text-ok" : "text-bad", "font-semibold")}>{delta}</span>
          <span className="text-text-3"> vs last period</span>
        </p>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────
   Status pill — small, solid tone, no pulse animation.
   ───────────────────────────────────────────────────────────────────── */

const PILL_TONES: Record<string, string> = {
  live: "bg-ok/10 text-ok border-ok/30",
  active: "bg-ok/10 text-ok border-ok/30",
  sending: "bg-accent/10 text-accent border-accent/40",
  scheduled: "bg-surface-2 text-text-3 border-border",
  draft: "bg-surface-2 text-text-3 border-border",
  completed: "bg-ok/10 text-ok border-ok/30",
  failed: "bg-bad/10 text-bad border-bad/30",
  paused: "bg-surface-2 text-text-3 border-border",
};

export function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider",
        PILL_TONES[status] ?? PILL_TONES.draft
      )}
    >
      {status}
    </span>
  );
}

/* ──────────────────────────────────────────────────────────────────────
   Tag input
   ───────────────────────────────────────────────────────────────────── */

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
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-surface-2 p-2.5">
      {tags.map((t) => (
        <span key={t} className="inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1 text-[11px] font-semibold text-accent-ink">
          {t}
          <button
            type="button"
            onClick={() => onChange(tags.filter((x) => x !== t))}
            className="opacity-70 hover:opacity-100"
            aria-label={`Remove ${t}`}
          >
            <X className="size-3.5" />
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
          if (e.key === "Backspace" && !draft && tags.length) onChange(tags.slice(0, -1));
        }}
        onBlur={add}
        placeholder={tags.length ? "" : placeholder}
        className="min-w-[120px] flex-1 bg-transparent px-2 py-1 text-sm outline-none placeholder:text-text-3"
      />
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────
   Field wrapper — consistent label, no buzzwords.
   ───────────────────────────────────────────────────────────────────── */

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
      <span className="mb-2 flex items-baseline justify-between">
        <span className="caption font-semibold">{label}</span>
        {hint && <span className="text-xs text-text-3">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

export const inputCls =
  "w-full rounded-md border border-input bg-surface-2 px-3.5 py-2.5 text-sm outline-none transition-colors placeholder:text-text-3 focus:border-accent focus:ring-1 focus:ring-accent";

/* ──────────────────────────────────────────────────────────────────────
   Empty state — simple, no icon box.
   ───────────────────────────────────────────────────────────────────── */

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
    <div className="rounded-lg border border-dashed border-border bg-surface-2/60 p-10 text-center">
      <h3 className="h4 text-text">{title}</h3>
      <p className="mt-2 text-sm text-text-2 leading-relaxed">{sub}</p>
      {children && <div className="mt-6">{children}</div>}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────
   Credit meter
   ───────────────────────────────────────────────────────────────────── */

export function Meter({ pct, tone = "amber" }: { pct: number; tone?: "amber" | "ok" | "warn" }) {
  const color = tone === "ok" ? "var(--ok)" : tone === "warn" ? "var(--warn)" : "var(--accent)";
  return (
    <div className="h-[8px] w-full overflow-hidden rounded-full bg-surface-3">
      <div
        className="h-full rounded-full"
        style={{
          background: color,
          width: `${Math.min(100, Math.max(3, pct))}%`,
        }}
      />
    </div>
  );
}
