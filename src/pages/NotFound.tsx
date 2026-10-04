import { Link, useLocation } from "react-router";
import { Home, LayoutDashboard, SearchX } from "lucide-react";
import { useSeo } from "@/lib/seo";
import "./notfound.css";

/**
 * Token-based 404 (plan.md §2 — no hardcoded palettes). Two shapes: a framed
 * card for the marketing shell, and a borderless panel for the dashboard shell
 * so a mistyped URL never looks like it left the app.
 */
export default function NotFound() {
  const location = useLocation();
  const inDashboard = location.pathname.startsWith("/dashboard");

  useSeo({
    title: "Page not found — RELO",
    description: "That RELO page doesn't exist.",
    path: location.pathname,
    index: false,
  });

  return (
    <div className={`nf${inDashboard ? " nf--panel" : ""}`}>
      {!inDashboard && (
        <header className="nf-top">
          <Link to="/" className="nf-logo" aria-label="RELO home">
            <span className="nf-logo__mark" aria-hidden>
              R.
            </span>
            <span className="nf-logo__name">RELO</span>
          </Link>
        </header>
      )}

      <main className="nf-main">
        <div className="nf-code" aria-hidden>
          404
        </div>
        <span className="nf-eyebrow">
          <SearchX size={13} aria-hidden /> Lost that one
        </span>
        <h1 className="nf-h1">
          This page doesn&apos;t <em>exist.</em>
        </h1>
        <p className="nf-sub">
          {inDashboard
            ? "That link points somewhere inside your studio that we don't have. Head back to your dashboard — nothing was lost."
            : "The link may be out of date, or the page may have moved. Everything you need is one click away."}
        </p>
        <div className="nf-actions">
          {inDashboard ? (
            <Link to="/dashboard" className="nf-btn nf-btn--primary">
              <LayoutDashboard size={15} aria-hidden /> Back to dashboard
            </Link>
          ) : (
            <>
              <Link to="/dashboard" className="nf-btn nf-btn--primary">
                <LayoutDashboard size={15} aria-hidden /> Creator studio
              </Link>
              <Link to="/" className="nf-btn">
                <Home size={15} aria-hidden /> Home
              </Link>
            </>
          )}
        </div>
      </main>

      {!inDashboard && (
        <footer className="nf-foot">RELO · Official Meta Graph API · thepilab.in</footer>
      )}
    </div>
  );
}
