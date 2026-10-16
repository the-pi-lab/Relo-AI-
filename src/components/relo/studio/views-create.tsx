"use client";

import React, { useState } from "react";
import { Copy, ExternalLink, Eye, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useRelo } from "@/lib/relo/store";
import { fmtNum, uid } from "@/lib/relo/data";
import { ViewHead, Panel, Field, inputCls } from "./studio-ui";
import { Button } from "../chrome";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";

/* the flow editor lives in its own module, it carries the room */
export { CanvasView } from "./flow-canvas";

export function BioView() {
  const { linkPage, products, saveLinkPage } = useRelo();
  const [draft, setDraft] = useState(() => structuredClone(linkPage));
  const set = (patch: Partial<typeof draft>) => setDraft((d) => ({ ...d, ...patch }));

  const save = () => {
    saveLinkPage(draft);
    toast.success(draft.isPublished ? "Link page is live. Update your bio." : "Link page saved as draft.");
  };

  const totalClicks = draft.blocks.reduce((a, b) => a + b.clickCount, 0);

  /* the preview is a stand-alone page, so it keeps its own literal palette
     rather than the studio tokens: switching the studio theme must not
     repaint the customer page. */
  const plain = draft.theme === "plain";
  const screenBg = plain ? "#ffffff" : "#0a0b0f";
  const screenInk = plain ? "#111315" : "#e8eaee";
  const screenLine = plain ? "rgba(17,19,21,0.12)" : "rgba(232,234,238,0.16)";
  const screenDot = plain ? "#16130f" : "#c93a0e";
  const blockBg = plain ? "#111315" : "#c93a0e";
  const blockInk = plain ? "#ffffff" : "#fff4f0";

  return (
    <div className="space-y-6">
      <ViewHead
        title="Link in bio"
        sub="One link for everything you sell. Blocks can bind to products for click tracking."
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            navigator.clipboard?.writeText(`https://relo.page/${draft.slug}`);
            toast.success("Public link copied.");
          }}
        >
          <Copy className="size-4" strokeWidth={1.75} /> relo.page/{draft.slug}
        </Button>
        <Button variant="signal" onClick={save}>
          <Eye className="size-4" strokeWidth={1.75} /> {draft.isPublished ? "Save & keep live" : "Publish"}
        </Button>
      </ViewHead>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* editor */}
        <div className="space-y-6">
          <Panel title="Page" bodyClassName="space-y-5">
            <Field label="Headline">
              <input value={draft.headline} onChange={(e) => set({ headline: e.target.value })} className={inputCls} />
            </Field>

            <Field label="Bio">
              <textarea value={draft.bio} onChange={(e) => set({ bio: e.target.value })} rows={2} className={cn(inputCls, "resize-none")} />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Slug" hint="relo.page/…">
                <input
                  value={draft.slug}
                  onChange={(e) => set({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
                  className={cn(inputCls, "font-mono text-[13px]")}
                />
              </Field>
              <Field label="Theme">
                <div className="flex gap-1.5">
                  {(["plain", "dark"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => set({ theme: t })}
                      className={cn(
                        "flex-1 rounded-md border px-2 py-2 text-[12px] font-semibold transition-colors duration-150 ease-out",
                        draft.theme === t
                          ? "border-signal bg-signal-wash text-signal"
                          : "border-line text-ink-3 hover:border-ink-3 hover:bg-surface-2 hover:text-ink"
                      )}
                    >
                      {t === "plain" ? "Bone" : "Void"}
                    </button>
                  ))}
                </div>
              </Field>
            </div>

            <div className="flex items-center justify-between gap-4 border-t border-line pt-5">
              <div className="min-w-0">
                <p className="text-[13.5px] font-semibold text-ink">Published</p>
                <p className="mt-0.5 text-[12px] text-ink-3">Visible at relo.page/{draft.slug}</p>
              </div>
              <Switch
                checked={draft.isPublished}
                onCheckedChange={(isPublished) => set({ isPublished })}
                className="data-[state=checked]:bg-signal"
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
              <p className="px-5 py-8 text-center text-[13px] text-ink-3">
                No blocks yet. Add an empty block, or bind one to a product so RELO can count its clicks.
              </p>
            ) : (
              <div className="divide-y divide-line">
                {draft.blocks.map((b, i) => (
                  <div
                    key={b.id}
                    className="flex items-center gap-3 px-5 py-2.5 transition-colors duration-150 hover:bg-surface-2"
                  >
                    <span className="w-5 shrink-0 font-mono text-[11.5px] text-ink-3 tnum">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <input
                      value={b.label}
                      onChange={(e) =>
                        set({ blocks: draft.blocks.map((x) => (x.id === b.id ? { ...x, label: e.target.value } : x)) })}
                      aria-label="Block label"
                      className="min-w-0 flex-1 bg-transparent text-[13.5px] font-medium text-ink outline-none"
                    />
                    <span className="hidden shrink-0 font-mono text-[11.5px] text-ink-3 tnum sm:block">
                      {fmtNum(b.clickCount)} clicks
                    </span>
                    <button
                      type="button"
                      onClick={() => window.open(b.targetUrl, "_blank")}
                      className="grid size-7 shrink-0 place-items-center rounded-md text-ink-3 transition-colors hover:bg-surface-3 hover:text-ink"
                      aria-label="Open block link"
                    >
                      <ExternalLink className="size-3.5" strokeWidth={1.75} />
                    </button>
                    <Switch
                      checked={b.isActive}
                      onCheckedChange={(isActive) =>
                        set({ blocks: draft.blocks.map((x) => (x.id === b.id ? { ...x, isActive } : x)) })}
                      className="data-[state=checked]:bg-signal"
                      aria-label="Toggle block"
                    />
                    <button
                      type="button"
                      onClick={() => set({ blocks: draft.blocks.filter((x) => x.id !== b.id) })}
                      className="grid size-7 shrink-0 place-items-center rounded-md text-ink-3 transition-colors hover:bg-surface-3 hover:text-bad"
                      aria-label="Remove block"
                    >
                      <Trash2 className="size-3.5" strokeWidth={1.75} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-wrap gap-2 border-t border-line p-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  set({
                    blocks: [...draft.blocks, { id: uid("lb"), label: "New block", targetUrl: "https://", clickCount: 0, isActive: true }],
                  })
                }
              >
                <Plus className="size-3.5" strokeWidth={1.75} /> Empty block
              </Button>
              {products.slice(0, 2).map((p) => (
                <Button
                  key={p.id}
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    set({
                      blocks: [
                        ...draft.blocks,
                        { id: uid("lb"), label: p.name, targetUrl: p.link ?? "https://", productId: p.id, clickCount: 0, isActive: true },
                      ],
                    })
                  }
                >
                  <Plus className="size-3.5" strokeWidth={1.75} /> {p.name.split(" ")[0]}
                </Button>
              ))}
            </div>
          </Panel>
        </div>

        {/* phone preview */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="mx-auto w-[300px]">
            <div className="overflow-hidden rounded-2xl border border-line bg-surface-3 p-2 shadow-[var(--sh-3)]">
              <div className="overflow-hidden rounded-xl" style={{ background: screenBg, color: screenInk }}>
                {/* hairline header: the public address, and whether it is live */}
                <div
                  className="flex items-center justify-between gap-3 border-b px-4 py-2.5"
                  style={{ borderColor: screenLine }}
                >
                  <span className="inline-flex min-w-0 items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.16em]">
                    <span className="size-1.5 shrink-0 rounded-full" style={{ background: screenDot }} aria-hidden />
                    <span className="truncate">relo.page/{draft.slug}</span>
                  </span>
                  <span className="shrink-0 font-mono text-[9px] uppercase tracking-[0.16em] opacity-55">
                    {draft.isPublished ? "live" : "draft"}
                  </span>
                </div>

                <div className="min-h-[460px] px-5 py-8">
                  <p className="text-center text-[15px] font-bold leading-snug">{draft.headline}</p>
                  <p className="mx-auto mt-1.5 max-w-[232px] text-center text-[11.5px] leading-relaxed opacity-75">
                    {draft.bio}
                  </p>
                  <div className="mt-6 space-y-2.5">
                    {draft.blocks
                      .filter((b) => b.isActive)
                      .map((b) => (
                        <div
                          key={b.id}
                          className="rounded-lg px-4 py-3 text-center text-[12px] font-semibold"
                          style={{ background: blockBg, color: blockInk }}
                        >
                          {b.label}
                        </div>
                      ))}
                  </div>
                  {draft.blocks.filter((b) => b.isActive).length === 0 && (
                    <p className="mt-6 text-center font-mono text-[10px] uppercase tracking-[0.16em] opacity-45">
                      No active blocks
                    </p>
                  )}
                </div>
              </div>
            </div>
            <p className="caption mt-3 text-center">Preview</p>
          </div>
        </div>
      </div>
    </div>
  );
}
