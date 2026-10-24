"use client";

import {
  Activity,
  BarChart3,
  CircleSlash,
  MessageSquare,
  MousePointerClick,
  Send,
  UserPlus,
} from "lucide-react";

import { useRelo } from "@/lib/relo/store";
import { fmtNum } from "@/lib/relo/data";
import {
  EmptyState,
  ErrorNotice,
  LoadingBlock,
  Panel,
  StatCard,
  ViewHead,
} from "./studio-ui";
import { Button } from "../chrome";
import { cn } from "@/lib/utils";

/* Every figure on this page comes from /api/analytics, /api/leads or
   /api/automations. The Worker exposes aggregates, not a time series, so this
   screen never draws a fake line chart. */

const percent = (part: number, whole: number): number =>
  whole > 0 ? Math.round((part / whole) * 1000) / 10 : 0;

const healthTone = (status: "healthy" | "degraded" | "error"): string =>
  status === "healthy" ? "live" : status === "degraded" ? "paused" : "failed";

function Funnel({
  steps,
}: {
  steps: { label: string; value: number; icon: typeof Activity }[];
}) {
  const max = Math.max(1, ...steps.map((step) => step.value));

  return (
    <div className="space-y-3">
      {steps.map((step, index) => {
        const Icon = step.icon;
        const width = Math.max(step.value > 0 ? 4 : 0, (step.value / max) * 100);
        const previous = steps[index - 1];
        const conversion = previous ? percent(step.value, previous.value) : null;

        return (
          <div key={step.label}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="inline-flex items-center gap-2 text-[13px] font-medium text-ink">
                <Icon className="size-3.5 text-ink-3" aria-hidden />
                {step.label}
              </span>
              <span className="font-mono text-[13px] font-semibold text-ink tnum">
                {fmtNum(step.value)}
                {conversion !== null && (
                  <span className="ml-2 text-[11px] font-normal text-ink-3">
                    {conversion}% of previous
                  </span>
                )}
              </span>
            </div>
            <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-surface-3/60">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-line/80 to-signal transition-[width] duration-500"
                style={{ width: `${width}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}


export function InsightsView() {
  const { account, telemetry, automations, leads } = useRelo();

  if (!account) {
    return (
      <EmptyState
        title="No data to analyse yet"
        sub="Connect an Instagram account, then let a Reel run for a day. Every figure on this page is computed from what the Worker actually recorded."
      />
    );
  }

  const data = telemetry.data;

  const buttons = automations.data
    .flatMap((automation) =>
      (automation.shortLinks ?? []).map((link) => ({
        id: link.id,
        label:
          automation.templateCard.buttons[link.buttonIndex]?.title ??
          link.targetUrl,
        url: link.targetUrl,
        clicks: link.clickCount,
      }))
    )
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 6);

  const totalClicks = buttons.reduce((sum, button) => sum + button.clicks, 0);

  return (
    <div className="space-y-7">
      <ViewHead
        title="Analytics"
        sub="Aggregates from your Worker. RELO does not invent trends: if a number is zero, nothing has happened yet."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => void telemetry.refresh()}
            disabled={telemetry.loading}
          >
            {telemetry.loading ? "Refreshing" : "Refresh"}
          </Button>
        }
      />

      {telemetry.error && (
        <ErrorNotice
          message={telemetry.error.message}
          detail={telemetry.error.code}
          onRetry={() => void telemetry.refresh()}
        />
      )}

      {telemetry.loading && !data ? (
        <LoadingBlock label="Reading analytics" />
      ) : (
        <>
          <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Comments"
              value={fmtNum(
                data?.totalCommentsHeard ?? data?.totalComments ?? 0
              )}
              hint="Keyword comments heard"
            />
            <StatCard
              label="DMs delivered"
              value={fmtNum(
                data?.totalDmsDelivered ?? data?.totalComments ?? 0
              )}
              hint="Private replies sent"
            />
            <StatCard
              label="Leads"
              value={fmtNum(data?.totalLeads ?? 0)}
              hint="Unique people captured"
            />
            <StatCard
              label="Clicks"
              value={fmtNum(data?.totalClicks ?? 0)}
              hint="Short-link opens"
            />
          </div>

          <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
            <Panel title="Funnel">
              <Funnel
                steps={[
                  {
                    label: "Comments heard",
                    value: data?.totalCommentsHeard ?? data?.totalComments ?? 0,
                    icon: MessageSquare,
                  },
                  {
                    label: "DMs delivered",
                    value: data?.totalDmsDelivered ?? data?.totalComments ?? 0,
                    icon: Send,
                  },
                  {
                    label: "Leads captured",
                    value: data?.totalLeads ?? 0,
                    icon: UserPlus,
                  },
                  {
                    label: "Button clicks",
                    value: data?.totalClicks ?? 0,
                    icon: MousePointerClick,
                  },
                ]}
              />
            </Panel>

            <Panel title="Delivery quality">
              <div className="space-y-4">
                <div>
                  <p className="caption">Completed in 24 hours</p>
                  <p className="mt-1 font-mono text-[24px] font-bold text-ink tnum">
                    {fmtNum(data?.completed24h ?? 0)}
                  </p>
                </div>
                <div>
                  <p className="caption">Failed in 24 hours</p>
                  <p
                    className={cn(
                      "mt-1 font-mono text-[24px] font-bold tnum",
                      (data?.failed24h ?? 0) > 0 ? "text-warn" : "text-ink"
                    )}
                  >
                    {fmtNum(data?.failed24h ?? 0)}
                  </p>
                </div>
                <div>
                  <p className="caption">Pending jobs</p>
                  <p className="mt-1 font-mono text-[24px] font-bold text-ink tnum">
                    {fmtNum(data?.pendingJobs ?? 0)}
                  </p>
                </div>
                <p className="border-t border-line pt-3 text-[11.5px] leading-relaxed text-ink-3">
                  Comments outside your keywords never become jobs, so they are
                  not counted here.
                </p>
              </div>
            </Panel>
          </div>

          <Panel
            title="Button performance"
            actions={
              <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink-3">
                {fmtNum(totalClicks)} tracked clicks
              </span>
            }
            bodyClassName="p-0"
          >
            {buttons.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <CircleSlash className="mx-auto size-5 text-ink-3" aria-hidden />
                <p className="mt-3 text-[13.5px] font-semibold text-ink">
                  No tracked buttons yet
                </p>
                <p className="mx-auto mt-1 max-w-sm text-[12.5px] leading-relaxed text-ink-3">
                  Every <span className="font-mono">https://</span> button in a DM
                  card gets its own RELO short link. Clicks are counted per
                  button, per automation.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-line/70">
                {buttons.map((button) => (
                  <li
                    key={button.id}
                    className="flex items-center justify-between gap-4 px-5 py-3.5"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-medium text-ink">
                        {button.label}
                      </span>
                      <span className="block truncate font-mono text-[10.5px] text-ink-3">
                        {button.url}
                      </span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="block font-mono text-[13px] font-bold text-ink tnum">
                        {fmtNum(button.clicks)}
                      </span>
                      <span className="block font-mono text-[10px] text-ink-3">
                        {percent(button.clicks, totalClicks)}%
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <div className="grid gap-5 sm:grid-cols-2">
            <Panel title="Lead list">
              <div className="flex items-baseline gap-3">
                <BarChart3 className="size-5 text-ink-3" aria-hidden />
                <p className="font-mono text-[28px] font-bold text-ink tnum">
                  {fmtNum(leads.total)}
                </p>
              </div>
              <p className="mt-2 text-[12.5px] leading-relaxed text-ink-3">
                Total captured across this account. Export the full list as CSV
                from{" "}
                <span className="font-mono text-ink-2">Captured leads</span>.
              </p>
            </Panel>

            <Panel title="What is not counted">
              <ul className="space-y-2.5 text-[12.5px] leading-relaxed text-ink-2">
                <li>Â· Comments on Reels with no active automation.</li>
                <li>Â· Link clicks outside RELO short links.</li>
                <li>Â· Followers: Meta exposes no follower lookup, so RELO never claims one.</li>
              </ul>
            </Panel>
          </div>
        </>
      )}
    </div>
  );
}
