import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import {
  AlertCircle,
  Check,
  Copy,
  ExternalLink,
  GripVertical,
  Link2,
  Loader2,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useDashboard } from "./DashboardContext";
import type { LinkBlock, LinkPage, LinkPageProduct } from "@/types/contracts";
import "./phase3.css";

const MAX_BLOCKS = 20;

interface DraftBlock {
  id: string;
  label: string;
  targetUrl: string;
  productId?: string;
  /** Preserved from the API so the editor can show which blocks already earned clicks. */
  clickCount?: number;
}

/**
 * Link in bio (plan.md §4.5 / Phase 2).
 *
 * Blocks come straight from the Products library — the creator picks a product
 * and RELO inherits its buy link, so the page can never advertise a price the
 * catalog doesn't hold. Clicks route through the same short-link funnel as DM
 * buttons, so "Sent → Clicked" covers both surfaces.
 */
export default function LinkInBioPage() {
  const { currentAccount, selectedAccountId, isDemo } = useDashboard();
  const plan = currentAccount?.plan ?? "free";
  const locked = plan === "free";

  const [page, setPage] = useState<LinkPage | null>(null);
  const [blocks, setBlocks] = useState<DraftBlock[]>([]);
  const [products, setProducts] = useState<LinkPageProduct[]>([]);
  const [publicUrl, setPublicUrl] = useState<string | null>(null);
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [theme, setTheme] = useState<"volt" | "plain" | "dark">("volt");

  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    if (!selectedAccountId || isDemo) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.linkPage.get(selectedAccountId);
      setPage(data.page);
      setProducts(data.products);
      setPublicUrl(data.publicUrl);
      setHeadline(data.page?.headline ?? "");
      setBio(data.page?.bio ?? "");
      setTheme(data.page?.theme ?? "volt");
      setBlocks(
        data.blocks.map((b: LinkBlock) => ({
          id: b.id,
          label: b.label,
          targetUrl: b.targetUrl,
          productId: b.productId,
          clickCount: b.clickCount,
        }))
      );
    } catch (err) {
      setError(
        err instanceof ApiError && err.code === "LINK_PAGE_LOCKED"
          ? "Link in bio is a Pro feature."
          : "Couldn't load your link page. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  }, [selectedAccountId, isDemo]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async (publish: boolean) => {
    if (!selectedAccountId) return;
    const clean = blocks.filter((b) => b.label.trim());
    if (clean.some((b) => !b.productId && !/^https?:\/\//i.test(b.targetUrl.trim()))) {
      setError("Every block needs a product or a link starting with http://");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const data = await api.linkPage.save(selectedAccountId, {
        headline,
        bio,
        theme,
        isPublished: publish,
        blocks: clean.map((b) => ({
          id: b.id,
          label: b.label.trim(),
          targetUrl: b.targetUrl.trim() || undefined,
          productId: b.productId,
        })),
      });
      setPage(data.page);
      setPublicUrl(data.publicUrl);
      setNotice(
        publish ? "Published — your page is live." : "Saved. Your page is still private."
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't save your page.");
    } finally {
      setSaving(false);
    }
  };

  const copy = async () => {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Couldn't copy — select the link and copy it manually.");
    }
  };

  const addBlock = () => {
    if (blocks.length >= MAX_BLOCKS) {
      setError(`A page holds up to ${MAX_BLOCKS} blocks.`);
      return;
    }
    setBlocks((prev) => [
      ...prev,
      { id: `draft_${Date.now().toString(36)}`, label: "", targetUrl: "" },
    ]);
  };

  const updateBlock = (id: string, patch: Partial<DraftBlock>) =>
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));

  const removeBlock = (id: string) =>
    setBlocks((prev) => prev.filter((b) => b.id !== id));

  if (locked) {
    return (
      <div className="pg-page">
        <div className="pg-head">
          <div>
            <span className="hm-eyebrow">Link in bio</span>
            <h1 className="hm-title">
              One link that <em>sells for you.</em>
            </h1>
            <p className="pg-sub">
              A fast public page with your links and product cards — drop it in your bio.
            </p>
          </div>
        </div>
        <div className="st-card st-empty">
          <div className="st-empty__icon">
            <Link2 aria-hidden />
          </div>
          <h3>This one is a Pro feature</h3>
          <p>
            You're on the Free plan. Upgrade and every product in your catalog becomes a tappable
            block on a page you own.
          </p>
          <Link to="/dashboard/settings#billing" className="sh-btn sh-btn--accent st-empty__cta">
            Upgrade to Pro
          </Link>
        </div>
      </div>
    );
  }

  const totalClicks = blocks.reduce((sum, b) => sum + (b.clickCount ?? 0), 0);

  return (
    <div className="pg-page">
      <div className="pg-head">
        <div>
          <span className="hm-eyebrow">Link in bio</span>
          <h1 className="hm-title">
            One link that <em>sells for you.</em>
          </h1>
          <p className="pg-sub">
            Pick products from your catalog, add any links you like, publish. Every click lands in
            the same Sent → Clicked funnel as your DMs.
          </p>
        </div>
        {!isDemo && (
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              className="sh-btn sh-btn--ghost"
              onClick={() => save(false)}
              disabled={saving}
            >
              {saving ? <Loader2 size={14} className="prd-spin" aria-hidden /> : <Save size={14} aria-hidden />}
              Save
            </button>
            <button
              type="button"
              className="sh-btn sh-btn--accent"
              onClick={() => save(true)}
              disabled={saving}
            >
              <Check size={14} aria-hidden />
              {page?.isPublished ? "Update page" : "Publish"}
            </button>
          </div>
        )}
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

      {isLoading ? (
        <div className="st-card st-empty">
          <Loader2 size={20} className="prd-spin" aria-hidden />
          <h3>Loading your page…</h3>
        </div>
      ) : (
        <div className="lib-layout">
          {/* ── editor ── */}
          <div className="st-card lib-editor">
            <div className="prd-grid">
              <label className="st-field">
                <span className="st-label">Headline</span>
                <input
                  className="st-input"
                  value={headline}
                  maxLength={120}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="Everything I use to grow"
                  disabled={isDemo}
                />
              </label>
              <label className="st-field">
                <span className="st-label">Theme</span>
                <select
                  className="st-input"
                  value={theme}
                  onChange={(e) => setTheme(e.target.value as typeof theme)}
                  disabled={isDemo}
                >
                  <option value="volt">Volt — light</option>
                  <option value="plain">Plain — white</option>
                  <option value="dark">Dark</option>
                </select>
              </label>
            </div>

            <label className="st-field">
              <span className="st-label">Bio</span>
              <textarea
                className="st-input"
                rows={2}
                maxLength={500}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="One line on what you make."
                disabled={isDemo}
              />
            </label>

            <div className="lib-blocks__head">
          <span className="st-label">
            Blocks <em>{blocks.length}/{MAX_BLOCKS}</em>
            {totalClicks > 0 && <> · {totalClicks} clicks</>}
          </span>
              <button
                type="button"
                className="sh-btn sh-btn--ghost sh-btn--sm"
                onClick={addBlock}
                disabled={isDemo || blocks.length >= MAX_BLOCKS}
              >
                <Plus size={13} aria-hidden /> Add block
              </button>
            </div>

            {blocks.length === 0 ? (
              <p className="cvs-inspector__empty">
                Add a block from your Products catalog or paste any link. Products keep their price
                and buy link automatically.
              </p>
            ) : (
              <div className="lib-blocks">
                {blocks.map((b, i) => (
                  <div className="lib-block" key={b.id}>
                    <GripVertical size={14} className="lib-block__grip" aria-hidden />
                    <span className="lib-block__pos">{i + 1}</span>
                    <input
                      className="st-input"
                      value={b.label}
                      maxLength={60}
                      onChange={(e) => updateBlock(b.id, { label: e.target.value })}
                      placeholder="Button text"
                      disabled={isDemo}
                    />
                    <select
                      className="st-input"
                      value={b.productId ?? ""}
                      onChange={(e) => {
                        const productId = e.target.value || undefined;
                        const product = products.find((p) => p.id === productId);
                        updateBlock(
                          b.id,
                          productId
                            ? {
                                productId,
                                targetUrl: product?.link ?? "",
                                label: b.label || product?.name || "",
                              }
                            : { productId: undefined }
                        );
                      }}
                      disabled={isDemo}
                    >
                      <option value="">Custom link…</option>
                      {products
                        .filter((p) => p.link)
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                            {p.priceText ? ` — ${p.priceText}` : ""}
                          </option>
                        ))}
                    </select>
                    <input
                      className="st-input"
                      value={b.targetUrl}
                      onChange={(e) => updateBlock(b.id, { targetUrl: e.target.value })}
                      placeholder="https://…"
                      disabled={isDemo || Boolean(b.productId)}
                    />
                    <button
                      type="button"
                      className="sh-iconbtn"
                      aria-label={`Remove block ${i + 1}`}
                      onClick={() => removeBlock(b.id)}
                      disabled={isDemo}
                    >
                      <Trash2 size={14} aria-hidden />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── preview ── */}
          <aside className="lib-preview" aria-label="Page preview">
            <p className="st-label">Preview</p>
            <div className={`lib-phone lib-phone--${theme}`}>
              <p className="lib-phone__handle">@{currentAccount?.username ?? "you"}</p>
              <h3>{headline || "Your headline"}</h3>
              {bio && <p className="lib-phone__bio">{bio}</p>}
              <div className="lib-phone__links">
                {blocks.filter((b) => b.label.trim()).length === 0 ? (
                  <span className="lib-phone__empty">Your blocks appear here</span>
                ) : (
                  blocks
                    .filter((b) => b.label.trim())
                    .map((b) => (
                      <span className="lib-phone__btn" key={b.id}>
                        {b.label}
                      </span>
                    ))
                )}
              </div>
              <p className="lib-phone__foot">
                Made with <b>RELO</b>
              </p>
            </div>

            {publicUrl && (
              <div className="lib-share">
                <input className="st-input" readOnly value={publicUrl} aria-label="Your public page URL" />
                <button type="button" className="sh-iconbtn" aria-label="Copy page URL" onClick={copy}>
                  {copied ? <Check size={14} aria-hidden /> : <Copy size={14} aria-hidden />}
                </button>
                <a
                  className="sh-iconbtn"
                  href={publicUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label="Open your page"
                >
                  <ExternalLink size={14} aria-hidden />
                </a>
              </div>
            )}
          </aside>
        </div>
      )}

      <p className="pg-note">
        <Link2 size={12} aria-hidden /> A page that isn't published returns a 404 — nothing leaks
        at a guessable URL. Publish when you're ready to paste it into your bio.
        {page?.isPublished && " Clicks land in Insights alongside your DM clicks."}
      </p>
    </div>
  );
}