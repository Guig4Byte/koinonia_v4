"use client";

import { useEffect, useSyncExternalStore, type HTMLAttributes, type ReactNode, type Ref } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";
import styles from "./bottom-sheet.module.css";

export type BottomSheetSize = "sm" | "md";
export type BottomSheetTone = "default" | "accent";

export type BottomSheetPlacement = "bottom" | "center";
export type BottomSheetOverflowMode = "auto" | "visibleOnWide";

type BottomSheetProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  dismissLabel?: string;
  onDismiss: () => void;
  panelClassName?: string;
  panelProps?: HTMLAttributes<HTMLDivElement>;
  panelRef?: Ref<HTMLDivElement>;
  placement?: BottomSheetPlacement;
  overflowMode?: BottomSheetOverflowMode;
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

let activeScrollLocks = 0;
let lockedScrollY = 0;
let previousBodyOverflow = "";
let previousBodyPosition = "";
let previousBodyTop = "";
let previousBodyLeft = "";
let previousBodyRight = "";
let previousBodyWidth = "";
let previousDocumentOverflow = "";

function lockDocumentScroll() {
  if (typeof document === "undefined") return () => undefined;

  activeScrollLocks += 1;

  if (activeScrollLocks === 1) {
    const { body, documentElement } = document;
    lockedScrollY = window.scrollY;
    previousBodyOverflow = body.style.overflow;
    previousBodyPosition = body.style.position;
    previousBodyTop = body.style.top;
    previousBodyLeft = body.style.left;
    previousBodyRight = body.style.right;
    previousBodyWidth = body.style.width;
    previousDocumentOverflow = documentElement.style.overflow;

    documentElement.style.overflow = "hidden";
    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${lockedScrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";
  }

  return () => {
    activeScrollLocks = Math.max(0, activeScrollLocks - 1);
    if (activeScrollLocks > 0) return;

    const { body, documentElement } = document;
    documentElement.style.overflow = previousDocumentOverflow;
    body.style.overflow = previousBodyOverflow;
    body.style.position = previousBodyPosition;
    body.style.top = previousBodyTop;
    body.style.left = previousBodyLeft;
    body.style.right = previousBodyRight;
    body.style.width = previousBodyWidth;
    window.scrollTo(0, lockedScrollY);
  };
}

export function BottomSheet({
  children,
  className,
  dismissLabel = "Fechar",
  onDismiss,
  panelClassName,
  panelProps,
  panelRef,
  placement = "bottom",
  overflowMode = "auto",
  showHandle = true,
  size = "md",
  tone = "default",
  ...props
}: BottomSheetProps) {
  const portalContainer = useSyncExternalStore(subscribeToDocumentBody, getDocumentBody, getServerDocumentBody);
  const { className: panelPropsClassName, ...restPanelProps } = panelProps ?? {};

  useEffect(() => lockDocumentScroll(), []);

  const sheet = (
    <div
      className={cn(styles.layer, placement === "center" && styles.layerCenter, className)}
      role="presentation"
      {...props}
    >
      <button type="button" className={styles.backdrop} aria-label={dismissLabel} onClick={onDismiss} />
      <div
        ref={panelRef}
        className={cn(
          styles.panel,
          panelSizeClass[size],
          tone === "accent" && styles.panelAccent,
          overflowMode === "visibleOnWide" && styles.panelVisibleOnWide,
          panelClassName,
          panelPropsClassName,
        )}
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
