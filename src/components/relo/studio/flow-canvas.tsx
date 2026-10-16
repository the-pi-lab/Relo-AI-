"use client";

/**
 * RELO FLOW CANVAS — the automation editor, built native.
 *
 * A working node editor in the n8n lineage, dressed in the observatory:
 *   · pannable / zoomable dotted canvas (scroll = zoom-to-cursor)
 *   · draggable step cards with real input/output ports
 *   · drag-from-port to connect — or the “+” chip to add a wired step
 *   · searchable step library (left), parameter inspector (right)
 *   · Test workflow lights the graph up in execution order
 *   · Save / Active toggle, autosave on leave, Delete / Esc keys
 *
 * No hover effects — everything answers clicks, drags and keys,
 * except the ASCII plates which keep their glyph-resolve.
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  Reply,
  LayoutTemplate,
  Mail,
  Hourglass,
  GitBranch,
  Sparkles,
  StickyNote,
  Plus,
  Search,
  X,
  Trash2,
  Copy,
  Save,
  Play,
  Check,
  Minus,
  Maximize,
  Workflow,
  CircleCheck,
} from "lucide-react";
import { toast } from "sonner";
import { useRelo } from "@/lib/relo/store";
import { uid, type Flow, type FlowNode, type FlowNodeType } from "@/lib/relo/data";
import { Field, inputCls } from "./studio-ui";
import { RButton } from "../chrome";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";

/* ── geometry ─────────────────────────────────────────────────────────── */

const NODE_W = 212;
const NODE_H = 54;
const PORT_Y = 26;
const GRID = 16;
const Z_MIN = 0.35;
const Z_MAX = 2;

const NODE_META: Record<
  FlowNodeType,
  {
    icon: typeof MessageCircle;
    label: string;
    sub: string;
    tile: string;
    group: string;
    hasIn: boolean;
    hasOut: boolean;
  }
> = {
  trigger_comment: {
    icon: MessageCircle, label: "Comment trigger", sub: "A new comment matches a keyword",
    tile: "bg-sky/15 text-sky border-sky/40", group: "Triggers", hasIn: false, hasOut: true,
  },
  action_reply: {
    icon: Reply, label: "Public reply", sub: "Reply publicly to the comment",
    tile: "bg-honey/15 text-honey border-honey/40", group: "Messages", hasIn: true, hasOut: true,
  },
  action_dm_card: {
    icon: LayoutTemplate, label: "DM card", sub: "3-button template card",
    tile: "bg-ember/15 text-ember-deep border-ember/40", group: "Messages", hasIn: true, hasOut: true,
  },
  action_dm_text: {
    icon: Mail, label: "DM text", sub: "Plain text direct message",
    tile: "bg-moss/15 text-moss border-moss/40", group: "Messages", hasIn: true, hasOut: true,
  },
  action_condition: {
    icon: GitBranch, label: "If / branch", sub: "Split the flow on comment text",
    tile: "bg-clay/15 text-clay border-clay/40", group: "Flow", hasIn: true, hasOut: true,
  },
  action_wait: {
    icon: Hourglass, label: "Wait", sub: "Human-paced pause",
    tile: "bg-ink/5 text-ink-3 border-line-strong", group: "Flow", hasIn: true, hasOut: true,
  },
  action_ai_text: {
    icon: Sparkles, label: "AI reply", sub: "AI writes the message",
    tile: "bg-ember/15 text-ember-deep border-ember/40", group: "AI", hasIn: true, hasOut: true,
  },
  note: {
    icon: StickyNote, label: "Sticky note", sub: "A note to your future self",
    tile: "bg-honey/15 text-honey border-honey/40", group: "Utilities", hasIn: false, hasOut: false,
  },
};

const GROUPS = ["Triggers", "Messages", "Flow", "AI", "Utilities"];

function defaultParams(type: FlowNodeType): Record<string, string> {
  switch (type) {
    case "trigger_comment": return { keywords: "notion, template", match: "whole word" };
    case "action_reply": return { text: "Just sent it 📬 check your DMs!" };
    case "action_dm_card":
      return { title: "The Creator OS — free pack", subtitle: "3 templates · no email needed", button: "Download free pack", url: "https://" };
    case "action_dm_text": return { text: "Made it useful? Reply here if you're stuck 💬" };
    case "action_wait": return { minutes: "45" };
    case "action_condition": return { contains: "price" };
    case "action_ai_text": return { prompt: "Answer questions about my products — warm, 2 sentences max." };
    case "note": return { text: "The story: comment in → money out." };
  }
}

