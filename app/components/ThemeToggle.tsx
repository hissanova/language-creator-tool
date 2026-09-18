"use client";

import { useEffect, useState } from "react";

type Theme = "system" | "light" | "dark";

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

export default function ThemeToggle() {
  const [theme, setThemeState] = useState<Theme>(readStoredTheme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  function onChange(next: Theme) {
    setThemeState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }

  return (
    <label className="inline-flex items-center gap-2 rounded border bg-white px-3 py-2 text-sm text-gray-950 shadow-sm">
      <span className="sr-only">Theme</span>
      <select
        aria-label="Theme"
        value={theme}
        onChange={(e) => onChange(e.target.value as Theme)}
        className="rounded border bg-white px-2 py-1 text-sm text-gray-950"
      >
        <option value="system">System</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </label>
  );
}
