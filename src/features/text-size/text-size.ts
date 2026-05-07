export const textSizes = ["normal", "large", "extra-large"] as const;
export type TextSize = (typeof textSizes)[number];

const STORAGE_KEY = "koinonia-text-size";

export function getStoredTextSize(): TextSize {
  if (typeof window === "undefined") return "normal";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return textSizes.includes(stored as TextSize) ? (stored as TextSize) : "normal";
}

export function setStoredTextSize(size: TextSize): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, size);
}

export function applyTextSize(size: TextSize): void {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-text-size", size);
}

export function getNextTextSize(size: TextSize): TextSize {
  const index = textSizes.indexOf(size);
  return textSizes[(index + 1) % textSizes.length];
}

export function textSizeLabel(size: TextSize): string {
  if (size === "extra-large") return "Muito grande";
  if (size === "large") return "Grande";
  return "Normal";
}
