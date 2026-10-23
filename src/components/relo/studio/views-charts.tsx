"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowRight,
  Clock3,
  TrendingUp,
  Zap,
  ShieldCheck,
  CheckCircle2,
  Sliders,
  Layers,
  Sparkles,
  ArrowUpRight,
  Shield,
  Activity,
  Heart,
  MessageSquare,
} from "lucide-react";
import { useRelo } from "@/lib/relo/store";
import { useTheme } from "@/lib/relo/theme";
import { DM_SERIES, fmtNum, timeAgo } from "@/lib/relo/data";
import { Meter, Panel, StatCard, StatusPill, ViewHead } from "./studio-ui";
import { Button } from "../chrome";
import { cn } from "@/lib/utils";
import { Card3D } from "../Card3D";
import { ArcDial3D } from "../ArcDial3D";
import { ScrollableReelGallery } from "../ScrollableReelGallery";

const AXIS = {
  fontSize: 11,
  fill: "rgba(255, 255, 255, 0.45)",
  fontFamily: "var(--font-mono)",
} as const;

const TOOLTIP_CONTENT: CSSProperties = {
  background: "rgba(10, 10, 15, 0.92)",
  border: "1px solid rgba(255, 255, 255, 0.15)",
  borderRadius: 14,
  boxShadow: "0 20px 40px rgba(0, 0, 0, 0.8)",
  backdropFilter: "blur(16px)",
  padding: "10px 14px",
};

const TOOLTIP_LABEL: CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: 10,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "rgba(255, 255, 255, 0.5)",
};

const TOOLTIP_ITEM: CSSProperties = { fontSize: 12, color: "#ffffff", fontWeight: 600 };
const GRID = { stroke: "rgba(255, 255, 255, 0.06)", vertical: false } as const;

