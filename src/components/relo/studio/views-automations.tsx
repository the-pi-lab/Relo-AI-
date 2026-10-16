"use client";

import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  Download,
  Pencil,
  Plus,
  Search,
  Timer,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useRelo } from "@/lib/relo/store";
import { fmtNum, timeAgo, uid, type Automation, type TemplateButton } from "@/lib/relo/data";
import { ViewHead, Panel, StatusPill, TagInput, Field, inputCls, EmptyState } from "./studio-ui";
import { Button, Pill } from "../chrome";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";

/* ══════════════════════════════════════════════════════════════════════
   AUTOMATIONS
   ═════════════════════════════════════════════════════════════════════ */

/* The arm switch. It keeps real switch semantics: role, checked state and a
   label, so assistive tech announces which automations are watching. */
function ArmToggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      aria-label="Toggle automation"
      onClick={onToggle}
      className={cn(
        "flex h-6 w-11 shrink-0 items-center rounded-full border px-0.5 transition-colors duration-150 ease-out",
        on
          ? "border-ok/40 bg-ok"
          : "border-line-strong bg-surface-2 hover:border-ink-3 hover:bg-surface-3"
      )}
    >
      <span
        className={cn(
          "size-5 rounded-full bg-white shadow-[var(--sh-1)] transition-transform duration-150 ease-out",
          on && "translate-x-[18px]"
        )}
      />
    </button>
  );
}

