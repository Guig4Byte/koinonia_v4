"use client";

import type { HTMLAttributes, ReactNode, Ref } from "react";
import { cn } from "@/lib/cn";
import styles from "./bottom-sheet.module.css";

export type BottomSheetSize = "sm" | "md";
export type BottomSheetTone = "default" | "accent";

type BottomSheetProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  dismissLabel?: string;
  onDismiss: () => void;
  panelClassName?: string;
  panelProps?: HTMLAttributes<HTMLDivElement>;
  panelRef?: Ref<HTMLDivElement>;
  showHandle?: boolean;
  size?: BottomSheetSize;
  tone?: BottomSheetTone;
};

const panelSizeClass: Record<BottomSheetSize, string> = {
  sm: styles.panelSm,
  md: styles.panelMd,
};

export function BottomSheet({
  children,
  className,
  dismissLabel = "Fechar",
  onDismiss,
  panelClassName,
  panelProps,
  panelRef,
  showHandle = true,
  size = "md",
  tone = "default",
  ...props
}: BottomSheetProps) {
  const { className: panelPropsClassName, ...restPanelProps } = panelProps ?? {};

  return (
    <div className={cn(styles.layer, className)} role="presentation" {...props}>
      <button type="button" className={styles.backdrop} aria-label={dismissLabel} onClick={onDismiss} />
      <div
        ref={panelRef}
        className={cn(styles.panel, panelSizeClass[size], tone === "accent" && styles.panelAccent, panelClassName, panelPropsClassName)}
        {...restPanelProps}
      >
        {showHandle ? <div className={styles.handle} aria-hidden="true" /> : null}
        {children}
      </div>
    </div>
  );
}
