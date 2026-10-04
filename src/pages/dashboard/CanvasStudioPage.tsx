import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import {
  Background,
  Controls,
  Handle,
  MiniMap,
  Position,
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  useEdgesState,
  useNodesState,
  type Connection,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import "./phase3.css";
import {
  AlertCircle,
  Check,
  GitBranch,
  Loader2,
  Play,
  Plus,
  Save,
  Trash2,
  Workflow,
} from "lucide-react";
import { api, ApiError } from "@/lib/api";
import {
  createStarterGraph,
  describeNode,
  NODE_LABELS,
  validateFlowGraph,
} from "@/lib/flowGraph";
import type { Flow, FlowGraph, FlowNodeType } from "@/types/contracts";
import { useDashboard } from "./DashboardContext";

const FLOW_LIMIT = 25;

/**
 * Demo sample. Without it the Canvas would open empty in demo mode, which is
 * useless for inspecting the tier — the whole point of the preview switcher is
 * to see the real editor. Demo data is never saved (writes are disabled below).
 */
const DEMO_FLOWS: Flow[] = [
  {
    id: "flow_demo_1",
    accountId: "acc_demo_pilot" as Flow["accountId"],
    name: "Guide comment → link",
    graph: createStarterGraph(),
    isActive: true,
    isPublished: true,
    createdAt: 1756800000,
    updatedAt: 1756900000,
  },
  {
    id: "flow_demo_2",
    accountId: "acc_demo_pilot" as Flow["accountId"],
    name: "VIP → reply, wait, nudge",
    graph: {
      nodes: [
        { id: "t", type: "trigger_comment", position: { x: 0, y: 0 }, config: { keywords: ["VIP"] } },
        {
          id: "r",
          type: "action_reply",
          position: { x: 300, y: 0 },
          config: { text: "On it, {username} — sending your link now." },
        },
        {
          id: "w",
          type: "action_wait",
          position: { x: 600, y: 0 },
          config: { minutes: 60 },
        },
        {
          id: "d",
          type: "action_dm_text",
          position: { x: 900, y: 0 },
          config: { text: "Still want it, {username}? 👇" },
        },
      ],
      edges: [
        { id: "t->r", source: "t", target: "r" },
        { id: "r->w", source: "r", target: "w" },
        { id: "w->d", source: "w", target: "d" },
      ],
    },
    isActive: true,
    isPublished: false,
    createdAt: 1756700000,
    updatedAt: 1756800000,
  },
];

/* ── node visuals ──────────────────────────────────────────────────
   One component per node type keeps the palette and the canvas in sync:
   a type that isn't registered here simply can't be rendered. */
type StudioNodeData = { label: string; detail: string; kind: FlowNodeType };

function NodeShell({ data, selected }: NodeProps) {
  const d = data as StudioNodeData;
  return (
    <div className={`cvs-node cvs-node--${d.kind} ${selected ? "is-selected" : ""}`}>
      <Handle type="target" position={Position.Left} className="cvs-handle" />
      <span className="cvs-node__kind">{NODE_LABELS[d.kind].title}</span>
      <span className="cvs-node__detail">{d.detail}</span>
      <Handle type="source" position={Position.Right} className="cvs-handle" />
    </div>
  );
}

const NODE_COMPONENTS = {
  trigger_comment: NodeShell,
  action_reply: NodeShell,
  action_dm_card: NodeShell,
  action_dm_text: NodeShell,
  action_wait: NodeShell,
} as const;

/** Graph JSON -> React Flow nodes, keeping our own fields in `data`. */
function toRfNodes(graph: FlowGraph): Node[] {
  return graph.nodes.map((n) => ({
    id: n.id,
    // React Flow resolves the renderer from node.type via nodeTypes. Hardcoding
    // "default" here would silently fall back to the library's built-in node and
    // drop every token style, so the type must be our own node type.
    type: n.type,
    position: n.position,
    data: {
      label: NODE_LABELS[n.type].title,
      detail: describeNode(n),
      kind: n.type,
      nodeType: n.type,
      config: n.config,
    } as unknown as StudioNodeData,
  }));
}

function toRfEdges(graph: FlowGraph): Edge[] {
  return graph.edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
  }));
}

/** React Flow nodes -> the canonical graph JSON the API validates. */
function toGraph(nodes: Node[], edges: Edge[]): FlowGraph {
  return {
    nodes: nodes.map((n) => {
      const data = n.data as unknown as {
        nodeType: FlowNodeType;
        config: Record<string, unknown>;
      };
      return {
        id: n.id,
        type: data.nodeType,
        position: { x: Math.round(n.position.x), y: Math.round(n.position.y) },
        config: data.config ?? {},
      };
    }),
    edges: edges.map((e) => ({ id: e.id, source: e.source, target: e.target })),
  };
}

