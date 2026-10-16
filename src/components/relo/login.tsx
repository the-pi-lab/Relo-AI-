"use client";

import React, { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button, Field, Logo, inputClass } from "./chrome";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { ThemeToggle } from "@/lib/relo/theme";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/* Demo credentials. There is no mail server behind this, so the code is shown
   on screen rather than pretending to be secret. */
const DEMO_CODE = "482913";

const ASSURANCES = [
  "Runs on Instagram's official API",
  "Access tokens encrypted at rest",
  "Disconnect and everything stops",
];

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
    const t = window.setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => window.clearTimeout(t);
  }, [resendIn]);

  const sendCode = () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast.error("That address does not look right.");
      emailRef.current?.focus();
      return;
    }
    setSending(true);
    window.setTimeout(() => {
      setSending(false);
      setStep("otp");
      setResendIn(30);
      setCode("");
      toast.success("Code sent", {
        description: `This is a demo, so the code is ${DEMO_CODE}.`,
        duration: 8000,
      });
    }, 700);
  };

  const verify = (value: string) => {
    if (value.length !== 6) return;
    setVerifying(true);
    window.setTimeout(() => {
      if (value === DEMO_CODE) {
        toast.success("Welcome back.");
        onAuth(email.trim());
        navigate("/studio");
      } else {
        setVerifying(false);
        setCode("");
        toast.error("That code is wrong.");
      }
    }, 650);
  };

  const demo = () => {
    onAuth("demo@relo.app", true);
    navigate("/studio");
  };

  return (
    <div className="grid min-h-screen bg-canvas lg:grid-cols-[1.1fr_1fr]">
      {/* Left: the argument. Inverted so the form panel reads as the only
          place to act. */}
      <div className="hidden flex-col justify-between bg-ink p-12 text-ink-invert lg:flex">
        <Logo
          size="lg"
          onClick={() => navigate("/")}
          className="[&_span:last-child]:text-ink-invert"
        />

        <div className="max-w-md">
          <h2 className="h1">
            Someone comments at 2am. They still get an answer.
          </h2>
          <p className="mt-6 text-[15px] leading-relaxed opacity-70">
            RELO replies in public, then sends a three-button DM with your offer
            inside. It keeps working while you sleep, and every tap lands in your
            lead list with its source attached.
          </p>

          <ul className="mt-10 divide-y divide-current/15 border-t border-current/15">
            {ASSURANCES.map((a) => (
              <li
                key={a}
                className="flex items-center gap-3 py-3.5 text-[13.5px] opacity-80"
              >
                <span className="size-1.5 rounded-full bg-signal" aria-hidden />
                {a}
              </li>
            ))}
          </ul>
        </div>

        <p className="font-mono text-[11px] uppercase tracking-[0.1em] opacity-50">
          &copy; 2026 The Pi Lab
        </p>
      </div>

      {/* Right: the form */}
      <div className="relative flex flex-col">
        <div className="flex items-center justify-between p-5 sm:p-6">
          <Logo onClick={() => navigate("/")} className="lg:invisible" />
          <ThemeToggle />
        </div>

        <div className="flex flex-1 items-center justify-center px-5 pb-16 sm:px-6">
          <div className="w-full max-w-[400px]">
            {step === "email" ? (
              <>
                <h1 className="h2 text-ink">Sign in</h1>
                <p className="mt-3 text-[14px] leading-relaxed text-ink-2">
                  Use any address to explore. No password, no confirmation email.
                </p>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    sendCode();
                  }}
                  className="mt-8"
                >
                  <Field
                    label="Email"
                    htmlFor="relo-email"
                    hint="Demo accepts anything"
                  >
                    <input
                      id="relo-email"
                      ref={emailRef}
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@studio.in"
                      autoComplete="email"
                      autoFocus
                      className={cn(inputClass, "h-11")}
                    />
                  </Field>

                  <Button
                    type="submit"
                    variant="signal"
                    size="lg"
                    className="mt-5 w-full"
                    disabled={sending}
                  >
                    {sending ? "Sending" : "Send my code"}
                    {!sending && <ArrowRight className="size-4" aria-hidden />}
                  </Button>
                </form>

                <div className="my-7 flex items-center gap-3">
                  <span className="h-px flex-1 bg-line" aria-hidden />
                  <span className="caption">or</span>
                  <span className="h-px flex-1 bg-line" aria-hidden />
                </div>

                <Button variant="outline" size="lg" className="w-full" onClick={demo}>
                  Open the demo studio
                </Button>
                <p className="mt-3 text-center text-[12.5px] text-ink-3">
                  The demo opens with automations, leads and analytics already in it.
                </p>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setStep("email")}
                  className="inline-flex items-center gap-2 text-[13.5px] font-semibold text-ink-2 transition-colors hover:text-ink"
                >
                  <ArrowLeft className="size-4" aria-hidden />
                  Different address
                </button>

                <h1 className="h2 mt-6 text-ink">Check your inbox</h1>
                <p className="mt-3 text-[14px] text-ink-2">
                  Six digits sent to{" "}
                  <span className="font-semibold text-ink">{email}</span>
                </p>

                <div className="mt-8">
                  <InputOTP
                    maxLength={6}
                    value={code}
                    aria-label="Six digit verification code"
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
                          className={cn(
                            "h-12 w-11 rounded-md border border-line-strong bg-surface font-mono text-[15px] text-ink",
                            "transition-[border-color,box-shadow] duration-150 ease-out",
                            "focus:border-signal focus:ring-[3px] focus:ring-signal/18",
                            "data-[filled=true]:border-signal data-[filled=true]:bg-signal-wash"
                          )}
                        />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                <div
                  aria-live="polite"
                  className="mt-6 flex items-center gap-2 text-[13.5px] text-ink-3"
                >
                  {verifying ? (
                    <span>Unlocking the studio</span>
                  ) : resendIn > 0 ? (
                    <span>Resend available in {resendIn}s</span>
                  ) : (
                    <>
                      <span>Did not arrive?</span>
                      <button
                        type="button"
                        onClick={sendCode}
                        className="font-semibold text-signal transition-colors hover:text-signal-hover"
                      >
                        Resend it
                      </button>
                    </>
                  )}
                </div>

                <p className="mt-8 rounded-md border border-line bg-surface-2 px-3.5 py-3 font-mono text-[12px] text-ink-2">
                  Demo code {DEMO_CODE} &middot; expires in 10 minutes &middot; 5 attempts
                </p>
              </>
            )}

            <div className="mt-8 border-t border-line pt-5">
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
