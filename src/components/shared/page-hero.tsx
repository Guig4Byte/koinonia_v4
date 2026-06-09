import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function PageHero({
  eyebrow,
  title,
  description,
  action,
  meta,
  compact = false,
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  meta?: ReactNode;
  compact?: boolean;
  className?: string;
}) {
  return (
    <section className={cn("k-page-hero", compact && "k-page-hero-compact", className)}>
      <div className="k-page-hero-content">
        <div className="k-page-hero-copy min-w-0">
          {eyebrow ? <p className="k-page-hero-eyebrow">{eyebrow}</p> : null}
          <h2 className="k-page-hero-title">{title}</h2>
          {description ? <p className="k-page-hero-description">{description}</p> : null}
        </div>
        {action ? <div className="k-page-hero-action">{action}</div> : null}
      </div>
      {meta ? <div className="k-page-hero-meta">{meta}</div> : null}
    </section>
  );
}
