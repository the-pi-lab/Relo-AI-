"use client";

import React, { useState } from "react";
import { Copy, ExternalLink, Eye, Link2 } from "lucide-react";
import { toast } from "sonner";
import { useRelo } from "@/lib/relo/store";
import { fmtNum, uid } from "@/lib/relo/data";
import { ViewHead, Field, inputCls } from "./studio-ui";
import { RButton } from "../chrome";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";

/* the flow editor lives in its own module — it carries the room */
export { CanvasView } from "./flow-canvas";

export function BioView() {
  const { linkPage, products, saveLinkPage } = useRelo();
  const [draft, setDraft] = useState(() => structuredClone(linkPage));
  const set = (patch: Partial<typeof draft>) => setDraft((d) => ({ ...d, ...patch }));

  const save = () => {
    saveLinkPage(draft);
    toast.success(draft.isPublished ? "Link page is live — update your bio." : "Link page saved as draft.");
  };

  const totalClicks = draft.blocks.reduce((a, b) => a + b.clickCount, 0);

  return (
    <div className="space-y-6">
      <ViewHead
        title="Link in bio"
        sub="One link for everything you sell. Blocks can bind to products for click tracking."
      >
        <RButton variant="ghost" size="sm" onClick={() => {
          navigator.clipboard?.writeText(`https://relo.page/${draft.slug}`);
          toast.success("Public link copied.");
        }}>
          <Copy className="size-4" /> relo.page/{draft.slug}
        </RButton>
        <RButton onClick={save}>
          <Eye className="size-4" /> {draft.isPublished ? "Save & keep live" : "Publish"}
        </RButton>
      </ViewHead>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* editor */}
        <div className="space-y-4">
          <section className="rounded-lg border border-border bg-surface p-5 sm:p-6 shadow-sm">
            <Field label="Headline">
              <input value={draft.headline} onChange={(e) => set({ headline: e.target.value })} className={inputCls} />
            </Field>
            <div className="mt-4">
              <Field label="Bio">
                <textarea value={draft.bio} onChange={(e) => set({ bio: e.target.value })} rows={2} className={cn(inputCls, "resize-none")} />
              </Field>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
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
                      onClick={() => set({ theme: t })}
                      className={cn(
                        "flex-1 rounded-lg border px-2 py-2.5 text-[11.5px] font-medium transition-colors",
                        draft.theme === t ? "border-accent bg-accent-wash/40 text-accent" : "border-border text-text-3 hover:text-text"
                      )}
                    >
                      {t === "plain" ? "Bone" : "Void"}
                    </button>
                  ))}
                </div>
              </Field>
            </div>
            <div className="mt-4 flex items-center justify-between rounded-lg bg-surface-2 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-text">Published</p>
                <p className="text-[11px] text-text-3">visible at relo.page/{draft.slug}</p>
              </div>
              <Switch checked={draft.isPublished} onCheckedChange={(isPublished) => set({ isPublished })} />
            </div>
          </section>

          <section className="rounded-lg border border-border bg-surface p-5 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="h4 text-text">Blocks</h3>
              <span className="caption">{fmtNum(totalClicks)} total clicks</span>
            </div>
            <div className="space-y-2">
              {draft.blocks.map((b) => (
                <div key={b.id} className="flex items-center gap-3 rounded-lg border border-border bg-surface-2 px-4 py-3">
                  <span className="grid size-8 shrink-0 place-items-center rounded-md bg-accent-wash text-accent font-bold text-[11px]">
                    {fmtNum(b.clickCount)}
                  </span>
                  <input
                    value={b.label}
                    onChange={(e) =>
                      set({ blocks: draft.blocks.map((x) => (x.id === b.id ? { ...x, label: e.target.value } : x)) })}
                    className="min-w-0 flex-1 bg-transparent text-sm font-medium outline-none"
                  />
                  <button
                    onClick={() => window.open(b.targetUrl, "_blank")}
                    className="size-7 shrink-0 place-items-center rounded-md text-text-3 hover:text-text transition-colors"
                    aria-label="Open block link"
                  >
                    <ExternalLink className="size-3.5" />
                  </button>
                  <Switch checked={b.isActive} onCheckedChange={(isActive) => set({ blocks: draft.blocks.map((x) => (x.id === b.id ? { ...x, isActive } : x)) })} aria-label="Toggle block" />
                  <button
                    onClick={() => set({ blocks: draft.blocks.filter((x) => x.id !== b.id) })}
                    className="size-7 shrink-0 place-items-center rounded-md text-text-3 hover:text-text transition-colors"
                    aria-label="Remove block"
                  >
                    <span className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() =>
                  set({
                    blocks: [...draft.blocks, { id: uid("lb"), label: "New block", targetUrl: "https://", clickCount: 0, isActive: true }],
                  })
                }
                className="rounded-lg border border-dashed border-border px-4 py-2.5 text-sm font-medium text-text-3 hover:text-text transition-colors"
              >
                + Empty block
              </button>
              {products.slice(0, 2).map((p) => (
                <button
                  key={p.id}
                  onClick={() =>
                    set({
                      blocks: [
                        ...draft.blocks,
                        { id: uid("lb"), label: p.name, targetUrl: p.link ?? "https://", productId: p.id, clickCount: 0, isActive: true },
                      ],
                    })
                  }
                  className="rounded-lg border border-dashed border-border px-4 py-2.5 text-sm font-medium text-text-3 hover:text-text transition-colors"
                >
                  + {p.name.split(" ")[0]}
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* phone preview */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="mx-auto w-[300px] overflow-hidden rounded-xl border-[6px] border-text bg-text shadow-lg">
            <div className="flex justify-center pt-2.5">
              <span className="h-5 w-24 rounded-full bg-text/50" />
            </div>
            <div className="min-h-[520px] px-4 pt-8 pb-8" style={{ background: draft.theme === "plain" ? "#ffffff" : "#0a0b0f", color: draft.theme === "plain" ? "#111315" : "#e8eaee" }}>
              <div className="grid size-16 place-items-center rounded-full border-2 border-current/20 bg-current/5 mx-auto font-bold text-xl leading-none">
                R
              </div>
              <p className="mt-3 text-center font-bold text-[15px] leading-snug">{draft.headline}</p>
              <p className="mt-1.5 text-center text-[11px] leading-relaxed opacity-75">{draft.bio}</p>
              <div className="mt-5 space-y-2.5">
                {draft.blocks.filter((b) => b.isActive).map((b, i) => (
                  <div key={b.id} className="rounded-lg px-4 py-3 text-center text-[12px] font-semibold shadow-sm" style={{ background: draft.theme === "plain" ? "#111315" : "#d97706", color: draft.theme === "plain" ? "#ffffff" : "#fefbde" }}>
                    {b.label}
                  </div>
                ))}
              </div>
              <p className="mt-6 flex items-center justify-center gap-1.5 text-center font-mono text-[9px] tracking-[0.2em] uppercase opacity-50">
                <Link2 className="size-2.5" /> relo.page/{draft.slug}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
