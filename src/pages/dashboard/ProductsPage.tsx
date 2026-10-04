import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import {
  AlertCircle,
  Check,
  ExternalLink,
  Loader2,
  Package,
  PackagePlus,
  Pencil,
  Trash2,
} from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useDashboard } from "./DashboardContext";
import type { Product } from "@/types/contracts";

const PRODUCT_LIMIT = 50;

interface Draft {
  id?: string;
  name: string;
  priceText: string;
  description: string;
  link: string;
  imageUrl: string;
  isActive: boolean;
}

const EMPTY_DRAFT: Draft = {
  name: "",
  priceText: "",
  description: "",
  link: "",
  imageUrl: "",
  isActive: true,
};

/**
 * Products library (plan.md §4.4). The knowledge base AI answers product
 * questions from, and the data source for the link-in-bio page.
 * Pro/Studio only — Free sees the upgrade path, not a dead stub.
 */
export default function ProductsPage() {
  const { currentAccount, selectedAccountId, isDemo } = useDashboard();
  const plan = currentAccount?.plan ?? "free";
  const locked = plan === "free";

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!selectedAccountId || isDemo) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const { products: rows } = await api.products.list(selectedAccountId);
      setProducts(rows);
    } catch (err) {
      setError(
        err instanceof ApiError && err.code === "PRODUCTS_LOCKED"
          ? "Products are a Pro feature."
          : "Couldn't load your products. Please try again."
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
    if (!draft.name.trim()) {
      setError("Give the product a name first.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const { product } = await api.products.save(selectedAccountId, {
        id: draft.id,
        name: draft.name,
        priceText: draft.priceText || undefined,
        description: draft.description || undefined,
        link: draft.link || undefined,
        imageUrl: draft.imageUrl || undefined,
        isActive: draft.isActive,
      });
      setProducts((prev) => {
        const next = prev.filter((p) => p.id !== product.id);
        next.unshift(product);
        return next;
      });
      setDraft(null);
      setNotice(draft.id ? "Product updated." : "Product added.");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Couldn't save that product. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const remove = async (product: Product) => {
    if (!selectedAccountId) return;
    if (!window.confirm(`Delete “${product.name}”? AI will stop answering questions about it.`)) {
      return;
    }
    try {
      await api.products.remove(selectedAccountId, product.id);
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
      setNotice("Product deleted.");
    } catch {
      setError("Couldn't delete that product. Please try again.");
    }
  };

  const startEdit = (p: Product) =>
    setDraft({
      id: p.id,
      name: p.name,
      priceText: p.priceText ?? "",
      description: p.description ?? "",
      link: p.link ?? "",
      imageUrl: p.imageUrl ?? "",
      isActive: p.isActive,
    });

  const atLimit = products.length >= PRODUCT_LIMIT;

  return (
    <div className="pg-page">
      <div className="pg-head">
        <div>
          <span className="hm-eyebrow">Products</span>
          <h1 className="hm-title">
            Let AI answer <em>the price question.</em>
          </h1>
          <p className="pg-sub">
            Feed in your products — name, price, link. When someone DMs asking, AI replies with the
            right answer and a tappable link, using only your data.
          </p>
        </div>
        {!locked && !draft && !atLimit && (
          <button
            type="button"
            className="sh-btn sh-btn--accent"
            onClick={() => setDraft({ ...EMPTY_DRAFT })}
          >
            <PackagePlus size={15} aria-hidden /> Add product
          </button>
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

      {/* ── Free: honest upgrade path, not a dead stub ── */}
      {locked ? (
        <div className="st-card st-empty">
          <div className="st-empty__icon">
            <Package aria-hidden />
          </div>
          <h3>This one is a Pro feature</h3>
          <p>
            You're on the Free plan. Upgrade and AI will answer product questions inside your DMs —
            using only the data you put here, never guessing.
          </p>
          <Link to="/dashboard/settings#billing" className="sh-btn sh-btn--accent st-empty__cta">
            Upgrade to Pro
          </Link>
        </div>
      ) : (
        <>
          {/* ── editor ── */}
          {draft && (
            <div className="st-card prd-editor">
              <h3 className="prd-editor__title">
                {draft.id ? "Edit product" : "New product"}
                <span className="st-chip st-chip--email">
                  {products.length}/{PRODUCT_LIMIT}
                </span>
              </h3>

              <div className="prd-grid">
                <label className="st-field">
                  <span className="st-label">Name *</span>
                  <input
                    className="st-input"
                    value={draft.name}
                    maxLength={120}
                    onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                    placeholder="Growth Blueprint"
                  />
                </label>
                <label className="st-field">
                  <span className="st-label">Price</span>
                  <input
                    className="st-input"
                    value={draft.priceText}
                    maxLength={60}
                    onChange={(e) => setDraft({ ...draft, priceText: e.target.value })}
                    placeholder="₹499 / $19"
                  />
                </label>
              </div>

              <label className="st-field">
                <span className="st-label">Description</span>
                <textarea
                  className="st-input"
                  rows={3}
                  value={draft.description}
                  maxLength={500}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                  placeholder="What it is, who it's for, what's inside. AI answers only from this."
                />
              </label>

              <div className="prd-grid">
                <label className="st-field">
                  <span className="st-label">Buy link</span>
                  <input
                    className="st-input"
                    value={draft.link}
                    onChange={(e) => setDraft({ ...draft, link: e.target.value })}
                    placeholder="https://yourbrand.com/product"
                  />
                </label>
                <label className="st-field">
                  <span className="st-label">Image URL</span>
                  <input
                    className="st-input"
                    value={draft.imageUrl}
                    onChange={(e) => setDraft({ ...draft, imageUrl: e.target.value })}
                    placeholder="https://cdn.yourbrand.com/cover.jpg"
                  />
                </label>
              </div>

              <div className="prd-editor__actions">
                <label className="prd-toggle">
                  <input
                    type="checkbox"
                    checked={draft.isActive}
                    onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })}
                  />
                  <span>Active — AI may quote this product</span>
                </label>
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
                    disabled={saving || !draft.name.trim()}
                  >
                    {saving ? <Loader2 size={14} className="prd-spin" aria-hidden /> : <Check size={14} aria-hidden />}
                    {draft.id ? "Save changes" : "Add product"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── list ── */}
          {isLoading ? (
            <div className="st-card st-empty">
              <Loader2 size={20} className="prd-spin" aria-hidden />
              <h3>Loading your catalog…</h3>
            </div>
          ) : products.length === 0 ? (
            <div className="st-card st-empty">
              <div className="st-empty__icon">
                <Package aria-hidden />
              </div>
              <h3>No products yet</h3>
              <p>
                Add your first product and AI will start answering price questions inside your DMs.
              </p>
              <button
                type="button"
                className="sh-btn sh-btn--accent st-empty__cta"
                onClick={() => setDraft({ ...EMPTY_DRAFT })}
              >
                <PackagePlus size={15} aria-hidden /> Add your first product
              </button>
            </div>
          ) : (
            <div className="prd-list">
              {products.map((p) => (
                <article className="st-card prd-row" key={p.id}>
                  {p.imageUrl ? (
                    <img className="prd-row__img" src={p.imageUrl} alt="" loading="lazy" />
                  ) : (
                    <div className="prd-row__img prd-row__img--empty" aria-hidden>
                      <Package size={18} />
                    </div>
                  )}
                  <div className="prd-row__body">
                    <div className="prd-row__head">
                      <b>{p.name}</b>
                      {p.priceText && <span className="st-chip st-chip--email">{p.priceText}</span>}
                      {!p.isActive && (
                        <span className="st-chip st-chip--nonfollower">paused</span>
                      )}
                    </div>
                    {p.description && <p className="prd-row__desc">{p.description}</p>}
                    {p.link && (
                      <a
                        className="prd-row__link"
                        href={p.link}
                        target="_blank"
                        rel="noreferrer noopener"
                      >
                        <ExternalLink size={11} aria-hidden /> {p.link}
                      </a>
                    )}
                  </div>
                  <div className="prd-row__actions">
                    <button
                      type="button"
                      className="sh-iconbtn"
                      aria-label={`Edit ${p.name}`}
                      onClick={() => startEdit(p)}
                    >
                      <Pencil size={14} aria-hidden />
                    </button>
                    <button
                      type="button"
                      className="sh-iconbtn"
                      aria-label={`Delete ${p.name}`}
                      onClick={() => remove(p)}
                    >
                      <Trash2 size={14} aria-hidden />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}

          {!isDemo && (
            <p className="pg-note">
              <Package size={12} aria-hidden /> Up to {PRODUCT_LIMIT} products — the whole catalog
              fits inside one AI prompt, so answers stay fast and grounded in your data.
            </p>
          )}
        </>
      )}
    </div>
  );
}
