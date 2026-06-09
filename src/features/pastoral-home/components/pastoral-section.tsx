import { Children, type ReactNode } from "react";
import { EmptyState } from "@/components/shared/base-cards";
import { DisclosureCard } from "@/components/ui/disclosure-card";
import { cn } from "@/lib/cn";
import styles from "./pastoral-section.module.css";

export type PastoralSectionTone = "default" | "risk" | "quiet";

export function PastoralSectionTitle({ children, detail, tone = "default" }: { children: ReactNode; detail?: string; tone?: PastoralSectionTone }) {
  return (
    <div
      className={cn(
        "mb-3",
        styles.titleWrap,
        tone === "risk" && styles.titleWrapRisk,
        tone === "quiet" && styles.titleWrapQuiet,
      )}
    >
      <h2 className={styles.title}>{children}</h2>
      {detail ? <p className={styles.detail}>{detail}</p> : null}
    </div>
  );
}

export function PastoralListSection({
  title,
  detail,
  children,
  hiddenChildren,
  emptyMessage,
  moreLabel = "Ver mais",
  tone = "default",
}: {
  title: ReactNode;
  detail?: string;
  children?: ReactNode;
  hiddenChildren?: ReactNode;
  emptyMessage?: string;
  moreLabel?: string;
  tone?: PastoralSectionTone;
}) {
  const hasChildren = Children.count(children) > 0;
  const hasHiddenChildren = Children.count(hiddenChildren) > 0;

  return (
    <section className={cn(styles.section, tone === "risk" && styles.sectionRisk, tone === "quiet" && styles.sectionQuiet)}>
      <PastoralSectionTitle detail={detail} tone={tone}>{title}</PastoralSectionTitle>
      <div className={`stagger-children ${styles.cards}`}>
        {children}
      </div>
      {hasHiddenChildren ? (
        <DisclosureCard
          title={
            <>
              <span className="group-open:hidden">{moreLabel}</span>
              <span className="hidden group-open:inline">Mostrar menos</span>
            </>
          }
          tone="default"
          size="sm"
          separatedContent
          action={false}
          className="group"
          contentClassName={`stagger-children ${styles.cards}`}
        >
          {hiddenChildren}
        </DisclosureCard>
      ) : null}
      {!hasChildren && emptyMessage ? <EmptyState>{emptyMessage}</EmptyState> : null}
    </section>
  );
}
