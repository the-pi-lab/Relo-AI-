"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Copy, ExternalLink, Link2, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";
import { useRelo } from "@/lib/relo/store";
import { fmtNum, uid } from "@/lib/relo/data";
import { ViewHead, Field, inputCls } from "./studio-ui";
import { RButton } from "../chrome";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";

/* the flow editor lives in its own module — it carries the room */
export { CanvasView } from "./flow-canvas";

/* ═══════════════ LINK IN BIO ═══════════════ */

const THEME_META = {
  volt: { name: "Nova", bg: "linear-gradient(160deg,#a99dff 0%,#7366ec 55%,#3d2f8f 100%)", text: "#f2f0fb", btn: "rgba(255,255,255,0.92)", btnText: "#1d1a16" },
  plain: { name: "Bone", bg: "#f2f0fb", text: "#171523", btn: "#171523", btnText: "#f2f0fb" },
  dark: { name: "Void", bg: "linear-gradient(170deg,#0d0b16,#1b1930)", text: "#eceaf6", btn: "rgba(255,255,255,0.08)", btnText: "#eceaf6" },
} as const;

export function BioView() {
  const { linkPage, products, saveLinkPage } = useRelo();
  const [draft, setDraft] = useState(() => structuredClone(linkPage));
  const set = (patch: Partial<typeof draft>) => setDraft((d) => ({ ...d, ...patch }));

  const save = () => {
    saveLinkPage(draft);
    toast.success(draft.isPublished ? "Link page live — go update that bio 🔗" : "Link page saved as draft");
  };

  const totalClicks = draft.blocks.reduce((a, b) => a + b.clickCount, 0);
  const theme = THEME_META[draft.theme];

  return (
    <div className="space-y-6">
      <ViewHead
        title="Link in bio"
        sub="One link for everything you sell. Blocks can bind to products for click tracking."
      >
        <RButton variant="ghost" size="sm" onClick={() => {
          navigator.clipboard?.writeText(`https://relo.page/${draft.slug}`);
          toast.success("Public link copied");
        }}>
          <Copy className="size-4" /> relo.page/{draft.slug}
        </RButton>
        <RButton onClick={save}>
          <Eye className="size-4" /> {draft.isPublished ? "Save & keep live" : "Publish"}
        </RButton>
      </ViewHead>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* editor */}
        <div className="space-y-4">
          <div className="rounded-3xl border border-line bg-card p-5 shadow-[var(--shadow-soft)] sm:p-6">
            <Field label="Headline">
              <input value={draft.headline} onChange={(e) => set({ headline: e.target.value })} className={inputCls} />
            </Field>
            <div className="mt-4">
              <Field label="Bio">
                <textarea
                  value={draft.bio}
                  onChange={(e) => set({ bio: e.target.value })}
                  rows={2}
                  className={cn(inputCls, "resize-none")}
                />
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
                  {(Object.keys(THEME_META) as Array<keyof typeof THEME_META>).map((t) => (
                    <button
                      key={t}
                      onClick={() => set({ theme: t })}
                      className={cn(
                        "flex-1 rounded-xl border px-2 py-2.5 text-[11.5px] font-medium transition-all",
                        draft.theme === t ? "border-ember/60 shadow-[var(--shadow-soft)]" : "border-line"
                      )}
                      style={{ background: THEME_META[t].bg, color: THEME_META[t].text }}
                    >
                      {THEME_META[t].name}
                    </button>
                  ))}
                </div>
              </Field>
            </div>
            <div className="mt-4 flex items-center justify-between rounded-2xl bg-card-soft px-4 py-3">
              <div>
                <p className="text-[13px] font-semibold">Published</p>
                <p className="text-[11.5px] text-ink-3">visible at relo.page/{draft.slug}</p>
              </div>
              <Switch checked={draft.isPublished} onCheckedChange={(isPublished) => set({ isPublished })} />
            </div>
          </div>

          <div className="rounded-3xl border border-line bg-card p-5 shadow-[var(--shadow-soft)] sm:p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-[16px] font-bold">Blocks</h3>
              <span className="font-mono text-[10.5px] text-ink-4">{fmtNum(totalClicks)} total clicks</span>
            </div>
            <div className="mt-4 space-y-2">
              {draft.blocks.map((b) => (
                <motion.div
                  key={b.id}
                  layout
                  className="flex items-center gap-3 rounded-2xl border border-line bg-card-soft px-4 py-3"
                >
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-ember/10 font-mono text-[11px] font-bold text-ember">
                    {fmtNum(b.clickCount)}
                  </span>
                  <input
                    value={b.label}
                    onChange={(e) =>
                      set({ blocks: draft.blocks.map((x) => (x.id === b.id ? { ...x, label: e.target.value } : x)) })
                    }
                    className="min-w-0 flex-1 bg-transparent text-[13.5px] font-medium outline-none"
                  />
                  <button
                    onClick={() => window.open(b.targetUrl, "_blank")}
                    className="grid size-7 place-items-center rounded-lg text-ink-4 "
                    aria-label="Open block link"
                  >
                    <ExternalLink className="size-3.5" />
                  </button>
                  <Switch
                    checked={b.isActive}
                    onCheckedChange={(isActive) =>
                      set({ blocks: draft.blocks.map((x) => (x.id === b.id ? { ...x, isActive } : x)) })
                    }
                    aria-label="Toggle block"
                  />
                  <button
                    onClick={() => set({ blocks: draft.blocks.filter((x) => x.id !== b.id) })}
                    className="grid size-7 place-items-center rounded-lg text-ink-4 "
                    aria-label="Remove block"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </motion.div>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() =>
                  set({
                    blocks: [
                      ...draft.blocks,
                      { id: uid("lb"), label: "New block", targetUrl: "https://", clickCount: 0, isActive: true },
                    ],
                  })
                }
                className="rounded-xl border border-dashed border-line-strong px-4 py-2.5 text-[12.5px] font-medium text-ink-3 transition-colors "
              >
                + empty block
              </button>
              {products.slice(0, 2).map((p) => (
                <button
                  key={p.id}
                  onClick={() =>
                    set({
                      blocks: [
                        ...draft.blocks,
                        {
                          id: uid("lb"),
                          label: p.name,
                          targetUrl: p.link ?? "https://",
                          productId: p.id,
                          clickCount: 0,
                          isActive: true,
                        },
                      ],
                    })
                  }
                  className="rounded-xl border border-dashed border-line-strong px-4 py-2.5 text-[12.5px] font-medium text-ink-3 transition-colors "
                >
                  + from products: {p.name.split(" ")[0]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* phone preview */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="mx-auto w-[300px] overflow-hidden rounded-[36px] border-[6px] border-ink bg-ink shadow-[var(--shadow-lift)]">
            <div className="flex justify-center pt-2.5">
              <span className="h-5 w-24 rounded-full bg-ink" />
            </div>
            <div className="min-h-[520px] px-4 pt-8 pb-8" style={{ background: theme.bg, color: theme.text }}>
              <div className="grid size-16 place-items-center rounded-full border-2 border-current/20 bg-current/5 mx-auto font-display text-xl font-extrabold">
                a
              </div>
              <p className="mt-3 text-center font-display text-[15px] font-bold leading-snug">{draft.headline}</p>
              <p className="mt-1.5 text-center text-[11px] leading-relaxed opacity-75">{draft.bio}</p>
              <div className="mt-5 space-y-2.5">
                {draft.blocks.filter((b) => b.isActive).map((b, i) => (
                  <motion.div
                    key={b.id}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.07 }}

                    className="rounded-2xl px-4 py-3 text-center text-[12px] font-semibold shadow-sm"
                    style={{ background: theme.btn, color: theme.btnText }}
                  >
                    {b.label}
                  </motion.div>
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
