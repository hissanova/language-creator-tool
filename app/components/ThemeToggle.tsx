"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Theme = "system" | "light" | "dark";

const STORAGE_KEY = "lct:theme";

function isTheme(value: string | null): value is Theme {
  return value === "system" || value === "light" || value === "dark";
}

function readStoredTheme(): Theme {
  if (typeof window === "undefined") return "system";
  const stored = localStorage.getItem(STORAGE_KEY);
  return isTheme(stored) ? stored : "system";
}

/** Pure: which html-element class, if any, a theme corresponds to. */
function getThemeClassName(theme: Theme): "dark" | "light" | null {
  if (theme === "dark") return "dark";
  if (theme === "light") return "light";
  return null; // system -> no class, relies on prefers-color-scheme
}

function applyTheme(theme: Theme) {
  const html = document.documentElement;
  html.classList.remove("dark");
  html.classList.remove("light");

  const className = getThemeClassName(theme);
  if (className) html.classList.add(className);
}

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(readStoredTheme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  function setTheme(next: Theme) {
    setThemeState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }

  return <ThemeContext value={{ theme, setTheme }}>{children}</ThemeContext>;
}

export function useViewerTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error("useViewerTheme must be used within ThemeProvider");
  return value;
}
