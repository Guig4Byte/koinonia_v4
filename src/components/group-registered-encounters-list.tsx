import Link from "next/link";
import { CalendarCheck2, UsersRound } from "lucide-react";
import type { CSSProperties } from "react";
import { EmptyState, SectionTitle } from "@/components/cards";
import { AttendanceStatus } from "@/generated/prisma/client";
import { ProgressiveList } from "@/components/progressive-list";
import { type BadgeTone } from "@/components/ui/badge";
import { presenceTone } from "@/features/events/presence-display";
import { summarizeEventPresence } from "@/features/events/presence-summary";
import { formatShortDate, formatTime } from "@/lib/format";

export type GroupRegisteredEncounter = {
  id: string;
  startsAt: Date;
  status: string;
  attendances: Array<{
    status: AttendanceStatus;
  }>;
};

function encounterToneVars(tone: BadgeTone): CSSProperties {
  if (tone === "risk") {
    return {
      "--encounter-tone": "var(--color-badge-risco-text)",
      "--encounter-tone-soft": "var(--color-badge-risco-bg)",
    } as CSSProperties;
  }

  if (tone === "warn") {
    return {
      "--encounter-tone": "var(--color-badge-atencao-text)",
      "--encounter-tone-soft": "var(--color-badge-atencao-bg)",
    } as CSSProperties;
  }

  if (tone === "ok") {
    return {
      "--encounter-tone": "var(--color-metric-presenca)",
      "--encounter-tone-soft": "var(--color-badge-estavel-bg)",
    } as CSSProperties;
  }

  return {
    "--encounter-tone": "var(--color-text-secondary)",
    "--encounter-tone-soft": "var(--surface-alt)",
  } as CSSProperties;
}

export function GroupRegisteredEncountersList({ events }: { events: GroupRegisteredEncounter[] }) {
  return (
    <section>
      <SectionTitle>Últimos encontros registrados</SectionTitle>
      <div className="group-detail-list">
        <ProgressiveList
          initialCount={4}
          step={4}
          moreLabel="Ver mais encontros"
          lessLabel="Mostrar menos encontros"
        >
          {events.map((event) => {
            const metrics = summarizeEventPresence(event);
            const presenceBadgeTone = presenceTone(metrics.hasPresenceData, metrics.presenceRate);
            const presenceLabel = metrics.hasPresenceData ? `${metrics.presenceRate}%` : "Sem registro";
            const presenceProgress = metrics.hasPresenceData ? metrics.presenceRate : 0;

            return (
              <Link
                key={event.id}
                href={`/eventos/${event.id}`}
                className="group-encounter-card relative min-h-[74px] gap-3 overflow-hidden py-3 pr-4 pl-5"
                style={encounterToneVars(presenceBadgeTone)}
              >
                <span className="absolute inset-y-0 left-0 w-1 bg-[var(--encounter-tone)]" aria-hidden="true" />
                <span
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[var(--encounter-tone-soft)] text-[var(--encounter-tone)]"
                  aria-hidden="true"
                >
                  <CalendarCheck2 className="h-4 w-4" strokeWidth={2.2} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-[var(--color-text-secondary)]">
                    {formatShortDate(event.startsAt)} · {formatTime(event.startsAt)}
                  </span>
                  <span className="mt-2 flex min-w-0 items-center gap-2 text-xs leading-none text-[var(--color-text-muted)]">
                    <span className="h-1 w-24 overflow-hidden rounded-full bg-[var(--color-border-divider)]" aria-hidden="true">
                      <span
                        className="block h-full rounded-full bg-[var(--encounter-tone)]"
                        style={{ width: `${presenceProgress}%` }}
                      />
                    </span>
                    <strong className="min-w-8 font-bold text-[var(--encounter-tone)]">{presenceLabel}</strong>
                    <span className="h-3 w-px bg-[var(--color-border-divider)]" aria-hidden="true" />
                    <span className="flex min-w-0 items-center gap-1 truncate font-medium text-[var(--color-text-secondary)]">
                      <UsersRound className="h-3 w-3 shrink-0" strokeWidth={1.8} aria-hidden="true" />
                      {metrics.visitorCount} {metrics.visitorCount === 1 ? "visitante" : "visitantes"}
                    </span>
                  </span>
                </span>
                <span className="shrink-0 self-center text-xs font-semibold text-[var(--color-text-secondary)]">
                  Abrir →
                </span>
              </Link>
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
