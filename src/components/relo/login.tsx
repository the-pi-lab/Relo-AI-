"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button, Field, Logo, inputClass } from "./chrome";
import { BrandAurora, LiquidBackdrop } from "./ambient";
import { Turnstile } from "./turnstile";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { ThemeToggle } from "@/lib/relo/theme";
import { useRelo } from "@/lib/relo/store";
import * as api from "@/lib/relo/api";
import { TURNSTILE_SITE_KEY } from "@/lib/relo/config";
import { cn } from "@/lib/utils";

const ASSURANCES = [
  "Runs on Instagram's official API",
  "Page access tokens encrypted at rest",
  "Disconnecting deletes the stored token",
];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LoginPage({ navigate }: { navigate: (to: string) => void }) {
  const { completeSignIn, status } = useRelo();

  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaKey, setCaptchaKey] = useState(0);
  const [captchaFailed, setCaptchaFailed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [debugCode, setDebugCode] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (status === "signed-in") navigate("/studio");
  }, [status, navigate]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = window.setTimeout(() => setResendIn((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [resendIn]);

  const resetCaptcha = () => {
    setCaptchaToken("");
    setCaptchaKey((key) => key + 1);
  };

  const requireCaptcha = (): boolean => {
    if (!TURNSTILE_SITE_KEY) return true;
    if (captchaToken) return true;
    setError(
      captchaFailed
        ? "The verification check could not load. Refresh the page and try again."
        : "Complete the verification check first."
    );
    return false;
  };

  const sendCode = async () => {
    const address = email.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(address)) {
      setError("Enter a valid email address.");
      emailRef.current?.focus();
      return;
    }
    if (!requireCaptcha() || sending) return;

    setSending(true);
    setError(null);
    setNotice(null);
    try {
      const result = await api.sendOtp(address, captchaToken || undefined);
      setEmail(address);
      setStep("code");
      setCode("");
      setResendIn(30);
      setNotice(`We sent a six-digit code to ${address}.`);
      setDebugCode(result.debugCode ?? null);
      toast.success("Code sent", { description: `Check ${address}.` });
    } catch (caught) {
      const apiError = caught instanceof api.ApiError ? caught : null;
      const retryAfter = apiError?.retryAfterSeconds;
      if (retryAfter && retryAfter > 0) {
        setResendIn(retryAfter);
        setError(`A code was just sent. You can resend in ${retryAfter}s.`);
      } else {
        setError(api.errorMessage(caught));
      }
      resetCaptcha();
    } finally {
      setSending(false);
    }
  };

  const verify = async (value: string) => {
    if (value.length !== 6 || verifying) return;
    if (!requireCaptcha()) {
      setCode("");
      return;
    }
    setVerifying(true);
    setError(null);
    try {
      const result = await api.verifyOtp(email, value, captchaToken || undefined);
      completeSignIn(result.user);
      toast.success("Signed in");
      navigate("/studio");
    } catch (caught) {
      setError(api.errorMessage(caught));
      setCode("");
      setVerifying(false);
      resetCaptcha();
    }
  };

  const captchaConfigured = Boolean(TURNSTILE_SITE_KEY);

  return (
    <div className="relative isolate grid min-h-screen overflow-hidden lg:grid-cols-[1.05fr_1fr]">
      <LiquidBackdrop variant="page" />

      {/* The argument, on the brand's navy surface, so the form reads as
          the only place to act. */}
      <aside className="relative z-10 hidden flex-col justify-between overflow-hidden bg-brand p-12 text-brand-ink lg:flex">
        <BrandAurora />
        <div
          aria-hidden
          className="absolute inset-0 bg-[linear-gradient(180deg,rgb(16_5_32/0.14)_0%,transparent_40%,rgb(16_5_32/0.5)_100%)]"
        />

        <div className="relative z-10 flex h-full flex-col justify-between">
          <Logo
            size="lg"
            onClick={() => navigate("/")}
            className="[&_span:first-child]:bg-brand-ink [&_span:first-child]:text-brand [&_span:last-child]:text-brand-ink"
          />

          <div className="max-w-md">
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-brand-ink/55">
              Comment to DM
            </p>
            <h2 className="mt-4 text-[2.1rem] font-[720] leading-[1.06] tracking-[-0.035em]">
              Someone comments while you sleep. They still get the link.
            </h2>
            <p className="mt-5 text-[15px] leading-relaxed text-brand-ink/72">
              RELO answers the comment in public, then sends one private reply
              with up to three buttons. Every person who taps through lands in
              your lead list with the Reel that brought them in.
            </p>

            <ul className="mt-9 divide-y divide-brand-ink/15 border-t border-brand-ink/15">
              {ASSURANCES.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-3 py-3.5 text-[13.5px] text-brand-ink/78"
                >
                  <span
                    aria-hidden
                    className="size-1.5 shrink-0 rounded-full bg-brand-ink/60"
                  />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-brand-ink/45">
            &copy; 2026 The Pi Lab
          </p>
        </div>
      </aside>

      <div className="relative z-10 flex flex-col">
        <div className="flex items-center justify-between p-5 sm:p-6">
          <Logo onClick={() => navigate("/")} className="lg:invisible" />
          <ThemeToggle />
        </div>

        <div className="flex flex-1 items-center justify-center px-5 pb-16 sm:px-6">
          <div className="glass-panel view-enter w-full max-w-[430px] rounded-[26px] p-6 sm:p-8">
            {step === "email" ? (
              <>
                <h1 className="h2 text-ink">Sign in</h1>
                <p className="mt-2.5 text-[14px] leading-relaxed text-ink-2">
                  We email you a six-digit code. No password to remember.
                </p>

                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    void sendCode();
                  }}
                  className="mt-7 space-y-5"
                >
                  <Field label="Email" htmlFor="relo-email">
                    <input
                      id="relo-email"
                      ref={emailRef}
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="you@studio.in"
                      autoComplete="email"
                      autoFocus
                      className={cn(inputClass, "h-11")}
                      aria-invalid={Boolean(error) || undefined}
                    />
                  </Field>

                  {captchaConfigured && (
                    <Turnstile
                      siteKey={TURNSTILE_SITE_KEY}
                      resetKey={captchaKey}
                      onToken={setCaptchaToken}
                      onError={() => setCaptchaFailed(true)}
                    />
                  )}

                  {error && (
                    <p
                      role="alert"
                      className="rounded-lg border border-bad/30 bg-bad-wash px-3 py-2.5 text-[13px] text-bad"
                    >
                      {error}
                    </p>
                  )}

                  <Button
                    type="submit"
                    variant="signal"
                    size="lg"
                    className="w-full"
                    disabled={sending}
                  >
                    {sending ? (
                      <>
                        <Loader2 className="size-4 animate-spin" aria-hidden />
                        Sending
                      </>
                    ) : (
                      <>
                        Email me a code
                        <ArrowRight className="size-4" aria-hidden />
                      </>
                    )}
                  </Button>
                </form>

                <p className="mt-5 text-[12.5px] leading-relaxed text-ink-3">
                  By signing in you agree to the{" "}
                  <button
                    type="button"
                    onClick={() => navigate("/terms")}
                    className="font-semibold text-ink-2 underline decoration-line-strong underline-offset-2 hover:text-ink"
                  >
                    terms
                  </button>{" "}
                  and{" "}
                  <button
                    type="button"
                    onClick={() => navigate("/privacy")}
                    className="font-semibold text-ink-2 underline decoration-line-strong underline-offset-2 hover:text-ink"
                  >
                    privacy policy
                  </button>
                  .
                </p>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setStep("email");
                    setError(null);
                    setNotice(null);
                    setCode("");
                  }}
                  className="inline-flex items-center gap-2 text-[13.5px] font-semibold text-ink-2 transition-colors hover:text-ink"
                >
                  <ArrowLeft className="size-4" aria-hidden />
                  Use a different address
                </button>

                <h1 className="h2 mt-5 text-ink">Check your inbox</h1>
                <p className="mt-2.5 text-[14px] leading-relaxed text-ink-2">
                  Enter the six-digit code sent to{" "}
                  <span className="font-semibold text-ink">{email}</span>.
                </p>

                <div className="mt-7">
                  <InputOTP
                    maxLength={6}
                    value={code}
                    aria-label="Six digit verification code"
                    onChange={(value) => {
                      setCode(value);
                      if (value.length === 6) void verify(value);
                    }}
                    disabled={verifying}
                  >
                    <InputOTPGroup className="gap-2">
                      {Array.from({ length: 6 }).map((_, index) => (
                        <InputOTPSlot
                          key={index}
                          index={index}
                          className={cn(
                            "h-12 w-11 rounded-lg border border-line-strong bg-surface/55 font-mono text-[15px] text-ink backdrop-blur-md",
                            "transition-[border-color,box-shadow,background-color] duration-150 ease-out",
                            "focus:border-signal focus:bg-surface/80 focus:ring-[3px] focus:ring-signal/18",
                            "data-[filled=true]:border-signal data-[filled=true]:bg-signal-wash"
                          )}
                        />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                {captchaConfigured && (
                  <div className="mt-5">
                    <Turnstile
                      siteKey={TURNSTILE_SITE_KEY}
                      resetKey={captchaKey}
                      onToken={setCaptchaToken}
                      onError={() => setCaptchaFailed(true)}
                    />
                  </div>
                )}

                {error && (
                  <p
                    role="alert"
                    className="mt-4 rounded-lg border border-bad/30 bg-bad-wash px-3 py-2.5 text-[13px] text-bad"
                  >
                    {error}
                  </p>
                )}

                {notice && !error && (
                  <p className="mt-4 text-[13px] text-ink-3" aria-live="polite">
                    {verifying ? "Checking that code…" : notice}
                  </p>
                )}

                <div className="mt-5 flex items-center gap-2 text-[13.5px] text-ink-3">
                  {resendIn > 0 ? (
                    <span>Resend available in {resendIn}s</span>
                  ) : (
                    <>
                      <span>Didn&apos;t arrive?</span>
                      <button
                        type="button"
                        onClick={() => void sendCode()}
                        disabled={sending}
                        className="font-semibold text-signal transition-colors hover:text-signal-hover disabled:opacity-50"
                      >
                        Send it again
                      </button>
                    </>
                  )}
                </div>

                {debugCode && (
                  <p className="mt-6 rounded-lg border border-warn/30 bg-warn-wash px-3.5 py-3 font-mono text-[12px] text-warn">
                    Development code: {debugCode}
                  </p>
                )}

                {verifying && (
                  <p className="mt-4 inline-flex items-center gap-2 text-[13px] text-ink-3">
                    <Loader2 className="size-3.5 animate-spin" aria-hidden />
                    Signing you in
                  </p>
                )}
              </>
            )}

            <div className="mt-7 border-t border-line pt-4">
              <button
                type="button"
                onClick={() => navigate("/")}
                className="text-[13px] text-ink-3 transition-colors hover:text-ink"
              >
                Back to the homepage
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
