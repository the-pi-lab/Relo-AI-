"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "./chrome";
import { cn } from "@/lib/utils";

/* ==========================================================================
   Cookie notice.

   RELO sets no cookies. It keeps three local-storage entries, so the banner
   says exactly that rather than borrowing the usual vague wording. Both
   buttons do the same thing; the choice is recorded only so the banner does
   not come back.
   ========================================================================== */

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
    /* private mode: the choice simply does not persist */
  }
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: { resolved: true } }));
}

export function CookieConsent({ navigate }: { navigate: (to: string) => void }) {
  const [open, setOpen] = useState(false);
  const acceptRef = useRef<HTMLButtonElement>(null);

  /* appear once, shortly after the page settles */
  useEffect(() => {
    const id = window.setTimeout(() => {
      if (!readConsent()) setOpen(true);
    }, 1200);
    return () => window.clearTimeout(id);
  }, []);

  /* the footer link in every legal page re-opens it */
  useEffect(() => {
    const reopen = (e: Event) => {
      const resolved = (e as CustomEvent<{ resolved?: boolean }>).detail?.resolved;
      if (!resolved) setOpen(true);
    };
    window.addEventListener(CONSENT_EVENT, reopen);
    return () => window.removeEventListener(CONSENT_EVENT, reopen);
  }, []);

  /* move focus into the notice when it appears */
  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => acceptRef.current?.focus(), 300);
    return () => window.clearTimeout(id);
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
      className="fixed inset-x-3 bottom-4 z-[80] sm:inset-x-auto sm:bottom-6 sm:left-6 sm:w-[420px]"
    >
      <div className="rounded-2xl border border-white/15 bg-black/80 p-5 shadow-2xl shadow-black/80 backdrop-blur-2xl text-white">
        <h2 id="cookie-title" className="text-sm font-bold text-white tracking-tight">
          Privacy & Local Storage
        </h2>

        <p id="cookie-desc" className="mt-2 text-xs leading-relaxed text-white/70">
          RELO sets zero trackers or advertising cookies. It only stores your theme preference, demo workspace state, and gradient shader selection locally in your browser.{" "}
          <button
            type="button"
            onClick={() => {
              navigate("/cookies");
              setOpen(false);
            }}
            className="font-semibold text-cyan-400 underline underline-offset-2 transition-colors hover:text-cyan-300"
          >
            Read details
          </button>
          .
        </p>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Button
            ref={acceptRef}
            variant="signal"
            className="flex-1 text-xs"
            onClick={() => choose("all")}
          >
            Accept
          </Button>
          <Button
            variant="outline"
            className="flex-1 text-xs border-white/10 text-white/80 hover:bg-white/10"
            onClick={() => choose("necessary")}
          >
            Essential only
          </Button>
        </div>
      </div>
    </div>
  );
}

export function CookieSettingsLink({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new CustomEvent(CONSENT_EVENT))}
      className={cn("transition-colors hover:text-ink", className)}
    >
      Cookie settings
    </button>
  );
}
