"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  Download,
  Loader2,
  Pencil,
  Plus,
  Search,
  Timer,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { useRelo } from "@/lib/relo/store";
import * as api from "@/lib/relo/api";
import {
  fmtNum,
  timeAgo,
  type Automation,
  type AutomationInput,
  type TemplateButton,
} from "@/lib/relo/data";
import {
  EmptyState,
  ErrorNotice,
  Field,
  LoadingBlock,
  Panel,
  StatusPill,
  TagInput,
  ViewHead,
  inputCls,
} from "./studio-ui";
import { Button, Pill } from "../chrome";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/* ══════════════════════════════════════════════════════════════════════
   AUTOMATIONS
   ═════════════════════════════════════════════════════════════════════ */

const toInput = (automation: Automation): AutomationInput => ({
  id: automation.id,
  accountId: automation.accountId,
  instagramMediaId: automation.instagramMediaId,
  reelPermalink: automation.reelPermalink,
  reelThumbnailUrl: automation.reelThumbnailUrl,
  triggerKeywords: automation.triggerKeywords,
  commentReplies: automation.commentReplies,
  templateCard: automation.templateCard,
  isActive: automation.isActive,
  followUpEnabled: automation.followUpEnabled,
  followUpDelayMinutes: automation.followUpDelayMinutes,
});

function ArmToggle({
  on,
  busy,
  onToggle,
  label,
}: {
  on: boolean;
  busy: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={busy}
      onClick={onToggle}
      className={cn(
        "flex h-6 w-11 shrink-0 items-center rounded-full border px-0.5 transition-colors duration-150 ease-out",
        on
          ? "border-signal bg-signal"
          : "border-line-strong bg-line-strong hover:border-ink-3 hover:bg-surface-3",
        busy && "opacity-60"
      )}
    >
      <span
        className={cn(
          "size-5 rounded-full shadow-[var(--sh-1)] transition-transform duration-150 ease-out",
          on ? "bg-signal-ink" : "bg-ink",
          on && "translate-x-[18px]"
        )}
      />
    </button>
  );
}

