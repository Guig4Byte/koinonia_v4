import type { ElementType, ReactNode } from "react";
import { Badge, type BadgeMaxWidth, type BadgeShape, type BadgeSize, type BadgeTone } from "@/components/ui/badge";
import { cn } from "@/lib/cn";

type CardHeaderProps = {
  title: ReactNode;
  subtitle?: ReactNode;
  detail?: ReactNode;
  eyebrow?: ReactNode;
  badgeLabel?: ReactNode;
  badgeTone?: BadgeTone;
  badgeClassName?: string;
  badgeSize?: BadgeSize;
  badgeShape?: BadgeShape;
  badgeMaxWidth?: BadgeMaxWidth;
  badgeTruncate?: boolean;
  action?: ReactNode;
  as?: ElementType;
  className?: string;
  contentClassName?: string;
  titleClassName?: string;
  subtitleClassName?: string;
  detailClassName?: string;
  eyebrowClassName?: string;
};

export function CardHeader({
  title,
  subtitle,
  detail,
  eyebrow,
  badgeLabel,
  badgeTone = "neutral",
  badgeClassName,
  badgeSize,
  badgeShape,
  badgeMaxWidth = "header",
  badgeTruncate,
  action,
  as: Title = "p",
  className,
  contentClassName,
  titleClassName,
  subtitleClassName,
  detailClassName,
  eyebrowClassName,
}: CardHeaderProps) {
  const trailing = action ?? (badgeLabel ? (
    <Badge
      tone={badgeTone}
      size={badgeSize}
      shape={badgeShape}
      maxWidth={badgeMaxWidth}
      truncate={badgeTruncate}
      className={badgeClassName}
    >
      {badgeLabel}
    </Badge>
  ) : null);

  return (
    <div className={cn("k-card-header-row", className)}>
      <div className={cn("min-w-0", contentClassName)}>
        {eyebrow ? (
          <p className={cn("text-[length:var(--text-sm)] font-semibold uppercase tracking-[0.12em] text-[color:var(--color-text-secondary)]", eyebrowClassName)}>
            {eyebrow}
          </p>
        ) : null}
        <Title className={cn("k-item-title", titleClassName)}>{title}</Title>
        {subtitle ? (
          <p className={cn(subtitleClassName ?? "mt-0.5 text-[length:var(--text-sm)] leading-relaxed text-[color:var(--color-text-secondary)]")}>
            {subtitle}
          </p>
        ) : null}
        {detail ? <div className={cn(detailClassName ?? "k-item-detail-tight")}>{detail}</div> : null}
      </div>
      {trailing}
    </div>
  );
}
