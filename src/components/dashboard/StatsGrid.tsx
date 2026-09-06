import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Inbox, MessageSquare, Zap, ListOrdered } from "lucide-react";
import { motion } from "framer-motion";
import type { LiveBackendStatus } from "@/hooks/use-live-backend-status";

interface StatsGridProps {
  stats: {
    messagesUsedToday?: number;
    licensed?: boolean;
    activeFlowsCount?: number;
  } | null | undefined;
  live: LiveBackendStatus | null | "error";
}

// Evaluation: modest central daily cap. Licensed: unlimited (own backend governs).
const EVALUATION_DAILY_LIMIT = 50;

/**
 * Four honest numbers. Central-plane figures are labeled as such; backend
 * figures come from the customer's live /api/status. Dashes — never zeros
 * dressed as data — when the backend isn't connected.
 */
export function StatsGrid({ stats, live }: StatsGridProps) {
  const limit = stats?.licensed ? Infinity : EVALUATION_DAILY_LIMIT;
  const used = stats?.messagesUsedToday || 0;
  const usage = limit === Infinity ? 0 : Math.min((used / limit) * 100, 100);
  const backendLive = live !== null && live !== "error" ? live : null;

  const cards = [
    {
      title: "Messages today · control plane",
      value: String(used),
      subtext: limit === Infinity ? "Licensed — no central cap" : `of ${limit} evaluation limit`,
      icon: MessageSquare,
      progress: usage,
    },
    {
      title: "Active automations",
      value: String(stats?.activeFlowsCount ?? 0),
      subtext: "Running flows",
      icon: Zap,
    },
    {
      title: "DMs sent · your backend",
      value: backendLive ? String(backendLive.counters.dmSent) : "—",
      subtext: backendLive ? `v${backendLive.version}` : "Connect backend to track",
      icon: Inbox,
    },
    {
      title: "Queue pending · your backend",
      value: backendLive ? String(backendLive.jobsPending) : "—",
      subtext: backendLive ? `${backendLive.counters.jobsFailed} failed total` : "Connect backend to track",
      icon: ListOrdered,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card, index) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: Math.min(index * 0.06, 0.2) }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-[13px] font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold tracking-tight">{card.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{card.subtext}</p>
              {card.progress !== undefined && (
                <div className="w-full bg-muted rounded-full h-1.5 mt-3 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${card.progress}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="h-full rounded-full bg-primary"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