export function HomeView({ go }: { go: (v: string) => void }) {
  const { automations, activity, leads } = useRelo();
  const { isDark } = useTheme();
  const [range, setRange] = useState<7 | 14 | 30>(14);

  const dmsToday = automations.reduce((a, x) => a + x.triggersToday, 0);
  const clicks = automations.reduce((a, x) => a + x.clicks, 0);
  const dms = automations.reduce((a, x) => a + x.dmsSent, 0);
  const rate = Math.round((clicks / Math.max(1, dms)) * 100);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const engine = [
    { key: "Automation Queue", value: "Active", pct: 98, sub: "Delivering with human jitter" },
    { key: "Average Delivery", value: "14ms", pct: 99, sub: "Instant trigger matching" },
    { key: "Spam Protection", value: "100%", pct: 100, sub: "Zero account flags" },
    { key: "Lead Vault", value: "Encrypted", pct: 100, sub: "Private creator data" },
  ];

  const chartData = DM_SERIES.slice(-range);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-mono mb-2",
              isDark
                ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-300"
                : "border-cyan-600/30 bg-cyan-50 text-cyan-800"
            )}
          >
            <span className="size-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>Active & Protected · @relo.studio</span>
          </div>
          <h1
            className={cn(
              "text-3xl sm:text-4xl font-extrabold tracking-tight transition-colors",
              isDark ? "text-white" : "text-zinc-900"
            )}
          >
            {greeting}, Creator
          </h1>
          <p
            className={cn(
              "mt-1.5 text-xs sm:text-sm max-w-xl transition-colors",
              isDark ? "text-white/70" : "text-zinc-600"
            )}
          >
            Your reels talked to hundreds of prospective buyers while you were away. Here is your conversion breakdown.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="signal"
            size="sm"
            onClick={() => go("automations")}
            className="rounded-full shadow-lg bg-gradient-to-r from-cyan-500 to-blue-600 shadow-cyan-500/25 hover:scale-105 transition-all text-white font-semibold"
          >
            <Sparkles className="size-3.5" /> + New Automation
          </Button>
        </div>
      </div>

      {/* ── 4 Elevated 3D Metric Cards ─────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card3D
          intensity={10}
          className={cn(
            "p-5 backdrop-blur-xl transition-colors",
            isDark ? "bg-black/60 border-white/12" : "bg-white/80 border-black/10 shadow-lg shadow-cyan-950/5"
          )}
        >
          <div
            className={cn(
              "flex items-center justify-between text-xs font-mono uppercase",
              isDark ? "text-white/50" : "text-zinc-500"
            )}
          >
            <span>DMs Delivered</span>
            <span className="text-emerald-500 flex items-center font-bold">
              <ArrowUpRight className="size-3.5" /> +14%
            </span>
          </div>
          <div
            className={cn(
              "mt-2 text-3xl font-extrabold font-mono tracking-tight",
              isDark ? "text-white" : "text-zinc-900"
            )}
          >
            {fmtNum(dmsToday)}
          </div>
          <div className={cn("mt-2 text-[11px] font-mono", isDark ? "text-white/60" : "text-zinc-500")}>
            Across {automations.length} active reels today
          </div>
        </Card3D>

        <Card3D
          intensity={10}
          className={cn(
            "p-5 backdrop-blur-xl transition-colors",
            isDark ? "bg-black/60 border-white/12" : "bg-white/80 border-black/10 shadow-lg shadow-cyan-950/5"
          )}
        >
          <div
            className={cn(
              "flex items-center justify-between text-xs font-mono uppercase",
              isDark ? "text-white/50" : "text-zinc-500"
            )}
          >
            <span>Leads Captured</span>
            <span className="text-emerald-500 flex items-center font-bold">
              <ArrowUpRight className="size-3.5" /> +8%
            </span>
          </div>
          <div className="mt-2 text-3xl font-extrabold font-mono text-cyan-500 tracking-tight">
            {leads.length}
          </div>
          <div className={cn("mt-2 text-[11px] font-mono", isDark ? "text-white/60" : "text-zinc-500")}>
            100% verified followers
          </div>
        </Card3D>

        <Card3D
          intensity={10}
          className={cn(
            "p-5 backdrop-blur-xl transition-colors",
            isDark ? "bg-black/60 border-white/12" : "bg-white/80 border-black/10 shadow-lg shadow-cyan-950/5"
          )}
        >
          <div
            className={cn(
              "flex items-center justify-between text-xs font-mono uppercase",
              isDark ? "text-white/50" : "text-zinc-500"
            )}
          >
            <span>Button Clicks</span>
            <span className="text-emerald-500 flex items-center font-bold">
              <ArrowUpRight className="size-3.5" /> +21%
            </span>
          </div>
          <div
            className={cn(
              "mt-2 text-3xl font-extrabold font-mono tracking-tight",
              isDark ? "text-white" : "text-zinc-900"
            )}
          >
            {fmtNum(clicks)}
          </div>
          <div className={cn("mt-2 text-[11px] font-mono", isDark ? "text-white/60" : "text-zinc-500")}>
            High-ticket link opens
          </div>
        </Card3D>

        <Card3D
          intensity={10}
          className={cn(
            "p-5 backdrop-blur-xl transition-colors",
            isDark ? "bg-black/60 border-white/12" : "bg-white/80 border-black/10 shadow-lg shadow-cyan-950/5"
          )}
        >
          <div
            className={cn(
              "flex items-center justify-between text-xs font-mono uppercase",
              isDark ? "text-white/50" : "text-zinc-500"
            )}
          >
            <span>Click-Through Rate</span>
            <span className="text-emerald-500 flex items-center font-bold">
              <ArrowUpRight className="size-3.5" /> +4.2%
            </span>
          </div>
          <div className="mt-2 text-3xl font-extrabold font-mono text-emerald-500 tracking-tight">
            {rate}%
          </div>
          <div className={cn("mt-2 text-[11px] font-mono", isDark ? "text-white/60" : "text-zinc-500")}>
            Comment to click velocity
          </div>
        </Card3D>
      </div>

      {/* ── Main Dual Bento Row ────────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        {/* Left: Volume Analytics */}
        <Card3D
          intensity={8}
          className={cn(
            "p-6 backdrop-blur-xl transition-colors",
            isDark ? "bg-black/60 border-white/12" : "bg-white/80 border-black/10 shadow-lg shadow-cyan-950/5"
          )}
        >
          <div
            className={cn(
              "flex flex-wrap items-center justify-between gap-4 pb-4 border-b mb-6",
              isDark ? "border-white/8" : "border-black/8"
            )}
          >
            <div>
              <h2
                className={cn(
                  "text-base font-bold tracking-tight",
                  isDark ? "text-white" : "text-zinc-900"
                )}
              >
                Comment Ingestion & DM Volume
              </h2>
              <p className={cn("text-xs font-mono mt-0.5", isDark ? "text-white/50" : "text-zinc-500")}>
                Real-time comments processed and DMs sent
              </p>
            </div>

            <div
              className={cn(
                "flex items-center gap-1 rounded-full border p-1 text-xs font-mono",
                isDark ? "border-white/10 bg-white/5" : "border-black/10 bg-black/5"
              )}
            >
              {([7, 14, 30] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={cn(
                    "rounded-full px-3 py-1 transition-all",
                    range === r
                      ? "bg-cyan-500/20 text-cyan-400 font-bold"
                      : isDark
                        ? "text-white/50 hover:text-white"
                        : "text-zinc-500 hover:text-zinc-900"
                  )}
                >
                  {r}d
                </button>
              ))}
            </div>
          </div>

          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: -15 }}>
                <defs>
                  <linearGradient id="dmGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00e5ff" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#00e5ff" stopOpacity={0.01} />
                  </linearGradient>
                  <linearGradient id="commentGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"} />
                <XAxis
                  dataKey="day"
                  tick={{
                    fontSize: 11,
                    fill: isDark ? "rgba(255, 255, 255, 0.45)" : "rgba(0, 0, 0, 0.45)",
                    fontFamily: "var(--font-mono)",
                  }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{
                    fontSize: 11,
                    fill: isDark ? "rgba(255, 255, 255, 0.45)" : "rgba(0, 0, 0, 0.45)",
                    fontFamily: "var(--font-mono)",
                  }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: isDark ? "rgba(10, 10, 18, 0.95)" : "rgba(255, 255, 255, 0.95)",
                    border: isDark ? "1px solid rgba(255, 255, 255, 0.15)" : "1px solid rgba(0, 0, 0, 0.1)",
                    borderRadius: 14,
                    boxShadow: isDark ? "0 20px 40px rgba(0, 0, 0, 0.8)" : "0 10px 30px rgba(0, 0, 0, 0.1)",
                    backdropFilter: "blur(16px)",
                    padding: "10px 14px",
                    color: isDark ? "#ffffff" : "#09090b",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="comments"
                  name="Comments"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="url(#commentGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="dms"
                  name="DMs Sent"
                  stroke="#00e5ff"
                  strokeWidth={2.5}
                  fill="url(#dmGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div
            className={cn(
              "mt-4 pt-4 border-t flex items-center justify-between text-xs font-mono",
              isDark ? "border-white/6 text-white/50" : "border-black/6 text-zinc-500"
            )}
          >
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-emerald-400" /> Incoming Comments
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-cyan-400" /> Dispatched DMs
              </span>
            </div>
            <button
              onClick={() => go("insights")}
              className={cn(
                "transition-colors flex items-center gap-1 font-semibold",
                isDark ? "text-white hover:text-cyan-400" : "text-zinc-900 hover:text-cyan-600"
              )}
            >
              Detailed Analytics <ArrowRight className="size-3" />
            </button>
          </div>
        </Card3D>

        {/* Right: 3D Segmented Arc Dial Conversion Gauge */}
        <Card3D
          intensity={8}
          className={cn(
            "p-6 backdrop-blur-xl transition-colors flex flex-col justify-between",
            isDark ? "bg-black/60 border-white/12" : "bg-white/80 border-black/10 shadow-lg shadow-cyan-950/5"
          )}
        >
          <div
            className={cn(
              "pb-3 border-b mb-2 flex items-center justify-between",
              isDark ? "border-white/8" : "border-black/8"
            )}
          >
            <h3
              className={cn(
                "text-sm font-bold tracking-tight",
                isDark ? "text-white" : "text-zinc-900"
              )}
            >
              Account Safety Gauge
            </h3>
            <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-mono text-emerald-500 font-bold border border-emerald-500/30">
              Optimal Health
            </span>
          </div>

          <ArcDial3D
            score={78}
            title="Safe Human Rhythm: 99.4%"
            sub="Zero action blocks detected across 1,846 events"
          />

          <div
            className={cn(
              "mt-4 rounded-xl border p-3 text-xs flex items-center gap-2",
              isDark
                ? "border-white/8 bg-white/[0.02] text-white/70"
                : "border-black/8 bg-black/[0.02] text-zinc-600"
            )}
          >
            <Clock3 className="size-4 text-cyan-400 shrink-0" />
            <span>Random human delay holding at <strong>38 seconds</strong></span>
          </div>
        </Card3D>
      </div>

      {/* ── Side-by-Side Scrollable Reel Gallery ───────────────────────── */}
      <Card3D
        intensity={6}
        className={cn(
          "p-6 backdrop-blur-xl transition-colors",
          isDark ? "bg-black/60 border-white/12" : "bg-white/80 border-black/10 shadow-lg shadow-cyan-950/5"
        )}
      >
        <ScrollableReelGallery />
      </Card3D>

      {/* ── Live Activity Ledger & System Status ───────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Card3D
          intensity={8}
          className={cn(
            "p-6 backdrop-blur-xl transition-colors flex flex-col justify-between",
            isDark ? "bg-black/60 border-white/12" : "bg-white/80 border-black/10 shadow-lg shadow-cyan-950/5"
          )}
        >
          <div>
            <div
              className={cn(
                "flex items-center justify-between pb-4 border-b mb-4",
                isDark ? "border-white/8" : "border-black/8"
              )}
            >
              <div>
                <h3
                  className={cn(
                    "text-base font-bold tracking-tight",
                    isDark ? "text-white" : "text-zinc-900"
                  )}
                >
                  Live Activity Feed
                </h3>
                <p className={cn("text-xs font-mono mt-0.5", isDark ? "text-white/50" : "text-zinc-500")}>
                  Real-time comment replies and link deliveries
                </p>
              </div>
              <span className="size-2 rounded-full bg-cyan-400 animate-ping" />
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {activity.slice(0, 6).map((ev) => (
                <div
                  key={ev.id}
                  className={cn(
                    "flex items-start gap-3 rounded-xl border p-3 text-xs transition-colors",
                    isDark
                      ? "border-white/6 bg-white/[0.02] hover:bg-white/[0.05]"
                      : "border-black/6 bg-black/[0.02] hover:bg-black/[0.04]"
                  )}
                >
                  <span
                    className={cn(
                      "size-2 rounded-full mt-1 shrink-0",
                      ev.kind === "comment" && "bg-cyan-400",
                      ev.kind === "lead" && "bg-emerald-400",
                      ev.kind !== "comment" && ev.kind !== "lead" && "bg-blue-400"
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <div
                      className={cn(
                        "font-medium truncate",
                        isDark ? "text-white" : "text-zinc-900"
                      )}
                    >
                      {ev.text}
                    </div>
                    {ev.meta && (
                      <div
                        className={cn(
                          "text-[11px] font-mono truncate mt-0.5",
                          isDark ? "text-white/50" : "text-zinc-500"
                        )}
                      >
                        {ev.meta}
                      </div>
                    )}
                  </div>
                  <span
                    className={cn(
                      "font-mono text-[10px] shrink-0",
                      isDark ? "text-white/40" : "text-zinc-400"
                    )}
                  >
                    {timeAgo(ev.at)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card3D>

        {/* System Health Status */}
        <Card3D
          intensity={8}
          className={cn(
            "p-6 backdrop-blur-xl transition-colors flex flex-col justify-between",
            isDark ? "bg-black/60 border-white/12" : "bg-white/80 border-black/10 shadow-lg shadow-cyan-950/5"
          )}
        >
          <div
            className={cn(
              "flex items-center justify-between pb-4 border-b mb-4",
              isDark ? "border-white/8" : "border-black/8"
            )}
          >
            <h3
              className={cn(
                "text-base font-bold tracking-tight",
                isDark ? "text-white" : "text-zinc-900"
              )}
            >
              Automation Health
            </h3>
            <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-mono text-emerald-500 font-bold">
              100% Operational
            </span>
          </div>

          <div className="space-y-3.5">
            {engine.map((row) => (
              <div key={row.key} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className={isDark ? "text-white/70" : "text-zinc-600"}>{row.key}</span>
                  <span
                    className={cn(
                      "font-mono font-bold",
                      isDark ? "text-white" : "text-zinc-900"
                    )}
                  >
                    {row.value}
                  </span>
                </div>
                <div
                  className={cn(
                    "h-1.5 w-full rounded-full overflow-hidden",
                    isDark ? "bg-white/10" : "bg-black/10"
                  )}
                >
                  <div
                    className="h-full rounded-full bg-cyan-400 transition-all duration-500"
                    style={{ width: `${row.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div
            className={cn(
              "mt-4 pt-3 border-t flex items-center justify-between text-[11px] font-mono",
              isDark ? "border-white/6 text-white/40" : "border-black/6 text-zinc-400"
            )}
          >
            <span>Response Velocity: &lt;15ms</span>
            <span className="text-cyan-500 font-medium">Zero Monthly Rent</span>
          </div>
        </Card3D>
      </div>
    </div>
  );
}

export function InsightsView() {
  const { automations } = useRelo();
  const { isDark } = useTheme();
  const [range, setRange] = useState(14);

  const data = DM_SERIES.slice(-range);
  const totals = data.reduce(
    (acc, d) => ({
      comments: acc.comments + d.comments,
      dms: acc.dms + d.dms,
      clicks: acc.clicks + d.clicks,
    }),
    { comments: 0, dms: 0, clicks: 0 }
  );
  const replies = Math.round(totals.comments * 0.92);

  const topButtons = [
    { label: "1. Download VIP Access Pack", clicks: 643, rate: "78%" },
    { label: "2. View Case Study PDF", clicks: 301, rate: "44%" },
    { label: "3. Direct WhatsApp Connect", clicks: 214, rate: "34%" },
    { label: "4. Ask a Question in DM", clicks: 96, rate: "12%" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1
            className={cn(
              "text-3xl font-extrabold tracking-tight transition-colors",
              isDark ? "text-white" : "text-zinc-900"
            )}
          >
            Analytics & Funnels
          </h1>
          <p
            className={cn(
              "mt-1 text-xs sm:text-sm transition-colors",
              isDark ? "text-white/70" : "text-zinc-600"
            )}
          >
            End-to-end attribution from Reel comment to customer button clicks.
          </p>
        </div>

        <div
          className={cn(
            "flex items-center gap-1 rounded-full border p-1 text-xs font-mono",
            isDark ? "border-white/10 bg-white/5" : "border-black/10 bg-black/5"
          )}
        >
          {[7, 14, 30].map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={cn(
                "rounded-full px-3 py-1 transition-all",
                range === r
                  ? "bg-cyan-500/20 text-cyan-400 font-bold"
                  : isDark
                    ? "text-white/50 hover:text-white"
                    : "text-zinc-500 hover:text-zinc-900"
              )}
            >
              {r}d
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card3D
          intensity={10}
          className={cn(
            "p-5 backdrop-blur-xl transition-colors",
            isDark ? "bg-black/60 border-white/10" : "bg-white/80 border-black/10 shadow-lg shadow-cyan-950/5"
          )}
        >
          <div className={cn("text-[10px] font-mono uppercase", isDark ? "text-white/40" : "text-zinc-500")}>
            1. Comments Seen
          </div>
          <div
            className={cn(
              "text-2xl font-bold font-mono mt-1",
              isDark ? "text-white" : "text-zinc-900"
            )}
          >
            {totals.comments.toLocaleString()}
          </div>
          <div className={cn("text-[10px] mt-1", isDark ? "text-white/50" : "text-zinc-500")}>
            100% Ingested
          </div>
        </Card3D>

        <Card3D
          intensity={10}
          className={cn(
            "p-5 backdrop-blur-xl transition-colors",
            isDark ? "bg-black/60 border-white/10" : "bg-white/80 border-black/10 shadow-lg shadow-cyan-950/5"
          )}
        >
          <div className={cn("text-[10px] font-mono uppercase", isDark ? "text-white/40" : "text-zinc-500")}>
            2. Replies Sent
          </div>
          <div
            className={cn(
              "text-2xl font-bold font-mono mt-1",
              isDark ? "text-white" : "text-zinc-900"
            )}
          >
            {replies.toLocaleString()}
          </div>
          <div className="text-[10px] text-emerald-500 mt-1">92% Match Rate</div>
        </Card3D>

        <Card3D
          intensity={10}
          className={cn(
            "p-5 backdrop-blur-xl transition-colors",
            isDark ? "bg-black/60 border-white/10" : "bg-white/80 border-black/10 shadow-lg shadow-cyan-950/5"
          )}
        >
          <div className={cn("text-[10px] font-mono uppercase", isDark ? "text-white/40" : "text-zinc-500")}>
            3. DMs Delivered
          </div>
          <div
            className={cn(
              "text-2xl font-bold font-mono mt-1",
              isDark ? "text-white" : "text-zinc-900"
            )}
          >
            {totals.dms.toLocaleString()}
          </div>
          <div className="text-[10px] text-emerald-500 mt-1">100% Deliverability</div>
        </Card3D>

        <Card3D
          intensity={10}
          className={cn(
            "p-5 backdrop-blur-xl transition-colors",
            isDark ? "bg-black/60 border-white/10" : "bg-white/80 border-black/10 shadow-lg shadow-cyan-950/5"
          )}
        >
          <div className={cn("text-[10px] font-mono uppercase", isDark ? "text-white/40" : "text-zinc-500")}>
            4. Button Clicks
          </div>
          <div className="text-2xl font-bold font-mono text-cyan-500 mt-1">
            {totals.clicks.toLocaleString()}
          </div>
          <div className="text-[10px] text-cyan-500 mt-1">49% Action Rate</div>
        </Card3D>
      </div>

      <Card3D
        intensity={8}
        className={cn(
          "p-6 backdrop-blur-xl transition-colors",
          isDark ? "bg-black/60 border-white/12" : "bg-white/80 border-black/10 shadow-lg shadow-cyan-950/5"
        )}
      >
        <h3
          className={cn(
            "text-base font-bold mb-4",
            isDark ? "text-white" : "text-zinc-900"
          )}
        >
          Top Converting DM Buttons
        </h3>
        <div className="space-y-3">
          {topButtons.map((btn) => (
            <div
              key={btn.label}
              className={cn(
                "flex items-center justify-between rounded-xl border p-4 transition-colors",
                isDark
                  ? "border-white/8 bg-white/[0.02]"
                  : "border-black/8 bg-black/[0.02]"
              )}
            >
              <span
                className={cn(
                  "text-xs sm:text-sm font-semibold",
                  isDark ? "text-white" : "text-zinc-900"
                )}
              >
                {btn.label}
              </span>
              <div className="flex items-center gap-6 font-mono text-xs">
                <span className={isDark ? "text-white/60" : "text-zinc-500"}>
                  {btn.clicks} clicks
                </span>
                <span className="rounded-md bg-emerald-500/20 text-emerald-500 px-2.5 py-0.5 font-bold">
                  {btn.rate} CTR
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card3D>
    </div>
  );
}
