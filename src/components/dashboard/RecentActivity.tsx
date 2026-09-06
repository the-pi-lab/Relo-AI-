import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle2, PlayCircle, Send, XCircle } from "lucide-react";
import { motion } from "framer-motion";

interface RecentActivityProps {
  stats: {
    todayStats?: {
      sentMessages?: number;
      deliveredMessages?: number;
      failedMessages?: number;
      flowExecutions?: number;
    };
  } | null | undefined;
}

/**
 * Today's central-plane activity. Labeled honestly: when automations run on
 * the customer's backend, these stay at zero and the backend cards
 * (StatsGrid / BackendStatus) carry the real numbers.
 */
export function RecentActivity({ stats }: RecentActivityProps) {
  const items = [
    { label: "Sent", value: stats?.todayStats?.sentMessages || 0, icon: Send },
    { label: "Delivered", value: stats?.todayStats?.deliveredMessages || 0, icon: CheckCircle2 },
    { label: "Failed", value: stats?.todayStats?.failedMessages || 0, icon: XCircle },
    { label: "Executions", value: stats?.todayStats?.flowExecutions || 0, icon: PlayCircle },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.15 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Today · control plane</CardTitle>
          <CardDescription>Central executions only — backend runs are counted on your backend.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {items.map((item) => (
              <div key={item.label} className="flex items-center gap-3 rounded-lg border p-3">
                <item.icon className="h-5 w-5 text-muted-foreground shrink-0" />
                <div>
                  <div className="text-xl font-semibold tracking-tight">{item.value}</div>
                  <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">{item.label}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
