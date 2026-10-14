"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { CountUp } from "../chrome";

/* ── view header ─────────────────────────────────────────────────────── */

export function ViewHead({
  title,
  sub,
  children,
}: {
  title: React.ReactNode;
  sub?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-[26px] font-bold tracking-tight sm:text-3xl">{title}</h1>
        {sub && <p className="mt-1 max-w-xl text-[13.5px] leading-relaxed text-ink-3">{sub}</p>}
      </div>
      {children && <div className="flex items-center gap-2.5">{children}</div>}
    </div>
  );
}

/* ── stat card with sparkline ────────────────────────────────────────── */

export function StatCard({
  label,
  value,
  delta,
  spark,
  icon: Icon,
  suffix = "",
  prefix = "",
}: {
  label: string;
  value: number;
  delta?: string;
  spark?: number[];
  icon: typeof Plus;
  suffix?: string;
  prefix?: string;
}) {
  const up = delta?.startsWith("+");
  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 350, damping: 24 }}
      className="group relative overflow-hidden rounded-3xl border border-line bg-card p-5 shadow-[var(--shadow-soft)] transition-all duration-300 hover:border-ember/40 hover:shadow-[var(--shadow-lift)]"
    >
      <div className="flex items-center justify-between">
        <p className="font-mono text-[10px] tracking-[0.18em] text-ink-3 uppercase">{label}</p>
        {Icon && (
          <span className="grid size-7 place-items-center rounded-lg bg-ember-wash text-ember-deep transition-transform duration-200 group-hover:scale-110">
            <Icon className="size-3.5" />
          </span>
        )}
      </div>
      <p className="font-display mt-2.5 text-[28px] font-extrabold leading-none tracking-tight">
        <CountUp to={value} prefix={prefix} suffix={suffix} />
      </p>
      <div className="mt-2 flex items-end justify-between gap-3">
        {delta && (
          <span
            className={cn(
              "font-mono text-[11px] font-medium",
              up ? "text-moss" : "text-clay"
            )}
          >
            {delta} <span className="text-ink-4">vs last week</span>
          </span>
        )}
        {spark && <Spark data={spark} />}
      </div>
    </motion.div>
  );
}

export function Spark({ data, w = 84, h = 28 }: { data: number[]; w?: number; h?: number }) {
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / (max - min || 1)) * (h - 4) - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg width={w} height={h} aria-hidden className="shrink-0 overflow-visible">
      <motion.polyline
        points={pts}
        fill="none"
        stroke="var(--ember)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.4, ease: "easeOut" }}
      />
    </svg>
  );
}

/* ── status pill ─────────────────────────────────────────────────────── */

const PILL_TONES: Record<string, string> = {
  live: "bg-moss/15 text-moss border-moss/30",
  active: "bg-moss/15 text-moss border-moss/30",
  sending: "bg-honey/15 text-honey border-honey/40",
  scheduled: "bg-sky/15 text-sky border-sky/40",
  draft: "bg-ink/5 text-ink-3 border-line-strong",
  completed: "bg-sky/15 text-sky border-sky/40",
  failed: "bg-ember/12 text-ember-deep border-ember/35",
  paused: "bg-ink/5 text-ink-3 border-line-strong",
};

export function StatusPill({ status, pulse }: { status: string; pulse?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-medium tracking-wider uppercase transition-all duration-200 hover:scale-105",
        PILL_TONES[status] ?? PILL_TONES.draft
      )}
    >
      {pulse && (
        <span className="relative flex size-1.5 items-center justify-center">
          <span className="absolute inline-flex size-full rounded-full bg-current opacity-75 radar-ring" />
          <span className="relative inline-flex size-1.5 rounded-full bg-current" />
        </span>
      )}
      {status}
    </span>
  );
}

/* ── tag input ───────────────────────────────────────────────────────── */

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
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-line-strong bg-card-soft p-2.5">
      {tags.map((t) => (
        <motion.span
          key={t}
          layout
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="on-ember inline-flex items-center gap-1.5 rounded-full bg-ember px-3 py-1 font-mono text-[12px] font-medium"
        >
          {t}
          <button
            type="button"
            onClick={() => onChange(tags.filter((x) => x !== t))}
            className="opacity-70 "
            aria-label={`Remove ${t}`}
          >
            <X className="size-3" />
          </button>
        </motion.span>
      ))}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            add();
          }
          if (e.key === "Backspace" && !draft && tags.length) onChange(tags.slice(0, -1));
        }}
        onBlur={add}
        placeholder={tags.length ? "" : placeholder}
        className="min-w-32 flex-1 bg-transparent px-2 py-1 font-mono text-[13px] outline-none placeholder:text-ink-4"
      />
    </div>
  );
}

/* ── meter (credits etc.) ────────────────────────────────────────────── */

export function Meter({ pct, tone = "ember" }: { pct: number; tone?: "ember" | "moss" | "honey" }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink/8">
      <motion.div
        className={cn(
          "h-full rounded-full",
          tone === "ember" && "bg-ember",
          tone === "moss" && "bg-moss",
          tone === "honey" && "bg-honey"
        )}
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, Math.max(3, pct))}%` }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.28, 1] }}
      />
    </div>
  );
}

/* ── empty state ─────────────────────────────────────────────────────── */

export function EmptyState({
  icon: Icon,
  title,
  sub,
  children,
}: {
  icon: typeof Plus;
  title: string;
  sub: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="grid place-items-center rounded-3xl border border-dashed border-line-strong bg-card-soft/60 px-8 py-16 text-center">
      <div className="grid size-14 place-items-center rounded-2xl bg-ember-wash text-ember-deep">
        <Icon className="size-7" />
      </div>
      <h3 className="font-display mt-4 text-lg font-bold">{title}</h3>
      <p className="mt-1.5 max-w-sm text-[13.5px] text-ink-3">{sub}</p>
      {children && <div className="mt-5">{children}</div>}
    </div>
  );
}

/* ── field wrapper ───────────────────────────────────────────────────── */

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
      <span className="mb-2 flex items-baseline justify-between font-mono text-[10.5px] tracking-[0.18em] text-ink-3 uppercase">
        {label}
        {hint && <span className="text-[9.5px] tracking-normal text-ink-4 normal-case">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

export const inputCls =
  "w-full rounded-xl border border-line-strong bg-card-soft px-3.5 py-2.5 text-[14px] outline-none transition-all placeholder:text-ink-4 focus:border-ember/60 focus:bg-[var(--input-focus-bg)] focus:shadow-[0_0_0_4px_rgba(139,128,249,0.08)]";
