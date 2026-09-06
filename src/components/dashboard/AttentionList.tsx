import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router";
import type { LiveBackendStatus } from "@/hooks/use-live-backend-status";

interface FlowSummary {
  _id: string;
  name: string;
  status: string;
  failedExecutions?: number;
  ai?: { enabled: boolean };
}

interface BackendSummary {
  status: string;
  lastError?: string | null;
}

interface AttentionListProps {
  instagramConnected: boolean;
  backend: BackendSummary | null | undefined;
  live: LiveBackendStatus | null | "error";
  flows: FlowSummary[] | undefined;
  licensed: boolean;
}

interface Item {
  title: string;
  detail: string;
  path: string;
  cta: string;
}

/**
 * "Errors requiring attention" — the only list on the dashboard allowed to
 * demand action. Renders nothing when everything is healthy. Every item is
 * computed from live data and links to the place that fixes it.
 */
export function AttentionList({ instagramConnected, backend, live, flows, licensed }: AttentionListProps) {
  const navigate = useNavigate();
  const items: Item[] = [];

  if (!instagramConnected) {
    items.push({
      title: "Instagram not connected",
      detail: "Connect your account to start building automations.",
      path: "/integrations",
      cta: "Connect",
    });
  }
  if (!backend) {
    items.push({
      title: "No backend connected",
      detail: "Deploy your backend so automations have somewhere to run.",
      path: "/backend",
      cta: "Set up",
    });
  } else if (backend.status !== "connected") {
    items.push({
      title: `Backend ${backend.status.replace(/_/g, " ")}`,
      detail: backend.lastError ?? "Your backend needs attention before automations can run.",
      path: "/backend",
      cta: "Fix",
    });
  }
  for (const flow of flows ?? []) {
    if ((flow.failedExecutions ?? 0) > 0 && flow.status === "active") {
      items.push({
        title: `“${flow.name}” has ${flow.failedExecutions} failed runs`,
        detail: "An active automation is failing — check keywords, token, and rate limits.",
        path: "/flows",
        cta: "Inspect",
      });
    }
  }
  const aiFlows = (flows ?? []).filter((f) => f.ai?.enabled && f.status === "active");
  if (aiFlows.length > 0 && live !== null && live !== "error") {
    if (live.ai.provider === "none" || !live.ai.configured) {
      items.push({
        title: "AI automations have no provider key",
        detail: `${aiFlows.length} active flow${aiFlows.length === 1 ? " uses" : "s use"} AI, but the backend reports no configured key. Template messages are being sent instead.`,
        path: "/backend",
        cta: "Configure",
      });
    }
  }
  if (!licensed) {
    items.push({
      title: "Evaluation mode",
      detail: "1 active flow and modest central limits. A $10 lifetime license unlocks unlimited automations.",
      path: "/pricing",
      cta: "Upgrade",
    });
  }

  if (items.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="mb-6 border-amber-200 bg-amber-50/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            Needs attention ({items.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {items.map((item) => (
            <div
              key={item.title}
              className="flex items-center gap-3 py-2 border-t first:border-t-0 border-amber-200/60"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.title}</p>
                <p className="text-xs text-muted-foreground truncate">{item.detail}</p>
              </div>
              <Button variant="outline" size="sm" className="shrink-0" onClick={() => navigate(item.path)}>
                {item.cta} <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
}
