import React, { useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Sparkles,
  ShieldCheck,
  Smartphone,
  ExternalLink,
  Sliders,
  RefreshCw,
  Send,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { isValidButtonUrl } from "@/lib/validation";
import { findMatchingKeyword, mergeUsername } from "@/lib/commentMatcher";
import type {
  InstagramReelMedia,
  ReelAutomation,
  TemplateCardConfig,
  GenericTemplateButton,
} from "@/types/contracts";

const FOLLOW_UP_PRESETS = [30, 60, 180, 360];

interface AutomationEditorProps {
  reel: InstagramReelMedia;
  accountId: string;
  plan?: "free" | "pro" | "studio";
  existingAutomation?: ReelAutomation | null;
  onSave: (automationData: {
    id?: string;
    accountId: string;
    instagramMediaId: string;
    reelPermalink: string;
    reelThumbnailUrl?: string;
    triggerKeywords: string[];
    commentReplies: string[];
    followGateEnabled: boolean;
    templateCard: TemplateCardConfig;
    isActive: boolean;
    followUpEnabled?: boolean;
    followUpDelayMinutes?: number;
  }) => Promise<void>;
  onDelete?: () => Promise<void>;
  onCancel: () => void;
}

export default function AutomationEditor({
  reel,
  accountId,
  plan = "free",
  existingAutomation,
  onSave,
  onDelete,
  onCancel,
}: AutomationEditorProps) {
  const isEditing = Boolean(existingAutomation);
  const isFree = plan === "free";
  const [minVariations, maxVariations] = isFree ? [2, 2] : [3, 8];
  const maxButtons = isFree ? 2 : 3;
  const canFollowUp = !isFree;

  // "Preview as commenter" tester state (plan.md §4.1)
  const [testComment, setTestComment] = useState("guide please");
  const [testUsername, setTestUsername] = useState("creator_alex");

  const [keywords, setKeywords] = useState<string[]>(
    existingAutomation?.triggerKeywords || ["GUIDE", "LINK"]
  );
  const [keywordInput, setKeywordInput] = useState("");

  // Instagram anti-spam: rotate variations so identical replies never repeat
  const [replies, setReplies] = useState<string[]>(
    existingAutomation?.commentReplies ||
      (isFree
        ? [
            "Sent to your DMs @username! Check now 🔥",
            "Check your inbox @username, just sent the link! 🙌",
          ]
        : [
            "Sent to your DMs @username! Check now 🔥",
            "Check your inbox @username, just sent the link! 🙌",
            "@username dispatched your requested link to DMs! 🚀",
          ])
  );

  const [followGateEnabled, setFollowGateEnabled] = useState<boolean>(
    existingAutomation?.followGateEnabled ?? true
  );

  // Follow-up DM (Pro/Studio, plan.md §4.2)
  const [followUpEnabled, setFollowUpEnabled] = useState<boolean>(
    canFollowUp && (existingAutomation?.followUpEnabled ?? false)
  );
  const [followUpDelay, setFollowUpDelay] = useState<number>(
    existingAutomation?.followUpDelayMinutes ?? 60
  );

  const [cardTitle, setCardTitle] = useState(
    existingAutomation?.templateCard.title || "Your Free Growth Blueprint"
  );
  const [cardSubtitle, setCardSubtitle] = useState(
    existingAutomation?.templateCard.subtitle || "Exclusive templates and viral frameworks"
  );
  const [cardImageUrl, setCardImageUrl] = useState(
    existingAutomation?.templateCard.imageUrl || reel.thumbnailUrl || ""
  );
  const [buttons, setButtons] = useState<GenericTemplateButton[]>(
    existingAutomation?.templateCard.buttons || [
      { type: "web_url", title: "Download Blueprint", url: "https://" },
    ]
  );

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const [mobileView, setMobileView] = useState<"editor" | "preview">("editor");

  // Live Spintax tester
  const sampleUsernames = ["creator_alex", "sarah_growth", "jordan_reels", "viral_agency"];
  const [spintaxSampleIndex, setSpintaxSampleIndex] = useState(0);

  /* ── derived preview state ── */
  const matched = findMatchingKeyword(testComment, keywords);

  /* ── handlers (all immutable) ── */

  const handleAddKeyword = () => {
    const raw = keywordInput.trim().toUpperCase();
    const sanitized = raw.replace(/[^A-Z0-9_\- ]/g, "").trim();
    if (!sanitized) return;
    if (sanitized !== raw) {
      setValidationError(`Only letters, numbers, dashes and spaces are kept — "${raw}" was saved as "${sanitized}".`);
    } else {
      setValidationError(null);
    }
    if (!keywords.includes(sanitized)) {
      setKeywords([...keywords, sanitized]);
      setKeywordInput("");
    }
  };

  const handleRemoveKeyword = (kw: string) => {
    setKeywords((prev) => prev.filter((k) => k !== kw));
  };

  const handleAddReply = () => {
    if (replies.length < maxVariations)
      setReplies([...replies, "@username check your messages! 🔥"]);
  };

  const handleReplyChange = (index: number, val: string) => {
    setReplies((prev) => prev.map((r, i) => (i === index ? val : r)));
  };

  const handleRemoveReply = (index: number) => {
    if (replies.length > minVariations)
      setReplies((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddButton = () => {
    if (buttons.length < maxButtons) {
      setButtons([...buttons, { type: "web_url", title: "Join VIP Community", url: "https://" }]);
    }
  };

  const handleButtonChange = (index: number, field: "title" | "url", val: string) => {
    setButtons((prev) =>
      prev.map((btn, i) => {
        if (i !== index || btn.type !== "web_url") return btn;
        return field === "title" ? { ...btn, title: val } : { ...btn, url: val };
      })
    );
  };

  const handleRemoveButton = (index: number) => {
    if (buttons.length > 1) setButtons((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    const confirmed = window.confirm(
      "Delete this automation? The reel stops auto-DMing immediately; captured leads are kept."
    );
    if (!confirmed) return;
    setIsDeleting(true);
    setValidationError(null);
    try {
      await onDelete();
    } catch (err) {
      setValidationError(err instanceof Error ? err.message : "Failed to delete automation.");
    } finally {
      setIsDeleting(false);
    }
  };

  /* ── submission with full validation ── */
  const handleSubmit = async () => {
    setValidationError(null);

    if (keywords.length === 0) {
      setValidationError("Add at least one trigger keyword.");
      return;
    }
    if (replies.length < minVariations || replies.length > maxVariations) {
      setValidationError(
        isFree
          ? "The free tier runs exactly 2 reply variations. Upgrade to Pro for 3–8."
          : `Between ${minVariations} and ${maxVariations} reply variations are required.`
      );
      return;
    }
    if (new Set(replies.map((r) => r.trim().toLowerCase())).size < minVariations) {
      setValidationError("Reply variations must be distinct to prevent Instagram spam flags.");
      return;
    }
    if (!cardTitle.trim()) {
      setValidationError("Card title is required.");
      return;
    }
    if (cardTitle.length > 80 || cardSubtitle.length > 80) {
      setValidationError("Card title and subtitle must each stay under 80 characters (Meta limit).");
      return;
    }
    if (cardImageUrl.trim() && !isValidButtonUrl(cardImageUrl.trim())) {
      setValidationError("Card image URL must start with https:// (or http:// for local testing).");
      return;
    }
    if (buttons.length > maxButtons) {
      setValidationError(
        isFree
          ? "The free tier allows up to 2 buttons — RELO adds its own as the third."
          : `Maximum ${maxButtons} buttons per card.`
      );
      return;
    }
    for (let i = 0; i < buttons.length; i++) {
      const btn = buttons[i];
      if (!btn.title.trim()) {
        setValidationError(`Button #${i + 1} needs a title.`);
        return;
      }
      if (btn.title.length > 20) {
        setValidationError(`Button #${i + 1} title cannot exceed 20 characters (Meta limit).`);
        return;
      }
      if (btn.type === "web_url") {
        const urlStr = (btn.url || "").trim();
        if (!urlStr) {
          setValidationError(`Button #${i + 1} needs a destination URL.`);
          return;
        }
        try {
          const parsed = new URL(urlStr);
          if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
            setValidationError(`Button #${i + 1} URL must use https://.`);
            return;
          }
        } catch {
          setValidationError(`Button #${i + 1} has an invalid URL: "${urlStr}".`);
          return;
        }
      }
    }

    setIsSaving(true);
    try {
      await onSave({
        id: existingAutomation?.id,
        accountId,
        instagramMediaId: reel.id,
        reelPermalink: reel.permalink,
        reelThumbnailUrl: reel.thumbnailUrl || reel.mediaUrl,
        triggerKeywords: keywords,
        commentReplies: replies,
        followGateEnabled,
        templateCard: {
          title: cardTitle.trim(),
          subtitle: cardSubtitle.trim() || undefined,
          imageUrl: cardImageUrl.trim() || undefined,
          buttons: buttons as [GenericTemplateButton, ...GenericTemplateButton[]],
        },
        isActive: true,
        followUpEnabled: canFollowUp && followUpEnabled,
        followUpDelayMinutes: followUpDelay,
      });
    } catch (err) {
      setValidationError(err instanceof Error ? err.message : "Failed to save automation rule.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="st-editor">
      {/* header */}
      <div className="st-editor__top">
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <button type="button" onClick={onCancel} className="st-btn st-btn--ghost st-btn--sm">
            <ArrowLeft aria-hidden /> Back
          </button>
          <div>
            <h2 className="st-editor__title">
              {isEditing ? "Edit funnel" : "New funnel"}{" "}
              <span style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 300 }}>
                — {isEditing ? "tune the machine." : "arm the reel."}
              </span>
            </h2>
            <p className="st-editor__sub">
              Keywords, anti-spam reply rotation, follow-gate, and the 3-button DM card.
            </p>
          </div>
        </div>
        <div className="st-editor__actions">
          {isEditing && onDelete && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="st-btn st-btn--ghost st-btn--sm"
              style={{ color: "var(--accent-ink)" }}
            >
              <Trash2 aria-hidden />
              {isDeleting ? "Deleting…" : "Delete"}
            </button>
          )}
          <button
            type="button"
            onClick={onCancel}
            className="st-btn st-btn--ghost st-btn--sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSaving}
            className="st-btn st-btn--accent st-btn--sheen"
          >
            {isSaving ? (
              <RefreshCw style={{ animation: "spin 1.2s linear infinite" }} aria-hidden />
            ) : (
              <CheckCircle2 aria-hidden />
            )}
            {isSaving ? "Saving…" : isEditing ? "Save Changes" : "Launch Funnel"}
          </button>
        </div>
      </div>

      {validationError && (
        <div className="st-alert" role="alert">
          <AlertCircle aria-hidden />
          <span>{validationError}</span>
        </div>
      )}

      {/* mobile view toggle */}
      <div className="st-viewtoggle" style={{ display: "flex" }}>
        <button type="button" aria-pressed={mobileView === "editor"} onClick={() => setMobileView("editor")}>
          <Sliders size={15} aria-hidden /> Editor
        </button>
        <button type="button" aria-pressed={mobileView === "preview"} onClick={() => setMobileView("preview")}>
          <Smartphone size={15} aria-hidden /> Preview
        </button>
      </div>

      <div className="st-cardrow">
        {/* left: controls */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 20,
            ...(mobileView === "preview" ? { display: "none" } : {}),
          }}
          className="editor-controls-lg"
        >
          {/* reel banner */}
          <div className="st-card st-reelbanner">
            <img
              src={reel.thumbnailUrl || reel.mediaUrl}
              alt="Target reel preview"
              loading="lazy"
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: "0.24em",
                  textTransform: "uppercase",
                  color: "var(--accent-ink)",
                }}
              >
                Target reel
              </span>
              <p
                style={{
                  fontSize: 12.5,
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  marginTop: 4,
                }}
              >
                {reel.caption || "Untitled Reel"}
              </p>
              <a
                href={reel.permalink}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  fontSize: 11,
                  fontWeight: 700,
                  color: "var(--text-faint)",
                  marginTop: 5,
                }}
              >
                View on Instagram <ExternalLink size={11} aria-hidden />
              </a>
            </div>
          </div>

          {/* keywords */}
          <section className="st-card st-fieldset">
            <div className="st-fieldset__head">
              <div>
                <h3 className="st-fieldset__title">Trigger keywords</h3>
                <p className="st-fieldset__hint">
                  When a viewer comments any of these words, the funnel fires. Matching is
                  Unicode-aware and whole-word.
                </p>
              </div>
              <span className="st-chip st-chip--email">{keywords.length} active</span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {keywords.map((kw) => (
                <span className="st-keychip" key={kw}>
                  {kw}
                  <button
                    type="button"
                    onClick={() => handleRemoveKeyword(kw)}
                    aria-label={`Remove keyword ${kw}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="st-addrow">
              <input
                className="st-input"
                placeholder="Add keyword (e.g. GUIDE, VIP, SEND)"
                value={keywordInput}
                maxLength={24}
                aria-label="New trigger keyword"
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddKeyword();
                  }
                }}
              />
              <button type="button" onClick={handleAddKeyword} className="st-btn st-btn--primary st-btn--sm">
                <Plus aria-hidden /> Add
              </button>
            </div>
          </section>

          {/* replies */}
          <section className="st-card st-fieldset">
            <div className="st-fieldset__head">
              <div>
                <h3 className="st-fieldset__title">Public comment replies</h3>
                <p className="st-fieldset__hint">
                  Instagram flags identical replies — RELO rotates {minVariations}
                  {minVariations === maxVariations ? "" : `–${maxVariations}`} variation
                  {maxVariations > 1 ? "s" : ""} with
                  {" "}<code>@username</code> merged per commenter.
                </p>
              </div>
              <span
                className={`st-chip ${
                  replies.length > maxVariations
                    ? "st-chip--over"
                    : replies.length >= minVariations
                      ? "st-chip--follower"
                      : "st-chip--nonfollower"
                }`}
              >
                {replies.length > maxVariations
                  ? `${replies.length - maxVariations} over limit · ${replies.length}/${maxVariations}`
                  : replies.length >= minVariations
                    ? `✓ compliant · ${replies.length}/${maxVariations}`
                    : `min ${minVariations} · ${replies.length}/${minVariations}`}
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {replies.map((reply, i) => (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      color: "var(--text-faint)",
                      width: 22,
                      textAlign: "right",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    #{i + 1}
                  </span>
                  <input
                    className="st-input"
                    value={reply}
                    onChange={(e) => handleReplyChange(i, e.target.value)}
                    placeholder="Sent to your DMs @username! 🔥"
                    aria-label={`Reply variation ${i + 1}`}
                  />
                  {replies.length > minVariations && (
                    <button
                      type="button"
                      onClick={() => handleRemoveReply(i)}
                      className="studio__iconbtn"
                      style={{ flexShrink: 0 }}
                      aria-label={`Delete variation ${i + 1}`}
                    >
                      <Trash2 aria-hidden />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {replies.length < maxVariations && (
              <button type="button" onClick={handleAddReply} className="st-dashed">
                <Plus size={13} style={{ verticalAlign: -2 }} /> Add variation (
                {replies.length}/{maxVariations})
              </button>
            )}
            {isFree && (
              <p className="st-fieldset__hint" style={{ marginTop: 10 }}>
                <Sparkles size={11} style={{ verticalAlign: -1 }} aria-hidden /> Free tier is
                capped at 2 variations.{" "}
                <button
                  type="button"
                  className="st-inlineupgrade"
                  onClick={() =>
                    window.location.assign("/dashboard/settings#billing")
                  }
                >
                  Upgrade to Pro
                </button>{" "}
                for 3–8 and follow-up DMs.
              </p>
            )}
            <div className="st-spintax">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", gap: 6 }}>
                  <Sparkles size={13} color="var(--accent-ink)" aria-hidden />
                  Live rotation preview
                </span>
                <button
                  type="button"
                  onClick={() => setSpintaxSampleIndex((p) => (p + 1) % sampleUsernames.length)}
                  style={{
                    border: 0, background: "none", fontSize: 11, fontWeight: 800,
                    color: "var(--accent-ink)", display: "flex", alignItems: "center", gap: 4,
                  }}
                >
                  <RefreshCw size={11} aria-hidden />
                  @{sampleUsernames[(spintaxSampleIndex + 1) % sampleUsernames.length]}
                </button>
              </div>
              <p className="st-spintax__out">
                {(replies[spintaxSampleIndex % replies.length] || "").replace(
                  /@username/gi,
                  `@${sampleUsernames[spintaxSampleIndex]}`
                )}
              </p>
            </div>
          </section>

          {/* follow gate */}
          <section
            className="st-card st-fieldset"
            style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 18 }}
          >
            <div>
              <h3 className="st-fieldset__title" style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <ShieldCheck size={15} color="var(--success)" aria-hidden />
                Follow-gate verification
              </h3>
              <p className="st-fieldset__hint">
                Only send the card if the commenter follows you. 1500ms fail-open — a slow Meta
                API never blocks a hot lead.
              </p>
            </div>
            <Switch checked={followGateEnabled} onCheckedChange={setFollowGateEnabled} />
          </section>

          {/* follow-up DM — Pro/Studio (plan.md §4.2) */}
          <section
            className="st-card st-fieldset"
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 18,
              flexWrap: "wrap",
            }}
          >
            <div style={{ minWidth: 0 }}>
              <h3 className="st-fieldset__title" style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <Send size={15} color="var(--accent-ink)" aria-hidden />
                Follow-up DM
                {!isFree && <span className="st-chip st-chip--follower">{plan === "studio" ? "Studio" : "Pro"}</span>}
              </h3>
              <p className="st-fieldset__hint">
                If the lead taps nothing, send one gentle nudge — max one, always inside Meta's
                24-hour window. Never nag.
              </p>
            </div>
            {canFollowUp ? (
              <Switch checked={followUpEnabled} onCheckedChange={setFollowUpEnabled} />
            ) : (
              <button
                type="button"
                className="st-btn st-btn--primary st-btn--sm st-locked"
                onClick={() => window.location.assign("/dashboard/settings#billing")}
              >
                <Sparkles size={13} aria-hidden /> Upgrade to unlock
              </button>
            )}
          </section>

          {canFollowUp && followUpEnabled && (
            <section className="st-card st-fieldset">
              <div className="st-fieldset__head">
                <div>
                  <h3 className="st-fieldset__title">Nudge timing</h3>
                  <p className="st-fieldset__hint">
                    Counted from the first DM. The engine never sends a second follow-up.
                  </p>
                </div>
                <span className="st-chip st-chip--email">
                  {followUpDelay < 60 ? `${followUpDelay} min` : `${followUpDelay / 60} h`}
                </span>
              </div>
              <div className="st-presets" role="group" aria-label="Follow-up delay">
                {FOLLOW_UP_PRESETS.map((minutes) => (
                  <button
                    key={minutes}
                    type="button"
                    aria-pressed={followUpDelay === minutes}
                    className="st-preset"
                    onClick={() => setFollowUpDelay(minutes)}
                  >
                    {minutes < 60 ? `${minutes} min` : `${minutes / 60} h`}
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* card builder */}
          <section className="st-card st-fieldset">
            <div>
              <h3 className="st-fieldset__title">DM template card</h3>
              <p className="st-fieldset__hint">
                Official Meta Generic Template — cover image, title, subtitle, and up to 3
                tappable buttons.
              </p>
            </div>

            <div className="st-field">
              <label htmlFor="st-card-title">
                Card title <span className="st-count">{cardTitle.length}/80</span>
              </label>
              <input
                id="st-card-title"
                className="st-input"
                maxLength={80}
                value={cardTitle}
                onChange={(e) => setCardTitle(e.target.value)}
                placeholder="Complete Instagram Growth Playbook"
              />
            </div>

            <div className="st-field">
              <label htmlFor="st-card-subtitle">
                Subtitle <span className="st-count">{cardSubtitle.length}/80</span>
              </label>
              <input
                id="st-card-subtitle"
                className="st-input"
                maxLength={80}
                value={cardSubtitle}
                onChange={(e) => setCardSubtitle(e.target.value)}
                placeholder="Free breakdown of our viral framework"
              />
            </div>

            <div className="st-field">
              <label htmlFor="st-card-image">Card image URL</label>
              <input
                id="st-card-image"
                className="st-input"
                value={cardImageUrl}
                onChange={(e) => setCardImageUrl(e.target.value)}
                placeholder="https://yourdomain.com/preview.png"
                inputMode="url"
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 4 }}>
              <span className="st-label">Action buttons (1–{maxButtons})</span>
              {buttons.map((btn, i) => (
                <div className="st-btncell" key={i}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      fontSize: 11,
                      fontWeight: 800,
                      color: "var(--text-soft)",
                    }}
                  >
                    <span>Button #{i + 1}</span>
                    {buttons.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveButton(i)}
                        aria-label={`Remove button ${i + 1}`}
                        style={{ border: 0, background: "none", color: "var(--text-faint)" }}
                      >
                        <Trash2 size={13} aria-hidden />
                      </button>
                    )}
                  </div>
                  <input
                    className="st-input"
                    value={btn.title}
                    onChange={(e) => handleButtonChange(i, "title", e.target.value)}
                    placeholder="Button title (e.g. Download PDF)"
                    maxLength={20}
                    aria-label={`Button ${i + 1} title`}
                  />
                  {btn.type === "web_url" && (
                    <input
                      className="st-input"
                      value={btn.url}
                      onChange={(e) => handleButtonChange(i, "url", e.target.value)}
                      placeholder="https://your-link.com"
                      inputMode="url"
                      aria-label={`Button ${i + 1} destination URL`}
                    />
                  )}
                </div>
              ))}
              {buttons.length < maxButtons && (
                <button type="button" onClick={handleAddButton} className="st-dashed">
                  <Plus size={13} style={{ verticalAlign: -2 }} /> Add button (
                  {buttons.length}/{maxButtons})
                </button>
              )}
              {isFree && (
                <div className="st-relobtn" aria-hidden>
                  <Sparkles size={13} />
                  <span>
                    <b>⚡ Automated by RELO</b>
                    <em>Added automatically at dispatch — it never counts against your{" "}
                    {maxButtons} slots.</em>
                  </span>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* right: live phone preview */}
        <div
          className="editor-preview-lg"
          style={mobileView === "editor" ? { display: "none" } : undefined}
        >
          <div className="st-card st-previewcard" style={{ position: "sticky", top: 90 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                paddingBottom: 12,
                marginBottom: 14,
                borderBottom: "1.5px solid var(--border)",
              }}
            >
              <span style={{ fontSize: 12, fontWeight: 800, display: "flex", alignItems: "center", gap: 6 }}>
                <Smartphone size={14} color="var(--accent-ink)" aria-hidden />
                Live DM preview
              </span>
              <span className="st-chip st-chip--follower">pixel-accurate</span>
            </div>

            <div className="st-card st-tester">
              <div className="st-tester__head">
                <span className="st-tester__title">
                  <Sparkles size={13} color="var(--accent-ink)" aria-hidden />
                  Preview as commenter
                </span>
                <span className="st-chip st-chip--email">plan.md §4.1</span>
              </div>
              <div className="st-tester__inputs">
                <div className="st-field">
                  <label htmlFor="st-test-comment">They comment</label>
                  <input
                    id="st-test-comment"
                    className="st-input"
                    value={testComment}
                    onChange={(e) => setTestComment(e.target.value)}
                    placeholder="guide please"
                  />
                </div>
                <div className="st-field">
                  <label htmlFor="st-test-username">Their username</label>
                  <input
                    id="st-test-username"
                    className="st-input"
                    value={testUsername}
                    onChange={(e) => setTestUsername(e.target.value)}
                    placeholder="creator_alex"
                  />
                </div>
              </div>

              {matched ? (
                <>
                  <div className="st-tester__verdict st-tester__verdict--hit">
                    <CheckCircle2 size={13} aria-hidden />
                    Triggers on{" "}
                    <b>{matched === "*" ? "* (catch-all)" : `“${matched}”`}</b>
                    {followGateEnabled
                      ? " → checks follow status first, then sends the card."
                      : " → sends the card immediately."}
                  </div>
                  <div className="st-tester__preview">
                    <span className="st-tester__label">Public comment reply</span>
                    <p className="st-tester__bubble st-tester__bubble--reply">
                      {mergeUsername(replies[spintaxSampleIndex % replies.length] || "", testUsername) ||
                        "—"}
                    </p>
                  </div>
                </>
              ) : (
                <div className="st-tester__verdict st-tester__verdict--miss">
                  <AlertCircle size={13} aria-hidden />
                  No trigger keyword matches this comment — RELO stays silent. Add the keyword
                  above, or use <b>*</b> to catch every comment.
                </div>
              )}
            </div>

            <div className="st-phone" role="img" aria-label="Preview of the Instagram DM your commenter receives">
              <div className="st-phone__notch" aria-hidden />
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 9,
                  padding: "2px 4px 10px",
                  borderBottom: "1.5px solid #3d2817",
                  fontSize: 11,
                }}
              >
                <span
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, var(--accent), var(--accent-strong))",
                    display: "grid",
                    placeItems: "center",
                    fontWeight: 900,
                    fontSize: 9,
                  }}
                  aria-hidden
                >
                  IG
                </span>
                <span>
                  <b style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    your_account <CheckCircle2 size={11} color="var(--accent-text)" aria-hidden />
                  </b>
                  <i style={{ fontSize: 9, color: "#a0866c", fontStyle: "normal" }}>Active now</i>
                </span>
              </div>

              <div className="st-phone__chat">
                <div className="st-phone__card">
                  {cardImageUrl ? (
                    <div style={{ aspectRatio: "1.91/1", background: "#170d06", overflow: "hidden" }}>
                      <img
                        src={cardImageUrl}
                        alt="Card cover preview"
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    </div>
                  ) : (
                    <div
                      style={{
                        aspectRatio: "1.91/1",
                        background: "linear-gradient(135deg, #3d2817, #170d06)",
                        display: "grid",
                        placeItems: "center",
                        color: "#a0866c",
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      card cover image
                    </div>
                  )}
                  <div style={{ padding: 12 }}>
                    <h4 style={{ fontWeight: 800, fontSize: 12, lineHeight: 1.35 }}>
                      {cardTitle || "Title goes here…"}
                    </h4>
                    {cardSubtitle && (
                      <p style={{ fontSize: 10.5, color: "#a0866c", marginTop: 4, lineHeight: 1.45 }}>
                        {cardSubtitle}
                      </p>
                    )}
                  </div>
                  <div className="st-phone__btnrow">
                    {buttons.map((btn, i) => (
                      <div key={i}>{btn.title || `Button #${i + 1}`}</div>
                    ))}
                  </div>
                </div>

                {followGateEnabled && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "8px 10px",
                      borderRadius: 10,
                      background: "rgba(92, 107, 35, 0.22)",
                      border: "1px solid rgba(92, 107, 35, 0.55)",
                      color: "#c9d69a",
                      fontSize: 10,
                      fontWeight: 700,
                    }}
                  >
                    <ShieldCheck size={12} aria-hidden />
                    Follow-gate active — non-followers get a nudge first
                  </div>
                )}
              </div>

              <div
                style={{
                  width: 96,
                  height: 4,
                  background: "#3d2817",
                  borderRadius: 99,
                  margin: "14px auto 2px",
                }}
                aria-hidden
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
