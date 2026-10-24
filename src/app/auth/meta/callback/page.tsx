"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";

import * as api from "@/lib/relo/api";
import { META_REDIRECT_URI } from "@/lib/relo/config";

type Phase = "checking" | "linking" | "done" | "error";

function CallbackInner() {
  const params = useSearchParams();
  const [phase, setPhase] = useState<Phase>("checking");
  const [message, setMessage] = useState("Finishing the connection…");
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const metaError = params.get("error");
    const metaDescription = params.get("error_description");
    const code = params.get("code");
    const state = params.get("state");

    if (metaError) {
      setPhase("error");
      setMessage(
        metaDescription ||
          (metaError === "access_denied"
            ? "You cancelled the Instagram connection."
            : `Meta returned an error: ${metaError}`)
      );
      return;
    }

    if (!api.getToken()) {
      setPhase("error");
      setMessage("Your RELO session expired before Instagram answered. Sign in and connect again.");
      return;
    }

    if (!api.consumeOAuthState(state)) {
      setPhase("error");
      setMessage("This connection link was not started from your session. Try connecting again.");
      return;
    }

    if (!code) {
      setPhase("error");
      setMessage("Meta did not return an authorization code. Try connecting again.");
      return;
    }

    setPhase("linking");
    setMessage("Exchanging the code for a long-lived Page token…");

    void (async () => {
      try {
        const result = await api.completeMetaOAuth(code, META_REDIRECT_URI);
        const name = result.connectedAccounts[0]?.username;
        try {
          window.sessionStorage.setItem(
            "relo.meta.connected",
            name ? `@${name}` : "your Instagram account"
          );
        } catch {
          /* the banner is a nicety, not a requirement */
        }
        setPhase("done");
        setMessage(
          name
            ? `@${name} is connected. Taking you to your automations…`
            : "Your Instagram account is connected. Taking you to your automations…"
        );
        window.setTimeout(() => {
          window.location.replace("/#/studio/settings");
        }, 900);
      } catch (caught) {
        setPhase("error");
        setMessage(api.errorMessage(caught));
      }
    })();
  }, [params]);

  return (
    <div className="grid min-h-screen place-items-center bg-canvas px-5">
      <div className="glass-panel w-full max-w-[460px] rounded-[24px] p-7 text-center">
        <span
          className={
            "mx-auto grid size-12 place-items-center rounded-full border " +
            (phase === "error"
              ? "border-bad/30 bg-bad-wash text-bad"
              : phase === "done"
                ? "border-ok/30 bg-ok-wash text-ok"
                : "border-line bg-surface-2 text-ink-2")
          }
        >
          {phase === "error" ? (
            <AlertTriangle className="size-5" aria-hidden />
          ) : phase === "done" ? (
            <CheckCircle2 className="size-5" aria-hidden />
          ) : (
            <Loader2 className="size-5 animate-spin" aria-hidden />
          )}
        </span>

        <h1 className="h3 mt-5 text-ink">
          {phase === "error"
            ? "Connection not completed"
            : phase === "done"
              ? "Instagram connected"
              : "Connecting Instagram"}
        </h1>
        <p className="mt-2.5 text-[14px] leading-relaxed text-ink-2">{message}</p>

        {phase === "error" && (
          <div className="mt-6 flex flex-col gap-2.5">
            <Link
              href="/#/studio/settings"
              className="inline-flex h-10 items-center justify-center rounded-md bg-ink px-4 text-[13.5px] font-semibold text-ink-invert transition-colors hover:bg-ink/88"
            >
              Back to settings
            </Link>
            <Link
              href="/#/login"
              className="text-[13px] text-ink-3 transition-colors hover:text-ink"
            >
              Sign in again
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MetaCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="grid min-h-screen place-items-center bg-canvas">
          <Loader2 className="size-5 animate-spin text-ink-3" aria-hidden />
        </div>
      }
    >
      <CallbackInner />
    </Suspense>
  );
}
