import { UsersRound } from "lucide-react";
import { EmptyState, SectionTitle } from "@/components/shared/base-cards";
import { metricTextClass, PresenceIndicator } from "@/components/shared/presence-metric";
import { AttendanceStatus } from "@/generated/prisma/client";
import { ProgressiveList } from "@/components/shared/progressive-list";
import { CardLink } from "@/components/ui/card-link";
import { type BadgeTone } from "@/components/ui/badge";
import type { CardPriorityTone } from "@/lib/card-priority";
import { formatPresenceRate, presenceTone } from "@/features/events/presence-display";
import { summarizeEventPresence } from "@/features/events/presence-summary";
import { countLabel, formatShortDate, formatTime } from "@/lib/format";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/cn";

export type GroupRegisteredEncounter = {
  id: string;
  startsAt: Date;
  status: string;
  attendances: Array<{
    status: AttendanceStatus;
  }>;
};

function encounterPriorityTone(tone: BadgeTone): CardPriorityTone {
  if (tone === "ok") return "stable";
  if (tone === "risk" || tone === "warn" || tone === "care" || tone === "support") return tone;
  return "muted";
}


export function GroupRegisteredEncountersList({ events }: { events: GroupRegisteredEncounter[] }) {
  return (
    <section>
      <SectionTitle>Últimos encontros registrados</SectionTitle>
      <div>
        <ProgressiveList
          initialCount={4}
          step={4}
          moreLabel="Ver mais encontros"
          lessLabel="Mostrar menos encontros"
        >
          {events.map((event) => {
            const metrics = summarizeEventPresence(event);
            const presenceBadgeTone = presenceTone(metrics.hasPresenceData, metrics.presenceRate);
            const presenceLabel = formatPresenceRate(metrics.hasPresenceData, metrics.presenceRate, "Sem registro");
            return (
              <CardLink
                key={event.id}
                href={ROUTES.event(event.id)}
                padding="sm"
                radius="sm"
                containment="hidden"
                minHeight="sm"
                accent="left"
                priorityTone={encounterPriorityTone(presenceBadgeTone)}
                className="flex items-center gap-3"
              >
                <PresenceIndicator
                  hasPresenceData={metrics.hasPresenceData}
                  presenceRate={metrics.presenceRate}
                  tone={presenceBadgeTone}
                  context="event"
                  size="compact"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[length:var(--text-sm)] font-bold text-[color:var(--color-text-secondary)]">
                    {formatShortDate(event.startsAt)} · {formatTime(event.startsAt)}
                  </span>
                  <span className="mt-2 flex min-w-0 items-center gap-2 text-[length:var(--text-xs)] leading-none text-[color:var(--color-text-muted)]">
                    <strong className={cn("shrink-0 font-extrabold tabular-nums", metricTextClass(presenceBadgeTone))}>
                      {presenceLabel}
                    </strong>
                    <span className="h-3 w-px bg-[var(--color-border-divider)]" aria-hidden="true" />
                    <span className="flex min-w-0 items-center gap-1 truncate font-medium text-[color:var(--color-text-secondary)]">
                      <UsersRound className="h-3 w-3 shrink-0" strokeWidth={1.8} aria-hidden="true" />
                      {countLabel(metrics.visitorCount, "visitante", "visitantes")}
                    </span>
                  </span>
                </span>
                <span className="shrink-0 self-center text-[length:var(--text-xs)] font-semibold text-[color:var(--color-text-secondary)]">
                  Abrir →
                </span>
              </CardLink>
            );
          })}
        </ProgressiveList>
        {events.length === 0 ? (
          <EmptyState compact>Ainda não há encontros registrados para resumir presença.</EmptyState>
        ) : null}
      </div>
    </section>
  );
}
