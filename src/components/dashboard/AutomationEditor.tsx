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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import type {
  InstagramReelMedia,
  ReelAutomation,
  TemplateCardConfig,
  GenericTemplateButton,
  WebUrlButton,
} from "@/types/contracts";

interface AutomationEditorProps {
  reel: InstagramReelMedia;
  accountId: string;
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
  }) => Promise<void>;
  onCancel: () => void;
}

export default function AutomationEditor({
  reel,
  accountId,
  existingAutomation,
  onSave,
  onCancel,
}: AutomationEditorProps) {
  // 1. Keywords state
  const [keywords, setKeywords] = useState<string[]>(
    existingAutomation?.triggerKeywords || ["GUIDE", "LINK"]
  );
  const [keywordInput, setKeywordInput] = useState("");

  // 2. Reply variations state (minimum 3 required by Instagram anti-spam)
  const [replies, setReplies] = useState<string[]>(
    existingAutomation?.commentReplies || [
      "Sent to your DMs @username! Check now 🔥",
      "Check your inbox @username, just sent the link! 🙌",
      "@username dispatched your requested link to DMs! 🚀",
    ]
  );

  // 3. Follow-Gate state
  const [followGateEnabled, setFollowGateEnabled] = useState<boolean>(
    existingAutomation?.followGateEnabled ?? true
  );

  // 4. Generic Template card state
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
      {
        type: "web_url",
        title: "Download Blueprint",
        url: "https://relo.ai/blueprint",
      },
    ]
  );

  const [isSaving, setIsSaving] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Mobile viewport toggle: "editor" vs "preview"
  const [mobileView, setMobileView] = useState<"editor" | "preview">("editor");

  // Live Spintax Tester state
  const sampleUsernames = ["creator_alex", "sarah_growth", "jordan_reels", "viral_agency"];
  const [spintaxSampleIndex, setSpintaxSampleIndex] = useState(0);

  // Keywords handlers
  const handleAddKeyword = () => {
    const raw = keywordInput.trim().toUpperCase();
    // Security check: alphanumeric, dashes, underscores and spaces only
    const sanitized = raw.replace(/[^A-Z0-9_\- ]/g, "").trim();
    if (sanitized && !keywords.includes(sanitized)) {
      setKeywords([...keywords, sanitized]);
      setKeywordInput("");
    }
  };

  const handleRemoveKeyword = (index: number) => {
    setKeywords(keywords.filter((_, i) => i !== index));
  };

  // Reply variations handlers
  const handleAddReply = () => {
    if (replies.length < 8) {
      setReplies([...replies, "@username check your messages! 🔥"]);
    }
  };

  const handleReplyChange = (index: number, val: string) => {
    const updated = [...replies];
    updated[index] = val;
    setReplies(updated);
  };

  const handleRemoveReply = (index: number) => {
    if (replies.length > 3) {
      setReplies(replies.filter((_, i) => i !== index));
    }
  };

  // Template buttons handlers
  const handleAddButton = () => {
    if (buttons.length < 3) {
      setButtons([
        ...buttons,
        {
          type: "web_url",
          title: "Join VIP Community",
          url: "https://relo.ai/community",
        },
      ]);
    }
  };

  const handleButtonChange = (
    index: number,
    field: "title" | "url",
    val: string
  ) => {
    const updated = [...buttons];
    if (updated[index].type === "web_url") {
      if (field === "title") updated[index].title = val;
      if (field === "url") (updated[index] as WebUrlButton).url = val;
    }
    setButtons(updated);
  };

  const handleRemoveButton = (index: number) => {
    if (buttons.length > 1) {
      setButtons(buttons.filter((_, i) => i !== index));
    }
  };

  // Submission handler with comprehensive security validations
  const handleSubmit = async () => {
    setValidationError(null);

    // 1. Validate Keywords
    if (keywords.length === 0) {
      setValidationError("Please add at least one trigger keyword.");
      return;
    }

    // 2. Validate Anti-Spam Variations
    if (replies.length < 3) {
      setValidationError("Anti-Spam rule requires at least 3 unique reply variations.");
      return;
    }

    const uniqueReplies = new Set(replies.map((r) => r.trim().toLowerCase()));
    if (uniqueReplies.size < 3) {
      setValidationError("Reply variations must be distinct to prevent Instagram spam flags.");
      return;
    }

    // 3. Validate Card Title
    if (!cardTitle.trim()) {
      setValidationError("Card Title is required.");
      return;
    }

    if (cardTitle.length > 80) {
      setValidationError("Card Title must not exceed 80 characters (Meta Graph API limit).");
      return;
    }

    if (cardSubtitle.length > 80) {
      setValidationError("Card Subtitle must not exceed 80 characters (Meta Graph API limit).");
      return;
    }

    // 4. Validate Buttons and URLs (XSS & Protocol check)
    if (buttons.length === 0) {
      setValidationError("At least 1 button is required for the Generic Template card.");
      return;
    }

    for (let i = 0; i < buttons.length; i++) {
      const btn = buttons[i];
      if (!btn.title.trim()) {
        setValidationError(`Button #${i + 1} must have a title.`);
        return;
      }
      if (btn.title.length > 20) {
        setValidationError(`Button #${i + 1} title cannot exceed 20 characters (Meta limit).`);
        return;
      }
      if (btn.type === "web_url") {
        const urlStr = (btn.url || "").trim();
        if (!urlStr) {
          setValidationError(`Button #${i + 1} must have a destination URL.`);
          return;
        }
        try {
          const parsed = new URL(urlStr);
          if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
            setValidationError(`Button #${i + 1} URL must use https:// or http:// protocol.`);
            return;
          }
        } catch {
          setValidationError(`Button #${i + 1} contains an invalid URL: "${urlStr}".`);
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
          subtitle: cardSubtitle.trim(),
          imageUrl: cardImageUrl.trim(),
          buttons: buttons as [GenericTemplateButton, ...GenericTemplateButton[]],
        },
        isActive: true,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save automation rule.";
      setValidationError(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 font-sans">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
            className="rounded-xl border-slate-200 hover:bg-slate-100"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back to Reels
          </Button>
          <div>
            <h2 className="text-xl font-black text-slate-900">Automation Studio</h2>
            <p className="text-xs text-slate-500 font-medium">
              Configure comment triggers, anti-spam variations & 3-button Generic Template card.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="rounded-xl font-semibold text-slate-600"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSaving}
            className="rounded-xl font-bold bg-sky-600 hover:bg-sky-500 text-white shadow-md shadow-sky-600/20"
          >
            {isSaving ? "Saving Rule..." : "Save Automation"}
          </Button>
        </div>
      </div>

      {validationError && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-center gap-3 text-sm text-red-700 shadow-xs">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span className="font-medium">{validationError}</span>
        </div>
      )}

      {/* Mobile Viewport Toggle (Visible only on screens < lg) */}
      <div className="flex lg:hidden items-center justify-center p-1 bg-slate-100/90 rounded-xl border border-slate-200 text-xs font-bold shadow-xs">
        <button
          type="button"
          onClick={() => setMobileView("editor")}
          className={`flex-1 py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all min-h-[44px] ${
            mobileView === "editor"
              ? "bg-white text-slate-900 shadow-xs border border-slate-200/80"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          <Sliders className="w-4 h-4 text-sky-600" />
          <span>Editor Controls</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileView("preview")}
          className={`flex-1 py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all min-h-[44px] ${
            mobileView === "preview"
              ? "bg-white text-slate-900 shadow-xs border border-slate-200/80"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          <Smartphone className="w-4 h-4 text-sky-600" />
          <span>Live Phone Preview</span>
        </button>
      </div>

      {/* Main Grid: Form Left, Live Mobile Preview Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Editor Controls */}
        <div
          className={`${
            mobileView === "editor" ? "block" : "hidden lg:block"
          } lg:col-span-7 space-y-8`}
        >
          {/* 1. Selected Reel Banner */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center gap-4">
            <img
              src={reel.thumbnailUrl || reel.mediaUrl || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&q=80"}
              alt="Reel Preview"
              className="w-16 h-20 object-cover rounded-xl border border-slate-200 shrink-0"
            />
            <div className="flex-1 min-w-0">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-sky-600">
                Target Reel Post
              </span>
              <p className="text-xs text-slate-800 font-medium truncate mt-0.5">
                {reel.caption || "Untitled Reel"}
              </p>
              <a
                href={reel.permalink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-sky-600 font-medium mt-1"
              >
                View on Instagram <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* 2. Trigger Keywords */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Trigger Keywords</h3>
                <p className="text-xs text-slate-500 font-medium">
                  When someone comments any of these words on your Reel, automation starts.
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-sky-700 bg-sky-50 px-2 py-1 rounded-md border border-sky-100">
                {keywords.length} active
              </span>
            </div>

            {/* Keyword Chips */}
            <div className="flex flex-wrap gap-2 pt-1">
              {keywords.map((kw, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-800 text-xs font-bold font-mono border border-slate-200"
                >
                  {kw}
                  <button
                    type="button"
                    onClick={() => handleRemoveKeyword(i)}
                    className="text-slate-400 hover:text-red-600 transition-colors p-0.5"
                    aria-label={`Remove keyword ${kw}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>

            {/* Keyword Input */}
            <div className="flex gap-2">
              <Input
                placeholder="Add keyword (e.g. GUIDE, VIP, SEND)"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddKeyword();
                  }
                }}
                className="h-10 text-xs font-medium rounded-xl"
              />
              <Button
                type="button"
                onClick={handleAddKeyword}
                size="sm"
                className="rounded-xl font-bold bg-sky-600 text-white hover:bg-sky-500 shadow-xs min-h-[40px] px-4"
              >
                <Plus className="w-4 h-4 mr-1" /> Add
              </Button>
            </div>
          </div>

          {/* 3. Mandatory 3 to 8 Reply Variations */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Public Comment Replies (Anti-Spam)</h3>
                <p className="text-xs text-slate-500 font-medium">
                  Instagram flags accounts that send identical replies. We automatically rotate 3–8 Spintax replies with dynamic @username.
                </p>
              </div>
              <span
                className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                  replies.length >= 3
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-amber-50 text-amber-700 border-amber-200"
                }`}
              >
                {replies.length >= 3
                  ? `✓ Compliant (${replies.length}/8)`
                  : `⚠️ Minimum 3 required (${replies.length}/3)`}
              </span>
            </div>

            <div className="space-y-3">
              {replies.map((reply, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <span className="text-xs font-mono font-bold text-slate-400 w-5 text-right">
                    #{i + 1}
                  </span>
                  <Input
                    value={reply}
                    onChange={(e) => handleReplyChange(i, e.target.value)}
                    placeholder="e.g. Sent to your DMs @username! 🔥"
                    className="h-10 text-xs font-medium rounded-xl flex-1"
                  />
                  {replies.length > 3 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveReply(i)}
                      className="p-2 text-slate-400 hover:text-red-600 transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg hover:bg-slate-100"
                      title="Delete variation"
                      aria-label={`Delete variation #${i + 1}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {replies.length < 8 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddReply}
                className="w-full rounded-xl border-dashed border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-50 min-h-[40px]"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Another Reply Variation ({replies.length}/8)
              </Button>
            )}

            {/* Interactive Spintax Tester Widget */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 mt-2 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                  Live Spintax Rotation Test:
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setSpintaxSampleIndex((prev) => (prev + 1) % sampleUsernames.length)
                  }
                  className="text-sky-600 hover:text-sky-700 font-bold text-[11px] flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  Test with @{sampleUsernames[(spintaxSampleIndex + 1) % sampleUsernames.length]}
                </button>
              </div>
              <p className="text-xs font-mono bg-white p-2.5 rounded-lg border border-slate-200 text-slate-800">
                💬{" "}
                {(replies[spintaxSampleIndex % replies.length] || "").replace(
                  /@username/gi,
                  `@${sampleUsernames[spintaxSampleIndex]}`
                )}
              </p>
            </div>
          </div>

          {/* 4. Follow-Gate Biometric Switch */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div className="space-y-1 pr-6">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">Follow-Gate Verification</h3>
              </div>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Only sends the download link if the commenter follows your Instagram account.
                Includes 1500ms fail-open guarantee so leads are never dropped if Meta is slow.
              </p>
            </div>
            <Switch
              checked={followGateEnabled}
              onCheckedChange={setFollowGateEnabled}
            />
          </div>

          {/* 5. 3-Button Generic Template Card Builder */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-5">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Direct Message Template Card</h3>
              <p className="text-xs text-slate-500 font-medium">
                Official Meta Generic Template format with up to 3 interactive clickable action buttons.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <label className="font-bold text-slate-700">Card Title</label>
                  <span className={`font-mono ${cardTitle.length > 80 ? "text-red-600 font-bold" : "text-slate-400"}`}>
                    {cardTitle.length}/80
                  </span>
                </div>
                <Input
                  maxLength={80}
                  value={cardTitle}
                  onChange={(e) => setCardTitle(e.target.value)}
                  placeholder="e.g. Complete Instagram Growth Playbook"
                  className="h-10 text-xs font-medium rounded-xl"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <label className="font-bold text-slate-700">Card Subtitle (Optional)</label>
                  <span className={`font-mono ${cardSubtitle.length > 80 ? "text-red-600 font-bold" : "text-slate-400"}`}>
                    {cardSubtitle.length}/80
                  </span>
                </div>
                <Input
                  maxLength={80}
                  value={cardSubtitle}
                  onChange={(e) => setCardSubtitle(e.target.value)}
                  placeholder="e.g. Free breakdown of our viral framework"
                  className="h-10 text-xs font-medium rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Card Image URL</label>
                <Input
                  value={cardImageUrl}
                  onChange={(e) => setCardImageUrl(e.target.value)}
                  placeholder="https://yourdomain.com/preview.png"
                  className="h-10 text-xs font-medium rounded-xl"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 space-y-3">
                <label className="block text-xs font-bold text-slate-700">
                  Card Action Buttons (Max 3)
                </label>

                {buttons.map((btn, i) => (
                  <div key={i} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                      <span>Button #{i + 1}</span>
                      {buttons.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveButton(i)}
                          className="text-slate-400 hover:text-red-600 transition-colors p-1"
                          aria-label={`Remove button #${i + 1}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <Input
                        value={btn.title}
                        onChange={(e) => handleButtonChange(i, "title", e.target.value)}
                        placeholder="Button Title (e.g. Download PDF)"
                        maxLength={20}
                        className="h-9 text-xs bg-white rounded-lg"
                      />
                      <Input
                        value={btn.type === "web_url" ? btn.url : ""}
                        onChange={(e) => handleButtonChange(i, "url", e.target.value)}
                        placeholder="Destination URL (https://...)"
                        className="h-9 text-xs bg-white rounded-lg"
                      />
                    </div>
                  </div>
                ))}

                {buttons.length < 3 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddButton}
                    className="w-full rounded-xl border-dashed border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-50 min-h-[40px]"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add Another Button ({buttons.length}/3)
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Instagram DM Mobile Preview */}
        <div
          className={`${
            mobileView === "preview" ? "block" : "hidden lg:block"
          } lg:col-span-5 sticky top-20`}
        >
          <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xl shadow-slate-200/60">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-sky-600" />
                Live Instagram DM Preview
              </span>
              <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Pixel-Accurate
              </span>
            </div>

            {/* Mock Instagram DM Viewport */}
            <div className="w-full max-w-[320px] mx-auto bg-slate-900 text-white rounded-[2.5rem] p-3 shadow-2xl border-4 border-slate-800">
              {/* Phone Speaker Notch */}
              <div className="w-24 h-4 bg-slate-800 rounded-full mx-auto mb-3" />

              {/* Chat Header */}
              <div className="flex items-center gap-2 px-2 pb-3 border-b border-slate-800 text-xs">
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-sky-400 to-emerald-400 flex items-center justify-center font-bold text-[10px] text-slate-950">
                  IG
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-slate-100 flex items-center gap-1">
                    your_account
                    <CheckCircle2 className="w-3 h-3 text-sky-400" />
                  </span>
                  <span className="text-[9px] text-slate-400 font-sans">Active now</span>
                </div>
              </div>

              {/* Chat Thread */}
              <div className="py-4 space-y-3">
                {/* Outgoing Bot DM Generic Template Card */}
                <div className="w-full bg-slate-800/90 border border-slate-700 rounded-2xl overflow-hidden shadow-lg">
                  {/* Card Image */}
                  {cardImageUrl ? (
                    <div className="aspect-[1.91/1] w-full bg-slate-950 overflow-hidden">
                      <img
                        src={cardImageUrl}
                        alt="Preview Card"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="aspect-[1.91/1] w-full bg-gradient-to-tr from-sky-900 to-slate-950 flex items-center justify-center text-slate-500 text-xs font-mono">
                      [Card Preview Image]
                    </div>
                  )}

                  {/* Card Body */}
                  <div className="p-3 text-left">
                    <h4 className="font-bold text-xs text-white leading-snug line-clamp-2">
                      {cardTitle || "Title goes here..."}
                    </h4>
                    {cardSubtitle && (
                      <p className="text-[10px] text-slate-400 line-clamp-2 mt-1 leading-normal">
                        {cardSubtitle}
                      </p>
                    )}
                  </div>

                  {/* Card Buttons */}
                  <div className="border-t border-slate-700/80 divide-y divide-slate-700/80">
                    {buttons.map((btn, i) => (
                      <div
                        key={i}
                        className="py-2.5 px-3 text-center text-xs font-bold text-sky-400 hover:bg-slate-700/50 cursor-pointer transition-colors"
                      >
                        {btn.title || `Button #${i + 1}`}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Follow Gate Note */}
                {followGateEnabled && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-[10px] text-emerald-300">
                    <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span>Follow-Gate Active: Non-followers are prompted to follow first</span>
                  </div>
                )}
              </div>

              {/* Phone Home Bar */}
              <div className="w-24 h-1 bg-slate-700 rounded-full mx-auto mt-4" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
