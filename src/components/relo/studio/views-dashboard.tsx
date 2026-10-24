"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  CircleDashed,
  Eye,
  MessageCircle,
  Play,
  Rocket,
  ShieldAlert,
  ShieldCheck,
  Target,
  TrendingUp,
  Workflow,
  Zap,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useRelo } from "@/lib/relo/store";
import { fmtNum, timeAgo, type ActivityEvent, type DailyPoint } from "@/lib/relo/data";
import { Button } from "../chrome";
import { EmptyState, ErrorNotice, LoadingBlock } from "./studio-ui";

/* ==========================================================================
   The dashboard.

   Every number on this page is read from /api/analytics, /api/automations,
   /api/products or /api/link-page. There is no sample data and no invented
   comparison: a brand-new account sees honest zeroes plus the four steps that
   take it out of zero.
   ========================================================================== */

type Range = "today" | "window" | "lifetime";

const RANGE_LABEL: Record<Range, string> = {
  today: "Today",
  window: "Last 14 days",
  lifetime: "Lifetime",
};

/* ── Sparkline ───────────────────────────────────────────────────────────── */

function Spark({
  values,
  tone = "signal",
}: {
  values: number[];
  tone?: "signal" | "ok";
}) {
  const width = 120;
  const height = 30;
  const max = Math.max(1, ...values);
  const step = values.length > 1 ? width / (values.length - 1) : width;

  /* No buckets yet (first paint, or a brand-new account): a dashed baseline
     says "no data" instead of drawing an invalid path or a fake flat line. */
  if (values.length === 0) {
    return (
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        height={height}
        className="overflow-visible"
        aria-hidden
        preserveAspectRatio="none"
      >
        <line
          x1={0}
          y1={height - 2}
          x2={width}
          y2={height - 2}
          stroke="var(--line-strong)"
          strokeWidth={1.2}
          strokeDasharray="3 4"
        />
      </svg>
    );
  }

  const points = values.map((value, index) => {
    const x = index * step;
    const y = height - (value / max) * (height - 4) - 2;
    return [x, y] as const;
  });

  const line = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${width},${height} L0,${height} Z`;
  const stroke = tone === "ok" ? "var(--ok)" : "var(--signal)";

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      className="overflow-visible"
      aria-hidden
      preserveAspectRatio="none"
    >
      <path d={area} fill={stroke} opacity={0.09} />
      <path
        d={line}
        fill="none"
        stroke={stroke}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      {points.length > 0 && (
        <circle
          cx={points[points.length - 1][0]}
          cy={points[points.length - 1][1]}
          r={2.4}
          fill={stroke}
        />
      )}
    </svg>
  );
}

/* ── Funnel stage ────────────────────────────────────────────────────────── */

function Stage({
  icon: Icon,
  label,
  value,
  hint,
  series,
  tone = "signal",
  active,
}: {
  icon: typeof Eye;
  label: string;
  value: number;
  hint: string;
  series: number[];
  tone?: "signal" | "ok";
  active: boolean;
}) {
  return (
    <div className="card-elev group flex flex-col justify-between p-4 transition-transform duration-300 hover:-translate-y-0.5 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-lg bg-signal-wash text-signal">
            <Icon className="size-4" strokeWidth={1.9} aria-hidden />
          </span>
          <span className="text-[11.5px] font-semibold text-ink-2">{label}</span>
        </div>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums",
            active ? "bg-ok-wash text-ok" : "bg-surface-2 text-ink-3"
          )}
        >
          {active ? "live" : "idle"}
        </span>
      </div>

      <div className="mt-4 flex items-end justify-between gap-3">
        <div>
          <p className="text-[30px] font-extrabold leading-none tracking-[-0.03em] text-ink tabular-nums">
            {fmtNum(value)}
          </p>
          <p className="mt-1.5 text-[11px] font-medium text-ink-3">{hint}</p>
        </div>
        <Spark values={series} tone={tone} />
      </div>
    </div>
  );
}

function FunnelArrow() {
  return (
    <div className="hidden items-center justify-center lg:flex" aria-hidden>
      <svg width="26" height="12" viewBox="0 0 26 12" fill="none">
        <path
          d="M0 6h18M18 6l-4-4M18 6l-4 4"
          stroke="var(--line-strong)"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

/* ── Setup ring ──────────────────────────────────────────────────────────── */

function SetupRing({ pct }: { pct: number }) {
  const r = 32;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="relative grid size-[86px] shrink-0 place-items-center">
      <svg viewBox="0 0 80 80" className="size-[86px] -rotate-90">
        <circle cx="40" cy="40" r={r} fill="none" stroke="var(--surface-3)" strokeWidth="6" />
        <circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          stroke="var(--signal)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 900ms cubic-bezier(0.22,1,0.36,1)" }}
        />
      </svg>
      <span className="absolute text-[17px] font-extrabold tabular-nums text-ink">{pct}%</span>
    </div>
  );
}

function SetupStep({
  index,
  title,
  body,
  done,
  locked,
  actionLabel,
  onAction,
}: {
  index: number;
  title: string;
  body: string;
  done: boolean;
  locked?: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <li className="group flex items-start justify-between gap-3 border-b border-line/70 py-3.5 last:border-0">
      <div className="flex min-w-0 items-start gap-3">
        <span
          className={cn(
            "mt-0.5 grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-bold transition-colors",
            done
              ? "bg-ok text-white"
              : "border border-line-strong bg-surface-2 text-ink-2"
          )}
        >
          {done ? <Check className="size-3.5" strokeWidth={3} aria-hidden /> : index}
        </span>
        <div className="min-w-0">
          <p
            className={cn(
              "text-[12.5px] font-bold leading-snug transition-colors",
              done ? "text-ink-3 line-through decoration-line-strong" : "text-ink",
              !done && "group-hover:text-signal"
            )}
          >
            {title}
          </p>
          <p className="mt-0.5 text-[11.5px] leading-relaxed text-ink-3">{body}</p>
        </div>
      </div>

      {!done && (
        <button
          type="button"
          onClick={onAction}
          className="mt-0.5 shrink-0 rounded-lg bg-surface-2 px-2.5 py-1 text-[11px] font-bold text-ink transition-colors hover:bg-signal hover:text-white"
        >
          {locked ?? actionLabel}
        </button>
      )}
    </li>
  );
}

/* ── Quota row ───────────────────────────────────────────────────────────── */

function Quota({
  label,
  used,
  total,
  unlimited,
}: {
  label: string;
  used: number;
  total: number | null;
  unlimited?: boolean;
}) {
  const pct = unlimited || !total ? 0 : Math.min(100, (used / total) * 100);

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[11.5px] font-semibold text-ink-2">{label}</span>
        <span className="font-mono text-[11px] font-bold tabular-nums text-ink">
          {used.toLocaleString()}
          {unlimited ? " / ∞" : ` / ${(total ?? 0).toLocaleString()}`}
        </span>
      </div>
      <div className="quota-track mt-1.5">
        <div
          className="quota-fill"
          style={{ width: unlimited ? "100%" : `${pct}%`, opacity: unlimited ? 0.35 : 1 }}
        />
      </div>
    </div>
  );
}

/* ── Activity feed ───────────────────────────────────────────────────────── */

const STATUS_STYLE: Record<ActivityEvent["status"], string> = {
  completed: "bg-ok-wash text-ok",
  failed: "bg-bad-wash text-bad",
  pending: "bg-warn-wash text-warn",
  processing: "bg-signal-wash text-signal",
};

function ActivityFeed({ events }: { events: ActivityEvent[] }) {
  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-9 text-center">
        <CircleDashed className="size-6 text-ink-3" aria-hidden />
        <p className="text-[12.5px] font-semibold text-ink">No activity yet</p>
        <p className="max-w-[240px] text-[11.5px] leading-relaxed text-ink-3">
          The moment someone comments a keyword, the event lands here with its delivery
          status.
        </p>
      </div>
    );
  }

  return (
    <ul className="-my-1 max-h-[300px] divide-y divide-line/70 overflow-y-auto">
      {events.map((event) => (
        <li key={event.id} className="flex items-start gap-3 py-2.5">
          <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-surface-2 text-[10px] font-bold text-ink-2">
            {event.username.slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 text-[12px] font-semibold text-ink">
              <span className="truncate">@{event.username}</span>
              <span
                className={cn(
                  "shrink-0 rounded-full px-1.5 py-px text-[9px] font-bold uppercase tracking-wide",
                  STATUS_STYLE[event.status]
                )}
              >
                {event.status}
              </span>
            </p>
            <p className="truncate text-[11.5px] text-ink-3">“{event.comment}”</p>
          </div>
          <span className="shrink-0 font-mono text-[10px] text-ink-3">{timeAgo(event.at)}</span>
        </li>
      ))}
    </ul>
  );
}

/* ── Dashboard ───────────────────────────────────────────────────────────── */

export function DashboardView({ go }: { go: (view: string) => void }) {
  const {
    user,
    account,
    plan,
    limits,
    credits,
    telemetry,
    automations,
    products,
    linkPage,
  } = useRelo();

  const [range, setRange] = useState<Range>("window");
  const [filter, setFilter] = useState<"all" | "active" | "paused">("all");

  const daily: DailyPoint[] = telemetry.data?.daily ?? [];
  const activity = telemetry.data?.activity ?? [];

  const totals = useMemo(() => {
    const sum = (key: keyof DailyPoint) =>
      daily.reduce((acc, point) => acc + Number(point[key] ?? 0), 0);
    const today = daily[daily.length - 1];

    if (range === "lifetime") {
      return {
        comments: telemetry.data?.totalCommentsHeard ?? telemetry.data?.totalComments ?? 0,
        dms: telemetry.data?.totalDmsDelivered ?? telemetry.data?.totalComments ?? 0,
        leads: telemetry.data?.totalLeads ?? 0,
      };
    }
    if (range === "today") {
      return {
        comments: today?.comments ?? 0,
        dms: today?.dms ?? 0,
        leads: today?.leads ?? 0,
      };
    }
    return { comments: sum("comments"), dms: sum("dms"), leads: sum("leads") };
  }, [daily, range, telemetry.data]);

  const series = useMemo(
    () => ({
      comments: daily.map((d) => d.comments),
      dms: daily.map((d) => d.dms),
      leads: daily.map((d) => d.leads),
    }),
    [daily]
  );

  if (!account) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-[26px] font-extrabold tracking-[-0.035em] text-ink sm:text-[30px]">
            Welcome to RELO
          </h1>
          <p className="mt-1.5 max-w-xl text-[13.5px] leading-relaxed text-ink-2">
            Connect the Instagram account you post Reels from. RELO watches the comments on
            the Reels you choose and answers them through Instagram&rsquo;s official API.
          </p>
        </div>

        <EmptyState
          title="No Instagram account connected"
          sub="One Facebook Login round trip. The Page token is stored AES-GCM encrypted and never leaves the Worker in plain text."
        >
          <Button variant="signal" size="lg" onClick={() => go("settings")}>
            Connect Instagram
            <ArrowRight className="size-4" aria-hidden />
          </Button>
        </EmptyState>
      </div>
    );
  }

  const firstName = (user?.email ?? account.username).split("@")[0].split(/[._-]/)[0];
  const greetingName = firstName ? firstName.charAt(0).toUpperCase() + firstName.slice(1) : "";

  const setup = [
    {
      title: "Connect your Instagram account",
      body: "Grants comment and messaging permissions.",
      done: true,
      action: () => go("settings"),
      actionLabel: "Manage",
    },
    {
      title: "Create your first comment-to-DM flow",
      body: "One Reel, one keyword, one card.",
      done: (automations.data?.length ?? 0) > 0,
      action: () => go("automations"),
      actionLabel: "Create",
    },
    {
      title: "Publish your link-in-bio page",
      body: "The link you put in your Instagram bio.",
      done: Boolean(linkPage.data?.page?.isPublished),
      locked: limits.products ? undefined : "Pro",
      action: () => go("bio"),
      actionLabel: "Build",
    },
    {
      title: "Add a product or lead magnet",
      body: "Something worth commenting for.",
      done: (products.data?.length ?? 0) > 0,
      locked: limits.products ? undefined : "Pro",
      action: () => go("products"),
      actionLabel: "Add",
    },
  ];
  const setupDone = setup.filter((step) => step.done).length;
  const setupPct = Math.round((setupDone / setup.length) * 100);

  const allAutomations = automations.data ?? [];
  const visibleAutomations = allAutomations.filter((item) =>
    filter === "all" ? true : filter === "active" ? item.isActive : !item.isActive
  );

  const health = telemetry.data?.status ?? "healthy";
  const failed = telemetry.data?.failed24h ?? 0;
  const clickRate =
    totals.dms > 0 ? Math.round(((telemetry.data?.totalClicks ?? 0) / totals.dms) * 1000) / 10 : 0;

  return (
    <div className="space-y-5">
      {/* ── Zone C1: greeting + range ── */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[24px] font-extrabold tracking-[-0.035em] text-ink sm:text-[28px]">
            Welcome back{greetingName ? `, ${greetingName}` : ""}!
          </h1>
          <p className="mt-1 text-[12.5px] text-ink-3">
            {setupDone === setup.length
              ? "Every setup step is done. Here is what the Worker has handled."
              : `${setupDone} of ${setup.length} setup steps done — the rest take about two minutes each.`}
          </p>
        </div>

        <label className="relative inline-flex items-center">
          <span className="sr-only">Time range</span>
          <select
            value={range}
            onChange={(event) => setRange(event.target.value as Range)}
            className="h-9 appearance-none rounded-xl border border-line bg-surface pl-3 pr-8 text-[12.5px] font-semibold text-ink shadow-[var(--sh-1)] outline-none transition-colors hover:border-line-strong"
          >
            {(Object.keys(RANGE_LABEL) as Range[]).map((key) => (
              <option key={key} value={key}>
                {RANGE_LABEL[key]}
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-2.5 size-3.5 text-ink-3"
            aria-hidden
          />
        </label>
      </div>

      {telemetry.loading && <LoadingBlock label="Reading the Worker" />}
      {telemetry.error && (
        <ErrorNotice
          message={telemetry.error.message}
          detail={telemetry.error.code}
          onRetry={() => void telemetry.refresh()}
        />
      )}

      {/* ── Zone C: funnel ── */}
      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-[1fr_auto_1fr_auto_1fr]">
        <Stage
          icon={MessageCircle}
          label="Keyword comments"
          value={totals.comments}
          hint={
            range === "lifetime" ? "heard since you connected" : `heard in the ${RANGE_LABEL[range].toLowerCase()}`
          }
          series={series.comments}
          active={totals.comments > 0}
        />
        <FunnelArrow />
        <Stage
          icon={Workflow}
          label="DMs delivered"
          value={totals.dms}
          hint={
            totals.comments > 0
              ? `${Math.round((totals.dms / totals.comments) * 100)}% of those comments`
              : "nothing to deliver yet"
          }
          series={series.dms}
          active={totals.dms > 0}
        />
        <FunnelArrow />
        <Stage
          icon={Target}
          label="Leads captured"
          value={totals.leads}
          hint={
            totals.dms > 0
              ? `${Math.round((totals.leads / totals.dms) * 100)}% of delivered DMs`
              : "waiting on the first DM"
          }
          series={series.leads}
          tone="ok"
          active={totals.leads > 0}
        />
      </div>

      {/* ── Zones D + E ── */}
      <div className="grid gap-5 lg:grid-cols-12">
        {/* Get setup */}
        <section className="card-elev p-5 sm:p-6 lg:col-span-7">
          <div className="flex items-start justify-between gap-4 pb-4">
            <div>
              <h2 className="flex items-center gap-2 text-[15.5px] font-extrabold tracking-[-0.02em] text-ink">
                <Rocket className="size-4 text-signal" aria-hidden />
                Get setup
              </h2>
              <p className="mt-1 max-w-[38ch] text-[12px] leading-relaxed text-ink-3">
                Four steps between this screen and comments answering themselves.
              </p>
            </div>
            <SetupRing pct={setupPct} />
          </div>

          <ol>
            {setup.map((step, index) => (
              <SetupStep
                key={step.title}
                index={index + 1}
                title={step.title}
                body={step.body}
                done={step.done}
                locked={step.locked}
                actionLabel={step.actionLabel}
                onAction={step.action}
              />
            ))}
          </ol>
        </section>

        {/* Plan & quotas */}
        <section className="card-elev flex flex-col p-5 sm:p-6 lg:col-span-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-[15.5px] font-extrabold tracking-[-0.02em] text-ink">
                {plan === "free" ? "Starter plan" : plan === "pro" ? "Pro plan" : "Studio plan"}
              </h2>
              <p className="mt-0.5 text-[11.5px] text-ink-3">
                {plan === "free" ? "Free forever" : "Active subscription"}
              </p>
            </div>
            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide",
                plan === "free" ? "bg-surface-2 text-ink-3" : "badge-grad text-white"
              )}
            >
              {plan === "free" ? "Free" : plan === "pro" ? "Pro" : "Studio"}
            </span>
          </div>

          <div className="mt-4 space-y-3.5">
            <Quota
              label="Instagram accounts"
              used={1}
              total={limits.maxAccounts}
              unlimited={limits.maxAccounts > 1}
            />
            <Quota
              label="Active automations"
              used={allAutomations.filter((item) => item.isActive).length}
              total={plan === "free" ? 1 : null}
              unlimited={plan !== "free"}
            />
            <Quota label="AI credits left" used={credits} total={limits.credits} />
          </div>

          <div
            className={cn(
              "mt-4 flex items-center gap-2.5 rounded-xl border px-3 py-2.5",
              health === "healthy"
                ? "border-ok/25 bg-ok-wash"
                : "border-warn/25 bg-warn-wash"
            )}
          >
            {health === "healthy" ? (
              <ShieldCheck className="size-4 shrink-0 text-ok" aria-hidden />
            ) : (
              <ShieldAlert className="size-4 shrink-0 text-warn" aria-hidden />
            )}
            <div className="min-w-0">
              <p
                className={cn(
                  "text-[11.5px] font-bold",
                  health === "healthy" ? "text-ok" : "text-warn"
                )}
              >
                Meta API health: {health === "healthy" ? "safe" : "degraded"}
              </p>
              <p className="text-[10.5px] text-ink-3">
                {health === "healthy"
                  ? `No failed sends to retry${failed > 0 ? ` · ${failed} recovered` : ""}`
                  : `${failed} failed send${failed === 1 ? "" : "s"} in 24h`}
              </p>
            </div>
            <span className="relative ml-auto flex size-2 shrink-0" aria-hidden>
              <span
                className={cn(
                  "absolute inline-flex size-full animate-ping rounded-full opacity-60",
                  health === "healthy" ? "bg-ok" : "bg-warn"
                )}
              />
              <span
                className={cn(
                  "relative inline-flex size-2 rounded-full",
                  health === "healthy" ? "bg-ok" : "bg-warn"
                )}
              />
            </span>
          </div>

          <div className="mt-auto pt-4">
            <button
              type="button"
              onClick={() => go("settings")}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-line bg-surface-2/60 py-2 text-[12px] font-bold text-ink transition-colors hover:border-line-strong hover:bg-surface-2"
            >
              {plan === "free" ? "Compare plans" : "Manage subscription"}
              <ArrowUpRight className="size-3.5" aria-hidden />
            </button>
          </div>
        </section>
      </div>

      {/* ── Zone F: automations + activity ── */}
      <div className="grid items-start gap-5 lg:grid-cols-12">
        <section className="card-elev p-5 sm:p-6 lg:col-span-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-[15.5px] font-extrabold tracking-[-0.02em] text-ink">
                <Zap className="size-4 text-signal" aria-hidden />
                Recent automations
              </h2>
              <p className="mt-0.5 text-[11.5px] text-ink-3">
                {allAutomations.filter((item) => item.isActive).length} listening ·{" "}
                {allAutomations.length} total
              </p>
            </div>

            <button
              type="button"
              onClick={() => go("automations")}
              className="obsidian h-9 px-3.5 text-[12px]"
            >
              <span className="grid size-4 place-items-center rounded-full bg-white/15">
                <span className="text-[13px] leading-none">+</span>
              </span>
              New automation
            </button>
          </div>

          <div
            role="tablist"
            aria-label="Filter automations"
            className="mt-4 inline-flex rounded-xl bg-surface-2 p-0.5"
          >
            {(["all", "active", "paused"] as const).map((key) => (
              <button
                key={key}
                role="tab"
                aria-selected={filter === key}
                type="button"
                onClick={() => setFilter(key)}
                className={cn(
                  "rounded-[9px] px-2.5 py-1 text-[11.5px] font-semibold capitalize transition-colors",
                  filter === key ? "bg-surface text-ink shadow-[var(--sh-1)]" : "text-ink-3 hover:text-ink"
                )}
              >
                {key}
              </button>
            ))}
          </div>

          <div className="mt-3">
            {automations.loading ? (
              <LoadingBlock label="Loading automations" />
            ) : visibleAutomations.length === 0 ? (
              <div className="flex flex-col items-center gap-2.5 rounded-xl border border-dashed border-line-strong/60 px-4 py-8 text-center">
                <span className="grid size-10 place-items-center rounded-full bg-signal-wash text-signal">
                  <Play className="size-4" aria-hidden />
                </span>
                <p className="text-[12.5px] font-semibold text-ink">
                  {filter === "all"
                    ? "No automations yet"
                    : `No ${filter} automations`}
                </p>
                <p className="max-w-[300px] text-[11.5px] leading-relaxed text-ink-3">
                  {filter === "all"
                    ? "Pick one Reel, choose a keyword, write the reply. RELO handles the rest within a minute of the comment landing."
                    : "Switch the filter to see the rest of your flows."}
                </p>
                <button
                  type="button"
                  onClick={() => go("automations")}
                  className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-surface-2 px-3 py-1.5 text-[11.5px] font-bold text-ink transition-colors hover:bg-signal hover:text-white"
                >
                  Create the first one
                  <ArrowRight className="size-3" aria-hidden />
                </button>
              </div>
            ) : (
              <ul className="divide-y divide-line/70">
                {visibleAutomations.slice(0, 4).map((item) => (
                  <li key={item.id} className="flex items-center gap-3 py-2.5">
                    <span
                      className={cn(
                        "grid size-8 shrink-0 place-items-center rounded-lg bg-surface-2 bg-cover bg-center text-ink-3",
                        item.reelThumbnailUrl && "text-transparent"
                      )}
                      style={
                        item.reelThumbnailUrl
                          ? { backgroundImage: `url(${item.reelThumbnailUrl})` }
                          : undefined
                      }
                    >
                      <Play className="size-3.5" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12.5px] font-semibold text-ink">
                        {item.triggerKeywords.slice(0, 3).join(", ") || "No keyword"}
                      </p>
                      <p className="truncate text-[11px] text-ink-3">
                        {item.commentReplies.length} repl{item.commentReplies.length === 1 ? "y" : "ies"} ·{" "}
                        {item.updatedAt ? `updated ${timeAgo(item.updatedAt)}` : "never edited"}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wide",
                        item.isActive ? "bg-ok-wash text-ok" : "bg-surface-2 text-ink-3"
                      )}
                    >
                      {item.isActive ? "live" : "paused"}
                    </span>
                    <button
                      type="button"
                      onClick={() => go("automations")}
                      className="shrink-0 rounded-md p-1 text-ink-3 transition-colors hover:bg-surface-2 hover:text-ink"
                      aria-label={`Open automation with keywords ${item.triggerKeywords.join(", ")}`}
                    >
                      <ArrowRight className="size-3.5" aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* Live activity */}
        <section className="card-elev flex flex-col p-5 sm:p-6 lg:col-span-5">
          <div className="flex items-center justify-between gap-2 pb-3">
            <h2 className="flex items-center gap-2 text-[15.5px] font-extrabold tracking-[-0.02em] text-ink">
              <span className="relative flex size-2" aria-hidden>
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-signal opacity-60" />
                <span className="relative inline-flex size-2 rounded-full bg-signal" />
              </span>
              Live activity
            </h2>
            <button
              type="button"
              onClick={() => go("leads")}
              className="text-[11px] font-bold text-signal hover:underline"
            >
              All leads
            </button>
          </div>

          <ActivityFeed events={activity} />

          <div className="mt-auto grid grid-cols-3 gap-2 pt-4">
            {[
              { label: "Clicks", value: telemetry.data?.totalClicks ?? 0 },
              { label: "Click rate", value: `${clickRate}%` },
              { label: "Queued", value: telemetry.data?.pendingJobs ?? 0 },
            ].map((stat) => (
              <div key={stat.label} className="tile px-2.5 py-2 text-center">
                <p className="text-[14px] font-extrabold tabular-nums text-ink">{stat.value}</p>
                <p className="text-[9.5px] font-semibold uppercase tracking-wide text-ink-3">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Footer note: what this page cannot see */}
      <p className="flex items-center justify-center gap-1.5 pt-1 text-center text-[10.5px] text-ink-3">
        <TrendingUp className="size-3" aria-hidden />
        Comments and DMs are counted from the Worker&rsquo;s job log — impressions are not
        collected, so they are not shown.
      </p>
    </div>
  );
}