export function AutomationsView() {
  const { automations, reels, deleteAutomation, toggleAutomation, pushActivity, saveAutomation } = useRelo();
  const [editing, setEditing] = useState<Automation | null>(null);
  const [open, setOpen] = useState(false);

  const openNew = () => {
    const reel = reels[0];
    setEditing({
      id: "",
      reelId: reel.id,
      reelCaption: reel.caption,
      triggerKeywords: [],
      commentReplies: ["", "", ""],
      followGateEnabled: false,
      templateCard: { title: "", subtitle: "", buttons: [{ type: "web_url", title: "", url: "" }] },
      isActive: true,
      followUpEnabled: false,
      followUpDelayMinutes: 60,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      triggersToday: 0,
      dmsSent: 0,
      clicks: 0,
    });
    setOpen(true);
  };

  const openEdit = (a: Automation) => {
    setEditing(structuredClone(a));
    setOpen(true);
  };

  const save = (a: Automation) => {
    const trimmed: Automation = {
      ...a,
      id: a.id || uid("auto"),
      commentReplies: a.commentReplies.filter((r) => r.trim()),
      templateCard: {
        ...a.templateCard,
        buttons: a.templateCard.buttons.filter((b) => b.title.trim()),
      },
      updatedAt: Date.now(),
    };
    if (!trimmed.triggerKeywords.length || !trimmed.commentReplies.length || !trimmed.templateCard.title.trim()) {
      toast.error("Give it a keyword, at least one reply, and a card title.");
      return false;
    }
    saveAutomation(trimmed);
    pushActivity("system", `Automation ${a.id ? "updated" : "created"}: "${trimmed.templateCard.title}"`);
    return true;
  };

  const remove = (a: Automation) => {
    deleteAutomation(a.id);
    toast.success("Automation deleted.");
  };

  return (
    <div className="space-y-6">
      <ViewHead
        title="Automations"
        sub="Pick a reel. Arm the keywords. Design the DM card. RELO handles every comment after that."
      >
        <Button onClick={openNew}>
          <Plus className="size-4" strokeWidth={1.75} aria-hidden /> New automation
        </Button>
      </ViewHead>

      {automations.length === 0 ? (
        <EmptyState
          title="No automations yet"
          sub="Your first one takes about two minutes. Pick your best reel and a keyword your fans already type."
        >
          <Button onClick={openNew}>
            <Plus className="size-4" strokeWidth={1.75} aria-hidden /> Create automation
          </Button>
        </EmptyState>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {automations.map((a) => (
            <article
              key={a.id}
              className="flex flex-col rounded-xl border border-line bg-surface p-5 shadow-[var(--sh-1)]"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="line-clamp-2 text-[13.5px] font-semibold leading-snug text-ink">
                  {a.reelCaption}
                </p>
                <ArmToggle on={a.isActive} onToggle={() => toggleAutomation(a.id)} />
              </div>

              <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
                {a.triggerKeywords.map((k) => (
                  <span
                    key={k}
                    className="rounded border border-line bg-surface-2 px-1.5 py-0.5 font-mono text-[11px] text-ink-2"
                  >
                    #{k}
                  </span>
                ))}
                <span className="font-mono text-[11px] text-ink-3 tnum">
                  {a.commentReplies.length} replies
                </span>
              </div>

              <div className="mt-4 rounded-lg border border-line bg-surface-2 p-3">
                <p className="truncate text-[13px] font-semibold text-ink">
                  {a.templateCard.title || "Untitled card"}
                </p>
                {a.templateCard.subtitle && (
                  <p className="truncate text-[11.5px] text-ink-3">{a.templateCard.subtitle}</p>
                )}
                <div className="mt-2.5 space-y-1.5">
                  {a.templateCard.buttons.slice(0, 3).map((b, i) => (
                    <div
                      key={i}
                      className="truncate rounded-md bg-signal px-2.5 py-1.5 text-center text-[11.5px] font-semibold text-signal-ink"
                    >
                      {b.title || "Untitled button"}
                    </div>
                  ))}
                </div>
              </div>

              {/* mt-auto keeps the figures and the actions on one line across the
                  whole row, however long the card title runs. */}
              <div className="mt-auto pt-4">
                <div className="grid grid-cols-3 gap-3 border-t border-line pt-4">
                  {([["DMs", fmtNum(a.dmsSent)], ["Clicks", fmtNum(a.clicks)], ["Today", fmtNum(a.triggersToday)]] as const).map(
                    ([label, value]) => (
                      <div key={label}>
                        <p className="caption">{label}</p>
                        <p className="mt-1 font-mono text-[15px] font-semibold text-ink tnum">{value}</p>
                      </div>
                    )
                  )}
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-4">
                <StatusPill status={a.isActive ? "live" : "paused"} />
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openEdit(a)}
                    className="grid size-8 shrink-0 place-items-center rounded-md text-ink-3 transition-colors duration-150 ease-out hover:bg-surface-2 hover:text-ink"
                    aria-label="Edit automation"
                  >
                    <Pencil className="size-3.5" strokeWidth={1.75} aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(a)}
                    className="grid size-8 shrink-0 place-items-center rounded-md text-ink-3 transition-colors duration-150 ease-out hover:bg-bad-wash hover:text-bad"
                    aria-label="Delete automation"
                  >
                    <Trash2 className="size-3.5" strokeWidth={1.75} aria-hidden />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <AutomationEditor
        draft={editing}
        open={open}
        onClose={() => setOpen(false)}
        onSave={save}
        onChange={setEditing}
      />
    </div>
  );
}

/* ── editor ──────────────────────────────────────────────────────────── */

/* The dialog's close button is a direct child of the content, so the sticky
   header would otherwise paint over it. Lift it clear and give it a hover
   state that is not a fade. */
const DIALOG_CLOSE =
  "[&>[data-slot=dialog-close]]:z-20 [&>[data-slot=dialog-close]]:grid [&>[data-slot=dialog-close]]:size-8 [&>[data-slot=dialog-close]]:place-items-center [&>[data-slot=dialog-close]]:rounded-md [&>[data-slot=dialog-close]]:text-ink-3 [&>[data-slot=dialog-close]]:opacity-100 [&>[data-slot=dialog-close]]:transition-colors [&>[data-slot=dialog-close]]:hover:bg-surface-2 [&>[data-slot=dialog-close]]:hover:text-ink";

function AutomationEditor({
  draft,
  open,
  onClose,
  onSave,
  onChange,
}: {
  draft: Automation | null;
  open: boolean;
  onClose: () => void;
  onSave: (a: Automation) => boolean;
  onChange: (a: Automation) => void;
}) {
  const { reels } = useRelo();
  const [step, setStep] = useState(0);
  if (!draft) return null;
  const set = (patch: Partial<Automation>) => onChange({ ...draft, ...patch });
  const setCard = (patch: Partial<Automation["templateCard"]>) =>
    set({ templateCard: { ...draft.templateCard, ...patch } });
  const setBtn = (i: number, patch: Partial<TemplateButton>) => {
    const buttons = draft.templateCard.buttons.map((b, idx) => (idx === i ? { ...b, ...patch } : b));
    setCard({ buttons });
  };

  const steps = [{ label: "Trigger" }, { label: "Replies" }, { label: "DM card" }, { label: "Extras" }];

  return (
    <Dialog open={open} onOpenChange={(v) => (!v ? onClose() : null)}>
      <DialogContent
        className={cn(
          "max-h-[92vh] gap-0 overflow-y-auto rounded-xl border-line bg-surface p-0 shadow-[var(--sh-3)] sm:max-w-2xl",
          DIALOG_CLOSE
        )}
      >
        <DialogHeader className="sticky top-0 z-10 border-b border-line bg-surface px-6 py-4">
          <DialogTitle className="h4 text-ink">{draft.id ? "Edit automation" : "New automation"}</DialogTitle>
          <DialogDescription className="text-[12.5px] text-ink-3">
            Trigger, replies, card and extras. Everything saves in your demo studio.
          </DialogDescription>
          <div className="mt-3.5 flex gap-1" role="group" aria-label="Automation steps">
            {steps.map((s, i) => (
              <button
                key={s.label}
                type="button"
                aria-current={step === i ? "step" : undefined}
                onClick={() => setStep(i)}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-md border py-1.5 text-[12px] font-medium transition-colors duration-150 ease-out",
                  step === i
                    ? "border-line bg-surface-2 text-ink"
                    : "border-transparent text-ink-3 hover:bg-surface-2 hover:text-ink"
                )}
              >
                <span className="font-mono text-[10px] tnum">{String(i + 1).padStart(2, "0")}</span>
                {s.label}
              </button>
            ))}
          </div>
        </DialogHeader>

        <div className="px-6 py-5">
          {step === 0 && (
            <div className="space-y-5">
              <Field label="Which reel" hint="From your connected account.">
                <div className="grid gap-2">
                  {reels.map((r, i) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => set({ reelId: r.id, reelCaption: r.caption })}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors duration-150 ease-out",
                        draft.reelId === r.id
                          ? "border-line-strong bg-surface-2"
                          : "border-line bg-surface hover:border-line-strong hover:bg-surface-2"
                      )}
                    >
                      <span className="caption shrink-0">R{String(i + 1).padStart(2, "0")}</span>
                      <span className="line-clamp-2 flex-1 text-[13px] font-medium text-ink">{r.caption}</span>
                      <span className="shrink-0 font-mono text-[11px] text-ink-3 tnum">
                        {fmtNum(r.commentsCount)} comments
                      </span>
                      <Check
                        className={cn("size-4 shrink-0 text-signal", draft.reelId === r.id ? "" : "invisible")}
                        strokeWidth={1.75}
                        aria-hidden
                      />
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Trigger keywords" hint="Whole-word match. Enter or comma to add.">
                <TagInput tags={draft.triggerKeywords} onChange={(triggerKeywords) => set({ triggerKeywords })} placeholder="notion, template, send…" />
              </Field>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <Field
                label="Public reply variations"
                hint={`${draft.commentReplies.length}/8, three or more reads less like a bot.`}
              >
                <div className="space-y-2">
                  {draft.commentReplies.map((r, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        value={r}
                        onChange={(e) =>
                          set({ commentReplies: draft.commentReplies.map((x, idx) => (idx === i ? e.target.value : x)) })}
                        placeholder={`variation ${i + 1}`}
                        className={inputCls}
                      />
                      {draft.commentReplies.length > 3 && (
                        <button
                          type="button"
                          onClick={() => set({ commentReplies: draft.commentReplies.filter((_, idx) => idx !== i) })}
                          className="grid size-9 shrink-0 place-items-center rounded-md text-ink-3 transition-colors duration-150 ease-out hover:bg-surface-2 hover:text-bad"
                          aria-label="Remove variation"
                        >
                          <X className="size-3.5" strokeWidth={1.75} aria-hidden />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </Field>
              {draft.commentReplies.length < 8 && (
                <button
                  type="button"
                  onClick={() => set({ commentReplies: [...draft.commentReplies, ""] })}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-line-strong py-2.5 text-[13px] font-medium text-ink-2 transition-colors duration-150 ease-out hover:border-ink-3 hover:bg-surface-2 hover:text-ink"
                >
                  <Plus className="size-3.5" strokeWidth={1.75} aria-hidden /> Add variation
                </button>
              )}
              <div className="flex items-start gap-2.5 rounded-lg border border-line bg-signal-wash px-4 py-3">
                <Timer className="mt-0.5 size-4 shrink-0 text-signal" strokeWidth={1.75} aria-hidden />
                <p className="text-[13px] leading-relaxed text-ink-2">
                  Replies rotate so the same comment never gets the same words twice. RELO then holds a random{" "}
                  <span className="font-semibold text-ink">30 to 90 seconds</span> pause before DMing.
                </p>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <Field label="Card title">
                <input
                  value={draft.templateCard.title}
                  onChange={(e) => setCard({ title: e.target.value })}
                  placeholder="The Creator OS, free pack"
                  className={inputCls}
                />
              </Field>
              <Field label="Subtitle" hint="Optional.">
                <input
                  value={draft.templateCard.subtitle ?? ""}
                  onChange={(e) => setCard({ subtitle: e.target.value })}
                  placeholder="3 templates · No email needed"
                  className={inputCls}
                />
              </Field>
              <div>
                <p className="caption mb-2">Buttons · up to three</p>
                <div className="space-y-2.5">
                  {draft.templateCard.buttons.map((b, i) => (
                    <div key={i} className="rounded-lg border border-line bg-surface-2 p-3">
                      <div className="flex items-center gap-2">
                        <select
                          value={b.type}
                          onChange={(e) => setBtn(i, { type: e.target.value as TemplateButton["type"] })}
                          className="rounded-md border border-line-strong bg-surface px-2 py-1.5 font-mono text-[11px] text-ink outline-none transition-[border-color,box-shadow] duration-150 ease-out focus:border-signal focus:ring-[3px] focus:ring-signal/18"
                          aria-label="Button type"
                        >
                          <option value="web_url">URL</option>
                          <option value="postback">Postback</option>
                          <option value="phone_number">Phone</option>
                        </select>
                        <input
                          value={b.title}
                          onChange={(e) => setBtn(i, { title: e.target.value })}
                          placeholder="Download free pack"
                          className={cn(inputCls, "flex-1 py-1.5")}
                        />
                        {draft.templateCard.buttons.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setCard({ buttons: draft.templateCard.buttons.filter((_, idx) => idx !== i) })}
                            className="grid size-8 shrink-0 place-items-center rounded-md text-ink-3 transition-colors duration-150 ease-out hover:bg-surface-3 hover:text-bad"
                            aria-label="Remove button"
                          >
                            <X className="size-3.5" strokeWidth={1.75} aria-hidden />
                          </button>
                        )}
                      </div>
                      {b.type === "web_url" && (
                        <input
                          value={b.url ?? ""}
                          onChange={(e) => setBtn(i, { url: e.target.value })}
                          placeholder="https://yourshop.in/pack"
                          className={cn(inputCls, "mt-2 py-1.5 font-mono text-[12px]")}
                        />
                      )}
                    </div>
                  ))}
                </div>
                {draft.templateCard.buttons.length < 3 && (
                  <button
                    type="button"
                    onClick={() =>
                      setCard({ buttons: [...draft.templateCard.buttons, { type: "web_url", title: "", url: "" }] })}
                    className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-line-strong py-2.5 text-[13px] font-medium text-ink-2 transition-colors duration-150 ease-out hover:border-ink-3 hover:bg-surface-2 hover:text-ink"
                  >
                    <Plus className="size-3.5" strokeWidth={1.75} aria-hidden /> Add button
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
                    <p className="font-mono text-[11px] text-ink-3">{draft.templateCard.subtitle}</p>
                  )}
                  <div className="mt-2.5 space-y-1.5">
                    {draft.templateCard.buttons.filter((b) => b.title.trim()).map((b, i) => (
                      <div
                        key={i}
                        className="rounded-md bg-signal px-3 py-1.5 text-center text-[11.5px] font-semibold text-signal-ink"
                      >
                        {b.title}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4 rounded-lg border border-line bg-surface-2 px-4 py-3.5">
                <div>
                  <p className="text-[13px] font-semibold text-ink">Follow-gate</p>
                  <p className="text-[12px] text-ink-3">DM only lands after they follow you.</p>
                </div>
                <Switch checked={draft.followGateEnabled} onCheckedChange={(followGateEnabled) => set({ followGateEnabled })} />
              </div>
              <div className="flex items-center justify-between gap-4 rounded-lg border border-line bg-surface-2 px-4 py-3.5">
                <div>
                  <p className="text-[13px] font-semibold text-ink">Follow-up DM</p>
                  <p className="text-[12px] text-ink-3">Nudge non-clickers once.</p>
                </div>
                <Switch checked={draft.followUpEnabled} onCheckedChange={(followUpEnabled) => set({ followUpEnabled })} />
              </div>
              {draft.followUpEnabled && (
                <Field label="Follow-up delay" hint="Minutes.">
                  <input
                    type="range"
                    min={15}
                    max={240}
                    step={15}
                    value={draft.followUpDelayMinutes}
                    onChange={(e) => set({ followUpDelayMinutes: Number(e.target.value) })}
                    className="w-full accent-signal"
                  />
                  <p className="mt-1 text-right font-mono text-[12px] text-signal tnum">
                    {draft.followUpDelayMinutes} min
                  </p>
                </Field>
              )}
              <div className="flex items-center justify-between gap-4 rounded-lg border border-line bg-surface-2 px-4 py-3.5">
                <div>
                  <p className="text-[13px] font-semibold text-ink">Arm immediately</p>
                  <p className="text-[12px] text-ink-3">Start watching comments on save.</p>
                </div>
                <Switch checked={draft.isActive} onCheckedChange={(isActive) => set({ isActive })} />
              </div>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 flex items-center justify-between gap-3 border-t border-line bg-surface px-6 py-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStep(Math.max(0, step - 1))}
            className={cn(step === 0 && "invisible")}
          >
            <ArrowLeft className="size-3.5" strokeWidth={1.75} aria-hidden /> Back
          </Button>
          {step < 3 ? (
            <Button variant="signal" size="sm" onClick={() => setStep(step + 1)}>
              Next <ArrowRight className="size-3.5" strokeWidth={1.75} aria-hidden />
            </Button>
          ) : (
            <Button variant="signal" size="sm" onClick={() => { if (onSave(draft)) { toast.success(draft.id ? "Automation updated." : "Automation armed."); onClose(); } }}>
              {draft.id ? "Save changes" : "Arm automation"}
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

/* A missing value reads as a hairline rather than an em dash, so the column
   stays scannable and the character never appears in the interface. */
function EmptyCell({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center align-middle">
      <span aria-hidden className="block h-px w-4 bg-line-strong" />
      <span className="sr-only">{label}</span>
    </span>
  );
}

export function LeadsView() {
  const { leads, deleteLead } = useRelo();
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return leads;
    return leads.filter(
      (l) =>
        l.username.toLowerCase().includes(needle) ||
        l.emailCollected?.toLowerCase().includes(needle) ||
        l.sourceReelCaption.toLowerCase().includes(needle)
    );
  }, [leads, q]);

  const exportCsv = () => {
    const header = "username,follower_at_trigger,email,dms_sent,first_seen,last_seen,clicked_button,source_reel";
    const rows = filtered.map((l) =>
      [
        l.username,
        l.followerStatusAtTrigger ? "follower" : "non-follower",
        l.emailCollected ?? "",
        l.totalDmsSent,
        new Date(l.firstInteractionAt).toISOString(),
        new Date(l.lastInteractionAt).toISOString(),
        l.clickedButton ?? "",
        `"${l.sourceReelCaption.replace(/"/g, "''")}"`,
      ].join(",")
    );
    const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relo-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filtered.length} leads to CSV.`);
  };

  return (
    <div className="space-y-6">
      <ViewHead
        title="Leads"
        sub={`${leads.length} people raised their hand by commenting. ${leads.filter((l) => l.followerStatusAtTrigger).length} were already followers.`}
      >
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-ink-3"
            strokeWidth={1.75}
            aria-hidden
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search @username, email, reel…"
            aria-label="Search leads"
            className={cn(inputCls, "h-8 w-[240px] py-0 pl-9 pr-3 text-[13px]")}
          />
        </div>
        <Button variant="outline" size="sm" onClick={exportCsv}>
          <Download className="size-3.5" strokeWidth={1.75} aria-hidden /> Export CSV
        </Button>
      </ViewHead>

      <Panel
        title="All leads"
        bodyClassName="p-0"
        actions={
          <span className="caption tnum">
            {filtered.length} of {leads.length}
          </span>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left">
            <thead>
              <tr className="border-b border-line bg-surface-2">
                <th scope="col" className="caption px-5 py-3 font-medium">Lead</th>
                <th scope="col" className="caption px-5 py-3 font-medium">Status</th>
                <th scope="col" className="caption px-5 py-3 font-medium">Email</th>
                <th scope="col" className="caption px-5 py-3 text-right font-medium">DMs</th>
                <th scope="col" className="caption px-5 py-3 text-right font-medium">Last seen</th>
                <th scope="col" className="caption px-5 py-3 font-medium">Clicked</th>
                <th scope="col" className="px-5 py-3 text-right">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.map((l) => (
                <tr key={l.id} className="transition-colors duration-150 ease-out hover:bg-surface-2">
                  <td className="px-5 py-3">
                    <p className="text-[13.5px] font-semibold text-ink">@{l.username}</p>
                    <p className="max-w-56 truncate font-mono text-[11px] text-ink-3">{l.sourceReelCaption}</p>
                  </td>
                  <td className="px-5 py-3">
                    <Pill tone={l.followerStatusAtTrigger ? "ok" : "neutral"}>
                      {l.followerStatusAtTrigger ? "follower" : "new"}
                    </Pill>
                  </td>
                  <td className="px-5 py-3">
                    {l.emailCollected ? (
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard?.writeText(l.emailCollected!);
                          toast.success("Email copied.");
                        }}
                        className="group inline-flex items-center gap-1.5 font-mono text-[12.5px] text-ink-2 transition-colors duration-150 ease-out hover:text-signal"
                      >
                        {l.emailCollected}
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
                  <td className="px-5 py-3 text-right font-mono text-[12.5px] text-ink tnum">{l.totalDmsSent}</td>
                  <td className="px-5 py-3 text-right font-mono text-[12.5px] text-ink-2 tnum">
                    {timeAgo(l.lastInteractionAt)}
                  </td>
                  <td className="px-5 py-3">
                    {l.clickedButton ? <Pill tone="ok">{l.clickedButton}</Pill> : <EmptyCell label="No button clicked" />}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        deleteLead(l.id);
                        toast.success(`@${l.username} removed.`);
                      }}
                      className="grid size-8 shrink-0 place-items-center rounded-md text-ink-3 transition-colors duration-150 ease-out hover:bg-bad-wash hover:text-bad"
                      aria-label={`Delete lead ${l.username}`}
                    >
                      <Trash2 className="size-3.5" strokeWidth={1.75} aria-hidden />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="border-t border-line px-6 py-14 text-center">
              <p className="text-[13.5px] font-medium text-ink-2">No leads match “{q}”.</p>
              <p className="meta mt-1">Try another handle or clear the search.</p>
            </div>
          )}
        </div>
      </Panel>
    </div>
  );
}
