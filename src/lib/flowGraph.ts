import type { FlowEdge, FlowGraph, FlowNode, FlowNodeType } from "@/types/contracts";

/**
 * Canvas graph validation, mirrored from backend/src/engine/flowGraph.ts.
 *
 * The rules are intentionally duplicated rather than fetched: the editor must
 * block a bad graph BEFORE the round-trip, and the owner sees the identical
 * wording whether the check fires here or on the server. The backend test
 * suite (phase9) is what keeps the two copies honest.
 */

export const FLOW_NODE_TYPES: readonly FlowNodeType[] = [
  "trigger_comment",
  "action_reply",
  "action_dm_card",
  "action_dm_text",
  "action_wait",
];

export const NODE_LABELS: Record<FlowNodeType, { title: string; blurb: string }> = {
  trigger_comment: {
    title: "Comment trigger",
    blurb: "Starts when someone comments with a matching keyword.",
  },
  action_reply: {
    title: "Public reply",
    blurb: "Posts a visible comment reply under their comment.",
  },
  action_dm_card: {
    title: "Send card DM",
    blurb: "DMs a tappable card with up to 3 buttons.",
  },
  action_dm_text: {
    title: "Send text DM",
    blurb: "DMs a plain message. {username} merges their handle.",
  },
  action_wait: {
    title: "Wait",
    blurb: "Pauses the chain before the next step.",
  },
};

const NODE_TYPE_SET = new Set<string>(FLOW_NODE_TYPES);

const isFiniteNumber = (n: unknown): n is number =>
  typeof n === "number" && Number.isFinite(n);

export type GraphValidation = { ok: true; graph: FlowGraph } | { error: string };

/** Returns a sanitised graph, or the reason the engine could never run it. */
export function validateFlowGraph(input: unknown): GraphValidation {
  if (!input || typeof input !== "object") {
    return { error: "A flow needs a graph object." };
  }
  const raw = input as { nodes?: unknown; edges?: unknown };
  if (!Array.isArray(raw.nodes) || !Array.isArray(raw.edges)) {
    return { error: "A flow graph needs `nodes` and `edges` arrays." };
  }
  if (raw.nodes.length === 0) {
    return { error: "Add at least one node to your flow." };
  }
  if (raw.nodes.length > 50) {
    return { error: "A flow can hold at most 50 nodes." };
  }

  const nodes: FlowNode[] = [];
  const ids = new Set<string>();

  for (const rawNode of raw.nodes) {
    if (!rawNode || typeof rawNode !== "object") {
      return { error: "Every node must be an object." };
    }
    const n = rawNode as Partial<FlowNode>;
    const id = typeof n.id === "string" ? n.id.trim().slice(0, 64) : "";
    if (!id) return { error: "Every node needs an id." };
    if (ids.has(id)) return { error: `Duplicate node id: ${id}` };
    ids.add(id);

    const type = String(n.type || "");
    if (!NODE_TYPE_SET.has(type)) {
      return { error: `Unknown node type: ${type || "(missing)"}` };
    }

    const pos = (n.position || {}) as { x?: unknown; y?: unknown };
    nodes.push({
      id,
      type: type as FlowNodeType,
      position: {
        x: isFiniteNumber(pos.x) ? Math.round(pos.x) : 0,
        y: isFiniteNumber(pos.y) ? Math.round(pos.y) : 0,
      },
      config:
        n.config && typeof n.config === "object" && !Array.isArray(n.config)
          ? (n.config as Record<string, unknown>)
          : {},
    });
  }

  const triggers = nodes.filter((n) => n.type === "trigger_comment");
  if (triggers.length === 0) {
    return { error: "Every flow needs one trigger node." };
  }
  if (triggers.length > 1) {
    return { error: "A flow can only have one trigger — split it into separate flows." };
  }

  const edges: FlowEdge[] = [];
  const seenPairs = new Set<string>();
  for (const rawEdge of raw.edges) {
    if (!rawEdge || typeof rawEdge !== "object") {
      return { error: "Every edge must be an object." };
    }
    const e = rawEdge as Partial<FlowEdge>;
    const source = String(e.source || "");
    const target = String(e.target || "");
    if (!source || !target) return { error: "Every edge needs a source and a target." };
    if (!ids.has(source) || !ids.has(target)) {
      return { error: "An edge points at a node that doesn't exist." };
    }
    if (source === target) {
      return { error: "A node can't connect to itself." };
    }
    const pairKey = `${source}->${target}`;
    if (seenPairs.has(pairKey)) continue;
    seenPairs.add(pairKey);
    edges.push({
      id: typeof e.id === "string" && e.id ? e.id.slice(0, 80) : pairKey,
      source,
      target,
    });
  }

  const outDegree = new Map<string, number>();
  const inDegree = new Map<string, number>();
  for (const e of edges) {
    outDegree.set(e.source, (outDegree.get(e.source) || 0) + 1);
    inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1);
  }
  for (const [id, deg] of outDegree) {
    if (deg > 1) {
      return { error: `Branching isn't supported yet — node "${id}" has two outgoing steps.` };
    }
  }
  for (const [id, deg] of inDegree) {
    if (deg > 1) {
      return { error: `Node "${id}" has two incoming steps. Flows are linear chains.` };
    }
  }

  const adjacency = new Map<string, string>();
  for (const e of edges) adjacency.set(e.source, e.target);

  if (inDegree.get(triggers[0].id)) {
    return { error: "The trigger is the entry point — it can't have an incoming step." };
  }

  const reachable = new Set<string>([triggers[0].id]);
  let cursor = triggers[0].id;
  while (adjacency.has(cursor)) {
    cursor = adjacency.get(cursor)!;
    if (reachable.has(cursor)) {
      return { error: "This flow contains a loop. Flows must run in a straight line." };
    }
    reachable.add(cursor);
  }

  const orphans = nodes.filter((n) => !reachable.has(n.id)).map((n) => n.id);
  if (orphans.length > 0) {
    return { error: `These steps aren't connected to the trigger: ${orphans.join(", ")}.` };
  }

  return { ok: true, graph: { nodes, edges } };
}

/** What a brand-new Canvas flow opens with. */
export function createStarterGraph(): FlowGraph {
  return {
    nodes: [
      {
        id: "trigger",
        type: "trigger_comment",
        position: { x: 0, y: 0 },
        config: { keywords: [], mediaId: "" },
      },
      {
        id: "reply",
        type: "action_reply",
        position: { x: 320, y: 0 },
        config: { text: "Hey {username}! Grab the details 👇" },
      },
      {
        id: "card",
        type: "action_dm_card",
        position: { x: 640, y: 0 },
        config: { title: "", subtitle: "", buttons: [] },
      },
    ],
    edges: [
      { id: "trigger->reply", source: "trigger", target: "reply" },
      { id: "reply->card", source: "reply", target: "card" },
    ],
  };
}

/** Human-readable one-liner for a node, used on the node card itself. */
export function describeNode(node: FlowNode): string {
  const config = node.config || {};
  if (node.type === "trigger_comment") {
    const keywords = Array.isArray(config.keywords) ? (config.keywords as string[]) : [];
    return keywords.length > 0 ? keywords.join(", ") : "Any comment (* )";
  }
  if (node.type === "action_wait") {
    const minutes = Number(config.minutes ?? 0);
    return minutes > 0 ? `Wait ${minutes} min` : "Wait";
  }
  const text = String(config.text || config.title || "");
  return text.slice(0, 60) || NODE_LABELS[node.type].title;
}