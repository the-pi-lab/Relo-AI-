"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Copy,
  Loader2,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import * as api from "@/lib/relo/api";
import { useRelo } from "@/lib/relo/store";
import {
  fmtNum,
  uid,
  type LinkPageSnapshot,
  type LinkTheme,
} from "@/lib/relo/data";
import { APP_URL } from "@/lib/relo/config";
import {
  ErrorNotice,
  Field,
  LoadingBlock,
  LockedNotice,
  Panel,
  ViewHead,
  inputCls,
} from "./studio-ui";
import { Button } from "../chrome";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";

/* the flow editor lives in its own module, it carries the room */
export { CanvasView } from "./flow-canvas";

/* ══════════════════════════════════════════════════════════════════════
   LINK IN BIO
   ═════════════════════════════════════════════════════════════════════ */

interface BlockDraft {
  key: string;
  label: string;
  targetUrl: string;
  productId?: string;
  /** lifetime clicks reported by the Worker; read-only here */
  clickCount: number;
}

interface BioDraft {
  headline: string;
  bio: string;
  slug: string;
  theme: LinkTheme;
  isPublished: boolean;
  blocks: BlockDraft[];
}

/** Mirrors `THEMES` in backend/src/api/linkPageHtml.ts, so the preview is the
 *  page a visitor actually gets. Deliberately literal: the studio theme must
 *  not repaint the customer's public page. */
const PREVIEW_THEME: Record<
  LinkTheme,
  { bg: string; card: string; text: string; muted: string; ring: string }
> = {
  volt: { bg: "#f7f8fa", card: "#ffffff", text: "#0f1115", muted: "#4b5563", ring: "#c9f94e" },
  plain: { bg: "#ffffff", card: "#f7f8fa", text: "#0f1115", muted: "#8a919e", ring: "#e7e9ee" },
  dark: { bg: "#0b0d12", card: "#12151c", text: "#e6e8ef", muted: "#9aa3b2", ring: "#c9f94e" },
};

const THEME_LABEL: Record<LinkTheme, string> = {
  volt: "Lime",
  plain: "Paper",
  dark: "Ink",
};

