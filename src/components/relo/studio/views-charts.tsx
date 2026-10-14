"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Send,
  Users,
  MousePointerClick,
  MessageCircle,
  Activity,
  ServerCog,
  Flame,
  Clock3,
  TrendingUp,
} from "lucide-react";
import { useRelo } from "@/lib/relo/store";
import { DM_SERIES, fmtNum, timeAgo } from "@/lib/relo/data";
import { ViewHead, StatCard, StatusPill } from "./studio-ui";
import { cn } from "@/lib/utils";

const chartTooltip = {
  contentStyle: {
    borderRadius: 14,
    border: "1px solid var(--line)",
    background: "var(--popover)",
    boxShadow: "var(--shadow-lift)",
    fontSize: 12,
    padding: "8px 12px",
  },
  labelStyle: { fontFamily: "var(--font-sans-mono)", fontSize: 10, color: "var(--ink-3)" },
} as const;

const EVENT_ICON = {
  comment: MessageCircle,
  dm: Send,
  lead: Users,
  click: MousePointerClick,
  system: ServerCog,
} as const;
const EVENT_TONE = {
  comment: "bg-sky/15 text-[#4a6b82]",
  dm: "bg-ember-wash text-ember-deep",
  lead: "bg-moss/15 text-moss",
  click: "bg-honey/15 text-honey",
  system: "bg-ink/5 text-ink-3",
} as const;

/* ═══════════════ HOME ═══════════════ */