function nodeSummary(n: FlowNode): string {
  const p = n.params;
  switch (n.type) {
    case "trigger_comment": {
      const kws = p?.keywords ?? "";
      const list = kws
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (list.length) return list.map((k) => `#${k}`).join(" ");
      /* legacy nodes carry their note in `detail` — show it verbatim */
      return n.detail ?? "no keywords yet";
    }
    case "action_reply": return p?.text ?? n.detail ?? "reply text";
    case "action_dm_card": return p?.title ?? n.detail ?? "template card";
    case "action_dm_text": return p?.text ?? n.detail ?? "message";
    case "action_wait": return p?.minutes ? `${p.minutes} min wait` : (n.detail ?? "pause");
    case "action_condition": return p?.contains ? `contains \u201c${p.contains}\u201d` : (n.detail ?? "branch");
    case "action_ai_text": return "AI · 1 credit / reply";
    case "note": return p?.text ?? n.detail ?? "";
  }
}

interface Selection {
  kind: "node" | "edge";
  id: string;
}

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const snap = (v: number) => Math.round(v / GRID) * GRID;

/* ═══════════════════════════════════════════════════════════════════════
   CanvasView
   ═══════════════════════════════════════════════════════════════════════ */

export function CanvasView() {
  const { flows, saveFlow, pushActivity } = useRelo();

  const [flow, setFlow] = useState<Flow>(() =>
    flows[0]
      ? structuredClone(flows[0])
      : {
          id: uid("flow"),
          name: "Untitled flow",
          isActive: false,
          isPublished: false,
          nodes: [
            {
              id: uid("n"),
              type: "trigger_comment",
              x: GRID * 2,
              y: GRID * 4,
              label: "Comment trigger",
              params: defaultParams("trigger_comment"),
            },
          ],
          edges: [],
        }
  );

  const [sel, setSel] = useState<Selection | null>(null);
  const [palette, setPalette] = useState(false);
  const [search, setSearch] = useState("");
  const [pendingFrom, setPendingFrom] = useState<string | null>(null);
  const [connect, setConnect] = useState<{ from: string; x: number; y: number } | null>(null);
  const [view, setView] = useState({ x: 0, y: 0, z: 1 });
  const [tested, setTested] = useState<string[]>([]);
  const [dirty, setDirty] = useState(false);

  const vpRef = useRef<HTMLDivElement>(null);
  const flowRef = useRef(flow);
  flowRef.current = flow;
  const viewRef = useRef(view);
  viewRef.current = view;
  const selRef = useRef(sel);
  selRef.current = sel;
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;

  /* ── coordinate + mutation helpers ── */

  const toWorld = useCallback((clientX: number, clientY: number) => {
    const r = vpRef.current?.getBoundingClientRect();
    if (!r) return { x: 0, y: 0 };
    const v = viewRef.current;
    return { x: (clientX - r.left - v.x) / v.z, y: (clientY - r.top - v.y) / v.z };
  }, []);

  const mutate = useCallback((fn: (f: Flow) => Flow) => {
    setFlow((f) => fn(f));
    setDirty(true);
    setTested([]);
  }, []);

  /* ── pan (bare canvas only) + deselect ── */

  const startPan = (e: React.PointerEvent) => {
    if (e.button !== 0 || e.target !== e.currentTarget) return;
    setSel(null);
    const startX = e.clientX;
    const startY = e.clientY;
    const origin = { ...viewRef.current };
    const move = (ev: PointerEvent) => {
      setView((v) => ({ ...v, x: origin.x + (ev.clientX - startX), y: origin.y + (ev.clientY - startY) }));
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  /* ── wheel zoom, anchored at the cursor (n8n feel) ── */

  useEffect(() => {
    const el = vpRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      const cx = e.clientX - r.left;
      const cy = e.clientY - r.top;
      setView((v) => {
        const z2 = clamp(v.z * Math.exp(-e.deltaY * 0.0016), Z_MIN, Z_MAX);
        const k = z2 / v.z;
        return { z: z2, x: cx - (cx - v.x) * k, y: cy - (cy - v.y) * k };
      });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  /* ── node drag ── */

  const startNodeDrag = (e: React.PointerEvent, node: FlowNode) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    setSel({ kind: "node", id: node.id });
    const startX = e.clientX;
    const startY = e.clientY;
    const ox = node.x;
    const oy = node.y;
    const move = (ev: PointerEvent) => {
      const v = viewRef.current;
      const nx = ox + (ev.clientX - startX) / v.z;
      const ny = oy + (ev.clientY - startY) / v.z;
      setFlow((f) => ({
        ...f,
        nodes: f.nodes.map((n) => (n.id === node.id ? { ...n, x: nx, y: ny } : n)),
      }));
    };
    const up = () => {
      setFlow((f) => ({
        ...f,
        nodes: f.nodes.map((n) => (n.id === node.id ? { ...n, x: snap(n.x), y: snap(n.y) } : n)),
      }));
      setDirty(true);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  /* ── drag-from-port connection ── */

  const startConnect = (e: React.PointerEvent, from: FlowNode) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    const w = toWorld(e.clientX, e.clientY);
    setConnect({ from: from.id, x: w.x, y: w.y });
    const move = (ev: PointerEvent) => {
      const p = toWorld(ev.clientX, ev.clientY);
      setConnect((c) => (c ? { ...c, x: p.x, y: p.y } : c));
    };
    const up = (ev: PointerEvent) => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      const p = toWorld(ev.clientX, ev.clientY);
      const f = flowRef.current;
      const target = f.nodes.find(
        (n) =>
          n.id !== from.id &&
          NODE_META[n.type].hasIn &&
          p.x >= n.x - 10 &&
          p.x <= n.x + NODE_W + 10 &&
          p.y >= n.y - 10 &&
          p.y <= n.y + NODE_H + 14
      );
      if (target) {
        const exists = f.edges.some((ed) => ed.from === from.id && ed.to === target.id);
        if (exists) {
          toast.error("Those steps are already connected");
        } else {
          mutate((fl) => ({ ...fl, edges: [...fl.edges, { id: uid("e"), from: from.id, to: target.id }] }));
          toast.success(`Connected — ${NODE_META[from.type].label} → ${NODE_META[target.type].label}`);
        }
      }
      setConnect(null);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  /* ── add node (wires itself when opened from a “+” chip) ── */

  const addNode = (type: FlowNodeType) => {
    const r = vpRef.current?.getBoundingClientRect();
    const v = viewRef.current;
    const cx = r ? (r.width / 2 - v.x) / v.z : 200;
    const cy = r ? (r.height / 2 - v.y) / v.z : 160;
    const n: FlowNode = {
      id: uid("n"),
      type,
      x: snap(cx - NODE_W / 2 + (Math.random() * 2 - 1) * 28),
      y: snap(cy - NODE_H / 2 + (Math.random() * 2 - 1) * 28),
      label: NODE_META[type].label,
      params: defaultParams(type),
    };
    mutate((f) => {
      const from = pendingFrom && f.nodes.some((x) => x.id === pendingFrom) ? pendingFrom : null;
      return from
        ? { ...f, nodes: [...f.nodes, n], edges: [...f.edges, { id: uid("e"), from, to: n.id }] }
        : { ...f, nodes: [...f.nodes, n] };
    });
    setPendingFrom(null);
    setPalette(false);
    setSearch("");
    setSel({ kind: "node", id: n.id });
    toast.success(`${NODE_META[type].label} added`);
  };

  /* ── selection, inspector actions ── */

  const selNode = sel?.kind === "node" ? (flow.nodes.find((n) => n.id === sel.id) ?? null) : null;
  const selEdge = sel?.kind === "edge" ? (flow.edges.find((e) => e.id === sel.id) ?? null) : null;

  const deleteSel = useCallback(() => {
    const s = selRef.current;
    if (!s) return;
    if (s.kind === "node") {
      mutate((f) => ({
        ...f,
        nodes: f.nodes.filter((n) => n.id !== s.id),
        edges: f.edges.filter((e) => e.from !== s.id && e.to !== s.id),
      }));
      toast("Step removed");
    } else {
      mutate((f) => ({ ...f, edges: f.edges.filter((e) => e.id !== s.id) }));
      toast("Connection removed");
    }
    setSel(null);
  }, [mutate]);

  const duplicateNode = (n: FlowNode) => {
    const copy: FlowNode = { ...structuredClone(n), id: uid("n"), x: snap(n.x + 36), y: snap(n.y + 36) };
    mutate((f) => ({ ...f, nodes: [...f.nodes, copy] }));
    setSel({ kind: "node", id: copy.id });
    toast.success("Step duplicated");
  };

  const setParam = (id: string, key: string, value: string) =>
    mutate((f) => ({
      ...f,
      nodes: f.nodes.map((n) => (n.id === id ? { ...n, params: { ...(n.params ?? {}), [key]: value } } : n)),
    }));

  const setLabel = (id: string, label: string) =>
    mutate((f) => ({ ...f, nodes: f.nodes.map((n) => (n.id === id ? { ...n, label } : n)) }));

  /* ── keyboard: delete removes selection, escape closes everything ── */

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.key === "Escape") {
        setSel(null);
        setPalette(false);
        setPendingFrom(null);
      }
      if ((e.key === "Delete" || e.key === "Backspace") && selRef.current) {
        e.preventDefault();
        deleteSel();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [deleteSel]);

  /* ── test run — the graph lights up in execution order ── */

  const runTest = () => {
    const f = flowRef.current;
    const triggers = f.nodes.filter((n) => n.type === "trigger_comment");
    if (!triggers.length) {
      toast.error("Start with a Comment trigger — every flow needs an entry");
      return;
    }
    const outMap = new Map<string, string[]>();
    f.edges.forEach((e) => outMap.set(e.from, [...(outMap.get(e.from) ?? []), e.to]));
    const order: string[] = [];
    const seen = new Set<string>();
    const queue = triggers.map((n) => n.id);
    while (queue.length) {
      const id = queue.shift()!;
      if (seen.has(id)) continue;
      seen.add(id);
      order.push(id);
      (outMap.get(id) ?? []).forEach((t) => {
        if (!seen.has(t)) queue.push(t);
      });
    }
    const steps = order.filter((id) => f.nodes.find((n) => n.id === id)?.type !== "note");
    if (steps.length <= 1) {
      toast.error("Connect the trigger to at least one step");
      return;
    }
    setTested([]);
    steps.forEach((id, i) =>
      window.setTimeout(() => setTested((prev) => (prev.includes(id) ? prev : [...prev, id])), 460 * (i + 1))
    );
    window.setTimeout(
      () => {
        toast.success(`Test run clean — ${steps.length} steps in sequence`);
        pushActivity("system", `Test run on \u201c${f.name}\u201d`, `${steps.length} steps executed in order`);
      },
      460 * steps.length + 240
    );
  };

  /* ── save / activate ── */

  const save = () => {
    saveFlow(flowRef.current);
    setDirty(false);
    toast.success("Workflow saved");
  };

  const activate = (next: boolean) => {
    const f = { ...flowRef.current, isActive: next, isPublished: next ? true : flowRef.current.isPublished };
    setFlow(f);
    setDirty(false);
    saveFlow(f);
    toast.success(next ? "Workflow activated — it's live \u26a1" : "Workflow deactivated");
    pushActivity("system", next ? `Activated \u201c${f.name}\u201d` : `Paused \u201c${f.name}\u201d`, "from the canvas");
  };

  /* autosave when leaving the canvas with unsaved edits */
  useEffect(
    () => () => {
      if (dirtyRef.current) {
        saveFlow(flowRef.current);
        toast("Canvas autosaved");
      }
    },
    [saveFlow]
  );

  /* ── fit view ── */

  const fitView = useCallback(() => {
    const f = flowRef.current;
    const r = vpRef.current?.getBoundingClientRect();
    if (!r || !f.nodes.length) return;
    const minX = Math.min(...f.nodes.map((n) => n.x));
    const minY = Math.min(...f.nodes.map((n) => n.y));
    const maxX = Math.max(...f.nodes.map((n) => n.x + NODE_W));
    const maxY = Math.max(...f.nodes.map((n) => n.y + NODE_H));
    const pad = 64;
    const z = clamp(
      Math.min((r.width - pad * 2) / Math.max(1, maxX - minX), (r.height - pad * 2) / Math.max(1, maxY - minY), 1.1),
      Z_MIN,
      1.1
    );
    setView({
      z,
      x: (r.width - (maxX - minX) * z) / 2 - minX * z,
      y: (r.height - (maxY - minY) * z) / 2 - minY * z,
    });
  }, []);

  const didFit = useRef(false);
  useEffect(() => {
    if (didFit.current) return;
    didFit.current = true;
    if (flowRef.current.nodes.length) window.setTimeout(fitView, 60);
  }, [fitView]);

  /* ── paths ── */

  const edgePath = (a: FlowNode, b: FlowNode) => {
    const x1 = a.x + NODE_W;
    const y1 = a.y + PORT_Y;
    const x2 = b.x;
    const y2 = b.y + PORT_Y;
    const dx = Math.max(46, Math.abs(x2 - x1) * 0.5);
    return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
  };

  const edgePathToPoint = (a: FlowNode, x2: number, y2: number) => {
    const x1 = a.x + NODE_W;
    const y1 = a.y + PORT_Y;
    const dx = Math.max(46, Math.abs(x2 - x1) * 0.5);
    return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
  };

  const connectFrom = connect ? flow.nodes.find((n) => n.id === connect.from) ?? null : null;
  const pendingFromNode = pendingFrom ? flow.nodes.find((n) => n.id === pendingFrom) ?? null : null;

  const filteredTypes = (Object.keys(NODE_META) as FlowNodeType[]).filter((t) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return NODE_META[t].label.toLowerCase().includes(q) || NODE_META[t].sub.toLowerCase().includes(q);
  });

  /* ═══════════════ render ═══════════════ */

  return (
    <div className="overflow-hidden rounded-3xl border border-line bg-card shadow-[var(--shadow-soft)]">
      {/* ── toolbar ── */}
      <div className="flex flex-wrap items-center gap-3 px-4 py-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-ember/30 bg-ember/15 text-ember-deep">
          <Workflow className="size-4.5" />
        </span>
        <div className="min-w-0">
          <input
            value={flow.name}
            onChange={(e) => {
              setFlow((f) => ({ ...f, name: e.target.value }));
              setDirty(true);
            }}
            className="w-44 truncate rounded-lg border border-transparent bg-transparent px-1.5 py-0.5 font-display text-[15px] font-bold outline-none focus:border-line-strong focus:bg-card-soft sm:w-56"
            aria-label="Workflow name"
          />
          <p className="px-1.5 font-mono text-[9.5px] uppercase tracking-[0.16em] text-ink-4 tnum">
            {flow.nodes.length} steps · {flow.edges.length} connections
          </p>
        </div>
        <span
          className={cn(
            "hidden items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] sm:inline-flex",
            dirty ? "border-honey/40 bg-honey/10 text-honey" : "border-moss/30 bg-moss/10 text-moss"
          )}
        >
          {dirty ? (
            <>
              <span className="size-1.5 rounded-full bg-honey" /> unsaved
            </>
          ) : (
            <>
              <Check className="size-3" /> saved
            </>
          )}
        </span>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <RButton variant="ghost" size="sm" onClick={runTest}>
            <Play className="size-3.5" /> Test workflow
          </RButton>
          <RButton variant="outline" size="sm" onClick={save}>
            <Save className="size-3.5" /> Save
          </RButton>
          <div className="flex items-center gap-2 rounded-full border border-line-strong px-3 py-1.5">
            <span className={cn("size-1.5 rounded-full", flow.isActive ? "bg-moss animate-pulse-soft" : "bg-ink-4")} />
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
              {flow.isActive ? "Active" : "Inactive"}
            </span>
            <Switch checked={flow.isActive} onCheckedChange={activate} aria-label="Toggle workflow active" />
          </div>
        </div>
      </div>

      {/* ── viewport ── */}
      <div
        ref={vpRef}
        onPointerDown={startPan}
        className="relative h-[calc(100vh-270px)] min-h-[540px] overflow-hidden border-t border-line bg-[var(--plate-bg)] select-none"
        style={{ touchAction: "none" }}
      >
        {/* dotted grid, tied to the view transform */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: "radial-gradient(var(--line-strong) 1px, transparent 1px)",
            backgroundSize: `${22 * view.z}px ${22 * view.z}px`,
            backgroundPosition: `${view.x}px ${view.y}px`,
            opacity: 0.5,
          }}
        />

        {/* the world — everything that pans and zooms */}
        <div
          className="absolute left-0 top-0"
          style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.z})`, transformOrigin: "0 0" }}
        >
          {/* edges */}
          <svg className="pointer-events-none absolute left-0 top-0 overflow-visible" width="1" height="1" aria-hidden>
            <defs>
              <marker
                id="fc-arrow"
                viewBox="0 0 10 10"
                refX="8.5"
                refY="5"
                markerWidth="6.5"
                markerHeight="6.5"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 9 5 L 0 9 z" fill="var(--accent)" />
              </marker>
            </defs>
            {flow.edges.map((e) => {
              const a = flow.nodes.find((n) => n.id === e.from);
              const b = flow.nodes.find((n) => n.id === e.to);
              if (!a || !b) return null;
              const d = edgePath(a, b);
              const isSel = sel?.kind === "edge" && sel.id === e.id;
              const flowed = tested.includes(e.from) && tested.includes(e.to);
              return (
                <g key={e.id}>
                  <path
                    d={d}
                    fill="none"
                    stroke="transparent"
                    strokeWidth={20}
                    style={{ pointerEvents: "stroke", cursor: "pointer" }}
                    onPointerDown={(ev) => {
                      ev.stopPropagation();
                      setSel({ kind: "edge", id: e.id });
                    }}
                  />
                  <path
                    d={d}
                    fill="none"
                    stroke={isSel ? "var(--accent)" : flowed ? "var(--ok)" : "var(--text-3)"}
                    strokeOpacity={isSel || flowed ? 1 : 0.55}
                    strokeWidth={isSel ? 2.4 : 1.8}
                    markerEnd="url(#fc-arrow)"
                  />
                  {/* animated 2D signal pulse stream */}
                  {flow.isActive && (
                    <path
                      d={d}
                      fill="none"
                      stroke={flowed ? "var(--ok)" : isSel ? "var(--accent-hover)" : "var(--accent)"}
                      strokeWidth={flowed ? 2.6 : 2}
                      strokeDasharray="5 9"
                      strokeLinecap="round"
                      className={flowed ? "flow-wire-stream-fast" : "flow-wire-stream"}
                      strokeOpacity={0.85}
                    />
                  )}
                </g>
              );
            })}
            {connectFrom && connect && (
              <path
                d={edgePathToPoint(connectFrom, connect.x, connect.y)}
                fill="none"
                stroke="var(--accent)"
                strokeWidth={2}
                strokeDasharray="6 6"
              />
            )}
          </svg>

          {/* nodes */}
          {flow.nodes.map((n) => {
            const meta = NODE_META[n.type];
            const isSel = sel?.kind === "node" && sel.id === n.id;
            const didRun = tested.includes(n.id);

            if (n.type === "note") {
              return (
                <div
                  key={n.id}
                  style={{ left: n.x, top: n.y, width: 224 }}
                  className={cn(
                    "absolute rotate-[-1.2deg] rounded-2xl border border-honey/45 bg-honey/10 p-3 shadow-[var(--shadow-soft)]",
                    isSel && "ring-2 ring-ember/30"
                  )}
                >
                  <div
                    className="flex cursor-grab items-center gap-2 pb-1.5 active:cursor-grabbing"
                    onPointerDown={(e) => startNodeDrag(e, n)}
                  >
                    <StickyNote className="size-3.5 text-honey" />
                    <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-honey">note</span>
                    <button
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={() => {
                        mutate((f) => ({ ...f, nodes: f.nodes.filter((x) => x.id !== n.id) }));
                        toast("Note removed");
                      }}
                      className="ml-auto grid size-6 place-items-center rounded-lg text-ink-4"
                      aria-label="Remove note"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </div>
                  <textarea
                    value={n.params?.text ?? ""}
                    onChange={(e) => setParam(n.id, "text", e.target.value)}
                    onPointerDown={(e) => e.stopPropagation()}
                    rows={3}
                    placeholder="A note to your future self…"
                    className="w-full resize-none bg-transparent text-[12px] leading-relaxed text-ink-2 outline-none placeholder:text-ink-4/70"
                  />
                </div>
              );
            }

            return (
              <div
                key={n.id}
                style={{ left: n.x, top: n.y, width: NODE_W }}
                className={cn(
                  "absolute cursor-grab rounded-2xl border bg-card shadow-[var(--shadow-soft)] active:cursor-grabbing transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)] hover:border-ember/40",
                  isSel ? "border-ember/70 ring-2 ring-ember/25" : didRun ? "border-moss/60 shadow-[0_0_16px_-2px_rgba(99,221,182,0.3)] ring-1 ring-moss/40" : "border-line"
                )}
                onPointerDown={(e) => startNodeDrag(e, n)}
              >
                <div className="flex items-center gap-2.5 px-3 py-2.5">
                  <span className={cn("grid size-8 shrink-0 place-items-center rounded-lg border transition-transform duration-200 group-hover:scale-105", meta.tile)}>
                    <meta.icon className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12.5px] font-bold leading-tight text-ink">{n.label}</p>
                    <p className="truncate font-mono text-[9.5px] leading-relaxed text-ink-4">{nodeSummary(n)}</p>
                  </div>
                  {didRun ? (
                    <CircleCheck className="size-4 shrink-0 text-moss animate-in zoom-in-50 duration-300" />
                  ) : meta.hasOut ? (
                    <span className="size-1.5 shrink-0 rounded-full bg-ink-4/50" />
                  ) : null}
                </div>

                {/* ports */}
                {meta.hasIn && (
                  <span
                    aria-hidden
                    className="absolute -left-[7px] top-[19px] size-3.5 rounded-full border-2 border-line-strong bg-paper transition-transform duration-150 hover:scale-125"
                  />
                )}
                {meta.hasOut && (
                  <span
                    role="button"
                    aria-label="Drag to connect from this step"
                    onPointerDown={(e) => startConnect(e, n)}
                    className="absolute -right-[7px] top-[19px] size-3.5 cursor-crosshair rounded-full border-2 border-ember/70 bg-ember shadow-[0_0_10px_-2px_rgba(139,128,249,0.8)] transition-transform duration-150 hover:scale-125"
                  />
                )}
                {/* quick add — the n8n “+” under the output port */}
                {meta.hasOut && (
                  <button
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={() => {
                      setPendingFrom(n.id);
                      setPalette(true);
                    }}
                    className="absolute -right-3 top-[42px] grid size-6 place-items-center rounded-full bg-ember text-[var(--on-ember)] shadow-[var(--shadow-soft)]"
                    aria-label="Add next step"
                  >
                    <Plus className="size-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* fig chip */}
        <div
          className="pointer-events-none absolute left-3 top-3 z-10 flex items-center gap-2 rounded-full border border-line px-3 py-1.5 shadow-[var(--shadow-soft)]"
          style={{ background: "var(--plate-bg)" }}
        >
          <span className="font-mono text-[9px] uppercase tracking-[0.26em] text-ember-hot tnum">fig. 04</span>
          <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-ink-3">the node canvas</span>
        </div>

        {/* empty state */}
        {flow.nodes.length === 0 && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <div className="pointer-events-auto text-center">
              <span className="mx-auto grid size-14 place-items-center rounded-2xl border border-line bg-card text-ink-3 shadow-[var(--shadow-soft)]">
                <Workflow className="size-6" />
              </span>
              <p className="font-display mt-4 text-[17px] font-bold">An empty canvas</p>
              <p className="mt-1 text-[13px] text-ink-3">Every automation starts with a comment.</p>
              <RButton
                className="mt-5"
                onClick={() => {
                  setPendingFrom(null);
                  setPalette(true);
                }}
              >
                <Plus className="size-4" /> Add first step
              </RButton>
            </div>
          </div>
        )}

        {/* zoom controls — n8n's bottom-left instrument */}
        <div className="absolute bottom-3 left-3 z-10 flex items-center gap-0.5 rounded-full border border-line bg-card/95 p-1 shadow-[var(--shadow-soft)]">
          <button
            onClick={() => setView((v) => ({ ...v, z: clamp(v.z * 0.85, Z_MIN, Z_MAX) }))}
            className="grid size-7 place-items-center rounded-full text-ink-3"
            aria-label="Zoom out"
          >
            <Minus className="size-3.5" />
          </button>
          <button
            onClick={() => setView((v) => ({ ...v, z: 1 }))}
            className="w-12 text-center font-mono text-[11px] text-ink-3 tnum"
            title="Reset zoom to 100%"
          >
            {Math.round(view.z * 100)}%
          </button>
          <button
            onClick={() => setView((v) => ({ ...v, z: clamp(v.z * 1.15, Z_MIN, Z_MAX) }))}
            className="grid size-7 place-items-center rounded-full text-ink-3"
            aria-label="Zoom in"
          >
            <Plus className="size-3.5" />
          </button>
          <span className="mx-0.5 h-4 w-px bg-line" />
          <button onClick={fitView} className="grid size-7 place-items-center rounded-full text-ink-3" aria-label="Zoom to fit">
            <Maximize className="size-3.5" />
          </button>
        </div>

        {/* add node */}
        <div className="absolute bottom-3 right-3 z-10">
          <button
            onClick={() => {
              setPendingFrom(null);
              setPalette(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-full bg-ember px-4 py-2 text-[12.5px] font-semibold text-[var(--on-ember)] shadow-[var(--shadow-ember)]"
          >
            <Plus className="size-4" /> Add node
          </button>
        </div>

        <p className="pointer-events-none absolute bottom-4 left-1/2 z-10 hidden -translate-x-1/2 font-mono text-[9.5px] uppercase tracking-[0.14em] text-ink-4 xl:block">
          drag canvas to pan · scroll to zoom · drag the amber port to connect
        </p>

        {/* ── edge selected ── */}
        <AnimatePresence>
          {selEdge && (
            <motion.div
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 24, opacity: 0 }}
              className="absolute bottom-16 left-1/2 z-20 flex max-w-[calc(100%-2rem)] -translate-x-1/2 items-center gap-3 rounded-full bg-ink px-4 py-2 text-paper shadow-lg"
            >
              <span className="font-mono text-[10.5px] uppercase tracking-[0.18em]">connection selected</span>
              <button onClick={deleteSel} className="font-mono text-[11px] font-bold text-ember-hot">
                delete
              </button>
              <button onClick={() => setSel(null)} className="font-mono text-[11px] text-ink-4">
                esc
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── step library (left) ── */}
        <AnimatePresence>
          {palette && (
            <motion.aside
              initial={{ x: -22, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -22, opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.28, 1] }}
              onPointerDown={(e) => e.stopPropagation()}
              className="absolute bottom-3 left-3 top-3 z-20 flex w-[280px] max-w-[calc(100%-24px)] flex-col rounded-2xl border border-line bg-card shadow-[var(--shadow-lift)]"
            >
              <div className="flex items-center justify-between border-b border-line px-4 py-3">
                <div>
                  <p className="font-display text-[14px] font-bold">What happens next?</p>
                  <p className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-ink-4">step library</p>
                </div>
                <button
                  onClick={() => {
                    setPalette(false);
                    setPendingFrom(null);
                  }}
                  className="grid size-7 place-items-center rounded-lg text-ink-4"
                  aria-label="Close palette"
                >
                  <X className="size-4" />
                </button>
              </div>
              <div className="border-b border-line px-3 py-2.5">
                <div className="flex items-center gap-2 rounded-xl border border-line-strong bg-card-soft px-3 py-2">
                  <Search className="size-3.5 text-ink-4" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search steps…"
                    className="w-full bg-transparent text-[13px] outline-none placeholder:text-ink-4"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-2">
                {GROUPS.map((g) => {
                  const items = filteredTypes.filter((t) => NODE_META[t].group === g);
                  if (!items.length) return null;
                  return (
                    <div key={g} className="mb-1.5">
                      <p className="px-2 py-1.5 font-mono text-[9px] uppercase tracking-[0.22em] text-ink-4">{g}</p>
                      {items.map((t) => {
                        const m = NODE_META[t];
                        return (
                          <button
                            key={t}
                            onClick={() => addNode(t)}
                            className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left"
                          >
                            <span className={cn("grid size-8 shrink-0 place-items-center rounded-lg border", m.tile)}>
                              <m.icon className="size-4" />
                            </span>
                            <span className="min-w-0">
                              <span className="block truncate text-[13px] font-semibold">{m.label}</span>
                              <span className="block truncate text-[11px] text-ink-4">{m.sub}</span>
                            </span>
                            <Plus className="ml-auto size-3.5 shrink-0 text-ink-4" />
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
                {!filteredTypes.length && (
                  <p className="px-3 py-6 text-center text-[12.5px] text-ink-4">Nothing matches “{search}”.</p>
                )}
              </div>
              {pendingFromNode && (
                <div className="border-t border-line px-4 py-2.5">
                  <p className="font-mono text-[10.5px] leading-relaxed text-ember">
                    wiring from “{pendingFromNode.label}” — the new step connects automatically
                  </p>
                </div>
              )}
            </motion.aside>
          )}
        </AnimatePresence>

        {/* ── inspector (right) ── */}
        <AnimatePresence>
          {selNode && (
            <motion.aside
              key={selNode.id}
              initial={{ x: 22, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 22, opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.28, 1] }}
              onPointerDown={(e) => e.stopPropagation()}
              className="absolute bottom-3 right-3 top-3 z-20 w-[300px] max-w-[calc(100%-24px)] overflow-y-auto rounded-2xl border border-line bg-card shadow-[var(--shadow-lift)]"
            >
              {(() => {
                const meta = NODE_META[selNode.type];
                const p = (k: string) => selNode.params?.[k] ?? defaultParams(selNode.type)[k] ?? "";
                const param = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
                  setParam(selNode.id, k, e.target.value);
                return (
                  <>
                    <div className="flex items-center gap-2.5 border-b border-line px-4 py-3">
                      <span className={cn("grid size-8 shrink-0 place-items-center rounded-lg border", meta.tile)}>
                        <meta.icon className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-bold">{selNode.label || meta.label}</p>
                        <p className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-ink-4">{meta.label}</p>
                      </div>
                      <button
                        onClick={() => setSel(null)}
                        className="grid size-7 place-items-center rounded-lg text-ink-4"
                        aria-label="Close inspector"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                    <div className="space-y-4 px-4 py-4">
                      <Field label="Step name">
                        <input
                          value={selNode.label}
                          onChange={(e) => setLabel(selNode.id, e.target.value)}
                          className={inputCls}
                        />
                      </Field>

                      {selNode.type === "trigger_comment" && (
                        <>
                          <Field label="Trigger keywords" hint="comma separated">
                            <input
                              value={p("keywords")}
                              onChange={param("keywords")}
                              placeholder="notion, template"
                              className={cn(inputCls, "font-mono text-[13px]")}
                            />
                          </Field>
                          <Field label="Match">
                            <select value={p("match")} onChange={param("match")} className={inputCls}>
                              <option value="whole word">whole word</option>
                              <option value="contains">contains</option>
                            </select>
                          </Field>
                        </>
                      )}

                      {selNode.type === "action_reply" && (
                        <Field label="Reply text" hint="public comment reply">
                          <textarea rows={3} value={p("text")} onChange={param("text")} className={cn(inputCls, "resize-none")} />
                        </Field>
                      )}

                      {selNode.type === "action_dm_card" && (
                        <>
                          <Field label="Card title">
                            <input value={p("title")} onChange={param("title")} className={inputCls} />
                          </Field>
                          <Field label="Subtitle">
                            <input value={p("subtitle")} onChange={param("subtitle")} className={inputCls} />
                          </Field>
                          <Field label="Button 1">
                            <input value={p("button")} onChange={param("button")} className={inputCls} />
                          </Field>
                          <Field label="Button link">
                            <input
                              value={p("url")}
                              onChange={param("url")}
                              className={cn(inputCls, "font-mono text-[13px]")}
                            />
                          </Field>
                        </>
                      )}

                      {selNode.type === "action_dm_text" && (
                        <Field label="Message">
                          <textarea rows={3} value={p("text")} onChange={param("text")} className={cn(inputCls, "resize-none")} />
                        </Field>
                      )}

                      {selNode.type === "action_wait" && (
                        <Field label="Wait" hint="minutes — human jitter on top">
                          <input
                            type="number"
                            min={5}
                            max={1440}
                            value={p("minutes")}
                            onChange={param("minutes")}
                            className={inputCls}
                          />
                        </Field>
                      )}

                      {selNode.type === "action_condition" && (
                        <Field label="Continue when comment contains" hint="case-insensitive">
                          <input
                            value={p("contains")}
                            onChange={param("contains")}
                            className={cn(inputCls, "font-mono text-[13px]")}
                          />
                        </Field>
                      )}

                      {selNode.type === "action_ai_text" && (
                        <Field label="AI instructions" hint="1 AI credit per reply">
                          <textarea rows={4} value={p("prompt")} onChange={param("prompt")} className={cn(inputCls, "resize-none")} />
                        </Field>
                      )}

                      {selNode.type === "note" && (
                        <Field label="Note text">
                          <textarea rows={3} value={p("text")} onChange={param("text")} className={cn(inputCls, "resize-none")} />
                        </Field>
                      )}

                      <div className="flex gap-2 border-t border-line pt-4">
                        <button
                          onClick={() => duplicateNode(selNode)}
                          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-line-strong py-2 text-[12.5px] font-medium text-ink-2"
                        >
                          <Copy className="size-3.5" /> Duplicate
                        </button>
                        <button
                          onClick={deleteSel}
                          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-destructive/40 py-2 text-[12.5px] font-medium text-destructive"
                        >
                          <Trash2 className="size-3.5" /> Delete
                        </button>
                      </div>
                    </div>
                  </>
                );
              })()}
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
