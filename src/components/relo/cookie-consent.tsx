"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "./chrome";
import { cn } from "@/lib/utils";

/* ==========================================================================
   Local storage notice.

   RELO sets no cookies, no trackers and no advertising identifiers, so there
   is nothing to "accept". What actually lives in this browser is the theme
   choice and the signed-in session; the notice says that once and gets out of
   the way.
   ========================================================================== */

export const CONSENT_KEY = "relo-storage-notice";
export const CONSENT_EVENT = "relo:consent-open";

interface StoredConsent {
  v: 2;
  at: string;
}

export function readConsent(): StoredConsent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredConsent;
    return parsed?.v === 2 ? parsed : null;
  } catch {
    return null;
  }
}

function storeConsent() {
  try {
    window.localStorage.setItem(
      CONSENT_KEY,
      JSON.stringify({ v: 2, at: new Date().toISOString() } satisfies StoredConsent)
    );
  } catch {
    /* private mode: the choice simply does not persist */
  }
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: { resolved: true } }));
}

export function CookieConsent({
  navigate,
  hidden = false,
}: {
  navigate: (to: string) => void;
  /** The studio has its own rail and dialogs; a floating notice there only
      collides with them. Signed-in users can reopen it from Help → Cookies. */
  hidden?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const acceptRef = useRef<HTMLButtonElement>(null);

  /* appear once, shortly after the page settles */
  useEffect(() => {
    const id = window.setTimeout(() => {
      if (!readConsent()) setOpen(true);
    }, 1600);
    return () => window.clearTimeout(id);
  }, []);

  /* "Privacy" in the footer re-opens it */
  useEffect(() => {
    const reopen = (e: Event) => {
      const resolved = (e as CustomEvent<{ resolved?: boolean }>).detail?.resolved;
      if (!resolved) setOpen(true);
    };
    window.addEventListener(CONSENT_EVENT, reopen);
    return () => window.removeEventListener(CONSENT_EVENT, reopen);
  }, []);

  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => acceptRef.current?.focus(), 250);
    return () => window.clearTimeout(id);
  }, [open]);

  const dismiss = useCallback(() => {
    storeConsent();
    setOpen(false);
  }, []);

  if (!open || hidden) return null;

  return (
    <div
      role="region"
      aria-labelledby="storage-title"
      aria-describedby="storage-desc"
      className="fixed inset-x-3 bottom-3 z-[80] sm:inset-x-auto sm:bottom-5 sm:left-5 sm:w-[380px]"
    >
      <div className="glass-panel p-4 shadow-[var(--sh-3)]">
        <h2 id="storage-title" className="text-[13px] font-semibold tracking-tight text-ink">
          What RELO stores in your browser
        </h2>

        <p id="storage-desc" className="mt-1.5 text-[12px] leading-relaxed text-ink-2">
          No cookies, no trackers, no ad pixels. Only your theme choice and the
          session that keeps you signed in.{" "}
          <button
            type="button"
            onClick={() => {
              navigate("/privacy");
              setOpen(false);
            }}
            className="font-semibold text-ink underline decoration-line-strong underline-offset-2 transition-colors hover:decoration-ink"
          >
            Privacy policy
          </button>
        </p>

        <div className="mt-3 flex items-center justify-end gap-2">
          <Button ref={acceptRef} variant="outline" size="sm" onClick={dismiss}>
            Got it
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
      Browser storage
    </button>
  );
}
