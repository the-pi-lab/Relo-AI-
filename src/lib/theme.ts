/**
 * Theme state: "light" | "dark" | "system".
 * Applied as <html data-theme> — "system" tracks prefers-color-scheme live.
 * Persisted in localStorage; the inline bootstrap in index.html prevents FOUC.
 */
import { useEffect, useState } from "react";

export type ThemePreference = "light" | "dark" | "system";

const STORAGE_KEY = "relo_theme";
const media = () =>
  typeof window !== "undefined" ? window.matchMedia("(prefers-color-scheme: dark)") : null;

export function getStoredPreference(): ThemePreference {
  if (typeof window === "undefined") return "system";
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
}

/** Resolves a preference to the concrete theme applied to <html>. */
export function resolveTheme(preference: ThemePreference): "light" | "dark" {
  if (preference === "system") return media()?.matches ? "dark" : "light";
  return preference;
}

export function applyTheme(preference: ThemePreference): "light" | "dark" {
  const resolved = resolveTheme(preference);
  document.documentElement.setAttribute("data-theme", resolved);
  return resolved;
}

export function setTheme(preference: ThemePreference): "light" | "dark" {
  localStorage.setItem(STORAGE_KEY, preference);
  return applyTheme(preference);
}

/**
 * React hook: current preference + resolved theme, live-updates when the
 * OS scheme changes while in "system" mode.
 */
export function useTheme() {
  const [preference, setPreferenceState] = useState<ThemePreference>(getStoredPreference);
  const [resolved, setResolved] = useState<"light" | "dark">(() => resolveTheme(getStoredPreference()));

  useEffect(() => {
    setResolved(applyTheme(preference));
    if (preference !== "system") return;
    const onScheme = () => setResolved(applyTheme("system"));
    media()?.addEventListener("change", onScheme);
    return () => media()?.removeEventListener("change", onScheme);
  }, [preference]);

  return {
    preference,
    resolved,
    setTheme: (next: ThemePreference) => {
      setPreferenceState(next);
      setResolved(setTheme(next));
    },
  };
}
