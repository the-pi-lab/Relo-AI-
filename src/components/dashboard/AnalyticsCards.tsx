import React from "react";
import {
  Activity,
  MessageCircle,
  Send,
  TrendingUp,
  Server,
} from "lucide-react";
import type { SystemTelemetry } from "@/types/contracts";

interface AnalyticsCardsProps {
  telemetry: SystemTelemetry & {
    totalLeads: number;
    totalComments: number;
    totalDmsSent: number;
    followerConversionRate: number;
  };
}

export default function AnalyticsCards({ telemetry }: AnalyticsCardsProps) {
  const calculateManyChatTaxSaved = (leads: number) => {
    if (leads === 0) return 0;
    if (leads <= 500) return 180;
    if (leads <= 1000) return 300;
    if (leads <= 2500) return 420;
    if (leads <= 5000) return 540;
    if (leads <= 10000) return 780;
    return 1740;
  };

  const estimatedTaxSaved = calculateManyChatTaxSaved(telemetry.totalLeads);

  const statusLabel =
    telemetry.status === "healthy"
      ? "Operational"
      : telemetry.status === "idle"
      ? "Standby"
      : "Reconnection Needed";

  const cards = [
    {
      title: "System Status",
      value: statusLabel,
      description:
        telemetry.status === "healthy"
          ? "Cloudflare Edge + Cron-as-Queue active"
          : "Awaiting incoming webhook activity",
      icon: Activity,
      color:
        telemetry.status === "healthy"
          ? "text-emerald-600 bg-emerald-50 border-emerald-200"
          : "text-slate-600 bg-slate-50 border-slate-200",
      indicator: telemetry.status === "healthy" ? "bg-emerald-500" : undefined,
    },
    {
      title: "Comments Processed",
      value: telemetry.totalComments.toLocaleString(),
      description: "Triggered from active Instagram Reels",
      icon: MessageCircle,
      color: "text-sky-600 bg-sky-50 border-sky-200",
    },
    {
      title: "Direct Messages Sent",
      value: telemetry.totalDmsSent.toLocaleString(),
      description: "Generic Template cards dispatched",
      icon: Send,
      color: "text-sky-600 bg-sky-50 border-sky-200",
    },
    {
      title: "Follower Conversion",
      value: telemetry.totalComments === 0 ? "—" : `${telemetry.followerConversionRate}%`,
      description:
        telemetry.totalComments === 0
          ? "Awaiting first comment activity"
          : "Commenters verified as active followers",
      icon: TrendingUp,
      color: "text-emerald-600 bg-emerald-50 border-emerald-200",
    },
  ];

  return (
    <div className="space-y-6 font-sans">
      {/* 4 Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={i}
              className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {card.title}
                </span>
                <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${card.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  {card.indicator && (
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                    </span>
                  )}
                  <span className="text-2xl font-black text-slate-900 tracking-tight">
                    {card.value}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium">{card.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edge Diagnostics Breakdown */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
        <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Server className="w-4 h-4 text-sky-600" />
          Cloudflare Edge Diagnostics & Anti-Spam Queue
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-xs text-slate-500 font-medium block mb-1">Queue Depth (Pending Jitter)</span>
            <span className="text-xl font-bold font-mono text-slate-800">
              {telemetry.pendingJobs} jobs
            </span>
            <span className="text-[11px] text-slate-400 block mt-1">30–90s randomized human delay</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-xs text-slate-500 font-medium block mb-1">Average Edge Response</span>
            <span className="text-xl font-bold font-mono text-emerald-600">
              {telemetry.averageLatencyMs > 0 ? `${telemetry.averageLatencyMs}ms` : "<15ms"}
            </span>
            <span className="text-[11px] text-slate-400 block mt-1">Fast edge webhook ingestion</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-xs text-slate-500 font-medium block mb-1">ManyChat Tax Saved</span>
            <span className="text-xl font-bold font-mono text-sky-600">
              ${estimatedTaxSaved.toFixed(2)} / yr
            </span>
            <span className="text-[11px] text-slate-400 block mt-1">
              {telemetry.totalLeads > 0
                ? "Calculated vs ManyChat contact tiers"
                : "$180/yr savings unlocked on your first 500 leads"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
