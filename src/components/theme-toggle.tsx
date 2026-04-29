"use client";

import { Moon, ScrollText, Sun, type LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { applyTheme, getNextTheme, isTheme, THEME_STORAGE_KEY, type Theme } from "@/features/theme/theme";

const themeMeta: Record<Theme, { label: string; Icon: LucideIcon }> = {
  light: { label: "Claro", Icon: Sun },
  parchment: { label: "Pergaminho", Icon: ScrollText },
  dark: { label: "Escuro", Icon: Moon },
};

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  return isTheme(stored) ? stored : "light";
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const initialTheme = getInitialTheme();
    setTheme(initialTheme);
    applyTheme(initialTheme);
  }, []);

  function toggleTheme() {
    const nextTheme = getNextTheme(theme);
    setTheme(nextTheme);
    window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    applyTheme(nextTheme);
  }

  const { Icon, label } = themeMeta[theme];
  const nextLabel = themeMeta[getNextTheme(theme)].label;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Tema atual: ${label}. Alternar para ${nextLabel}.`}
      title={`Tema: ${label}`}
      className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--color-theme-icon-active-border)] bg-[var(--color-theme-icon-active-bg)] text-[var(--color-text-on-header)] transition active:scale-95"
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
