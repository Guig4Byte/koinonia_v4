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
      <p className="k-item-title-sm">{title}</p>
      {description ? <p className="k-item-detail">{description}</p> : null}
      <div className="mt-2">{children}</div>
    </Card>
  );
}
