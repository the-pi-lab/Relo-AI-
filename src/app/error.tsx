"use client";

/* Route-level error boundary. Everything else on the page may be broken —
   this file only trusts the token layer, so it renders even mid-crisis. */

import { useEffect } from "react";
import { Button } from "@/components/relo/chrome";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="grid min-h-svh place-items-center bg-canvas px-6">
      <div className="w-full max-w-md rounded-xl border border-line bg-surface p-8 text-center shadow-[var(--sh-1)]">
        <p className="caption">Signal lost</p>
        <h1 className="h3 mt-2 text-ink">Something broke on our side</h1>
        <p className="mt-3 text-[13.5px] leading-relaxed text-ink-2">
          The page hit an unexpected error. Your saved work is safe — try again,
          and if it keeps happening we want to hear about it.
        </p>
        {error.digest && (
          <p className="mt-4 font-mono text-[11px] text-ink-3 tnum">
            ref {error.digest}
          </p>
        )}
        <div className="mt-6 flex justify-center gap-2">
          <Button variant="signal" onClick={reset}>
            Try again
          </Button>
          <Button variant="outline" onClick={() => (window.location.href = "/")}>
            Go home
          </Button>
        </div>
      </div>
    </main>
  );
}
