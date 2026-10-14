"use client";

import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Pencil,
  Trash2,
  Zap,
  Search,
  Download,
  Send,
  MousePointerClick,
  UserCheck,
  Timer,
  MessageSquareReply,
  LayoutTemplate,
  X,
  Copy,
} from "lucide-react";
import { toast } from "sonner";
import { useRelo } from "@/lib/relo/store";
import { fmtNum, timeAgo, uid, type Automation, type TemplateButton } from "@/lib/relo/data";
import { ViewHead, StatusPill, TagInput, Field, inputCls, EmptyState } from "./studio-ui";
import { RButton } from "../chrome";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

/* ═══════════════ AUTOMATIONS ═══════════════ */

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
    pushActivity("system", `Automation ${a.id ? "updated" : "created"} — “${trimmed.templateCard.title}”`);
    return true;
  };

  const remove = (a: Automation) => {
    deleteAutomation(a.id);
    toast.success("Automation deleted");
  };

  return (
    <div className="space-y-6">
      <ViewHead
        title="Automations"
        sub="Pick a reel. Arm the keywords. Design the DM card. RELO handles every comment after that."
      >
        <RButton onClick={openNew}>
          <Plus className="size-4" /> New automation
        </RButton>
      </ViewHead>

      {automations.length === 0 ? (
        <EmptyState
          icon={Zap}
          title="No automations yet"
          sub="Your first one takes about two minutes — pick your best reel and a keyword your fans already type."
        >
          <RButton onClick={openNew}>
            <Plus className="size-4" /> Create automation
          </RButton>
        </EmptyState>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {automations.map((a) => (
              <motion.article
                key={a.id}
                layout
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                
                transition={{ type: "spring", stiffness: 280, damping: 24 }}
                className="group flex flex-col rounded-3xl border border-line bg-card p-5 shadow-[var(--shadow-soft)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span
                      className="h-10 w-10 shrink-0 rounded-xl"
                      style={{
                        background: `linear-gradient(135deg, hsl(${a.reelCaption.length * 7 % 360} 42% 32%), hsl(${a.reelCaption.length * 3 % 360} 45% 22%))`,
                      }}
                    />
                    <div className="min-w-0">
                      <p className="line-clamp-2 text-[13px] leading-snug font-medium">{a.reelCaption}</p>
                    </div>
                  </div>
                  <button
                    role="switch"
                    aria-checked={a.isActive}
                    aria-label="Toggle automation"
                    onClick={() => toggleAutomation(a.id)}
                    className={cn(
                      "flex h-6 w-11 shrink-0 items-center rounded-full px-0.5 transition-colors",
                      a.isActive ? "bg-moss" : "bg-ink/15"
                    )}
                  >
                    <motion.span
                      layout
                      className="size-5 rounded-full bg-white shadow"
                      animate={{ x: a.isActive ? 20 : 0 }}
                      transition={{ type: "spring", stiffness: 400, damping: 28 }}
                    />
                  </button>
                </div>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {a.triggerKeywords.map((k) => (
                    <span key={k} className="rounded-full bg-ink/5 px-2.5 py-1 font-mono text-[11px] text-ink-3">
                      #{k}
                    </span>
                  ))}
                  <span className="rounded-full bg-ember-wash px-2.5 py-1 font-mono text-[11px] text-ember-deep">
                    {a.commentReplies.length} replies
                  </span>
                </div>

                {/* mini card preview */}
                <div className="mt-4 rounded-2xl border border-line bg-card-soft p-3">
                  <p className="truncate text-[12.5px] font-semibold">{a.templateCard.title || "Untitled card"}</p>
                  {a.templateCard.subtitle && (
                    <p className="truncate font-mono text-[10px] text-ink-4">{a.templateCard.subtitle}</p>
                  )}
                  <div className="mt-2 space-y-1.5">
                    {a.templateCard.buttons.slice(0, 3).map((b, i) => (
                      <div
                        key={i}
                        className="truncate on-ember rounded-lg bg-ember/90 px-2.5 py-1.5 text-center text-[11px] font-medium"
                      >
                        {b.title || "—"}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 border-t border-line pt-4 text-center">
                  {[
                    [Send, fmtNum(a.dmsSent), "DMs"],
                    [MousePointerClick, fmtNum(a.clicks), "clicks"],
                    [Zap, fmtNum(a.triggersToday), "today"],
                  ].map(([Icon, v, l], i) => {
                    const I = Icon as typeof Send;
                    return (
                      <div key={i}>
                        <p className="flex items-center justify-center gap-1 font-display text-[15px] font-bold">
                          <I className="size-3 text-ink-4" /> {v as string}
                        </p>
                        <p className="font-mono text-[9.5px] tracking-wider text-ink-4 uppercase">{l as string}</p>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <StatusPill status={a.isActive ? "live" : "paused"} pulse={a.isActive} />
                  <div className="flex gap-1 opacity-70 transition-opacity ">
                    <button
                      onClick={() => openEdit(a)}
                      className="grid size-8 place-items-center rounded-lg text-ink-3 transition-colors "
                      aria-label="Edit automation"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <button
                      onClick={() => remove(a)}
                      className="grid size-8 place-items-center rounded-lg text-ink-3 transition-colors "
                      aria-label="Delete automation"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
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

  const steps = [
    { icon: Zap, label: "Trigger" },
    { icon: MessageSquareReply, label: "Replies" },
    { icon: LayoutTemplate, label: "DM card" },
    { icon: UserCheck, label: "Extras" },
  ];

  return (
    <Dialog open={open} onOpenChange={(v) => (!v ? onClose() : null)}>
      <DialogContent className="max-h-[92vh] overflow-y-auto rounded-[24px] border-line bg-card p-0 sm:max-w-2xl">
        <DialogHeader className="sticky top-0 z-10 border-b border-line bg-card/95 px-6 py-4 backdrop-blur">
          <DialogTitle className="font-display text-lg font-bold">
            {draft.id ? "Edit automation" : "New automation"}
          </DialogTitle>
          <DialogDescription className="text-[12.5px] text-ink-3">
            Trigger → replies → card → extras. Everything saves in your demo studio.
          </DialogDescription>
          {/* step rail */}
          <div className="mt-3 flex gap-1.5">
            {steps.map((s, i) => (
              <button
                key={s.label}
                onClick={() => setStep(i)}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 rounded-full py-1.5 font-mono text-[10px] tracking-wider uppercase transition-colors",
                  step === i ? "bg-ink text-night" : "bg-ink/5 text-ink-4 "
                )}
              >
                <s.icon className="size-3" /> {s.label}
              </button>
            ))}
          </div>
        </DialogHeader>

        <div className="px-6 py-5">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div key="s0" {...stepAnim} className="space-y-5">
                <Field label="Which reel?" hint="from your connected account">
                  <div className="grid gap-2">
                    {reels.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => set({ reelId: r.id, reelCaption: r.caption })}
                        className={cn(
                          "flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-all",
                          draft.reelId === r.id
                            ? "border-ember/60 bg-ember-wash shadow-[var(--shadow-soft)]"
                            : "border-line bg-card-soft "
                        )}
                      >
                        <span
                          className="h-9 w-9 shrink-0 rounded-lg"
                          style={{ background: `hsl(${r.thumbnailHue} 45% 30%)` }}
                        />
                        <span className="line-clamp-2 flex-1 text-[13px] font-medium">{r.caption}</span>
                        <span className="shrink-0 font-mono text-[10px] text-ink-4">{fmtNum(r.commentsCount)} 💬</span>
                      </button>
                    ))}
                  </div>
                </Field>
                <Field label="Trigger keywords" hint="whole-word · enter or comma to add">
                  <TagInput
                    tags={draft.triggerKeywords}
                    onChange={(triggerKeywords) => set({ triggerKeywords })}
                    placeholder="notion, template, send…"
                  />
                </Field>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div key="s1" {...stepAnim} className="space-y-4">
                <Field
                  label="Public reply variations"
                  hint={`${draft.commentReplies.length}/8 — min 3 for anti-spam`}
                >
                  <div className="space-y-2">
                    {draft.commentReplies.map((r, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input
                          value={r}
                          onChange={(e) =>
                            set({
                              commentReplies: draft.commentReplies.map((x, idx) => (idx === i ? e.target.value : x)),
                            })
                          }
                          placeholder={`variation ${i + 1} — “Just sent it 📬”`}
                          className={inputCls}
                        />
                        {draft.commentReplies.length > 3 && (
                          <button
                            type="button"
                            onClick={() =>
                              set({ commentReplies: draft.commentReplies.filter((_, idx) => idx !== i) })
                            }
                            className="grid size-9 shrink-0 place-items-center rounded-xl text-ink-4 "
                            aria-label="Remove variation"
                          >
                            <X className="size-4" />
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
                    className="w-full rounded-xl border border-dashed border-line-strong py-2.5 text-[13px] font-medium text-ink-3 transition-colors "
                  >
                    + add variation
                  </button>
                )}
                <div className="flex items-start gap-2.5 rounded-2xl bg-honey/10 px-4 py-3">
                  <Timer className="mt-0.5 size-4 shrink-0 text-honey" />
                  <p className="text-[12.5px] leading-relaxed text-ink-3">
                    Replies rotate so the same comment never gets the same words twice. RELO then holds a random{" "}
                    <span className="font-semibold">30–90s</span> pause before DMing.
                  </p>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="s2" {...stepAnim} className="space-y-4">
                <Field label="Card title">
                  <input
                    value={draft.templateCard.title}
                    onChange={(e) => setCard({ title: e.target.value })}
                    placeholder="The Creator OS — free pack"
                    className={inputCls}
                  />
                </Field>
                <Field label="Subtitle" hint="optional">
                  <input
                    value={draft.templateCard.subtitle ?? ""}
                    onChange={(e) => setCard({ subtitle: e.target.value })}
                    placeholder="3 templates · No email needed"
                    className={inputCls}
                  />
                </Field>
                <div>
                  <p className="mb-2 font-mono text-[10.5px] tracking-[0.18em] text-ink-3 uppercase">
                    Buttons · up to 3
                  </p>
                  <div className="space-y-2.5">
                    {draft.templateCard.buttons.map((b, i) => (
                      <div key={i} className="rounded-2xl border border-line bg-card-soft p-3">
                        <div className="flex items-center gap-2">
                          <select
                            value={b.type}
                            onChange={(e) => setBtn(i, { type: e.target.value as TemplateButton["type"] })}
                            className="rounded-lg border border-line-strong bg-card px-2 py-1.5 font-mono text-[11px]"
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
                              className="grid size-8 shrink-0 place-items-center rounded-lg text-ink-4 "
                              aria-label="Remove button"
                            >
                              <X className="size-4" />
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
                        setCard({ buttons: [...draft.templateCard.buttons, { type: "web_url", title: "", url: "" }] })
                      }
                      className="mt-2.5 w-full rounded-xl border border-dashed border-line-strong py-2.5 text-[13px] font-medium text-ink-3 transition-colors "
                    >
                      + add button
                    </button>
                  )}
                </div>
                {/* live preview */}
                <div className="rounded-2xl bg-night p-4 text-bone">
                  <p className="font-mono text-[9px] tracking-[0.24em] text-bone-dim uppercase">preview</p>
                  <div className="mt-2.5 rounded-xl bg-ink/5 p-3">
                    <p className="text-[13px] font-semibold">{draft.templateCard.title || "Your card title"}</p>
                    {draft.templateCard.subtitle && (
                      <p className="font-mono text-[10px] text-bone-dim">{draft.templateCard.subtitle}</p>
                    )}
                    <div className="mt-2 space-y-1.5">
                      {draft.templateCard.buttons.filter((b) => b.title.trim()).map((b, i) => (
                        <div key={i} className="rounded-lg bg-ember px-3 py-1.5 text-center text-[11.5px] font-medium">
                          {b.title}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="s3" {...stepAnim} className="space-y-4">
                <div className="flex items-center justify-between rounded-2xl border border-line bg-card-soft px-4 py-3.5">
                  <div>
                    <p className="text-[13.5px] font-semibold">Follow-gate</p>
                    <p className="mt-0.5 text-[12px] text-ink-3">DM only lands after they follow you</p>
                  </div>
                  <Switch
                    checked={draft.followGateEnabled}
                    onCheckedChange={(followGateEnabled) => set({ followGateEnabled })}
                  />
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-line bg-card-soft px-4 py-3.5">
                  <div>
                    <p className="text-[13.5px] font-semibold">Follow-up DM</p>
                    <p className="mt-0.5 text-[12px] text-ink-3">Nudge non-clickers once</p>
                  </div>
                  <Switch
                    checked={draft.followUpEnabled}
                    onCheckedChange={(followUpEnabled) => set({ followUpEnabled })}
                  />
                </div>
                {draft.followUpEnabled && (
                  <Field label="Follow-up delay" hint="minutes">
                    <input
                      type="range"
                      min={15}
                      max={240}
                      step={15}
                      value={draft.followUpDelayMinutes}
                      onChange={(e) => set({ followUpDelayMinutes: Number(e.target.value) })}
                      className="w-full accent-[var(--ember)]"
                    />
                    <p className="mt-1 text-right font-mono text-[12px] text-ember">
                      {draft.followUpDelayMinutes} min
                    </p>
                  </Field>
                )}
                <div className="flex items-center justify-between rounded-2xl border border-line bg-card-soft px-4 py-3.5">
                  <div>
                    <p className="text-[13.5px] font-semibold">Arm immediately</p>
                    <p className="mt-0.5 text-[12px] text-ink-3">Start watching comments on save</p>
                  </div>
                  <Switch checked={draft.isActive} onCheckedChange={(isActive) => set({ isActive })} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="sticky bottom-0 flex items-center justify-between border-t border-line bg-card/95 px-6 py-4 backdrop-blur">
          <button
            type="button"
            onClick={() => setStep(Math.max(0, step - 1))}
            className={cn(
              "text-[13px] font-medium text-ink-3 ",
              step === 0 && "pointer-events-none opacity-0"
            )}
          >
            ← Back
          </button>
          {step < 3 ? (
            <RButton size="sm" onClick={() => setStep(step + 1)}>
              Next <span className="font-mono">→</span>
            </RButton>
          ) : (
            <RButton
              size="sm"
              onClick={() => {
                if (onSave(draft)) {
                  toast.success(draft.id ? "Automation updated" : "Automation armed ⚡");
                  onClose();
                }
              }}
            >
              {draft.id ? "Save changes" : "Arm automation"} <Zap className="size-3.5" />
            </RButton>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

const stepAnim = {
  initial: { opacity: 0, x: 22 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -22 },
  transition: { duration: 0.3, ease: [0.22, 1, 0.28, 1] as const },
};

/* ═══════════════ LEADS ═══════════════ */

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
    a.download = `relo-leads-aarav-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filtered.length} leads to CSV`);
  };

  return (
    <div className="space-y-6">
      <ViewHead
        title="Leads"
        sub={`${leads.length} people raised their hand by commenting. ${leads.filter((l) => l.followerStatusAtTrigger).length} were already followers.`}
      >
        <div className="relative">
          <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-4" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search @username, email, reel…"
            className="h-10 w-56 rounded-full border border-line-strong bg-card pl-10 pr-4 text-[13px] outline-none transition-all focus:w-64 focus:border-ember/60 focus:shadow-[0_0_0_4px_rgba(139,128,249,0.08)]"
          />
        </div>
        <RButton variant="ink" size="sm" onClick={exportCsv}>
          <Download className="size-4" /> Export CSV
        </RButton>
      </ViewHead>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-3xl border border-line bg-card shadow-[var(--shadow-soft)]"
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead>
              <tr className="border-b border-line bg-card-soft">
                {["Lead", "Status", "Email", "DMs", "Last seen", "Clicked", ""].map((h) => (
                  <th key={h} className="px-5 py-3.5 font-mono text-[10px] font-medium tracking-[0.16em] text-ink-3 uppercase">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {filtered.map((l, i) => (
                  <motion.tr
                    key={l.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -24 }}
                    transition={{ delay: i * 0.02 }}
                    className="group border-b border-line/60 transition-colors last:border-0 "
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-gradient-to-tr from-ink/70 to-ink font-display text-[11px] font-bold text-bone">
                          {l.username[0].toUpperCase()}
                        </span>
                        <div>
                          <p className="text-[13.5px] font-semibold">@{l.username}</p>
                          <p className="max-w-52 truncate font-mono text-[10px] text-ink-4">{l.sourceReelCaption}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[10px] uppercase",
                          l.followerStatusAtTrigger ? "bg-moss/12 text-moss" : "bg-sky/12 text-[#4a6b82]"
                        )}
                      >
                        {l.followerStatusAtTrigger ? "follower" : "new"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {l.emailCollected ? (
                        <button
                          onClick={() => {
                            navigator.clipboard?.writeText(l.emailCollected!);
                            toast.success("Email copied");
                          }}
                          className="group/email inline-flex items-center gap-1.5 font-mono text-[12px] text-ink-3 "
                        >
                          {l.emailCollected}
                          <Copy className="size-3 opacity-45" />
                        </button>
                      ) : (
                        <span className="font-mono text-[12px] text-ink-4">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-[13px]">{l.totalDmsSent}</td>
                    <td className="px-5 py-3.5 font-mono text-[12px] text-ink-3">{timeAgo(l.lastInteractionAt)}</td>
                    <td className="px-5 py-3.5">
                      {l.clickedButton ? (
                        <span className="rounded-lg bg-moss/12 px-2.5 py-1 text-[11.5px] font-medium text-moss">
                          {l.clickedButton}
                        </span>
                      ) : (
                        <span className="font-mono text-[12px] text-ink-4">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => {
                          deleteLead(l.id);
                          toast.success(`@${l.username} removed`);
                        }}
                        className="grid size-8 place-items-center rounded-lg text-ink-4"
                        aria-label={`Delete lead ${l.username}`}
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="px-6 py-14 text-center">
              <p className="text-[14px] font-medium text-ink-3">No leads match “{q}”.</p>
              <p className="mt-1 font-mono text-[11px] text-ink-4">try another handle or clear the search</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
