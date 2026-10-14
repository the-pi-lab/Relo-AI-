"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  ArrowLeft,
  ArrowRight,
  Trash2,
  CalendarDays,
  Settings2,
  Instagram,
  RefreshCw,
  Copy,
  CreditCard,
  Gift,
  ShieldAlert,
  Sparkles,
  BellRing,
  Smartphone,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { useRelo } from "@/lib/relo/store";
import { TIER_META, uid, type ContentPlan, type ContentStatus, type Tier } from "@/lib/relo/data";
import { ViewHead, Field, inputCls, Meter } from "./studio-ui";
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

/* ═══════════════ CONTENT (kanban) ═══════════════ */

const COLS: { key: ContentStatus; label: string; hint: string; tone: string }[] = [
  { key: "idea", label: "Ideas", hint: "shower thoughts", tone: "border-t-sky" },
  { key: "drafting", label: "Drafting", hint: "being filmed", tone: "border-t-honey" },
  { key: "scheduled", label: "Scheduled", hint: "queued to post", tone: "border-t-ember" },
  { key: "published", label: "Published", hint: "running on RELO", tone: "border-t-moss" },
];

export function ContentView() {
  const { content, saveContent, moveContent, deleteContent, saveAutomation, reels } = useRelo();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<ContentPlan | null>(null);

  const openNew = () => {
    setDraft({
      id: "",
      title: "",
      hook: "",
      status: "idea",
      plannedFor: Date.now() + 3 * 86_400_000,
    });
    setOpen(true);
  };

  const save = () => {
    if (!draft) return;
    if (!draft.title.trim()) {
      toast.error("Give the idea a title — even a rough one.");
      return;
    }
    saveContent({ ...draft, id: draft.id || uid("cp") });
    toast.success(draft.id ? "Plan updated" : "Idea captured 📝");
    setOpen(false);
  };

  const publishToAutomation = (plan: ContentPlan) => {
    const reel = reels[0];
    saveAutomation({
      id: uid("auto"),
      reelId: reel.id,
      reelCaption: plan.title,
      triggerKeywords: ["send"],
      commentReplies: ["Sent! Check your DMs 🚀", "On its way 💬", "In your inbox ✨"],
      followGateEnabled: false,
      templateCard: {
        title: plan.hook || plan.title,
        subtitle: "From your latest reel",
        buttons: [{ type: "web_url", title: "Grab it", url: "https://aarav.so/latest" }],
      },
      isActive: true,
      followUpEnabled: false,
      followUpDelayMinutes: 60,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      triggersToday: 0,
      dmsSent: 0,
      clicks: 0,
    });
    moveContent(plan.id, "published");
    toast.success("Linked to a fresh automation ⚡");
  };

  return (
    <div className="space-y-6">
      <ViewHead
        title="Content"
        sub="The pipeline from 3am idea to published reel with its own automation attached."
      >
        <RButton onClick={openNew}>
          <Plus className="size-4" /> New idea
        </RButton>
      </ViewHead>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {COLS.map((col) => {
          const items = content.filter((c) => c.status === col.key);
          return (
            <motion.section
              key={col.key}
              layout
              className={cn(
                "rounded-3xl border border-line border-t-4 bg-card/60 p-3.5 shadow-[var(--shadow-soft)]",
                col.tone
              )}
            >
              <div className="flex items-baseline justify-between px-1.5 pb-1">
                <h3 className="font-display text-[14.5px] font-bold">{col.label}</h3>
                <span className="font-mono text-[10px] text-ink-4">
                  {items.length} · {col.hint}
                </span>
              </div>
              <div className="mt-2 space-y-2.5">
                <AnimatePresence>
                  {items.map((c, i) => {
                    const colIdx = COLS.findIndex((x) => x.key === c.status);
                    return (
                      <motion.article
                        key={c.id}
                        layout
                        initial={{ opacity: 0, y: 12, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.92 }}
                        transition={{ delay: i * 0.04 }}
                        
                        className="group rounded-2xl border border-line bg-card p-3.5 shadow-[var(--shadow-soft)]"
                      >
                        <p className="text-[13px] leading-snug font-semibold">{c.title}</p>
                        {c.hook && (
                          <p className="mt-1.5 rounded-lg bg-card-soft px-2.5 py-1.5 font-mono text-[10.5px] text-ink-3">
                            hook · {c.hook}
                          </p>
                        )}
                        <div className="mt-3 flex items-center justify-between">
                          <span className="inline-flex items-center gap-1 font-mono text-[10px] text-ink-4">
                            <CalendarDays className="size-3" />
                            {new Date(c.plannedFor).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                          </span>
                          <div className="flex gap-0.5">
                            {colIdx > 0 && (
                              <button
                                onClick={() => moveContent(c.id, COLS[colIdx - 1].key)}
                                className="grid size-7 place-items-center rounded-lg text-ink-4 "
                                aria-label="Move back"
                              >
                                <ArrowLeft className="size-3.5" />
                              </button>
                            )}
                            {colIdx < COLS.length - 1 && (
                              <button
                                onClick={() => moveContent(c.id, COLS[colIdx + 1].key)}
                                className="grid size-7 place-items-center rounded-lg text-ink-4 "
                                aria-label="Move forward"
                              >
                                <ArrowRight className="size-3.5" />
                              </button>
                            )}
                            {c.status === "scheduled" && (
                              <button
                                onClick={() => publishToAutomation(c)}
                                title="Attach automation when the reel is live"
                                className="grid size-7 place-items-center rounded-lg text-ember "
                                aria-label="Publish with automation"
                              >
                                <Sparkles className="size-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => {
                                deleteContent(c.id);
                                toast.success("Idea deleted");
                              }}
                              className="grid size-7 place-items-center rounded-lg text-ink-4 "
                              aria-label="Delete"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        </div>
                      </motion.article>
                    );
                  })}
                </AnimatePresence>
                <button
                  onClick={openNew}
                  className="w-full rounded-2xl border border-dashed border-line-strong py-2.5 text-[12px] font-medium text-ink-4 transition-colors "
                >
                  + add
                </button>
              </div>
            </motion.section>
          );
        })}
      </div>

      <Dialog open={open} onOpenChange={(v) => (!v ? setOpen(false) : null)}>
        <DialogContent className="rounded-[24px] border-line bg-card p-0 sm:max-w-md">
          <DialogHeader className="border-b border-line px-6 py-4">
            <DialogTitle className="font-display text-lg font-bold">New content idea</DialogTitle>
            <DialogDescription className="text-[12.5px]">
              Capture the hook now; the script can wait.
            </DialogDescription>
          </DialogHeader>
          {draft && (
            <div className="space-y-4 px-6 py-5">
              <Field label="Title">
                <input
                  value={draft.title}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                  placeholder="“I automated my DMs for 30 days”"
                  className={inputCls}
                />
              </Field>
              <Field label="Hook" hint="first 2 seconds">
                <input
                  value={draft.hook ?? ""}
                  onChange={(e) => setDraft({ ...draft, hook: e.target.value })}
                  placeholder="Day 1 vs Day 30, side by side"
                  className={inputCls}
                />
              </Field>
              <RButton className="w-full" onClick={save}>
                Save idea
              </RButton>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ═══════════════ SETTINGS ═══════════════ */

export function SettingsView() {
  const { plan, aiCredits, upgradePlan, user } = useRelo();
  const [notif, setNotif] = useState({ newLead: true, dailyDigest: false, failAlerts: true });
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);

  const tokenPct = 87; /* days remaining of 90 */

  return (
    <div className="space-y-6">
      <ViewHead
        title="Settings"
        sub="Connection, plan, referrals — the boring-but-important drawer. All demo, all safe to poke."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {/* connection */}
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-line bg-card p-6 shadow-[var(--shadow-soft)]"
        >
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-2xl bg-gradient-to-tr from-[#f58529] via-[#dd2a7b] to-[#8134af] text-white">
              <Instagram className="size-5" />
            </span>
            <div className="flex-1">
              <h3 className="font-display text-[16px] font-bold">@aarav.makes</h3>
              <p className="font-mono text-[10.5px] text-ink-4">Professional · Creator · connected 214 days</p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-moss/30 bg-moss/10 px-3 py-1 font-mono text-[10px] tracking-wider text-moss uppercase">
              <Check className="size-3" /> healthy
            </span>
          </div>
          <div className="mt-5">
            <div className="flex justify-between font-mono text-[11px]">
              <span className="text-ink-4">token renews in</span>
              <span className="font-medium">87 / 90 days</span>
            </div>
            <div className="mt-1.5">
              <Meter pct={tokenPct} tone="moss" />
            </div>
          </div>
          <div className="mt-5 flex gap-2.5">
            <RButton
              variant="ghost"
              size="sm"
              onClick={() => toast.success("Token refreshed — 90 more days")}
            >
              <RefreshCw className="size-3.5" /> Refresh token
            </RButton>
            <RButton
              variant="ghost"
              size="sm"
              className="text-ember-deep "
              onClick={() => setConfirmDisconnect(true)}
            >
              <ShieldAlert className="size-3.5" /> Disconnect
            </RButton>
          </div>
          <AnimatePresence>
            {confirmDisconnect && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-4 rounded-2xl border border-ember/40 bg-ember-wash p-4">
                  <p className="text-[13px] font-semibold text-ink">Really disconnect?</p>
                  <p className="mt-1 text-[12.5px] text-ink-3">
                    All 3 automations pause and Meta revokes the webhook. Leads stay yours.
                  </p>
                  <div className="mt-3 flex gap-2">
                    <RButton
                      size="sm"
                      variant="ember"
                      onClick={() => {
                        setConfirmDisconnect(false);
                        toast.error("Demo world — @aarav.makes isn't going anywhere 🙂");
                      }}
                    >
                      Yes, disconnect
                    </RButton>
                    <RButton size="sm" variant="ghost" onClick={() => setConfirmDisconnect(false)}>
                      Keep connected
                    </RButton>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.section>

        {/* plan & billing */}
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06 }}
          className="rounded-3xl border border-line bg-card p-6 shadow-[var(--shadow-soft)]"
        >
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-2xl bg-ember-wash text-ember-deep">
              <CreditCard className="size-5" />
            </span>
            <div className="flex-1">
              <h3 className="font-display text-[16px] font-bold">
                {TIER_META[plan].name} plan
              </h3>
              <p className="font-mono text-[10.5px] text-ink-4">
                {TIER_META[plan].price} · {aiCredits} AI credits left
              </p>
            </div>
          </div>
          <div className="mt-5 space-y-2">
            {(["free", "pro", "studio"] as Tier[]).map((t) => (
              <button
                key={t}
                onClick={() => {
                  upgradePlan(t);
                  toast.success(`Switched to ${TIER_META[t].name} — credits topped up`);
                }}
                className={cn(
                  "flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-all ",
                  plan === t ? "border-ember/60 bg-ember-wash" : "border-line bg-card-soft "
                )}
              >
                <div className="flex-1">
                  <p className="text-[13.5px] font-semibold">{TIER_META[t].name}</p>
                  <p className="font-mono text-[10px] text-ink-4">{TIER_META[t].blurb}</p>
                </div>
                <span className="font-display text-[15px] font-extrabold text-ink-2">{TIER_META[t].price}</span>
                {plan === t && (
                  <span className="grid size-6 place-items-center rounded-full bg-ember text-white">
                    <Check className="size-3.5" strokeWidth={3} />
                  </span>
                )}
              </button>
            ))}
          </div>
          <p className="mt-4 font-mono text-[10px] leading-relaxed text-ink-4">
            demo billing · in production: UPI manual verification + Lemon Squeezy checkout
          </p>
        </motion.section>

        {/* referral */}
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="rounded-3xl border border-line bg-card p-6 shadow-[var(--shadow-soft)]"
        >
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-2xl bg-moss/12 text-moss">
              <Gift className="size-5" />
            </span>
            <div>
              <h3 className="font-display text-[16px] font-bold">Refer creators</h3>
              <p className="font-mono text-[10.5px] text-ink-4">1 qualified referral = 1 free Pro month</p>
            </div>
          </div>
          <button
            onClick={() => {
              navigator.clipboard?.writeText("https://relo.app/r/RELO-AARAV");
              toast.success("Referral link copied — go earn free months");
            }}
            className="mt-4 flex w-full items-center justify-between rounded-2xl border border-dashed border-line-strong bg-card-soft px-4 py-3 transition-colors "
          >
            <span className="font-mono text-[12.5px] text-ink-2">relo.app/r/RELO-AARAV</span>
            <Copy className="size-4 text-ink-4" />
          </button>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            {[
              ["7", "referred"],
              ["5", "qualified"],
              ["2", "months earned"],
            ].map(([v, l]) => (
              <div key={l} className="rounded-2xl bg-card-soft px-2 py-3">
                <p className="font-display text-xl font-extrabold">{v}</p>
                <p className="font-mono text-[9.5px] tracking-wider text-ink-4 uppercase">{l}</p>
              </div>
            ))}
          </div>
        </motion.section>

        {/* notifications */}
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          className="rounded-3xl border border-line bg-card p-6 shadow-[var(--shadow-soft)]"
        >
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-2xl bg-honey/15 text-honey">
              <BellRing className="size-5" />
            </span>
            <h3 className="font-display text-[16px] font-bold">Notifications</h3>
          </div>
          <div className="mt-4 space-y-1">
            {(
              [
                ["newLead", "Every new lead", "A toast the moment a commenter converts"],
                ["dailyDigest", "Daily digest", "9am email with yesterday's numbers"],
                ["failAlerts", "Failure alerts", "Only when something needs you"],
              ] as const
            ).map(([key, title, sub]) => (
              <div key={key} className="flex items-center gap-3 rounded-2xl px-2 py-3 transition-colors ">
                <div className="flex-1">
                  <p className="text-[13.5px] font-semibold">{title}</p>
                  <p className="text-[12px] text-ink-3">{sub}</p>
                </div>
                <Switch checked={notif[key]} onCheckedChange={(v) => setNotif((n) => ({ ...n, [key]: v }))} />
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-start gap-2.5 rounded-2xl bg-card-soft px-4 py-3">
            <Smartphone className="mt-0.5 size-4 shrink-0 text-ink-4" />
            <p className="font-mono text-[10px] leading-relaxed text-ink-4">
              demo studio · notification prefs live in memory only
            </p>
          </div>
        </motion.section>
      </div>

      {/* account footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-line bg-card-soft px-6 py-4">
        <p className="font-mono text-[11px] text-ink-4">
          signed in as <span className="text-ink-2">{user?.email}</span>
        </p>
        <p className="font-mono text-[10px] text-ink-4">
          <Settings2 className="mr-1 inline size-3" />
          RELO studio v2.0 · rebuilt with Apple-grade comfort
        </p>
      </div>
    </div>
  );
}
