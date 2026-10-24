"use client";

import React, { useId, useState } from "react";
import { Lock, X } from "lucide-react";
import { cn } from "@/lib/utils";

/* ── Sparkline ────────────────────────────────────────────────────────────
   A hand-drawn area spark (no chart library, no keyboard surface): a single
   smooth-ish polyline over a fading fill. It lives inside KPI cards, where
   recharts would pay a runtime cost for 20 points of decoration. */

export function Sparkline({
  data,
  className,
  stroke = "var(--chart-1)",
}: {
  data: number[];
  className?: string;
  stroke?: string;
}) {
  const gid = useId().replace(/[:]/g, "");
  const w = 64;
  const h = 26;
  const n = Math.max(data.length - 1, 1);
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / n) * w;
    const y = h - 2 - ((v - min) / span) * (h - 5);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className={cn("overflow-visible", className)}
      style={{ width: w, height: h }}
      aria-hidden
    >
      <defs>
        <linearGradient id={`spark-${gid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.28" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polygon
        points={`0,${h} ${points.join(" ")} ${w},${h}`}
        fill={`url(#spark-${gid})`}
      />
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

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
  actions,
  children,
}: {
  title: string;
  sub?: string;
  actions?: React.ReactNode;
  children?: React.ReactNode;
}) {
  const aside = actions ?? children;

  return (
    <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
      <div>
        <h1 className="h2 text-ink">{title}</h1>
        {sub && (
          <p className="mt-2.5 max-w-2xl text-[13.5px] leading-relaxed text-ink-2">{sub}</p>
        )}
      </div>
      {aside && <div className="flex flex-wrap items-center gap-2">{aside}</div>}
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
    <section className={cn("glass-panel overflow-hidden", className)}>
      {(title || actions) && (
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line/60 bg-surface-2/30 px-5 py-3.5">
          {typeof title === "string" ? (
            <h2 className="text-[13px] font-semibold tracking-tight text-ink">{title}</h2>
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
  suffix = "",
  prefix = "",
  hint,
  series,
}: {
  label: string;
  value: number | string;
  suffix?: string;
  prefix?: string;
  hint?: string;
  series?: number[];
}) {
  return (
    <div className="glass-card group relative overflow-hidden rounded-2xl p-5">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-signal/35 to-transparent"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-14 size-32 rounded-full bg-[radial-gradient(circle,var(--glow-3),transparent_70%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      />
      <p className="caption relative">{label}</p>
      <p className="relative mt-3.5 font-mono text-[29px] font-bold leading-none tracking-tight text-ink tnum">
        {prefix}
        {value}
        {suffix}
      </p>
      {(hint || (series && series.length > 1)) && (
        <p className="mt-3.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12.5px]">
          {hint && <span className="text-ink-3">{hint}</span>}
          {series && series.length > 1 && (
            <span className="ml-auto opacity-60 transition-opacity duration-200 group-hover:opacity-100">
              <Sparkline data={series} />
            </span>
          )}
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
  sending: "border-info/30 bg-info-wash text-info",
  scheduled: "border-info/30 bg-info-wash text-info",
  failed: "border-bad/30 bg-bad-wash text-bad",
  paused: "border-warn/30 bg-warn-wash text-warn",
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
    <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-line-strong bg-surface/55 p-1.5 backdrop-blur-md transition-[border-color,box-shadow,background-color] duration-150 ease-out focus-within:border-signal focus-within:bg-surface/75 focus-within:ring-[3px] focus-within:ring-signal/18">
      {tags.map((t) => (
        <span
          key={t}
          className="inline-flex items-center gap-1 rounded-md border border-line/80 bg-surface-2/75 py-0.5 pl-2 pr-1 text-[12px] font-medium text-ink"
        >
          {t}
          <button
            type="button"
            onClick={() => onChange(tags.filter((x) => x !== t))}
            className="grid size-4 place-items-center rounded text-ink-3 transition-colors hover:bg-surface-3/80 hover:text-ink"
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
  "w-full rounded-lg border border-line-strong bg-surface/55 px-3 py-2 text-[13.5px] text-ink backdrop-blur-md dark:bg-surface-2/70",
  "placeholder:text-ink-3 outline-none",
  "transition-[border-color,box-shadow,background-color] duration-150 ease-out",
  "hover:border-ink-3",
  "focus:border-signal focus:bg-surface/80 focus:ring-[3px] focus:ring-signal/18"
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
    <div className="rounded-2xl border border-dashed border-line-strong bg-surface/20 px-6 py-14 text-center backdrop-blur-sm">
      <h3 className="h4 text-ink">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-[13.5px] leading-relaxed text-ink-2">
        {sub}
      </p>
      {children && <div className="mt-6 flex justify-center">{children}</div>}
    </div>
  );
}

export function Meter({
  pct,
  tone = "signal",
  label = "Progress",
}: {
  pct: number;
  tone?: "signal" | "amber" | "ok" | "warn";
  label?: string;
}) {  const fill =
    tone === "ok"
      ? "bg-gradient-to-r from-ok/70 to-ok"
      : tone === "warn"
        ? "bg-gradient-to-r from-warn/70 to-warn"
        : "bg-gradient-to-r from-brand-line/80 to-signal";
  return (
    <div
      className="h-1.5 w-full overflow-hidden rounded-full bg-surface-3/70 shadow-[inset_0_0_0_1px_var(--line)]"
      role="progressbar"
      aria-label={label}
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuetext={`${Math.round(pct)} percent`}
    >
      <div
        className={cn(
          "h-full rounded-full shadow-[0_0_12px_var(--signal)] transition-[width] duration-300 ease-out",
          fill
        )}
        style={{ width: `${Math.min(100, Math.max(pct > 0 ? 3 : 0, pct))}%` }}
      />
    </div>
  );
}

/* ── Async states ─────────────────────────────────────────────────────────
   Every view loads from the Worker, so these three states are shared rather
   than re-invented per view. */

export function LoadingBlock({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2.5 rounded-2xl border border-line bg-surface/40 px-6 py-16 text-[13px] text-ink-3">
      <span className="size-2 animate-pulse rounded-full bg-signal" aria-hidden />
      {label}
    </div>
  );
}

export function ErrorNotice({
  message,
  onRetry,
  detail,
}: {
  message: string;
  onRetry?: () => void;
  detail?: string;
}) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-bad/30 bg-bad-wash px-4 py-3.5 text-[13px] leading-relaxed text-bad"
    >
      <p className="font-semibold">That did not work</p>
      <p className="mt-1 text-bad/90">{message}</p>
      {detail && <p className="mt-1.5 font-mono text-[11px] text-bad/75">{detail}</p>}
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-2.5 rounded-md border border-bad/40 bg-surface/60 px-2.5 py-1 text-[12px] font-semibold text-bad transition-colors hover:bg-surface"
        >
          Try again
        </button>
      )}
    </div>
  );
}

export function LockedNotice({
  feature,
  plan,
  message,
  onUpgrade,
}: {
  feature: string;
  plan: string;
  message: string;
  onUpgrade: () => void;
}) {
  return (
    <Panel className="mx-auto max-w-xl">
      <div className="py-6 text-center">
        <span className="mx-auto grid size-11 place-items-center rounded-full border border-line bg-surface-2 text-ink-2">
          <Lock className="size-5" aria-hidden />
        </span>
        <h2 className="h3 mt-4 text-ink">{feature} is a higher-tier feature</h2>
        <p className="mx-auto mt-2 max-w-sm text-[13.5px] leading-relaxed text-ink-2">
          {message}
        </p>
        <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.1em] text-ink-3">
          Current plan: {plan}
        </p>
        <button
          type="button"
          onClick={onUpgrade}
          className="mt-5 inline-flex h-9 items-center justify-center rounded-md bg-ink px-4 text-[13px] font-semibold text-ink-invert transition-colors hover:bg-ink/88"
        >
          See plans
        </button>
      </div>
    </Panel>
  );
}