const isHttpUrl = (value: string) => /^https?:\/\/[^\s"'<>]+$/i.test(value.trim());

const fromSnapshot = (snapshot: LinkPageSnapshot): BioDraft => ({
  headline: snapshot.page?.headline ?? "",
  bio: snapshot.page?.bio ?? "",
  slug: snapshot.page?.slug ?? "",
  theme: snapshot.page?.theme ?? "volt",
  isPublished: snapshot.page?.isPublished ?? false,
  blocks: snapshot.blocks.map((block) => ({
    key: block.id,
    label: block.label,
    targetUrl: block.targetUrl,
    productId: block.productId,
    clickCount: block.clickCount,
  })),
});

export function BioView() {
  const { account, plan, limits, linkPage, saveLinkPage } = useRelo();

  const [draft, setDraft] = useState<BioDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [productToAdd, setProductToAdd] = useState("");

  const snapshot = linkPage.data;
  const lastSnapshot = useRef<LinkPageSnapshot | null>(null);

  useEffect(() => {
    if (!snapshot || snapshot === lastSnapshot.current) return;
    lastSnapshot.current = snapshot;
    setDraft(fromSnapshot(snapshot));
  }, [snapshot]);

  if (!limits.products) {
    return (
      <LockedNotice
        feature="Link in bio"
        plan={plan}
        message="Put your offers behind one link, and count the clicks. The bio page is part of Pro and Studio."
        onUpgrade={() => {
          window.location.hash = "#/studio/settings";
        }}
      />
    );
  }

  if (!draft) {
    if (linkPage.loading) return <LoadingBlock label="Loading your bio page" />;
    if (linkPage.error) {
      return (
        <ErrorNotice
          message={linkPage.error.message}
          detail={linkPage.error.code}
          onRetry={() => void linkPage.refresh()}
        />
      );
    }
    return <LoadingBlock label="Preparing the editor" />;
  }

  const availableProducts = snapshot?.products ?? [];
  const publicUrl = snapshot?.publicUrl ?? null;
  const previewUrl = publicUrl ?? `${APP_URL || "https://relo.ai"}/p/…`;
  const totalClicks = draft.blocks.reduce((sum, block) => sum + block.clickCount, 0);

  const set = (patch: Partial<BioDraft>) => {
    setDraft((current) => (current ? { ...current, ...patch } : current));
    setError(null);
  };

  const setBlock = (key: string, patch: Partial<BlockDraft>) =>
    set({
      blocks: draft.blocks.map((block) =>
        block.key === key ? { ...block, ...patch } : block
      ),
    });

  const moveBlock = (key: string, direction: -1 | 1) => {
    const from = draft.blocks.findIndex((block) => block.key === key);
    const to = from + direction;
    if (from < 0 || to < 0 || to >= draft.blocks.length) return;
    const next = [...draft.blocks];
    [next[from], next[to]] = [next[to], next[from]];
    set({ blocks: next });
  };

  const addEmptyBlock = () =>
    set({
      blocks: [
        ...draft.blocks,
        { key: uid("block"), label: "", targetUrl: "https://", clickCount: 0 },
      ],
    });

  const addProductBlock = (productId: string) => {
    const product = availableProducts.find((item) => item.id === productId);
    if (!product) return;
    if (draft.blocks.some((block) => block.productId === productId)) {
      setError(`“${product.name}” is already on the page.`);
      return;
    }
    set({
      blocks: [
        ...draft.blocks,
        {
          key: uid("block"),
          label: product.name.slice(0, 60),
          targetUrl: product.link ?? "",
          productId: product.id,
          clickCount: 0,
        },
      ],
    });
    setProductToAdd("");
  };

  const submit = async () => {
    if (draft.blocks.length > 20) {
      setError("A link page holds up to 20 blocks.");
      return;
    }

    const blocks = draft.blocks
      .filter((block) => block.label.trim())
      .map((block) => ({
        label: block.label.trim(),
        targetUrl: block.targetUrl.trim(),
        productId: block.productId,
      }));

    for (const block of blocks) {
      if (block.productId) continue;
      if (!isHttpUrl(block.targetUrl)) {
        setError(`“${block.label}” needs a link that starts with http:// or https://.`);
        return;
      }
    }

    if (draft.isPublished && blocks.length === 0) {
      setError("Add at least one block before you publish.");
      return;
    }

    if (draft.slug && !/^[a-z0-9_-]+$/.test(draft.slug)) {
      setError("The custom address can only use letters, numbers, hyphens and underscores.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const savedUrl = await saveLinkPage({
        slug: draft.slug.trim() || undefined,
        headline: draft.headline.trim() || undefined,
        bio: draft.bio.trim() || undefined,
        theme: draft.theme,
        isPublished: draft.isPublished,
        blocks,
      });
      toast.success(draft.isPublished ? "Bio page is live" : "Bio page saved as a draft", {
        description: draft.isPublished ? savedUrl : "Publish when you are ready.",
      });
    } catch (caught) {
      setError(api.errorMessage(caught));
    } finally {
      setSaving(false);
    }
  };

  const copyUrl = async () => {
    if (!publicUrl) {
      setError("Save the page first, then copy its public address.");
      return;
    }
    try {
      await navigator.clipboard.writeText(publicUrl);
      toast.success("Public link copied");
    } catch {
      setError("Your browser blocked the clipboard. Copy the address from the field instead.");
    }
  };

  const theme = PREVIEW_THEME[draft.theme];
  const headline = draft.headline.trim() || "Your headline";
  const handle = account?.username ? `@${account.username}` : "@yourhandle";

  return (
    <div className="space-y-6">
      <ViewHead
        title="Link in bio"
        sub="One public page for everything you sell. Blocks can point at an offer so clicks are counted alongside your DM buttons."
      >
        <Button variant="outline" size="sm" onClick={() => void copyUrl()}>
          <Copy className="size-3.5" strokeWidth={1.75} aria-hidden />
          Copy public link
        </Button>
        <Button variant="signal" onClick={() => void submit()} disabled={saving}>
          {saving ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <Save className="size-4" strokeWidth={1.75} aria-hidden />
          )}
          {draft.isPublished ? "Save & keep live" : "Save draft"}
        </Button>
      </ViewHead>

      {error && <ErrorNotice message={error} />}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <Panel title="Page" bodyClassName="space-y-5">
            <Field label="Headline" hint="Max 120 characters">
              <input
                value={draft.headline}
                onChange={(event) => set({ headline: event.target.value.slice(0, 120) })}
                placeholder="Aarav makes things"
                className={inputCls}
              />
            </Field>

            <Field label="Intro" hint="Optional, 500 characters">
              <textarea
                value={draft.bio}
                onChange={(event) => set({ bio: event.target.value.slice(0, 500) })}
                rows={3}
                placeholder="Templates, teardowns and the occasional build log."
                className={cn(inputCls, "resize-none")}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Custom address" hint="Optional">
                <div className="flex items-center gap-1">
                  <span className="shrink-0 font-mono text-[11.5px] text-ink-3">/p/</span>
                  <input
                    value={draft.slug}
                    onChange={(event) =>
                      set({
                        slug: event.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9_-]/g, "")
                          .slice(0, 60),
                      })
                    }
                    placeholder="aarav"
                    className={cn(inputCls, "font-mono text-[12.5px]")}
                  />
                </div>
              </Field>

              <Field label="Theme">
                <div className="flex gap-1.5">
                  {(Object.keys(THEME_LABEL) as LinkTheme[]).map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => set({ theme: option })}
                      aria-pressed={draft.theme === option}
                      className={cn(
                        "flex-1 rounded-md border px-2 py-2 text-[12px] font-semibold transition-colors duration-150",
                        draft.theme === option
                          ? "border-signal bg-signal-wash text-signal"
                          : "border-line text-ink-3 hover:border-ink-3 hover:text-ink"
                      )}
                    >
                      {THEME_LABEL[option]}
                    </button>
                  ))}
                </div>
              </Field>
            </div>

            <div className="flex items-center justify-between gap-4 border-t border-line pt-5">
              <div className="min-w-0">
                <p className="text-[13.5px] font-semibold text-ink">Published</p>
                <p className="mt-0.5 break-all font-mono text-[11.5px] text-ink-3">
                  {previewUrl}
                </p>
              </div>
              <Switch
                checked={draft.isPublished}
                onCheckedChange={(isPublished) => set({ isPublished })}
                aria-label="Publish link page"
              />
            </div>
          </Panel>

          <Panel
            title="Blocks"
            actions={<span className="caption tnum">{fmtNum(totalClicks)} total clicks</span>}
            bodyClassName="p-0"
          >
            {draft.blocks.length === 0 ? (
              <p className="px-5 py-10 text-center text-[13px] text-ink-3">
                No blocks yet. Add one from your offers, or point a block at any
                link you want to share.
              </p>
            ) : (
              <ol className="divide-y divide-line">
                {draft.blocks.map((block, index) => {
                  const product = availableProducts.find(
                    (item) => item.id === block.productId
                  );
                  return (
                    <li key={block.key} className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className="w-5 shrink-0 font-mono text-[11px] text-ink-3 tnum">
                          {String(index + 1).padStart(2, "0")}
                        </span>

                        <div className="min-w-0 flex-1 space-y-1.5">
                          <input
                            value={block.label}
                            onChange={(event) =>
                              setBlock(block.key, {
                                label: event.target.value.slice(0, 60),
                              })
                            }
                            aria-label={`Label for block ${index + 1}`}
                            placeholder="Block label"
                            className={cn(inputCls, "py-1.5 text-[13px]")}
                          />

                          {product ? (
                            <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 px-0.5 text-[11.5px] text-ink-3">
                              <span className="rounded border border-line bg-surface-2 px-1.5 py-0.5 font-semibold text-ink-2">
                                Offer
                              </span>
                              <span className="truncate">{product.name}</span>
                              {product.priceText && (
                                <span className="font-mono tnum">{product.priceText}</span>
                              )}
                              {!product.link && (
                                <span className="text-warn">
                                  needs a buy link on the offer
                                </span>
                              )}
                            </p>
                          ) : (
                            <input
                              value={block.targetUrl}
                              onChange={(event) =>
                                setBlock(block.key, { targetUrl: event.target.value })
                              }
                              aria-label={`Destination for block ${index + 1}`}
                              placeholder="https://…"
                              className={cn(
                                inputCls,
                                "py-1.5 font-mono text-[11.5px]"
                              )}
                            />
                          )}
                        </div>

                        <span className="hidden w-16 shrink-0 text-right font-mono text-[11px] text-ink-3 tnum sm:block">
                          {fmtNum(block.clickCount)}
                        </span>

                        <div className="flex shrink-0 items-center gap-0.5">
                          <button
                            type="button"
                            onClick={() => moveBlock(block.key, -1)}
                            disabled={index === 0}
                            aria-label="Move block up"
                            className="grid size-7 place-items-center rounded-md text-ink-3 transition-colors hover:bg-surface-2 hover:text-ink disabled:pointer-events-none disabled:opacity-30"
                          >
                            <ArrowUp className="size-3.5" aria-hidden />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveBlock(block.key, 1)}
                            disabled={index === draft.blocks.length - 1}
                            aria-label="Move block down"
                            className="grid size-7 place-items-center rounded-md text-ink-3 transition-colors hover:bg-surface-2 hover:text-ink disabled:pointer-events-none disabled:opacity-30"
                          >
                            <ArrowDown className="size-3.5" aria-hidden />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              set({
                                blocks: draft.blocks.filter(
                                  (item) => item.key !== block.key
                                ),
                              })
                            }
                            aria-label="Remove block"
                            className="grid size-7 place-items-center rounded-md text-ink-3 transition-colors hover:bg-bad-wash hover:text-bad"
                          >
                            <Trash2 className="size-3.5" aria-hidden />
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}

            <div className="flex flex-wrap items-center gap-2 border-t border-line p-4">
              <Button variant="outline" size="sm" onClick={addEmptyBlock}>
                <Plus className="size-3.5" strokeWidth={1.75} aria-hidden />
                Empty block
              </Button>

              {availableProducts.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <select
                    value={productToAdd}
                    onChange={(event) => setProductToAdd(event.target.value)}
                    aria-label="Choose an offer to add"
                    className={cn(inputCls, "h-8 w-[190px] py-0 text-[12.5px]")}
                  >
                    <option value="">Add an offer…</option>
                    {availableProducts.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={!productToAdd}
                    onClick={() => addProductBlock(productToAdd)}
                  >
                    <Plus className="size-3.5" strokeWidth={1.75} aria-hidden />
                    Add
                  </Button>
                </div>
              )}

              {availableProducts.length === 0 && (
                <span className="text-[12px] text-ink-3">
                  Add an offer first to link one here.
                </span>
              )}
            </div>
          </Panel>
        </div>

        {/* phone preview */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="mx-auto w-[300px]">
            <div className="glass-strong overflow-hidden rounded-[26px] p-2">
              <div
                className="overflow-hidden rounded-[18px]"
                style={{ background: theme.bg, color: theme.text }}
              >
                <div
                  className="flex items-center justify-between gap-3 border-b px-4 py-2.5"
                  style={{ borderColor: theme.ring }}
                >
                  <span className="inline-flex min-w-0 items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.14em]">
                    <span
                      className="size-1.5 shrink-0 rounded-full"
                      style={{ background: theme.ring }}
                      aria-hidden
                    />
                    <span className="truncate">/p/{draft.slug || "yourpage"}</span>
                  </span>
                  <span
                    className="shrink-0 font-mono text-[9px] uppercase tracking-[0.14em]"
                    style={{ color: theme.muted }}
                  >
                    {draft.isPublished ? "live" : "draft"}
                  </span>
                </div>

                <div className="min-h-[452px] px-5 py-7">
                  <p
                    className="text-center text-[10.5px] font-bold uppercase tracking-[0.08em]"
                    style={{ color: theme.muted }}
                  >
                    {handle}
                  </p>
                  <p className="mt-2.5 text-center text-[19px] font-bold leading-tight tracking-[-0.02em]">
                    {headline}
                  </p>
                  {draft.bio && (
                    <p
                      className="mx-auto mt-2 max-w-[236px] whitespace-pre-line text-center text-[11.5px] leading-relaxed"
                      style={{ color: theme.muted }}
                    >
                      {draft.bio}
                    </p>
                  )}

                  <div className="mt-6 space-y-2.5">
                    {draft.blocks
                      .filter((block) => block.label.trim())
                      .map((block) => (
                        <div
                          key={block.key}
                          className="px-4 py-3 text-center text-[12px] font-semibold"
                          style={{
                            background: theme.card,
                            border: `1px solid ${theme.ring}`,
                            borderRadius: 12,
                            color: theme.text,
                          }}
                        >
                          {block.label}
                        </div>
                      ))}
                  </div>

                  {draft.blocks.filter((block) => block.label.trim()).length === 0 && (
                    <p
                      className="mt-6 text-center text-[11px]"
                      style={{ color: theme.muted }}
                    >
                      Blocks appear here.
                    </p>
                  )}

                  <p
                    className="mt-7 text-center text-[9.5px]"
                    style={{ color: theme.muted }}
                  >
                    Made with RELO
                  </p>
                </div>
              </div>
            </div>
            <p className="caption mt-3 text-center">Preview · {THEME_LABEL[draft.theme]}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
