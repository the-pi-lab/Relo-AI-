"use client";

import React, { useEffect, useRef, useState } from "react";
import { Logo, RButton, FieldLabel } from "./chrome";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { toast } from "sonner";

const DEMO_CODE = "482913";

export function LoginPage({
  navigate,
  onAuth,
}: {
  navigate: (to: string) => void;
  onAuth: (email: string, demo?: boolean) => void;
}) {
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const sendCode = () => {
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    if (!valid) {
      toast.error("That email looks off. Try again.");
      emailRef.current?.focus();
      return;
    }
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setStep("otp");
      setResendIn(30);
      setCode("");
      toast.success("Code sent", {
        description: `Demo inbox — your code is ${DEMO_CODE}`,
        duration: 8000,
      });
    }, 900);
  };

  const verify = (value: string) => {
    if (value.length !== 6) return;
    setVerifying(true);
    setTimeout(() => {
      if (value === DEMO_CODE) {
        toast.success("Welcome back.");
        onAuth(email.trim());
        navigate("/studio");
      } else {
        setVerifying(false);
        setCode("");
        toast.error("Wrong code.", { description: "The demo code is 6 digits." });
      }
    }, 800);
  };

  const demoMode = () => {
    onAuth("demo@relo.app", true);
    navigate("/studio");
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.1fr]">
      {/* left panel — quiet, no decoration */}
      <div className="relative hidden flex-col justify-between overflow-hidden px-10 py-12 text-surface lg:flex">
        <Logo onClick={() => navigate("/")} />
        <div className="mt-12 max-w-md">
          <h2 className="h2 text-text">Every comment answered overnight.</h2>
          <p className="mt-4 text-sm text-text-2 leading-relaxed">
            While you were asleep, RELO replied to your Reel comments and sent a
            3-button DM to each one. You were offline. RELO was not.
          </p>
        </div>
        <p className="mt-auto text-xs text-text-3 uppercase tracking-wider">
          &copy; 2026 The π Lab · comments in, customers out
        </p>
      </div>

      {/* right form panel */}
      <div className="relative flex flex-col items-center justify-center overflow-y-auto px-4 py-10 sm:px-6">
        <div className="relative w-full max-w-md">
          <div className="mb-6 flex items-center justify-between lg:hidden">
            <Logo onClick={() => navigate("/")} />
          </div>

          <div className="rounded-xl border border-border bg-surface p-6 sm:p-8 shadow-lg">
            {step === "email" ? (
              <div>
                <FieldLabel label="Email" hint="Any valid email works in the demo." />
                <form onSubmit={(e) => { e.preventDefault(); sendCode(); }}>
                  <input
                    id="relo-email"
                    ref={emailRef}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@studio.in"
                    autoComplete="email"
                    autoFocus
                    className="mt-2 h-10 w-full rounded-md border border-input bg-surface-2 px-3.5 py-2.5 text-sm focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors"
                  />
                  <RButton type="submit" className="mt-5 w-full" size="lg" disabled={sending}>
                    {sending ? "Sending…" : "Send my code"}
                  </RButton>
                </form>
                <div className="my-6 flex items-center gap-2">
                  <span className="h-[1px] flex-1 bg-border" />
                  <span className="text-xs text-text-3 uppercase tracking-wider">or</span>
                  <span className="h-[1px] flex-1 bg-border" />
                </div>
                <RButton variant="ghost" className="w-full" size="lg" onClick={demoMode}>
                  Just looking? Tour the studio
                </RButton>
              </div>
            ) : (
              <div>
                <button
                  onClick={() => setStep("email")}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-text-3 hover:text-text"
                >
                  <svg className="size-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                  Wrong email?
                </button>
                <div className="mt-6 grid size-12 place-items-center rounded-md bg-accent-wash text-accent font-black text-sm">
                  @
                </div>
                <h2 className="h2 mt-4 text-text">Check your inbox.</h2>
                <p className="mt-2.5 text-sm text-text-2">
                  Sent to <span className="font-semibold text-text">{email}</span>
                </p>

                <div className="mt-8 flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={code}
                    aria-label="6-digit verification code"
                    onChange={(v) => {
                      setCode(v);
                      verify(v);
                    }}
                    disabled={verifying}
                  >
                    <InputOTPGroup className="gap-2">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <InputOTPSlot
                          key={i}
                          index={i}
                          className="h-11 w-10 rounded-md border-border bg-surface-2 font-mono text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent data-[filled=true]:border-accent data-[filled=true]:bg-accent-wash"
                        />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                <div aria-live="polite" className="mt-6 flex items-center justify-center gap-2 text-sm text-text-3">
                  {verifying ? (
                    <span>Unlocking the studio…</span>
                  ) : (
                    <>
                      Did not get it?{" "}
                      {resendIn > 0 ? (
                        <span>resend in {resendIn}s</span>
                      ) : (
                        <button onClick={sendCode} className="font-semibold text-accent hover:text-accent-hover">
                          Resend
                        </button>
                      )}
                    </>
                  )}
                </div>
                <p className="mt-4 text-center text-xs text-text-3">
                  Demo inbox · code {DEMO_CODE}
                </p>
              </div>
            )}
          </div>

          <div className="mt-6 flex items-center justify-center gap-5 text-xs text-text-3 uppercase tracking-wider">
            <span className="inline-flex items-center gap-1">10-minute expiry · 5 attempts</span>
            <a onClick={() => navigate("/")} className="text-text hover:text-accent transition-colors">
              ← back home
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
