"use client";

/**
 * RELO THEME — the world has two times of day.
 *
 *  · night (default) — the Dusk Observatory: violet void, spectral light
 *  · day             — Daybreak: warm bone paper, the same world at noon
 *
 * The entire app re-tunes through the CSS custom properties in globals.css;
 * this provider only flips one class on <html> and remembers the choice.
 * Canvases (shaders, starfields, ASCII plates) read the theme through
 * useTheme() so they can re-palette or stand down gracefully.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Theme = "night" | "day";

const STORAGE_KEY = "relo-theme";

const ThemeCtx = createContext<{
  theme: Theme;
  isDay: boolean;
  toggle: () => void;
  set: (t: Theme) => void;
}>({ theme: "night", isDay: false, toggle: () => {}, set: () => {} });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("night");

  /* hydrate from storage after mount (SSR-safe, out of the render path) */
  useEffect(() => {
    const id = window.setTimeout(() => {
      try {
        const saved = window.localStorage.getItem(STORAGE_KEY);
        if (saved === "day" || saved === "night") setTheme(saved);
      } catch {
        /* private mode — night it is */
      }
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  /* reflect onto <html> so every token flips at once */
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("day", theme === "day");
    root.style.colorScheme = theme === "day" ? "light" : "dark";
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  const set = useCallback((t: Theme) => setTheme(t), []);
  const toggle = useCallback(
    () => setTheme((t) => (t === "night" ? "day" : "night")),
    []
  );

  const value = useMemo(
    () => ({ theme, isDay: theme === "day", toggle, set }),
    [theme, toggle, set]
  );

  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

export function useTheme() {
  return useContext(ThemeCtx);
}

/* ── the toggle itself — a small instrument, sun/moon ─────────────────── */

export function ThemeToggle({ className }: { className?: string }) {
  const { isDay, toggle } = useTheme();
  return (
    <button
      type="button"
      onClick={toggle}
      role="switch"
      aria-checked={isDay}
      aria-label={isDay ? "Switch to night theme" : "Switch to day theme"}
      title={isDay ? "Night — the observatory" : "Day — daybreak"}
      className={`group relative inline-flex h-8 w-[58px] shrink-0 items-center rounded-full border border-line-strong bg-card px-1 transition-colors ${className ?? ""}`}
    >
      {/* travelling pill */}
      <span
        aria-hidden
        className="absolute top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-full bg-ember shadow-[0_2px_10px_-2px_rgba(139,128,249,0.6)] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.28,1)]"
        style={{ left: isDay ? 26 : 4 }}
      >
        {isDay ? <SunIcon /> : <MoonIcon />}
      </span>
      {/* the two skies */}
      <span aria-hidden className="ml-1.5 flex-1 text-left">
        <MoonIcon dim />
      </span>
      <span aria-hidden className="mr-1.5">
        <SunIcon dim />
      </span>
    </button>
  );
}

function SunIcon({ dim = false }: { dim?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className={dim ? "size-3 text-ink-4" : "size-3.5 text-[var(--on-ember)]"}
      aria-hidden
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}

function MoonIcon({ dim = false }: { dim?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={dim ? "size-3 text-ink-4" : "size-3.5 text-[var(--on-ember)]"}
      aria-hidden
    >
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
    </svg>
  );
}
