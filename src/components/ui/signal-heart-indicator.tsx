import { Clock3, Heart } from "lucide-react";
import type { BadgeTone } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import styles from "./signal-heart-indicator.module.css";

export type SignalHeartIndicatorKind = "default" | "presence";

export function SignalHeartIndicator({
  tone = "neutral",
  size = "sm",
  label = "Sinal pastoral",
  showLabel = false,
  displayLabel,
  kind = "default",
  className,
}: {
  tone?: BadgeTone;
  size?: "sm" | "md";
  label?: string;
  showLabel?: boolean;
  displayLabel?: string;
  kind?: SignalHeartIndicatorKind;
  className?: string;
}) {
  const visibleLabel = displayLabel ?? label;
  const Icon = kind === "presence" ? Clock3 : Heart;

  return (
    <span
      className={cn(styles.signalHeart, styles[tone], styles[size], showLabel && styles.withLabel, className)}
      role="img"
      aria-label={label}
    >
      <span className={styles.pulseLeft} aria-hidden="true" />
      <span className={styles.core}>
        <Icon className={styles.icon} aria-hidden="true" />
      </span>
      <span className={styles.pulseRight} aria-hidden="true" />
      {showLabel ? <span className={styles.label} aria-hidden="true">{visibleLabel}</span> : null}
    </span>
  );
}
