"use client";

import React, { useState } from "react";
import {
  Plus, Megaphone, Trash2, Pencil, Package, Copy, ExternalLink, Users, LayoutTemplate,
} from "lucide-react";
import { toast } from "sonner";
import { useRelo } from "@/lib/relo/store";
import { fmtNum, timeAgo, uid, type Campaign, type Product } from "@/lib/relo/data";
import { ViewHead, StatusPill, Field, inputCls, EmptyState } from "./studio-ui";
import { RButton } from "../chrome";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";

/* ══════════════════════════════════════════════════════════════════════
   CAMPAIGNS
   ═════════════════════════════════════════════════════════════════════ */

export function CampaignsView() {
  const { campaigns, leads, saveCampaign, deleteCampaign, pushActivity } = useRelo();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Campaign | null>(null);

  const reachable = Math.min(leads.length, 743);

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
      usesHumanAgentTag: false,
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
    pushActivity("system", `Campaign "${saved.name}" ${draft.id ? "updated" : "scheduled"}.`);
    toast.success(draft.id ? "Campaign updated." : "Campaign scheduled.");
    setOpen(false);
  };

  const remove = (c: Campaign) => {
    deleteCampaign(c.id);
    toast.success("Campaign deleted.");
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

      <div className="flex items-center gap-3 rounded-lg border border-accent-wash bg-accent-wash/50 px-4 py-3">
        <Users className="size-4 shrink-0 text-accent" />
        <p className="text-sm text-text-2">
          <span className="font-semibold text-text">{reachable.toLocaleString("en-IN")}</span>{" "}
          leads are reachable right now. Campaigns skip everyone whose window closed.
        </p>
      </div>

      {campaigns.length === 0 ? (
        <EmptyState
          title="No campaigns yet"
          sub="Draft your first blast — a workshop invite works wonders."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {campaigns.map((c) => {
            const pct = c.audienceSize ? Math.round(((c.sentCount + c.failedCount + c.unreachableCount) / c.audienceSize) * 100) : 0;
            return (
              <article key={c.id} className="group rounded-lg border border-border bg-surface p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-accent-wash text-accent font-bold text-[11px]">
                      C
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text">{c.name}</p>
                      <p className="text-[11px] text-text-3">{c.kind === "text" ? "Text message" : "DM card"}</p>
                    </div>
                  </div>
                  <StatusPill status={c.status} />
                </div>
                <div className="mt-4 grid grid-cols-3 gap-4 border-t border-border pt-4 text-center">
                  {[
                    ["audience", c.audienceSize.toLocaleString("en-IN")],
                    ["sent", c.sentCount],
                    ["failed", c.failedCount],
                  ].map(([label, value], i) => (
                    <div key={i}>
                      <p className="text-sm font-bold text-text">{value}</p>
                      <p className="font-mono text-[10px] text-text-3 uppercase">{label}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 h-[10px] w-full overflow-hidden rounded-full bg-surface-3">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
                </div>
                <p className="mt-2 text-xs text-text-3 text-right">{pct}% of audience processed</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="font-mono text-[11px] text-text-3">{timeAgo(c.scheduledAt)}</span>
                  <div className="flex gap-1 opacity-70">
                    <button
                      onClick={() => openEdit(c)}
                      className="size-8 shrink-0 place-items-center rounded-md text-text-3 hover:text-text transition-colors"
                      aria-label="Edit campaign"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <button
                      onClick={() => remove(c)}
                      className="size-8 shrink-0 place-items-center rounded-md text-text-3 hover:text-text transition-colors"
                      aria-label="Delete campaign"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-lg border-border bg-surface p-0 sm:max-w-lg">
          <DialogHeader className="sticky top-0 z-10 border-b border-border bg-surface/95 px-6 py-4">
            <DialogTitle className="h4 text-text">{draft ? (draft.id ? "Edit campaign" : "New campaign") : "Campaign"}</DialogTitle>
            <DialogDescription className="text-xs text-text-3">Name the blast, write the message, choose the audience.</DialogDescription>
          </DialogHeader>
          <div className="px-6 py-5 space-y-5">
            <Field label="Name">
              <input value={draft?.name ?? ""} onChange={(e) => setDraft({ ...draft!, name: e.target.value })} placeholder="Creator OS v2 launch" className={inputCls} />
            </Field>
            <Field label="Message" hint="What the lead receives.">
              <textarea
                value={draft?.text ?? ""}
                onChange={(e) => setDraft({ ...draft!, text: e.target.value })}
                rows={3}
                className={cn(inputCls, "resize-none")}
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Kind">
                <select
                  value={draft?.kind ?? "text"}
                  onChange={(e) => setDraft({ ...draft!, kind: e.target.value as "text" | "card" })}
                  className={inputCls}
                >
                  <option value="text">Text message</option>
                  <option value="card">DM card</option>
                </select>
              </Field>
              <Field label="Audience size">
                <input type="number" value={draft?.audienceSize ?? 0} onChange={(e) => setDraft({ ...draft!, audienceSize: Number(e.target.value) || 0 })} className={inputCls} />
              </Field>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border bg-surface-2 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-text">Use HUMAN_AGENT tag</p>
                <p className="text-[11px] text-text-3">7-day window for sensitive threads.</p>
              </div>
              <Switch checked={draft?.usesHumanAgentTag ?? false} onCheckedChange={(v) => setDraft({ ...draft!, usesHumanAgentTag: v })} />
            </div>
          </div>
          <div className="sticky bottom-0 flex items-center justify-between border-t border-border bg-surface/95 px-6 py-4">
            <button type="button" onClick={() => setOpen(false)} className="text-sm font-medium text-text-3">Cancel</button>
            <RButton onClick={save}>
              {draft?.id ? "Save changes" : "Schedule campaign"}
            </RButton>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   PRODUCTS
   ═════════════════════════════════════════════════════════════════════ */

export function ProductsView() {
  const { products, saveProduct, deleteProduct } = useRelo();
  const [draft, setDraft] = useState<Product | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const openNew = () => {
    setDraft({ id: "", name: "", priceText: "", description: "", link: "", isActive: true, clicks: 0 });
    setEditingId(null);
  };

  const openEdit = (p: Product) => {
    setDraft(structuredClone(p));
    setEditingId(p.id);
  };

  const save = () => {
    if (!draft) return;
    if (!draft.name.trim() || !draft.link?.trim()) {
      toast.error("Name and link are required.");
      return;
    }
    saveProduct({ ...draft, id: draft.id || uid("prod") });
    toast.success(draft.id ? "Product updated." : "Product saved.");
    setDraft(null);
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      <ViewHead title="Products" sub="Your catalog feeds the AI answers and your link in bio.">
        <RButton onClick={openNew}>
          <Plus className="size-4" /> New product
        </RButton>
      </ViewHead>

      {products.length === 0 ? (
        <EmptyState title="No products yet" sub="Add your first product so AI answers and link blocks can point to it.">
          <RButton onClick={openNew}>
            <Plus className="size-4" /> Add product
          </RButton>
        </EmptyState>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {products.map((p) => (
            <article key={p.id} className="flex flex-col rounded-lg border border-border bg-surface p-5 shadow-sm group">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text line-clamp-2">{p.name}</p>
                  {p.priceText && <p className="text-[11px] text-text-3">{p.priceText}</p>}
                </div>
                <div className="flex gap-1 opacity-70">
                  {editingId === p.id ? (
                    <>
                      <button onClick={() => save()} className="size-8 shrink-0 place-items-center rounded-md text-text-3 hover:text-text transition-colors" aria-label="Save">
                        <span className="size-3.5" />
                      </button>
                      <button onClick={() => { setDraft(null); setEditingId(null); }} className="size-8 shrink-0 place-items-center rounded-md text-text-3 hover:text-text transition-colors" aria-label="Cancel">
                        <span className="size-3.5" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => openEdit(p)} className="size-8 shrink-0 place-items-center rounded-md text-text-3 hover:text-text transition-colors" aria-label="Edit">
                        <Pencil className="size-3.5" />
                      </button>
                      <button onClick={() => { deleteProduct(p.id); toast.success("Product deleted."); }} className="size-8 shrink-0 place-items-center rounded-md text-text-3 hover:text-text transition-colors" aria-label="Delete">
                        <Trash2 className="size-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
              {editingId === p.id ? (
                <div className="space-y-3 flex-1">
                  <Field label="Name">
                    <input value={draft?.name ?? p.name} onChange={(e) => setDraft({ ...draft!, name: e.target.value })} className={inputCls} />
                  </Field>
                  <Field label="Price">
                    <input value={draft?.priceText ?? p.priceText ?? ""} onChange={(e) => setDraft({ ...draft!, priceText: e.target.value })} placeholder="₹1,499" className={inputCls} />
                  </Field>
                  <Field label="Description">
                    <textarea value={draft?.description ?? p.description ?? ""} onChange={(e) => setDraft({ ...draft!, description: e.target.value })} rows={2} className={cn(inputCls, "resize-none")} />
                  </Field>
                  <Field label="Link">
                    <input value={draft?.link ?? p.link} onChange={(e) => setDraft({ ...draft!, link: e.target.value })} className={inputCls} />
                  </Field>
                  <div className="flex items-center justify-between rounded-md border border-border bg-surface-2 px-3 py-2">
                    <span className="text-xs text-text-3">Active</span>
                    <Switch checked={draft?.isActive ?? p.isActive} onCheckedChange={(v) => setDraft({ ...draft!, isActive: v })} />
                  </div>
                </div>
              ) : (
                <div className="flex-1 space-y-3">
                  <p className="text-sm text-text-2 leading-relaxed line-clamp-3">{p.description || "No description."}</p>
                  {p.link && (
                    <a href={p.link} target="_blank" rel="noopener" className="text-xs font-semibold text-accent underline underline-offset-2 hover:text-accent-hover">
                      Open link <ExternalLink className="size-3.5 inline ml-1" />
                    </a>
                  )}
                  <p className="font-mono text-[11px] text-text-3">{fmtNum(p.clicks)} clicks</p>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
