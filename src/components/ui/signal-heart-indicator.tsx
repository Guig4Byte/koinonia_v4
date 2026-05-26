import { Heart } from "lucide-react";
import type { BadgeTone } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import styles from "./signal-heart-indicator.module.css";

export function SignalHeartIndicator({
  tone = "neutral",
  size = "sm",
  label = "Sinal pastoral",
  className,
}: {
  tone?: BadgeTone;
  size?: "sm" | "md";
  label?: string;
  className?: string;
}) {
  return (
    <span className={cn(styles.signalHeart, styles[tone], styles[size], className)} role="img" aria-label={label}>
      <span className={styles.pulseLeft} aria-hidden="true" />
      <span className={styles.core}>
        <Heart className={styles.icon} aria-hidden="true" />
      </span>
      <span className={styles.pulseRight} aria-hidden="true" />
    </span>
  );
}
