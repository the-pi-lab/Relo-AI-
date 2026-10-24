"use client";

import { useEffect, useRef } from "react";
import {
  ArrowUpRight,
  BookOpen,
  Clock3,
  KeyRound,
  MessageSquareQuote,
  PlugZap,
  ShieldCheck,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * The help slide-over.
 *
 * Not a link farm: the four things that actually block a new account (connect
 * the account, write a keyword, understand the 24-hour window, know when the
 * token dies) are answered here in the order people hit them.
 */

const TOPICS = [
  {
    icon: PlugZap,
    title: "Connect the Instagram account",
    body: "Settings → Connection starts Meta's OAuth flow. RELO asks for messaging and comment permissions only, stores the Page token AES-GCM encrypted, and never posts anything you did not configure.",
  },
  {
    icon: MessageSquareQuote,
    title: "Answering a comment",
    body: "An automation is one Reel plus one or more keywords. When a comment matches, RELO posts a public reply and sends the DM card. Matching ignores case and surrounding punctuation, so “LINK!” and “link” are the same trigger.",
  },
  {
    icon: Clock3,
    title: "The 24-hour window",
    body: "Meta lets you open a DM thread from a comment, but once the person replies you have 24 hours of free-form messaging. RELO measures that window from their last inbound message and marks anyone outside it as unreachable before a broadcast sends.",
  },
  {
    icon: KeyRound,
    title: "Token lifetime",
    body: "Long-lived Page tokens last about 60 days. A scheduled job refreshes them before expiry and the header warns you at seven days. If it lapses, reconnect from Settings — your automations are untouched.",
  },
  {
    icon: ShieldCheck,
    title: "Staying inside Meta's limits",
    body: "DMs are dispatched with human jitter, never in a burst. Reply variations rotate per send so the same sentence is not repeated at scale. Failures back off and retry instead of hammering the Graph API.",
  },
] as const;

export function HelpDrawer({
  open,
  onClose,
  go,
}: {
  open: boolean;
  onClose: () => void;
  go: (to: string) => void;
}) {
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose, open]);

  return (
    <div
      className={cn("fixed inset-0 z-[65]", open ? "pointer-events-auto" : "pointer-events-none")}
      aria-hidden={!open}
      /* Mounted-but-closed is what makes the slide-over animate, but it must
         not be reachable by Tab or by a screen reader while it is off-screen. */
      inert={!open}
    >
      <button
        type="button"
        tabIndex={open ? 0 : -1}
        aria-label="Close help"
        onClick={onClose}
        className={cn(
          "absolute inset-0 bg-overlay/60 backdrop-blur-[2px] transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0"
        )}
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Help and documentation"
        tabIndex={-1}
        className={cn(
          "absolute inset-y-0 right-0 flex w-full max-w-[420px] flex-col border-l border-line bg-surface shadow-[var(--sh-3)] outline-none transition-transform duration-[420ms]",
          open ? "translate-x-0" : "translate-x-full"
        )}
        style={{ transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)" }}
      >
        <header className="flex items-center gap-2.5 border-b border-line px-5 py-4">
          <span className="grid size-8 place-items-center rounded-lg bg-signal-wash text-signal">
            <BookOpen className="size-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <h2 className="text-[14.5px] font-bold text-ink">Help centre</h2>
            <p className="text-[11.5px] text-ink-3">The five questions every new account asks</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close help"
            className="ml-auto grid size-8 place-items-center rounded-lg text-ink-3 transition-colors hover:bg-surface-2 hover:text-ink"
          >
            <X className="size-4" aria-hidden />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-5">
          <ol className="space-y-3">
            {TOPICS.map(({ icon: Icon, title, body }, index) => (
              <li key={title} className="tile p-4">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-md bg-surface text-signal shadow-[var(--sh-1)]">
                    <Icon className="size-3.5" aria-hidden />
                  </span>
                  <div>
                    <h3 className="text-[13px] font-bold text-ink">
                      <span className="mr-1.5 font-mono text-[10.5px] text-ink-3">
                        0{index + 1}
                      </span>
                      {title}
                    </h3>
                    <p className="mt-1 text-[12.5px] leading-relaxed text-ink-2">{body}</p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <footer className="shrink-0 border-t border-line p-4">
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Privacy", to: "/privacy" },
              { label: "Terms", to: "/terms" },
              { label: "Cookies", to: "/cookies" },
              { label: "Settings", to: "/studio/settings" },
            ].map((link) => (
              <button
                key={link.label}
                type="button"
                onClick={() => {
                  onClose();
                  go(link.to);
                }}
                className="inline-flex items-center justify-between rounded-lg border border-line bg-surface-2/50 px-3 py-2 text-[12px] font-medium text-ink-2 transition-colors hover:border-line-strong hover:text-ink"
              >
                {link.label}
                <ArrowUpRight className="size-3.5" aria-hidden />
              </button>
            ))}
          </div>
        </footer>
      </div>
    </div>
  );
}
