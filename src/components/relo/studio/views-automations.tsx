"use client";

import React, { useMemo, useState } from "react";
import {
  Plus, Pencil, Trash2, Zap, Search, Download, Copy,
} from "lucide-react";
import { toast } from "sonner";
import { useRelo } from "@/lib/relo/store";
import { fmtNum, timeAgo, uid, type Automation, type TemplateButton } from "@/lib/relo/data";
import { ViewHead, StatusPill, TagInput, Field, inputCls, EmptyState } from "./studio-ui";
import { RButton } from "../chrome";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";

/* ══════════════════════════════════════════════════════════════════════
   AUTOMATIONS
   ═════════════════════════════════════════════════════════════════════ */

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
    pushActivity("system", `Automation ${a.id ? "updated" : "created"} — "${trimmed.templateCard.title}"`);
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
        <RButton onClick={openNew}>
          <Plus className="size-4" /> New automation
        </RButton>
      </ViewHead>

      {automations.length === 0 ? (
        <EmptyState
          title="No automations yet"
          sub="Your first one takes about two minutes — pick your best reel and a keyword your fans already type."
        >
          <RButton onClick={openNew}>
            <Plus className="size-4" /> Create automation
          </RButton>
        </EmptyState>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {automations.map((a) => (
            <article
              key={a.id}
              className="flex flex-col rounded-lg border border-border bg-surface p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span
                    className="h-10 w-10 shrink-0 rounded-lg"
                    style={{ background: `hsl(${a.reelCaption.length * 7 % 360} 42% 32%)` }}
                  />
                  <div className="min-w-0">
                    <p className="line-clamp-2 text-sm leading-snug font-medium">{a.reelCaption}</p>
                  </div>
                </div>
                <button
                  role="switch"
                  aria-checked={a.isActive}
                  aria-label="Toggle automation"
                  onClick={() => toggleAutomation(a.id)}
                  className={cn(
                    "flex h-6 w-11 shrink-0 items-center rounded-full px-0.5 transition-colors",
                    a.isActive ? "bg-ok" : "bg-surface-3"
                  )}
                >
                  <span className="size-5 rounded-full bg-white shadow" />
                </button>
              </div>

              <div className="mt-4 flex flex-wrap gap-1.5">
                {a.triggerKeywords.map((k) => (
                  <span key={k} className="rounded-full bg-surface-3 px-2.5 py-1 font-mono text-[11px] text-text-3">
                    #{k}
                  </span>
                ))}
                <span className="rounded-full bg-accent-wash px-2.5 py-1 font-mono text-[11px] text-accent">
                  {a.commentReplies.length} replies
                </span>
              </div>

              <div className="mt-4 rounded-lg border border-border bg-surface-2 p-3">
                <p className="truncate text-sm font-semibold text-text">{a.templateCard.title || "Untitled card"}</p>
                {a.templateCard.subtitle && (
                  <p className="truncate text-[11px] text-text-3">{a.templateCard.subtitle}</p>
                )}
                <div className="mt-2 space-y-1.5">
                  {a.templateCard.buttons.slice(0, 3).map((b, i) => (
                    <div key={i} className="truncate rounded-md bg-accent px-2.5 py-1.5 text-center text-[11px] font-semibold text-accent-ink">
                      {b.title || "—"}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-4 text-center">
                {[["DMs", fmtNum(a.dmsSent)], ["clicks", fmtNum(a.clicks)], ["today", fmtNum(a.triggersToday)]].map(([l, v], i) => (
                  <div key={i}>
                    <p className="flex items-center justify-center gap-1 text-sm font-bold text-text">
                      {v}
                    </p>
                    <p className="font-mono text-[10px] tracking-wider text-text-3 uppercase">{l}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between">
                <StatusPill status={a.isActive ? "live" : "paused"} />
                <div className="flex gap-1 opacity-70">
                  <button
                    onClick={() => openEdit(a)}
                    className="size-8 shrink-0 place-items-center rounded-md text-text-3 hover:text-text transition-colors"
                    aria-label="Edit automation"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                  <button
                    onClick={() => remove(a)}
                    className="size-8 shrink-0 place-items-center rounded-md text-text-3 hover:text-text transition-colors"
                    aria-label="Delete automation"
                  >
                    <Trash2 className="size-3.5" />
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
      <DialogContent className="max-h-[92vh] overflow-y-auto rounded-lg border-border bg-surface p-0 sm:max-w-2xl">
        <DialogHeader className="sticky top-0 z-10 border-b border-border bg-surface/95 px-6 py-4">
          <DialogTitle className="h4 text-text">{draft.id ? "Edit automation" : "New automation"}</DialogTitle>
          <DialogDescription className="text-xs text-text-3">
            Trigger → replies → card → extras. Everything saves in your demo studio.
          </DialogDescription>
          <div className="mt-3 flex gap-1">
            {steps.map((s, i) => (
              <button
                key={s.label}
                onClick={() => setStep(i)}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium uppercase tracking-wider transition-colors",
                  step === i ? "bg-surface-2 text-text border border-border" : "text-text-3 hover:text-text"
                )}
              >
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
                  {reels.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => set({ reelId: r.id, reelCaption: r.caption })}
                      className={cn(
                        "flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors",
                        draft.reelId === r.id
                          ? "border-accent bg-accent-wash/40"
                          : "border-border bg-surface-2"
                      )}
                    >
                      <span className="h-9 w-9 shrink-0 rounded-md" style={{ background: `hsl(${r.thumbnailHue} 45% 30%)` }} />
                      <span className="line-clamp-2 flex-1 text-sm font-medium">{r.caption}</span>
                      <span className="shrink-0 font-mono text-[11px] text-text-3">{fmtNum(r.commentsCount)} comments</span>
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
              <Field label="Public reply variations" hint={`${draft.commentReplies.length}/8 — at least 3 for anti-spam.`}>
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
                          className="size-9 shrink-0 place-items-center rounded-md text-text-3 hover:text-text"
                          aria-label="Remove variation"
                        >
                          <span className="size-3.5" />
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
                  className="w-full rounded-lg border border-dashed border-border py-2.5 text-sm font-medium text-text-3 hover:text-text transition-colors"
                >
                  + Add variation
                </button>
              )}
              <div className="flex items-start gap-2.5 rounded-lg bg-accent-wash/50 px-4 py-3">
                <span className="mt-0.5 size-4 shrink-0 text-accent" />
                <p className="text-sm leading-relaxed text-text-2">
                  Replies rotate so the same comment never gets the same words twice. RELO then holds a random{" "}
                  <span className="font-semibold">30 to 90 seconds</span> pause before DMing.
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
                  placeholder="The Creator OS — free pack"
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
                <p className="mb-2 caption">Buttons · up to 3</p>
                <div className="space-y-2.5">
                  {draft.templateCard.buttons.map((b, i) => (
                    <div key={i} className="rounded-lg border border-border bg-surface-2 p-3">
                      <div className="flex items-center gap-2">
                        <select
                          value={b.type}
                          onChange={(e) => setBtn(i, { type: e.target.value as TemplateButton["type"] })}
                          className="rounded-md border border-input bg-surface px-2 py-1.5 font-mono text-[11px]"
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
                            className="size-8 shrink-0 place-items-center rounded-md text-text-3 hover:text-text"
                            aria-label="Remove button"
                          >
                            <span className="size-3.5" />
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
                    className="mt-2.5 w-full rounded-lg border border-dashed border-border py-2.5 text-sm font-medium text-text-3 hover:text-text transition-colors"
                  >
                    + Add button
                  </button>
                )}
              </div>
              <div className="rounded-lg bg-surface-2 p-4">
                <p className="caption mb-2">Preview</p>
                <div className="rounded-lg border border-border p-3">
                  <p className="text-sm font-semibold text-text">{draft.templateCard.title || "Your card title"}</p>
                  {draft.templateCard.subtitle && (
                    <p className="font-mono text-[11px] text-text-3">{draft.templateCard.subtitle}</p>
                  )}
                  <div className="mt-2 space-y-1.5">
                    {draft.templateCard.buttons.filter((b) => b.title.trim()).map((b, i) => (
                      <div key={i} className="rounded-md bg-accent px-3 py-1.5 text-center text-[11.5px] font-semibold text-accent-ink">
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
              <div className="flex items-center justify-between rounded-lg border border-border bg-surface-2 px-4 py-3.5">
                <div>
                  <p className="text-sm font-semibold text-text">Follow-gate</p>
                  <p className="text-[11px] text-text-3">DM only lands after they follow you.</p>
                </div>
                <Switch checked={draft.followGateEnabled} onCheckedChange={(followGateEnabled) => set({ followGateEnabled })} />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border bg-surface-2 px-4 py-3.5">
                <div>
                  <p className="text-sm font-semibold text-text">Follow-up DM</p>
                  <p className="text-[11px] text-text-3">Nudge non-clickers once.</p>
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
                    className="w-full accent-accent"
                  />
                  <p className="mt-1 text-right font-mono text-[12px] text-accent">
                    {draft.followUpDelayMinutes} min
                  </p>
                </Field>
              )}
              <div className="flex items-center justify-between rounded-lg border border-border bg-surface-2 px-4 py-3.5">
                <div>
                  <p className="text-sm font-semibold text-text">Arm immediately</p>
                  <p className="text-[11px] text-text-3">Start watching comments on save.</p>
                </div>
                <Switch checked={draft.isActive} onCheckedChange={(isActive) => set({ isActive })} />
              </div>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 flex items-center justify-between border-t border-border bg-surface/95 px-6 py-4">
          <button
            type="button"
            onClick={() => setStep(Math.max(0, step - 1))}
            className={cn("text-sm font-medium text-text-3", step === 0 && "pointer-events-none opacity-0")}
          >
            ← Back
          </button>
          {step < 3 ? (
            <RButton size="sm" onClick={() => setStep(step + 1)}>
              Next <span className="font-mono">→</span>
            </RButton>
          ) : (
            <RButton size="sm" onClick={() => { if (onSave(draft)) { toast.success(draft.id ? "Automation updated." : "Automation armed."); onClose(); } }}>
              {draft.id ? "Save changes" : "Arm automation"}
            </RButton>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   LEADS
   ═════════════════════════════════════════════════════════════════════ */

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
        <div className="relative w-[220px]">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-3" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search @username, email, reel…"
            className="h-10 rounded-lg pl-9 pr-4 border border-input bg-surface-2 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
          />
        </div>
        <RButton variant="ink" size="sm" onClick={exportCsv}>
          <Download className="size-4" /> Export CSV
        </RButton>
      </ViewHead>

      <section className="rounded-lg border border-border bg-surface shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead>
              <tr className="border-b border-border bg-surface-2">
                {["Lead", "Status", "Email", "DMs", "Last seen", "Clicked", ""].map((h) => (
                  <th key={h} className="px-5 py-3.5 caption text-left">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((l, i) => (
                <tr
                  key={l.id}
                  className="group border-b border-border/60 transition-colors last:border-0"
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-surface-2 font-bold text-[11px] text-text">
                        {l.username[0].toUpperCase()}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-text">@{l.username}</p>
                        <p className="max-w-48 truncate font-mono text-[11px] text-text-3">{l.sourceReelCaption}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[10px] uppercase",
                        l.followerStatusAtTrigger ? "bg-ok/10 text-ok" : "bg-surface-3 text-text-3"
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
                          toast.success("Email copied.");
                        }}
                        className="inline-flex items-center gap-1.5 font-mono text-sm text-text-3 hover:text-text transition-colors"
                      >
                        {l.emailCollected}
                        <Copy className="size-3 opacity-50" />
                      </button>
                    ) : (
                      <span className="font-mono text-sm text-text-3">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 font-mono text-sm">{l.totalDmsSent}</td>
                  <td className="px-5 py-3.5 text-sm text-text-3">{timeAgo(l.lastInteractionAt)}</td>
                  <td className="px-5 py-3.5">
                    {l.clickedButton ? (
                      <span className="rounded-md bg-ok/10 px-2.5 py-1 text-[11.5px] font-medium text-ok">
                        {l.clickedButton}
                      </span>
                    ) : (
                      <span className="font-mono text-sm text-text-3">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      onClick={() => {
                        deleteLead(l.id);
                        toast.success(`@${l.username} removed.`);
                      }}
                      className="size-8 shrink-0 place-items-center rounded-md text-text-3 hover:text-text transition-colors"
                      aria-label={`Delete lead ${l.username}`}
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="px-6 py-14 text-center">
              <p className="text-sm font-medium text-text-3">No leads match “{q}”.</p>
              <p className="mt-1 font-mono text-[11px] text-text-3">Try another handle or clear the search.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
