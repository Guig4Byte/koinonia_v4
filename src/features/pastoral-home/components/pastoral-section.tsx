import { Children, type ReactNode } from "react";
import { EmptyState } from "@/components/shared/base-cards";
import { buttonClassName } from "@/components/ui/button";
import styles from "./pastoral-section.module.css";

export function PastoralSectionTitle({ children, detail }: { children: ReactNode; detail?: string }) {
  return (
    <div className="mb-3">
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
        <details className="group rounded-2xl border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-3 shadow-card">
          <summary
            className={buttonClassName({
              variant: "secondary",
              size: "sm",
              fullWidth: true,
              className: "cursor-pointer list-none rounded-xl [&::-webkit-details-marker]:hidden",
            })}
          >
            <span className="group-open:hidden">{moreLabel}</span>
            <span className="hidden group-open:inline">Mostrar menos</span>
          </summary>
          <div className={`stagger-children mt-3 ${styles.cards}`}>{hiddenChildren}</div>
        </details>
      ) : null}
      {!hasChildren && emptyMessage ? <EmptyState>{emptyMessage}</EmptyState> : null}
    </section>
  );
}
