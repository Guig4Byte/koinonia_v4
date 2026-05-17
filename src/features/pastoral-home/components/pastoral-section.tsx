import { Children, type ReactNode } from "react";
import { EmptyState } from "@/components/shared/base-cards";
import { DisclosureCard } from "@/components/ui/disclosure-card";
import styles from "./pastoral-section.module.css";

export function PastoralSectionTitle({ children, detail }: { children: ReactNode; detail?: string }) {
  return (
    <div className={`mb-3 ${styles.titleWrap}`}>
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
}: {
  title: ReactNode;
  detail?: string;
  children?: ReactNode;
  hiddenChildren?: ReactNode;
  emptyMessage?: string;
  moreLabel?: string;
}) {
  const hasChildren = Children.count(children) > 0;
  const hasHiddenChildren = Children.count(hiddenChildren) > 0;

  return (
    <section className={styles.section}>
      <PastoralSectionTitle detail={detail}>{title}</PastoralSectionTitle>
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
