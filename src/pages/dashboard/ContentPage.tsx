import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import {
  AlertCircle,
  CalendarDays,
  Check,
  Link2,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  Zap,
} from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useDashboard } from "./DashboardContext";
import type { ContentPlan, ContentStats, ContentStatus } from "@/types/contracts";
import "./phase3.css";

/**
 * Content planning (plan.md §7 Phase 2 — the competitive gap).
 *
 * The honest framing matters here and the copy reflects it: Meta has no
 * content-publishing API, so RELO does not claim to post for the creator. It
 * plans the idea and its hook, and once the Reel is live the creator links it
 * here so the planner can show which posts actually converted into DMs.
 */

const STATUSES: Array<{ value: ContentStatus; label: string }> = [
  { value: "idea", label: "Idea" },
  { value: "drafting", label: "Drafting" },
  { value: "scheduled", label: "Scheduled" },
  { value: "published", label: "Published" },
];

interface Draft {
  id?: string;
  title: string;
  hook: string;
  caption: string;
  status: ContentStatus;
  plannedFor: string;
}

const EMPTY_DRAFT: Draft = {
  title: "",
  hook: "",
  caption: "",
  status: "idea",
  plannedFor: "",
};

const DEMO_PLANS: ContentPlan[] = [
  {
    id: "plan_demo_1",
    accountId: "acc_demo_pilot" as ContentPlan["accountId"],
    title: "3 hooks that beat the first frame",
    hook: "Stop scrolling — your first 3 seconds decide everything.",
    caption: "Comment GUIDE and I'll send the full breakdown.",
    status: "scheduled",
    plannedFor: Math.floor(Date.now() / 1000) + 2 * 86400,
    createdAt: 0,
    updatedAt: 0,
  },
  {
    id: "plan_demo_2",
    accountId: "acc_demo_pilot" as ContentPlan["accountId"],
    title: "Why your Reels get no DMs",
    hook: "The algorithm isn't broken. Your CTA is.",
    caption: "Comment FIX and I'll send the checklist.",
    status: "published",
    plannedFor: Math.floor(Date.now() / 1000) - 4 * 86400,
    instagramMediaId: "reel_102",
    automationId: "auto_demo_1",
    createdAt: 0,
    updatedAt: 0,
  },
  {
    id: "plan_demo_3",
    accountId: "acc_demo_pilot" as ContentPlan["accountId"],
    title: "DM funnel teardown",
    hook: "",
    status: "idea",
    plannedFor: Math.floor(Date.now() / 1000) + 9 * 86400,
    createdAt: 0,
    updatedAt: 0,
  },
];

const DEMO_STATS: ContentStats = {
  idea: 1,
  drafting: 0,
  scheduled: 1,
  published: 1,
  converting: 1,
};

function toDateInput(unix: number): string {
  if (!unix) return "";
  return new Date(unix * 1000).toISOString().slice(0, 10);
}

