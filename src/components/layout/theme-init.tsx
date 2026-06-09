"use client";

import { useEffect } from "react";
import { applyTheme, isTheme, THEME_STORAGE_KEY, themes } from "@/features/theme/theme";

const themeInitScript = `(() => {
  try {
    const themes = ${JSON.stringify(themes)};
    const storedTheme = window.localStorage.getItem("${THEME_STORAGE_KEY}");
    const theme = themes.includes(storedTheme) ? storedTheme : "light";
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.style.colorScheme = theme === "dark" ? "dark" : "light";
  } catch (_) {
    document.documentElement.setAttribute("data-theme", "light");
    document.documentElement.style.colorScheme = "light";
  }
})();`;

export function ThemeInit() {
  useEffect(() => {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    applyTheme(isTheme(storedTheme) ? storedTheme : "light");
  }, []);

  return <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />;
}
