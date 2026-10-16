"use client";

import { useState } from "react";
import { ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useRelo } from "@/lib/relo/store";
import { fmtNum, timeAgo, uid, type Campaign, type Product } from "@/lib/relo/data";
import {
  EmptyState,
  Field,
  inputCls,
  Meter,
  Panel,
  StatusPill,
  ViewHead,
} from "./studio-ui";
import { Button } from "../chrome";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/* ==========================================================================
   Campaigns + Products.

   Both screens are record lists. A record reads: identity on the top line,
   the figures underneath, the action last. Row actions are small, sit in the
   footer rule, and move both background and text on hover.

   The one hard rule here: the campaign card never carries a letter tile, and
   the product actions never float over the card body.
   ========================================================================== */

/* One shape per action kind, so edit and delete can never drift apart. */
const rowAction =
  "grid size-7 shrink-0 place-items-center rounded-md border border-transparent text-ink-3 transition-colors duration-150 ease-out hover:border-line hover:bg-surface-2 hover:text-ink";
const rowActionDanger =
  "grid size-7 shrink-0 place-items-center rounded-md border border-transparent text-ink-3 transition-colors duration-150 ease-out hover:border-line hover:bg-bad-wash hover:text-bad";

/* ==========================================================================
   Campaigns
   ========================================================================== */

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
        sub="One blast to everyone still inside Meta's 24-hour window. Filtered, tracked, and reported as it goes out."
      >
        <Button onClick={openNew}>
          <Plus className="size-4" strokeWidth={1.75} aria-hidden /> New campaign
        </Button>
      </ViewHead>

      <Panel
        title="Reachable now"
        actions={<span className="caption">24-hour window</span>}
      >
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <p className="font-mono text-[26px] font-bold leading-none tracking-tight text-ink tnum">
            {reachable.toLocaleString("en-IN")}
          </p>
          <p className="text-[13.5px] leading-relaxed text-ink-2">
            leads can be messaged right now. Campaigns skip everyone whose window has closed.
          </p>
        </div>
      </Panel>

      {campaigns.length === 0 ? (
        <EmptyState
          title="No campaigns yet"
          sub="Draft your first blast. A workshop invite is a good one to start with."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {campaigns.map((c) => {
            const processed = c.sentCount + c.failedCount + c.unreachableCount;
            const pct = c.audienceSize ? Math.round((processed / c.audienceSize) * 100) : 0;
            const figures: [string, string][] = [
              ["audience", c.audienceSize.toLocaleString("en-IN")],
              ["sent", c.sentCount.toLocaleString("en-IN")],
              ["failed", c.failedCount.toLocaleString("en-IN")],
            ];
            const tone = c.status === "completed" ? "ok" : c.status === "failed" ? "warn" : "signal";

            return (
              <article
                key={c.id}
                className="rounded-xl border border-line bg-surface p-5 shadow-[var(--sh-1)] transition-colors duration-150 ease-out hover:border-line-strong"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-[14px] font-semibold leading-5 text-ink">{c.name}</h3>
                    <p className="mt-1 text-[12px] text-ink-3">
                      {c.kind === "text" ? "Text message" : "DM card"}
                    </p>
                  </div>
                  <StatusPill status={c.status} />
                </div>

                <div className="mt-4 grid grid-cols-3 gap-4 border-t border-line pt-4">
                  {figures.map(([label, value]) => (
                    <div key={label}>
                      <p className="caption">{label}</p>
                      <p className="mt-1.5 font-mono text-[15px] font-semibold leading-none text-ink tnum">
                        {value}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-4">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="caption">processed</span>
                    <span className="font-mono text-[12px] font-semibold text-ink tnum">{pct}%</span>
                  </div>
                  <div className="mt-2">
                    <Meter pct={pct} tone={tone} />
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-3">
                  <span className="font-mono text-[11.5px] text-ink-3 tnum">{timeAgo(c.scheduledAt)}</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEdit(c)}
                      aria-label={`Edit ${c.name}`}
                      className={rowAction}
                    >
                      <Pencil className="size-3.5" strokeWidth={1.75} aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(c)}
                      aria-label={`Delete ${c.name}`}
                      className={rowActionDanger}
                    >
                      <Trash2 className="size-3.5" strokeWidth={1.75} aria-hidden />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-xl border-line bg-surface p-0 sm:max-w-lg">
          <DialogHeader className="sticky top-0 z-10 gap-1 border-b border-line bg-surface px-5 py-4">
            <DialogTitle className="h4 text-ink">
              {draft ? (draft.id ? "Edit campaign" : "New campaign") : "Campaign"}
            </DialogTitle>
            <DialogDescription className="text-[12.5px] text-ink-3">
              Name the blast, write the message, choose the audience.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 px-5 py-5">
            <Field label="Name">
              <input
                value={draft?.name ?? ""}
                onChange={(e) => setDraft({ ...draft!, name: e.target.value })}
                placeholder="Creator OS v2 launch"
                className={inputCls}
              />
            </Field>
            <Field label="Message" hint="What the lead receives.">
              <textarea
                value={draft?.text ?? ""}
                onChange={(e) => setDraft({ ...draft!, text: e.target.value })}
                rows={3}
                className={cn(inputCls, "resize-none")}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
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
                <input
                  type="number"
                  value={draft?.audienceSize ?? 0}
                  onChange={(e) => setDraft({ ...draft!, audienceSize: Number(e.target.value) || 0 })}
                  className={cn(inputCls, "tnum")}
                />
              </Field>
            </div>

            {draft?.kind === "card" && (
              <Field label="Card title" hint="Shown above the three buttons.">
                <input
                  value={draft?.cardTitle ?? ""}
                  onChange={(e) => setDraft({ ...draft!, cardTitle: e.target.value })}
                  placeholder="Creator OS v2, 40% off"
                  className={inputCls}
                />
              </Field>
            )}

            <div className="flex items-center justify-between gap-4 rounded-md border border-line bg-surface-2 px-4 py-3">
              <div>
                <p className="text-[13px] font-semibold text-ink">HUMAN_AGENT tag</p>
                <p className="mt-0.5 text-[12px] text-ink-3">7-day window for sensitive threads.</p>
              </div>
              <Switch
                checked={draft?.usesHumanAgentTag ?? false}
                onCheckedChange={(v) => setDraft({ ...draft!, usesHumanAgentTag: v })}
              />
            </div>
          </div>

          <div className="sticky bottom-0 flex items-center justify-end gap-2 border-t border-line bg-surface px-5 py-4">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="signal" onClick={save}>
              {draft?.id ? "Save changes" : "Schedule campaign"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ==========================================================================
   Products
   ========================================================================== */

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

  const cancelEdit = () => {
    setDraft(null);
    setEditingId(null);
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

  /* An unsaved product has no id, so the catalog does not contain it. It is
     rendered as a leading card in its edit state instead of being dropped. */
  const rows = draft && draft.id === "" ? [draft, ...products] : products;

  return (
    <div className="space-y-6">
      <ViewHead title="Products" sub="Your catalog feeds the AI answers and your link in bio.">
        <Button onClick={openNew}>
          <Plus className="size-4" strokeWidth={1.75} aria-hidden /> New product
        </Button>
      </ViewHead>

      {products.length === 0 && !draft ? (
        <EmptyState
          title="No products yet"
          sub="Add your first product so AI answers and link blocks can point to it."
        >
          <Button onClick={openNew}>
            <Plus className="size-4" strokeWidth={1.75} aria-hidden /> Add product
          </Button>
        </EmptyState>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {rows.map((p) => {
            const editing = draft !== null && (editingId === p.id || p.id === "");
            const shown = editing && draft ? draft : p;

            return (
              <article
                key={p.id || "new-product"}
                className={cn(
                  "flex flex-col rounded-xl border border-line bg-surface p-5 shadow-[var(--sh-1)]",
                  "transition-colors duration-150 ease-out hover:border-line-strong",
                  editing && "border-line-strong"
                )}
              >
                {/* Identity stays on the card while the fields edit underneath it. */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="line-clamp-2 text-[14px] font-semibold leading-5 text-ink">{shown.name || "New product"}</h3>
                    {shown.priceText && (
                      <p className="mt-1 font-mono text-[12.5px] text-ink-2 tnum">{shown.priceText}</p>
                    )}
                  </div>
                  <StatusPill status={shown.isActive ? "active" : "paused"} />
                </div>

                <div className="mt-4 flex-1 border-t border-line pt-4">
                  {editing ? (
                    <div className="space-y-4">
                      <Field label="Name">
                        <input
                          value={draft?.name ?? p.name}
                          onChange={(e) => setDraft({ ...draft!, name: e.target.value })}
                          className={inputCls}
                        />
                      </Field>
                      <Field label="Price">
                        <input
                          value={draft?.priceText ?? p.priceText ?? ""}
                          onChange={(e) => setDraft({ ...draft!, priceText: e.target.value })}
                          placeholder="₹1,499"
                          className={cn(inputCls, "tnum")}
                        />
                      </Field>
                      <Field label="Description">
                        <textarea
                          value={draft?.description ?? p.description ?? ""}
                          onChange={(e) => setDraft({ ...draft!, description: e.target.value })}
                          rows={2}
                          className={cn(inputCls, "resize-none")}
                        />
                      </Field>
                      <Field label="Link">
                        <input
                          value={draft?.link ?? p.link}
                          onChange={(e) => setDraft({ ...draft!, link: e.target.value })}
                          className={inputCls}
                        />
                      </Field>
                      <div className="flex items-center justify-between gap-4 rounded-md border border-line bg-surface-2 px-3 py-2">
                        <span className="text-[12px] text-ink-2">Active</span>
                        <Switch
                          checked={draft?.isActive ?? p.isActive}
                          onCheckedChange={(v) => setDraft({ ...draft!, isActive: v })}
                        />
                      </div>
                    </div>
                  ) : (
                    <p className="line-clamp-3 text-[13px] leading-relaxed text-ink-2">
                      {p.description || "No description."}
                    </p>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-3">
                  {editing ? (
                    <>
                      <span className="caption">editing</span>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={cancelEdit}>
                          Cancel
                        </Button>
                        <Button variant="signal" size="sm" onClick={save}>
                          Save
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex min-w-0 items-center gap-3">
                        {p.link && (
                          <a
                            href={p.link}
                            target="_blank"
                            rel="noopener"
                            className="inline-flex items-center gap-1 text-[12px] font-semibold text-signal underline underline-offset-2 transition-colors duration-150 ease-out hover:text-signal-hover"
                          >
                            Open link
                            <ExternalLink className="size-3.5" strokeWidth={1.75} aria-hidden />
                          </a>
                        )}
                        <span className="font-mono text-[11.5px] text-ink-3 tnum">
                          {fmtNum(p.clicks)} clicks
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(p)}
                          aria-label={`Edit ${p.name}`}
                          className={rowAction}
                        >
                          <Pencil className="size-3.5" strokeWidth={1.75} aria-hidden />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            deleteProduct(p.id);
                            toast.success("Product deleted.");
                          }}
                          aria-label={`Delete ${p.name}`}
                          className={rowActionDanger}
                        >
                          <Trash2 className="size-3.5" strokeWidth={1.75} aria-hidden />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
