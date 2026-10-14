"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, MailOpen, PlayCircle, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Logo, RButton, WordReveal } from "./chrome";
import { AsciiArt, portalScene, RAMPS } from "./ascii";
import { AsciiFrame } from "./ascii";
import { ShaderCanvas, Starfield, DustMotes } from "./world";

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
      toast.error("That email looks off — one more try?");
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
        toast.success("Welcome back to the autopilot");
        onAuth(email.trim());
        navigate("/studio");
      } else {
        setVerifying(false);
        setCode("");
        toast.error("Wrong code", { description: "Check the demo toast — 6 digits." });
      }
    }, 800);
  };

  const demoMode = () => {
    onAuth("demo@relo.app", true);
    navigate("/studio");
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.05fr]">
      {/* ── left cinematic panel — the threshold ── */}
      <div className="relative hidden grain flex-col justify-between overflow-hidden bg-night p-10 text-bone lg:flex">
        <ShaderCanvas kind="aurora" opacity={0.6} />
        <Starfield density={60} opacity={0.5} />
        <DustMotes density={18} tone="bone" opacity={0.4} />
        <div className="dotgrid--bone absolute inset-0 opacity-30" aria-hidden />
        <Logo dark onClick={() => navigate("/")} />
        <div className="relative">
          <p className="font-mono text-[10px] tracking-[0.3em] text-bone-dim uppercase">
            while you were filming
          </p>
          <h2 className="font-display mt-4 max-w-md text-4xl font-extrabold leading-[1.05] tracking-tight">
            <WordReveal text="Every comment answered overnight." accentWords={["answered"]} />
          </h2>
          <div className="relative mx-auto mt-8 max-w-[420px]">
            <AsciiFrame fig="fig. 03" caption="the door is open" status="● awake">
              <AsciiArt
                scene={portalScene}
                cols={72}
                aspect={1.15}
                ramp={RAMPS.classic}
                fontSize={7.5}
                melt={0.12}
                ariaLabel="A glowing portal drawn in ASCII art"
              />
            </AsciiFrame>
          </div>
          <p className="mt-6 max-w-sm text-[13.5px] leading-relaxed text-bone-dim">
            Every one of them got a human-paced reply and a 3-button DM. You were asleep.
            RELO wasn&apos;t.
          </p>
        </div>
        <p className="relative font-mono text-[10px] tracking-[0.24em] text-bone-dim/60 uppercase">
          © 2025 the π lab · comments in, customers out
        </p>
      </div>

      {/* ── right form panel ── */}
      <div className="relative flex flex-col items-center justify-center overflow-y-auto px-5 py-10 sm:px-10">
        <div className="dotgrid absolute inset-0 opacity-50" aria-hidden />
        <div className="relative w-full max-w-md">
          <div className="mb-8 flex items-center justify-between lg:hidden">
            <Logo onClick={() => navigate("/")} />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.28, 1] }}
            className="rounded-[28px] border border-line bg-card p-8 shadow-[var(--shadow-lift)] sm:p-10"
          >
            <AnimatePresence mode="wait">
              {step === "email" ? (
                <motion.div
                  key="email"
                  initial={{ opacity: 0, x: -18 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 18 }}
                  transition={{ duration: 0.4 }}
                >
                  <span className="eyebrow eyebrow--ember">passwordless</span>
                  <h1 className="font-display mt-3 text-3xl font-bold tracking-tight">
                    The autopilot missed you.
                  </h1>
                  <p className="mt-2.5 text-[14.5px] leading-relaxed text-ink-3">
                    We&apos;ll email you a 6-digit code. No passwords to leak, ever.
                  </p>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      sendCode();
                    }}
                  >
                    <label htmlFor="relo-email" className="mt-8 block font-mono text-[10.5px] tracking-[0.2em] text-ink-3 uppercase">
                      Email
                    </label>
                    <input
                      id="relo-email"
                      ref={emailRef}
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@studio.in"
                      autoComplete="email"
                      aria-describedby="relo-email-hint"
                      autoFocus
                      className="mt-2 h-13 w-full rounded-2xl border border-line-strong bg-night-2 px-4.5 py-3.5 text-[15px] outline-none transition-all placeholder:text-ink-4 focus:border-ember/60 focus:bg-[var(--input-focus-bg)] focus:shadow-[0_0_0_4px_rgba(139,128,249,0.12)]"
                    />
                    <p id="relo-email-hint" className="mt-2 font-mono text-[10px] tracking-wide text-ink-4">
                      demo inbox · any valid email works
                    </p>

                    <RButton type="submit" className="mt-5 w-full" size="lg" disabled={sending}>
                      {sending ? (
                        <motion.span animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1, repeat: Infinity }}>
                          Sending…
                        </motion.span>
                      ) : (
                        <>
                          Send my code <ArrowRight className="size-4" />
                        </>
                      )}
                    </RButton>
                  </form>

                  <div className="my-6 flex items-center gap-3">
                    <span className="h-px flex-1 bg-line" />
                    <span className="font-mono text-[10px] tracking-widest text-ink-4 uppercase">or</span>
                    <span className="h-px flex-1 bg-line" />
                  </div>

                  <RButton variant="ghost" className="w-full" size="lg" onClick={demoMode}>
                    <PlayCircle className="size-4.5 text-ember" /> Just looking? Tour the studio
                  </RButton>
                </motion.div>
              ) : (
                <motion.div
                  key="otp"
                  initial={{ opacity: 0, x: 18 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -18 }}
                  transition={{ duration: 0.4 }}
                >
                  <button
                    onClick={() => setStep("email")}
                    className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-3 transition-colors "
                  >
                    <ArrowLeft className="size-3.5" /> Wrong email?
                  </button>
                  <div className="mt-4 grid size-12 place-items-center rounded-2xl bg-ember-wash text-ember-deep">
                    <MailOpen className="size-6" />
                  </div>
                  <h1 className="font-display mt-4 text-3xl font-bold tracking-tight">Check your inbox.</h1>
                  <p className="mt-2.5 text-[14.5px] text-ink-3">
                    Sent to <span className="font-semibold text-ink">{email}</span>
                  </p>

                  <div className="mt-8 flex justify-center [&_[data-slot]]:border-ink/15">
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
                            className="h-14 w-11 rounded-xl border-line-strong bg-night-2 font-mono text-xl shadow-[var(--shadow-soft)] transition-all focus:border-ember focus:shadow-[0_0_0_4px_rgba(139,128,249,0.14)] data-[filled=true]:border-ember/50 data-[filled=true]:bg-ember-wash"
                          />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                  </div>

                  <div aria-live="polite" className="mt-6 flex items-center justify-center gap-2 text-[13px] text-ink-3">
                    {verifying ? (
                      <motion.span animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 0.9, repeat: Infinity }}>
                        Unlocking the studio…
                      </motion.span>
                    ) : (
                      <>
                        Didn&apos;t get it?{" "}
                        {resendIn > 0 ? (
                          <span className="font-mono text-ink-4">resend in {resendIn}s</span>
                        ) : (
                          <button onClick={sendCode} className="font-semibold text-ember ">
                            Resend
                          </button>
                        )}
                      </>
                    )}
                  </div>
                  <p className="mt-4 text-center font-mono text-[10px] text-ink-4">
                    demo inbox · code {DEMO_CODE}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <div className="mt-6 flex items-center justify-center gap-5 font-mono text-[10px] tracking-wide text-ink-4">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="size-3.5 text-moss" /> 10-min expiry · 5 tries
            </span>
            <a href="#/" onClick={() => navigate("/")} className="">
              ← back home
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
