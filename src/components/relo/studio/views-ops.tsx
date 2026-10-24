"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Loader2, Pencil, Plus, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { useRelo } from "@/lib/relo/store";
import * as api from "@/lib/relo/api";
import {
  fmtNum,
  timeAgo,
  toMs,
  type Campaign,
  type CampaignCard,
  type Product,
} from "@/lib/relo/data";
import {
  EmptyState,
  ErrorNotice,
  Field,
  LoadingBlock,
  LockedNotice,
  Panel,
  StatusPill,
  ViewHead,
  inputCls,
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

const rowAction =
  "grid size-7 shrink-0 place-items-center rounded-md border border-transparent text-ink-3 transition-colors duration-150 ease-out hover:border-line hover:bg-surface-2 hover:text-ink";
const rowActionDanger =
  "grid size-7 shrink-0 place-items-center rounded-md border border-transparent text-ink-3 transition-colors duration-150 ease-out hover:border-line hover:bg-bad-wash hover:text-bad";

const isHttpUrl = (value: string) => /^https?:\/\/[^\s"'<>]+$/i.test(value.trim());

const toLocalInput = (ms: number): string => {
  const date = new Date(ms);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

/* ==========================================================================
   Campaigns
   ========================================================================== */

interface CampaignDraft {
  id?: string;
  mediaId: string;
  kind: "text" | "card";
  text: string;
  cardTitle: string;
  cardSubtitle: string;
  cardImageUrl: string;
  buttons: Array<{ type: string; title: string; url: string }>;
  scheduledAt: number;
  usesHumanAgentTag: boolean;
}

const emptyCampaign = (mediaId: string): CampaignDraft => ({
  mediaId,
  kind: "text",
  text: "",
  cardTitle: "",
  cardSubtitle: "",
  cardImageUrl: "",
  buttons: [{ type: "web_url", title: "", url: "" }],
  scheduledAt: Date.now() + 60 * 60 * 1000,
  usesHumanAgentTag: false,
});

const payloadOf = (campaign: Campaign) => campaign.payload;

export function CampaignsView() {
  const { account, plan, limits, campaigns, reels, saveCampaign, deleteCampaign } =
    useRelo();
  const [draft, setDraft] = useState<CampaignDraft | null>(null);
  const [steps, setSteps] = useState<{ reachability: import("@/lib/relo/data").Reachability } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  if (!limits.campaigns) {
    return (
      <LockedNotice
        feature="Broadcasts"
        plan={plan}
        message="Send one message to everyone still inside Meta's 24-hour window. Broadcasts are part of Pro and Studio."
        onUpgrade={() => {
          window.location.hash = "#/studio/settings";
        }}
      />
    );
  }

  const openNew = () => {
    setDraft(emptyCampaign(reels.data[0]?.id ?? ""));
    setSteps(null);
    setError(null);
  };

  const openEdit = (campaign: Campaign) => {
    const payload = payloadOf(campaign);
    setDraft({
      id: campaign.id,
      mediaId: campaign.mediaId,
      kind: payload?.kind === "card" ? "card" : "text",
      text: payload?.text ?? "",
      cardTitle: payload?.card?.title ?? "",
      cardSubtitle: payload?.card?.subtitle ?? "",
      cardImageUrl: payload?.card?.imageUrl ?? "",
      buttons:
        payload?.card?.buttons?.map((button) => ({
          type: button.type,
          title: button.title,
          url: button.url ?? "",
        })) ?? [{ type: "web_url", title: "", url: "" }],
      scheduledAt: toMs(campaign.scheduledAt) || Date.now() + 3_600_000,
      usesHumanAgentTag: campaign.usesHumanAgentTag,
    });
    setSteps(null);
    setError(null);
  };

  const submit = async () => {
    if (!draft || !account) return;

    if (!draft.mediaId) {
      setError("Pick the Reel whose commenters you want to reach.");
      return;
    }
    if (draft.kind === "text" && !draft.text.trim()) {
      setError("Write the message you want to send.");
      return;
    }
    if (draft.kind === "card") {
      if (!draft.cardTitle.trim()) {
        setError("A card needs a title.");
        return;
      }
      const buttons = draft.buttons.filter((button) => button.title.trim());
      if (buttons.length === 0) {
        setError("A card needs at least one button.");
        return;
      }
      if (buttons.length > 3) {
        setError("Meta allows at most three buttons.");
        return;
      }
      for (const button of buttons) {
        if (button.title.trim().length > 20) {
          setError("Button labels are limited to 20 characters.");
          return;
        }
        if (button.url && !isHttpUrl(button.url)) {
          setError("Button links must start with http:// or https://.");
          return;
        }
      }
    }

    const card: CampaignCard | undefined =
      draft.kind === "card"
        ? {
            title: draft.cardTitle.trim(),
            subtitle: draft.cardSubtitle.trim() || undefined,
            imageUrl: draft.cardImageUrl.trim() || undefined,
            buttons: draft.buttons
              .filter((button) => button.title.trim())
              .map((button) => ({
                type: button.type,
                title: button.title.trim(),
                url: button.url.trim() || undefined,
              })),
          }
        : undefined;

    setSaving(true);
    setError(null);
    try {
      const result = await saveCampaign({
        id: draft.id,
        accountId: account.id,
        mediaId: draft.mediaId,
        kind: draft.kind,
        text: draft.kind === "text" ? draft.text.trim() : undefined,
        card,
        status: draft.scheduledAt > Date.now() ? "scheduled" : "draft",
        scheduledAt: Math.floor(draft.scheduledAt / 1000),
        usesHumanAgentTag: draft.usesHumanAgentTag,
      });
      setSteps({ reachability: result.reachability });
      toast.success(
        draft.id ? "Campaign updated" : "Campaign saved",
        {
          description: `${result.reachability.reachable} of ${result.reachability.total} leads are inside the window.`,
        }
      );
      setDraft(null);
    } catch (caught) {
      setError(api.errorMessage(caught));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (campaign: Campaign) => {
    try {
      await deleteCampaign(campaign.id);
      setConfirmDelete(null);
      toast.success("Campaign deleted");
    } catch (caught) {
      toast.error(api.errorMessage(caught));
    }
  };

  return (
    <div className="space-y-6">
      <ViewHead
        title="Broadcasts"
        sub="One message to the people who commented recently. Meta only allows it inside a 24-hour window, so RELO skips anyone whose window has closed."
      >
        <Button variant="signal" onClick={openNew} disabled={!account}>
          <Plus className="size-4" strokeWidth={1.75} aria-hidden />
          New broadcast
        </Button>
      </ViewHead>

      {steps && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl border border-line bg-surface/60 px-4 py-3 text-[13px] text-ink-2">
          <span className="inline-flex items-center gap-2 font-semibold text-ink">
            <Send className="size-3.5 text-ok" aria-hidden />
            Reachability checked
          </span>
          <span>
            {steps.reachability.reachable} reachable ·{" "}
            {steps.reachability.unreachable} outside the window ·{" "}
            {steps.reachability.total} leads total
          </span>
          <button
            type="button"
            onClick={() => setSteps(null)}
            className="ml-auto text-[12px] font-semibold text-ink-3 hover:text-ink"
          >
            Dismiss
          </button>
        </div>
      )}

      {campaigns.loading && campaigns.data.length === 0 ? (
        <LoadingBlock label="Loading broadcasts" />
      ) : campaigns.error ? (
        <ErrorNotice
          message={campaigns.error.message}
          detail={campaigns.error.code}
          onRetry={() => void campaigns.refresh()}
        />
      ) : campaigns.data.length === 0 ? (
        <EmptyState
          title="No broadcasts yet"
          sub="A broadcast is a one-off message, not an automation. Use it to re-open a conversation with people who already commented."
        >
          <Button variant="signal" onClick={openNew} disabled={!account}>
            <Plus className="size-4" strokeWidth={1.75} aria-hidden />
            Draft a broadcast
          </Button>
        </EmptyState>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {campaigns.data.map((campaign) => {
            const payload = payloadOf(campaign);
            const processed =
              campaign.sentCount + campaign.failedCount + campaign.unreachableCount;
            return (
              <article key={campaign.id} className="glass-card rounded-2xl p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="line-clamp-2 text-[14px] font-semibold leading-5 text-ink">
                      {payload?.kind === "card"
                        ? payload.card?.title || "DM card"
                        : payload?.text || "Message"}
                    </h3>
                    <p className="mt-1 font-mono text-[11px] text-ink-3">
                      {payload?.kind === "card" ? "Card" : "Text"} ·{" "}
                      {campaign.mediaId}
                    </p>
                  </div>
                  <StatusPill status={campaign.status} />
                </div>

                <div className="mt-4 grid grid-cols-3 gap-4 border-t border-line pt-4">
                  {[
                    ["Sent", fmtNum(campaign.sentCount)],
                    ["Failed", fmtNum(campaign.failedCount)],
                    ["Unreachable", fmtNum(campaign.unreachableCount)],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <p className="caption">{label}</p>
                      <p className="mt-1.5 font-mono text-[15px] font-semibold text-ink tnum">
                        {value}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-3">
                  <span className="font-mono text-[11.5px] text-ink-3">
                    {campaign.status === "scheduled"
                      ? `Starts ${timeAgo(campaign.scheduledAt)}`
                      : `${processed} processed`}
                  </span>
                  <div className="flex items-center gap-1">
                    {confirmDelete === campaign.id ? (
                      <>
                        <button
                          type="button"
                          onClick={() => void remove(campaign)}
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
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => openEdit(campaign)}
                          aria-label="Edit broadcast"
                          className={rowAction}
                        >
                          <Pencil className="size-3.5" strokeWidth={1.75} aria-hidden />
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDelete(campaign.id)}
                          aria-label="Delete broadcast"
                          className={rowActionDanger}
                        >
                          <Trash2 className="size-3.5" strokeWidth={1.75} aria-hidden />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Dialog open={draft !== null} onOpenChange={(next) => (!next ? setDraft(null) : undefined)}>
        <DialogContent className="max-h-[90vh] gap-0 overflow-y-auto rounded-2xl border-line/60 bg-surface/90 p-0 shadow-[var(--sh-3)] backdrop-blur-2xl sm:max-w-lg">
          <DialogHeader className="sticky top-0 z-10 border-b border-line/60 bg-surface/92 px-5 py-4 backdrop-blur-2xl">
            <DialogTitle className="h4 text-ink">
              {draft?.id ? "Edit broadcast" : "New broadcast"}
            </DialogTitle>
            <DialogDescription className="text-[12.5px] text-ink-3">
              Saved as a draft or scheduled for a time inside the window.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 px-5 py-5">
            <Field label="Reel" hint="Only its commenters are eligible.">
              {reels.error ? (
                <ErrorNotice
                  message={reels.error.message}
                  detail={reels.error.code}
                  onRetry={() => void reels.refresh()}
                />
              ) : (
                <select
                  value={draft?.mediaId ?? ""}
                  onChange={(event) =>
                    setDraft((current) =>
                      current ? { ...current, mediaId: event.target.value } : current
                    )
                  }
                  className={inputCls}
                >
                  <option value="">Select a Reel</option>
                  {reels.data.map((reel) => (
                    <option key={reel.id} value={reel.id}>
                      {reel.caption?.slice(0, 60) || reel.permalink}
                    </option>
                  ))}
                </select>
              )}
            </Field>

            <Field label="Format">
              <select
                value={draft?.kind ?? "text"}
                onChange={(event) =>
                  setDraft((current) =>
                    current
                      ? { ...current, kind: event.target.value as "text" | "card" }
                      : current
                  )
                }
                className={inputCls}
              >
                <option value="text">Plain text</option>
                <option value="card">Card with buttons</option>
              </select>
            </Field>

            {draft?.kind === "text" ? (
              <Field label="Message" hint="Up to 1,000 characters.">
                <textarea
                  value={draft?.text ?? ""}
                  onChange={(event) =>
                    setDraft((current) =>
                      current ? { ...current, text: event.target.value.slice(0, 1000) } : current
                    )
                  }
                  rows={4}
                  className={cn(inputCls, "resize-none")}
                />
              </Field>
            ) : (
              <>
                <Field label="Card title" hint="Max 80 characters.">
                  <input
                    value={draft?.cardTitle ?? ""}
                    onChange={(event) =>
                      setDraft((current) =>
                        current ? { ...current, cardTitle: event.target.value } : current
                      )
                    }
                    maxLength={80}
                    className={inputCls}
                  />
                </Field>
                <Field label="Subtitle" hint="Optional.">
                  <input
                    value={draft?.cardSubtitle ?? ""}
                    onChange={(event) =>
                      setDraft((current) =>
                        current ? { ...current, cardSubtitle: event.target.value } : current
                      )
                    }
                    maxLength={80}
                    className={inputCls}
                  />
                </Field>

                <div>
                  <p className="caption mb-2">Buttons</p>
                  <div className="space-y-2">
                    {(draft?.buttons ?? []).map((button, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          value={button.title}
                          onChange={(event) =>
                            setDraft((current) =>
                              current
                                ? {
                                    ...current,
                                    buttons: current.buttons.map((item, position) =>
                                      position === index
                                        ? { ...item, title: event.target.value }
                                        : item
                                    ),
                                  }
                                : current
                            )
                          }
                          placeholder="Open the offer"
                          maxLength={20}
                          className={cn(inputCls, "flex-1")}
                        />
                        <input
                          value={button.url}
                          onChange={(event) =>
                            setDraft((current) =>
                              current
                                ? {
                                    ...current,
                                    buttons: current.buttons.map((item, position) =>
                                      position === index
                                        ? { ...item, url: event.target.value }
                                        : item
                                    ),
                                  }
                                : current
                            )
                          }
                          placeholder="https://…"
                          className={cn(inputCls, "flex-1 font-mono text-[12px]")}
                        />
                        {(draft?.buttons.length ?? 0) > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              setDraft((current) =>
                                current
                                  ? {
                                      ...current,
                                      buttons: current.buttons.filter(
                                        (_, position) => position !== index
                                      ),
                                    }
                                  : current
                              )
                            }
                            aria-label="Remove button"
                            className="grid size-8 shrink-0 place-items-center rounded-md text-ink-3 hover:bg-surface-2 hover:text-bad"
                          >
                            <Trash2 className="size-3.5" aria-hidden />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  {(draft?.buttons.length ?? 0) < 3 && (
                    <button
                      type="button"
                      onClick={() =>
                        setDraft((current) =>
                          current
                            ? {
                                ...current,
                                buttons: [
                                  ...current.buttons,
                                  { type: "web_url", title: "", url: "" },
                                ],
                              }
                            : current
                        )
                      }
                      className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-line-strong py-2 text-[12.5px] font-medium text-ink-2 hover:border-ink-3 hover:text-ink"
                    >
                      <Plus className="size-3.5" aria-hidden />
                      Add button
                    </button>
                  )}
                </div>
              </>
            )}

            <Field label="Send at" hint="Meta's window is rolling.">
              <input
                type="datetime-local"
                value={draft ? toLocalInput(draft.scheduledAt) : ""}
                onChange={(event) => {
                  const value = event.target.value;
                  const ms = value ? new Date(value).getTime() : Date.now();
                  setDraft((current) =>
                    current ? { ...current, scheduledAt: ms } : current
                  );
                }}
                className={cn(inputCls, "tnum")}
              />
            </Field>

            <div className="flex items-center justify-between gap-4 rounded-lg border border-line bg-surface-2 px-4 py-3">
              <div>
                <p className="text-[13px] font-semibold text-ink">HUMAN_AGENT tag</p>
                <p className="mt-0.5 text-[12px] text-ink-3">
                  Extends the window to 7 days once Meta approves the tag.
                </p>
              </div>
              <Switch
                checked={draft?.usesHumanAgentTag ?? false}
                onCheckedChange={(usesHumanAgentTag) =>
                  setDraft((current) =>
                    current ? { ...current, usesHumanAgentTag } : current
                  )
                }
              />
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-lg border border-bad/30 bg-bad-wash px-3.5 py-2.5 text-[12.5px] text-bad"
              >
                {error}
              </p>
            )}
          </div>

          <div className="sticky bottom-0 flex items-center justify-end gap-2 border-t border-line/60 bg-surface/92 px-5 py-4 backdrop-blur-2xl">
            <Button variant="outline" onClick={() => setDraft(null)}>
              Cancel
            </Button>
            <Button variant="signal" onClick={() => void submit()} disabled={saving}>
              {saving && <Loader2 className="size-3.5 animate-spin" aria-hidden />}
              {saving ? "Saving" : draft?.id ? "Save changes" : "Save broadcast"}
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

interface ProductDraft {
  id?: string;
  name: string;
  priceText: string;
  description: string;
  link: string;
  imageUrl: string;
  isActive: boolean;
}

const emptyProduct: ProductDraft = {
  name: "",
  priceText: "",
  description: "",
  link: "",
  imageUrl: "",
  isActive: true,
};

export function ProductsView() {
  const { account, plan, limits, products, saveProduct, deleteProduct } = useRelo();
  const [draft, setDraft] = useState<ProductDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    if (draft === null) setError(null);
  }, [draft]);

  if (!limits.products) {
    return (
      <LockedNotice
        feature="Offers"
        plan={plan}
        message="Keep your prices, descriptions and buy links in one place so AI replies and your bio page can reference them."
        onUpgrade={() => {
          window.location.hash = "#/studio/settings";
        }}
      />
    );
  }

  const openEdit = (product: Product) => {
    setDraft({
      id: product.id,
      name: product.name,
      priceText: product.priceText ?? "",
      description: product.description ?? "",
      link: product.link ?? "",
      imageUrl: product.imageUrl ?? "",
      isActive: product.isActive,
    });
  };

  const submit = async () => {
    if (!draft || !account) return;
    if (!draft.name.trim()) {
      setError("A product needs a name.");
      return;
    }
    if (draft.link && !isHttpUrl(draft.link)) {
      setError("Buy links must start with http:// or https://.");
      return;
    }
    if (draft.imageUrl && !isHttpUrl(draft.imageUrl)) {
      setError("Image URLs must start with http:// or https://.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await saveProduct({
        id: draft.id,
        accountId: account.id,
        name: draft.name.trim(),
        priceText: draft.priceText.trim() || undefined,
        description: draft.description.trim() || undefined,
        link: draft.link.trim() || undefined,
        imageUrl: draft.imageUrl.trim() || undefined,
        isActive: draft.isActive,
      });
      toast.success(draft.id ? "Offer updated" : "Offer saved");
      setDraft(null);
    } catch (caught) {
      setError(api.errorMessage(caught));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (product: Product) => {
    try {
      await deleteProduct(product.id);
      setConfirmDelete(null);
      toast.success("Offer deleted");
    } catch (caught) {
      toast.error(api.errorMessage(caught));
    }
  };

  return (
    <div className="space-y-6">
      <ViewHead
        title="Offers & links"
        sub="Your catalog. Every offer here can be attached to a bio-page block, and it is the source of truth when a DM answers a price question."
      >
        <Button variant="signal" onClick={() => setDraft(emptyProduct)} disabled={!account}>
          <Plus className="size-4" strokeWidth={1.75} aria-hidden />
          New offer
        </Button>
      </ViewHead>

      {products.loading && products.data.length === 0 ? (
        <LoadingBlock label="Loading offers" />
      ) : products.error ? (
        <ErrorNotice
          message={products.error.message}
          detail={products.error.code}
          onRetry={() => void products.refresh()}
        />
      ) : products.data.length === 0 ? (
        <EmptyState
          title="No offers yet"
          sub="Add the thing you actually sell: a template pack, a course, a session. A price and a link are enough to start."
        >
          <Button variant="signal" onClick={() => setDraft(emptyProduct)}>
            <Plus className="size-4" strokeWidth={1.75} aria-hidden />
            Add the first offer
          </Button>
        </EmptyState>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {products.data.map((product) => (
            <article key={product.id} className="glass-card flex flex-col rounded-2xl p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="line-clamp-2 text-[14px] font-semibold leading-5 text-ink">
                    {product.name}
                  </h3>
                  {product.priceText && (
                    <p className="mt-1 font-mono text-[12.5px] text-ink-2 tnum">
                      {product.priceText}
                    </p>
                  )}
                </div>
                <StatusPill status={product.isActive ? "active" : "paused"} />
              </div>

              <p className="mt-4 line-clamp-3 flex-1 border-t border-line pt-4 text-[13px] leading-relaxed text-ink-2">
                {product.description || "No description yet."}
              </p>

              <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-3">
                {product.link ? (
                  <a
                    href={product.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-w-0 items-center gap-1 text-[12px] font-semibold text-signal underline underline-offset-2 hover:text-signal-hover"
                  >
                    <span className="truncate">Open link</span>
                    <ExternalLink className="size-3.5 shrink-0" aria-hidden />
                  </a>
                ) : (
                  <span className="font-mono text-[11.5px] text-ink-3">No link</span>
                )}

                <div className="flex shrink-0 items-center gap-1">
                  {confirmDelete === product.id ? (
                    <>
                      <button
                        type="button"
                        onClick={() => void remove(product)}
                        className="rounded-md bg-bad px-2 py-1 text-[11.5px] font-semibold text-bad-ink"
                      >
                        Delete
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(null)}
                        className="rounded-md border border-line px-2 py-1 text-[11.5px] font-semibold text-ink-2"
                      >
                        Keep
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => openEdit(product)}
                        aria-label={`Edit ${product.name}`}
                        className={rowAction}
                      >
                        <Pencil className="size-3.5" strokeWidth={1.75} aria-hidden />
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(product.id)}
                        aria-label={`Delete ${product.name}`}
                        className={rowActionDanger}
                      >
                        <Trash2 className="size-3.5" strokeWidth={1.75} aria-hidden />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <Dialog open={draft !== null} onOpenChange={(next) => (!next ? setDraft(null) : undefined)}>
        <DialogContent className="max-h-[90vh] gap-0 overflow-y-auto rounded-2xl border-line/60 bg-surface/90 p-0 shadow-[var(--sh-3)] backdrop-blur-2xl sm:max-w-lg">
          <DialogHeader className="border-b border-line/60 px-5 py-4">
            <DialogTitle className="h4 text-ink">
              {draft?.id ? "Edit offer" : "New offer"}
            </DialogTitle>
            <DialogDescription className="text-[12.5px] text-ink-3">
              Stored on your account. Nothing is published publicly until you add
              it to a bio page.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 px-5 py-5">
            <Field label="Name" hint="Max 120 characters.">
              <input
                value={draft?.name ?? ""}
                onChange={(event) =>
                  setDraft((current) =>
                    current ? { ...current, name: event.target.value } : current
                  )
                }
                maxLength={120}
                className={inputCls}
              />
            </Field>
            <Field label="Price" hint="Shown as written, e.g. ₹1,499.">
              <input
                value={draft?.priceText ?? ""}
                onChange={(event) =>
                  setDraft((current) =>
                    current ? { ...current, priceText: event.target.value } : current
                  )
                }
                maxLength={60}
                className={cn(inputCls, "tnum")}
              />
            </Field>
            <Field label="Description" hint="Optional, 500 characters.">
              <textarea
                value={draft?.description ?? ""}
                onChange={(event) =>
                  setDraft((current) =>
                    current ? { ...current, description: event.target.value } : current
                  )
                }
                maxLength={500}
                rows={3}
                className={cn(inputCls, "resize-none")}
              />
            </Field>
            <Field label="Buy link" hint="Optional, http(s) only.">
              <input
                value={draft?.link ?? ""}
                onChange={(event) =>
                  setDraft((current) =>
                    current ? { ...current, link: event.target.value } : current
                  )
                }
                placeholder="https://yourshop.in/pack"
                className={cn(inputCls, "font-mono text-[12.5px]")}
              />
            </Field>
            <Field label="Image URL" hint="Optional.">
              <input
                value={draft?.imageUrl ?? ""}
                onChange={(event) =>
                  setDraft((current) =>
                    current ? { ...current, imageUrl: event.target.value } : current
                  )
                }
                placeholder="https://…"
                className={cn(inputCls, "font-mono text-[12.5px]")}
              />
            </Field>

            <div className="flex items-center justify-between gap-4 rounded-lg border border-line bg-surface-2 px-4 py-3">
              <div>
                <p className="text-[13px] font-semibold text-ink">Active</p>
                <p className="mt-0.5 text-[12px] text-ink-3">
                  Inactive offers stay out of new bio blocks.
                </p>
              </div>
              <Switch
                checked={draft?.isActive ?? true}
                onCheckedChange={(isActive) =>
                  setDraft((current) => (current ? { ...current, isActive } : current))
                }
              />
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-lg border border-bad/30 bg-bad-wash px-3.5 py-2.5 text-[12.5px] text-bad"
              >
                {error}
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-line/60 px-5 py-4">
            <Button variant="outline" onClick={() => setDraft(null)}>
              Cancel
            </Button>
            <Button variant="signal" onClick={() => void submit()} disabled={saving}>
              {saving && <Loader2 className="size-3.5 animate-spin" aria-hidden />}
              {saving ? "Saving" : draft?.id ? "Save changes" : "Save offer"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Panel title="What counts as an offer">
        <p className="text-[12.5px] leading-relaxed text-ink-3">
          A product is a row in your catalog with an optional buy link. RELO does
          not process payments and does not track product clicks; click tracking
          lives on the short links attached to DM buttons.
        </p>
      </Panel>
    </div>
  );
}