export function HomeView({ go }: { go: (v: string) => void }) {
  const { automations, activity, leads, toggleAutomation } = useRelo();
  const dmsToday = automations.reduce((a, x) => a + x.triggersToday, 0);
  const clicks = automations.reduce((a, x) => a + x.clicks, 0);
  const dms = automations.reduce((a, x) => a + x.dmsSent, 0);
  const rate = Math.round((clicks / Math.max(1, dms)) * 100);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-6">
      <ViewHead
        title={
        <>
          {greeting}, <span className="serif-accent">Aarav.</span>
        </>
      }
        sub="Your reels kept talking overnight. Here's what they said — and who they sold to."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="DMs today"
          value={dmsToday}
          delta="+12%"
          spark={[24, 32, 28, 44, 38, 55, 62, dmsToday]}
          icon={Send}
        />
        <StatCard
          label="Leads captured"
          value={leads.length}
          delta="+8%"
          spark={[4, 6, 5, 8, 7, 9, 11, leads.length]}
          icon={Users}
        />
        <StatCard
          label="Button clicks"
          value={clicks}
          delta="+21%"
          spark={[20, 26, 31, 29, 42, 48, 53, 61]}
          icon={MousePointerClick}
        />
        <StatCard
          label="DM → click"
          value={rate}
          suffix="%"
          delta="+3%"
          spark={[41, 44, 48, 46, 52, 55, 58, rate]}
          icon={TrendingUp}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        {/* funnel chart */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-3xl border border-line bg-card p-5 shadow-[var(--shadow-soft)] sm:p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-[16px] font-bold">Comments → DMs</h3>
              <p className="mt-0.5 font-mono text-[10px] tracking-[0.18em] text-ink-4 uppercase">last 14 days</p>
            </div>
            <button
              onClick={() => go("insights")}
              className="rounded-full border border-line-strong px-3.5 py-1.5 text-[12px] font-medium text-ink-3 transition-colors "
            >
              Full insights
            </button>
          </div>
          <div className="mt-5 h-60">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={DM_SERIES} margin={{ top: 4, right: 4, bottom: 0, left: -18 }}>
                <defs>
                  <linearGradient id="gDms" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b80f9" stopOpacity={0.32} />
                    <stop offset="100%" stopColor="#8b80f9" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="gComments" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f2c48d" stopOpacity={0.22} />
                    <stop offset="100%" stopColor="#f2c48d" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--line)" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: "var(--ink-4)" }} tickLine={false} axisLine={false} interval={3} />
                <YAxis tick={{ fontSize: 10, fill: "var(--ink-4)" }} tickLine={false} axisLine={false} />
                <RTooltip {...chartTooltip} />
                <Area type="monotone" dataKey="comments" stroke="#f2c48d" strokeWidth={2} fill="url(#gComments)" name="Comments" />
                <Area type="monotone" dataKey="dms" stroke="#8b80f9" strokeWidth={2.4} fill="url(#gDms)" name="DMs sent" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.section>

        {/* engine health */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          className="rounded-3xl border border-line bg-card p-5 shadow-[var(--shadow-soft)] sm:p-6"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-display text-[16px] font-bold">Engine health</h3>
            <StatusPill status="live" pulse />
          </div>
          <div className="mt-4 space-y-3">
            {[
              ["Queue depth", "3 jobs", 92],
              ["Webhook ack", "14ms avg", 97],
              ["Cron (1-min)", "on time", 100],
              ["Failed (24h)", "2 · retried", 88],
            ].map(([k, v, pct]) => (
              <div key={k as string}>
                <div className="flex items-center justify-between text-[12.5px]">
                  <span className="text-ink-3">{k}</span>
                  <span className="font-mono font-medium text-ink">{v}</span>
                </div>
                <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-ink/8">
                  <motion.div
                    className="h-full rounded-full bg-moss"
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 1, ease: [0.22, 1, 0.28, 1] }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 flex items-center gap-2.5 rounded-2xl bg-card-soft px-3.5 py-3">
            <Clock3 className="size-4 shrink-0 text-honey" />
            <p className="text-[12px] leading-snug text-ink-3">
              Human jitter holding at <span className="font-semibold text-ink">38s</span> — comfortably inside the
              30–90s band.
            </p>
          </div>
        </motion.section>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.6fr]">
        {/* live feed */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.24 }}
          className="rounded-3xl border border-line bg-card p-5 shadow-[var(--shadow-soft)] sm:p-6"
        >
          <div className="flex items-center gap-2.5">
            <Activity className="size-4 text-ember" />
            <h3 className="font-display text-[16px] font-bold">Live feed</h3>
            <span className="ml-auto font-mono text-[10px] tracking-widest text-ink-4 uppercase">realtime</span>
          </div>
          <div className="mt-4 max-h-[340px] space-y-1 overflow-y-auto pr-1">
            {activity.slice(0, 12).map((ev, i) => {
              const Icon = EVENT_ICON[ev.kind] ?? Activity;
              return (
                <motion.div
                  key={ev.id}
                  layout
                  initial={{ opacity: 0, x: -14 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.045 }}
                  className="flex items-start gap-3 rounded-xl px-2 py-2 transition-colors "
                >
                  <span className={cn("mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg", EVENT_TONE[ev.kind])}>
                    <Icon className="size-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-ink">{ev.text}</p>
                    {ev.meta && <p className="truncate font-mono text-[10.5px] text-ink-4">{ev.meta}</p>}
                  </div>
                  <span className="shrink-0 font-mono text-[10px] text-ink-4">{timeAgo(ev.at)}</span>
                </motion.div>
              );
            })}
          </div>
        </motion.section>

        {/* automations quick list */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-3xl border border-line bg-card p-5 shadow-[var(--shadow-soft)] sm:p-6"
        >
          <div className="flex items-center gap-2.5">
            <Flame className="size-4 text-ember" />
            <h3 className="font-display text-[16px] font-bold">Your reels on duty</h3>
            <button
              onClick={() => go("automations")}
              className="ml-auto rounded-full border border-line-strong px-3.5 py-1.5 text-[12px] font-medium text-ink-3 transition-colors "
            >
              Manage
            </button>
          </div>
          <div className="mt-4 space-y-2.5">
            {automations.map((a) => (
              <div
                key={a.id}
                className="flex items-center gap-3.5 rounded-2xl border border-line bg-card-soft px-4 py-3.5"
              >
                <span
                  className="h-9 w-9 shrink-0 rounded-xl"
                  style={{
                    background: `linear-gradient(135deg, hsl(${a.reelCaption.length * 7 % 360} 40% 30%), hsl(${a.reelCaption.length * 3 % 360} 45% 22%))`,
                  }}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium">{a.reelCaption}</p>
                  <p className="font-mono text-[10.5px] text-ink-4">
                    {a.triggerKeywords.map((k) => `#${k}`).join(" ")} · {fmtNum(a.dmsSent)} DMs
                  </p>
                </div>
                <button
                  role="switch"
                  aria-checked={a.isActive}
                  aria-label={`Toggle ${a.reelCaption}`}
                  onClick={() => toggleAutomation(a.id)}
                  className={cn(
                    "flex h-6 w-11 shrink-0 items-center rounded-full px-0.5 transition-colors",
                    a.isActive ? "bg-moss" : "bg-ink/15"
                  )}
                >
                  <motion.span
                    layout
                    className="size-5 rounded-full bg-white shadow"
                    animate={{ x: a.isActive ? 20 : 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 28 }}
                  />
                </button>
              </div>
            ))}
          </div>
        </motion.section>
      </div>
    </div>
  );
}

/* ═══════════════ INSIGHTS ═══════════════ */

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
    { label: "Comments seen", v: totals.comments, tone: "#f2c48d" },
    { label: "Replies sent", v: replies, tone: "#a99dff" },
    { label: "DMs delivered", v: totals.dms, tone: "#8b80f9" },
    { label: "Buttons clicked", v: totals.clicks, tone: "#63ddb6" },
  ];
  const reach = [
    { name: "Reachable", v: 743, color: "#63ddb6" },
    { name: "Window closed", v: 168, color: "#e8d8c8" },
    { name: "Token issues", v: 19, color: "#8b80f9" },
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
        sub="The honest funnel — from comment noise to button clicks that pay."
      >
        <div className="flex rounded-full border border-line-strong bg-card p-1">
          {[7, 14].map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={cn(
                "relative rounded-full px-3.5 py-1.5 text-[12px] font-medium transition-colors",
                range === r ? "text-[var(--primary-foreground)]" : "text-ink-3"
              )}
            >
              {range === r && (
                <motion.span layoutId="range-pill" className="absolute inset-0 rounded-full bg-ink" />
              )}
              <span className="relative">{r}d</span>
            </button>
          ))}
        </div>
      </ViewHead>

      {/* funnel */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border border-line bg-card p-5 shadow-[var(--shadow-soft)] sm:p-6"
      >
        <h3 className="font-display text-[16px] font-bold">The funnel</h3>
        <div className="mt-5 space-y-4">
          {funnel.map((f, i) => {
            const pct = (f.v / funnel[0].v) * 100;
            return (
              <div key={f.label}>
                <div className="flex items-baseline justify-between text-[13px]">
                  <span className="font-medium text-ink-2">{f.label}</span>
                  <span className="font-mono text-ink-3">
                    {f.v.toLocaleString("en-IN")} · {Math.round(pct)}%
                  </span>
                </div>
                <div className="mt-1.5 h-3 w-full overflow-hidden rounded-full bg-ink/6">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: f.tone }}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 1.1, delay: i * 0.12, ease: [0.22, 1, 0.28, 1] }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </motion.section>

      <div className="grid gap-4 lg:grid-cols-2">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="rounded-3xl border border-line bg-card p-5 shadow-[var(--shadow-soft)] sm:p-6"
        >
          <h3 className="font-display text-[16px] font-bold">Clicks per day</h3>
          <div className="mt-5 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -22 }}>
                <CartesianGrid stroke="var(--line)" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: "var(--ink-4)" }} tickLine={false} axisLine={false} interval={2} />
                <YAxis tick={{ fontSize: 10, fill: "var(--ink-4)" }} tickLine={false} axisLine={false} />
                <RTooltip {...chartTooltip} cursor={{ fill: "rgba(139,128,249,0.06)" }} />
                <Bar dataKey="clicks" name="Clicks" radius={[6, 6, 0, 0]} fill="#8b80f9" maxBarSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14 }}
          className="rounded-3xl border border-line bg-card p-5 shadow-[var(--shadow-soft)] sm:p-6"
        >
          <h3 className="font-display text-[16px] font-bold">Lead reachability</h3>
          <p className="mt-0.5 font-mono text-[10px] tracking-[0.18em] text-ink-4 uppercase">
            who can still be DM&apos;d today
          </p>
          <div className="mt-2 flex items-center gap-6">
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
                  <RTooltip {...chartTooltip} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2.5">
              {reach.map((r) => (
                <div key={r.name} className="flex items-center gap-2.5 text-[13px]">
                  <span className="size-2.5 rounded-full" style={{ background: r.color }} />
                  <span className="text-ink-3">{r.name}</span>
                  <span className="ml-auto font-mono font-medium">{r.v}</span>
                </div>
              ))}
              <p className="pt-2 font-mono text-[10px] leading-relaxed text-ink-4">
                campaigns only text reachable leads — window_expired is filtered before send
              </p>
            </div>
          </div>
        </motion.section>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-3xl border border-line bg-card p-5 shadow-[var(--shadow-soft)] sm:p-6"
        >
          <h3 className="font-display text-[16px] font-bold">Top buttons clicked</h3>
          <div className="mt-5 space-y-3">
            {topButtons.map(([label, n, pct]) => (
              <div key={label} className="flex items-center gap-3">
                <span className="w-40 truncate text-[13px] font-medium sm:w-52">{label}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink/6">
                  <motion.div
                    className="h-full rounded-full bg-ember"
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 1, ease: [0.22, 1, 0.28, 1] }}
                  />
                </div>
                <span className="w-12 text-right font-mono text-[12px] text-ink-3">{n}</span>
              </div>
            ))}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.26 }}
          className="rounded-3xl border border-line bg-card p-5 shadow-[var(--shadow-soft)] sm:p-6"
        >
          <h3 className="font-display text-[16px] font-bold">Reel leaderboard</h3>
          <div className="mt-4 space-y-2">
            {automations
              .slice()
              .sort((a, b) => b.dmsSent - a.dmsSent)
              .map((a, i) => (
                <div key={a.id} className="flex items-center gap-3 rounded-xl bg-card-soft px-3.5 py-3">
                  <span className="font-display text-lg font-extrabold text-ink-4">#{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12.5px] font-medium">{a.reelCaption}</p>
                    <p className="font-mono text-[10px] text-ink-4">
                      {fmtNum(a.dmsSent)} DMs · {fmtNum(a.clicks)} clicks
                    </p>
                  </div>
                  <StatusPill status={a.isActive ? "live" : "paused"} pulse={a.isActive} />
                </div>
              ))}
          </div>
        </motion.section>
      </div>
    </div>
  );
}
