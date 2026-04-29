"use client";

import { useEffect } from "react";
import { applyTheme, isTheme, THEME_STORAGE_KEY } from "@/features/theme/theme";

export function ThemeInit() {
  useEffect(() => {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    applyTheme(isTheme(storedTheme) ? storedTheme : "light");
  }, []);

  return null;
}
