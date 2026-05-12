import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function SectionHeader({
  title,
  detail,
  className,
}: {
  title: ReactNode;
  detail?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-2 mt-6", className)}>
      <h2 className="k-section-kicker">{title}</h2>
      {detail ? <p className="k-supporting-copy">{detail}</p> : null}
    </div>
  );
}