function CanvasEditor() {
  const { currentAccount, selectedAccountId, isDemo } = useDashboard();
  const plan = currentAccount?.plan ?? "free";
  const locked = plan !== "studio";

  const [flows, setFlows] = useState<Flow[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [flowName, setFlowName] = useState("");
  const [graphError, setGraphError] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const activeFlow = useMemo(
    () => flows.find((f) => f.id === activeId) ?? null,
    [flows, activeId]
  );

  const loadFlows = useCallback(async () => {
    if (!selectedAccountId) {
      setIsLoading(false);
      return;
    }
    if (isDemo) {
      setFlows(DEMO_FLOWS);
      setActiveId((prev) => prev ?? DEMO_FLOWS[0].id);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const { flows: rows } = await api.flows.list(selectedAccountId);
      setFlows(rows);
      if (rows.length > 0) {
        setActiveId((prev) => prev ?? rows[0].id);
      }
    } catch (err) {
      setError(
        err instanceof ApiError && err.code === "CANVAS_LOCKED"
          ? "Canvas Studio is a Studio-tier feature."
          : "Couldn't load your flows. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  }, [selectedAccountId, isDemo]);

  useEffect(() => {
    loadFlows();
  }, [loadFlows]);

  // Load the selected flow into the canvas whenever it changes.
  useEffect(() => {
    if (!activeFlow) return;
    const parsed = validateFlowGraph(activeFlow.graph);
    const graph = "graph" in parsed ? parsed.graph : createStarterGraph();
    setNodes(toRfNodes(graph));
    setEdges(toRfEdges(graph));
    setFlowName(activeFlow.name);
    setGraphError(null);
    setSelectedNodeId(null);
  }, [activeFlow, setNodes, setEdges]);

  const onConnect = useCallback(
    (conn: Connection) => {
      // Linear chains only: a node gets exactly one outgoing step. The handle
      // still accepts the drag so the canvas feels natural, but we reject the
      // second wire with the same wording the server would use.
      const source = conn.source;
      if (edges.some((e) => e.source === source)) {
        setGraphError(
          "Branching isn't supported yet — each step can have one next step."
        );
        return;
      }
      setGraphError(null);
      setEdges((eds) => addEdge({ ...conn, id: `${source}->${conn.target}` }, eds));
    },
    [edges, setEdges]
  );

  /** Editing a node's config writes back through the same graph shape. */
  const patchNodeConfig = (nodeId: string, patch: Record<string, unknown>) => {
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id !== nodeId) return n;
        const data = n.data as unknown as {
          nodeType: FlowNodeType;
          config: Record<string, unknown>;
        };
        const config = { ...(data.config || {}), ...patch };
        return {
          ...n,
          data: {
            ...n.data,
            config,
            detail: describeNode({ id: n.id, type: data.nodeType, position: n.position, config }),
          } as unknown as StudioNodeData,
        } as Node;
      })
    );
  };

  const addNode = (type: FlowNodeType) => {
    const id = `${type}_${Date.now().toString(36)}`;
    const node: Node = {
      id,
      type,
      position: { x: 120 + nodes.length * 40, y: 200 + nodes.length * 30 },
      data: {
        label: NODE_LABELS[type].title,
        detail: NODE_LABELS[type].title,
        kind: type,
        nodeType: type,
        config: defaultConfig(type),
      } as unknown as StudioNodeData,
    };
    setNodes((nds) => [...nds, node]);
    setSelectedNodeId(id);
    setNotice("Step added — connect it to the previous step.");
  };

  const removeNode = (nodeId: string) => {
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
    setSelectedNodeId((prev) => (prev === nodeId ? null : prev));
  };

  const save = async (publish: boolean) => {
    if (!selectedAccountId || !activeFlow) return;
    const candidate = toGraph(nodes, edges);
    const parsed = validateFlowGraph(candidate);
    if ("error" in parsed) {
      setGraphError(parsed.error);
      return;
    }
    setGraphError(null);
    setSaving(true);
    setError(null);
    try {
      const { flow } = await api.flows.save(selectedAccountId, {
        id: activeFlow.id,
        name: flowName.trim() || "Untitled flow",
        graph: parsed.graph,
        isPublished: publish,
      });
      setFlows((prev) => prev.map((f) => (f.id === flow.id ? flow : f)));
      setActiveId(flow.id);
      setNotice(publish ? "Flow published." : "Flow saved.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't save this flow.");
    } finally {
      setSaving(false);
    }
  };

  const createFlow = async () => {
    if (!selectedAccountId) return;
    if (flows.length >= FLOW_LIMIT) {
      setError(`You've reached the ${FLOW_LIMIT}-flow limit.`);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const { flow } = await api.flows.save(selectedAccountId, {
        name: `Flow ${flows.length + 1}`,
        graph: createStarterGraph(),
      });
      setFlows((prev) => [flow, ...prev]);
      setActiveId(flow.id);
      setNotice("New flow created.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't create a flow.");
    } finally {
      setSaving(false);
    }
  };

  const deleteFlow = async (flow: Flow) => {
    if (!selectedAccountId) return;
    if (!window.confirm(`Delete “${flow.name}”? This can't be undone.`)) return;
    try {
      await api.flows.remove(selectedAccountId, flow.id);
      const remaining = flows.filter((f) => f.id !== flow.id);
      setFlows(remaining);
      setActiveId(remaining[0]?.id ?? null);
      setNotice("Flow deleted.");
    } catch {
      setError("Couldn't delete that flow.");
    }
  };

  if (locked) {
    return (
      <div className="pg-page">
        <div className="pg-head">
          <div>
            <span className="hm-eyebrow">Canvas Studio</span>
            <h1 className="hm-title">
              Build your own <em>flows.</em>
            </h1>
            <p className="pg-sub">
              Chain a trigger to as many steps as you like — reply, DM, wait, send again.
            </p>
          </div>
        </div>
        <div className="st-card st-empty">
          <div className="st-empty__icon">
            <Workflow aria-hidden />
          </div>
          <h3>Canvas Studio is a Studio feature</h3>
          <p>
            You're on the {plan === "free" ? "Free" : "Pro"} plan. Studio adds the visual flow
            builder, 3 Instagram accounts, priority queue and 5,000 AI credits a month.
          </p>
          <Link to="/dashboard/settings#billing" className="sh-btn sh-btn--accent st-empty__cta">
            Upgrade to Studio
          </Link>
        </div>
      </div>
    );
  }

  const selectedNode = selectedNodeId
    ? (nodes.find((n) => n.id === selectedNodeId) ?? null)
    : null;

  return (
    <div className="pg-page">
      <div className="pg-head">
        <div>
          <span className="hm-eyebrow">Canvas Studio</span>
          <h1 className="hm-title">
            Chain your <em>steps.</em>
          </h1>
          <p className="pg-sub">
            A comment lands → you reply, DM a card, wait, follow up. Linear chains run in order,
            inside Meta's window.
          </p>
        </div>
        {!isDemo && flows.length < FLOW_LIMIT && (
          <button
            type="button"
            className="sh-btn sh-btn--accent"
            onClick={createFlow}
            disabled={saving}
          >
            <Plus size={15} aria-hidden /> New flow
          </button>
        )}
        {isDemo && <span className="hm-soon">Sample data · read-only</span>}
      </div>

      {error && (
        <div className="sh-alert" role="alert" style={{ marginBottom: 16 }}>
          <AlertCircle size={16} aria-hidden />
          <span>{error}</span>
        </div>
      )}
      {notice && !error && !graphError && (
        <div className="sh-alert" role="status" style={{ marginBottom: 16 }}>
          <Check size={16} aria-hidden />
          <span>{notice}</span>
        </div>
      )}
      {graphError && (
        <div className="sh-alert" role="alert" style={{ marginBottom: 16 }}>
          <GitBranch size={16} aria-hidden />
          <span>{graphError}</span>
        </div>
      )}

      {isLoading ? (
        <div className="st-card st-empty">
          <Loader2 size={20} className="prd-spin" aria-hidden />
          <h3>Loading your flows…</h3>
        </div>
      ) : flows.length === 0 ? (
        <div className="st-card st-empty">
          <div className="st-empty__icon">
            <Workflow aria-hidden />
          </div>
          <h3>No flows yet</h3>
          <p>
            Create your first flow and RELO will run every step in order when someone comments.
          </p>
          <button
            type="button"
            className="sh-btn sh-btn--accent st-empty__cta"
            onClick={createFlow}
            disabled={saving || isDemo}
          >
            <Plus size={15} aria-hidden /> Create a flow
          </button>
        </div>
      ) : (
        <div className="cvs-layout">
          {/* ── flow list ── */}
          <aside className="cvs-sidebar" aria-label="Your flows">
            <ul className="cvs-list">
              {flows.map((f) => (
                <li key={f.id}>
                  <button
                    type="button"
                    className={`cvs-list__item ${f.id === activeId ? "is-active" : ""}`}
                    onClick={() => setActiveId(f.id)}
                    aria-current={f.id === activeId ? "true" : undefined}
                  >
                    <span className="cvs-list__name">{f.name}</span>
                    <span className="cvs-list__meta">
                      {f.graph?.nodes?.length ?? 0} steps
                      {f.isPublished ? " · live" : ""}
                    </span>
                  </button>
                  <button
                    type="button"
                    className="sh-iconbtn"
                    aria-label={`Delete ${f.name}`}
                    onClick={() => deleteFlow(f)}
                    disabled={isDemo}
                  >
                    <Trash2 size={13} aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          </aside>

          {/* ── canvas ── */}
          <section className="cvs-canvas-wrap" aria-label="Flow canvas">
            <div className="cvs-toolbar">
              <label className="st-field cvs-name">
                <span className="st-label">Flow name</span>
                <input
                  className="st-input"
                  value={flowName}
                  maxLength={80}
                  onChange={(e) => setFlowName(e.target.value)}
                  disabled={isDemo}
                />
              </label>
              <div className="cvs-toolbar__actions">
                <span className="cvs-count">
                  {nodes.length} steps · {edges.length} connection{edges.length === 1 ? "" : "s"}
                </span>
                <button
                  type="button"
                  className="sh-btn sh-btn--ghost"
                  onClick={() => save(false)}
                  disabled={saving || isDemo}
                >
                  <Save size={14} aria-hidden /> Save
                </button>
                <button
                  type="button"
                  className="sh-btn sh-btn--accent"
                  onClick={() => save(true)}
                  disabled={saving || isDemo}
                >
                  <Play size={14} aria-hidden /> Publish
                </button>
              </div>
            </div>

            <div className="cvs-canvas">
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={(_, node) => setSelectedNodeId(node.id)}
                onPaneClick={() => setSelectedNodeId(null)}
                nodeTypes={NODE_COMPONENTS}
                // A flow is capped at 50 nodes, so viewport culling buys nothing
                // and drops edges whenever the canvas has not been measured yet.
                onlyRenderVisibleElements={false}
                fitView
                proOptions={{ hideAttribution: true }}
                nodesDraggable={!isDemo}
                nodesConnectable={!isDemo}
              >
                <Background gap={18} size={1} />
                <Controls showInteractive={false} />
                <MiniMap pannable zoomable />
              </ReactFlow>
            </div>

            <div className="cvs-palette" role="group" aria-label="Add a step">
              <span className="cvs-palette__label">Add step</span>
              {FLOW_PALETTE.map((p) => (
                <button
                  key={p.type}
                  type="button"
                  className="sh-btn sh-btn--ghost cvs-palette__btn"
                  onClick={() => addNode(p.type)}
                  disabled={isDemo}
                  title={p.blurb}
                >
                  <Plus size={13} aria-hidden /> {p.title}
                </button>
              ))}
            </div>
          </section>

          {/* ── inspector ── */}
          <aside className="cvs-inspector" aria-label="Step settings">
            <h3 className="cvs-inspector__title">Step settings</h3>
            {selectedNode ? (
              <StepInspector
                node={selectedNode}
                onPatch={(patch) => patchNodeConfig(selectedNode.id, patch)}
                onRemove={() => removeNode(selectedNode.id)}
              />
            ) : (
              <p className="cvs-inspector__empty">
                Click a step on the canvas to configure it, or add one from the palette.
              </p>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}

const FLOW_ORDER: FlowNodeType[] = [
  "action_reply",
  "action_dm_card",
  "action_dm_text",
  "action_wait",
];

const FLOW_PALETTE = FLOW_ORDER.map((type) => ({ type, ...NODE_LABELS[type] }));

function defaultConfig(type: FlowNodeType): Record<string, unknown> {
  switch (type) {
    case "trigger_comment":
      return { keywords: [], mediaId: "" };
    case "action_reply":
      return { text: "Hey {username}! Grab the details 👇" };
    case "action_dm_card":
      return { title: "", subtitle: "", buttons: [] };
    case "action_dm_text":
      return { text: "Here's what you asked for 👇" };
    case "action_wait":
      return { minutes: 60 };
    default:
      return {};
  }
}

function StepInspector({
  node,
  onPatch,
  onRemove,
}: {
  node: Node;
  onPatch: (patch: Record<string, unknown>) => void;
  onRemove: () => void;
}) {
  const data = node.data as unknown as {
    nodeType: FlowNodeType;
    config: Record<string, unknown>;
  };
  const type = data.nodeType;
  const config = data.config || {};

  return (
    <div className="cvs-inspector__body">
      <div className="cvs-inspector__kind">
        {NODE_LABELS[type].title}
        <span className="cvs-inspector__blurb">{NODE_LABELS[type].blurb}</span>
      </div>

      {type === "trigger_comment" && (
        <label className="st-field">
          <span className="st-label">Trigger keywords</span>
          <input
            className="st-input"
            value={Array.isArray(config.keywords) ? (config.keywords as string[]).join(", ") : ""}
            onChange={(e) =>
              onPatch({
                keywords: e.target.value
                  .split(",")
                  .map((s) => s.trim().toUpperCase())
                  .filter(Boolean),
              })
            }
            placeholder="GUIDE, VIP"
          />
          <span className="st-hint">Leave empty to catch any comment.</span>
        </label>
      )}

      {(type === "action_reply" || type === "action_dm_text") && (
        <label className="st-field">
          <span className="st-label">Message</span>
          <textarea
            className="st-input"
            rows={4}
            maxLength={1000}
            value={String(config.text || "")}
            onChange={(e) => onPatch({ text: e.target.value })}
            placeholder="Hey {username}! Here's the link 👇"
          />
          <span className="st-hint">
            <code>{"{username}"}</code> merges their handle — the anti-spam trick that keeps
            replies from reading like a broadcast.
          </span>
        </label>
      )}

      {type === "action_dm_card" && (
        <>
          <label className="st-field">
            <span className="st-label">Card title</span>
            <input
              className="st-input"
              maxLength={80}
              value={String(config.title || "")}
              onChange={(e) => onPatch({ title: e.target.value })}
              placeholder="New drop"
            />
          </label>
          <label className="st-field">
            <span className="st-label">Subtitle</span>
            <input
              className="st-input"
              maxLength={80}
              value={String(config.subtitle || "")}
              onChange={(e) => onPatch({ subtitle: e.target.value })}
              placeholder="20% off until Sunday"
            />
          </label>
          <CardButtonsEditor config={config} onPatch={onPatch} />
        </>
      )}

      {type === "action_wait" && (
        <label className="st-field">
          <span className="st-label">Wait (minutes)</span>
          <input
            className="st-input"
            type="number"
            min={1}
            max={1439}
            value={Number(config.minutes ?? 60)}
            onChange={(e) => onPatch({ minutes: Number(e.target.value) })}
          />
          <span className="st-hint">Must stay inside Meta's 24-hour window.</span>
        </label>
      )}

      <button type="button" className="sh-btn sh-btn--ghost cvs-remove" onClick={onRemove}>
        <Trash2 size={13} aria-hidden /> Remove this step
      </button>
    </div>
  );
}

function CardButtonsEditor({
  config,
  onPatch,
}: {
  config: Record<string, unknown>;
  onPatch: (patch: Record<string, unknown>) => void;
}) {
  const buttons = Array.isArray(config.buttons)
    ? (config.buttons as Array<{ type: string; title: string; url?: string }>)
    : [];

  const update = (next: typeof buttons) => onPatch({ buttons: next });

  return (
    <fieldset className="cvs-buttons">
      <legend className="st-label">Buttons (max 3)</legend>
      {buttons.map((b, i) => (
        <div className="cvs-buttons__row" key={i}>
          <input
            className="st-input"
            maxLength={20}
            value={b.title || ""}
            placeholder="Button title"
            onChange={(e) => {
              const next = [...buttons];
              next[i] = { ...next[i], title: e.target.value };
              update(next);
            }}
          />
          <input
            className="st-input"
            value={b.url || ""}
            placeholder="https://…"
            onChange={(e) => {
              const next = [...buttons];
              next[i] = { ...next[i], url: e.target.value, type: "web_url" };
              update(next);
            }}
          />
          <button
            type="button"
            className="sh-iconbtn"
            aria-label={`Remove button ${i + 1}`}
            onClick={() => update(buttons.filter((_, idx) => idx !== i))}
          >
            <Trash2 size={13} aria-hidden />
          </button>
        </div>
      ))}
      {buttons.length < 3 && (
        <button
          type="button"
          className="sh-btn sh-btn--ghost"
          onClick={() => update([...buttons, { type: "web_url", title: "", url: "" }])}
        >
          <Plus size={13} aria-hidden /> Add button
        </button>
      )}
    </fieldset>
  );
}

export default function CanvasStudioPage() {
  return (
    <ReactFlowProvider>
      <CanvasEditor />
    </ReactFlowProvider>
  );
}