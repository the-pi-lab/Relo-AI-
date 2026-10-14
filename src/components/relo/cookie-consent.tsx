"use client";

/**
 * COOKIE CONSENT — DPDP-style first transmission.
 *
 * The Digital Personal Data Protection Act asks for consent that is free,
 * specific, informed, unconditional, and as easy to withdraw as it was to
 * give. So: a small card that tells you exactly what is stored on your
 * device, two buttons with no dark patterns, a link to the full policy,
 * and a "cookie settings" escape hatch that lives in every footer.
 *
 * RELO stores nothing beyond what is strictly necessary (a signed-in
 * session, your theme, your studio demo state) — there is no analytics,
 * no advertising, no third-party tracking to switch on. "Accept all" is
 * offered for honesty, not because more is waiting behind it.
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Cookie, ShieldCheck } from "lucide-react";

export const CONSENT_KEY = "relo-cookie-consent";
export const CONSENT_EVENT = "relo:consent-open";

export type ConsentChoice = "all" | "necessary";

interface StoredConsent {
  v: 1;
  choice: ConsentChoice;
  at: string; /* ISO — when consent was recorded */
}

export function readConsent(): StoredConsent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredConsent;
    return parsed?.v === 1 && (parsed.choice === "all" || parsed.choice === "necessary")
      ? parsed
      : null;
  } catch {
    return null;
  }
}

function storeConsent(choice: ConsentChoice) {
  const record: StoredConsent = { v: 1, choice, at: new Date().toISOString() };
  try {
    window.localStorage.setItem(CONSENT_KEY, JSON.stringify(record));
  } catch {
    /* private mode — the choice simply doesn't persist; banner will return */
  }
  window.dispatchEvent(new CustomEvent("relo:consent-changed", { detail: record }));
}

export function CookieConsent({ navigate }: { navigate: (to: string) => void }) {
  const [open, setOpen] = useState(false);
  const acceptRef = useRef<HTMLButtonElement>(null);

  /* show once, on first visit only, after the page has settled */
  useEffect(() => {
    const id = window.setTimeout(() => {
      if (!readConsent()) setOpen(true);
    }, 1600);
    return () => window.clearTimeout(id);
  }, []);

  /* every footer's "cookie settings" link re-opens the banner */
  useEffect(() => {
    const reopen = () => setOpen(true);
    window.addEventListener(CONSENT_EVENT, reopen);
    return () => window.removeEventListener(CONSENT_EVENT, reopen);
  }, []);

  /* keyboard: focus the honest default when the banner appears */
  useEffect(() => {
    if (open) {
      const id = window.setTimeout(() => acceptRef.current?.focus(), 350);
      return () => window.clearTimeout(id);
    }
  }, [open]);

  const choose = useCallback((choice: ConsentChoice) => {
    storeConsent(choice);
    setOpen(false);
  }, []);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="false"
          aria-labelledby="cookie-title"
          aria-describedby="cookie-desc"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.28, 1] }}
          className="fixed inset-x-3 bottom-3 z-[80] sm:inset-x-auto sm:bottom-5 sm:left-5 sm:max-w-[430px]"
        >
          <div className="glass rounded-3xl border border-line p-5 shadow-[0_24px_70px_-18px_rgba(4,3,9,0.65)] sm:p-6">
            <div className="flex items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-2xl bg-ember-wash text-ember-deep">
                <Cookie className="size-4.5" />
              </span>
              <div className="min-w-0">
                <h2
                  id="cookie-title"
                  className="font-display text-[15.5px] font-bold tracking-tight"
                >
                  A word about <span className="serif-accent text-spectral">cookies.</span>
                </h2>
                <p id="cookie-desc" className="mt-1.5 text-[13px] leading-relaxed text-ink-3">
                  We keep only what this device needs to run RELO: a sign-in
                  session, your night/day theme, and your studio demo state.
                  No trackers, no ads, no third-party pixels —{" "}
                  <button
                    type="button"
                    onClick={() => {
                      navigate("/cookies");
                      setOpen(false);
                    }}
                    className="font-medium text-ember underline decoration-ember/40 underline-offset-2"
                  >
                    read the full policy
                  </button>
                  .
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
              <button
                ref={acceptRef}
                type="button"
                onClick={() => choose("all")}
                className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-full bg-ink text-night px-4 text-[13px] font-semibold transition-colors"
              >
                <Cookie className="size-3.5" /> Accept all cookies
              </button>
              <button
                type="button"
                onClick={() => choose("necessary")}
                className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-full border border-line-strong bg-card px-4 text-[13px] font-medium text-ink-2"
              >
                <ShieldCheck className="size-3.5 text-moss" /> Only what&apos;s necessary
              </button>
            </div>
            <p className="mt-3 font-mono text-[9.5px] uppercase tracking-[0.18em] text-ink-4">
              change your mind anytime · cookie settings live in every footer
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── footer link — re-opens the banner (withdraw consent the easy way) ── */

export function CookieSettingsLink({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new CustomEvent(CONSENT_EVENT))}
      className={className ?? "cursor-pointer"}
    >
      Cookie settings
    </button>
  );
}
