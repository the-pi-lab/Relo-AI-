import { useEffect } from "react";
import { AlertCircle } from "lucide-react";
import AnalyticsCards from "@/components/dashboard/AnalyticsCards";
import { useDashboard } from "./DashboardContext";

export default function InsightsPage() {
  const { telemetry, isLoadingAnalytics, analyticsError, loadAnalytics } = useDashboard();

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  return (
    <div className="pg-page">
      <div className="pg-head">
        <div>
          <span className="hm-eyebrow">Insights</span>
          <h1 className="hm-title">
            The engine,
            <br />
            <em>in real numbers.</em>
          </h1>
          <p className="pg-sub">
            Live queue depth, delivery counts, follower conversion — measured, never guessed.
          </p>
        </div>
      </div>

      {isLoadingAnalytics ? (
        <div className="st-tel__grid">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="st-card st-tel-card">
              <div className="st-skel" style={{ width: 38, height: 38, borderRadius: 12 }} />
              <div className="st-skel" style={{ width: "55%", height: 12, marginTop: 16 }} />
              <div className="st-skel" style={{ width: "40%", height: 30, marginTop: 10 }} />
            </div>
          ))}
        </div>
      ) : analyticsError ? (
        <div className="sh-alert" role="alert">
          <AlertCircle size={16} aria-hidden />
          <span style={{ flex: 1 }}>{analyticsError}</span>
          <button type="button" className="sh-btn sh-btn--ghost sh-btn--sm" onClick={loadAnalytics}>
            Retry
          </button>
        </div>
      ) : (
        <AnalyticsCards telemetry={telemetry} />
      )}
    </div>
  );
}
