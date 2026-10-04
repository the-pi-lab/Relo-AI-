import React, { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router";
import { ArrowRight, CheckCircle2, KeyRound, Mail, ShieldCheck, Sparkles, AlertCircle, RefreshCw } from "lucide-react";
import { api } from "@/lib/api";
import { useSeo } from "@/lib/seo";
import "./studio.css";

const EMAIL_PATTERN = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/;

/** Only allow local, non-protocol-relative paths — blocks open redirects. */
function sanitizeRedirect(raw: string | null): string {
  return raw && /^\/(?!\/)/.test(raw) ? raw : "/dashboard";
}

export default function Login() {
  const navigate = useNavigate();
  useSeo({
    title: "Sign in — RELO",
    description: "Sign in to RELO to connect your Instagram and automate Reel comments into DMs.",
    path: "/login",
    index: false,
  });
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"EMAIL" | "OTP">("EMAIL");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugCode, setDebugCode] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);
  const resendTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (resendTimer.current) window.clearInterval(resendTimer.current);
    };
  }, []);

  const startResendCooldown = () => {
    setResendIn(45);
    if (resendTimer.current) window.clearInterval(resendTimer.current);
    resendTimer.current = window.setInterval(() => {
      setResendIn((s) => {
        if (s <= 1 && resendTimer.current) window.clearInterval(resendTimer.current);
        return Math.max(0, s - 1);
      });
    }, 1000);
  };

  const submitSendOtp = async () => {
    setError(null);
    setIsLoading(true);

    try {
      const res = await api.auth.sendOtp(email.trim());
      if (import.meta.env.DEV && res.debugCode) {
        setDebugCode(res.debugCode);
        setCode(res.debugCode);
      }
      startResendCooldown();
      setStep("OTP");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to send verification code. Please try again.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !EMAIL_PATTERN.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }
    await submitSendOtp();
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || code.trim().length !== 6) {
      setError("Please enter the 6-digit verification code.");
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      await api.auth.verifyOtp(email.trim(), code.trim());

      // Referral claim (plan.md §7): ?ref=CODE is carried through the OTP flow.
      // Best-effort — a failed claim must never block someone's sign-in, and the
      // server is idempotent, so a retry on the next visit is harmless.
      const refCode = new URLSearchParams(window.location.search).get("ref");
      if (refCode) {
        try {
          await api.referrals.claim(refCode);
        } catch {
          /* referral code not claimed — the signup still succeeded */
        }
      }

      const searchParams = new URLSearchParams(window.location.search);
      navigate(sanitizeRedirect(searchParams.get("redirect")), { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Invalid or expired verification code. Please request a new one.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="studio" style={{ justifyContent: "center", padding: "48px 16px" }}>
      <div className="studio__panel" style={{ width: "100%", maxWidth: 440, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 26 }}>
          <Link to="/" className="studio__logo" style={{ justifyContent: "center", display: "inline-flex" }}>
            <span className="studio__mark">R.</span>
            <span className="studio__name" style={{ textAlign: "left" }}>
              RELO
              <small>Creator Studio</small>
            </span>
          </Link>
          <h1
            style={{
              marginTop: 26,
              fontWeight: 900,
              fontSize: 28,
              letterSpacing: "-0.025em",
              lineHeight: 1.1,
            }}
          >
            {step === "EMAIL" ? (
              <>
                Sign in.
                <br />
                <span style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 300 }}>
                  no passwords, no rent.
                </span>
              </>
            ) : (
              "Check your inbox."
            )}
          </h1>
          <p style={{ marginTop: 8, fontSize: 13, fontWeight: 600, color: "var(--text-soft)" }}>
            {step === "EMAIL"
              ? "Passwordless access for verified creators."
              : `We sent a 6-digit code to ${email}`}
          </p>
        </div>

        <div className="st-card" style={{ padding: "30px 28px", borderRadius: 22 }}>
          {error && (
            <div className="st-alert" role="alert" style={{ marginBottom: 20 }}>
              <AlertCircle aria-hidden />
              <span>{error}</span>
            </div>
          )}

          {debugCode && (
            <div
              className="st-alert"
              style={{
                marginBottom: 20,
                background: "var(--surface-2)",
                borderColor: "var(--border-strong)",
                fontFamily: "var(--font-display)",
                fontStyle: "italic",
              }}
            >
              <span style={{ flex: 1, fontWeight: 700 }}>Dev OTP</span>
              <strong style={{ fontSize: 15, letterSpacing: "0.3em" }}>{debugCode}</strong>
            </div>
          )}

          {step === "EMAIL" ? (
            <form onSubmit={handleSendOtp} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div>
                <label htmlFor="creator-email" className="st-label">
                  Creator email
                </label>
                <div style={{ position: "relative" }}>
                  <Mail
                    style={{
                      width: 15,
                      height: 15,
                      position: "absolute",
                      left: 14,
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "var(--text-faint)",
                    }}
                    aria-hidden
                  />
                  <input
                    id="creator-email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="creator@yourbrand.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="st-input"
                    style={{ paddingLeft: 40 }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="st-btn st-btn--accent st-btn--sheen"
                style={{ width: "100%" }}
              >
                {isLoading ? (
                  <RefreshCw style={{ animation: "spin 1.2s linear infinite" }} aria-hidden />
                ) : (
                  <>
                    Send login code <ArrowRight size={15} aria-hidden />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div>
                <label htmlFor="otp-code" className="st-label">
                  6-digit code
                </label>
                <div style={{ position: "relative" }}>
                  <KeyRound
                    style={{
                      width: 15,
                      height: 15,
                      position: "absolute",
                      left: 14,
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "var(--text-faint)",
                    }}
                    aria-hidden
                  />
                  <input
                    id="otp-code"
                    type="text"
                    required
                    autoComplete="one-time-code"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="······"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                    className="st-input"
                    style={{
                      paddingLeft: 40,
                      textAlign: "center",
                      fontSize: 20,
                      letterSpacing: "0.5em",
                      fontWeight: 800,
                      fontFamily: "var(--font-display)",
                    }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || code.length !== 6}
                className="st-btn st-btn--primary st-btn--sheen"
                style={{ width: "100%" }}
              >
                {isLoading ? (
                  <RefreshCw style={{ animation: "spin 1.2s linear infinite" }} aria-hidden />
                ) : (
                  <>
                    Verify & enter studio <CheckCircle2 size={15} aria-hidden />
                  </>
                )}
              </button>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setStep("EMAIL");
                    setCode("");
                    setError(null);
                  }}
                  style={{ border: 0, background: "none", color: "var(--text-soft)", fontWeight: 700 }}
                >
                  ← Different email
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (resendIn > 0 || isLoading) return;
                    submitSendOtp();
                  }}
                  disabled={isLoading || resendIn > 0}
                  style={{
                    border: 0,
                    background: "none",
                    color: "var(--accent-ink)",
                    fontWeight: 800,
                    opacity: resendIn > 0 ? 0.5 : 1,
                    cursor: resendIn > 0 ? "not-allowed" : "pointer",
                  }}
                >
                  {resendIn > 0 ? `Resend in ${resendIn}s` : "Resend code"}
                </button>
              </div>
            </form>
          )}

          <div
            style={{
              marginTop: 24,
              paddingTop: 18,
              borderTop: "1.5px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 7,
              fontSize: 11.5,
              fontWeight: 700,
              color: "var(--text-faint)",
              textAlign: "center",
            }}
          >
            <ShieldCheck size={14} color="var(--success)" aria-hidden />
            Zero passwords · AES-256-GCM token vault
          </div>
        </div>

        <p
          style={{
            textAlign: "center",
            marginTop: 18,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "var(--text-faint)",
          }}
        >
          <Sparkles size={11} style={{ verticalAlign: -1, color: "var(--accent-ink)" }} aria-hidden />{" "}
          Comments in — customers out
        </p>
      </div>
    </div>
  );
}
