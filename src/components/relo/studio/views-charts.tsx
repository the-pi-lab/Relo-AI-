"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { ArrowRight, Clock3 } from "lucide-react";
import { useRelo } from "@/lib/relo/store";
import { DM_SERIES, fmtNum, timeAgo } from "@/lib/relo/data";
import { Meter, Panel, StatCard, StatusPill, ViewHead } from "./studio-ui";
import { Button } from "../chrome";
import { cn } from "@/lib/utils";

/* ── Chart chrome ─────────────────────────────────────────────────────────
   Axis, grid and tooltip are declared once so every chart in the studio
   reads as the same instrument. No hex values, only tokens. */

const AXIS = {
  fontSize: 11,
  fill: "var(--ink-3)",
  fontFamily: "var(--font-mono)",
} as const;

const TOOLTIP_CONTENT: CSSProperties = {
  background: "var(--surface)",
  border: "1px solid var(--line)",
  borderRadius: 9,
  boxShadow: "var(--sh-2)",
  padding: "6px 10px",
};

const TOOLTIP_LABEL: CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: 10,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "var(--ink-3)",
};

const TOOLTIP_ITEM: CSSProperties = { fontSize: 11.5, color: "var(--ink)" };

const BAR_CURSOR = { fill: "var(--surface-2)" };
const LINE_CURSOR = { stroke: "var(--line)" };

/* ═════════════════════════════════════════════════════════════════════
   HOME
   ═════════════════════════════════════════════════════════════════════ */

