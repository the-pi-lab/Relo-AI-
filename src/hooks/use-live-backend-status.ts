import { useCallback, useEffect, useState } from "react";

export interface LiveBackendStatus {
  version: string;
  uptimeSec: number;
  accounts: { instagramId: string; username: string; isActive: boolean }[];
  flows: { total: number; active: number };
  jobsPending: number;
  ai: { provider: string; configured: boolean; model: string | null };
  counters: { dmSent: number; jobsCompleted: number; jobsFailed: number };
  worker: { lastPollAt: string | null; lastJobAt: string | null };
}

/**
 * Reads the customer backend's public /api/status from the browser.
 * Single fetch on mount + manual refresh only — the dashboard must never
 * become another background poller. Returns "error" when the backend is
 * unreachable from the browser (sleeping service, wrong URL, offline).
 */
export function useLiveBackendStatus(backendUrl: string | null | undefined) {
  const [live, setLive] = useState<LiveBackendStatus | null | "error">(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!backendUrl) return;
    setLoading(true);
    try {
      const response = await fetch(`${backendUrl}/api/status`, {
        signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setLive((await response.json()) as LiveBackendStatus);
    } catch {
      setLive("error");
    } finally {
      setLoading(false);
    }
  }, [backendUrl]);

  useEffect(() => {
    if (backendUrl) void refresh();
  }, [backendUrl, refresh]);

  return { live, loading, refresh };
}
