"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Megaphone,
  Trash2,
  Pencil,
  Package,
  Copy,
  ExternalLink,
  Text,
  LayoutTemplate,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { useRelo } from "@/lib/relo/store";
import { fmtNum, timeAgo, uid, type Campaign, type Product } from "@/lib/relo/data";
import { ViewHead, StatusPill, Field, inputCls, EmptyState } from "./studio-ui";
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

/* ═══════════════ CAMPAIGNS ═══════════════ */

const PROOF = { usesHumanAgentTag: "HUMAN_AGENT · 7-day window" };

export function CampaignsView() {
  const { campaigns, leads, saveCampaign, deleteCampaign, pushActivity } = useRelo();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Campaign | null>(null);

  const reachable = leads.length * 31 + 512; // playful stand-in for real reachability

  const openNew = () => {
    setDraft({
      id: "",
      name: "",
      audienceSize: reachable,
      status: "draft",
      kind: "text",
      text: "",
      scheduledAt: Date.now() + 86_400_000,
      sentCount: 0,
      failedCount: 0,
      unreachableCount: 0,
      usesHumanAgentTag: true,
    });
    setOpen(true);
  };

  const openEdit = (c: Campaign) => {
    setDraft({ ...c });
    setOpen(true);
  };

  const save = () => {
    if (!draft) return;
    if (!draft.name.trim() || (draft.kind === "text" ? !draft.text?.trim() : !draft.cardTitle?.trim())) {
      toast.error("Campaign needs a name and a message.");
      return;
    }
    const saved: Campaign = {
      ...draft,
      id: draft.id || uid("cmp"),
      status: draft.status === "draft" ? "scheduled" : draft.status,
    };
    saveCampaign(saved);
    pushActivity("system", `Campaign “${saved.name}” ${draft.id ? "updated" : "scheduled"}`);
    toast.success(draft.id ? "Campaign updated" : "Campaign scheduled 🚀");
    setOpen(false);
  };

  return (
    <div className="space-y-6">
      <ViewHead
        title="Campaigns"
        sub="One thoughtful blast to everyone still inside Meta's 24-hour window. Filtered, tracked, honest."
      >
        <RButton onClick={openNew}>
          <Plus className="size-4" /> New campaign
        </RButton>
      </ViewHead>

      <div className="flex items-center gap-3 rounded-2xl border border-honey/40 bg-honey/10 px-4 py-3">
        <Users className="size-4 shrink-0 text-honey" />
        <p className="text-[13px] text-ink-2">
          <span className="font-semibold">{reachable.toLocaleString("en-IN")}</span> leads are reachable right now —
          campaigns skip everyone whose window closed.
        </p>
      </div>

      {campaigns.length === 0 ? (
        <EmptyState icon={Megaphone} title="No campaigns yet" sub="Draft your first blast — a workshop invite works wonders." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <AnimatePresence mode="popLayout">
            {campaigns.map((c) => {
              const pct = c.audienceSize ? Math.round(((c.sentCount + c.failedCount + c.unreachableCount) / c.audienceSize) * 100) : 0;
              return (
                <motion.article
                  key={c.id}
                  layout
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.94 }}
                  
                  className="group rounded-3xl border border-line bg-card p-5 shadow-[var(--shadow-soft)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-ember-wash text-ember-deep">
                        {c.kind === "card" ? <LayoutTemplate className="size-5" /> : <Text className="size-5" />}
                      </span>
                      <div>
                        <h3 className="text-[15px] font-bold">{c.name}</h3>
                        <p className="font-mono text-[10.5px] text-ink-4">
                          {c.kind === "card" ? c.cardTitle : "text blast"} ·{" "}
                          {c.scheduledAt > Date.now() ? `fires ${timeAgo(c.scheduledAt).replace(" ago", " later")}` : timeAgo(c.scheduledAt)}
                        </p>
                      </div>
                    </div>
                    <StatusPill status={c.status} pulse={c.status === "sending"} />
                  </div>

                  {c.kind === "text" && c.text && (
                    <p className="mt-4 line-clamp-2 rounded-xl bg-card-soft px-3.5 py-2.5 text-[13px] text-ink-2">
                      {c.text}
                    </p>
                  )}

                  {c.audienceSize > 0 && (
                    <div className="mt-4">
                      <div className="flex justify-between font-mono text-[10.5px] text-ink-4">
                        <span>
                          {c.sentCount}/{c.audienceSize} sent
                        </span>
                        <span>{pct}%</span>
                      </div>
                      <div className="mt-1.5 flex h-2 overflow-hidden rounded-full bg-ink/6">
                        <motion.div
                          className="h-full bg-moss"
                          initial={{ width: 0 }}
                          animate={{ width: `${(c.sentCount / c.audienceSize) * 100}%` }}
                          transition={{ duration: 1 }}
                        />
                        <motion.div
                          className="h-full bg-ember"
                          initial={{ width: 0 }}
                          animate={{ width: `${(c.failedCount / c.audienceSize) * 100}%` }}
                          transition={{ duration: 1, delay: 0.15 }}
                        />
                      </div>
                      <div className="mt-2 flex gap-4 font-mono text-[10px] text-ink-4">
                        <span className="text-moss">✓ {c.sentCount} delivered</span>
                        <span className="text-ember">✗ {c.failedCount} failed</span>
                        <span>— {c.unreachableCount} unreachable</span>
                      </div>
                    </div>
                  )}

                  <div className="mt-4 flex items-center justify-between border-t border-line pt-3.5">
                    {c.usesHumanAgentTag ? (
                      <span className="rounded-md bg-sky/10 px-2 py-1 font-mono text-[9.5px] tracking-wide text-[#4a6b82] uppercase">
                        {PROOF.usesHumanAgentTag}
                      </span>
                    ) : (
                      <span className="font-mono text-[9.5px] text-ink-4 uppercase">standard 24h window</span>
                    )}
                    <div className="flex gap-1 opacity-70 ">
                      <button
                        onClick={() => openEdit(c)}
                        className="grid size-8 place-items-center rounded-lg text-ink-3 "
                        aria-label="Edit campaign"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          deleteCampaign(c.id);
                          toast.success("Campaign deleted");
                        }}
                        className="grid size-8 place-items-center rounded-lg text-ink-3 "
                        aria-label="Delete campaign"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* editor dialog */}
      <Dialog open={open} onOpenChange={(v) => (!v ? setOpen(false) : null)}>
        <DialogContent className="rounded-[24px] border-line bg-card p-0 sm:max-w-lg">
          <DialogHeader className="border-b border-line px-6 py-4">
            <DialogTitle className="font-display text-lg font-bold">
              {draft?.id ? "Edit campaign" : "New campaign"}
            </DialogTitle>
            <DialogDescription className="text-[12.5px]">
              Text or card blast to {reachable.toLocaleString("en-IN")} reachable leads.
            </DialogDescription>
          </DialogHeader>
          {draft && (
            <div className="space-y-4 px-6 py-5">
              <Field label="Campaign name">
                <input
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  placeholder="Weekend workshop invites"
                  className={inputCls}
                />
              </Field>
              <Field label="Message type">
                <div className="grid grid-cols-2 gap-2">
                  {(["text", "card"] as const).map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setDraft({ ...draft, kind: k })}
                      className={cn(
                        "flex items-center justify-center gap-2 rounded-xl border py-2.5 text-[13px] font-medium transition-all",
                        draft.kind === k
                          ? "border-ember/60 bg-ember-wash text-ember-deep"
                          : "border-line bg-card-soft text-ink-3"
                      )}
                    >
                      {k === "text" ? <Text className="size-4" /> : <LayoutTemplate className="size-4" />}
                      {k === "text" ? "Plain text" : "Card"}
                    </button>
                  ))}
                </div>
              </Field>
              {draft.kind === "text" ? (
                <Field label="Message" hint="keep it human">
                  <textarea
                    value={draft.text ?? ""}
                    onChange={(e) => setDraft({ ...draft, text: e.target.value })}
                    rows={3}
                    placeholder="Yo! Free workshop this Sunday 7pm — want a seat? 🎟️"
                    className={cn(inputCls, "resize-none")}
                  />
                </Field>
              ) : (
                <Field label="Card title">
                  <input
                    value={draft.cardTitle ?? ""}
                    onChange={(e) => setDraft({ ...draft, cardTitle: e.target.value })}
                    placeholder="You're on the list ⚡"
                    className={inputCls}
                  />
                </Field>
              )}
              <div className="flex items-center justify-between rounded-2xl border border-line bg-card-soft px-4 py-3">
                <div>
                  <p className="text-[13px] font-semibold">HUMAN_AGENT tag</p>
                  <p className="text-[11.5px] text-ink-3">Extends Meta's window to 7 days</p>
                </div>
                <Switch
                  checked={draft.usesHumanAgentTag}
                  onCheckedChange={(usesHumanAgentTag) => setDraft({ ...draft, usesHumanAgentTag })}
                />
              </div>
              <Field label="Schedule">
                <input
                  type="datetime-local"
                  value={new Date(draft.scheduledAt - new Date().getTimezoneOffset() * 60000)
                    .toISOString()
                    .slice(0, 16)}
                  onChange={(e) => setDraft({ ...draft, scheduledAt: new Date(e.target.value).getTime() })}
                  className={inputCls}
                />
              </Field>
              <RButton className="w-full" onClick={save}>
                <Megaphone className="size-4" /> {draft.id ? "Save campaign" : "Schedule campaign"}
              </RButton>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ═══════════════ PRODUCTS ═══════════════ */

const PRODUCT_ART = ["📦", "🧠", "🗂", "🚀", "🎨", "🎧", "📚", "⚡"];

export function ProductsView() {
  const { products, saveProduct, deleteProduct } = useRelo();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Product | null>(null);

  const openNew = () => {
    setDraft({ id: "", name: "", priceText: "", description: "", link: "", isActive: true, clicks: 0 });
    setOpen(true);
  };

  const save = () => {
    if (!draft) return;
    if (!draft.name.trim()) {
      toast.error("Products need a name.");
      return;
    }
    saveProduct({ ...draft, id: draft.id || uid("prod") });
    toast.success(draft.id ? "Product updated" : "Product added to the shelf");
    setOpen(false);
  };

  return (
    <div className="space-y-6">
      <ViewHead
        title="Products"
        sub="Your catalog feeds AI product answers and the link-in-bio page. 50 rows fit one AI prompt — keep it tight."
      >
        <RButton onClick={openNew}>
          <Plus className="size-4" /> Add product
        </RButton>
      </ViewHead>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AnimatePresence mode="popLayout">
          {products.map((p, i) => (
            <motion.article
              key={p.id}
              layout
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              
              transition={{ type: "spring", stiffness: 280, damping: 24 }}
              className="group flex flex-col rounded-3xl border border-line bg-card p-5 shadow-[var(--shadow-soft)]"
            >
              <div className="flex items-start justify-between">
                <span className="grid size-12 place-items-center rounded-2xl bg-card-soft text-2xl transition-transform duration-300 ">
                  {PRODUCT_ART[i % PRODUCT_ART.length]}
                </span>
                <Switch
                  checked={p.isActive}
                  onCheckedChange={(isActive) => saveProduct({ ...p, isActive })}
                  aria-label="Toggle product"
                />
              </div>
              <h3 className="mt-3.5 text-[14.5px] font-bold">{p.name}</h3>
              <p className="mt-1 line-clamp-2 flex-1 text-[12.5px] leading-relaxed text-ink-3">{p.description}</p>
              <div className="mt-3.5 flex items-center justify-between">
                <span className="font-display text-[17px] font-extrabold text-ember">{p.priceText || "—"}</span>
                <span className="font-mono text-[10.5px] text-ink-4">{fmtNum(p.clicks)} clicks</span>
              </div>
              <div className="mt-4 flex gap-1.5 border-t border-line pt-3.5">
                {p.link && (
                  <button
                    onClick={() => window.open(p.link, "_blank")}
                    className="grid size-8 place-items-center rounded-lg text-ink-3 "
                    aria-label="Open link"
                  >
                    <ExternalLink className="size-3.5" />
                  </button>
                )}
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(p.link ?? "");
                    toast.success("Link copied");
                  }}
                  className="grid size-8 place-items-center rounded-lg text-ink-3 "
                  aria-label="Copy link"
                >
                  <Copy className="size-3.5" />
                </button>
                <span className="flex-1" />
                <button
                  onClick={() => {
                    setDraft({ ...p });
                    setOpen(true);
                  }}
                  className="grid size-8 place-items-center rounded-lg text-ink-3 "
                  aria-label="Edit product"
                >
                  <Pencil className="size-3.5" />
                </button>
                <button
                  onClick={() => {
                    deleteProduct(p.id);
                    toast.success("Product removed");
                  }}
                  className="grid size-8 place-items-center rounded-lg text-ink-3 "
                  aria-label="Delete product"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </motion.article>
          ))}
        </AnimatePresence>
      </div>

      <Dialog open={open} onOpenChange={(v) => (!v ? setOpen(false) : null)}>
        <DialogContent className="rounded-[24px] border-line bg-card p-0 sm:max-w-md">
          <DialogHeader className="border-b border-line px-6 py-4">
            <DialogTitle className="font-display text-lg font-bold">
              {draft?.id ? "Edit product" : "Add product"}
            </DialogTitle>
            <DialogDescription className="text-[12.5px]">
              The AI quotes these verbatim when commenters ask about them.
            </DialogDescription>
          </DialogHeader>
          {draft && (
            <div className="space-y-4 px-6 py-5">
              <Field label="Name">
                <input
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  placeholder="Second Brain Pro"
                  className={inputCls}
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Price">
                  <input
                    value={draft.priceText ?? ""}
                    onChange={(e) => setDraft({ ...draft, priceText: e.target.value })}
                    placeholder="₹1,499"
                    className={inputCls}
                  />
                </Field>
                <Field label="Link">
                  <input
                    value={draft.link ?? ""}
                    onChange={(e) => setDraft({ ...draft, link: e.target.value })}
                    placeholder="https://…"
                    className={cn(inputCls, "font-mono text-[12px]")}
                  />
                </Field>
              </div>
              <Field label="Description" hint="one line the AI can quote">
                <textarea
                  value={draft.description ?? ""}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                  rows={2}
                  placeholder="The full PARA-based system with weekly reviews baked in."
                  className={cn(inputCls, "resize-none")}
                />
              </Field>
              <RButton className="w-full" onClick={save}>
                <Package className="size-4" /> {draft.id ? "Save product" : "Add product"}
              </RButton>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