export function AutomationsView() {
  const {
    account,
    plan,
    limits,
    automations,
    reels,
    saveAutomation,
    deleteAutomation,
  } = useRelo();

  const [draft, setDraft] = useState<AutomationInput | null>(null);
  const [open, setOpen] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);

  const canCreate = Boolean(account) && (plan !== "free" || !account?.freeReelConsumed);

  const openNew = () => {
    if (!account) return;
    const reel = reels.data[0];
    setDraft({
      accountId: account.id,
      instagramMediaId: reel?.id ?? "",
      reelPermalink: reel?.permalink ?? "",
      reelThumbnailUrl: reel?.thumbnailUrl,
      triggerKeywords: [],
      commentReplies: Array.from({ length: limits.replyMin }, () => ""),
      templateCard: {
        title: "",
        subtitle: "",
        buttons: [{ type: "web_url", title: "", url: "" }],
      },
      isActive: true,
      followUpEnabled: false,
      followUpDelayMinutes: 60,
    });
    setOpen(true);
  };

  const openEdit = (automation: Automation) => {
    setDraft(toInput(automation));
    setOpen(true);
  };

  const toggle = async (automation: Automation) => {
    setToggling(automation.id);
    setActionError(null);
    try {
      await saveAutomation({ ...toInput(automation), isActive: !automation.isActive });
      toast.success(automation.isActive ? "Automation paused" : "Automation armed");
    } catch (caught) {
      setActionError(api.errorMessage(caught));
    } finally {
      setToggling(null);
    }
  };

  const remove = async (automation: Automation) => {
    setActionError(null);
    try {
      await deleteAutomation(automation.id);
      setConfirmDelete(null);
      toast.success("Automation deleted");
    } catch (caught) {
      setActionError(api.errorMessage(caught));
    }
  };

  const reelsUnavailable = reels.error && reels.error.code === "GRAPH_API_ERROR";

  return (
    <div className="space-y-6">
      <ViewHead
        title="Reels & keywords"
        sub="Pick a Reel, choose the words people comment, and design the private reply. RELO answers the comment in public and the DM in private."
      >
        <Button
          variant="signal"
          onClick={openNew}
          disabled={!canCreate || !account}
        >
          <Plus className="size-4" strokeWidth={1.75} aria-hidden />
          New automation
        </Button>
      </ViewHead>

      {plan === "free" && account?.freeReelConsumed && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface/60 px-4 py-3">
          <p className="text-[13px] text-ink-2">
            <span className="font-semibold text-ink">Free tier used.</span> One
            automated Reel per lifetime. Pro makes it unlimited.
          </p>
          <Button variant="outline" size="sm" onClick={() => setShowUpgrade(true)}>
            Compare plans
          </Button>
        </div>
      )}

      {showUpgrade && (
        <div className="rounded-xl border border-signal/30 bg-signal-wash px-4 py-3 text-[13px] text-ink-2">
          Open <span className="font-semibold text-ink">Settings → Billing</span>{" "}
          to move to Pro (₹199/mo) or Studio (₹499/mo).
          <button
            type="button"
            onClick={() => setShowUpgrade(false)}
            className="ml-2 font-semibold text-signal hover:text-signal-hover"
          >
            Dismiss
          </button>
        </div>
      )}

      {reelsUnavailable && (
        <ErrorNotice
          message="Instagram did not return your Reels, so new automations cannot pick a video yet."
          detail={reels.error?.code}
          onRetry={() => void reels.refresh()}
        />
      )}

      {actionError && (
        <ErrorNotice message={actionError} onRetry={() => setActionError(null)} />
      )}

      {automations.loading && automations.data.length === 0 ? (
        <LoadingBlock label="Loading automations" />
      ) : automations.error ? (
        <ErrorNotice
          message={automations.error.message}
          detail={automations.error.code}
          onRetry={() => void automations.refresh()}
        />
      ) : automations.data.length === 0 ? (
        <EmptyState
          title="No automations yet"
          sub="Pick your best Reel and the keyword your audience already types in the comments. The first comment after saving gets an answer."
        >
          <Button variant="signal" onClick={openNew} disabled={!account}>
            <Plus className="size-4" strokeWidth={1.75} aria-hidden />
            Create automation
          </Button>
        </EmptyState>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {automations.data.map((automation) => {
            const clicks = (automation.shortLinks ?? []).reduce(
              (sum, link) => sum + link.clickCount,
              0
            );
            return (
              <article key={automation.id} className="glass-card flex flex-col rounded-2xl p-5">
                <div className="flex items-start justify-between gap-3">
                  <p className="line-clamp-2 text-[13.5px] font-semibold leading-snug text-ink">
                    {automation.reelPermalink
                      ? automation.reelPermalink.replace(/^https?:\/\/(www\.)?instagram\.com\//, "")
                      : automation.instagramMediaId}
                  </p>
                  <ArmToggle
                    on={automation.isActive}
                    busy={toggling === automation.id}
                    onToggle={() => void toggle(automation)}
                    label={`${automation.isActive ? "Pause" : "Arm"} automation`}
                  />
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  {automation.triggerKeywords.slice(0, 5).map((keyword) => (
                    <span
                      key={keyword}
                      className="rounded-md border border-line/70 bg-surface-2/70 px-1.5 py-0.5 font-mono text-[11px] text-ink-2"
                    >
                      #{keyword}
                    </span>
                  ))}
                  {automation.triggerKeywords.length > 5 && (
                    <span className="font-mono text-[11px] text-ink-3">
                      +{automation.triggerKeywords.length - 5}
                    </span>
                  )}
                </div>

                <div className="mt-4 rounded-xl border border-line/70 bg-surface-2/45 p-3">
                  <p className="truncate text-[13px] font-semibold text-ink">
                    {automation.templateCard.title || "Untitled card"}
                  </p>
                  {automation.templateCard.subtitle && (
                    <p className="truncate text-[11.5px] text-ink-3">
                      {automation.templateCard.subtitle}
                    </p>
                  )}
                  <div className="mt-2.5 space-y-1.5">
                    {automation.templateCard.buttons.slice(0, 3).map((button, index) => (
                      <div
                        key={`${button.title}-${index}`}
                        className={cn(
                          "truncate rounded-md px-2.5 py-1.5 text-center text-[11.5px] font-semibold",
                          index === 0
                            ? "bg-signal text-signal-ink"
                            : "border border-line/80 bg-surface/55 text-ink-2"
                        )}
                      >
                        {button.title || "Untitled button"}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-3 border-t border-line pt-4">
                  {[
                    ["Replies", String(automation.commentReplies.length)],
                    ["Clicks", fmtNum(clicks)],
                    ["Updated", timeAgo(automation.updatedAt)],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <p className="caption">{label}</p>
                      <p className="mt-1 truncate font-mono text-[13px] font-semibold text-ink tnum">
                        {value}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-3.5">
                  <StatusPill status={automation.isActive ? "live" : "paused"} />
                  {confirmDelete === automation.id ? (
                    <span className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => void remove(automation)}
                        className="rounded-md bg-bad px-2.5 py-1 text-[11.5px] font-semibold text-bad-ink"
                      >
                        Delete
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(null)}
                        className="rounded-md border border-line px-2.5 py-1 text-[11.5px] font-semibold text-ink-2"
                      >
                        Keep
                      </button>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(automation)}
                        className="grid size-8 place-items-center rounded-md text-ink-3 transition-colors hover:bg-surface-2 hover:text-ink"
                        aria-label="Edit automation"
                      >
                        <Pencil className="size-3.5" strokeWidth={1.75} aria-hidden />
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(automation.id)}
                        className="grid size-8 place-items-center rounded-md text-ink-3 transition-colors hover:bg-bad-wash hover:text-bad"
                        aria-label="Delete automation"
                      >
                        <Trash2 className="size-3.5" strokeWidth={1.75} aria-hidden />
                      </button>
                    </span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      <AutomationEditor
        draft={draft}
        open={open}
        plan={plan}
        limits={limits}
        onClose={() => setOpen(false)}
        onDraftChange={setDraft}
      />
    </div>
  );
}

/* ── editor ──────────────────────────────────────────────────────────── */

const DIALOG_CLOSE =
  "[&>[data-slot=dialog-close]]:z-20 [&>[data-slot=dialog-close]]:grid [&>[data-slot=dialog-close]]:size-8 [&>[data-slot=dialog-close]]:place-items-center [&>[data-slot=dialog-close]]:rounded-md [&>[data-slot=dialog-close]]:text-ink-3 [&>[data-slot=dialog-close]]:opacity-100 [&>[data-slot=dialog-close]]:transition-colors [&>[data-slot=dialog-close]]:hover:bg-surface-2 [&>[data-slot=dialog-close]]:hover:text-ink";

function AutomationEditor({
  draft,
  open,
  plan,
  limits,
  onClose,
  onDraftChange,
}: {
  draft: AutomationInput | null;
  open: boolean;
  plan: "free" | "pro" | "studio";
  limits: ReturnType<typeof useRelo>["limits"];
  onClose: () => void;
  onDraftChange: (draft: AutomationInput) => void;
}) {
  const { reels, saveAutomation } = useRelo();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setStep(0);
      setError(null);
    }
  }, [open]);

  if (!draft) return null;

  const set = (patch: Partial<AutomationInput>) => onDraftChange({ ...draft, ...patch });
  const setCard = (patch: Partial<AutomationInput["templateCard"]>) =>
    set({ templateCard: { ...draft.templateCard, ...patch } });
  const setButton = (index: number, patch: Partial<TemplateButton>) =>
    setCard({
      buttons: draft.templateCard.buttons.map((button, position) =>
        position === index ? { ...button, ...patch } : button
      ),
    });

  const selectedReel = reels.data.find((reel) => reel.id === draft.instagramMediaId);
  const steps = ["Reel", "Replies", "DM card", "Delivery"];

  const validate = (): string | null => {
    if (!draft.instagramMediaId || !draft.reelPermalink) {
      return "Pick the Reel this automation watches.";
    }
    if (draft.triggerKeywords.length === 0) {
      return "Add at least one keyword (use * to match every comment).";
    }
    const replies = draft.commentReplies.map((reply) => reply.trim()).filter(Boolean);
    if (replies.length < limits.replyMin || replies.length > limits.replyMax) {
      return plan === "free"
        ? "The Free tier runs exactly two reply variations."
        : `Use between ${limits.replyMin} and ${limits.replyMax} reply variations.`;
    }
    if (!draft.templateCard.title.trim()) return "Give the DM card a title.";
    if (draft.templateCard.title.trim().length > 80) {
      return "Card titles are limited to 80 characters.";
    }
    if ((draft.templateCard.subtitle ?? "").length > 80) {
      return "Card subtitles are limited to 80 characters.";
    }
    const buttons = draft.templateCard.buttons.filter((button) => button.title.trim());
    if (buttons.length === 0) return "Add at least one button.";
    if (buttons.length > limits.buttons) {
      return plan === "free"
        ? "Free allows two buttons — RELO adds its own branded button after them."
        : "At most three buttons per card.";
    }
    for (const button of buttons) {
      if (button.title.trim().length > 20) {
        return "Button labels are limited to 20 characters.";
      }
      if (button.type === "web_url" && !/^https:\/\/[^\s"'<>]+$/.test(button.url ?? "")) {
        return "URL buttons need an https:// link.";
      }
    }
    return null;
  };

  const submit = async () => {
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await saveAutomation({
        ...draft,
        triggerKeywords: draft.triggerKeywords.map((keyword) => keyword.trim()).filter(Boolean),
        commentReplies: draft.commentReplies.map((reply) => reply.trim()).filter(Boolean),
        templateCard: {
          ...draft.templateCard,
          title: draft.templateCard.title.trim(),
          subtitle: draft.templateCard.subtitle?.trim() || undefined,
          buttons: draft.templateCard.buttons
            .filter((button) => button.title.trim())
            .map((button) => ({
              ...button,
              title: button.title.trim(),
              url: button.url?.trim() || undefined,
            })),
        },
      });
      toast.success(draft.id ? "Automation updated" : "Automation armed");
      onClose();
    } catch (caught) {
      setError(api.errorMessage(caught));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => (!next ? onClose() : undefined)}>
      <DialogContent
        className={cn(
          "max-h-[92vh] gap-0 overflow-y-auto rounded-2xl border-line/60 bg-surface/90 p-0 shadow-[var(--sh-3)] backdrop-blur-2xl sm:max-w-2xl",
          DIALOG_CLOSE
        )}
      >
        <DialogHeader className="sticky top-0 z-10 border-b border-line/60 bg-surface/92 px-5 py-4 backdrop-blur-2xl sm:px-6">
          <DialogTitle className="h4 text-ink">
            {draft.id ? "Edit automation" : "New automation"}
          </DialogTitle>
          <DialogDescription className="text-[12.5px] text-ink-3">
            Saved to your connected account. Nothing is sent until a matching
            comment arrives.
          </DialogDescription>

          <div className="mt-3.5 flex gap-1" role="group" aria-label="Automation steps">
            {steps.map((label, index) => (
              <button
                key={label}
                type="button"
                aria-current={step === index ? "step" : undefined}
                onClick={() => setStep(index)}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 rounded-md border py-1.5 text-[12px] font-medium transition-colors",
                  step === index
                    ? "border-line bg-surface-2 text-ink"
                    : "border-transparent text-ink-3 hover:bg-surface-2 hover:text-ink"
                )}
              >
                <span className="font-mono text-[10px] tnum">
                  {String(index + 1).padStart(2, "0")}
                </span>
                {label}
              </button>
            ))}
          </div>
        </DialogHeader>

        <div className="px-5 py-5 sm:px-6">
          {step === 0 && (
            <div className="space-y-5">
              <Field label="Which Reel" hint="From your connected account.">
                {reels.loading && reels.data.length === 0 ? (
                  <div className="flex items-center gap-2 rounded-lg border border-line px-3 py-6 text-[13px] text-ink-3">
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    Loading your Reels
                  </div>
                ) : reels.error ? (
                  <ErrorNotice
                    message={reels.error.message}
                    detail={reels.error.code}
                    onRetry={() => void reels.refresh()}
                  />
                ) : reels.data.length === 0 ? (
                  <p className="rounded-lg border border-line px-3 py-5 text-[13px] text-ink-3">
                    No Reels were returned for this account. Publish one on
                    Instagram, then refresh.
                  </p>
                ) : (
                  <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                    {reels.data.map((reel, index) => {
                      const active = draft.instagramMediaId === reel.id;
                      return (
                        <button
                          key={reel.id}
                          type="button"
                          onClick={() =>
                            set({
                              instagramMediaId: reel.id,
                              reelPermalink: reel.permalink,
                              reelThumbnailUrl: reel.thumbnailUrl,
                            })
                          }
                          className={cn(
                            "flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors",
                            active
                              ? "border-line-strong bg-surface-2"
                              : "border-line bg-surface hover:border-line-strong hover:bg-surface-2"
                          )}
                        >
                          <span className="caption shrink-0">
                            R{String(index + 1).padStart(2, "0")}
                          </span>
                          <span className="line-clamp-2 flex-1 text-[13px] font-medium text-ink">
                            {reel.caption?.trim() || reel.permalink}
                          </span>
                          {reel.hasActiveAutomation && (
                            <Pill tone="ok" className="shrink-0">
                              automated
                            </Pill>
                          )}
                          <Check
                            className={cn(
                              "size-4 shrink-0 text-signal",
                              active ? "" : "invisible"
                            )}
                            strokeWidth={1.75}
                            aria-hidden
                          />
                        </button>
                      );
                    })}
                  </div>
                )}
              </Field>

              {selectedReel?.hasActiveAutomation && !draft.id && (
                <p className="rounded-lg border border-warn/30 bg-warn-wash px-3 py-2.5 text-[12.5px] text-warn">
                  This Reel already has an automation. A second one can shadow the
                  first, so edit the existing rule instead.
                </p>
              )}

              <Field label="Trigger keywords" hint="Whole-word match. Enter or comma to add.">
                <TagInput
                  tags={draft.triggerKeywords}
                  onChange={(triggerKeywords) => set({ triggerKeywords })}
                  placeholder="price, link, guide…"
                  max={25}
                />
              </Field>
              <p className="text-[12px] leading-relaxed text-ink-3">
                Use <span className="font-mono text-ink-2">*</span> to answer
                every comment on the Reel, not just keyword matches.
              </p>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <Field
                label="Public reply variations"
                hint={`${draft.commentReplies.length} of ${limits.replyMax}`}
              >
                <div className="space-y-2">
                  {draft.commentReplies.map((reply, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        value={reply}
                        onChange={(event) =>
                          set({
                            commentReplies: draft.commentReplies.map((value, position) =>
                              position === index ? event.target.value : value
                            ),
                          })
                        }
                        placeholder={`variation ${index + 1}`}
                        maxLength={600}
                        className={inputCls}
                      />
                      {draft.commentReplies.length > limits.replyMin && (
                        <button
                          type="button"
                          onClick={() =>
                            set({
                              commentReplies: draft.commentReplies.filter(
                                (_, position) => position !== index
                              ),
                            })
                          }
                          className="grid size-9 shrink-0 place-items-center rounded-md text-ink-3 transition-colors hover:bg-surface-2 hover:text-bad"
                          aria-label="Remove variation"
                        >
                          <X className="size-3.5" strokeWidth={1.75} aria-hidden />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </Field>

              {draft.commentReplies.length < limits.replyMax && (
                <button
                  type="button"
                  onClick={() =>
                    set({ commentReplies: [...draft.commentReplies, ""] })
                  }
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-line-strong py-2.5 text-[13px] font-medium text-ink-2 transition-colors hover:border-ink-3 hover:bg-surface-2 hover:text-ink"
                >
                  <Plus className="size-3.5" strokeWidth={1.75} aria-hidden />
                  Add variation
                </button>
              )}

              <div className="flex items-start gap-2.5 rounded-lg border border-line bg-signal-wash px-4 py-3">
                <Timer className="mt-0.5 size-4 shrink-0 text-signal" strokeWidth={1.75} aria-hidden />
                <p className="text-[13px] leading-relaxed text-ink-2">
                  RELO picks a different variation each time and holds a short
                  random pause before the DM so replies do not look robotic.
                </p>
              </div>

              {plan === "free" && (
                <p className="text-[12px] text-ink-3">
                  Free runs exactly two variations. Pro and Studio allow three to
                  eight.
                </p>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <Field label="Card title" hint="Max 80 characters.">
                <input
                  value={draft.templateCard.title}
                  onChange={(event) => setCard({ title: event.target.value })}
                  placeholder="The Creator OS, free pack"
                  maxLength={80}
                  className={inputCls}
                />
              </Field>
              <Field label="Subtitle" hint="Optional.">
                <input
                  value={draft.templateCard.subtitle ?? ""}
                  onChange={(event) => setCard({ subtitle: event.target.value })}
                  placeholder="3 templates · no email needed"
                  maxLength={80}
                  className={inputCls}
                />
              </Field>

              <div>
                <p className="caption mb-2">
                  Buttons · up to {limits.buttons}
                </p>
                <div className="space-y-2.5">
                  {draft.templateCard.buttons.map((button, index) => (
                    <div key={index} className="rounded-lg border border-line bg-surface-2 p-3">
                      <div className="flex items-center gap-2">
                        <select
                          value={button.type}
                          onChange={(event) =>
                            setButton(index, {
                              type: event.target.value as TemplateButton["type"],
                            })
                          }
                          className="rounded-md border border-line-strong bg-surface px-2 py-1.5 font-mono text-[11px] text-ink outline-none focus:border-signal focus:ring-[3px] focus:ring-signal/18"
                          aria-label="Button type"
                        >
                          <option value="web_url">URL</option>
                          <option value="postback">Postback</option>
                          <option value="phone_number">Phone</option>
                        </select>
                        <input
                          value={button.title}
                          onChange={(event) => setButton(index, { title: event.target.value })}
                          placeholder="Download free pack"
                          maxLength={20}
                          className={cn(inputCls, "flex-1 py-1.5")}
                        />
                        {draft.templateCard.buttons.length > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              setCard({
                                buttons: draft.templateCard.buttons.filter(
                                  (_, position) => position !== index
                                ),
                              })
                            }
                            className="grid size-8 shrink-0 place-items-center rounded-md text-ink-3 transition-colors hover:bg-surface-3 hover:text-bad"
                            aria-label="Remove button"
                          >
                            <X className="size-3.5" strokeWidth={1.75} aria-hidden />
                          </button>
                        )}
                      </div>
                      {button.type === "web_url" && (
                        <input
                          value={button.url ?? ""}
                          onChange={(event) => setButton(index, { url: event.target.value })}
                          placeholder="https://yourshop.in/pack"
                          className={cn(inputCls, "mt-2 py-1.5 font-mono text-[12px]")}
                        />
                      )}
                    </div>
                  ))}
                </div>
                {draft.templateCard.buttons.length < limits.buttons && (
                  <button
                    type="button"
                    onClick={() =>
                      setCard({
                        buttons: [
                          ...draft.templateCard.buttons,
                          { type: "web_url", title: "", url: "" },
                        ],
                      })
                    }
                    className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-line-strong py-2.5 text-[13px] font-medium text-ink-2 transition-colors hover:border-ink-3 hover:bg-surface-2 hover:text-ink"
                  >
                    <Plus className="size-3.5" strokeWidth={1.75} aria-hidden />
                    Add button
                  </button>
                )}
              </div>

              <div className="rounded-lg border border-line bg-surface-2 p-4">
                <p className="caption mb-2">Preview</p>
                <div className="rounded-lg border border-line bg-surface p-3">
                  <p className="text-[13px] font-semibold text-ink">
                    {draft.templateCard.title || "Your card title"}
                  </p>
                  {draft.templateCard.subtitle && (
                    <p className="font-mono text-[11px] text-ink-3">
                      {draft.templateCard.subtitle}
                    </p>
                  )}
                  <div className="mt-2.5 space-y-1.5">
                    {draft.templateCard.buttons
                      .filter((button) => button.title.trim())
                      .map((button, index) => (
                        <div
                          key={`${button.title}-${index}`}
                          className={cn(
                            "rounded-md px-3 py-1.5 text-center text-[11.5px] font-semibold",
                            index === 0
                              ? "bg-signal text-signal-ink"
                              : "border border-line bg-surface text-ink-2"
                          )}
                        >
                          {button.title}
                        </div>
                      ))}
                  </div>
                </div>
                <p className="mt-2.5 text-[11.5px] leading-relaxed text-ink-3">
                  {plan === "free"
                    ? "Free adds a branded “Automated by RELO” button after yours."
                    : "Every https:// button gets its own tracked short link."}
                </p>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4 rounded-lg border border-line bg-surface-2 px-4 py-3.5">
                <div>
                  <p className="text-[13px] font-semibold text-ink">Arm now</p>
                  <p className="text-[12px] text-ink-3">
                    Start watching this Reel as soon as you save.
                  </p>
                </div>
                <Switch
                  checked={draft.isActive}
                  onCheckedChange={(isActive) => set({ isActive })}
                />
              </div>

              <div
                className={cn(
                  "flex items-center justify-between gap-4 rounded-lg border border-line bg-surface-2 px-4 py-3.5",
                  !limits.followUps && "opacity-60"
                )}
              >
                <div>
                  <p className="text-[13px] font-semibold text-ink">
                    Follow-up DM
                    {!limits.followUps && (
                      <span className="ml-2 font-mono text-[10px] uppercase text-ink-3">
                        Pro
                      </span>
                    )}
                  </p>
                  <p className="text-[12px] text-ink-3">
                    One extra nudge to people who did not tap.
                  </p>
                </div>
                <Switch
                  checked={draft.followUpEnabled && limits.followUps}
                  disabled={!limits.followUps}
                  onCheckedChange={(followUpEnabled) => set({ followUpEnabled })}
                />
              </div>

              {draft.followUpEnabled && limits.followUps && (
                <Field label="Follow-up delay" hint={`${draft.followUpDelayMinutes} minutes`}>
                  <input
                    type="range"
                    min={5}
                    max={720}
                    step={5}
                    value={draft.followUpDelayMinutes}
                    onChange={(event) =>
                      set({ followUpDelayMinutes: Number(event.target.value) })
                    }
                    className="w-full accent-signal"
                  />
                </Field>
              )}

              <div className="rounded-lg border border-line bg-surface px-4 py-3">
                <p className="caption">Summary</p>
                <dl className="mt-2 space-y-1.5 text-[12.5px]">
                  <div className="flex justify-between gap-3">
                    <dt className="text-ink-3">Reel</dt>
                    <dd className="truncate font-mono text-ink">
                      {draft.reelPermalink.replace(/^https?:\/\//, "") || "—"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-ink-3">Keywords</dt>
                    <dd className="font-mono text-ink">{draft.triggerKeywords.length}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-ink-3">Variations</dt>
                    <dd className="font-mono text-ink">{draft.commentReplies.length}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-ink-3">Buttons</dt>
                    <dd className="font-mono text-ink">
                      {draft.templateCard.buttons.filter((button) => button.title.trim()).length}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          )}

          {error && (
            <p
              role="alert"
              className="mt-4 rounded-lg border border-bad/30 bg-bad-wash px-3.5 py-2.5 text-[12.5px] text-bad"
            >
              {error}
            </p>
          )}
        </div>

        <div className="sticky bottom-0 flex items-center justify-between gap-3 border-t border-line/60 bg-surface/92 px-5 py-4 backdrop-blur-2xl sm:px-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStep(Math.max(0, step - 1))}
            className={cn(step === 0 && "invisible")}
          >
            <ArrowLeft className="size-3.5" strokeWidth={1.75} aria-hidden />
            Back
          </Button>

          {step < 3 ? (
            <Button variant="signal" size="sm" onClick={() => setStep(step + 1)}>
              Next
              <ArrowRight className="size-3.5" strokeWidth={1.75} aria-hidden />
            </Button>
          ) : (
            <Button
              variant="signal"
              size="sm"
              onClick={() => void submit()}
              disabled={saving}
            >
              {saving && <Loader2 className="size-3.5 animate-spin" aria-hidden />}
              {saving ? "Saving" : draft.id ? "Save changes" : "Arm automation"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   LEADS
   ═════════════════════════════════════════════════════════════════════ */

function EmptyCell({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center align-middle">
      <span aria-hidden className="block h-px w-4 bg-line-strong" />
      <span className="sr-only">{label}</span>
    </span>
  );
}

const PAGE_SIZE = 50;

export function LeadsView() {
  const { account, leads, leadsLoading, leadsError, loadLeads } = useRelo();
  const [query, setQuery] = useState("");
  const [offset, setOffset] = useState(0);
  const [exporting, setExporting] = useState(false);
  const lastQuery = useRef("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (lastQuery.current === query) return;
      lastQuery.current = query;
      setOffset(0);
      void loadLeads({ search: query.trim() || undefined, limit: PAGE_SIZE, offset: 0 });
    }, 320);
    return () => window.clearTimeout(timer);
  }, [query, loadLeads]);

  const page = useMemo(() => {
    if (offset === 0) return 1;
    return Math.floor(offset / PAGE_SIZE) + 1;
  }, [offset]);

  const pages = Math.max(1, Math.ceil(leads.total / PAGE_SIZE));

  const exportCsv = async () => {
    if (!account) return;
    setExporting(true);
    try {
      const blob = await api.downloadLeadsCsv(account.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `relo-leads-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("Lead list exported");
    } catch (caught) {
      toast.error(api.errorMessage(caught));
    } finally {
      setExporting(false);
    }
  };

  if (!account) {
    return (
      <EmptyState
        title="No account connected"
        sub="Leads are stored per Instagram account. Connect one and the people who comment will appear here."
      />
    );
  }

  return (
    <div className="space-y-6">
      <ViewHead
        title="Captured leads"
        sub={`${fmtNum(leads.total)} people in this account's list. Every row is someone who commented on an automated Reel.`}
      >
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-ink-3"
            strokeWidth={1.75}
            aria-hidden
          />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search username or email"
            aria-label="Search leads"
            className={cn(inputCls, "h-8 w-[220px] py-0 pl-9 pr-3 text-[13px]")}
          />
        </div>
        <Button variant="outline" size="sm" onClick={() => void exportCsv()} disabled={exporting}>
          <Download className="size-3.5" strokeWidth={1.75} aria-hidden />
          {exporting ? "Exporting" : "Export CSV"}
        </Button>
      </ViewHead>

      {leadsError && (
        <ErrorNotice
          message={leadsError.message}
          detail={leadsError.code}
          onRetry={() => void loadLeads({ search: query.trim() || undefined, limit: PAGE_SIZE, offset })}
        />
      )}

      <Panel
        title="All leads"
        bodyClassName="p-0"
        actions={
          <span className="caption tnum">
            {leadsLoading ? "Loading…" : `${fmtNum(leads.total)} total`}
          </span>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left">
            <thead>
              <tr className="border-b border-line">
                <th scope="col" className="caption px-5 py-3 font-medium">Lead</th>
                <th scope="col" className="caption px-5 py-3 font-medium">Email</th>
                <th scope="col" className="caption px-5 py-3 text-right font-medium">DMs</th>
                <th scope="col" className="caption px-5 py-3 text-right font-medium">First seen</th>
                <th scope="col" className="caption px-5 py-3 text-right font-medium">Last seen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {leads.leads.map((lead) => (
                <tr key={lead.id} className="transition-colors hover:bg-surface-2">
                  <td className="px-5 py-3">
                    <p className="text-[13.5px] font-semibold text-ink">
                      {lead.username ? `@${lead.username}` : "Instagram user"}
                    </p>
                    <p className="max-w-56 truncate font-mono text-[11px] text-ink-3">
                      {lead.instagramScopedId}
                    </p>
                  </td>
                  <td className="px-5 py-3">
                    {lead.emailCollected ? (
                      <button
                        type="button"
                        onClick={() => {
                          void navigator.clipboard?.writeText(lead.emailCollected!);
                          toast.success("Email copied");
                        }}
                        className="group inline-flex items-center gap-1.5 font-mono text-[12.5px] text-ink-2 transition-colors hover:text-signal"
                      >
                        {lead.emailCollected}
                        <Copy
                          className="size-3.5 shrink-0 text-ink-3 transition-colors group-hover:text-signal"
                          strokeWidth={1.75}
                          aria-hidden
                        />
                      </button>
                    ) : (
                      <EmptyCell label="No email collected" />
                    )}
                  </td>
                  <td className="px-5 py-3 text-right font-mono text-[12.5px] text-ink tnum">
                    {lead.totalDmsSent}
                  </td>
                  <td className="px-5 py-3 text-right font-mono text-[12.5px] text-ink-2 tnum">
                    {timeAgo(lead.firstInteractionAt)}
                  </td>
                  <td className="px-5 py-3 text-right font-mono text-[12.5px] text-ink-2 tnum">
                    {timeAgo(lead.lastInteractionAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {leads.leads.length === 0 && !leadsLoading && (
            <div className="border-t border-line px-6 py-14 text-center">
              <p className="text-[13.5px] font-medium text-ink-2">
                {query ? `No leads match “${query}”.` : "No leads yet."}
              </p>
              <p className="meta mt-1">
                {query
                  ? "Try another handle or clear the search."
                  : "The first person to comment a keyword on an active Reel lands here."}
              </p>
            </div>
          )}

          {leadsLoading && leads.leads.length === 0 && (
            <div className="border-t border-line px-6 py-14 text-center text-[13px] text-ink-3">
              Loading leads
            </div>
          )}
        </div>

        {leads.total > PAGE_SIZE && (
          <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-3">
            <span className="font-mono text-[11.5px] text-ink-3">
              Page {page} of {pages}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={offset === 0 || leadsLoading}
                onClick={() => {
                  const next = Math.max(0, offset - PAGE_SIZE);
                  setOffset(next);
                  void loadLeads({
                    search: query.trim() || undefined,
                    limit: PAGE_SIZE,
                    offset: next,
                  });
                }}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={offset + PAGE_SIZE >= leads.total || leadsLoading}
                onClick={() => {
                  const next = offset + PAGE_SIZE;
                  setOffset(next);
                  void loadLeads({
                    search: query.trim() || undefined,
                    limit: PAGE_SIZE,
                    offset: next,
                  });
                }}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Panel>
    </div>
  );
}
