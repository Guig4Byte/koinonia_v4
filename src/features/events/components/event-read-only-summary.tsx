import Link from "next/link";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { DisclosureCard } from "@/components/ui/disclosure-card";
import {
  buildEventReadOnlyAttendanceView,
  eventAttendanceLabels,
  eventAttendanceStatusTone,
  eventReadOnlyEmptyMessage,
  sortPeopleByName,
} from "@/features/events/event-detail-view";
import type { EventAttendanceGroup, EventReadOnlyMember, EventReadOnlyVisitor } from "@/features/events/event-detail-view";
import { ROUTES } from "@/lib/routes";

function AttendancePersonRow({
  href,
  name,
  badgeTone,
  badgeLabel,
}: {
  href: string;
  name: string;
  badgeTone: BadgeTone;
  badgeLabel: string;
}) {
  return (
    <Link
      href={href}
      className="flex min-h-11 items-center justify-between gap-3 rounded-2xl bg-[var(--metric-card-bg)] px-3 py-2 transition active:scale-[0.99]"
    >
      <span className="min-w-0 truncate text-[length:var(--text-sm)] font-medium text-[color:var(--color-text-primary)]">{name}</span>
      <Badge tone={badgeTone} size="sm" maxWidth="row">{badgeLabel}</Badge>
    </Link>
  );
}

function AttendanceMemberRow({ member }: { member: EventReadOnlyMember }) {
  return (
    <AttendancePersonRow
      href={ROUTES.person(member.personId)}
      name={member.fullName}
      badgeTone={eventAttendanceStatusTone(member.currentStatus)}
      badgeLabel={member.currentStatus ? eventAttendanceLabels[member.currentStatus] : "Pendente"}
    />
  );
}

function AttendanceGroup({ group }: { group: EventAttendanceGroup }) {
  if (group.members.length === 0) return null;

  return (
    <div className="space-y-2">
      <div>
        <p className="k-item-title-sm">{group.title}</p>
        <p className="k-item-detail-tight">{group.description}</p>
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
      <Card className="text-[length:var(--text-sm)] leading-relaxed text-[color:var(--color-text-secondary)]">
        {emptyMessage}
      </Card>
    );
  }

  const attendanceView = buildEventReadOnlyAttendanceView(members);

  return (
    <section className="space-y-3 pb-8">
      <Card>
        <p className="k-item-title">Membros</p>
        <p className="mt-1 text-[length:var(--text-lg)] font-semibold leading-none text-[color:var(--color-text-primary)]">
          {attendanceView.memberTotalLabel}
        </p>
        <p className="mt-1 k-item-detail">{attendanceView.memberBreakdownLabel}</p>

        <div className="mt-4 space-y-4">
          {attendanceView.groups.map((group) => (
            <AttendanceGroup key={group.title} group={group} />
          ))}

          {!attendanceView.hasPriorityAttention ? (
            <p className="rounded-2xl bg-[var(--metric-card-bg)] px-3 py-2 text-[length:var(--text-sm)] text-[color:var(--color-text-secondary)]">
              Nenhuma ausência, justificativa ou pendência registrada.
            </p>
          ) : null}
        </div>

        {attendanceView.presentMembers.length > 0 ? (
          <DisclosureCard
            title={`Presentes (${attendanceView.presentMembers.length})`}
            description="Lista completa dos presentes."
            tone="inset"
            size="sm"
            separatedContent
            className="mt-4"
            contentClassName="space-y-1.5"
          >
            {attendanceView.presentMembers.map((member) => (
              <AttendanceMemberRow key={member.personId} member={member} />
            ))}
          </DisclosureCard>
        ) : null}
      </Card>

      {visitors.length > 0 ? (
        <Card>
          <p className="k-item-title">Visitantes</p>
          <p className="k-item-detail">
            Pessoas novas ou visitantes marcados neste encontro.
          </p>
          <div className="mt-3 space-y-1.5">
            {sortPeopleByName(visitors).map((visitor) => (
              <AttendancePersonRow
                key={visitor.id}
                href={ROUTES.person(visitor.personId)}
                name={visitor.fullName}
                badgeTone="info"
                badgeLabel="Visitante"
              />
            ))}
          </div>
        </Card>
      ) : null}
    </section>
  );
}
