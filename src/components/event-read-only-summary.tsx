import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  buildEventReadOnlyAttendanceView,
  eventAttendanceLabels,
  eventAttendanceStatusTone,
  eventReadOnlyEmptyMessage,
  sortPeopleByName,
} from "@/features/events/event-detail-view";
import type { EventAttendanceGroup, EventReadOnlyMember, EventReadOnlyVisitor } from "@/features/events/event-detail-view";
import { ROUTES } from "@/lib/routes";

function AttendanceMemberRow({ member }: { member: EventReadOnlyMember }) {
  return (
    <Link
      href={ROUTES.person(member.personId)}
      className="flex items-center justify-between gap-3 rounded-2xl bg-[var(--metric-card-bg)] px-3 py-2 transition active:scale-[0.99]"
    >
      <span className="min-w-0 text-sm font-medium text-[var(--color-text-primary)]">{member.fullName}</span>
      <Badge tone={eventAttendanceStatusTone(member.currentStatus)} className="px-2 py-0.5 text-[11px]">
        {member.currentStatus ? eventAttendanceLabels[member.currentStatus] : "Pendente"}
      </Badge>
    </Link>
  );
}

function AttendanceGroup({ group }: { group: EventAttendanceGroup }) {
  if (group.members.length === 0) return null;

  return (
    <div className="space-y-2">
      <div>
        <p className="text-sm font-semibold text-[var(--color-text-primary)]">{group.title}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-[var(--color-text-secondary)]">{group.description}</p>
      </div>
      <div className="space-y-1.5">
        {group.members.map((member) => (
          <AttendanceMemberRow key={member.personId} member={member} />
        ))}
      </div>
    </div>
  );
}

export function EventReadOnlySummary({
  completed,
  isFutureEvent,
  isCancelled,
  closedLabel,
  members,
  visitors,
}: {
  completed: boolean;
  isFutureEvent: boolean;
  isCancelled: boolean;
  closedLabel: string;
  members: EventReadOnlyMember[];
  visitors: EventReadOnlyVisitor[];
}) {
  const emptyMessage = eventReadOnlyEmptyMessage({ completed, isFutureEvent, isCancelled, closedLabel });

  if (emptyMessage) {
    return (
      <section className="rounded-[1.15rem] border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-4 text-sm leading-relaxed text-[var(--color-text-secondary)] shadow-card">
        {emptyMessage}
      </section>
    );
  }

  const attendanceView = buildEventReadOnlyAttendanceView(members);

  return (
    <section className="space-y-3">
      <div className="rounded-[1.15rem] border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-4 shadow-card">
        <p className="font-semibold text-[var(--color-text-primary)]">Membros</p>
        <p className="mt-1 text-xs leading-relaxed text-[var(--color-text-secondary)]">{attendanceView.memberSummary}</p>

        <div className="mt-4 space-y-4">
          {attendanceView.groups.map((group) => (
            <AttendanceGroup key={group.title} group={group} />
          ))}

          {!attendanceView.hasPriorityAttention ? (
            <p className="rounded-2xl bg-[var(--metric-card-bg)] px-3 py-2 text-sm text-[var(--color-text-secondary)]">
              Nenhuma ausência, justificativa ou pendência registrada.
            </p>
          ) : null}
        </div>

        {attendanceView.presentMembers.length > 0 ? (
          <details className="group mt-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-2xl border border-[var(--color-border-divider)] bg-[var(--surface-alt)] px-3 py-2 text-sm transition active:scale-[0.99]">
              <div>
                <p className="font-semibold text-[var(--color-text-primary)]">Presentes ({attendanceView.presentMembers.length})</p>
                <p className="mt-0.5 text-xs leading-relaxed text-[var(--color-text-secondary)]">
                  Quem esteve no encontro. Abra só se quiser conferir a lista completa.
                </p>
              </div>
              <span className="shrink-0 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-brand)]">
                <span className="group-open:hidden">Mostrar</span>
                <span className="hidden group-open:inline">Ocultar</span>
              </span>
            </summary>
            <div className="mt-2 space-y-1.5">
              {attendanceView.presentMembers.map((member) => (
                <AttendanceMemberRow key={member.personId} member={member} />
              ))}
            </div>
          </details>
        ) : null}
      </div>

      {visitors.length > 0 ? (
        <div className="rounded-[1.15rem] border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-4 shadow-card">
          <p className="font-semibold text-[var(--color-text-primary)]">Visitantes</p>
          <p className="mt-1 text-xs leading-relaxed text-[var(--color-text-secondary)]">
            Pessoas novas ou visitantes marcados neste encontro.
          </p>
          <div className="mt-3 space-y-1.5">
            {sortPeopleByName(visitors).map((visitor) => (
              <Link
                key={visitor.id}
                href={ROUTES.person(visitor.personId)}
                className="flex items-center justify-between gap-3 rounded-2xl bg-[var(--metric-card-bg)] px-3 py-2 transition active:scale-[0.99]"
              >
                <span className="min-w-0 text-sm font-medium text-[var(--color-text-primary)]">{visitor.fullName}</span>
                <Badge tone="info" className="px-2 py-0.5 text-[11px]">Visitante</Badge>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
