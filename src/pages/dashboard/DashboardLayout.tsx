import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router";
import {
  Home,
  Zap,
  Megaphone,
  Users,
  BarChart3,
  Package,
  Link2,
  CalendarDays,
  Settings as SettingsIcon,
  Workflow,
  LogOut,
  Instagram,
  Sparkles,
  AlertCircle,
  Menu,
  X,
  ArrowUpRight,
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { api } from "@/lib/api";
import { useDashboard } from "./DashboardContext";
import "./dashboard-shell.css";

interface NavItem {
  to: string;
  label: string;
  icon: typeof Home;
  end?: boolean;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { to: "/dashboard", label: "Home", icon: Home, end: true },
  { to: "/dashboard/automations", label: "Automations", icon: Zap },
  { to: "/dashboard/campaigns", label: "Campaigns", icon: Megaphone, badge: "Pro" },
  { to: "/dashboard/canvas", label: "Canvas", icon: Workflow, badge: "Studio" },
  { to: "/dashboard/leads", label: "Leads", icon: Users },
  { to: "/dashboard/insights", label: "Insights", icon: BarChart3 },
  { to: "/dashboard/products", label: "Products", icon: Package, badge: "Pro" },
  { to: "/dashboard/link-in-bio", label: "Link in bio", icon: Link2, badge: "Pro" },
  { to: "/dashboard/content", label: "Content", icon: CalendarDays, badge: "Pro" },
  { to: "/dashboard/settings", label: "Settings", icon: SettingsIcon },
];

const TIER_CREDIT_LIMITS: Record<string, number> = { free: 3, pro: 500, studio: 5000 };

function ConnectNag({ onClose }: { onClose: () => void }) {
  return (
    <div className="sh-modal" role="dialog" aria-modal="true" aria-label="Connect your account">
      <div className="sh-modal__card">
        <div className="sh-modal__icon">
          <Instagram size={22} />
        </div>
        <h3>Connect your Instagram</h3>
        <p>
          RELO runs on your connected Instagram Professional account. Link it once — every
          automation, lead, and campaign flows from there.
        </p>
        <div className="sh-modal__actions">
          <button type="button" className="sh-btn sh-btn--ghost sh-btn--sm" onClick={onClose}>
            Later
          </button>
          <button
            type="button"
            className="sh-btn sh-btn--accent sh-btn--sm"
            onClick={() => {
              onClose();
              window.location.assign("/dashboard/settings#connection");
            }}
          >
            Connect now <ArrowUpRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DashboardLayout() {
  const location = useLocation();
  const {
    isDemo,
    accounts,
    currentAccount,
    isLoadingAccounts,
    accountsError,
    reloadAccounts,
    exitDemo,
    previewPlan,
    setPreviewPlan,
  } = useDashboard();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [nagDismissed, setNagDismissed] = useState(false);

  // Close the mobile drawer on navigation
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  // Nag until connected: returns every visit (dismissible, non-persistent)
  const showNag = !isDemo && !isLoadingAccounts && accounts.length === 0 && !nagDismissed && !accountsError;

  const plan = currentAccount?.plan || "free";
  const credits = currentAccount?.aiCreditsRemaining ?? 0;
  const creditLimit = TIER_CREDIT_LIMITS[plan] ?? 3;
  const creditPct = Math.min(100, Math.max(4, Math.round((credits / creditLimit) * 100)));

  const sidebar = (
    <>
      <div className="sh-sidebar__brand">
        <NavLink to="/" className="sh-logo" aria-label="RELO home">
          <span className="sh-logo__mark">R.</span>
          <span className="sh-logo__name">RELO</span>
        </NavLink>
        <button
          type="button"
          className="sh-sidebar__close"
          aria-label="Close navigation"
          onClick={() => setDrawerOpen(false)}
        >
          <X size={16} />
        </button>
      </div>

      <nav className="sh-sidebar__nav" aria-label="Studio">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `sh-navitem${isActive ? " is-active" : ""}`}
          >
            <item.icon size={16} strokeWidth={2.2} aria-hidden />
            <span>{item.label}</span>
            {item.badge && <em className="sh-navitem__badge">{item.badge}</em>}
          </NavLink>
        ))}
      </nav>

      <div className="sh-sidebar__plan">
        <span className="sh-plan__tier">
          {/* A tier preview overrides the demo label — showing “Demo” while the
              editor enforces Studio limits would contradict itself. */}
          {isDemo && !previewPlan
            ? "Demo"
            : plan === "free"
              ? "Free forever"
              : plan === "pro"
                ? "Pro"
                : "Studio"}
        </span>
        <span className="sh-plan__label">AI credits</span>
        <div className="sh-plan__meter" aria-hidden>
          <i style={{ width: `${creditPct}%` }} />
        </div>
        <span className="sh-plan__usage">
          {credits} / {creditLimit} left
        </span>
        {plan === "free" && !isDemo && (
          <NavLink to="/dashboard/settings#billing" className="sh-btn sh-btn--accent sh-btn--sm sh-plan__upgrade">
            <Sparkles size={13} /> Upgrade plan
          </NavLink>
        )}
      </div>
    </>
  );

  return (
    <div className="sh-shell">
      {/* demo banner */}
      {isDemo && (
        <div className="sh-demo-banner">
          <Sparkles size={13} style={{ color: "var(--accent-text)" }} aria-hidden />
          <span>
            Studio demo mode — <em>sample data</em>, no account connected.
          </span>
          <NavLink to="/login">Sign in</NavLink>
          <span>to run your real funnel.</span>
          <div className="sh-demo-banner__tiers" role="group" aria-label="Preview plan">
            <span>Preview as</span>
            {(["free", "pro", "studio"] as const).map((t) => (
              <button
                key={t}
                type="button"
                className={`sh-demo-banner__tier${previewPlan === t ? " is-on" : ""}`}
                aria-pressed={previewPlan === t}
                onClick={() => setPreviewPlan(t)}
              >
                {t === "free" ? "Free" : t === "pro" ? "Pro" : "Studio"}
              </button>
            ))}
          </div>
          <button type="button" className="sh-demo-banner__exit" onClick={exitDemo}>
            Exit demo
          </button>
        </div>
      )}

      <div className="sh-body">
        {/* desktop sidebar */}
        <aside className="sh-sidebar">{sidebar}</aside>

        {/* mobile drawer */}
        {drawerOpen && (
          <>
            <div className="sh-drawer-backdrop" onClick={() => setDrawerOpen(false)} aria-hidden />
            <aside className="sh-sidebar sh-sidebar--drawer">{sidebar}</aside>
          </>
        )}

        <div className="sh-main">
          {/* top bar */}
          <header className="sh-topbar">
            <button
              type="button"
              className="sh-topbar__menu"
              aria-label="Open navigation"
              onClick={() => setDrawerOpen(true)}
            >
              <Menu size={17} />
            </button>

            <div className="sh-topbar__right">
              <ThemeToggle compact />
              {isLoadingAccounts ? (
                <div className="sh-account" aria-live="polite">
                  <span style={{ color: "var(--text-faint)", fontSize: 12, fontWeight: 600 }}>
                    Syncing…
                  </span>
                </div>
              ) : currentAccount ? (
                <div className="sh-account">
                  <span className="sh-account__avatar">
                    <Instagram size={12} aria-hidden />
                  </span>
                  <span className="sh-account__name">@{currentAccount.username}</span>
                  <span className="sh-account__token">{currentAccount.daysUntilExpiration}d</span>
                </div>
              ) : null}
              <button
                type="button"
                className="sh-iconbtn"
                onClick={api.auth.logout}
                title="Log out"
                aria-label="Log out"
              >
                <LogOut size={15} />
              </button>
            </div>
          </header>

          <main className="sh-content">
            {accountsError && !isDemo && (
              <div className="sh-alert" role="alert" style={{ marginBottom: 18 }}>
                <AlertCircle size={16} aria-hidden />
                <span style={{ flex: 1 }}>{accountsError}</span>
                <button type="button" className="sh-btn sh-btn--ghost sh-btn--sm" onClick={reloadAccounts}>
                  Retry
                </button>
              </div>
            )}
            <Outlet />
          </main>
        </div>
      </div>

      {showNag && <ConnectNag onClose={() => setNagDismissed(true)} />}
    </div>
  );
}
