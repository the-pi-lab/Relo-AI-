"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  CornerDownLeft,
  Lock,
  LogOut,
  Moon,
  Plus,
  Search,
  Sun,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useRelo } from "@/lib/relo/store";
import { useTheme } from "@/lib/relo/theme";
import { NAV_GROUPS, lockedBy, type NavItem } from "./nav-config";

/**
 * ⌘K. One input over the whole product.
 *
 * The palette is a navigation tool first and a settings search second: every
 * row is something the person can actually do right now. Rows for views the
 * account has not unlocked stay visible but disabled, because hiding "Flow
 * canvas" from a free account makes the upgrade look like a rumour.
 */

interface Row {
  id: string;
  label: string;
  hint?: string;
  group: string;
  icon: NavItem["icon"];
  run: () => void;
  locked?: boolean;
  soon?: boolean;
  /** Right-hand affordance glyph. */
  enter?: boolean;
}

export function CommandPalette({
  open,
  onClose,
  go,
  onOpenHelp,
}: {
  open: boolean;
  onClose: () => void;
  go: (view: string) => void;
  onOpenHelp: () => void;
}) {
  const { limits, plan, signOut } = useRelo();
  const { isDark, set } = useTheme();
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setCursor(0);
    /* Focus after paint: the panel mounts in the same frame the shortcut
       fires, and focusing a node that is not attached yet is a no-op. */
    const frame = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  const rows = useMemo<Row[]>(() => {
    const nav: Row[] = NAV_GROUPS.flatMap((group) =>
      group.items.map((item) => {
        const locked = lockedBy(item, limits);
        const soon = item.status === "soon";
        return {
          id: `nav:${group.label}:${item.label}`,
          label: item.label,
          hint: locked ? "Needs a higher plan" : item.hint,
          group: group.label,
          icon: item.icon,
          locked,
          soon,
          enter: !locked && !soon,
          run: () => {
            if (locked || soon) return;
            go(item.view);
            onClose();
          },
        };
      })
    );

    const actions: Row[] = [
      {
        id: "action:new-automation",
        label: "New automation",
        hint: "Turn a Reel + keyword into a DM",
        group: "Actions",
        icon: Plus,
        run: () => {
          go("automations");
          onClose();
        },
      },
      {
        id: "action:theme",
        label: isDark ? "Switch to light theme" : "Switch to dark theme",
        hint: `Currently ${isDark ? "dark" : "light"}`,
        group: "Actions",
        icon: isDark ? Sun : Moon,
        run: () => {
          set(isDark ? "light" : "dark");
          onClose();
        },
      },
      {
        id: "action:help",
        label: "Open help & documentation",
        hint: "Connecting, keywords, Meta limits",
        group: "Actions",
        icon: BookOpen,
        run: () => {
          onClose();
          onOpenHelp();
        },
      },
      {
        id: "action:signout",
        label: "Sign out",
        hint: "Ends this session on this device",
        group: "Actions",
        icon: LogOut,
        run: () => {
          signOut();
          onClose();
          window.location.hash = "#/";
        },
      },
    ];

    return [...actions, ...nav];
  }, [go, isDark, limits, onClose, onOpenHelp, set, signOut]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    const terms = q.split(/\s+/);
    return rows.filter((row) => {
      const haystack = `${row.label} ${row.hint ?? ""} ${row.group}`.toLowerCase();
      return terms.every((term) => haystack.includes(term));
    });
  }, [query, rows]);

  /* The cursor must never point past the end after a filter changes. */
  useEffect(() => {
    setCursor((c) => (c >= matches.length ? 0 : c));
  }, [matches.length]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setCursor((c) => (matches.length ? (c + 1) % matches.length : 0));
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setCursor((c) => (matches.length ? (c - 1 + matches.length) % matches.length : 0));
        return;
      }
      if (event.key === "Enter") {
        event.preventDefault();
        matches[cursor]?.run();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cursor, matches, onClose, open]);

  /* Keep the highlighted row inside the scroll viewport. */
  useEffect(() => {
    const node = listRef.current?.querySelector<HTMLElement>(
      `[data-row-index="${cursor}"]`
    );
    node?.scrollIntoView({ block: "nearest" });
  }, [cursor]);

  if (!open) return null;

  let lastGroup = "";

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center px-4 pt-[12vh]">
      <button
        type="button"
        aria-label="Close search"
        onClick={onClose}
        className="absolute inset-0 bg-overlay/70 backdrop-blur-[3px]"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="relative w-full max-w-[560px] overflow-hidden rounded-2xl border border-line bg-surface shadow-[var(--sh-3)]"
      >
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Search className="size-4 shrink-0 text-ink-3" aria-hidden />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search views, actions, settings…"
            aria-label="Search"
            aria-controls="cmd-results"
            aria-activedescendant={matches[cursor] ? `cmd-${matches[cursor].id}` : undefined}
            className="h-14 w-full bg-transparent text-[14.5px] text-ink outline-none placeholder:text-ink-3"
          />
          <kbd className="hidden shrink-0 rounded-md border border-line bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-ink-3 sm:block">
            ESC
          </kbd>
        </div>

        <div
          ref={listRef}
          id="cmd-results"
          role="listbox"
          aria-label="Results"
          className="max-h-[52vh] overflow-y-auto overscroll-contain p-2"
        >
          {matches.length === 0 && (
            <p className="px-3 py-10 text-center text-[13px] text-ink-3">
              Nothing matches “{query}”.
            </p>
          )}

          {matches.map((row, index) => {
            const Icon = row.icon;
            const showGroup = row.group !== lastGroup;
            lastGroup = row.group;
            const disabled = Boolean(row.locked || row.soon);

            return (
              <div key={row.id}>
                {showGroup && (
                  <p className="px-2.5 pb-1 pt-3 text-[10.5px] font-bold uppercase tracking-[0.12em] text-ink-3">
                    {row.group}
                  </p>
                )}
                <button
                  type="button"
                  id={`cmd-${row.id}`}
                  role="option"
                  aria-selected={index === cursor}
                  data-row-index={index}
                  data-selected={index === cursor}
                  data-disabled={disabled}
                  disabled={disabled}
                  onMouseMove={() => setCursor(index)}
                  onClick={row.run}
                  className={cn(
                    "cmd-item flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors",
                    disabled
                      ? "cursor-not-allowed opacity-45"
                      : "text-ink-2 hover:bg-surface-2"
                  )}
                >
                  <span
                    className={cn(
                      "grid size-7 shrink-0 place-items-center rounded-md border border-line",
                      index === cursor && !disabled
                        ? "bg-surface text-signal"
                        : "bg-surface-2/60 text-ink-3"
                    )}
                  >
                    <Icon className="size-3.5" strokeWidth={1.9} aria-hidden />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px] font-semibold text-ink">
                      {row.label}
                    </span>
                    {row.hint && (
                      <span className="block truncate text-[11.5px] text-ink-3">
                        {row.hint}
                      </span>
                    )}
                  </span>

                  {row.locked && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ink-3">
                      <Lock className="size-2.5" aria-hidden />
                      {plan === "free" ? "Pro" : "Studio"}
                    </span>
                  )}
                  {row.soon && (
                    <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ink-3">
                      Soon
                    </span>
                  )}
                  {row.enter && (
                    <CornerDownLeft
                      className={cn(
                        "size-3.5 shrink-0",
                        index === cursor ? "text-signal" : "text-ink-3/60"
                      )}
                      aria-hidden
                    />
                  )}
                </button>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-line bg-surface-2/40 px-4 py-2">
          <span className="flex items-center gap-3 text-[10.5px] text-ink-3">
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-line bg-surface px-1 font-mono text-[9.5px]">
                ↑↓
              </kbd>
              move
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-line bg-surface px-1 font-mono text-[9.5px]">
                ⏎
              </kbd>
              open
            </span>
          </span>
          <span className="inline-flex items-center gap-1 text-[10.5px] font-medium text-ink-3">
            RELO command
            <ArrowRight className="size-3" aria-hidden />
          </span>
        </div>
      </div>
    </div>
  );
}
