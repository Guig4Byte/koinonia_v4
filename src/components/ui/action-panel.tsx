import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";

type ActionPanelProps = {
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function ActionPanel({ title, description, children, className }: ActionPanelProps) {
  return (
    <Card tone="inset" padding="sm" radius="sm" className={className}>
      <p className="text-[length:var(--text-sm)] font-semibold text-[color:var(--color-text-primary)]">{title}</p>
      {description ? (
        <p className="mt-1 text-[length:var(--text-xs)] leading-relaxed text-[color:var(--color-text-secondary)]">
          {description}
        </p>
      ) : null}
      <div className="mt-2">{children}</div>
    </Card>
  );
}
