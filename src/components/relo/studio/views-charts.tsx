"use client";

import React, { useEffect, useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell,
} from "recharts";
import {
  Users, MousePointerClick, MessageCircle, Activity, Flame,
  Clock3,
} from "lucide-react";
import { useRelo } from "@/lib/relo/store";
import { DM_SERIES, fmtNum, timeAgo } from "@/lib/relo/data";
import { ViewHead, StatCard, StatusPill, Field, inputCls } from "./studio-ui";
import { RButton } from "../chrome";
import { cn } from "@/lib/utils";

const tooltipStyle = {
  borderRadius: 8,
  border: "1px solid var(--border)",
  background: "var(--surface)",
  boxShadow: "var(--shadow-soft)",
  fontSize: 12,
  padding: "8px 12px",
  color: "var(--text)",
} as const;
const labelStyle = { fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-3)" } as const;

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

  return (
    <div className="space-y-8">
      <ViewHead
        title={greeting}
        sub="Your reels kept talking overnight. Here is what they said — and who they sold to."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="DMs today" value={dmsToday} delta="+12%" />
        <StatCard label="Leads captured" value={leads.length} delta="+8%" />
        <StatCard label="Button clicks" value={clicks} delta="+21%" />
        <StatCard label="DM to click" value={rate} suffix="%" delta="+3%" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.55fr_1fr]">
        {/* funnel */}
        <section className="rounded-lg border border-border bg-surface p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="h4 text-text">Comments to DMs</h3>
              <p className="caption">Last 14 days</p>
            </div>
            <RButton variant="outline" size="sm" onClick={() => go("insights")}>
              Full insights
            </RButton>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={DM_SERIES} margin={{ top: 8, right: 8, bottom: 8, left: -10 }}>
                <defs>
                  <linearGradient id="gComments" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="var(--accent)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: "var(--text-3)" }} tickLine={false} axisLine={false} interval={3} />
                <YAxis tick={{ fontSize: 10, fill: "var(--text-3)" }} tickLine={false} axisLine={false} />
                <Area type="monotone" dataKey="comments" stroke="var(--accent)" strokeWidth={2} fill="url(#gComments)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* engine health */}
        <section className="rounded-lg border border-border bg-surface p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="h4 text-text">Engine health</h3>
            <StatusPill status="live" />
          </div>
          <div className="space-y-4">
            {[
              ["Queue depth", "3 jobs", 92],
              ["Webhook ack", "14ms avg", 97],
              ["Cron (1 min)", "on time", 100],
              ["Failed (24h)", "2 · retried", 88],
            ].map(([k, v, pct]) => (
              <div key={k} className="space-y-1.5">
                <div className="flex items-baseline justify-between text-xs">
                  <span className="text-text-3">{k}</span>
                  <span className="font-mono font-semibold text-text">{v}</span>
                </div>
                <div className="h-[8px] w-full overflow-hidden rounded-full bg-surface-3">
                  <div className="h-full rounded-full bg-ok" style={{ width: `${pct}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 flex items-center gap-2.5 rounded-md bg-surface-2 px-3.5 py-3">
            <Clock3 className="size-4 shrink-0 text-accent" />
            <p className="text-xs text-text-3 leading-snug">
              Human jitter holding at <span className="font-semibold text-text">38s</span> — inside the 30–90s band.
            </p>
          </div>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.6fr]">
        {/* live feed */}
        <section className="rounded-lg border border-border bg-surface p-5 sm:p-6 shadow-sm">
          <div className="flex items-center gap-2.5 mb-4">
            <Activity className="size-4 text-text-3" />
            <h3 className="h4 text-text">Live feed</h3>
            <span className="ml-auto caption">realtime</span>
          </div>
          <div className="max-h-[340px] space-y-2 overflow-y-auto pr-2">
            {activity.slice(0, 12).map((ev) => (
              <div key={ev.id} className="flex items-start gap-3 rounded-md px-2.5 py-2.5 transition-colors hover:bg-surface-2">
                <span className="mt-0.5 grid size-6 place-items-center rounded-sm bg-surface-3 text-text-3">
                  <MessageCircle className="size-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-text">{ev.text}</p>
                  {ev.meta && <p className="truncate text-[11px] text-text-3">{ev.meta}</p>}
                </div>
                <span className="shrink-0 text-[11px] text-text-3">{timeAgo(ev.at)}</span>
              </div>
            ))}
          </div>
        </section>

        {/* automations quick list */}
        <section className="rounded-lg border border-border bg-surface p-5 sm:p-6 shadow-sm">
          <div className="flex items-center gap-2.5 mb-4">
            <Flame className="size-4 text-text-3" />
            <h3 className="h4 text-text">Your reels on duty</h3>
            <RButton variant="outline" size="sm" onClick={() => go("automations")}>
              Manage
            </RButton>
          </div>
          <div className="space-y-3">
            {automations.map((a) => (
              <div key={a.id} className="flex items-center gap-3.5 rounded-lg border border-border bg-surface-2 p-3.5">
                <span className="h-9 w-9 shrink-0 rounded-md" style={{ background: `hsl(${a.reelCaption.length * 7 % 360} 40% 30%)` }} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-text">{a.reelCaption}</p>
                  <p className="text-[11px] text-text-3">
                    {a.triggerKeywords.map((k) => `#${k}`).join(" ")} · {fmtNum(a.dmsSent)} DMs
                  </p>
                </div>
                <button
                  role="switch"
                  aria-checked={a.isActive}
                  aria-label={`Toggle ${a.reelCaption}`}
                  onClick={() => toggleAutomation(a.id)}
                  className={cn("flex h-6 w-11 shrink-0 items-center rounded-full px-0.5 transition-colors", a.isActive ? "bg-ok" : "bg-surface-3")}
                >
                  <span className="size-5 rounded-full bg-white shadow" />
                </button>
              </div>
            ))}
          </div>
        </section>
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
    { label: "Comments seen", v: totals.comments, tone: "#d97706" },
    { label: "Replies sent", v: replies, tone: "#d97706" },
    { label: "DMs delivered", v: totals.dms, tone: "#d97706" },
    { label: "Buttons clicked", v: totals.clicks, tone: "#16a34a" },
  ];
  const reach = [
    { name: "Reachable", v: 743, color: "#16a34a" },
    { name: "Window closed", v: 168, color: "#9ca3af" },
    { name: "Token issues", v: 19, color: "#d97706" },
  ];
  const topButtons = [
    ["Download free pack", 643, 78],
    ["See all templates", 214, 34],
    ["Get the template", 301, 44],
    ["Talk to me", 96, 12],
  ] as const;

  return (
    <div className="space-y-8">
      <ViewHead
        title="Insights"
        sub="The honest funnel — from comment noise to button clicks that pay."
      >
        <div className="flex items-center gap-2 rounded-lg border border-border bg-surface p-1" role="radiogroup" aria-label="Date range">
          {[7, 14].map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={cn(
                "relative rounded-md px-3.5 py-1.5 text-xs font-medium transition-colors",
                range === r ? "bg-text text-text-inverse" : "text-text-3 hover:text-text"
              )}
            >
              {r}d
            </button>
          ))}
        </div>
      </ViewHead>

      {/* funnel */}
      <section className="rounded-lg border border-border bg-surface p-5 sm:p-6 shadow-sm">
        <h3 className="h4 text-text mb-5">The funnel</h3>
        <div className="space-y-5">
          {funnel.map((f, i) => {
            const pct = (f.v / funnel[0].v) * 100;
            return (
              <div key={f.label}>
                <div className="flex items-baseline justify-between text-sm">
                  <span className="font-medium text-text-2">{f.label}</span>
                  <span className="font-mono text-text-3 tnum">{f.v.toLocaleString("en-IN")} · {Math.round(pct)}%</span>
                </div>
                <div className="mt-1.5 h-[10px] w-full overflow-hidden rounded-full bg-surface-3">
                  <div className="h-full rounded-full" style={{ background: f.tone, width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-border bg-surface p-5 sm:p-6 shadow-sm">
          <h3 className="h4 text-text mb-5">Clicks per day</h3>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: -20 }}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: "var(--text-3)" }} tickLine={false} axisLine={false} interval={2} />
                <YAxis tick={{ fontSize: 10, fill: "var(--text-3)" }} tickLine={false} axisLine={false} />
                <Bar dataKey="clicks" name="Clicks" radius={[8, 8, 0, 0]} fill="var(--accent)" maxBarSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-lg border border-border bg-surface p-5 sm:p-6 shadow-sm">
          <h3 className="h4 text-text mb-2">Lead reachability</h3>
          <p className="caption mb-4">Who can still be DM'd today</p>
          <div className="flex items-center gap-6">
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
            <div className="space-y-3">
              {reach.map((r) => (
                <div key={r.name} className="flex items-center gap-2.5 text-sm">
                  <span className="size-2.5 rounded-full" style={{ background: r.color }} />
                  <span className="text-text-3">{r.name}</span>
                  <span className="ml-auto font-mono font-semibold text-text tnum">{r.v}</span>
                </div>
              ))}
              <p className="mt-2 text-[11px] leading-relaxed text-text-3">
                Campaigns only text reachable leads — window-expired is filtered before send.
              </p>
            </div>
          </div>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <section className="rounded-lg border border-border bg-surface p-5 sm:p-6 shadow-sm">
          <h3 className="h4 text-text mb-5">Top buttons clicked</h3>
          <div className="space-y-4">
            {topButtons.map(([label, n, pct]) => (
              <div key={label} className="flex items-center gap-3">
                <span className="w-44 truncate text-sm font-medium">{label}</span>
                <div className="h-[10px] flex-1 overflow-hidden rounded-full bg-surface-3">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
                </div>
                <span className="w-16 text-right text-sm font-mono text-text-3 tnum">{n}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-border bg-surface p-5 sm:p-6 shadow-sm">
          <h3 className="h4 text-text mb-4">Reel leaderboard</h3>
          <div className="space-y-3">
            {automations
              .slice()
              .sort((a, b) => b.dmsSent - a.dmsSent)
              .map((a, i) => (
                <div key={a.id} className="flex items-center gap-3 rounded-md bg-surface-2 p-3">
                  <span className="text-lg font-bold text-text-3">#{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-text">{a.reelCaption}</p>
                    <p className="text-[11px] text-text-3">{fmtNum(a.dmsSent)} DMs · {fmtNum(a.clicks)} clicks</p>
                  </div>
                  <StatusPill status={a.isActive ? "live" : "paused"} />
                </div>
              ))}
          </div>
        </section>
      </div>
    </div>
  );
}
