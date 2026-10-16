"use client";

import React, { useState } from "react";
import { CalendarDays, Check, ChevronDown, LogOut, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useRelo } from "@/lib/relo/store";
import { TIER_META, uid, type ContentPlan, type Tier } from "@/lib/relo/data";
import { ViewHead, Panel, Field, inputCls, EmptyState, StatusPill } from "./studio-ui";
import { Button, Pill, Dot } from "../chrome";
import { cn } from "@/lib/utils";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/* ══════════════════════════════════════════════════════════════════════
   CONTENT
   ═════════════════════════════════════════════════════════════════════ */

export function ContentView() {
  const { content, saveContent, moveContent, deleteContent } = useRelo();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<ContentPlan | null>(null);

  const openNew = () => {
    setDraft({ id: "", title: "", hook: "", status: "idea", plannedFor: Date.now() });
    setOpen(true);
  };

  const openEdit = (c: ContentPlan) => {
    setDraft({ ...c });
    setOpen(true);
  };

  const save = () => {
    if (!draft) return;
    if (!draft.title.trim()) {
      toast.error("Give the plan a title.");
      return;
    }
    saveContent({ ...draft, id: draft.id || uid("cp") });
    toast.success(draft.id ? "Plan updated." : "Plan saved.");
    setOpen(false);
  };

  const statuses: { id: ContentPlan["status"]; label: string }[] = [
    { id: "idea", label: "Idea" },
    { id: "drafting", label: "Drafting" },
    { id: "scheduled", label: "Scheduled" },
    { id: "published", label: "Published" },
  ];

  return (
    <div className="space-y-6">
      <ViewHead title="Content" sub="The pipeline from idea to published reel, with its own automation attached.">
        <Button variant="signal" onClick={openNew}>
          <CalendarDays className="size-4" strokeWidth={1.75} /> New plan
        </Button>
      </ViewHead>

      {content.length === 0 ? (
        <EmptyState title="No plans yet" sub="Your first idea lives here. Meta has no publishing API, so RELO holds the idea and date; you publish in Instagram and link the live reel back." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {content.map((c) => (
            <Panel key={c.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="line-clamp-2 text-[13.5px] font-semibold leading-snug text-ink">{c.title}</p>
                  {c.hook && <p className="mt-1 line-clamp-2 text-[12px] leading-snug text-ink-3">{c.hook}</p>}
                </div>
                <StatusPill status={c.status} />
              </div>

              <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-3">
                <span className="caption tnum">
                  {new Date(c.plannedFor).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                </span>
                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => openEdit(c)}
                    className="grid size-7 shrink-0 place-items-center rounded-md text-ink-3 transition-colors hover:bg-surface-2 hover:text-ink"
                    aria-label="Edit"
                  >
                    <Pencil className="size-3.5" strokeWidth={1.75} />
                  </button>
                  <button
                    type="button"
                    onClick={() => { deleteContent(c.id); toast.success("Plan deleted."); }}
                    className="grid size-7 shrink-0 place-items-center rounded-md text-ink-3 transition-colors hover:bg-surface-2 hover:text-bad"
                    aria-label="Delete"
                  >
                    <Trash2 className="size-3.5" strokeWidth={1.75} />
                  </button>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-1.5">
                {statuses.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => moveContent(c.id, s.id)}
                    className={cn(
                      "rounded-md border px-2 py-1.5 text-[10.5px] font-semibold uppercase tracking-wider transition-colors duration-150 ease-out",
                      c.status === s.id
                        ? "border-signal bg-signal text-signal-ink"
                        : "border-line text-ink-3 hover:border-ink-3 hover:bg-surface-2 hover:text-ink"
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </Panel>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] gap-0 overflow-y-auto rounded-xl border-line bg-surface p-0 shadow-[var(--sh-3)] sm:max-w-lg">
          <DialogHeader className="sticky top-0 z-10 border-b border-line bg-surface px-6 py-4">
            <DialogTitle className="h4 text-ink">{draft ? (draft.id ? "Edit plan" : "New plan") : "Plan"}</DialogTitle>
            <DialogDescription className="text-[12.5px] leading-relaxed text-ink-3">RELO holds the idea and date; you publish in Instagram and link the live reel back so conversion can be measured.</DialogDescription>
          </DialogHeader>
          <div className="space-y-5 px-6 py-5">
            <Field label="Title">
              <input value={draft?.title ?? ""} onChange={(e) => setDraft({ ...draft!, title: e.target.value })} placeholder="I automated my DMs for 30 days" className={inputCls} />
            </Field>
            <Field label="Hook" hint="The opening idea.">
              <textarea value={draft?.hook ?? ""} onChange={(e) => setDraft({ ...draft!, hook: e.target.value })} rows={2} className={cn(inputCls, "resize-none")} />
            </Field>
            <Field label="Status">
              <select value={draft?.status ?? "idea"} onChange={(e) => setDraft({ ...draft!, status: e.target.value as ContentPlan["status"] })} className={inputCls}>
                {statuses.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </Field>
            <Field label="Planned for">
              <input type="date" value={draft?.plannedFor ? new Date(draft.plannedFor).toISOString().split("T")[0] : ""} onChange={(e) => setDraft({ ...draft!, plannedFor: new Date(e.target.value).getTime() })} className={inputCls} />
            </Field>
          </div>
          <div className="sticky bottom-0 flex items-center justify-end gap-2 border-t border-line bg-surface px-6 py-4">
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="signal" onClick={save}>{draft?.id ? "Save changes" : "Save plan"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   SETTINGS
   ═════════════════════════════════════════════════════════════════════ */

/* One preference: a label, one line of prose, and the control on the right.
   Rows are separated by hairlines so a group reads as a table of settings. */
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
    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 px-5 py-4">
      <div className="min-w-0">
        <p className="text-[13.5px] font-semibold text-ink">{label}</p>
        <p className="mt-0.5 text-[12.5px] leading-snug text-ink-3">{hint}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">{children}</div>
    </div>
  );
}

export function SettingsView() {
  const { user, plan, aiCredits, signOut, upgradePlan } = useRelo();
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-6">
      <ViewHead title="Settings" sub="Your Instagram connection, the plan you are billed on, and where to sign out.">
        <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
          <LogOut className="size-3.5" strokeWidth={1.75} /> Sign out
        </Button>
      </ViewHead>

      <Panel title="Account" bodyClassName="p-0">
        <div className="divide-y divide-line">
          <SettingRow label="Email" hint={user?.email}>
            <Pill tone={user?.isDemo ? "neutral" : "ok"}>
              <Dot />
              {user?.isDemo ? "Demo" : "Active"}
            </Pill>
          </SettingRow>
          <SettingRow label="Instagram" hint="@aarav.makes, connected">
            <Button
              variant="ghost"
              size="sm"
              className="text-signal hover:bg-signal-wash hover:text-signal-hover"
              onClick={() =>
                toast(
                  "Reconnecting runs through Meta's OAuth screen in production. The demo stays connected."
                )
              }
            >
              Reconnect
            </Button>
          </SettingRow>
        </div>
      </Panel>

      <Panel
        title="Plan and billing"
        actions={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Change plan
                <ChevronDown className="size-3.5" strokeWidth={1.75} aria-hidden />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {(["free", "pro", "studio"] as Tier[]).map((t) => (
                <DropdownMenuItem
                  key={t}
                  onSelect={() => {
                    upgradePlan(t);
                    toast.success(`Switched to the ${TIER_META[t].name} plan.`);
                  }}
                  className="flex items-center justify-between gap-3"
                >
                  <span className="flex items-center gap-2">
                    {t === plan ? (
                      <Check className="size-3.5 text-signal" strokeWidth={2} aria-hidden />
                    ) : (
                      <span className="size-3.5" aria-hidden />
                    )}
                    <span className="text-[13px]">{TIER_META[t].name}</span>
                  </span>
                  <span className="caption">{TIER_META[t].price}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        }
        bodyClassName="p-0"
      >
        <div className="divide-y divide-line">
          <SettingRow label="Current plan" hint="Sets which studio views unlock.">
            <span className="font-mono text-[12.5px] text-ink-2">
              {plan.charAt(0).toUpperCase() + plan.slice(1)}
            </span>
          </SettingRow>
          <SettingRow label="AI credits" hint="Spent when RELO drafts copy and replies.">
            <span className="font-mono text-[12.5px] text-ink-2 tnum">{aiCredits}</span>
          </SettingRow>
        </div>
      </Panel>

      <Panel title="Danger zone" bodyClassName="p-0">
        <SettingRow label="Sign out" hint="Ends this session and clears the demo studio state.">
          <Button variant="destructive" size="sm" onClick={() => signOut()}>
            <LogOut className="size-3.5" strokeWidth={1.75} /> Sign out
          </Button>
        </SettingRow>
      </Panel>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-xl border-line bg-surface p-6 shadow-[var(--sh-3)] sm:max-w-md">
          <DialogTitle className="h4 text-ink">Sign out?</DialogTitle>
          <DialogDescription className="mt-2 text-[13px] leading-relaxed text-ink-2">You will lose your demo studio state. Sign in again to return.</DialogDescription>
          <div className="mt-6 flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => { signOut(); setOpen(false); }}>Sign out</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
