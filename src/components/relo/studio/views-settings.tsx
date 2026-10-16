"use client";

import React, { useState } from "react";
import { CalendarDays, Mail, Play } from "lucide-react";
import { toast } from "sonner";
import { useRelo } from "@/lib/relo/store";
import { uid, type ContentPlan } from "@/lib/relo/data";
import { ViewHead, Field, inputCls, EmptyState, StatusPill } from "./studio-ui";
import { RButton } from "../chrome";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";

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
      <ViewHead title="Content" sub="The pipeline from idea to published reel — with its own automation attached.">
        <RButton onClick={openNew}>
          <CalendarDays className="size-4" /> New plan
        </RButton>
      </ViewHead>

      {content.length === 0 ? (
        <EmptyState title="No plans yet" sub="Your first idea lives here. Meta has no publishing API, so RELO holds the idea and date; you publish in Instagram and link the live reel back." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {content.map((c) => (
            <article key={c.id} className="rounded-lg border border-border bg-surface p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text line-clamp-2">{c.title}</p>
                  {c.hook && <p className="text-[11px] text-text-3 line-clamp-2">{c.hook}</p>}
                </div>
                <StatusPill status={c.status} />
              </div>
              <div className="mt-4 flex items-center justify-between text-xs text-text-3">
                <span>{new Date(c.plannedFor).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(c)} className="size-7 shrink-0 place-items-center rounded-md text-text-3 hover:text-text transition-colors" aria-label="Edit">
                    <span className="size-3.5" />
                  </button>
                  <button onClick={() => { deleteContent(c.id); toast.success("Plan deleted."); }} className="size-7 shrink-0 place-items-center rounded-md text-text-3 hover:text-text transition-colors" aria-label="Delete">
                    <span className="size-3.5" />
                  </button>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                {statuses.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => moveContent(c.id, s.id)}
                    className={cn(
                      "flex-1 rounded-md px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider transition-colors",
                      c.status === s.id ? "bg-accent text-accent-ink" : "border border-border text-text-3 hover:text-text"
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-lg border-border bg-surface p-0 sm:max-w-lg">
          <DialogHeader className="sticky top-0 z-10 border-b border-border bg-surface/95 px-6 py-4">
            <DialogTitle className="h4 text-text">{draft ? (draft.id ? "Edit plan" : "New plan") : "Plan"}</DialogTitle>
            <DialogDescription className="text-xs text-text-3">RELO holds the idea and date; you publish in Instagram and link the live reel back so conversion can be measured.</DialogDescription>
          </DialogHeader>
          <div className="px-6 py-5 space-y-5">
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
          <div className="sticky bottom-0 flex items-center justify-between border-t border-border bg-surface/95 px-6 py-4">
            <button type="button" onClick={() => setOpen(false)} className="text-sm font-medium text-text-3">Cancel</button>
            <RButton onClick={save}>{draft?.id ? "Save changes" : "Save plan"}</RButton>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   SETTINGS
   ══════════════════════════════════════════════════════════════════════ */

export function SettingsView() {
  const { user, plan, aiCredits, signOut } = useRelo();
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-6">
      <ViewHead title="Settings" sub="Connection, plan, referrals — the important drawer.">
        <RButton variant="outline" size="sm" onClick={() => setOpen(true)}>
          <span className="text-accent">Sign out</span>
        </RButton>
      </ViewHead>

      <section className="rounded-lg border border-border bg-surface p-5 sm:p-6 shadow-sm">
        <h3 className="h4 text-text mb-5">Account</h3>
        <div className="space-y-5">
          <div className="flex items-center justify-between rounded-lg border border-border bg-surface-2 p-3.5">
            <div>
              <p className="text-sm font-semibold text-text">Email</p>
              <p className="text-xs text-text-3">{user?.email}</p>
            </div>
            <span className="font-mono text-xs text-text-3">{user?.isDemo ? "Demo" : "Active"}</span>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border bg-surface-2 p-3.5">
            <div>
              <p className="text-sm font-semibold text-text">Instagram</p>
              <p className="text-xs text-text-3">@aarav.makes · connected</p>
            </div>
            <button className="text-xs font-semibold text-accent hover:text-accent-hover">Reconnect</button>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-border bg-surface p-5 sm:p-6 shadow-sm">
        <h3 className="h4 text-text mb-5">Plan & billing</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-border bg-surface-2 p-3.5">
            <div>
              <p className="text-sm font-semibold text-text">Current plan</p>
              <p className="text-xs text-text-3">{plan.charAt(0).toUpperCase() + plan.slice(1)}</p>
            </div>
            <span className="font-mono text-xs text-text-3">{aiCredits} AI credits</span>
          </div>
          <RButton className="w-full" onClick={() => {}}>
            Change plan
          </RButton>
        </div>
      </section>

      <section className="rounded-lg border border-border bg-surface p-5 sm:p-6 shadow-sm">
        <h3 className="h4 text-text mb-5">Danger zone</h3>
        <div className="space-y-3">
          <RButton variant="destructive" size="sm" onClick={() => signOut()}>
            <LogOutIcon /> Sign out
          </RButton>
        </div>
      </section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-lg border-border bg-surface p-6 sm:max-w-md">
          <DialogTitle className="h4 text-text">Sign out?</DialogTitle>
          <DialogDescription className="text-sm text-text-2 mt-2">You will lose your demo studio state. Sign in again to return.</DialogDescription>
          <div className="mt-6 flex gap-3">
            <button onClick={() => setOpen(false)} className="flex-1 rounded-lg border border-border bg-surface-2 py-2.5 text-sm font-medium text-text-3 hover:text-text transition-colors">Cancel</button>
            <RButton variant="ink" size="sm" onClick={() => { signOut(); setOpen(false); }}>Sign out</RButton>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function LogOutIcon() {
  return (
    <svg className="size-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  );
}
