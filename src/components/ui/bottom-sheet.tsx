"use client";

import { useSyncExternalStore, type HTMLAttributes, type ReactNode, type Ref } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";
import styles from "./bottom-sheet.module.css";

export type BottomSheetSize = "sm" | "md";
export type BottomSheetTone = "default" | "accent";

export type BottomSheetPlacement = "bottom" | "center";

type BottomSheetProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  dismissLabel?: string;
  onDismiss: () => void;
  panelClassName?: string;
  panelProps?: HTMLAttributes<HTMLDivElement>;
  panelRef?: Ref<HTMLDivElement>;
  placement?: BottomSheetPlacement;
  showHandle?: boolean;
  size?: BottomSheetSize;
  tone?: BottomSheetTone;
};

const panelSizeClass: Record<BottomSheetSize, string> = {
  sm: styles.panelSm,
  md: styles.panelMd,
};

const subscribeToDocumentBody = () => () => undefined;
const getDocumentBody = () => (typeof document === "undefined" ? null : document.body);
const getServerDocumentBody = () => null;

export function BottomSheet({
  children,
  className,
  dismissLabel = "Fechar",
  onDismiss,
  panelClassName,
  panelProps,
  panelRef,
  placement = "bottom",
  showHandle = true,
  size = "md",
  tone = "default",
  ...props
}: BottomSheetProps) {
  const portalContainer = useSyncExternalStore(subscribeToDocumentBody, getDocumentBody, getServerDocumentBody);
  const { className: panelPropsClassName, ...restPanelProps } = panelProps ?? {};

  const sheet = (
    <div
      className={cn(styles.layer, placement === "center" && styles.layerCenter, className)}
      role="presentation"
      {...props}
    >
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

  if (!portalContainer) return null;

  return createPortal(sheet, portalContainer);
}
