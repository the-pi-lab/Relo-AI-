import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  BadgeCheck,
  Check,
  Copy,
  CreditCard,
  Database,
  Instagram,
  Loader2,
  LogOut,
  RefreshCw,
  Share2,
  ShieldCheck,
  Sparkles,
  Smartphone,
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { api } from "@/lib/api";
import { useDashboard } from "./DashboardContext";

declare global {
  interface Window {
    FB?: {
      init: (opts: { appId: string; cookie: boolean; xfbml: boolean; version: string }) => void;
      login: (
        cb: (response: { authResponse?: { accessToken: string } | null }) => void,
        opts: { scope: string }
      ) => void;
    };
  }
}

const TIER_PRICES: Record<string, { inr: number; credits: string }> = {
  pro: { inr: 149, credits: "500" },
  studio: { inr: 399, credits: "5,000" },
};

export default function SettingsPage() {
  const { currentAccount, isDemo, reloadAccounts, telemetry, isLoadingAnalytics, analyticsError, loadAnalytics } =
    useDashboard();
  const storageRows = telemetry.storageRows ?? 0;

  const [billing, setBilling] = useState<Awaited<ReturnType<typeof api.billing.get>> | null>(null);
  const [billingError, setBillingError] = useState<string | null>(null);
  const [upiPlan, setUpiPlan] = useState<"pro" | "studio">("pro");
  const [utr, setUtr] = useState("");
  const [upiState, setUpiState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [upiMessage, setUpiMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [connectMessage, setConnectMessage] = useState<string | null>(null);

  const loadBilling = useCallback(async () => {
    if (isDemo) return;
    try {
      setBilling(await api.billing.get());
    } catch {
      setBillingError("Billing is unreachable right now.");
    }
  }, [isDemo]);

  useEffect(() => {
    loadBilling();
  }, [loadBilling]);

  // Storage meter reads engine telemetry — same source as Home / Insights.
  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  // billing is null in demo mode, so this falls through to currentAccount —
  // which carries the demo tier-preview override.
  const plan = billing?.plan || currentAccount?.plan || "free";
  const credits = billing?.aiCreditsRemaining ?? currentAccount?.aiCreditsRemaining ?? 0;
  const metaAppId = import.meta.env.VITE_META_APP_ID;

  const connectInstagram = () => {
    setConnectMessage(null);
    if (!metaAppId) {
      setConnectMessage(
        "Meta OAuth is configured at deploy time (VITE_META_APP_ID). See DEPLOYMENT_GUIDE.md."
      );
      return;
    }
    setConnecting(true);
    const init = () => {
      window.FB?.init({
        appId: metaAppId,
        cookie: true,
        xfbml: false,
        version: "v21.0",
      });
      window.FB?.login(async (response) => {
        const accessToken = response.authResponse?.accessToken;
        if (!accessToken) {
          setConnecting(false);
          setConnectMessage("Facebook login was cancelled.");
          return;
        }
        try {
          await apiRequestCallback(accessToken);
        } catch (err) {
          setConnecting(false);
          setConnectMessage(err instanceof Error ? err.message : "Connection failed.");
        }
      }, { scope: "pages_show_list,pages_read_engagement,instagram_business_basic,instagram_business_manage_messages,instagram_business_manage_comments" });
    };
    if (window.FB) {
      init();
    } else {
      const script = document.createElement("script");
      script.src = "https://connect.facebook.net/en_US/sdk.js";
      script.async = true;
      script.onload = init;
      script.onerror = () => {
        setConnecting(false);
        setConnectMessage("Couldn't load the Facebook SDK. Check your connection.");
      };
      document.body.appendChild(script);
    }
  };

  const apiRequestCallback = async (accessToken: string) => {
    try {
      await api.accounts.connectMeta(accessToken);
      setConnecting(false);
      setConnectMessage("Instagram connected — welcome aboard!");
      await reloadAccounts();
    } catch (err) {
      setConnecting(false);
      throw err;
    }
  };

  const copyUpi = async () => {
    if (!billing?.checkout.upiId) return;
    try {
      await navigator.clipboard.writeText(billing.checkout.upiId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard unavailable — the id is visible for manual copy
    }
  };

  const submitUpi = async () => {
    setUpiState("sending");
    setUpiMessage(null);
    try {
      const res = await api.billing.submitManualUpi(upiPlan, utr.trim());
      setUpiState("done");
      setUpiMessage(res.message);
      setUtr("");
      loadBilling();
    } catch (err) {
      setUpiState("error");
      setUpiMessage(err instanceof Error ? err.message : "Submission failed.");
    }
  };

  const disconnect = async () => {
    if (!currentAccount) return;
    const ok = window.confirm(
      `Disconnect @${currentAccount.username}? Automations and leads stay saved, but the engine goes quiet until you reconnect.`
    );
    if (!ok) return;
    await api.accounts.disconnect(currentAccount.id);
    await reloadAccounts();
  };

  const tokenDays = currentAccount?.daysUntilExpiration ?? 0;
  const tokenPct = Math.min(100, Math.max(3, Math.round((tokenDays / 60) * 100)));

  return (
    <div className="pg-page set-page">
      <div className="pg-head">
        <div>
          <span className="hm-eyebrow">Settings</span>
          <h1 className="hm-title">
            Your studio,
            <br />
            <em>your controls.</em>
          </h1>
        </div>
      </div>

      {/* ── Connection ── */}
      <section className="set-section" id="connection">
        <h2 className="set-section__title">
          <Instagram size={15} aria-hidden /> Instagram connection
        </h2>
        {currentAccount ? (
          <div className="st-card set-card">
            <div className="set-conn">
              <span className="sh-account__avatar sh-account__avatar--lg">
                <Instagram size={16} aria-hidden />
              </span>
              <div className="set-conn__meta">
                <b>@{currentAccount.username}</b>
                <span>
                  {currentAccount.isActive ? "Connected" : "Inactive"} · {tokenDays} days of token left
                </span>
                <div className="set-conn__meter" aria-hidden>
                  <i style={{ width: `${tokenPct}%` }} />
                </div>
              </div>
              <BadgeCheck size={18} className="set-conn__ok" aria-hidden />
            </div>
            <p className="set-note">
              Tokens expire after ~60 days. RELO marks the account inactive when Meta reports an
              expired token — reconnect to resume delivery without losing any data.
            </p>
            <div className="set-actions">
              <button
                type="button"
                className="sh-btn sh-btn--ghost sh-btn--sm"
                onClick={connectInstagram}
                disabled={connecting}
              >
                {connecting ? (
                  <Loader2 size={14} style={{ animation: "spin 1.2s linear infinite" }} aria-hidden />
                ) : (
                  <RefreshCw size={14} aria-hidden />
                )}
                Reconnect via Meta
              </button>
            </div>
            {connectMessage && (
              <div className="set-msg" role="status">
                {connectMessage}
              </div>
            )}
          </div>
        ) : (
          <div className="st-card set-card">
            <div className="set-conn">
              <span className="sh-account__avatar sh-account__avatar--lg">
                <Instagram size={16} aria-hidden />
              </span>
              <div className="set-conn__meta">
                <b>No Instagram connected</b>
                <span>Link a Professional account to start automating.</span>
              </div>
            </div>
            <div className="set-actions">
              <button
                type="button"
                className="sh-btn sh-btn--accent sh-btn--sm"
                onClick={connectInstagram}
                disabled={connecting}
              >
                {connecting ? (
                  <Loader2 size={14} style={{ animation: "spin 1.2s linear infinite" }} aria-hidden />
                ) : (
                  <Instagram size={14} aria-hidden />
                )}
                Connect via Meta
              </button>
            </div>
            {connectMessage && (
              <div className="set-msg" role="status">
                {connectMessage}
              </div>
            )}
          </div>
        )}
      </section>

      {/* ── Billing ── */}
      <section className="set-section" id="billing">
        <h2 className="set-section__title">
          <CreditCard size={15} aria-hidden /> Plan &amp; billing
        </h2>
        {billingError && (
          <div className="sh-alert" role="alert" style={{ marginBottom: 14 }}>
            <AlertCircle size={16} aria-hidden />
            <span>{billingError}</span>
          </div>
        )}

        <div className="st-card set-card">
          <div className="set-planrow">
            <div>
              <b className="set-planrow__name">{plan === "free" ? "Free forever" : plan === "pro" ? "Pro" : "Studio"}</b>
              <span>{credits} AI credits remaining this cycle</span>
            </div>
            <span className="st-chip st-chip--email">{plan}</span>
          </div>

          {plan === "free" && !isDemo && (
            <>
              <div className="set-upgrades">
                {(["pro", "studio"] as const).map((tier) => (
                  <div className="set-upgrade" key={tier}>
                    <div className="set-upgrade__head">
                      <b>{tier === "pro" ? "Pro" : "Studio"}</b>
                      <span>
                        ₹{TIER_PRICES[tier].inr}/mo
                      </span>
                    </div>
                    <ul>
                      {tier === "pro" ? (
                        <>
                          <li><Check size={12} /> Unlimited reels</li>
                          <li><Check size={12} /> 3–8 spintax variations</li>
                          <li><Check size={12} /> Follow-ups + campaigns</li>
                          <li><Check size={12} /> {TIER_PRICES.pro.credits} AI credits</li>
                          <li><Check size={12} /> No RELO branding</li>
                        </>
                      ) : (
                        <>
                          <li><Check size={12} /> Everything in Pro</li>
                          <li><Check size={12} /> Canvas node builder</li>
                          <li><Check size={12} /> 3 IG accounts</li>
                          <li><Check size={12} /> {TIER_PRICES.studio.credits} AI credits</li>
                          <li><Check size={12} /> Priority queue</li>
                        </>
                      )}
                    </ul>
                    <button
                      type="button"
                      className={`sh-btn sh-btn--sm ${tier === "pro" ? "sh-btn--accent" : "sh-btn--ghost"}`}
                      onClick={() => setUpiPlan(tier)}
                    >
                      Choose {tier === "pro" ? "Pro" : "Studio"}
                    </button>
                  </div>
                ))}
              </div>

              {/* Manual UPI (India) */}
              <div className="set-upi">
                <h4>
                  <Smartphone size={13} aria-hidden /> Pay via UPI (India)
                </h4>
                {billing?.checkout.upiId ? (
                  <>
                    <p className="set-note">
                      Send ₹{TIER_PRICES[upiPlan].inr} to the UPI ID below, then paste the
                      transaction reference (UTR). Verification usually completes within a few
                      hours.
                    </p>
                    <button type="button" className="set-upi__id" onClick={copyUpi} title="Copy UPI ID">
                      {billing.checkout.upiId}
                      {copied ? <Check size={13} /> : <Copy size={13} />}
                    </button>
                    <div className="set-upi__form">
                      <div className="set-upi__plans">
                        {(["pro", "studio"] as const).map((t) => (
                          <button
                            key={t}
                            type="button"
                            className={`set-upi__plan${upiPlan === t ? " is-on" : ""}`}
                            aria-pressed={upiPlan === t}
                            onClick={() => setUpiPlan(t)}
                          >
                            {t === "pro" ? "Pro ₹149" : "Studio ₹399"}
                          </button>
                        ))}
                      </div>
                      <input
                        className="st-input"
                        placeholder="UPI transaction reference (UTR)"
                        value={utr}
                        onChange={(e) => setUtr(e.target.value)}
                        aria-label="UPI transaction reference"
                      />
                      <button
                        type="button"
                        className="sh-btn sh-btn--primary sh-btn--sm"
                        onClick={submitUpi}
                        disabled={upiState === "sending" || utr.trim().length < 8}
                      >
                        {upiState === "sending" ? (
                          <Loader2 size={13} style={{ animation: "spin 1.2s linear infinite" }} aria-hidden />
                        ) : (
                          <ShieldCheck size={13} aria-hidden />
                        )}
                        Submit for verification
                      </button>
                    </div>
                    {upiMessage && (
                      <div className={`set-msg${upiState === "error" ? " set-msg--error" : ""}`} role="status">
                        {upiMessage}
                      </div>
                    )}
                  </>
                ) : (
                  <p className="set-note">
                    UPI payments are configured at deploy time (<code>MANUAL_UPI_ID</code> secret).
                    Global card checkout:{" "}
                    {billing?.checkout.lemonSqueezyUrl ? (
                      <a href={billing.checkout.lemonSqueezyUrl} target="_blank" rel="noreferrer">
                        pay with card →
                      </a>
                    ) : (
                      "Lemon Squeezy link set at deploy time."
                    )}
                  </p>
                )}
              </div>
            </>
          )}

          {/* payment history */}
          {!isDemo && billing && billing.payments.length > 0 && (
            <div className="set-history">
              <h4>Payment history</h4>
              {billing.payments.map((p) => (
                <div className="set-history__row" key={p.id}>
                  <span>
                    {p.plan} · {p.provider === "manual_upi" ? "UPI" : "Card"}
                    {p.utr ? ` · ${p.utr}` : ""}
                  </span>
                  <b className={p.status === "verified" ? "is-ok" : ""}>{p.status}</b>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Preferences ── */}
      <section className="set-section">
        <h2 className="set-section__title">
          <Sparkles size={15} aria-hidden /> Appearance
        </h2>
        <div className="st-card set-card set-prefs">
          <div>
            <b>Theme</b>
            <span>Follows your system by default — override it any time.</span>
          </div>
          <ThemeToggle />
        </div>
      </section>

      {/* ── Storage & retention ── */}
      <section className="set-section">
        <h2 className="set-section__title">
          <Database size={15} aria-hidden /> Data &amp; retention
        </h2>
        <div className="st-card set-card set-storage">
          <div className="set-storage__head">
            <div>
              <b>Stored rows</b>
              <span>Everything the engine keeps for this account.</span>
            </div>
            <strong>
              {isLoadingAnalytics && storageRows === 0 ? "—" : storageRows.toLocaleString("en-US")}
            </strong>
          </div>
          {analyticsError ? (
            <p className="set-note set-msg set-msg--error" role="status">
              {analyticsError}
            </p>
          ) : (
            <div className="set-storage__rows">
              <div className="set-stat">
                <span>Queue depth</span>
                <b>{isLoadingAnalytics ? "—" : telemetry.queueDepth}</b>
              </div>
              <div className="set-stat">
                <span>Pending jobs</span>
                <b>{isLoadingAnalytics ? "—" : telemetry.pendingJobs}</b>
              </div>
              <div className="set-stat">
                <span>Completed · 24h</span>
                <b>{isLoadingAnalytics ? "—" : telemetry.completed24h}</b>
              </div>
            </div>
          )}
          <p className="set-note">
            Comment text is cleared 72h after matching, finished jobs after 30 days, webhook logs
            after 7 — the hourly purge keeps this flat. Commenter identities are kept, so your leads
            never disappear.
          </p>
        </div>
      </section>

      {/* ── Referrals (plan.md §7) ── */}
      {!isDemo && <ReferralCard />}

      {/* ── Danger zone ── */}
      {currentAccount && !isDemo && (
        <section className="set-section">
          <h2 className="set-section__title set-section__title--danger">
            <AlertCircle size={15} aria-hidden /> Danger zone
          </h2>
          <div className="st-card set-card set-danger">
            <div>
              <b>Disconnect @{currentAccount.username}</b>
              <span>
                Automations pause and the engine goes quiet. Your leads and settings stay saved.
              </span>
            </div>
            <button type="button" className="sh-btn sh-btn--ghost sh-btn--sm set-danger__btn" onClick={disconnect}>
              <LogOut size={13} aria-hidden /> Disconnect
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

/**
 * Referral program (plan.md §7). One free month of Pro per person who signs up
 * AND pays — the reward is deliberately tied to the referred person's first
 * paid activation, so neither spam nor a churned free signup is worth anything.
 */
function ReferralCard() {
  const [summary, setSummary] = useState<Awaited<ReturnType<typeof api.referrals.get>>["referral"] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api.referrals
      .get()
      .then(({ referral }) => {
        if (!cancelled) setSummary(referral);
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't load your referral code.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const copy = async () => {
    if (!summary) return;
    try {
      await navigator.clipboard.writeText(summary.shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Couldn't copy — select the link and copy it manually.");
    }
  };

  return (
    <section className="set-section">
      <h2 className="set-section__title">
        <Share2 size={15} aria-hidden /> Referrals
      </h2>
      <div className="st-card set-card set-storage">
        {error ? (
          <p className="set-note set-msg set-msg--error" role="status">
            {error}
          </p>
        ) : !summary ? (
          <p className="set-note">
            <Loader2 size={12} className="prd-spin" aria-hidden /> Loading your referral link…
          </p>
        ) : (
          <>
            <div className="set-storage__head">
              <div>
                <b>Give a month, get a month</b>
                <span>
                  Every friend who signs up and upgrades adds a free month of Pro to your account.
                </span>
              </div>
              <strong>{summary.rewardMonthsEarned}</strong>
            </div>
            <div className="set-stat-row">
              <div className="set-stat">
                <span>Invited</span>
                <b>{summary.referredCount}</b>
              </div>
              <div className="set-stat">
                <span>Upgraded</span>
                <b>{summary.qualifiedCount}</b>
              </div>
              <div className="set-stat">
                <span>Months earned</span>
                <b>{summary.rewardMonthsEarned}</b>
              </div>
            </div>
            <div className="set-ref-link">
              <input className="st-input" readOnly value={summary.shareUrl} aria-label="Your referral link" />
              <button type="button" className="sh-btn sh-btn--ghost sh-btn--sm" onClick={copy}>
                {copied ? <Check size={13} aria-hidden /> : <Copy size={13} aria-hidden />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <p className="set-note">
              Rewards land once your friend completes their first paid upgrade — not at signup. Your
              code is <b>{summary.code}</b>.
            </p>
          </>
        )}
      </div>
    </section>
  );
}
