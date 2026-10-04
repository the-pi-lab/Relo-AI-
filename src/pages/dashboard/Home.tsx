import { useEffect } from "react";
import { Link } from "react-router";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Check,
  CircleDashed,
  Instagram,
  MousePointerClick,
  Send,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useDashboard } from "./DashboardContext";

function SetupChecklist() {
  const { accounts, activeAutomationCount, telemetry, isDemo } = useDashboard();

  const steps = [
    {
      label: "Connect your Instagram account",
      done: accounts.length > 0,
      to: "/dashboard/settings#connection",
    },
    {
      label: "Launch your first automation",
      done: activeAutomationCount > 0,
      to: "/dashboard/automations",
    },
    {
      label: "First DM sent",
      done: telemetry.totalDmsSent > 0,
      to: "/dashboard/insights",
    },
    {
      label: "First button clicked",
      done: (telemetry.totalClicks ?? 0) > 0,
      to: "/dashboard/insights",
    },
  ];
  const completed = steps.filter((s) => s.done).length;

  return (
    <section className="hm-card hm-setup">
      <div className="hm-setup__head">
        <div>
          <span className="hm-eyebrow">Get setup</span>
          <h3>From zero to first customer</h3>
        </div>
        <span className="hm-setup__count">
          {completed}/{steps.length}
        </span>
      </div>
      <ol className="hm-setup__list">
        {steps.map((step, i) => (
          <li key={step.label} className={step.done ? "is-done" : ""}>
            <Link to={isDemo && i === 0 ? "/dashboard/settings#connection" : step.to}>
              {step.done ? (
                <span className="hm-setup__check">
                  <Check size={12} strokeWidth={3} />
                </span>
              ) : (
                <span className="hm-setup__check hm-setup__check--todo">
                  <CircleDashed size={14} />
                </span>
              )}
              <span className="hm-setup__label">{step.label}</span>
              <ArrowRight size={14} className="hm-setup__go" aria-hidden />
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}

function GrowthCard() {
  const { telemetry, isLoadingAnalytics, analyticsError, loadAnalytics } = useDashboard();

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  return (
    <section className="hm-card hm-growth">
      <div className="hm-growth__head">
        <span className="hm-eyebrow">Growth &amp; Engagement</span>
        <button
          type="button"
          className="sh-btn sh-btn--ghost sh-btn--sm"
          onClick={loadAnalytics}
          disabled={isLoadingAnalytics}
        >
          Refresh
        </button>
      </div>

      {isLoadingAnalytics ? (
        <div className="hm-growth__body" role="status" aria-label="Loading stats">
          <div className="st-skel" style={{ width: 130, height: 52, borderRadius: 12 }} />
          <div className="st-skel" style={{ width: "100%", height: 44, borderRadius: 12 }} />
        </div>
      ) : analyticsError ? (
        <div className="sh-alert" role="alert">
          <span style={{ flex: 1 }}>{analyticsError}</span>
          <button type="button" className="sh-btn sh-btn--ghost sh-btn--sm" onClick={loadAnalytics}>
            Retry
          </button>
        </div>
      ) : (
        <>
          <div className="hm-growth__conversion">
            <div className="hm-growth__convlabel">
              <TrendingUp size={14} aria-hidden /> Conversion
            </div>
            <div className="hm-growth__convvalue">{telemetry.followerConversionRate}%</div>
          </div>
          <div className="hm-growth__pills">
            <div className="hm-pill">
              <span className="hm-pill__icon hm-pill__icon--sent">
                <Send size={13} aria-hidden />
              </span>
              <div>
                <b>{telemetry.totalDmsSent.toLocaleString()}</b>
                <span>DMs sent</span>
              </div>
            </div>
            <div className="hm-pill">
              <span className="hm-pill__icon hm-pill__icon--clicked">
                <MousePointerClick size={13} aria-hidden />
              </span>
              <div>
                <b>{(telemetry.totalClicks ?? 0).toLocaleString()}</b>
                <span>Button clicks</span>
              </div>
            </div>
            <div className="hm-pill">
              <span className="hm-pill__icon hm-pill__icon--leads">
                <BadgeCheck size={13} aria-hidden />
              </span>
              <div>
                <b>{telemetry.totalLeads.toLocaleString()}</b>
                <span>Leads captured</span>
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

function PlanCard() {
  const { currentAccount, isDemo } = useDashboard();
  // currentAccount already carries the demo tier-preview override, so the
  // card cannot claim “Free forever” while the app enforces Studio limits.
  const plan = currentAccount?.plan || "free";
  const credits = currentAccount?.aiCreditsRemaining ?? 3;
  const limit = plan === "free" ? 3 : plan === "pro" ? 500 : 5000;
  const pct = Math.min(100, Math.max(4, Math.round((credits / limit) * 100)));

  const rows = [
    { label: "Automations", value: plan === "free" ? "1 reel" : "Unlimited" },
    { label: "Messages", value: "Unlimited" },
    { label: "Contacts", value: "Unlimited" },
    { label: "Campaigns", value: plan === "free" ? "—" : "Included" },
  ];

  return (
    <section className="hm-card hm-plan">
      <div className="hm-plan__head">
        <span className="hm-plan__crown" aria-hidden>
          <Sparkles size={15} />
        </span>
        <div>
          <h3>{plan === "free" ? "Free Forever" : plan === "pro" ? "Pro" : "Studio"}</h3>
          <p>
            {plan === "free"
              ? "Upgrade to unlock your growth"
              : "Your growth stays unlimited — always."}
          </p>
        </div>
      </div>

      <div className="hm-plan__credits">
        <div className="hm-plan__creditsrow">
          <span>AI credits</span>
          <b>
            {credits} / {limit}
          </b>
        </div>
        <div className="sh-plan__meter hm-plan__meter">
          <i style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="hm-plan__rows">
        {rows.map((r) => (
          <div className="hm-plan__row" key={r.label}>
            <span>{r.label}</span>
            <b>{r.value}</b>
          </div>
        ))}
      </div>

      {plan === "free" && !isDemo && (
        <Link to="/dashboard/settings#billing" className="sh-btn sh-btn--accent sh-plan__cta">
          Manage plan <ArrowUpRight size={14} />
        </Link>
      )}
    </section>
  );
}

export default function Home() {
  const { accounts, currentAccount, isDemo } = useDashboard();
  const hasAccount = accounts.length > 0 || isDemo;

  return (
    <div className="hm-page">
      <div className="hm-head">
        <span className="hm-eyebrow">Home</span>
        <h1 className="hm-title">
          {hasAccount ? (
            <>
              Welcome back{currentAccount ? `, @${currentAccount.username}` : ""}.
            </>
          ) : (
            <>Your command center.</>
          )}
        </h1>
      </div>

      <div className="hm-grid">
        <div className="hm-grid__left">
          <SetupChecklist />
          <GrowthCard />
        </div>
        <div className="hm-grid__right">
          <PlanCard />
          {hasAccount ? (
            <section className="hm-card hm-quick">
              <span className="hm-eyebrow">Quick actions</span>
              <div className="hm-quick__row">
                <Link to="/dashboard/automations" className="hm-quick__action">
                  <Zap size={15} aria-hidden />
                  Automate a reel
                  <ArrowRight size={13} className="hm-quick__go" aria-hidden />
                </Link>
                <Link to="/dashboard/leads" className="hm-quick__action">
                  <Instagram size={15} aria-hidden />
                  Browse leads
                  <ArrowRight size={13} className="hm-quick__go" aria-hidden />
                </Link>
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
