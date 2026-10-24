"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "@/lib/relo/theme";

/**
 * Cloudflare Turnstile.
 *
 * The Worker verifies a token on OTP send/verify only when
 * `TURNSTILE_SECRET_KEY` is configured, so this widget renders only when a
 * site key is present. If the script cannot load we report it rather than
 * letting the user press a button that can never succeed.
 */

interface TurnstileApi {
  render: (
    target: HTMLElement,
    options: {
      sitekey: string;
      theme?: "auto" | "light" | "dark";
      size?: "normal" | "compact" | "flexible";
      action?: string;
      callback?: (token: string) => void;
      "expired-callback"?: () => void;
      "error-callback"?: () => void;
    }
  ) => string;
  reset: (widgetId?: string) => void;
  remove: (widgetId: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SCRIPT_ID = "cf-turnstile-script";
const SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

let scriptPromise: Promise<void> | null = null;

function loadScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if (window.turnstile) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Turnstile failed")), {
        once: true,
      });
      return;
    }
    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Turnstile failed to load"));
    document.head.appendChild(script);
  });

  return scriptPromise;
}

export function Turnstile({
  siteKey,
  onToken,
  onError,
  /** Change this value to discard the used token and mount a fresh widget. */
  resetKey = 0,
  action,
}: {
  siteKey: string;
  onToken: (token: string) => void;
  onError?: () => void;
  resetKey?: number;
  action?: string;
}) {
  const holder = useRef<HTMLDivElement>(null);
  const widget = useRef<string | null>(null);
  const { theme } = useTheme();
  const tokenRef = useRef(onToken);
  const errorRef = useRef(onError);

  tokenRef.current = onToken;
  errorRef.current = onError;

  useEffect(() => {
    let cancelled = false;

    void loadScript()
      .then(() => {
        if (cancelled || !holder.current || !window.turnstile) return;
        if (widget.current) {
          window.turnstile.remove(widget.current);
          widget.current = null;
        }
        holder.current.innerHTML = "";
        widget.current = window.turnstile.render(holder.current, {
          sitekey: siteKey,
          theme,
          action,
          size: "flexible",
          callback: (token) => tokenRef.current(token),
          "expired-callback": () => tokenRef.current(""),
          "error-callback": () => {
            tokenRef.current("");
            errorRef.current?.();
          },
        });
      })
      .catch(() => {
        if (!cancelled) errorRef.current?.();
      });

    return () => {
      cancelled = true;
      if (widget.current && window.turnstile) {
        try {
          window.turnstile.remove(widget.current);
        } catch {
          /* the widget may already be gone */
        }
        widget.current = null;
      }
    };
  }, [siteKey, theme, resetKey, action]);

  return <div ref={holder} className="min-h-[65px]" />;
}
