"use client";

import { useEffect } from "react";

const STORAGE_KEY = "koinonia-theme";
const themes = ["light", "parchment", "dark"] as const;

type Theme = (typeof themes)[number];

function isTheme(value: string | null): value is Theme {
  return themes.includes(value as Theme);
}

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
  document.documentElement.style.colorScheme = theme === "dark" ? "dark" : "light";
}

export function ThemeInit() {
  useEffect(() => {
    const storedTheme = window.localStorage.getItem(STORAGE_KEY);
    applyTheme(isTheme(storedTheme) ? storedTheme : "light");
  }, []);

  return null;
}
