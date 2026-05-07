"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  applyTextSize,
  getNextTextSize,
  getStoredTextSize,
  setStoredTextSize,
  textSizeLabel,
  type TextSize,
} from "@/features/text-size/text-size";

function subscribe(callback: () => void) {
  const handler = (event: StorageEvent) => {
    if (event.key === "koinonia-text-size") callback();
  };
  window.addEventListener("storage", handler);
  return () => window.removeEventListener("storage", handler);
}

function getSnapshot(): TextSize {
  return getStoredTextSize();
}

function getServerSnapshot(): TextSize {
  return "normal";
}

function textSizeVisual(size: TextSize): { letterSize: string; plus: string } {
  if (size === "extra-large") return { letterSize: "text-[15px]", plus: "++" };
  if (size === "large") return { letterSize: "text-[13px]", plus: "+" };
  return { letterSize: "text-[11px]", plus: "" };
}

export function TextSizeToggle({ className }: { className?: string }) {
  const size = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const visual = textSizeVisual(size);

  const toggle = useCallback(() => {
    const next = getNextTextSize(size);
    setStoredTextSize(next);
    applyTextSize(next);
    window.dispatchEvent(new StorageEvent("storage", { key: "koinonia-text-size" }));
  }, [size]);

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Tamanho do texto: ${textSizeLabel(size)}`}
      title={`Tamanho do texto: ${textSizeLabel(size)}`}
      className={className}
    >
      <span className="flex items-baseline leading-none">
        <span className={`font-extrabold ${visual.letterSize}`}>A</span>
        {visual.plus ? (
          <span className="ml-[1px] text-[9px] font-bold">{visual.plus}</span>
        ) : null}
      </span>
    </button>
  );
}
