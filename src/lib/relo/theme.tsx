"use client";

/**
 * RELO THEME
 *
 * Three choices, one attribute. The visitor can pin light, pin dark, or stay
 * on "system" and have the OS decide. Whatever the outcome, the resolved
 * value is written to <html data-theme="light|dark">, which is the single
 * switch every colour token in globals.css keys off.
 *
 * Obsidian is the default for visitors with no stored choice: the product's
 * design system is dark-first, while light ("Paper & Signal") remains a
 * first-class, fully supported alternate.
 *
 * The inline script in app/layout.tsx runs before first paint and sets the
 * same attribute, so there is no flash and no server/client disagreement:
 * this provider's first render is always the dark default on both sides,
 * and it corrects itself in an effect once the browser is available.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

export type Theme = "light" | "dark";
export type ThemeChoice = Theme | "system";

export const THEME_KEY = "relo-theme";

const ThemeCtx = createContext<{
  choice: ThemeChoice;
  theme: Theme;
  isDark: boolean;
  set: (c: ThemeChoice) => void;
}>({
  choice: "dark",
  theme: "dark",
  isDark: true,
  set: () => {},
});

function systemTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function readChoice(): ThemeChoice {
  if (typeof window === "undefined") return "dark";
  try {
    const v = window.localStorage.getItem(THEME_KEY);
    return v === "light" || v === "dark" || v === "system" ? v : "dark";
  } catch {
    return "dark";
  }
}

function paint(theme: Theme) {
  const root = document.documentElement;
  root.setAttribute("data-theme", theme);
  root.style.colorScheme = theme;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [choice, setChoice] = useState<ThemeChoice>("dark");
  const [theme, setTheme] = useState<Theme>("dark");

  /* adopt the stored choice after mount */
  useEffect(() => {
    const stored = readChoice();
    const resolved = stored === "system" ? systemTheme() : stored;
    setChoice(stored);
    setTheme(resolved);
    paint(resolved);
  }, []);

  /* while on "system", follow the OS if it changes mid-session */
  useEffect(() => {
    if (choice !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const next = systemTheme();
      setTheme(next);
      paint(next);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [choice]);

  const set = useCallback((next: ThemeChoice) => {
    const resolved = next === "system" ? systemTheme() : next;
    setChoice(next);
    setTheme(resolved);
    paint(resolved);
    try {
      window.localStorage.setItem(THEME_KEY, next);
    } catch {
      /* private mode: the choice just does not persist */
    }
  }, []);

  const value = useMemo(
    () => ({ choice, theme, isDark: theme === "dark", set }),
    [choice, theme, set]
  );

  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

export function useTheme() {
  return useContext(ThemeCtx);
}

/* ──────────────────────────────────────────────────────────────────────────
   The control. A three-way segmented switch rather than a binary toggle,
   because "follow my system" is a real choice and hiding it is a lie.
   ────────────────────────────────────────────────────────────────────────── */

const OPTIONS: { value: ThemeChoice; label: string; Icon: typeof Sun }[] = [
  { value: "light", label: "Light", Icon: Sun },
  { value: "system", label: "System", Icon: Monitor },
  { value: "dark", label: "Dark", Icon: Moon },
];

export function ThemeToggle({ className }: { className?: string }) {
  const { choice, set } = useTheme();

  return (
    <div
      role="radiogroup"
      aria-label="Colour theme"
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full glass-chip p-0.5",
        className
      )}
    >
      {OPTIONS.map(({ value, label, Icon }) => {
        const active = choice === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={label}
            title={label}
            onClick={() => set(value)}
            className={
              "grid size-7 place-items-center rounded-full transition-[background-color,color,box-shadow] duration-150 ease-out " +
              (active
                ? "bg-surface text-ink shadow-[var(--sh-1)]"
                : "text-ink-3 hover:text-ink")
            }
          >
            <Icon className="size-[15px]" strokeWidth={1.75} aria-hidden />
          </button>
        );
      })}
    </div>
  );
}
