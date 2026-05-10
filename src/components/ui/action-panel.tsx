import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";

type ActionPanelProps = {
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function ActionPanel({ title, description, children, className }: ActionPanelProps) {
  return (
    <Card tone="inset" padding="sm" className={cn("rounded-2xl", className)}>
      <p className="text-sm font-semibold text-[var(--color-text-primary)]">{title}</p>
      {description ? <p className="mt-1 text-xs leading-relaxed text-[var(--color-text-secondary)]">{description}</p> : null}
      <div className="mt-2">{children}</div>
    </Card>
  );
}
