import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import type { BadgeTone } from "@/components/ui/badge";
import { SignalHeartIndicator } from "@/components/ui/signal-heart-indicator";
import { PriorityCard } from "@/components/ui/priority-card";
import type { CardPriorityTone } from "@/lib/card-priority";
import { cn } from "@/lib/cn";
import styles from "./person-signal-card.module.css";

export type PersonSignalCardActionDisplay = "icon" | "footer";
export type PersonSignalCardEmphasis = "default" | "strong" | "subtle";

function signalCardPriorityTone(resolvedBadgeTone: BadgeTone, severity: "ok" | "warn" | "risk" | "info"): CardPriorityTone | undefined {
  if (resolvedBadgeTone !== "neutral" && resolvedBadgeTone !== "ok" && resolvedBadgeTone !== "info") {
    return resolvedBadgeTone;
  }

  if (severity === "risk") return "risk";
  if (severity === "warn") return "warn";
  return undefined;
}

export function PersonSignalCard(props: {
  name: string;
  context?: string;
  reason?: string;
  severity?: "ok" | "warn" | "risk" | "info";
  badgeLabel?: string;
  badgeTone?: BadgeTone;
  detailHref?: string;
  href?: string;
  ctaLabel?: string;
  actionDisplay?: PersonSignalCardActionDisplay;
  emphasis?: PersonSignalCardEmphasis;
}) {
  const {
    name,
    context,
    reason,
    severity = "risk",
    badgeLabel,
    badgeTone,
    detailHref,
    href,
    ctaLabel = "Acompanhar pessoa",
    actionDisplay = "icon",
    emphasis = "default",
  } = props;
  const resolvedBadgeTone = badgeTone ?? (severity === "risk" ? "risk" : severity === "ok" ? "ok" : severity === "info" ? "info" : "warn");
  const resolvedSignalLabel = badgeLabel ?? (severity === "risk" ? "Urgente" : "Em atenção");
  const cardHref = detailHref ?? href;
  const priorityTone = signalCardPriorityTone(resolvedBadgeTone, severity);
  const showIconAction = Boolean(cardHref) && actionDisplay === "icon";
  const showFooterAction = Boolean(cardHref) && actionDisplay === "footer";
  const normalizedContext = context?.trim();

  const content = (
    <PriorityCard
      priorityTone={priorityTone}
      padding="none"
      minHeight={reason || showFooterAction ? "sm" : "none"}
      containment="hidden"
      surface={emphasis === "strong" ? "spotlightCompact" : "default"}
      interactive={Boolean(cardHref)}
      className={cn(
        "group",
        styles.card,
        emphasis === "strong" && styles.strong,
        emphasis === "subtle" && styles.subtle,
        showIconAction && styles.iconMode,
        !normalizedContext && !reason && styles.singleLine,
      )}
    >
      <div className={styles.body}>
        <Avatar name={name} size="sm" className={styles.avatar} />
        <div className={styles.copy}>
          <div className={styles.headerRow}>
            <div className={styles.identity}>
              <p className={styles.name}>{name}</p>
              {normalizedContext ? <p className={styles.context}>{normalizedContext}</p> : null}
            </div>
            <span className={styles.headerActions}>
              <SignalHeartIndicator tone={resolvedBadgeTone} size="sm" label={resolvedSignalLabel} className={styles.signalIndicator} />
              {showIconAction ? (
                <span className={styles.iconAction} aria-hidden="true">
                  <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.35} />
                </span>
              ) : null}
            </span>
          </div>
          {reason ? <p className={styles.reason}>{reason}</p> : null}
        </div>
      </div>

      {showFooterAction ? (
        <div className={styles.footer} aria-hidden="true">
          <span className={styles.action}>
            {ctaLabel}
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.35} />
          </span>
        </div>
      ) : null}
    </PriorityCard>
  );

  return cardHref ? (
    <Link href={cardHref} aria-label={`${ctaLabel}: ${name}`} className="block min-w-0 max-w-full">
      {content}
    </Link>
  ) : content;
}
