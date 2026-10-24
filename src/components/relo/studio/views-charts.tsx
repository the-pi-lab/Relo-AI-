"use client";

import {
  Activity,
  ArrowRight,
  BarChart3,
  CircleSlash,
  MessageSquare,
  MousePointerClick,
  Send,
  UserPlus,
} from "lucide-react";

import { useRelo } from "@/lib/relo/store";
import { fmtNum, timeAgo } from "@/lib/relo/data";
import {
  EmptyState,
  ErrorNotice,
  LoadingBlock,
  Panel,
  StatCard,
  StatusPill,
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

export function HomeView({ go }: { go: (view: string) => void }) {
  const { account, plan, credits, telemetry, automations, leads, leadsLoading, campaigns } =
    useRelo();

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  if (!account) {
    return (
      <div className="space-y-7">
        <ViewHead
          title="Your studio is empty"
          sub="Connect the Instagram account you create Reels from. RELO reads the comments on those Reels and replies through the same account."
        />
        <EmptyState
          title="No Instagram account connected"
          sub="Connecting takes one Facebook Login round trip. We store the Page token encrypted and never post anything you did not configure."
        >
          <Button variant="signal" size="lg" onClick={() => go("settings")}>
            Connect Instagram
            <ArrowRight className="size-4" aria-hidden />
          </Button>
        </EmptyState>
      </div>
    );
  }

  const data = telemetry.data;

  return (
    <div className="space-y-7">
      <ViewHead
        title={`${greeting}, @${account.username}`}
        sub="Everything below is measured by the Worker. New activity appears here after the next drain cycle."
      >
        <Button variant="signal" size="md" onClick={() => go("automations")}>
          New automation
          <ArrowRight className="size-4" aria-hidden />
        </Button>
      </ViewHead>

      {telemetry.error && (
        <ErrorNotice
          message={telemetry.error.message}
          detail={telemetry.error.code}
          onRetry={() => void telemetry.refresh()}
        />
      )}

      {telemetry.loading && !data ? (
        <LoadingBlock label="Reading your analytics" />
      ) : (
        <>
          <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="DMs sent"
              value={fmtNum(data?.totalDmsSent ?? 0)}
              hint="Private replies delivered"
            />
            <StatCard
              label="Leads captured"
              value={fmtNum(data?.totalLeads ?? 0)}
              hint="People in your list"
            />
            <StatCard
              label="Comments processed"
              value={fmtNum(data?.totalComments ?? 0)}
              hint="Matched against your keywords"
            />
            <StatCard
              label="Button clicks"
              value={fmtNum(data?.totalClicks ?? 0)}
              hint="Tracked short links"
            />
          </div>

          <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
            <Panel
              title="Comment-to-click funnel"
              actions={
                <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink-3">
                  Since connecting
                </span>
              }
            >
              <Funnel
                steps={[
                  {
                    label: "Comments processed",
                    value: data?.totalComments ?? 0,
                    icon: MessageSquare,
                  },
                  {
                    label: "DMs sent",
                    value: data?.totalDmsSent ?? 0,
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
              <p className="mt-5 border-t border-line pt-3.5 text-[12.5px] leading-relaxed text-ink-3">
                A lead is counted once per Instagram account, no matter how many
                times they comment. Clicks come from RELO short links, not from
                Meta.
              </p>
            </Panel>

            <Panel
              title="Engine"
              actions={<StatusPill status={healthTone(data?.status ?? "healthy")} />}
            >
              <dl className="divide-y divide-line/70">
                {[
                  ["Queue depth", fmtNum(data?.queueDepth ?? 0)],
                  ["Pending jobs", fmtNum(data?.pendingJobs ?? 0)],
                  ["Completed · 24h", fmtNum(data?.completed24h ?? 0)],
                  ["Failed · 24h", fmtNum(data?.failed24h ?? 0)],
                  ["Stored rows", fmtNum(data?.storageRows ?? 0)],
                  ["Plan", plan === "studio" ? "Studio" : plan === "pro" ? "Pro" : "Free"],
                  ["AI credits", `${credits}`],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-baseline justify-between gap-3 py-2.5">
                    <dt className="text-[12.5px] text-ink-3">{label}</dt>
                    <dd className="font-mono text-[13px] font-semibold text-ink tnum">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
              {(data?.failed24h ?? 0) > 0 && (
                <p className="mt-3 rounded-lg border border-warn/30 bg-warn-wash px-3 py-2 text-[12px] text-warn">
                  Some jobs failed in the last day. Meta rate limits are retried
                  automatically; repeated failures usually mean the Page token
                  needs reconnecting.
                </p>
              )}
            </Panel>
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <Panel
              title="Recent leads"
              actions={
                <button
                  type="button"
                  onClick={() => go("leads")}
                  className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-ink-2 transition-colors hover:text-ink"
                >
                  View all
                  <ArrowRight className="size-3.5" aria-hidden />
                </button>
              }
              bodyClassName="p-0"
            >
              {leadsLoading && leads.leads.length === 0 ? (
                <div className="px-5 py-10 text-center text-[13px] text-ink-3">
                  Loading leads
                </div>
              ) : leads.leads.length === 0 ? (
                <div className="px-5 py-10 text-center">
                  <p className="text-[13.5px] font-semibold text-ink">
                    No leads yet
                  </p>
                  <p className="mx-auto mt-1 max-w-xs text-[12.5px] leading-relaxed text-ink-3">
                    The first person who comments a keyword on an active Reel
                    will appear here.
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-line/70">
                  {leads.leads.slice(0, 5).map((lead) => (
                    <li
                      key={lead.id}
                      className="flex items-center justify-between gap-3 px-5 py-3"
                    >
                      <span className="flex min-w-0 items-center gap-2.5">
                        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-surface-2 text-[11px] font-bold text-ink-2">
                          {(lead.username ?? "?").slice(0, 1).toUpperCase()}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-[13px] font-medium text-ink">
                            {lead.username ? `@${lead.username}` : "Instagram user"}
                          </span>
                          <span className="block font-mono text-[10.5px] text-ink-3">
                            {lead.totalDmsSent} DM{lead.totalDmsSent === 1 ? "" : "s"} ·{" "}
                            {timeAgo(lead.firstInteractionAt)}
                          </span>
                        </span>
                      </span>
                      {lead.emailCollected && (
                        <span className="hidden truncate text-[11.5px] text-ink-3 sm:block">
                          {lead.emailCollected}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            <Panel
              title="Active automations"
              actions={
                <button
                  type="button"
                  onClick={() => go("automations")}
                  className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-ink-2 transition-colors hover:text-ink"
                >
                  Manage
                  <ArrowRight className="size-3.5" aria-hidden />
                </button>
              }
              bodyClassName="p-0"
            >
              {automations.loading && automations.data.length === 0 ? (
                <div className="px-5 py-10 text-center text-[13px] text-ink-3">
                  Loading automations
                </div>
              ) : automations.data.length === 0 ? (
                <div className="px-5 py-10 text-center">
                  <p className="text-[13.5px] font-semibold text-ink">
                    Nothing is watching yet
                  </p>
                  <p className="mx-auto mt-1 max-w-xs text-[12.5px] leading-relaxed text-ink-3">
                    Pick a Reel, add the words people actually type, and RELO
                    answers the comment for you.
                  </p>
                  <button
                    type="button"
                    onClick={() => go("automations")}
                    className="mt-3 text-[12.5px] font-semibold text-signal hover:text-signal-hover"
                  >
                    Create the first automation
                  </button>
                </div>
              ) : (
                <ul className="divide-y divide-line/70">
                  {automations.data.slice(0, 5).map((automation) => (
                    <li
                      key={automation.id}
                      className="flex items-center justify-between gap-3 px-5 py-3"
                    >
                      <span className="min-w-0">
                        <span className="flex items-center gap-2">
                          <span className="truncate text-[13px] font-medium text-ink">
                            {automation.triggerKeywords.slice(0, 3).join(", ") ||
                              "No keywords"}
                          </span>
                          <StatusPill status={automation.isActive ? "active" : "paused"} />
                        </span>
                        <span className="mt-0.5 block truncate font-mono text-[10.5px] text-ink-3">
                          {automation.commentReplies.length} replies ·{" "}
                          {automation.shortLinks?.reduce(
                            (sum, link) => sum + link.clickCount,
                            0
                          ) ?? 0}{" "}
                          clicks
                        </span>
                      </span>
                      <span className="shrink-0 font-mono text-[10.5px] text-ink-3">
                        {timeAgo(automation.updatedAt)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>

          {plan === "free" && (
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-surface/50 px-5 py-4">
              <div>
                <p className="text-[13.5px] font-semibold text-ink">
                  Free includes one automated Reel for life
                </p>
                <p className="mt-0.5 text-[12.5px] text-ink-2">
                  Pro removes the reel cap, adds broadcasts, offers and the bio
                  page.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => go("settings")}>
                Compare plans
              </Button>
            </div>
          )}

          {telemetry.data && (campaigns.data.length > 0 || leads.total > 0) && (
            <div className="grid gap-3.5 sm:grid-cols-3">
              <StatCard
                label="Conversion rate"
                value={`${percent(
                  telemetry.data.totalLeads,
                  telemetry.data.totalComments
                )}%`}
                hint="Comments that became leads"
              />
              <StatCard
                label="Click rate"
                value={`${percent(
                  telemetry.data.totalClicks,
                  telemetry.data.totalDmsSent
                )}%`}
                hint="DMs that produced a click"
              />
              <StatCard
                label="Campaigns"
                value={fmtNum(campaigns.data.length)}
                hint={
                  plan === "free"
                    ? "Pro feature"
                    : "Composer saved broadcasts"
                }
              />
            </div>
          )}
        </>
      )}
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
              value={fmtNum(data?.totalComments ?? 0)}
              hint="Keyword comments answered"
            />
            <StatCard
              label="DMs delivered"
              value={fmtNum(data?.totalDmsSent ?? 0)}
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
                    label: "Comments processed",
                    value: data?.totalComments ?? 0,
                    icon: MessageSquare,
                  },
                  { label: "DMs sent", value: data?.totalDmsSent ?? 0, icon: Send },
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
                <li>· Comments on Reels with no active automation.</li>
                <li>· Link clicks outside RELO short links.</li>
                <li>· Followers: Meta exposes no follower lookup, so RELO never claims one.</li>
              </ul>
            </Panel>
          </div>
        </>
      )}
    </div>
  );
}