export default function ContentPage() {
  const { currentAccount, selectedAccountId, isDemo } = useDashboard();
  const plan = currentAccount?.plan ?? "free";
  const locked = plan === "free";

  const [plans, setPlans] = useState<ContentPlan[]>([]);
  const [stats, setStats] = useState<ContentStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [linkReel, setLinkReel] = useState<ContentPlan | null>(null);

  const load = useCallback(async () => {
    if (!selectedAccountId) {
      setIsLoading(false);
      return;
    }
    if (isDemo) {
      setPlans(DEMO_PLANS);
      setStats(DEMO_STATS);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.contentPlans.list(selectedAccountId);
      setPlans(data.plans);
      setStats(data.stats);
    } catch (err) {
      setError(
        err instanceof ApiError && err.code === "CONTENT_LOCKED"
          ? "Content planning is a Pro feature."
          : "Couldn't load your planner. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  }, [selectedAccountId, isDemo]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    if (!draft || !selectedAccountId) return;
    if (!draft.title.trim()) {
      setError("Give the Reel a working title first.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const { plan: saved } = await api.contentPlans.save(selectedAccountId, {
        id: draft.id,
        title: draft.title.trim(),
        hook: draft.hook.trim() || undefined,
        caption: draft.caption.trim() || undefined,
        status: draft.status,
        plannedFor: draft.plannedFor ? Math.floor(Date.parse(draft.plannedFor) / 1000) : 0,
      });
      setPlans((prev) => {
        const next = prev.filter((p) => p.id !== saved.id);
        next.unshift(saved);
        return next;
      });
      setDraft(null);
      setNotice(draft.id ? "Plan updated." : "Plan added.");
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't save that plan.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (p: ContentPlan) => {
    if (!selectedAccountId) return;
    if (!window.confirm(`Delete “${p.title}”?`)) return;
    try {
      await api.contentPlans.remove(selectedAccountId, p.id);
      setPlans((prev) => prev.filter((x) => x.id !== p.id));
      setNotice("Plan deleted.");
      load();
    } catch {
      setError("Couldn't delete that plan.");
    }
  };

  const startEdit = (p: ContentPlan) =>
    setDraft({
      id: p.id,
      title: p.title,
      hook: p.hook ?? "",
      caption: p.caption ?? "",
      status: p.status,
      plannedFor: toDateInput(p.plannedFor),
    });

  if (locked) {
    return (
      <div className="pg-page">
        <div className="pg-head">
          <div>
            <span className="hm-eyebrow">Content</span>
            <h1 className="hm-title">
              Plan the Reel <em>before it lands.</em>
            </h1>
            <p className="pg-sub">
              Plan hooks, captions and dates in one place, then arm the matching automation the
              moment you publish.
            </p>
          </div>
        </div>
        <div className="st-card st-empty">
          <div className="st-empty__icon">
            <CalendarDays aria-hidden />
          </div>
          <h3>This one is a Pro feature</h3>
          <p>
            You're on the Free plan. Upgrade and plan every Reel before it goes out, with the
            trigger keyword written in alongside the hook.
          </p>
          <Link to="/dashboard/settings#billing" className="sh-btn sh-btn--accent st-empty__cta">
            Upgrade to Pro
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pg-page">
      <div className="pg-head">
        <div>
          <span className="hm-eyebrow">Content</span>
          <h1 className="hm-title">
            Plan the Reel <em>before it lands.</em>
          </h1>
          <p className="pg-sub">
            Every serious rival bundles planning with automation. Write the hook, pick the date,
            and link the live Reel so you can see which posts actually converted into DMs.
          </p>
        </div>
        {!draft && !isDemo && (
          <button
            type="button"
            className="sh-btn sh-btn--accent"
            onClick={() => setDraft({ ...EMPTY_DRAFT })}
          >
            <Plus size={15} aria-hidden /> New idea
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
      {notice && !error && (
        <div className="sh-alert" role="status" style={{ marginBottom: 16 }}>
          <Check size={16} aria-hidden />
          <span>{notice}</span>
        </div>
      )}

      {/* ── rollup ── */}
      {stats && (
        <div className="cpt-stats">
          {STATUSES.map((s) => (
            <div className="st-card cpt-stat" key={s.value}>
              <span>{s.label}</span>
              <b>{stats[s.value]}</b>
            </div>
          ))}
          <div className="st-card cpt-stat cpt-stat--accent">
            <span>Converted to DMs</span>
            <b>
              {stats.published > 0 ? Math.round((stats.converting / stats.published) * 100) : 0}%
            </b>
          </div>
        </div>
      )}

      {draft && (
        <div className="st-card cmp-editor">
          <h3 className="cmp-editor__title">{draft.id ? "Edit plan" : "New Reel idea"}</h3>

          <label className="st-field">
            <span className="st-label">Working title *</span>
            <input
              className="st-input"
              value={draft.title}
              maxLength={120}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              placeholder="Why your Reels get no DMs"
            />
          </label>

          <label className="st-field">
            <span className="st-label">Hook — the first line</span>
            <input
              className="st-input"
              value={draft.hook}
              maxLength={300}
              onChange={(e) => setDraft({ ...draft, hook: e.target.value })}
              placeholder="The algorithm isn't broken. Your CTA is."
            />
          </label>

          <label className="st-field">
            <span className="st-label">Caption</span>
            <textarea
              className="st-input"
              rows={3}
              maxLength={2200}
              value={draft.caption}
              onChange={(e) => setDraft({ ...draft, caption: e.target.value })}
              placeholder="Comment FIX and I'll send the checklist."
            />
            <span className="st-hint">
              Put the trigger keyword in the caption here — it becomes the automation's match.
            </span>
          </label>

          <div className="prd-grid">
            <label className="st-field">
              <span className="st-label">Publish date</span>
              <input
                className="st-input"
                type="date"
                value={draft.plannedFor}
                onChange={(e) => setDraft({ ...draft, plannedFor: e.target.value })}
              />
            </label>
            <label className="st-field">
              <span className="st-label">Stage</span>
              <select
                className="st-input"
                value={draft.status}
                onChange={(e) => setDraft({ ...draft, status: e.target.value as ContentStatus })}
              >
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="prd-editor__actions">
            <div />
            <div className="prd-editor__btns">
              <button
                type="button"
                className="sh-btn sh-btn--ghost"
                onClick={() => setDraft(null)}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="button"
                className="sh-btn sh-btn--accent"
                onClick={save}
                disabled={saving || !draft.title.trim()}
              >
                {saving ? <Loader2 size={14} className="prd-spin" aria-hidden /> : <Check size={14} aria-hidden />}
                Save plan
              </button>
            </div>
          </div>
        </div>
      )}

      {linkReel && (
        <LinkReelDialog
          plan={linkReel}
          onClose={() => setLinkReel(null)}
          onLinked={() => {
            setLinkReel(null);
            load();
            setNotice("Reel linked — conversion now shows on this plan.");
          }}
        />
      )}

      {isLoading ? (
        <div className="st-card st-empty">
          <Loader2 size={20} className="prd-spin" aria-hidden />
          <h3>Loading your planner…</h3>
        </div>
      ) : plans.length === 0 ? (
        <div className="st-card st-empty">
          <div className="st-empty__icon">
            <CalendarDays aria-hidden />
          </div>
          <h3>No Reels planned yet</h3>
          <p>
            Write down your next Reel's hook and date. When it goes live, link it here and RELO
            tracks whether it turned comments into DMs.
          </p>
          {!isDemo && (
            <button
              type="button"
              className="sh-btn sh-btn--accent st-empty__cta"
              onClick={() => setDraft({ ...EMPTY_DRAFT })}
            >
              <Plus size={15} aria-hidden /> Plan your first Reel
            </button>
          )}
        </div>
      ) : (
        <div className="cpt-list">
          {plans.map((p) => (
            <article className="st-card cpt-row" key={p.id}>
              <div className="cpt-row__date">
                {p.plannedFor ? (
                  <>
                    <b>{new Date(p.plannedFor * 1000).getDate()}</b>
                    <span>
                      {new Date(p.plannedFor * 1000).toLocaleString("en-US", { month: "short" })}
                    </span>
                  </>
                ) : (
                  <span className="cpt-row__nodate">—</span>
                )}
              </div>
              <div className="cpt-row__body">
                <div className="cpt-row__head">
                  <b>{p.title}</b>
                  <span className={`st-chip cmp-chip--${p.status}`}>{p.status}</span>
                  {p.instagramMediaId && (
                    <span className="st-chip st-chip--email">
                      <Zap size={10} aria-hidden /> live
                    </span>
                  )}
                </div>
                {p.hook && <p className="cpt-row__hook">“{p.hook}”</p>}
                {p.caption && <p className="cpt-row__caption">{p.caption}</p>}
              </div>
              <div className="cpt-row__actions">
                {!p.instagramMediaId ? (
                  <button
                    type="button"
                    className="sh-btn sh-btn--ghost sh-btn--sm"
                    onClick={() => setLinkReel(p)}
                    disabled={isDemo}
                  >
                    <Link2 size={13} aria-hidden /> Link live Reel
                  </button>
                ) : (
                  <Link
                    to="/dashboard/automations"
                    className="sh-btn sh-btn--ghost sh-btn--sm"
                  >
                    <Zap size={13} aria-hidden /> Automation
                  </Link>
                )}
                <button
                  type="button"
                  className="sh-iconbtn"
                  aria-label={`Edit ${p.title}`}
                  onClick={() => startEdit(p)}
                  disabled={isDemo}
                >
                  <Pencil size={14} aria-hidden />
                </button>
                <button
                  type="button"
                  className="sh-iconbtn"
                  aria-label={`Delete ${p.title}`}
                  onClick={() => remove(p)}
                  disabled={isDemo}
                >
                  <Trash2 size={14} aria-hidden />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <p className="pg-note">
        <CalendarDays size={12} aria-hidden /> RELO plans with you but never posts for you — Meta
        has no content-publishing API, and a tool that pretends otherwise is lying. Publish in the
        Instagram app, then link the Reel here to see whether it converted.
      </p>
    </div>
  );
}

/**
 * Links a plan to a Reel this account already automates. The server re-checks
 * ownership — the picker is a convenience, not the security boundary.
 */
function LinkReelDialog({
  plan,
  onClose,
  onLinked,
}: {
  plan: ContentPlan;
  onClose: () => void;
  onLinked: () => void;
}) {
  const { selectedAccountId, reels, loadReels } = useDashboard();
  const [mediaId, setMediaId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadReels();
  }, [loadReels]);

  const submit = async () => {
    if (!selectedAccountId || !mediaId) return;
    setSaving(true);
    setError(null);
    try {
      await api.contentPlans.publish(selectedAccountId, plan.id, mediaId);
      onLinked();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't link that Reel.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="sh-modal" role="dialog" aria-modal="true" aria-label="Link a live Reel">
      <div className="sh-modal__card">
        <h3>Link the live Reel</h3>
        <p className="st-hint">
          Pick the Reel you published for “{plan.title}”. Only Reels you already automate can be
          linked.
        </p>
        {error && (
          <div className="sh-alert" role="alert" style={{ marginBottom: 12 }}>
            <AlertCircle size={16} aria-hidden />
            <span>{error}</span>
          </div>
        )}
        <label className="st-field">
          <span className="st-label">Reel</span>
          {reels.length === 0 ? (
            <p className="st-hint">
              You need an automated Reel first — automate the Reel, then link it here.
            </p>
          ) : (
            <select
              className="st-input"
              value={mediaId}
              onChange={(e) => setMediaId(e.target.value)}
            >
              <option value="">Choose a Reel…</option>
              {reels.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.caption ? r.caption.slice(0, 60) : r.permalink}
                </option>
              ))}
            </select>
          )}
        </label>
        <div className="prd-editor__actions">
          <div />
          <div className="prd-editor__btns">
            <button type="button" className="sh-btn sh-btn--ghost" onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className="sh-btn sh-btn--accent"
              onClick={submit}
              disabled={saving || !mediaId}
            >
              {saving ? <Loader2 size={14} className="prd-spin" aria-hidden /> : <Link2 size={14} aria-hidden />}
              Link Reel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
