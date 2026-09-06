import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { Bot, Pause, Play, Trash2, UserCheck } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface FlowCardProps {
  flow: {
    _id: Id<"flows">;
    name: string;
    description?: string;
    status: string;
    trigger: {
      type: string;
      keywords?: string[];
      postId?: string;
      requireFollow?: boolean;
    };
    ai?: { enabled: boolean };
    totalExecutions?: number;
    successfulExecutions?: number;
    failedExecutions?: number;
  };
  index?: number;
}

/**
 * One automation at a glance: WHEN it runs, IF it matches, THEN what it
 * sends — plus status, stats, and lifecycle actions. No flow-chart theatrics;
 * readability is the feature.
 */
export function FlowCard({ flow, index = 0 }: FlowCardProps) {
  const updateFlow = useMutation(api.flows.update);
  const deleteFlow = useMutation(api.flows.remove);

  const handleToggle = async () => {
    try {
      const next = flow.status === "active" ? "paused" : "active";
      await updateFlow({ id: flow._id, status: next });
      toast.success(next === "active" ? "Automation activated." : "Automation paused.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update automation.");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteFlow({ id: flow._id });
      toast.success("Automation deleted.");
    } catch {
      toast.error("Failed to delete automation.");
    }
  };

  const whenLabel =
    flow.trigger.type === "instagram_dm"
      ? "Instagram DM arrives"
      : flow.trigger.postId
        ? "Comment on one post"
        : "Comment on any post";
  const keywords = flow.trigger.keywords ?? [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.3) }}
    >
      <Card className="h-full flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base leading-snug">{flow.name}</CardTitle>
            <Badge variant={flow.status === "active" ? "default" : "secondary"} className="shrink-0">
              {flow.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col gap-3 text-sm">
          <div className="rounded-lg border divide-y">
            <div className="px-3 py-2">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">When</p>
              <p className="font-medium text-[13px]">{whenLabel}</p>
            </div>
            <div className="px-3 py-2">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">If</p>
              {keywords.length > 0 ? (
                <div className="flex flex-wrap gap-1 mt-1">
                  {keywords.map((k) => (
                    <Badge key={k} variant="outline" className="text-[11px]">
                      {k}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-[13px] text-muted-foreground">any message</p>
              )}
              {flow.trigger.requireFollow && (
                <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                  <UserCheck className="h-3 w-3" /> follower only
                </p>
              )}
            </div>
            <div className="px-3 py-2">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Then</p>
              <p className="font-medium text-[13px] flex items-center gap-1.5">
                Send DM
                {flow.ai?.enabled && (
                  <Badge variant="outline" className="text-[11px] bg-sky-50 text-sky-700 border-sky-200">
                    <Bot className="h-3 w-3 mr-0.5" /> AI
                  </Badge>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-muted-foreground mt-auto pt-1">
            <span><strong className="text-foreground">{flow.totalExecutions ?? 0}</strong> runs</span>
            <span><strong className="text-green-600">{flow.successfulExecutions ?? 0}</strong> sent</span>
            <span><strong className="text-red-600">{flow.failedExecutions ?? 0}</strong> failed</span>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={() => void handleToggle()}>
              {flow.status === "active" ? (
                <><Pause className="h-3 w-3 mr-1" /> Pause</>
              ) : (
                <><Play className="h-3 w-3 mr-1" /> Activate</>
              )}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => void handleDelete()} aria-label="Delete automation">
              <Trash2 className="h-3 w-3 text-destructive" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
