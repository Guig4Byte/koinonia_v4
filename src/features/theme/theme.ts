export const THEME_STORAGE_KEY = "koinonia-theme";

export const themes = ["light", "parchment", "dark"] as const;

export type Theme = (typeof themes)[number];

const themeValues = new Set<string>(themes);

export function isTheme(value: unknown): value is Theme {
  return typeof value === "string" && themeValues.has(value);
}

export function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute("data-theme", theme);
  document.documentElement.style.colorScheme = theme === "dark" ? "dark" : "light";
}

export function getNextTheme(theme: Theme): Theme {
  const index = themes.indexOf(theme);
  return themes[(index + 1) % themes.length];
}
