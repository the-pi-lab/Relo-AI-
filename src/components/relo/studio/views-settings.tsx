"use client";

import React, { useEffect, useState } from "react";
import {
  CalendarDays,
  CreditCard,
  ExternalLink,
  Loader2,
  LogOut,
  Pencil,
  Plus,
  RefreshCw,
  ShieldAlert,
  Trash2,
  Unplug,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

import { useRelo } from "@/lib/relo/store";
import * as api from "@/lib/relo/api";
import {
  dayInputValue,
  fmtDate,
  timeAgo,
  toMs,
  type ContentPlan,
  type ContentPlanInput,
  type ContentStatus,
} from "@/lib/relo/data";
import { isMetaConfigured } from "@/lib/relo/config";
import {
  EmptyState,
  ErrorNotice,
  Field,
  LoadingBlock,
  LockedNotice,
  Panel,
  StatusPill,
  ViewHead,
  inputCls,
} from "./studio-ui";
import { Button, Dot, Pill } from "../chrome";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/* ══════════════════════════════════════════════════════════════════════
   CONTENT PLANNER
   ═════════════════════════════════════════════════════════════════════ */

const STATUSES: Array<{ id: ContentStatus; label: string }> = [
  { id: "idea", label: "Idea" },
  { id: "drafting", label: "Drafting" },
  { id: "scheduled", label: "Scheduled" },
  { id: "published", label: "Published" },
];

const plannedSeconds = (day: string): number => {
  const ms = day ? new Date(`${day}T09:00:00`).getTime() : Date.now();
  return Math.floor((Number.isFinite(ms) ? ms : Date.now()) / 1000);
};

interface PlanDraft {
  id?: string;
  title: string;
  hook: string;
  caption: string;
  status: ContentStatus;
  plannedFor: number;
  automationId: string;
}

const emptyPlan = (): PlanDraft => ({
  title: "",
  hook: "",
  caption: "",
  status: "idea",
  plannedFor: Date.now(),
  automationId: "",
});

export function ContentView() {
  const {
    plan,
    limits,
    content,
    automations,
    reels,
    saveContentPlan,
    publishPlan,
    deleteContentPlan,
  } = useRelo();

  const [draft, setDraft] = useState<PlanDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [publishing, setPublishing] = useState<ContentPlan | null>(null);
  const [mediaChoice, setMediaChoice] = useState("");

  useEffect(() => {
    if (draft === null) setError(null);
  }, [draft]);

  if (!limits.campaigns) {
    return (
      <LockedNotice
        feature="Content planner"
        plan={plan}
        message="Plan the Reel before you post it, then link it back to its automation. The planner is part of Pro and Studio."
        onUpgrade={() => {
          window.location.hash = "#/studio/settings";
        }}
      />
    );
  }

  const openNew = () => {
    setDraft(emptyPlan());
    setError(null);
  };

  const openEdit = (item: ContentPlan) => {
    setDraft({
      id: item.id,
      title: item.title,
      hook: item.hook ?? "",
      caption: item.caption ?? "",
      status: item.status,
      plannedFor: toMs(item.plannedFor) || Date.now(),
      automationId: item.automationId ?? "",
    });
    setError(null);
  };

  const submit = async () => {
    if (!draft) return;
    if (!draft.title.trim()) {
      setError("Give the plan a working title.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const input: ContentPlanInput = {
        id: draft.id,
        title: draft.title.trim(),
        hook: draft.hook.trim() || undefined,
        caption: draft.caption.trim() || undefined,
        status: draft.status,
        plannedFor: Math.floor(draft.plannedFor / 1000),
        automationId: draft.automationId || undefined,
      };
      await saveContentPlan(input);
      toast.success(draft.id ? "Plan updated" : "Plan saved");
      setDraft(null);
    } catch (caught) {
      setError(api.errorMessage(caught));
    } finally {
      setSaving(false);
    }
  };

  const move = async (item: ContentPlan, status: ContentStatus) => {
    if (item.status === status) return;
    try {
      await saveContentPlan({
        id: item.id,
        title: item.title,
        hook: item.hook,
        caption: item.caption,
        plannedFor: item.plannedFor,
        automationId: item.automationId,
        status,
      });
      toast.success(`Moved to ${status}`);
    } catch (caught) {
      toast.error(api.errorMessage(caught));
    }
  };

  const remove = async (item: ContentPlan) => {
    try {
      await deleteContentPlan(item.id);
      setConfirmDelete(null);
      toast.success("Plan deleted");
    } catch (caught) {
      toast.error(api.errorMessage(caught));
    }
  };

  const publish = async () => {
    if (!publishing || !mediaChoice) return;
    try {
      await publishPlan(publishing.id, mediaChoice);
      toast.success("Linked to the Reel", {
        description: "The plan now points at the live media and its automation.",
      });
      setPublishing(null);
      setMediaChoice("");
    } catch (caught) {
      toast.error(api.errorMessage(caught));
    }
  };

  const stats = content.data.stats;
  const plans = content.data.plans;

  const linkedReel = (item: ContentPlan) =>
    item.instagramMediaId
      ? reels.data.find((reel) => reel.id === item.instagramMediaId)
      : undefined;

  return (
    <div className="space-y-6">
      <ViewHead
        title="Content"
        sub="The pipeline from idea to published Reel. RELO does not post for you — Meta has no publishing API for third parties — so you publish in Instagram and link the live Reel back here."
      >
        <Button variant="signal" onClick={openNew}>
          <CalendarDays className="size-4" strokeWidth={1.75} aria-hidden />
          New plan
        </Button>
      </ViewHead>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {STATUSES.map((status) => (
          <div key={status.id} className="glass-card rounded-xl px-4 py-3">
            <p className="caption">{status.label}</p>
            <p className="mt-2 font-mono text-[22px] font-bold leading-none text-ink tnum">
              {stats[status.id]}
            </p>
          </div>
        ))}
      </div>

      {content.loading && plans.length === 0 ? (
        <LoadingBlock label="Loading your plans" />
      ) : content.error ? (
        <ErrorNotice
          message={content.error.message}
          detail={content.error.code}
          onRetry={() => void content.refresh()}
        />
      ) : plans.length === 0 ? (
        <EmptyState
          title="No plans yet"
          sub="Write the hook before you write the Reel. A plan holds the working title, the opening line and the date you intend to post."
        >
          <Button variant="signal" onClick={openNew}>
            <Plus className="size-4" strokeWidth={1.75} aria-hidden />
            Plan the first Reel
          </Button>
        </EmptyState>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {plans.map((item) => {
            const reel = linkedReel(item);
            return (
              <article key={item.id} className="glass-card flex flex-col rounded-2xl p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="line-clamp-2 text-[14px] font-semibold leading-5 text-ink">
                      {item.title}
                    </h3>
                    {item.hook && (
                      <p className="mt-1 line-clamp-2 text-[12px] leading-snug text-ink-3">
                        {item.hook}
                      </p>
                    )}
                  </div>
                  <StatusPill status={item.status} />
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-line pt-3 text-[11.5px] text-ink-3">
                  <span className="font-mono tnum">{fmtDate(item.plannedFor)}</span>
                  {item.instagramMediaId ? (
                    reel ? (
                      <a
                        href={reel.permalink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-semibold text-signal hover:text-signal-hover"
                      >
                        Live Reel
                        <ExternalLink className="size-3" aria-hidden />
                      </a>
                    ) : (
                      <span className="font-mono">Media linked</span>
                    )
                  ) : (
                    <span>Not linked to a Reel</span>
                  )}
                </div>

                <div className="mt-3 flex flex-1 items-end">
                  <div
                    className="grid w-full grid-cols-4 gap-0.5 overflow-hidden rounded-lg border border-line bg-surface-2 p-0.5"
                    role="group"
                    aria-label="Move plan to stage"
                  >
                    {STATUSES.map((status) => (
                      <button
                        key={status.id}
                        type="button"
                        onClick={() => void move(item, status.id)}
                        aria-pressed={item.status === status.id}
                        className={cn(
                          "min-w-0 overflow-hidden rounded-md px-1 py-1.5 text-[9.5px] font-semibold uppercase tracking-[0.06em] transition-colors duration-150",
                          item.status === status.id
                            ? "bg-signal text-signal-ink"
                            : "text-ink-3 hover:bg-surface-3 hover:text-ink"
                        )}
                      >
                        <span className="block truncate">{status.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between gap-2 border-t border-line pt-3">
                  {item.status !== "published" ? (
                    <button
                      type="button"
                      onClick={() => {
                        setPublishing(item);
                        setMediaChoice("");
                      }}
                      className="inline-flex items-center gap-1 text-[12px] font-semibold text-signal hover:text-signal-hover"
                    >
                      Link the live Reel
                      <ExternalLink className="size-3" aria-hidden />
                    </button>
                  ) : (
                    <span className="text-[11.5px] text-ink-3">
                      Updated {timeAgo(item.updatedAt)}
                    </span>
                  )}

                  <div className="flex items-center gap-0.5">
                    {confirmDelete === item.id ? (
                      <>
                        <button
                          type="button"
                          onClick={() => void remove(item)}
                          className="rounded-md bg-bad px-2 py-1 text-[11px] font-semibold text-bad-ink"
                        >
                          Delete
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDelete(null)}
                          className="rounded-md border border-line px-2 py-1 text-[11px] font-semibold text-ink-2"
                        >
                          Keep
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => openEdit(item)}
                          aria-label={`Edit ${item.title}`}
                          className="grid size-7 place-items-center rounded-md text-ink-3 transition-colors hover:bg-surface-2 hover:text-ink"
                        >
                          <Pencil className="size-3.5" strokeWidth={1.75} aria-hidden />
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDelete(item.id)}
                          aria-label={`Delete ${item.title}`}
                          className="grid size-7 place-items-center rounded-md text-ink-3 transition-colors hover:bg-bad-wash hover:text-bad"
                        >
                          <Trash2 className="size-3.5" strokeWidth={1.75} aria-hidden />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* create / edit */}
      <Dialog open={draft !== null} onOpenChange={(open) => (!open ? setDraft(null) : undefined)}>
        <DialogContent className="max-h-[90vh] gap-0 overflow-y-auto rounded-2xl border-line/60 bg-surface/95 p-0 shadow-[var(--sh-3)] backdrop-blur-2xl sm:max-w-lg">
          <DialogHeader className="border-b border-line/60 px-5 py-4">
            <DialogTitle className="h4 text-ink">
              {draft?.id ? "Edit plan" : "New plan"}
            </DialogTitle>
            <DialogDescription className="text-[12.5px] text-ink-3">
              The idea, the opening line and the day you intend to post.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 px-5 py-5">
            <Field label="Working title" hint="Max 120 characters">
              <input
                value={draft?.title ?? ""}
                onChange={(event) =>
                  setDraft((current) =>
                    current
                      ? { ...current, title: event.target.value.slice(0, 120) }
                      : current
                  )
                }
                placeholder="I automated my DMs for 30 days"
                className={inputCls}
              />
            </Field>

            <Field label="Hook" hint="The first line on screen">
              <textarea
                value={draft?.hook ?? ""}
                onChange={(event) =>
                  setDraft((current) =>
                    current
                      ? { ...current, hook: event.target.value.slice(0, 300) }
                      : current
                  )
                }
                rows={2}
                placeholder="Nobody reads their DMs. Mine answer back."
                className={cn(inputCls, "resize-none")}
              />
            </Field>

            <Field label="Caption" hint="Optional, 2,200 characters">
              <textarea
                value={draft?.caption ?? ""}
                onChange={(event) =>
                  setDraft((current) =>
                    current
                      ? { ...current, caption: event.target.value.slice(0, 2200) }
                      : current
                  )
                }
                rows={3}
                className={cn(inputCls, "resize-none")}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Stage">
                <select
                  value={draft?.status ?? "idea"}
                  onChange={(event) =>
                    setDraft((current) =>
                      current
                        ? { ...current, status: event.target.value as ContentStatus }
                        : current
                    )
                  }
                  className={inputCls}
                >
                  {STATUSES.map((status) => (
                    <option key={status.id} value={status.id}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Post on">
                <input
                  type="date"
                  value={draft ? dayInputValue(draft.plannedFor) : ""}
                  onChange={(event) =>
                    setDraft((current) =>
                      current
                        ? { ...current, plannedFor: plannedSeconds(event.target.value) * 1000 }
                        : current
                    )
                  }
                  className={cn(inputCls, "tnum")}
                />
              </Field>
            </div>

            <Field label="Automation" hint="Optional">
              <select
                value={draft?.automationId ?? ""}
                onChange={(event) =>
                  setDraft((current) =>
                    current ? { ...current, automationId: event.target.value } : current
                  )
                }
                className={inputCls}
              >
                <option value="">Not attached yet</option>
                {automations.data.map((automation) => (
                  <option key={automation.id} value={automation.id}>
                    {automation.triggerKeywords.join(", ") || automation.reelPermalink}
                  </option>
                ))}
              </select>
            </Field>

            {error && (
              <p
                role="alert"
                className="rounded-lg border border-bad/30 bg-bad-wash px-3.5 py-2.5 text-[12.5px] text-bad"
              >
                {error}
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-line/60 px-5 py-4">
            <Button variant="outline" onClick={() => setDraft(null)}>
              Cancel
            </Button>
            <Button variant="signal" onClick={() => void submit()} disabled={saving}>
              {saving && <Loader2 className="size-3.5 animate-spin" aria-hidden />}
              {saving ? "Saving" : draft?.id ? "Save changes" : "Save plan"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* link a live Reel */}
      <Dialog
        open={publishing !== null}
        onOpenChange={(open) => (!open ? setPublishing(null) : undefined)}
      >
        <DialogContent className="rounded-2xl border-line/60 bg-surface/95 p-0 shadow-[var(--sh-3)] backdrop-blur-2xl sm:max-w-md">
          <DialogHeader className="border-b border-line/60 px-5 py-4">
            <DialogTitle className="h4 text-ink">Link the live Reel</DialogTitle>
            <DialogDescription className="text-[12.5px] leading-relaxed text-ink-3">
              Pick the Reel you posted. Only Reels on this account can be linked.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 px-5 py-5">
            <Field label="Reel">
              <select
                value={mediaChoice}
                onChange={(event) => setMediaChoice(event.target.value)}
                className={inputCls}
              >
                <option value="">Select a Reel</option>
                {reels.data.map((reel) => (
                  <option key={reel.id} value={reel.id}>
                    {reel.caption?.slice(0, 56) || reel.permalink}
                  </option>
                ))}
              </select>
            </Field>
            {reels.data.length === 0 && (
              <p className="text-[12px] leading-relaxed text-ink-3">
                No Reels found for this account yet. RELO reads them from Meta, so
                reconnect if you posted recently.
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-line/60 px-5 py-4">
            <Button variant="outline" onClick={() => setPublishing(null)}>
              Cancel
            </Button>
            <Button variant="signal" onClick={() => void publish()} disabled={!mediaChoice}>
              Link Reel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   SETTINGS
   ═════════════════════════════════════════════════════════════════════ */

const PLAN_OFFER: Record<"pro" | "studio", { name: string; price: number; blurb: string }> = {
  pro: { name: "Pro", price: 199, blurb: "Unlimited Reels, DMs, broadcasts and the planner." },
  studio: { name: "Studio", price: 499, blurb: "Three accounts, the canvas and 5,000 credits." },
};

function SettingRow({
  label,
  hint,
  children,
}: {
  label: string;
  hint: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 px-5 py-4">
      <div className="min-w-0">
        <p className="text-[13.5px] font-semibold text-ink">{label}</p>
        <p className="mt-0.5 text-[12.5px] leading-snug text-ink-3">{hint}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">{children}</div>
    </div>
  );
}

const expiryTone = (days: number) =>
  days <= 0 ? "bad" : days <= 7 ? "warn" : "ok";

export function SettingsView() {
  const {
    user,
    accounts,
    account,
    plan,
    limits,
    credits,
    accountsLoading,
    accountsError,
    refreshAccounts,
    disconnectAccount,
    billing,
    billingLoading,
    billingError,
    refreshBilling,
    submitUpi,
    signOut,
  } = useRelo();

  const [confirmDisconnect, setConfirmDisconnect] = useState<string | null>(null);
  const [upgradeTo, setUpgradeTo] = useState<"pro" | "studio">("pro");
  const [utr, setUtr] = useState("");
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [signOutOpen, setSignOutOpen] = useState(false);

  const metaReady = isMetaConfigured();
  const atAccountLimit = accounts.length >= limits.maxAccounts;

  const connect = () => {
    if (!metaReady) {
      toast.error("Instagram sign-in is not configured for this build.");
      return;
    }
    // The callback page finishes the exchange and returns to Settings.
    api.beginMetaOAuth();
  };

  const recordUpi = async () => {
    const reference = utr.trim().toUpperCase();
    if (!/^[A-Z0-9]{8,30}$/.test(reference)) {
      setPayError("Enter the UPI reference (UTR): 8 to 30 letters or digits.");
      return;
    }
    setPaying(true);
    setPayError(null);
    try {
      const message = await submitUpi(upgradeTo, reference);
      setUtr("");
      toast.success("Payment recorded", { description: message });
    } catch (caught) {
      setPayError(api.errorMessage(caught));
    } finally {
      setPaying(false);
    }
  };

  const payments = billing?.payments ?? [];
  const upiId = billing?.checkout.upiId ?? null;
  const cardUrl = billing?.checkout.lemonSqueezyUrl ?? null;

  return (
    <div className="space-y-6">
      <ViewHead
        title="Settings"
        sub="Your Instagram connection, the plan you are billed on, and where to sign out."
      >
        <Button variant="outline" size="sm" onClick={() => void refreshAccounts()}>
          <RefreshCw
            className={cn("size-3.5", accountsLoading && "animate-spin")}
            strokeWidth={1.75}
            aria-hidden
          />
          Refresh
        </Button>
        <Button variant="outline" size="sm" onClick={() => setSignOutOpen(true)}>
          <LogOut className="size-3.5" strokeWidth={1.75} aria-hidden />
          Sign out
        </Button>
      </ViewHead>

      <Panel
        title="Instagram"
        actions={
          <Button
            variant="signal"
            size="sm"
            onClick={connect}
            disabled={!metaReady || atAccountLimit}
          >
            <Plus className="size-3.5" strokeWidth={1.75} aria-hidden />
            Connect account
          </Button>
        }
        bodyClassName="p-0"
      >
        {accountsError && (
          <div className="px-5 py-4">
            <ErrorNotice
              message={accountsError.message}
              detail={accountsError.code}
              onRetry={() => void refreshAccounts()}
            />
          </div>
        )}

        {!metaReady && (
          <div className="flex gap-2.5 border-b border-line bg-warn-wash px-5 py-3 text-[12.5px] leading-relaxed text-warn">
            <ShieldAlert className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} aria-hidden />
            <p>
              This build has no Meta app id. Set{" "}
              <code className="font-mono">NEXT_PUBLIC_META_APP_ID</code> and{" "}
              <code className="font-mono">NEXT_PUBLIC_META_REDIRECT_URI</code>, then
              redeploy to enable Instagram sign-in.
            </p>
          </div>
        )}

        {accounts.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-[14px] font-semibold text-ink">No Instagram account yet</p>
            <p className="mx-auto mt-1.5 max-w-sm text-[12.5px] leading-relaxed text-ink-3">
              Connect the account that owns the Page your Reels are published from.
              RELO only asks for comment and message permissions.
            </p>
            <Button
              variant="signal"
              className="mt-5"
              onClick={connect}
              disabled={!metaReady}
            >
              <Plus className="size-4" strokeWidth={1.75} aria-hidden />
              Connect Instagram
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-line">
            {accounts.map((item) => {
              const days = item.daysUntilExpiration;
              const tone = expiryTone(days);
              return (
                <div key={item.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
                  <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-full border border-line bg-surface-2 text-[13px] font-bold text-ink-2">
                    {item.profilePictureUrl ? (
                      <img
                        src={item.profilePictureUrl}
                        alt=""
                        className="size-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      item.username.slice(0, 1).toUpperCase()
                    )}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 text-[13.5px] font-semibold text-ink">
                      @{item.username}
                      {account?.id === item.id && (
                        <span className="rounded border border-line bg-surface-2 px-1.5 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.1em] text-ink-3">
                          active
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 text-[12px] text-ink-3">
                      {item.plan === "free" ? "Free" : item.plan === "pro" ? "Pro" : "Studio"} ·{" "}
                      {item.aiCreditsRemaining.toLocaleString()} credits ·{" "}
                      {item.isActive ? "connection healthy" : "connection paused"}
                    </p>
                  </div>

                  <Pill tone={tone}>
                    <Dot />
                    {days <= 0
                      ? "Token expired"
                      : days === 1
                        ? "1 day left"
                        : `${days} days left`}
                  </Pill>

                  <div className="flex items-center gap-1.5">
                    <Button variant="ghost" size="sm" onClick={connect}>
                      <RefreshCw className="size-3.5" strokeWidth={1.75} aria-hidden />
                      Reconnect
                    </Button>
                    {confirmDisconnect === item.id ? (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            void disconnectAccount(item.id)
                              .then(() => {
                                toast.success(`@${item.username} disconnected`);
                                setConfirmDisconnect(null);
                              })
                              .catch((caught) => toast.error(api.errorMessage(caught)));
                          }}
                          className="rounded-md bg-bad px-2.5 py-1.5 text-[11.5px] font-semibold text-bad-ink"
                        >
                          Disconnect
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDisconnect(null)}
                          className="rounded-md border border-line px-2.5 py-1.5 text-[11.5px] font-semibold text-ink-2"
                        >
                          Keep
                        </button>
                      </>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setConfirmDisconnect(item.id)}
                        className="text-bad hover:bg-bad-wash hover:text-bad"
                      >
                        <Unplug className="size-3.5" strokeWidth={1.75} aria-hidden />
                        Disconnect
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line bg-surface-2/40 px-5 py-2.5 text-[11.5px] text-ink-3">
          <span>
            {accounts.length} of {limits.maxAccounts}{" "}
            {limits.maxAccounts === 1 ? "account" : "accounts"} on this plan
          </span>
          {atAccountLimit && (
            <span className="text-ink-2">
              {plan === "free"
                ? "Pro adds campaigns and the bio page."
                : "Studio allows three accounts."}
            </span>
          )}
        </div>
      </Panel>

      <Panel
        title="Plan and billing"
        actions={
          <span className="inline-flex items-center gap-1.5">
            <Zap className="size-3.5 text-signal" strokeWidth={1.75} aria-hidden />
            <span className="caption tnum">{credits.toLocaleString()} AI credits</span>
          </span>
        }
        bodyClassName="p-0"
      >
        <div className="divide-y divide-line">
          <SettingRow
            label="Current plan"
            hint="Sets which studio views unlock and how many credits reset each month."
          >
            <span className="font-mono text-[12.5px] text-ink-2">
              {plan === "free" ? "Free" : plan === "pro" ? "Pro · ₹199/mo" : "Studio · ₹499/mo"}
            </span>
          </SettingRow>
        </div>

        <div className="grid gap-3 border-t border-line p-5 sm:grid-cols-2">
          {(Object.keys(PLAN_OFFER) as Array<"pro" | "studio">).map((tier) => {
            const offer = PLAN_OFFER[tier];
            const isCurrent = plan === tier;
            return (
              <div
                key={tier}
                className={cn(
                  "rounded-xl border p-4 transition-colors",
                  isCurrent
                    ? "border-signal bg-signal-wash"
                    : "border-line bg-surface-2/40"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[13.5px] font-semibold text-ink">{offer.name}</p>
                  <span className="font-mono text-[13px] font-semibold text-ink tnum">
                    ₹{offer.price}
                    <span className="text-[11px] font-normal text-ink-3">/mo</span>
                  </span>
                </div>
                <p className="mt-1.5 text-[12px] leading-relaxed text-ink-3">
                  {offer.blurb}
                </p>
                <button
                  type="button"
                  onClick={() => setUpgradeTo(tier)}
                  aria-pressed={upgradeTo === tier}
                  className={cn(
                    "mt-3 w-full rounded-md border px-3 py-1.5 text-[12px] font-semibold transition-colors",
                    upgradeTo === tier
                      ? "border-signal bg-surface text-signal"
                      : "border-line-strong bg-surface text-ink-2 hover:border-ink-3 hover:text-ink"
                  )}
                >
                  {isCurrent ? "Current plan — renew" : `Choose ${offer.name}`}
                </button>
              </div>
            );
          })}
        </div>

        <div className="space-y-4 border-t border-line p-5">
          {billingError && (
            <ErrorNotice
              message={billingError.message}
              detail={billingError.code}
              onRetry={() => void refreshBilling()}
            />
          )}

          {billingLoading && !billing ? (
            <LoadingBlock label="Loading payment options" />
          ) : upiId ? (
            <>
              <div className="rounded-xl border border-line bg-surface-2/50 p-4">
                <p className="text-[13px] font-semibold text-ink">
                  Pay ₹{PLAN_OFFER[upgradeTo].price} by UPI
                </p>
                <p className="mt-1 text-[12px] leading-relaxed text-ink-3">
                  Send the amount to <span className="font-mono text-ink-2">{upiId}</span>{" "}
                  and paste the transaction reference below. Access is switched on
                  after the payment is checked, usually within a few hours.
                </p>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <input
                    value={utr}
                    onChange={(event) => {
                      setUtr(event.target.value.toUpperCase());
                      setPayError(null);
                    }}
                    placeholder="UTR / transaction reference"
                    aria-label="UPI transaction reference"
                    className={cn(inputCls, "font-mono text-[12.5px] uppercase sm:flex-1")}
                  />
                  <Button
                    variant="signal"
                    onClick={() => void recordUpi()}
                    disabled={paying}
                  >
                    {paying ? (
                      <Loader2 className="size-3.5 animate-spin" aria-hidden />
                    ) : (
                      <CreditCard className="size-3.5" strokeWidth={1.75} aria-hidden />
                    )}
                    I have paid
                  </Button>
                </div>
                {payError && (
                  <p role="alert" className="mt-2 text-[12px] text-bad">
                    {payError}
                  </p>
                )}
              </div>

              {cardUrl && (
                <a
                  href={cardUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-signal hover:text-signal-hover"
                >
                  Pay by card instead
                  <ExternalLink className="size-3" aria-hidden />
                </a>
              )}
            </>
          ) : (
            <p className="text-[12.5px] leading-relaxed text-ink-3">
              No payment method is configured on the server yet. Set{" "}
              <code className="font-mono">MANUAL_UPI_ID</code> or{" "}
              <code className="font-mono">LEMON_SQUEEZY_CHECKOUT_URL</code> on the
              Worker to collect payments.
            </p>
          )}

          <div>
            <p className="caption mb-2">Payment history</p>
            {payments.length === 0 ? (
              <p className="text-[12.5px] text-ink-3">No payments recorded yet.</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-line">
                <table className="w-full text-left text-[12px]">
                  <thead className="bg-surface-2/60 text-ink-3">
                    <tr>
                      <th className="px-3 py-2 font-semibold">Date</th>
                      <th className="px-3 py-2 font-semibold">Plan</th>
                      <th className="px-3 py-2 font-semibold">Amount</th>
                      <th className="px-3 py-2 font-semibold">Reference</th>
                      <th className="px-3 py-2 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {payments.map((payment) => (
                      <tr key={payment.id}>
                        <td className="whitespace-nowrap px-3 py-2 text-ink-2">
                          {fmtDate(payment.created_at)}
                        </td>
                        <td className="px-3 py-2 capitalize text-ink-2">{payment.plan}</td>
                        <td className="whitespace-nowrap px-3 py-2 font-mono text-ink tnum">
                          ₹{payment.amount_inr}
                        </td>
                        <td className="max-w-[160px] truncate px-3 py-2 font-mono text-[11px] text-ink-3">
                          {payment.utr ?? "—"}
                        </td>
                        <td className="px-3 py-2">
                          <StatusPill status={payment.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </Panel>

      <Panel title="Account" bodyClassName="p-0">
        <div className="divide-y divide-line">
          <SettingRow label="Email" hint={user?.email ?? "—"}>
            <Pill tone="ok">
              <Dot />
              Signed in
            </Pill>
          </SettingRow>
          <SettingRow
            label="Sign out"
            hint="Ends this session on this device. Your data stays on your account."
          >
            <Button variant="destructive" size="sm" onClick={() => setSignOutOpen(true)}>
              <LogOut className="size-3.5" strokeWidth={1.75} aria-hidden />
              Sign out
            </Button>
          </SettingRow>
        </div>
      </Panel>

      <Dialog open={signOutOpen} onOpenChange={setSignOutOpen}>
        <DialogContent className="rounded-2xl border-line/60 bg-surface/95 p-6 shadow-[var(--sh-3)] backdrop-blur-2xl sm:max-w-md">
          <DialogTitle className="h4 text-ink">Sign out?</DialogTitle>
          <DialogDescription className="mt-2 text-[13px] leading-relaxed text-ink-2">
            Your automations keep running. You will need a new email code to sign
            back in.
          </DialogDescription>
          <div className="mt-6 flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setSignOutOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setSignOutOpen(false);
                signOut();
              }}
            >
              Sign out
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
