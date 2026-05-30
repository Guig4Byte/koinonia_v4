import type { DetailsHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";
import styles from "./disclosure-card.module.css";

export type DisclosureCardTone = "default" | "inset" | "accentInset" | "transparent";
export type DisclosureCardSize = "sm" | "md";
export type DisclosureCardLayout = "stacked" | "responsive";

type DisclosureCardProps = Omit<DetailsHTMLAttributes<HTMLDetailsElement>, "children" | "className" | "open" | "title"> & {
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  tone?: DisclosureCardTone;
  size?: DisclosureCardSize;
  layout?: DisclosureCardLayout;
  separatedContent?: boolean;
  closedLabel?: ReactNode;
  openLabel?: ReactNode;
  action?: ReactNode | false;
  className?: string;
  summaryClassName?: string;
  contentClassName?: string;
  titleClassName?: string;
  descriptionClassName?: string;
};

const toneClassName: Record<DisclosureCardTone, string> = {
  default: styles.defaultTone,
  inset: styles.insetTone,
  accentInset: styles.accentInsetTone,
  transparent: styles.transparentTone,
};

const summarySizeClassName: Record<DisclosureCardSize, string> = {
  sm: styles.summarySm,
  md: styles.summaryMd,
};

const contentSizeClassName: Record<DisclosureCardSize, string> = {
  sm: "",
  md: styles.contentMd,
};

export function DisclosureCard({
  title,
  description,
  children,
  defaultOpen = false,
  tone = "default",
  size = "md",
  layout = "responsive",
  separatedContent = false,
  closedLabel = "Mostrar",
  openLabel = "Ocultar",
  action,
  className,
  summaryClassName,
  contentClassName,
  titleClassName,
  descriptionClassName,
  ...props
}: DisclosureCardProps) {
  const openProps = defaultOpen ? { open: true } : {};
  const actionNode = action === false ? null : (
    action ?? (
      <span className={styles.action}>
        <span className={styles.closedLabel}>{closedLabel}</span>
        <span className={styles.openLabel}>{openLabel}</span>
      </span>
    )
  );

  return (
    <details className={cn(styles.details, toneClassName[tone], className)} {...openProps} {...props}>
      <summary
        className={cn(
          styles.summary,
          summarySizeClassName[size],
          layout === "responsive" && styles.summaryResponsive,
          summaryClassName,
        )}
      >
        <span className={styles.header}>
          <span className={cn(styles.title, titleClassName)}>{title}</span>
          {description ? <span className={cn(styles.description, descriptionClassName)}>{description}</span> : null}
        </span>
        {actionNode}
      </summary>
      <div
        className={cn(
          styles.content,
          contentSizeClassName[size],
          separatedContent && styles.contentSeparated,
          contentClassName,
        )}
      >
        {children}
      </div>
    </details>
  );
}
