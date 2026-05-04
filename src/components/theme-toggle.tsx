"use client";

import { Moon, ScrollText, Sun, type LucideIcon } from "lucide-react";
import { useSyncExternalStore } from "react";
import { applyTheme, getNextTheme, isTheme, THEME_STORAGE_KEY, type Theme } from "@/features/theme/theme";

type ThemeToggleVariant = "header" | "card";

const THEME_CHANGE_EVENT = "koinonia-theme-change";

const themeMeta: Record<Theme, { label: string; Icon: LucideIcon }> = {
  light: { label: "Claro", Icon: Sun },
  parchment: { label: "Pergaminho", Icon: ScrollText },
  dark: { label: "Escuro", Icon: Moon },
};

function readStoredTheme(): Theme {
  if (typeof window === "undefined") return "light";

  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  return isTheme(stored) ? stored : "light";
}

function subscribeToThemeChange(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(THEME_CHANGE_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(THEME_CHANGE_EVENT, onStoreChange);
  };
}

function getThemeSnapshot(): Theme {
  return readStoredTheme();
}

function getServerThemeSnapshot(): Theme {
  return "light";
}

export function ThemeToggle({
  variant = "header",
  showLabel = false,
  className = "",
}: {
  variant?: ThemeToggleVariant;
  showLabel?: boolean;
  className?: string;
}) {
  const theme = useSyncExternalStore(subscribeToThemeChange, getThemeSnapshot, getServerThemeSnapshot);

  function toggleTheme() {
    const nextTheme = getNextTheme(theme);

    window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    applyTheme(nextTheme);
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  }

  const { Icon, label } = themeMeta[theme];
  const nextLabel = themeMeta[getNextTheme(theme)].label;
  const variantClass =
    variant === "card"
      ? "theme-toggle-card"
      : "border-[var(--color-theme-icon-active-border)] bg-[var(--color-theme-icon-active-bg)] text-[var(--color-text-on-header)]";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Tema atual: ${label}. Alternar para ${nextLabel}.`}
      title={`Tema: ${label}`}
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-2xl border transition active:scale-95 ${
        showLabel ? "px-3" : "w-10"
      } ${variantClass} ${className}`}
    >
      <Icon className="h-4 w-4" />
      {showLabel ? <span className="text-xs font-bold">{label}</span> : null}
    </button>
  );
}