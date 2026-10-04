import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useSeo } from "@/lib/seo";

/**
 * `/demo` — a stable, linkable entry into the sample workspace.
 *
 * Previously demo mode was only reachable via `?demo=true`, and the first
 * sidebar click dropped that query string and bounced to /login. This route
 * flips the sticky flag in sessionStorage, then hands off to the dashboard
 * with every internal link staying in demo mode.
 */
export default function Demo() {
  const navigate = useNavigate();
  // Sample workspace — never index this.
  useSeo({ title: "Live demo — RELO", description: "Sample RELO workspace.", path: "/demo", index: false });

  useEffect(() => {
    sessionStorage.setItem("relo.demo", "1");
    navigate("/dashboard", { replace: true });
  }, [navigate]);

  return (
    <div className="nf">
      <main className="nf-main">
        <span className="nf-eyebrow">Demo</span>
        <h1 className="nf-h1">
          Opening the sample <em>workspace.</em>
        </h1>
        <p className="nf-sub">Loading a creator account with reels, leads and analytics…</p>
      </main>
    </div>
  );
}
