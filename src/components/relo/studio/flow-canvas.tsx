"use client";

/**
 * Canvas — a planning board for a comment-to-DM sequence.
 *
 * The Worker only executes the automation attached to a Reel (`reel_automations`);
 * a saved flow is a stored blueprint of the intended chain. The copy here says
 * that plainly instead of pretending this graph runs.
 *
 * The graph shape is the one `backend/src/engine/flowGraph.ts` validates:
 *
 *   { nodes: [{ id, type, position: {x,y}, config }], edges: [{ id, source, target }] }
 *
 * and the rules are the same: exactly one `trigger_comment`, at most 50 nodes,
 * a straight chain with no branches, orphans or loops. Because a chain has one
 * obvious shape, the editor keeps the order in sync with the edges instead of
 * asking the creator to drag wires; dragging only moves a card on the board.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Check,
  ChevronDown,
  Hourglass,
  Info,
  LayoutTemplate,
  Loader2,
  Mail,
  Maximize,
  MessageCircle,
  Minus,
  Plus,
  Reply,
  Save,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { useRelo } from "@/lib/relo/store";
import * as api from "@/lib/relo/api";
import {
  uid,
  type Flow,
  type FlowEdge,
  type FlowNode,
  type FlowNodeType,
} from "@/lib/relo/data";
import {
  EmptyState,
  ErrorNotice,
  Field,
  LoadingBlock,
  LockedNotice,
  ViewHead,
  inputCls,
} from "./studio-ui";
import { Button } from "../chrome";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";

/* ── geometry ─────────────────────────────────────────────────────────── */

const NODE_W = 236;
const NODE_H = 78;
const PORT_Y = 30;
const STEP_X = 292;
const Z_MIN = 0.4;
const Z_MAX = 1.8;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

/* ── node catalogue ───────────────────────────────────────────────────── */

const NODE_META: Record<
  FlowNodeType,
  {
    icon: typeof MessageCircle;
    label: string;
    sub: string;
    group: "Start" | "Messages" | "Timing";
    tone: string;
  }
> = {
  trigger_comment: {
    icon: MessageCircle,
    label: "Comment trigger",
    sub: "A comment matches a keyword",
    group: "Start",
    tone: "text-chart-2",
  },
  action_reply: {
    icon: Reply,
    label: "Public reply",
    sub: "Answer under the comment",
    group: "Messages",
    tone: "text-warn",
  },
  action_dm_card: {
    icon: LayoutTemplate,
    label: "DM card",
    sub: "A card with up to three buttons",
    group: "Messages",
    tone: "text-signal",
  },
  action_dm_text: {
    icon: Mail,
    label: "DM text",
    sub: "A plain direct message",
    group: "Messages",
    tone: "text-ok",
  },
  action_wait: {
    icon: Hourglass,
    label: "Wait",
    sub: "Pause before the next step",
    group: "Timing",
    tone: "text-ink-3",
  },
};

const NODE_TYPES = Object.keys(NODE_META) as FlowNodeType[];
const GROUPS: Array<"Start" | "Messages" | "Timing"> = ["Start", "Messages", "Timing"];

interface CardButton {
  title: string;
  url?: string;
}

const defaultConfig = (type: FlowNodeType): Record<string, unknown> => {
  switch (type) {
    case "trigger_comment":
      return { keywords: [], mediaId: "" };
    case "action_reply":
      return { text: "Sent it to your DMs — check your inbox." };
    case "action_dm_card":
      return { title: "", subtitle: "", buttons: [] as CardButton[] };
    case "action_dm_text":
      return { text: "" };
    case "action_wait":
      return { minutes: 30 };
  }
};

/* typed readers: node config is untrusted JSON from the API */
const asText = (value: unknown, fallback = ""): string =>
  typeof value === "string" ? value : fallback;
const asNumber = (value: unknown, fallback: number): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;
const asTextList = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
const asButtons = (value: unknown): CardButton[] =>
  Array.isArray(value)
    ? value.flatMap((item) => {
        if (!item || typeof item !== "object") return [];
        const raw = item as { title?: unknown; url?: unknown };
        const title = asText(raw.title).slice(0, 20);
        if (!title) return [];
        const url = asText(raw.url);
        return [{ title, url: url || undefined }];
      })
    : [];

/* ── chain helpers ────────────────────────────────────────────────────── */

/** Reads the chain from the trigger outward. Anything unreachable is ignored. */
function chainOf(graph: Flow["graph"]): FlowNode[] {
  const trigger = graph.nodes.find((node) => node.type === "trigger_comment");
  if (!trigger) return [];

  const next = new Map<string, string>();
  for (const edge of graph.edges) next.set(edge.source, edge.target);

  const chain: FlowNode[] = [];
  const seen = new Set<string>();
  let cursor: FlowNode | undefined = trigger;
  while (cursor && !seen.has(cursor.id)) {
    seen.add(cursor.id);
    chain.push(cursor);
    const nextId = next.get(cursor.id);
    cursor = nextId ? graph.nodes.find((node) => node.id === nextId) : undefined;
  }
  return chain;
}

/** Edges are derived from order, so the graph can never branch or loop. */
function graphFrom(nodes: FlowNode[]): Flow["graph"] {
  const edges: FlowEdge[] = [];
  for (let i = 1; i < nodes.length; i += 1) {
    edges.push({
      id: `${nodes[i - 1].id}->${nodes[i].id}`,
      source: nodes[i - 1].id,
      target: nodes[i].id,
    });
  }
  return { nodes, edges };
}

