import { useEffect, useState } from "react";
import { Activity, MessageCircle, Send, TrendingUp, Server, Database } from "lucide-react";
import type { SystemTelemetry } from "@/types/contracts";

const reduceMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function useCountUp(target: number, duration = 1200): number {
  const [value, setValue] = useState(() => (reduceMotion() ? target : 0));
  useEffect(() => {
    if (reduceMotion()) {
      setValue(target);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      setValue(Math.round(target * (1 - Math.pow(1 - p, 4))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

/** Estimated yearly ManyChat cost avoided at the given contact count. */
function manyChatTaxSaved(leads: number): number {
  if (leads <= 0) return 0;
  if (leads <= 500) return 180;
  if (leads <= 1000) return 300;
  if (leads <= 2500) return 420;
  if (leads <= 5000) return 540;
  if (leads <= 10000) return 780;
  return 1740;
}

interface AnalyticsCardsProps {
  telemetry: SystemTelemetry & {
    totalLeads: number;
    totalComments: number;
    totalDmsSent: number;
    followerConversionRate: number;
  };
}

export default function AnalyticsCards({ telemetry }: AnalyticsCardsProps) {
  const totalComments = useCountUp(telemetry.totalComments);
  const totalDms = useCountUp(telemetry.totalDmsSent);
  const conversion = useCountUp(telemetry.followerConversionRate);
  const taxSaved = useCountUp(manyChatTaxSaved(telemetry.totalLeads));
  const isHealthy = telemetry.status === "healthy";

  return (
    <div>
      <div className="st-tel__grid">
        <div className="st-card st-card--hover st-tel-card">
          <div className="st-tel-card__icon">
            <Activity aria-hidden />
          </div>
          <span className="st-tel-card__label">System Status</span>
          <div className="st-tel-card__value">
            <span className="st-pulse" aria-hidden>
              <i />
            </span>
            {isHealthy ? "Live" : "Strained"}
          </div>
          <p className="st-tel-card__foot">
            {isHealthy
              ? "Edge worker + cron queue fully operational"
              : `${telemetry.failed24h} failures in the last 24h — check token validity`}
          </p>
        </div>

        <div className="st-card st-card--hover st-tel-card">
          <div className="st-tel-card__icon">
            <MessageCircle aria-hidden />
          </div>
          <span className="st-tel-card__label">Comments Processed</span>
          <div className="st-tel-card__value">{totalComments.toLocaleString()}</div>
          <p className="st-tel-card__foot">Keyword triggers from your active Reels</p>
        </div>

        <div className="st-card st-card--hover st-tel-card">
          <div className="st-tel-card__icon">
            <Send aria-hidden />
          </div>
          <span className="st-tel-card__label">DMs Delivered</span>
          <div className="st-tel-card__value">{totalDms.toLocaleString()}</div>
          <p className="st-tel-card__foot">3-button Generic Template cards dispatched</p>
        </div>

        <div className="st-card st-card--hover st-tel-card">
          <div className="st-tel-card__icon">
            <TrendingUp aria-hidden />
          </div>
          <span className="st-tel-card__label">Follower Conversion</span>
          <div className="st-tel-card__value">
            {telemetry.totalComments === 0 ? "—" : `${conversion}%`}
          </div>
          <p className="st-tel-card__foot">
            {telemetry.totalComments === 0
              ? "Awaiting your first triggered comment"
              : "Commenters verified as followers at trigger time"}
          </p>
        </div>
      </div>

      <div className="st-card st-tel-detail">
        <h4 className="st-tel-detail__title">
          <Server aria-hidden />
          Edge Diagnostics &amp; Anti-Spam Queue
        </h4>
        <div className="st-tel-detail__grid">
          <div className="st-tel-cell">
            <span className="st-tel-cell__label">Queue Depth</span>
            <div className="st-tel-cell__value">
              {telemetry.pendingJobs} <em>jobs</em>
            </div>
            <div className="st-meter" aria-hidden>
              <i style={{ width: `${Math.min(100, telemetry.pendingJobs * 4)}%` }} />
            </div>
            <span className="st-tel-cell__note">30–90s randomized human jitter</span>
          </div>

          <div className="st-tel-cell">
            <span className="st-tel-cell__label">Last 24 Hours</span>
            <div className="st-tel-cell__value">
              {telemetry.completed24h} <em>sent</em>
            </div>
            <div
              className="st-meter"
              aria-hidden
            >
              <i
                style={{
                  width: `${
                    telemetry.completed24h + telemetry.failed24h > 0
                      ? Math.round(
                          (telemetry.completed24h /
                            (telemetry.completed24h + telemetry.failed24h)) *
                            100
                        )
                      : 0
                  }%`,
                }}
              />
            </div>
            <span className="st-tel-cell__note">
              {telemetry.failed24h} failed · retry with exponential backoff
            </span>
          </div>

          <div className="st-tel-cell">
            <span className="st-tel-cell__label">
              <Database style={{ width: 11, height: 11, verticalAlign: -1 }} /> Contact Tax Saved
            </span>
            <div className="st-tel-cell__value">
              <em>${taxSaved.toLocaleString()}</em> /yr
            </div>
            <span className="st-tel-cell__note">
              {telemetry.totalLeads > 0
                ? `vs. incumbent tiers at ${telemetry.totalLeads.toLocaleString()} contacts`
                : "Starts at $180/yr once your first 500 leads land"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
