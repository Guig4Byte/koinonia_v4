import { Clock3, Heart } from "lucide-react";
import type { BadgeTone } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import styles from "./signal-heart-indicator.module.css";

function normalizeStatusLabel(label: string) {
  return label
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function compactStatusLabel(label: string) {
  const normalized = normalizeStatusLabel(label);

  if (normalized.includes("presenca")) return normalized.includes("baixa") ? "Presença baixa" : "Sem presença";
  if (normalized.includes("apoio")) return "Apoio";
  if (normalized.includes("urgente") || normalized.includes("cuidado proximo")) return "Urgente";
  if (normalized.includes("atencao")) return "Atenção";
  if (normalized.includes("encaminhado")) return "Encaminhado";
  if (normalized.includes("cuidado pastoral")) return "Encaminhado";
  if (normalized.includes("cuidado")) return "Em cuidado";
  if (normalized.includes("estavel")) return "Estável";

  return label;
}

export function SignalHeartIndicator({
  tone = "neutral",
  size = "sm",
  label = "Sinal pastoral",
  showLabel = false,
  displayLabel,
  className,
}: {
  tone?: BadgeTone;
  size?: "sm" | "md";
  label?: string;
  showLabel?: boolean;
  displayLabel?: string;
  className?: string;
}) {
  const isPresenceStatus = normalizeStatusLabel(label).includes("presenca");
  const visibleLabel = displayLabel ?? compactStatusLabel(label);

  return (
    <span
      className={cn(styles.signalHeart, styles[tone], styles[size], showLabel && styles.withLabel, className)}
      role="img"
      aria-label={label}
    >
      <span className={styles.pulseLeft} aria-hidden="true" />
      <span className={styles.core}>
        {isPresenceStatus ? (
          <Clock3 className={styles.icon} aria-hidden="true" />
        ) : (
          <Heart className={styles.icon} aria-hidden="true" />
        )}
      </span>
      <span className={styles.pulseRight} aria-hidden="true" />
      {showLabel ? <span className={styles.label} aria-hidden="true">{visibleLabel}</span> : null}
    </span>
  );
}
