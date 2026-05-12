import { Children, type ReactNode } from "react";
import { EmptyState } from "@/components/base-cards";
import { buttonClassName } from "@/components/ui/button";

export function PastoralSectionTitle({ children, detail }: { children: ReactNode; detail?: string }) {
  return (
    <div className="mb-3 mt-7">
      <h2 className="pastoral-section-title">{children}</h2>
      {detail ? <p className="pastoral-section-detail">{detail}</p> : null}
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
    <section className="space-y-3">
      <PastoralSectionTitle detail={detail}>{title}</PastoralSectionTitle>
      <div className="stagger-children space-y-2.5">
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
          <div className="stagger-children mt-3 space-y-2.5">{hiddenChildren}</div>
        </details>
      ) : null}
      {!hasChildren && emptyMessage ? <EmptyState>{emptyMessage}</EmptyState> : null}
    </section>
  );
}
