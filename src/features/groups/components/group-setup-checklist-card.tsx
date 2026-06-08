import { ArrowRight, CheckCircle2, Circle } from "lucide-react";
import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import type { GroupSetupChecklist } from "@/features/groups/group-setup-checklist";

export function GroupSetupChecklistCard({
  checklist,
  className,
  showAction = true,
}: {
  checklist: GroupSetupChecklist;
  className?: string;
  showAction?: boolean;
}) {
  return (
    <Card
      as="section"
      padding="md"
      radius="lg"
      containment="hidden"
      surface="accentHalo"
      accentTone="presence"
      className={cn("space-y-3", className)}
    >
      <div className="space-y-1">
        <p className="k-eyebrow">{checklist.groupName}</p>
        <h2 className="font-serif-display text-[length:var(--text-xl)] font-semibold leading-tight tracking-normal text-[color:var(--color-text-primary)]">
          {checklist.title}
        </h2>
        <p className="text-[length:var(--text-sm)] leading-relaxed text-[color:var(--color-text-secondary)]">
          {checklist.detail}
        </p>
      </div>

      <ul className="space-y-2" aria-label={`Checklist de implantação da ${checklist.groupName}`}>
        {checklist.items.map((item) => {
          const Icon = item.complete ? CheckCircle2 : Circle;

          return (
            <li key={item.key} className="flex items-center gap-2.5 text-[length:var(--text-sm)] leading-snug text-[color:var(--color-text-secondary)]">
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0",
                  item.complete ? "text-[color:var(--color-metric-presenca)]" : "text-[color:var(--color-text-muted)]",
                )}
                aria-hidden="true"
              />
              <span className={item.complete ? "text-[color:var(--color-text-primary)]" : undefined}>{item.label}</span>
            </li>
          );
        })}
      </ul>

      {showAction ? (
        <ButtonLink
          href={checklist.action.href}
          variant="actionPillSecondary"
          size="sm"
          density="actionPill"
          responsiveWidth="fullUntilSm"
        >
          {checklist.action.label}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </ButtonLink>
      ) : null}
    </Card>
  );
}