function summaryOf(node: FlowNode): string {
  const config = node.config;
  switch (node.type) {
    case "trigger_comment": {
      const keywords = asTextList(config.keywords);
      return keywords.length ? keywords.map((word) => `#${word}`).join(" ") : "No keywords yet";
    }
    case "action_reply":
      return asText(config.text) || "No reply text yet";
    case "action_dm_card":
      return asText(config.title) || "Untitled card";
    case "action_dm_text":
      return asText(config.text) || "No message yet";
    case "action_wait":
      return `${asNumber(config.minutes, 30)} minute wait`;
  }
}

/* ── drag helper type ─────────────────────────────────────────────────── */

interface Viewport {
  x: number;
  y: number;
  z: number;
}

export function CanvasView() {
  const { account, plan, limits, flows, reels, saveFlow, deleteFlow } = useRelo();

  const [draft, setDraft] = useState<Flow | null>(null);
  const [dirty, setDirty] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [palette, setPalette] = useState(false);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmFlowDelete, setConfirmFlowDelete] = useState(false);
  const [pendingFlow, setPendingFlow] = useState<string | null>(null);
  const [view, setView] = useState<Viewport>({ x: 0, y: 0, z: 1 });

  const viewportRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef(view);
  viewRef.current = view;
  const draftRef = useRef<Flow | null>(draft);
  draftRef.current = draft;
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;

  /* ── keep the draft in step with the server copy ──
     Only react to a new array from the store. Re-syncing whenever `dirty`
     flips would race the refresh that follows a save and could drop a flow
     the server has not listed yet. */

  const lastDataRef = useRef<Flow[] | null>(null);

  useEffect(() => {
    if (lastDataRef.current === flows.data) return;
    lastDataRef.current = flows.data;
    if (dirtyRef.current) return;
    setDraft((current) => {
      const stored = current && flows.data.find((flow) => flow.id === current.id);
      return stored ?? flows.data[0] ?? null;
    });
  }, [flows.data]);


  useEffect(() => {
    if (selected && !draft?.graph.nodes.some((node) => node.id === selected)) {
      setSelected(null);
    }
  }, [draft, selected]);

  const chain = useMemo(() => (draft ? chainOf(draft.graph) : []), [draft]);

  /* ── mutation helpers ── */

  const mutate = useCallback((updater: (flow: Flow) => Flow) => {
    setDraft((current) => (current ? updater(current) : current));
    setDirty(true);
    setFormError(null);
  }, []);

  const replaceChain = useCallback(
    (nodes: FlowNode[]) => {
      mutate((flow) => ({ ...flow, graph: graphFrom(nodes) }));
    },
    [mutate]
  );

  const addNode = (type: FlowNodeType) => {
    const flow = draftRef.current;
    if (!flow) return;

    const nodes = chainOf(flow.graph);
    if (nodes.length >= 50) {
      setFormError("A flow holds at most 50 steps.");
      return;
    }
    if (type === "trigger_comment" && nodes.some((node) => node.type === "trigger_comment")) {
      setFormError("A flow has exactly one trigger. Add messages after it instead.");
      return;
    }

    const last = nodes[nodes.length - 1];
    const node: FlowNode = {
      id: uid("n"),
      type,
      position: last
        ? { x: last.position.x + STEP_X, y: last.position.y }
        : { x: 96, y: 96 },
      config: defaultConfig(type),
    };

    replaceChain([...nodes, node]);
    setSelected(node.id);
    setPalette(false);
    setSearch("");
    toast.success(`${NODE_META[type].label} added`);
  };

  const removeNode = (id: string) => {
    const flow = draftRef.current;
    if (!flow) return;
    replaceChain(chainOf(flow.graph).filter((node) => node.id !== id));
    setSelected(null);
    toast("Step removed");
  };

  const moveNode = (id: string, direction: -1 | 1) => {
    const flow = draftRef.current;
    if (!flow) return;
    const nodes = chainOf(flow.graph);
    const from = nodes.findIndex((node) => node.id === id);
    const to = from + direction;
    if (from < 0 || to <= 0 || to >= nodes.length) return;
    const next = [...nodes];
    [next[from], next[to]] = [next[to], next[from]];
    replaceChain(next);
  };

  const setConfig = (id: string, patch: Record<string, unknown>) => {
    mutate((flow) => ({
      ...flow,
      graph: {
        ...flow.graph,
        nodes: flow.graph.nodes.map((node) =>
          node.id === id ? { ...node, config: { ...node.config, ...patch } } : node
        ),
      },
    }));
  };

  /* ── pan + drag ── */

  const startPan = (event: React.PointerEvent) => {
    if (event.button !== 0 || event.target !== event.currentTarget) return;
    setSelected(null);
    const startX = event.clientX;
    const startY = event.clientY;
    const origin = { ...viewRef.current };
    const move = (native: PointerEvent) => {
      setView((current) => ({
        ...current,
        x: origin.x + (native.clientX - startX),
        y: origin.y + (native.clientY - startY),
      }));
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const startDrag = (event: React.PointerEvent, node: FlowNode) => {
    if (event.button !== 0) return;
    event.stopPropagation();
    setSelected(node.id);

    const startX = event.clientX;
    const startY = event.clientY;
    const origin = { ...node.position };

    const move = (native: PointerEvent) => {
      const zoom = viewRef.current.z;
      const x = origin.x + (native.clientX - startX) / zoom;
      const y = origin.y + (native.clientY - startY) / zoom;
      setDraft((current) =>
        current
          ? {
              ...current,
              graph: {
                ...current.graph,
                nodes: current.graph.nodes.map((item) =>
                  item.id === node.id ? { ...item, position: { x, y } } : item
                ),
              },
            }
          : current
      );
    };
    const up = () => {
      setDirty(true);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  /* ── zoom on wheel, but never over a panel ──
     This is the fix for the reported bug: the palette and the inspector are
     scrollable panels that live inside the viewport. Their wheel events used to
     reach this handler, which called preventDefault() and zoomed the canvas
     instead of scrolling the panel. Anything marked [data-canvas-panel] is
     handed back to the browser. */

  useEffect(() => {
    const element = viewportRef.current;
    if (!element) return;

    const onWheel = (event: WheelEvent) => {
      const target = event.target as Element | null;
      if (target?.closest?.("[data-canvas-panel]")) return;
      event.preventDefault();

      const rect = element.getBoundingClientRect();
      const px = event.clientX - rect.left;
      const py = event.clientY - rect.top;
      setView((current) => {
        const zoom = clamp(current.z * Math.exp(-event.deltaY * 0.0016), Z_MIN, Z_MAX);
        const ratio = zoom / current.z;
        return {
          z: zoom,
          x: px - (px - current.x) * ratio,
          y: py - (py - current.y) * ratio,
        };
      });
    };

    element.addEventListener("wheel", onWheel, { passive: false });
    return () => element.removeEventListener("wheel", onWheel);
  }, []);

  /* ── fit the chain into view ── */

  const fitView = useCallback(() => {
    const flow = draftRef.current;
    const rect = viewportRef.current?.getBoundingClientRect();
    if (!flow || !rect) return;
    const nodes = chainOf(flow.graph);
    if (!nodes.length) {
      setView({ x: 0, y: 0, z: 1 });
      return;
    }
    const minX = Math.min(...nodes.map((node) => node.position.x));
    const minY = Math.min(...nodes.map((node) => node.position.y));
    const maxX = Math.max(...nodes.map((node) => node.position.x + NODE_W));
    const maxY = Math.max(...nodes.map((node) => node.position.y + NODE_H));
    const pad = 72;
    const zoom = clamp(
      Math.min(
        (rect.width - pad * 2) / Math.max(1, maxX - minX),
        (rect.height - pad * 2) / Math.max(1, maxY - minY),
        1
      ),
      Z_MIN,
      1
    );
    setView({
      z: zoom,
      x: (rect.width - (maxX - minX) * zoom) / 2 - minX * zoom,
      y: (rect.height - (maxY - minY) * zoom) / 2 - minY * zoom,
    });
  }, []);

  const fitOnceRef = useRef<string | null>(null);
  useEffect(() => {
    if (!draft) return;
    if (fitOnceRef.current === draft.id) return;
    fitOnceRef.current = draft.id;
    const timer = window.setTimeout(fitView, 50);
    return () => window.clearTimeout(timer);
  }, [draft, fitView]);

  /* ── keyboard ── */

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable);
      if (event.key === "Escape") {
        setPalette(false);
        setSelected(null);
        setPendingFlow(null);
        return;
      }
      if (typing) return;
      if ((event.key === "Delete" || event.key === "Backspace") && selected) {
        event.preventDefault();
        removeNode(selected);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // removeNode reads the draft from a ref, so it is safe to bind once
  }, [selected]);

  /* ── save / create / delete ── */

  const problem = useMemo(() => {
    if (!draft) return "Nothing to save.";
    if (!draft.name.trim()) return "Give the flow a name.";
    const nodes = draft.graph.nodes;
    if (nodes.length === 0) return "Add a comment trigger to start.";
    const triggers = nodes.filter((node) => node.type === "trigger_comment");
    if (triggers.length === 0) return "Every flow needs one comment trigger.";
    if (triggers.length > 1) return "A flow can only have one trigger.";
    const sources = new Set<string>();
    for (const edge of draft.graph.edges) {
      if (sources.has(edge.source)) {
        return "Flows run in a straight line — a step can only lead to one next step.";
      }
      sources.add(edge.source);
    }
    return null;
  }, [draft]);

  const isNew = Boolean(draft && !flows.data.some((flow) => flow.id === draft.id));

  const save = async () => {
    const flow = draftRef.current;
    if (!flow || !account) return;
    if (problem) {
      setFormError(problem);
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const saved = await saveFlow({
        id: isNew ? undefined : flow.id,
        accountId: account.id,
        name: flow.name.trim(),
        graph: flow.graph,
        isActive: flow.isActive,
        isPublished: flow.isPublished,
      });
      setDraft(saved);
      setDirty(false);
      toast.success(isNew ? "Flow saved to your account" : "Flow updated");
    } catch (caught) {
      setFormError(api.errorMessage(caught));
    } finally {
      setSaving(false);
    }
  };

  const startNew = () => {
    if (!account) return;
    setDraft({
      id: uid("flow"),
      accountId: account.id,
      name: "Untitled flow",
      graph: graphFrom([
        {
          id: uid("n"),
          type: "trigger_comment",
          position: { x: 96, y: 96 },
          config: defaultConfig("trigger_comment"),
        },
      ]),
      isActive: false,
      isPublished: false,
      createdAt: 0,
      updatedAt: 0,
    });
    setDirty(true);
    setSelected(null);
    setPalette(false);
    setFormError(null);
    setConfirmFlowDelete(false);
  };

  const openFlow = (id: string) => {
    if (id === draft?.id) return;
    if (dirty) {
      setPendingFlow(id);
      return;
    }
    const next = flows.data.find((flow) => flow.id === id) ?? null;
    setDraft(next);
    setSelected(null);
    setFormError(null);
  };

  const discardAndOpen = () => {
    if (!pendingFlow) return;
    const next = flows.data.find((flow) => flow.id === pendingFlow) ?? null;
    setDraft(next);
    setDirty(false);
    setSelected(null);
    setPalette(false);
    setFormError(null);
    setPendingFlow(null);
  };

  const removeFlow = async () => {
    const flow = draftRef.current;
    if (!flow || isNew) return;
    try {
      await deleteFlow(flow.id);
      setConfirmFlowDelete(false);
      setDirty(false);
      setDraft(null);
      toast.success("Flow deleted");
    } catch (caught) {
      setFormError(api.errorMessage(caught));
    }
  };

  /* ── derived ── */

  const selectedNode = selected
    ? draft?.graph.nodes.find((node) => node.id === selected) ?? null
    : null;
  const triggerPresent = chain.some((node) => node.type === "trigger_comment");

  const filteredTypes = NODE_TYPES.filter((type) => {
    const query = search.trim().toLowerCase();
    if (!query) return true;
    const meta = NODE_META[type];
    return (
      meta.label.toLowerCase().includes(query) || meta.sub.toLowerCase().includes(query)
    );
  });

  const edgePath = (from: FlowNode, to: FlowNode) => {
    const x1 = from.position.x + NODE_W;
    const y1 = from.position.y + PORT_Y;
    const x2 = to.position.x;
    const y2 = to.position.y + PORT_Y;
    const bend = Math.max(44, Math.abs(x2 - x1) * 0.5);
    return `M ${x1} ${y1} C ${x1 + bend} ${y1}, ${x2 - bend} ${y2}, ${x2} ${y2}`;
  };

  /* ── gated + async states ── */

  if (!limits.canvas) {
    return (
      <LockedNotice
        feature="Canvas"
        plan={plan}
        message="Map a whole comment-to-DM sequence on one board. Canvas is part of the Studio plan."
        onUpgrade={() => {
          window.location.hash = "#/studio/settings";
        }}
      />
    );
  }

  if (flows.loading && flows.data.length === 0 && !draft) {
    return <LoadingBlock label="Loading your flows" />;
  }

  if (flows.error && flows.data.length === 0) {
    return (
      <ErrorNotice
        message={flows.error.message}
        detail={flows.error.code}
        onRetry={() => void flows.refresh()}
      />
    );
  }

  return (
    <div className="space-y-5">
      <ViewHead
        title="Canvas"
        sub="Lay out a comment-to-DM sequence as one straight chain. This board is the blueprint you save to your account."
      >
        <Button variant="outline" onClick={startNew} disabled={!account}>
          <Plus className="size-4" strokeWidth={1.75} aria-hidden />
          New flow
        </Button>
        <Button
          variant="signal"
          onClick={() => void save()}
          disabled={!draft || saving || Boolean(problem && !dirty)}
        >
          {saving ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <Save className="size-4" strokeWidth={1.75} aria-hidden />
          )}
          {isNew ? "Save flow" : "Save changes"}
        </Button>
      </ViewHead>

      <div className="flex gap-3 rounded-xl border border-info/25 bg-info-wash px-4 py-3 text-[12.5px] leading-relaxed text-info">
        <Info className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} aria-hidden />
        <p>
          Flows do not run on their own yet. The messages that actually send are
          the ones armed on a Reel in <strong>Automations</strong>; a flow records
          the longer sequence you are working towards.
        </p>
      </div>

      {flows.data.length === 0 && !draft ? (
        <EmptyState
          title="No flows yet"
          sub="A flow starts with one comment trigger and then the steps that follow it. You can map it here before you build the Reel automation."
        >
          <Button variant="signal" onClick={startNew}>
            <Plus className="size-4" strokeWidth={1.75} aria-hidden />
            Start a flow
          </Button>
        </EmptyState>
      ) : !draft ? (
        <LoadingBlock label="Opening the board" />
      ) : (
        <div className="glass-panel overflow-hidden rounded-2xl">
          {/* toolbar */}
          <div
            data-canvas-panel
            className="flex flex-wrap items-center gap-3 border-b border-line/60 px-4 py-3"
          >
            <div className="relative min-w-0">
              <select
                value={draft.id}
                onChange={(event) => openFlow(event.target.value)}
                aria-label="Open flow"
                className="max-w-[240px] appearance-none truncate rounded-md border border-line-strong bg-surface py-1.5 pl-2.5 pr-8 text-[13px] font-semibold text-ink outline-none transition-colors hover:border-ink-3 focus:border-signal"
              >
                {isNew && <option value={draft.id}>{draft.name} · unsaved</option>}
                {flows.data.map((flow) => (
                  <option key={flow.id} value={flow.id}>
                    {flow.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-ink-3"
                aria-hidden
              />
            </div>

            <input
              value={draft.name}
              onChange={(event) => mutate((flow) => ({ ...flow, name: event.target.value }))}
              aria-label="Flow name"
              className="w-44 truncate rounded-md border border-transparent bg-transparent px-1.5 py-1 text-[14px] font-semibold text-ink outline-none transition-colors hover:border-line focus:border-line-strong focus:bg-surface-2 sm:w-56"
            />

            <span className="caption tnum hidden sm:inline">
              {chain.length} {chain.length === 1 ? "step" : "steps"}
            </span>

            <span
              className={cn(
                "caption inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1",
                dirty
                  ? "border-warn/35 bg-warn-wash text-warn"
                  : "border-ok/30 bg-ok-wash text-ok"
              )}
            >
              {dirty ? (
                <>
                  <span className="size-1.5 rounded-full bg-warn" aria-hidden />
                  unsaved
                </>
              ) : (
                <>
                  <Check className="size-3" aria-hidden />
                  saved
                </>
              )}
            </span>

            <div className="ml-auto flex items-center gap-2">
              <div className="flex items-center gap-2 rounded-full border border-line-strong px-3 py-1.5">
                <span className="caption hidden sm:inline">Published</span>
                <Switch
                  checked={draft.isPublished}
                  onCheckedChange={(next) =>
                    mutate((flow) => ({
                      ...flow,
                      isPublished: next,
                      isActive: next ? true : flow.isActive,
                    }))
                  }
                  aria-label="Mark this flow as published"
                />
              </div>
              {!isNew && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirmFlowDelete(true)}
                  className="text-bad hover:bg-bad-wash hover:text-bad"
                >
                  <Trash2 className="size-3.5" strokeWidth={1.75} aria-hidden />
                  Delete
                </Button>
              )}
            </div>
          </div>

          {confirmFlowDelete && (
            <div className="flex flex-wrap items-center gap-3 border-b border-line/60 bg-bad-wash px-4 py-2.5 text-[12.5px] text-bad">
              <span>Delete “{draft.name}”? This cannot be undone.</span>
              <div className="ml-auto flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmFlowDelete(false)}
                  className="rounded-md border border-line bg-surface px-2.5 py-1 font-semibold text-ink-2"
                >
                  Keep
                </button>
                <button
                  type="button"
                  onClick={() => void removeFlow()}
                  className="rounded-md bg-bad px-2.5 py-1 font-semibold text-bad-ink"
                >
                  Delete flow
                </button>
              </div>
            </div>
          )}

          {pendingFlow && (
            <div className="flex flex-wrap items-center gap-3 border-b border-line/60 bg-warn-wash px-4 py-2.5 text-[12.5px] text-warn">
              <span>You have unsaved changes on this flow.</span>
              <div className="ml-auto flex gap-2">
                <button
                  type="button"
                  onClick={() => setPendingFlow(null)}
                  className="rounded-md border border-line bg-surface px-2.5 py-1 font-semibold text-ink-2"
                >
                  Keep editing
                </button>
                <button
                  type="button"
                  onClick={discardAndOpen}
                  className="rounded-md bg-warn px-2.5 py-1 font-semibold text-ink-invert"
                >
                  Discard
                </button>
              </div>
            </div>
          )}

          {(formError || problem) && (
            <div
              role="alert"
              className="flex items-start gap-2 border-b border-line/60 bg-surface-2/60 px-4 py-2.5 text-[12.5px] leading-relaxed text-ink-2"
            >
              <AlertCircle className="mt-0.5 size-3.5 shrink-0 text-warn" aria-hidden />
              <span>{formError ?? problem}</span>
            </div>
          )}

          {/* viewport */}
          <div
            ref={viewportRef}
            onPointerDown={startPan}
            className="relative h-[calc(100vh-300px)] min-h-[520px] select-none overflow-hidden bg-surface-2/70"
            style={{ touchAction: "none" }}
          >
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

            {/* the board */}
            <div
              className="absolute left-0 top-0"
              style={{
                transform: `translate(${view.x}px, ${view.y}px) scale(${view.z})`,
                transformOrigin: "0 0",
              }}
            >
              <svg
                className="pointer-events-none absolute left-0 top-0 overflow-visible"
                width="1"
                height="1"
                aria-hidden
              >
                <defs>
                  <marker
                    id="flow-arrow"
                    viewBox="0 0 10 10"
                    refX="8.5"
                    refY="5"
                    markerWidth="6.5"
                    markerHeight="6.5"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 1 L 9 5 L 0 9 z" fill="var(--ink-3)" />
                  </marker>
                </defs>
                {chain.slice(1).map((node, index) => (
                  <path
                    key={node.id}
                    d={edgePath(chain[index], node)}
                    fill="none"
                    stroke="var(--line-strong)"
                    strokeWidth={1.8}
                    markerEnd="url(#flow-arrow)"
                  />
                ))}
              </svg>

              {chain.map((node, index) => {
                const meta = NODE_META[node.type];
                const isSelected = selected === node.id;
                return (
                  <div
                    key={node.id}
                    style={{
                      left: node.position.x,
                      top: node.position.y,
                      width: NODE_W,
                    }}
                    onPointerDown={(event) => startDrag(event, node)}
                    className={cn(
                      "absolute cursor-grab rounded-xl border bg-surface shadow-[var(--sh-1)] transition-[border-color,box-shadow] duration-150 active:cursor-grabbing",
                      isSelected
                        ? "border-signal ring-2 ring-signal/25"
                        : "border-line hover:border-ink-3"
                    )}
                  >
                    <div className="flex items-start gap-2.5 px-3 py-2.5">
                      <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-md bg-surface-2">
                        <meta.icon
                          className={cn("size-3.5", meta.tone)}
                          strokeWidth={1.75}
                          aria-hidden
                        />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[12.5px] font-semibold leading-tight text-ink">
                          {meta.label}
                        </p>
                        <p className="mt-0.5 truncate text-[11px] leading-relaxed text-ink-3">
                          {summaryOf(node)}
                        </p>
                      </div>
                      <span className="mt-0.5 shrink-0 font-mono text-[10px] text-ink-3 tnum">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-t border-line/70 px-3 py-1.5">
                      <span className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-ink-3">
                        {meta.group}
                      </span>
                      {index === chain.length - 1 ? (
                        <button
                          type="button"
                          onPointerDown={(event) => event.stopPropagation()}
                          onClick={() => {
                            setSelected(node.id);
                            setPalette(true);
                          }}
                          className="inline-flex items-center gap-1 rounded text-[10.5px] font-semibold text-signal hover:text-signal-hover"
                        >
                          <Plus className="size-3" aria-hidden />
                          next
                        </button>
                      ) : (
                        <span className="font-mono text-[9.5px] text-ink-3">
                          step {index + 1} of {chain.length}
                        </span>
                      )}
                    </div>

                    {/* ports: decorative, the chain owns the wiring */}
                    {index > 0 && (
                      <span
                        aria-hidden
                        className="absolute -left-[6px] top-[24px] size-3 rounded-full border-2 border-line-strong bg-surface"
                      />
                    )}
                    {index < chain.length - 1 && (
                      <span
                        aria-hidden
                        className="absolute -right-[6px] top-[24px] size-3 rounded-full border-2 border-signal bg-surface"
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {chain.length === 0 && (
              <div className="absolute inset-0 grid place-items-center px-6 text-center">
                <div>
                  <p className="h4 text-ink">Every flow starts with a comment</p>
                  <p className="mt-1.5 text-[13px] text-ink-3">
                    Add the trigger that listens for a keyword.
                  </p>
                  <Button
                    variant="signal"
                    className="mt-5"
                    onClick={() => {
                      setSelected(null);
                      setPalette(true);
                    }}
                  >
                    <Plus className="size-4" strokeWidth={1.75} aria-hidden />
                    Add trigger
                  </Button>
                </div>
              </div>
            )}

            {/* zoom controls */}
            <div
              data-canvas-panel
              className="glass-chip absolute bottom-3 left-3 z-10 flex items-center gap-0.5 rounded-full p-1"
            >
              <button
                type="button"
                onClick={() =>
                  setView((current) => ({
                    ...current,
                    z: clamp(current.z * 0.85, Z_MIN, Z_MAX),
                  }))
                }
                className="grid size-7 place-items-center rounded-full text-ink-3 transition-colors hover:bg-surface-2 hover:text-ink"
                aria-label="Zoom out"
              >
                <Minus className="size-3.5" aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => setView((current) => ({ ...current, z: 1 }))}
                title="Reset zoom to 100%"
                className="w-12 rounded-md py-1 text-center font-mono text-[11px] text-ink-3 tnum transition-colors hover:bg-surface-2 hover:text-ink"
              >
                {Math.round(view.z * 100)}%
              </button>
              <button
                type="button"
                onClick={() =>
                  setView((current) => ({
                    ...current,
                    z: clamp(current.z * 1.15, Z_MIN, Z_MAX),
                  }))
                }
                className="grid size-7 place-items-center rounded-full text-ink-3 transition-colors hover:bg-surface-2 hover:text-ink"
                aria-label="Zoom in"
              >
                <Plus className="size-3.5" aria-hidden />
              </button>
              <span className="mx-0.5 h-4 w-px bg-line" aria-hidden />
              <button
                type="button"
                onClick={fitView}
                className="grid size-7 place-items-center rounded-full text-ink-3 transition-colors hover:bg-surface-2 hover:text-ink"
                aria-label="Fit the chain in view"
              >
                <Maximize className="size-3.5" aria-hidden />
              </button>
            </div>

            {/* add step */}
            <div data-canvas-panel className="absolute bottom-3 right-3 z-10">
              <Button variant="signal" onClick={() => setPalette(true)}>
                <Plus className="size-4" strokeWidth={1.75} aria-hidden />
                Add step
              </Button>
            </div>

            <p className="caption pointer-events-none absolute bottom-4 left-1/2 z-10 hidden -translate-x-1/2 xl:block">
              drag the board to pan · scroll to zoom · drag a card to move it
            </p>

            {/* step library */}
            {palette && (
              <aside
                data-canvas-panel
                className="absolute bottom-3 left-3 top-3 z-20 flex w-[300px] max-w-[calc(100%-24px)] touch-auto flex-col overflow-hidden rounded-2xl border border-line/60 bg-surface/95 shadow-[var(--sh-2)] backdrop-blur-2xl"
                onPointerDown={(event) => event.stopPropagation()}
              >
                <div className="flex items-center justify-between border-b border-line px-4 py-3">
                  <div>
                    <p className="text-[14px] font-semibold text-ink">What happens next?</p>
                    <p className="caption">Step library</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPalette(false)}
                    className="grid size-7 place-items-center rounded-md text-ink-3 transition-colors hover:bg-surface-2 hover:text-ink"
                    aria-label="Close step library"
                  >
                    <X className="size-4" aria-hidden />
                  </button>
                </div>

                <div className="border-b border-line px-3 py-2.5">
                  <div className="flex items-center gap-2 rounded-md border border-line-strong bg-surface-2 px-3 py-2 focus-within:border-signal">
                    <Search className="size-3.5 shrink-0 text-ink-3" aria-hidden />
                    <input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search steps…"
                      className="w-full bg-transparent text-[13px] text-ink outline-none placeholder:text-ink-3"
                    />
                  </div>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2">
                  {GROUPS.map((group) => {
                    const items = filteredTypes.filter(
                      (type) => NODE_META[type].group === group
                    );
                    if (!items.length) return null;
                    return (
                      <div key={group} className="mb-1.5">
                        <p className="caption px-2 py-1.5">{group}</p>
                        {items.map((type) => {
                          const meta = NODE_META[type];
                          const blocked = type === "trigger_comment" && triggerPresent;
                          return (
                            <button
                              key={type}
                              type="button"
                              disabled={blocked}
                              onClick={() => addNode(type)}
                              className={cn(
                                "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left transition-colors",
                                blocked
                                  ? "cursor-not-allowed opacity-45"
                                  : "hover:bg-surface-2"
                              )}
                            >
                              <span className="grid size-8 shrink-0 place-items-center rounded-md bg-surface-2">
                                <meta.icon
                                  className={cn("size-4", meta.tone)}
                                  strokeWidth={1.75}
                                  aria-hidden
                                />
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-[13px] font-semibold text-ink">
                                  {meta.label}
                                </span>
                                <span className="block truncate text-[11px] text-ink-3">
                                  {blocked ? "Already in this flow" : meta.sub}
                                </span>
                              </span>
                              {!blocked && (
                                <Plus className="size-3.5 shrink-0 text-ink-3" aria-hidden />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}
                  {!filteredTypes.length && (
                    <p className="px-3 py-6 text-center text-[12.5px] text-ink-3">
                      Nothing matches “{search}”.
                    </p>
                  )}
                </div>

                <p className="border-t border-line px-4 py-2.5 text-[11.5px] leading-relaxed text-ink-3">
                  Steps are appended to the end of the chain. Use the arrows in the
                  inspector to reorder them.
                </p>
              </aside>
            )}

            {/* inspector */}
            {selectedNode && (
              <aside
                data-canvas-panel
                className="absolute bottom-3 right-3 top-3 z-20 flex w-[320px] max-w-[calc(100%-24px)] touch-auto flex-col overflow-hidden rounded-2xl border border-line/60 bg-surface/95 shadow-[var(--sh-2)] backdrop-blur-2xl"
                onPointerDown={(event) => event.stopPropagation()}
              >
                <div className="flex items-center gap-2.5 border-b border-line px-4 py-3">
                  <span className="grid size-8 shrink-0 place-items-center rounded-md bg-surface-2">
                    {React.createElement(NODE_META[selectedNode.type].icon, {
                      className: cn("size-4", NODE_META[selectedNode.type].tone),
                      strokeWidth: 1.75,
                    })}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-ink">
                      {NODE_META[selectedNode.type].label}
                    </p>
                    <p className="caption">
                      Step {chain.findIndex((node) => node.id === selectedNode.id) + 1} of{" "}
                      {chain.length}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelected(null)}
                    className="grid size-7 place-items-center rounded-md text-ink-3 transition-colors hover:bg-surface-2 hover:text-ink"
                    aria-label="Close inspector"
                  >
                    <X className="size-4" aria-hidden />
                  </button>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
                  <NodeFields
                    node={selectedNode}
                    reels={reels.data}
                    onChange={(patch) => setConfig(selectedNode.id, patch)}
                  />

                  <div className="mt-5 space-y-2 border-t border-line pt-4">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={
                          chain.findIndex((node) => node.id === selectedNode.id) <= 1
                        }
                        onClick={() => moveNode(selectedNode.id, -1)}
                        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md border border-line-strong py-2 text-[12px] font-medium text-ink-2 transition-colors hover:border-ink-3 hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <ArrowUp className="size-3.5" aria-hidden />
                        Earlier
                      </button>
                      <button
                        type="button"
                        disabled={
                          chain.findIndex((node) => node.id === selectedNode.id) ===
                          chain.length - 1
                        }
                        onClick={() => moveNode(selectedNode.id, 1)}
                        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md border border-line-strong py-2 text-[12px] font-medium text-ink-2 transition-colors hover:border-ink-3 hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <ArrowDown className="size-3.5" aria-hidden />
                        Later
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeNode(selectedNode.id)}
                      className="inline-flex w-full items-center justify-center gap-1.5 rounded-md py-2 text-[12px] font-medium text-bad transition-colors hover:bg-bad-wash"
                    >
                      <Trash2 className="size-3.5" aria-hidden />
                      Remove step
                    </button>
                  </div>
                </div>
              </aside>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ==========================================================================
   Inspector fields, one branch per node type
   ========================================================================== */

function NodeFields({
  node,
  reels,
  onChange,
}: {
  node: FlowNode;
  reels: Array<{ id: string; caption?: string; permalink: string }>;
  onChange: (patch: Record<string, unknown>) => void;
}) {
  const config = node.config;

  if (node.type === "trigger_comment") {
    const keywords = asTextList(config.keywords);
    return (
      <div className="space-y-4">
        <Field label="Keywords" hint="Comma separated">
          <input
            value={keywords.join(", ")}
            onChange={(event) =>
              onChange({
                keywords: Array.from(
                  new Set(
                    event.target.value
                      .split(",")
                      .map((word) => word.trim().toLowerCase().replace(/\s+/g, ""))
                      .filter(Boolean)
                      .slice(0, 12)
                  )
                ),
              })
            }
            placeholder="price, link, guide"
            className={cn(inputCls, "font-mono text-[12.5px]")}
          />
        </Field>

        <Field label="Reel" hint="Which Reel this listens to">
          <select
            value={asText(config.mediaId)}
            onChange={(event) => onChange({ mediaId: event.target.value })}
            className={inputCls}
          >
            <option value="">Any Reel</option>
            {reels.map((reel) => (
              <option key={reel.id} value={reel.id}>
                {reel.caption?.slice(0, 48) || reel.permalink}
              </option>
            ))}
          </select>
        </Field>

        <p className="text-[11.5px] leading-relaxed text-ink-3">
          Keywords are matched against the comment text, case-insensitively.
        </p>
      </div>
    );
  }

  if (node.type === "action_reply") {
    return (
      <Field label="Public reply" hint="Up to 2,200 characters">
        <textarea
          rows={5}
          value={asText(config.text)}
          onChange={(event) => onChange({ text: event.target.value.slice(0, 2200) })}
          placeholder="Sent it to your DMs — check your inbox."
          className={cn(inputCls, "resize-none")}
        />
      </Field>
    );
  }

  if (node.type === "action_dm_text") {
    return (
      <Field label="Direct message" hint="Up to 1,000 characters">
        <textarea
          rows={5}
          value={asText(config.text)}
          onChange={(event) => onChange({ text: event.target.value.slice(0, 1000) })}
          placeholder="Here is the link I promised."
          className={cn(inputCls, "resize-none")}
        />
      </Field>
    );
  }

  if (node.type === "action_wait") {
    const minutes = asNumber(config.minutes, 30);
    return (
      <div className="space-y-3">
        <Field label="Wait" hint="5 to 1,440 minutes">
          <input
            type="number"
            min={5}
            max={1440}
            value={minutes}
            onChange={(event) =>
              onChange({
                minutes: clamp(Number(event.target.value) || 5, 5, 1440),
              })
            }
            className={cn(inputCls, "tnum")}
          />
        </Field>
        <div className="flex flex-wrap gap-1.5">
          {[5, 15, 60, 240].map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => onChange({ minutes: preset })}
              className={cn(
                "rounded-md border px-2 py-1 text-[11.5px] font-semibold transition-colors",
                minutes === preset
                  ? "border-signal bg-signal-wash text-signal"
                  : "border-line text-ink-3 hover:border-ink-3 hover:text-ink"
              )}
            >
              {preset}m
            </button>
          ))}
        </div>
      </div>
    );
  }

  /* action_dm_card */
  const buttons = asButtons(config.buttons);
  return (
    <div className="space-y-4">
      <Field label="Card title" hint="Max 80 characters">
        <input
          value={asText(config.title)}
          onChange={(event) => onChange({ title: event.target.value.slice(0, 80) })}
          placeholder="The Creator OS pack"
          className={inputCls}
        />
      </Field>

      <Field label="Subtitle" hint="Optional">
        <input
          value={asText(config.subtitle)}
          onChange={(event) => onChange({ subtitle: event.target.value.slice(0, 80) })}
          placeholder="Three templates, no email needed"
          className={inputCls}
        />
      </Field>

      <div>
        <p className="caption mb-2">Buttons</p>
        <div className="space-y-2">
          {buttons.map((button, index) => (
            <div key={index} className="space-y-1.5 rounded-lg border border-line p-2">
              <div className="flex items-center gap-2">
                <input
                  value={button.title}
                  maxLength={20}
                  onChange={(event) =>
                    onChange({
                      buttons: buttons.map((item, position) =>
                        position === index
                          ? { ...item, title: event.target.value }
                          : item
                      ),
                    })
                  }
                  placeholder="Button label"
                  className={cn(inputCls, "flex-1 py-1.5 text-[12.5px]")}
                />
                <button
                  type="button"
                  onClick={() =>
                    onChange({
                      buttons: buttons.filter((_, position) => position !== index),
                    })
                  }
                  className="grid size-7 shrink-0 place-items-center rounded-md text-ink-3 hover:bg-bad-wash hover:text-bad"
                  aria-label="Remove button"
                >
                  <X className="size-3.5" aria-hidden />
                </button>
              </div>
              <input
                value={button.url ?? ""}
                onChange={(event) =>
                  onChange({
                    buttons: buttons.map((item, position) =>
                      position === index
                        ? { ...item, url: event.target.value }
                        : item
                    ),
                  })
                }
                placeholder="https://…"
                className={cn(inputCls, "py-1.5 font-mono text-[11.5px]")}
              />
            </div>
          ))}
        </div>
        {buttons.length < 3 && (
          <button
            type="button"
            onClick={() => onChange({ buttons: [...buttons, { title: "Open link", url: "" }] })}
            className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-line-strong py-2 text-[12px] font-medium text-ink-2 transition-colors hover:border-ink-3 hover:text-ink"
          >
            <Plus className="size-3.5" aria-hidden />
            Add button
          </button>
        )}
        <p className="mt-2 text-[11px] leading-relaxed text-ink-3">
          Meta allows up to three buttons, and each label is limited to 20
          characters.
        </p>
      </div>
    </div>
  );
}
