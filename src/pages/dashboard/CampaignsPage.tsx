import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import {
  AlertCircle,
  Check,
  Clock,
  Loader2,
  Megaphone,
  Send,
  Trash2,
  UserCheck,
  UserX,
} from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useDashboard } from "./DashboardContext";
import type { Campaign, CampaignCardPayload, Reachability } from "@/types/contracts";
import "./phase3.css";

const MAX_TEXT = 1000;

/**
 * Demo sample so the reachability line — the whole reason this page exists —
 * can actually be inspected without a live Meta token behind it.
 */
const DEMO_CAMPAIGNS: Campaign[] = [
  {
    id: "cmp_demo_1",
    accountId: "acc_demo_pilot" as Campaign["accountId"],
    mediaId: "reel_101",
    payload: { kind: "text", text: "Hey {username}! New drop just landed — 20% off until Sunday." },
    status: "completed",
    scheduledAt: 0,
    sentCount: 118,
    failedCount: 3,
    unreachableCount: 9,
    usesHumanAgentTag: false,
    createdAt: 1756800000,
    updatedAt: 1756900000,
  },
  {
    id: "cmp_demo_2",
    accountId: "acc_demo_pilot" as Campaign["accountId"],
    mediaId: "reel_102",
    payload: { kind: "text", text: "Still want the templates, {username}? 👇" },
    status: "scheduled",
    scheduledAt: Math.floor(Date.now() / 1000) + 3600,
    sentCount: 0,
    failedCount: 0,
    unreachableCount: 12,
    usesHumanAgentTag: true,
    createdAt: 1756900000,
    updatedAt: 1756950000,
  },
];

interface Draft {
  id?: string;
  mediaId: string;
  kind: "text" | "card";
  text: string;
  card: CampaignCardPayload;
  usesHumanAgentTag: boolean;
}

const EMPTY_DRAFT: Draft = {
  mediaId: "",
  kind: "text",
  text: "",
  card: { title: "", subtitle: "", buttons: [] },
  usesHumanAgentTag: false,
};

/**
 * Campaigns (plan.md §4.3). The whole point of this page is the reachability
 * line: Meta only lets us message a commenter for 24 hours after their last
 * interaction, so "X of Y still reachable" is the number that decides whether a
 * campaign is worth sending — not a vanity count.
 */
