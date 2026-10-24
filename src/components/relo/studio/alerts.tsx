"use client";

import { useMemo } from "react";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Clock3,
  CreditCard,
  ShieldAlert,
  Sparkles,
  Workflow,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useRelo } from "@/lib/relo/store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * The bell is a *signal*, not an inbox.
 *
 * Every row is derived from the same state the rest of the studio reads, so it
 * cannot claim an event that did not happen. There is no fake unread pile: the
 * badge is the number of conditions that need attention right now, and it goes
 * to zero on its own when the condition clears.
 */

type Tone = "bad" | "warn" | "info" | "ok";

interface Alert {
  id: string;
  tone: Tone;
  icon: typeof Bell;
  title: string;
  body: string;
  action?: { label: string; view: string };
}

const TONE_RING: Record<Tone, string> = {
  bad: "bg-bad-wash text-bad",
  warn: "bg-warn-wash text-warn",
  info: "bg-signal-wash text-signal",
  ok: "bg-ok-wash text-ok",
};

export function AlertsBell({ go }: { go: (view: string) => void }) {
  const { account, automations, telemetry, credits, limits, plan, leads } = useRelo();

  const alerts = useMemo<Alert[]>(() => {
    const list: Alert[] = [];
    const t = telemetry.data;

    if (account && account.daysUntilExpiration <= 7) {
      list.push({
        id: "token",
        tone: account.daysUntilExpiration <= 0 ? "bad" : "warn",
        icon: ShieldAlert,
        title:
          account.daysUntilExpiration <= 0
            ? "Instagram token has expired"
            : `Token expires in ${Math.max(0, account.daysUntilExpiration)} day(s)`,
        body:
          account.daysUntilExpiration <= 0
            ? "DMs cannot send until you reconnect. Automations are kept."
            : "The scheduled refresh usually handles this. Reconnect if the warning persists.",
        action: { label: "Open connection", view: "settings" },
      });
    }

    if (t && t.failed24h > 0) {
      list.push({
        id: "failures",
        tone: t.failed24h > 20 ? "bad" : "warn",
        icon: AlertTriangle,
        title: `${t.failed24h} DM${t.failed24h === 1 ? "" : "s"} failed in the last 24h`,
        body: "Open Insights to see the error code per job before retrying.",
        action: { label: "See failures", view: "insights" },
      });
    }

    if (t && t.pendingJobs > 0) {
      list.push({
        id: "queue",
        tone: "info",
        icon: Clock3,
        title: `${t.pendingJobs} DM${t.pendingJobs === 1 ? "" : "s"} queued`,
        body: "The Worker drains the queue every minute with human-paced jitter.",
      });
    }

    if (credits === 0) {
      list.push({
        id: "credits",
        tone: "warn",
        icon: Sparkles,
        title: "AI credits used up",
        body: `Your ${plan} plan includes ${limits.credits}. Keyword automations keep running; AI replies pause.`,
        action: { label: "Compare plans", view: "settings" },
      });
    }

    const automationCount = automations.data?.length ?? 0;
    if (account && automationCount === 0) {
      list.push({
        id: "setup",
        tone: "info",
        icon: Workflow,
        title: "No automation is listening yet",
        body: "Pick one Reel and one keyword. That is the whole setup.",
        action: { label: "Create one", view: "automations" },
      });
    }

    if (account && leads.leads.length === 0 && (t?.totalComments ?? 0) > 0) {
      list.push({
        id: "no-leads",
        tone: "info",
        icon: CreditCard,
        title: "Comments answered, no leads yet",
        body: "Add a button to your DM card so a reply becomes a click.",
        action: { label: "Open automations", view: "automations" },
      });
    }

    return list;
  }, [account, automations.data, credits, leads.leads.length, limits.credits, plan, telemetry.data]);

  const count = alerts.length;
  const urgent = alerts.some((alert) => alert.tone === "bad");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={
            count > 0 ? `Notifications, ${count} needing attention` : "Notifications, none"
          }
          className="relative grid size-9 place-items-center rounded-lg text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink"
        >
          <Bell className="size-[18px]" strokeWidth={1.8} aria-hidden />
          {count > 0 && (
            <span
              className={cn(
                "absolute right-1 top-1 grid min-w-[16px] place-items-center rounded-full px-1 text-[9.5px] font-bold leading-[15px] text-white ring-2 ring-canvas",
                urgent ? "bg-bad" : "bg-signal"
              )}
            >
              {count > 9 ? "9+" : count}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-[336px] p-0">
        <div className="flex items-center justify-between border-b border-line px-3.5 py-2.5">
          <p className="text-[13px] font-bold text-ink">Needs attention</p>
          <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10.5px] font-semibold text-ink-3">
            {count === 0 ? "All clear" : `${count} open`}
          </span>
        </div>

        {count === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-9 text-center">
            <CheckCircle2 className="size-7 text-ok" aria-hidden />
            <p className="text-[12.5px] font-semibold text-ink">Nothing needs you</p>
            <p className="max-w-[220px] text-[11.5px] leading-relaxed text-ink-3">
              Token, queue and delivery are all healthy. Alerts appear here the moment one
              slips.
            </p>
          </div>
        ) : (
          <ul className="max-h-[340px] overflow-y-auto p-1.5">
            {alerts.map((alert) => {
              const Icon = alert.icon;
              return (
                <li key={alert.id}>
                  <button
                    type="button"
                    onClick={() => alert.action && go(alert.action.view)}
                    className="flex w-full items-start gap-2.5 rounded-lg p-2 text-left transition-colors hover:bg-surface-2"
                  >
                    <span
                      className={cn(
                        "mt-0.5 grid size-6 shrink-0 place-items-center rounded-md",
                        TONE_RING[alert.tone]
                      )}
                    >
                      <Icon className="size-3.5" aria-hidden />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[12.5px] font-semibold leading-snug text-ink">
                        {alert.title}
                      </span>
                      <span className="mt-0.5 block text-[11.5px] leading-relaxed text-ink-3">
                        {alert.body}
                      </span>
                      {alert.action && (
                        <span className="mt-1 inline-block text-[11px] font-bold text-signal">
                          {alert.action.label} →
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