export function HomeView({ go }: { go: (v: string) => void }) {
  const { automations, activity, leads, toggleAutomation } = useRelo();
  const dmsToday = automations.reduce((a, x) => a + x.triggersToday, 0);
  const clicks = automations.reduce((a, x) => a + x.clicks, 0);
  const dms = automations.reduce((a, x) => a + x.dmsSent, 0);
  const rate = Math.round((clicks / Math.max(1, dms)) * 100);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const engine = [
    { key: "Queue depth", value: "3 jobs", pct: 92 },
    { key: "Webhook ack", value: "14ms avg", pct: 97 },
    { key: "Cron (1 min)", value: "on time", pct: 100 },
    { key: "Failed (24h)", value: "2 · retried", pct: 88 },
  ];

  return (
    <div className="space-y-6">
      <ViewHead
        title={greeting}
        sub="Your reels kept talking overnight. Here is what they said, and who they sold to."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="DMs today" value={dmsToday} delta="+12%" />
        <StatCard label="Leads captured" value={leads.length} delta="+8%" />
        <StatCard label="Button clicks" value={clicks} delta="+21%" />
        <StatCard label="DM to click" value={rate} suffix="%" delta="+3%" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.55fr_1fr]">
        <Panel
          title={
            <div>
              <h2 className="text-[13.5px] font-semibold text-ink">Comments to DMs</h2>
              <p className="caption mt-0.5">Last 14 days</p>
            </div>
          }
          actions={
            <Button variant="outline" size="sm" onClick={() => go("insights")}>
              Full insights
              <ArrowRight className="size-3.5" strokeWidth={1.75} aria-hidden />
            </Button>
          }
        >
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={DM_SERIES} margin={{ top: 8, right: 8, bottom: 8, left: -10 }}>
                <CartesianGrid stroke="var(--line)" vertical={false} />
                <XAxis
                  dataKey="day"
                  tick={AXIS}
                  tickLine={false}
                  axisLine={false}
                  interval={3}
                />
                <YAxis tick={AXIS} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={TOOLTIP_CONTENT}
                  labelStyle={TOOLTIP_LABEL}
                  itemStyle={TOOLTIP_ITEM}
                  cursor={LINE_CURSOR}
                />
                <Area
                  type="monotone"
                  dataKey="comments"
                  stroke="var(--chart-1)"
                  strokeWidth={2}
                  fill="var(--chart-1)"
                  fillOpacity={0.12}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Engine health" actions={<StatusPill status="live" />}>
          <div className="space-y-4">
            {engine.map((row) => (
              <div key={row.key} className="space-y-2">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-[13px] text-ink-2">{row.key}</span>
                  <span className="font-mono text-[12.5px] font-semibold text-ink tnum">
                    {row.value}
                  </span>
                </div>
                <Meter pct={row.pct} tone="ok" />
              </div>
            ))}
          </div>

          <div className="mt-5 flex items-start gap-2.5 rounded-md border border-line bg-surface-2 px-3.5 py-3">
            <Clock3
              className="mt-0.5 size-3.5 shrink-0 text-ink-3"
              strokeWidth={1.75}
              aria-hidden
            />
            <p className="text-[12.5px] leading-snug text-ink-2">
              Human jitter holding at{" "}
              <span className="font-mono font-semibold text-ink tnum">38s</span>, inside the
              30–90s band.
            </p>
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.6fr]">
        <Panel
          title="Live feed"
          actions={<span className="caption">realtime</span>}
          bodyClassName="p-0"
        >
          <ul className="max-h-[340px] divide-y divide-line overflow-y-auto">
            {activity.slice(0, 12).map((ev) => (
              <li
                key={ev.id}
                className="flex items-start gap-4 px-5 py-3 transition-colors duration-150 hover:bg-surface-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-ink">{ev.text}</p>
                  {ev.meta && (
                    <p className="mt-0.5 truncate text-[11px] text-ink-3">{ev.meta}</p>
                  )}
                </div>
                <span className="shrink-0 font-mono text-[11px] text-ink-3 tnum">
                  {timeAgo(ev.at)}
                </span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel
          title="Reels on duty"
          actions={
            <Button variant="outline" size="sm" onClick={() => go("automations")}>
              Manage
            </Button>
          }
          bodyClassName="p-0"
        >
          <ul className="divide-y divide-line">
            {automations.map((a) => (
              <li
                key={a.id}
                className="flex items-center gap-3 px-5 py-3.5 transition-colors duration-150 hover:bg-surface-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-ink">{a.reelCaption}</p>
                  <p className="mt-0.5 truncate text-[11px] text-ink-3">
                    {a.triggerKeywords.map((k) => `#${k}`).join(" ")} ·{" "}
                    <span className="font-mono tnum">{fmtNum(a.dmsSent)}</span> DMs
                  </p>
                </div>
                <button
                  role="switch"
                  aria-checked={a.isActive}
                  aria-label={`Toggle ${a.reelCaption}`}
                  onClick={() => toggleAutomation(a.id)}
                  className={cn(
                    "flex h-6 w-11 shrink-0 items-center rounded-full px-0.5 transition-colors duration-150 ease-out",
                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal",
                    a.isActive ? "bg-ok" : "bg-surface-3"
                  )}
                >
                  <span
                    className={cn(
                      "size-5 rounded-full bg-white shadow-[var(--sh-1)] transition-transform duration-150 ease-out",
                      a.isActive && "translate-x-5"
                    )}
                  />
                </button>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   INSIGHTS
   ═════════════════════════════════════════════════════════════════════ */

export function InsightsView() {
  const { automations } = useRelo();
  const [range, setRange] = useState(14);
  const data = DM_SERIES.slice(-range);
  const totals = data.reduce(
    (acc, d) => ({ comments: acc.comments + d.comments, dms: acc.dms + d.dms, clicks: acc.clicks + d.clicks }),
    { comments: 0, dms: 0, clicks: 0 }
  );
  const replies = Math.round(totals.comments * 0.92);
  const funnel = [
    { label: "Comments seen", v: totals.comments },
    { label: "Replies sent", v: replies },
    { label: "DMs delivered", v: totals.dms },
    { label: "Buttons clicked", v: totals.clicks },
  ];
  const reach = [
    { name: "Reachable", v: 743, color: "var(--chart-3)" },
    { name: "Window closed", v: 168, color: "var(--ink-3)" },
    { name: "Token issues", v: 19, color: "var(--chart-4)" },
  ];
  const topButtons = [
    ["Download free pack", 643, 78],
    ["See all templates", 214, 34],
    ["Get the template", 301, 44],
    ["Talk to me", 96, 12],
  ] as const;

  return (
    <div className="space-y-6">
      <ViewHead
        title="Insights"
        sub="The honest funnel, from comment noise to button clicks that pay."
      >
        <div
          className="flex items-center gap-0.5 rounded-lg border border-line bg-surface p-0.5"
          role="radiogroup"
          aria-label="Date range"
        >
          {[7, 14].map((r) => (
            <button
              key={r}
              type="button"
              role="radio"
              aria-checked={range === r}
              onClick={() => setRange(r)}
              className={cn(
                "rounded-md px-3.5 py-1 text-[12.5px] font-semibold transition-colors duration-150 ease-out",
                range === r
                  ? "bg-ink text-ink-invert"
                  : "text-ink-3 hover:bg-surface-2 hover:text-ink"
              )}
            >
              {r}d
            </button>
          ))}
        </div>
      </ViewHead>

      <Panel title="The funnel">
        <div className="space-y-5">
          {funnel.map((f, i) => {
            const pct = (f.v / funnel[0].v) * 100;
            return (
              <div key={f.label} className="space-y-2">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-[13px] font-medium text-ink-2">{f.label}</span>
                  <span className="font-mono text-[12.5px] text-ink-3 tnum">
                    {f.v.toLocaleString("en-IN")} · {Math.round(pct)}%
                  </span>
                </div>
                <Meter pct={pct} tone={i === funnel.length - 1 ? "ok" : "warn"} />
              </div>
            );
          })}
        </div>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Clicks per day">
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: -20 }}>
                <CartesianGrid stroke="var(--line)" vertical={false} />
                <XAxis
                  dataKey="day"
                  tick={AXIS}
                  tickLine={false}
                  axisLine={false}
                  interval={2}
                />
                <YAxis tick={AXIS} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={TOOLTIP_CONTENT}
                  labelStyle={TOOLTIP_LABEL}
                  itemStyle={TOOLTIP_ITEM}
                  cursor={BAR_CURSOR}
                />
                <Bar
                  dataKey="clicks"
                  name="Clicks"
                  radius={[5, 5, 0, 0]}
                  fill="var(--chart-1)"
                  maxBarSize={24}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel
          title={
            <div>
              <h2 className="text-[13.5px] font-semibold text-ink">Lead reachability</h2>
              <p className="caption mt-0.5">Who can still be DM&apos;d today</p>
            </div>
          }
        >
          <div className="flex flex-col items-center gap-6 sm:flex-row">
            <div className="h-44 w-44 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={reach}
                    dataKey="v"
                    innerRadius={52}
                    outerRadius={78}
                    paddingAngle={3}
                    strokeWidth={0}
                    startAngle={90}
                    endAngle={-270}
                  >
                    {reach.map((r) => (
                      <Cell key={r.name} fill={r.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full min-w-0 space-y-3">
              {reach.map((r) => (
                <div key={r.name} className="flex items-center gap-2.5">
                  <span
                    aria-hidden
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ background: r.color }}
                  />
                  <span className="truncate text-[13px] text-ink-2">{r.name}</span>
                  <span className="ml-auto font-mono text-[12.5px] font-semibold text-ink tnum">
                    {r.v}
                  </span>
                </div>
              ))}
              <p className="border-t border-line pt-3 text-[11px] leading-relaxed text-ink-3">
                Campaigns only text reachable leads. Window-expired leads are filtered
                before send.
              </p>
            </div>
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <Panel title="Top buttons clicked">
          <div className="space-y-4">
            {topButtons.map(([label, n, pct]) => (
              <div key={label} className="flex items-center gap-3">
                <span className="w-40 shrink-0 truncate text-[13px] font-medium text-ink">
                  {label}
                </span>
                <span className="min-w-0 flex-1">
                  <Meter pct={pct} />
                </span>
                <span className="w-12 shrink-0 text-right font-mono text-[12.5px] text-ink-2 tnum">
                  {n}
                </span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Reel leaderboard" bodyClassName="p-0">
          <ul className="divide-y divide-line">
            {automations
              .slice()
              .sort((a, b) => b.dmsSent - a.dmsSent)
              .map((a, i) => (
                <li
                  key={a.id}
                  className="flex items-center gap-3 px-5 py-3.5 transition-colors duration-150 hover:bg-surface-2"
                >
                  <span className="w-6 shrink-0 font-mono text-[11px] text-ink-3 tnum">
                    #{i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-ink">{a.reelCaption}</p>
                    <p className="mt-0.5 truncate text-[11px] text-ink-3">
                      <span className="font-mono tnum">{fmtNum(a.dmsSent)}</span> DMs ·{" "}
                      <span className="font-mono tnum">{fmtNum(a.clicks)}</span> clicks
                    </p>
                  </div>
                  <StatusPill status={a.isActive ? "live" : "paused"} />
                </li>
              ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
