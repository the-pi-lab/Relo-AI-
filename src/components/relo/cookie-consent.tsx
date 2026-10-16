"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

export const CONSENT_KEY = "relo-cookie-consent";
export const CONSENT_EVENT = "relo:consent-open";

export type ConsentChoice = "all" | "necessary";

interface StoredConsent {
  v: 1;
  choice: ConsentChoice;
  at: string;
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
    /* private mode — the choice simply does not persist */
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
    }, 1200);
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
      const id = window.setTimeout(() => acceptRef.current?.focus(), 300);
      return () => window.clearTimeout(id);
    }
  }, [open]);

  const choose = useCallback((choice: ConsentChoice) => {
    storeConsent(choice);
    setOpen(false);
  }, []);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cookie-title"
      aria-describedby="cookie-desc"
      className="fixed inset-x-3 bottom-4 z-[80] sm:inset-x-auto sm:bottom-6 sm:left-6 sm:max-w-[440px]"
    >
      <div className="rounded-lg border border-border bg-surface p-5 sm:p-6 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 grid size-7 place-items-center rounded-md bg-accent-wash text-accent font-bold text-xs">
            !
          </div>
          <div className="min-w-0">
            <h2 id="cookie-title" className="text-sm font-semibold text-text">
              A word about cookies
            </h2>
            <p id="cookie-desc" className="mt-1.5 text-sm text-text-2 leading-relaxed">
              We keep only what this device needs to run RELO: a sign-in session,
              your night or day theme, and your studio demo state. No trackers, no
              ads, no third-party pixels.
              <br />
              <button
                type="button"
                onClick={() => {
                  navigate("/cookies");
                  setOpen(false);
                }}
                className="font-semibold text-accent underline underline-offset-2 hover:text-accent-hover"
              >
                read the full policy
              </button>
              .
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center">
          <button
            ref={acceptRef}
            type="button"
            onClick={() => choose("all")}
            className="inline-flex h-10 w-full flex-1 items-center justify-center gap-2 rounded-md bg-accent text-accent-ink px-4 text-sm font-semibold hover:bg-accent-hover transition-colors sm:w-auto"
          >
            Accept all cookies
          </button>
          <button
            type="button"
            onClick={() => choose("necessary")}
            className="inline-flex h-10 w-full flex-1 items-center justify-center gap-2 rounded-md border border-border bg-surface px-4 text-sm font-semibold text-text-2 hover:bg-surface-2 transition-colors sm:w-auto"
          >
            Only what is necessary
          </button>
        </div>
        <p className="mt-4 text-[11px] uppercase tracking-wider text-text-3">
          change your mind anytime · cookie settings live in every footer
        </p>
      </div>
    </div>
  );
}

export function CookieSettingsLink({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new CustomEvent(CONSENT_EVENT))}
      className={className ?? ""}
    >
      Cookie settings
    </button>
  );
}
