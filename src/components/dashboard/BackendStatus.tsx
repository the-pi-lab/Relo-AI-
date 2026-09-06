import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { Activity, CheckCircle2, Loader2, RefreshCw, Server, ServerOff } from "lucide-react";
import { useNavigate } from "react-router";
import { providerDisplayName } from "@/lib/managed-providers";
import { useLiveBackendStatus } from "@/hooks/use-live-backend-status";

const BADGE: Record<string, string> = {
  connected: "bg-green-100 text-green-800 border-green-200",
  pending: "bg-slate-100 text-slate-700 border-slate-200",
  needs_attention: "bg-amber-100 text-amber-800 border-amber-200",
  offline: "bg-red-100 text-red-800 border-red-200",
  incompatible: "bg-red-100 text-red-800 border-red-200",
};

function formatUptime(totalSec: number): string {
  if (totalSec < 90) return `${totalSec}s`;
  const minutes = Math.floor(totalSec / 60);
  if (minutes < 90) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours}h ${minutes % 60}m`;
  return `${Math.floor(hours / 24)}d ${hours % 24}h`;
}

function heartbeatAge(lastPollAt: string | null): number | null {
  if (!lastPollAt) return null;
  return Math.max(0, Math.round((Date.now() - new Date(lastPollAt).getTime()) / 1000));
}

/**
 * Monitoring strip: worker heartbeat age + uptime + sleep guidance.
 * The worker polls every ~2s, so a heartbeat older than 90s means the
 * worker loop is stuck or the whole backend just woke from sleep.
 * Sleep notes are provider-aware (free Render sleeps; Railway/Fly differ).
 */
function MonitoringStrip({
  uptimeSec,
  lastPollAt,
  provider,
}: {
  uptimeSec: number;
  lastPollAt: string | null;
  provider: string | null;
}) {
  const age = heartbeatAge(lastPollAt);
  const stale = age === null || age > 90;
  const sleeps = provider === "render";

  return (
    <div className="mt-3 rounded-lg border bg-muted/40 px-3 py-2.5 text-xs text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1">
      <span className="flex items-center gap-1.5">
        <Activity className="h-3.5 w-3.5" />
        Worker:{" "}
        {stale ? (
          <strong className="text-amber-700">heartbeat stale{age !== null ? ` (${age}s ago)` : " — never seen"}</strong>
        ) : (
          <span>alive ({age}s ago)</span>
        )}
      </span>
      <span>
        Uptime: <strong className="text-foreground">{formatUptime(uptimeSec)}</strong>
      </span>
      {sleeps && (
        <span>
          Free Render sleeps after 15 idle min — events wake it in ~1 min. A 5-min UptimeRobot ping
          keeps it warm but burns the 750h monthly budget; enable only if you see missed events.
        </span>
      )}
    </div>
  );
}

export function BackendStatus() {
  const navigate = useNavigate();
  const backend = useQuery(api.backendRegistry.myBackendStatus);
  const { live, loading, refresh: fetchLive } = useLiveBackendStatus(backend?.backendUrl);

  if (backend === undefined) {
    return (
      <Card className="shadow-md mb-6">
        <CardContent className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Checking backend…
        </CardContent>
      </Card>
    );
  }

  if (backend === null) {
    return (
      <Card className="shadow-md mb-6 border-dashed">
        <CardContent className="flex flex-col sm:flex-row sm:items-center gap-4 py-6">
          <div className="h-11 w-11 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
            <ServerOff className="h-5 w-5 text-slate-500" />
          </div>
          <div className="flex-1">
            <p className="font-semibold">No backend connected</p>
            <p className="text-sm text-muted-foreground">
              Connect the backend you deployed to run your Instagram automation.
            </p>
          </div>
          <Button onClick={() => navigate("/backend")}>Connect backend</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-md mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Server className="h-4 w-4" /> Your backend
            {providerDisplayName(backend.provider) && (
              <span className="text-xs font-normal text-muted-foreground">
                · {providerDisplayName(backend.provider)}
              </span>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={BADGE[backend.status] ?? BADGE.pending}>
              {backend.status === "connected" && <CheckCircle2 className="h-3 w-3 mr-1" />}
              {backend.status.replace(/_/g, " ")}
            </Badge>
            <Button variant="ghost" size="icon" onClick={() => navigate("/backend")}>
              <Server className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => void fetchLive()} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {live === null && (
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Reading live status…
          </p>
        )}
        {live === "error" && (
          <p className="text-sm text-amber-800">
            Backend unreachable from your browser right now (sleeping free-tier service, wrong URL,
            or offline). Registry status: <strong>{backend.status}</strong>.{" "}
            <button className="underline" onClick={() => void fetchLive()}>Retry</button>
          </p>
        )}
        {live !== null && live !== "error" && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div className="rounded-lg border p-3">
                <p className="text-muted-foreground text-xs mb-1">Automations</p>
                <p className="font-semibold text-lg">{live.flows.active} active</p>
                <p className="text-xs text-muted-foreground">{live.flows.total} total</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-muted-foreground text-xs mb-1">Queue</p>
                <p className="font-semibold text-lg">{live.jobsPending} pending</p>
                <p className="text-xs text-muted-foreground">{live.counters.jobsFailed} failed</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-muted-foreground text-xs mb-1">DMs sent</p>
                <p className="font-semibold text-lg">{live.counters.dmSent}</p>
                <p className="text-xs text-muted-foreground">v{live.version}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-muted-foreground text-xs mb-1">AI</p>
                <p className="font-semibold text-lg capitalize">{live.ai.provider}</p>
                <p className="text-xs text-muted-foreground">
                  {live.ai.provider === "none" ? "Keyword-only" : live.ai.configured ? `Ready (${live.ai.model})` : "Key missing"}
                </p>
              </div>
            </div>
            <MonitoringStrip
              uptimeSec={live.uptimeSec}
              lastPollAt={live.worker.lastPollAt}
              provider={backend.provider}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
