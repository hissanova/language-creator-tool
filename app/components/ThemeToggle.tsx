"use client";

import { useEffect, useState } from "react";

type Theme = "system" | "light" | "dark";

const STORAGE_KEY = "lct:theme";

export default function ThemeToggle() {
  const [theme, setThemeState] = useState<Theme>("system");

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    const initial = (stored as Theme) ?? "system";
    setThemeState(initial);
    applyTheme(initial);
  }, []);

  function applyTheme(t: Theme) {
    const html = document.documentElement;
    html.classList.remove("dark");
    html.classList.remove("light");

    if (t === "dark") html.classList.add("dark");
    else if (t === "light") html.classList.add("light");
    // system -> no class, relies on prefers-color-scheme
  }

  function onChange(next: Theme) {
    setThemeState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch (e) {
      /* ignore */
    }
    applyTheme(next);
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