export default function CampaignsPage() {
  const { currentAccount, selectedAccountId, isDemo, reels, loadReels } = useDashboard();
  const plan = currentAccount?.plan ?? "free";
  const locked = plan === "free";

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [reachability, setReachability] = useState<Record<string, Reachability>>({});

  const load = useCallback(async () => {
    if (!selectedAccountId) {
      setIsLoading(false);
      return;
    }
    if (isDemo) {
      setCampaigns(DEMO_CAMPAIGNS);
      setReachability({
        cmp_demo_1: { total: 130, reachable: 118, unreachable: 9 },
        cmp_demo_2: { total: 64, reachable: 52, unreachable: 12 },
      });
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const { campaigns: rows } = await api.campaigns.list(selectedAccountId);
      setCampaigns(rows);
    } catch (err) {
      setError(
        err instanceof ApiError && err.code === "CAMPAIGNS_LOCKED"
          ? "Campaigns are a Pro feature."
          : "Couldn't load your campaigns. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  }, [selectedAccountId, isDemo]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!locked) loadReels();
  }, [locked, loadReels]);

  const save = async (status: "draft" | "scheduled") => {
    if (!draft || !selectedAccountId) return;
    if (!draft.mediaId) {
      setError("Pick the reel whose commenters you want to reach.");
      return;
    }
    if (draft.kind === "text" && !draft.text.trim()) {
      setError("Write the message you want to send.");
      return;
    }
    if (draft.kind === "card" && !draft.card.title.trim()) {
      setError("Give the card a title.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const { campaign, reachability: reach } = await api.campaigns.save(selectedAccountId, {
        id: draft.id,
        mediaId: draft.mediaId,
        kind: draft.kind,
        text: draft.kind === "text" ? draft.text.trim() : undefined,
        card: draft.kind === "card" ? draft.card : undefined,
        status,
        usesHumanAgentTag: draft.usesHumanAgentTag,
      });
      setCampaigns((prev) => {
        const next = prev.filter((c) => c.id !== campaign.id);
        next.unshift(campaign);
        return next;
      });
      setReachability((prev) => ({ ...prev, [campaign.id]: reach }));
      setDraft(null);
      setNotice(
        status === "scheduled"
          ? `Queued. ${reach.reachable} of ${reach.total} commenters are still inside the 24-hour window.`
          : `Saved. ${reach.reachable} of ${reach.total} commenters are still reachable.`
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't save that campaign.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (campaign: Campaign) => {
    if (!selectedAccountId) return;
    if (!window.confirm("Delete this campaign?")) return;
    try {
      await api.campaigns.remove(selectedAccountId, campaign.id);
      setCampaigns((prev) => prev.filter((c) => c.id !== campaign.id));
      setNotice("Campaign deleted.");
    } catch {
      setError("Couldn't delete that campaign.");
    }
  };

  if (locked) {
    return (
      <div className="pg-page">
        <div className="pg-head">
          <div>
            <span className="hm-eyebrow">Campaigns</span>
            <h1 className="hm-title">
              Re-engage <em>every commenter.</em>
            </h1>
            <p className="pg-sub">
              Pick a reel, compose a follow-up card, and send to everyone still inside Meta's
              24-hour messaging window — with a live reachable count.
            </p>
          </div>
        </div>
        <div className="st-card st-empty">
          <div className="st-empty__icon">
            <Megaphone aria-hidden />
          </div>
          <h3>This one is a Pro feature</h3>
          <p>
            You're on the Free plan. Upgrade and you can re-engage every commenter of a Reel while
            Meta still lets us message them.
          </p>
          <Link to="/dashboard/settings#billing" className="sh-btn sh-btn--accent st-empty__cta">
            Upgrade to Pro
          </Link>
        </div>
      </div>
    );
  }

  const draftReach = draft?.id ? reachability[draft.id] : undefined;

  return (
    <div className="pg-page">
      <div className="pg-head">
        <div>
          <span className="hm-eyebrow">Campaigns</span>
          <h1 className="hm-title">
            Re-engage <em>every commenter.</em>
          </h1>
          <p className="pg-sub">
            Meta lets us message a commenter for 24 hours after their last interaction. Campaigns
            tell you exactly how many of yours are still inside that window — before you send.
          </p>
        </div>
        {!draft && !isDemo && (
          <button
            type="button"
            className="sh-btn sh-btn--accent"
            onClick={() => setDraft({ ...EMPTY_DRAFT, card: { ...EMPTY_DRAFT.card } })}
            disabled={reels.length === 0}
          >
            <Megaphone size={15} aria-hidden /> New campaign
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

      {draft && (
        <div className="st-card cmp-editor">
          <h3 className="cmp-editor__title">{draft.id ? "Edit campaign" : "New campaign"}</h3>

          <label className="st-field">
            <span className="st-label">Reel *</span>
            {reels.length === 0 ? (
              <p className="st-hint">
                You need an automated Reel first — campaigns reach the people who commented on it.
              </p>
            ) : (
              <select
                className="st-input"
                value={draft.mediaId}
                onChange={(e) => setDraft({ ...draft, mediaId: e.target.value })}
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

          <div className="cmp-toggle" role="group" aria-label="Message type">
            <button
              type="button"
              className={`cmp-toggle__btn ${draft.kind === "text" ? "is-active" : ""}`}
              onClick={() => setDraft({ ...draft, kind: "text" })}
            >
              Text
            </button>
            <button
              type="button"
              className={`cmp-toggle__btn ${draft.kind === "card" ? "is-active" : ""}`}
              onClick={() => setDraft({ ...draft, kind: "card" })}
            >
              Card
            </button>
          </div>

          {draft.kind === "text" ? (
            <label className="st-field">
              <span className="st-label">Message *</span>
              <textarea
                className="st-input"
                rows={4}
                maxLength={MAX_TEXT}
                value={draft.text}
                onChange={(e) => setDraft({ ...draft, text: e.target.value })}
                placeholder="Hey {username}! New drop just landed — 20% off until Sunday."
              />
              <span className="st-hint">
                <code>{"{username}"}</code> merges their handle so it doesn't read as a blast.
              </span>
            </label>
          ) : (
            <CardFields draft={draft} setDraft={setDraft} />
          )}

          <label className="prd-toggle cmp-tag">
            <input
              type="checkbox"
              checked={draft.usesHumanAgentTag}
              onChange={(e) => setDraft({ ...draft, usesHumanAgentTag: e.target.checked })}
            />
            <span>
              Apply the <code>HUMAN_AGENT</code> tag — extends Meta's window from 24 hours to
              7 days, once the tag is approved for our app.
            </span>
          </label>

          {draftReach && (
            <p className="cmp-reach" role="status">
              <UserCheck size={14} aria-hidden />
              <b>
                {draftReach.reachable} of {draftReach.total}
              </b>{" "}
              commenters still reachable — {draftReach.unreachable} already outside the window.
            </p>
          )}

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
                className="sh-btn sh-btn--ghost"
                onClick={() => save("draft")}
                disabled={saving}
              >
                Save draft
              </button>
              <button
                type="button"
                className="sh-btn sh-btn--accent"
                onClick={() => save("scheduled")}
                disabled={saving || !draft.mediaId}
              >
                {saving ? (
                  <Loader2 size={14} className="prd-spin" aria-hidden />
                ) : (
                  <Send size={14} aria-hidden />
                )}
                Schedule send
              </button>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="st-card st-empty">
          <Loader2 size={20} className="prd-spin" aria-hidden />
          <h3>Loading your campaigns…</h3>
        </div>
      ) : campaigns.length === 0 && !draft ? (
        <div className="st-card st-empty">
          <div className="st-empty__icon">
            <Megaphone aria-hidden />
          </div>
          <h3>No campaigns yet</h3>
          <p>
            Pick a Reel and send a follow-up to everyone still inside Meta's 24-hour window.
          </p>
          <button
            type="button"
            className="sh-btn sh-btn--accent st-empty__cta"
            onClick={() => setDraft({ ...EMPTY_DRAFT, card: { ...EMPTY_DRAFT.card } })}
            disabled={reels.length === 0 || isDemo}
          >
            <Megaphone size={15} aria-hidden /> New campaign
          </button>
        </div>
      ) : (
        <div className="cmp-list">
          {campaigns.map((c) => {
            const reach = reachability[c.id];
            const body =
              c.payload?.kind === "text" ? c.payload.text : c.payload?.card?.title;
            return (
              <article className="st-card cmp-row" key={c.id}>
                <div className="cmp-row__body">
                  <div className="cmp-row__head">
                    <b>{body || "Untitled campaign"}</b>
                    <span className={`st-chip cmp-chip--${c.status}`}>{c.status}</span>
                    {c.usesHumanAgentTag && (
                      <span className="st-chip st-chip--email">7-day tag</span>
                    )}
                  </div>
                  <p className="cmp-row__meta">
                    <Send size={12} aria-hidden /> {c.sentCount} sent
                    {c.failedCount > 0 && ` · ${c.failedCount} failed`}
                    {reach && ` · ${reach.reachable}/${reach.total} reachable`}
                  </p>
                </div>
                <button
                  type="button"
                  className="sh-iconbtn"
                  aria-label="Delete campaign"
                  onClick={() => remove(c)}
                  disabled={isDemo}
                >
                  <Trash2 size={14} aria-hidden />
                </button>
              </article>
            );
          })}
        </div>
      )}

      <p className="pg-note">
        <Clock size={12} aria-hidden /> Sends run in small batches with jitter, so Meta never sees
        a burst. Failures are classified — retryable, window-expired or token-dead — and the reason
        is kept per recipient.
        <br />
        <UserX size={12} aria-hidden /> Campaign leads come from commenters on your automated
        Reels. There is no separate list to prepare.
      </p>
    </div>
  );
}

function CardFields({
  draft,
  setDraft,
}: {
  draft: Draft;
  setDraft: (d: Draft) => void;
}) {
  const card = draft.card;
  const buttons = card.buttons || [];

  const setButtons = (next: typeof buttons) =>
    setDraft({ ...draft, card: { ...card, buttons: next } });

  return (
    <>
      <label className="st-field">
        <span className="st-label">Card title *</span>
        <input
          className="st-input"
          maxLength={80}
          value={card.title}
          onChange={(e) => setDraft({ ...draft, card: { ...card, title: e.target.value } })}
          placeholder="New drop"
        />
      </label>
      <label className="st-field">
        <span className="st-label">Subtitle</span>
        <input
          className="st-input"
          maxLength={80}
          value={card.subtitle || ""}
          onChange={(e) => setDraft({ ...draft, card: { ...card, subtitle: e.target.value } })}
          placeholder="20% off until Sunday"
        />
      </label>

      <fieldset className="cvs-buttons">
        <legend className="st-label">Buttons (max 3)</legend>
        {buttons.map((b, i) => (
          <div className="cvs-buttons__row" key={i}>
            <input
              className="st-input"
              maxLength={20}
              value={b.title}
              placeholder="Button title"
              onChange={(e) => {
                const next = [...buttons];
                next[i] = { ...next[i], title: e.target.value };
                setButtons(next);
              }}
            />
            <input
              className="st-input"
              value={b.url || ""}
              placeholder="https://…"
              onChange={(e) => {
                const next = [...buttons];
                next[i] = { ...next[i], url: e.target.value, type: "web_url" };
                setButtons(next);
              }}
            />
            <button
              type="button"
              className="sh-iconbtn"
              aria-label={`Remove button ${i + 1}`}
              onClick={() => setButtons(buttons.filter((_, idx) => idx !== i))}
            >
              <Trash2 size={13} aria-hidden />
            </button>
          </div>
        ))}
        {buttons.length < 3 && (
          <button
            type="button"
            className="sh-btn sh-btn--ghost"
            onClick={() => setButtons([...buttons, { type: "web_url", title: "", url: "" }])}
          >
            Add button
          </button>
        )}
      </fieldset>
    </>
  );
}