"use client";

/**
 * RELO THEME
 *
 * Light mode is the singular canonical theme for RELO.
 * All colour tokens in globals.css reflect the daylight warm-paper design.
 * Dark mode has been intentionally and completely removed.
 */

import { createContext, useContext, useEffect, type ReactNode } from "react";

export type Theme = "light";
export type ThemeChoice = "light";

export const THEME_KEY = "relo-theme";

const ThemeCtx = createContext<{
  choice: ThemeChoice;
  theme: Theme;
  isDark: boolean;
  set: (c?: any) => void;
}>({
  choice: "light",
  theme: "light",
  isDark: false,
  set: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    try {
      const root = document.documentElement;
      root.setAttribute("data-theme", "light");
      root.style.colorScheme = "light";
      window.localStorage.removeItem(THEME_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <ThemeCtx.Provider
      value={{
        choice: "light",
        theme: "light",
        isDark: false,
        set: () => {},
      }}
    >
      {children}
    </ThemeCtx.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeCtx);
}

/**
 * ThemeToggle is disabled since Dark Mode is removed.
 * Returns null so any calling component renders cleanly without errors.
 */
export function ThemeToggle(_props: { className?: string }) {
  return null;
}
