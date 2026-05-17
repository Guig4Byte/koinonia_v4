"use client";

import { useEffect, useRef, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import styles from "./fixed-action-bar.module.css";

export type FixedActionBarTone = "default" | "muted";

type FixedActionBarProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  reserveSpace?: boolean;
  surfaceClassName?: string;
  tone?: FixedActionBarTone;
};

type FixedActionBarContentProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

const heightVariableName = "--fixed-action-bar-height";

export function FixedActionBar({
  children,
  className,
  reserveSpace = true,
  surfaceClassName,
  tone = "default",
  ...props
}: FixedActionBarProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!reserveSpace || typeof window === "undefined") {
      return undefined;
    }

    const root = rootRef.current;

    if (!root) {
      return undefined;
    }

    const setReservedHeight = () => {
      document.documentElement.style.setProperty(heightVariableName, `${Math.ceil(root.getBoundingClientRect().height)}px`);
    };

    setReservedHeight();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", setReservedHeight);

      return () => {
        window.removeEventListener("resize", setReservedHeight);
        document.documentElement.style.removeProperty(heightVariableName);
      };
    }

    const observer = new ResizeObserver(setReservedHeight);
    observer.observe(root);
    window.addEventListener("resize", setReservedHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", setReservedHeight);
      document.documentElement.style.removeProperty(heightVariableName);
    };
  }, [reserveSpace]);

  return (
    <div ref={rootRef} className={cn(styles.root, className)} {...props}>
      <div className={cn(styles.surface, tone === "muted" && styles.surfaceMuted, surfaceClassName)}>{children}</div>
    </div>
  );
}

export function FixedActionBarContent({ children, className, ...props }: FixedActionBarContentProps) {
  return (
    <div className={cn(styles.contentInset, className)} {...props}>
      {children}
    </div>
  );
}
