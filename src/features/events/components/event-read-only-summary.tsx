import Link from "next/link";
import { AttendanceStatus } from "@/generated/prisma/client";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  buildEventReadOnlyAttendanceView,
  eventAttendanceLabels,
  eventAttendanceStatusTone,
  eventReadOnlyEmptyMessage,
  sortPeopleByName,
} from "@/features/events/event-detail-view";
import type { EventAttendanceGroup, EventReadOnlyMember, EventReadOnlyVisitor } from "@/features/events/event-detail-view";
import { cn } from "@/lib/cn";
import { ROUTES } from "@/lib/routes";
import styles from "./event-read-only-summary.module.css";

type AttendanceVisualTone = "present" | "absent" | "justified" | "pending" | "visitor";

function attendanceVisualTone(status?: AttendanceStatus | null): AttendanceVisualTone {
  if (status === AttendanceStatus.PRESENT) return "present";
  if (status === AttendanceStatus.ABSENT) return "absent";
  if (status === AttendanceStatus.JUSTIFIED) return "justified";
  if (status === AttendanceStatus.VISITOR) return "visitor";
  return "pending";
}

const attendanceToneClass: Record<AttendanceVisualTone, string> = {
  present: styles.rowPresent,
  absent: styles.rowAbsent,
  justified: styles.rowJustified,
  pending: styles.rowPending,
  visitor: styles.rowVisitor,
};

function AttendancePersonRow({
  href,
  name,
  badgeTone,
  badgeLabel,
  status,
  visualTone,
}: {
  href: string;
  name: string;
  badgeTone: BadgeTone;
  badgeLabel: string;
  status?: AttendanceStatus | null;
  visualTone?: AttendanceVisualTone;
}) {
  const tone = visualTone ?? attendanceVisualTone(status);

  return (
    <Link
      href={href}
      className={cn(styles.personRow, attendanceToneClass[tone])}
    >
      <span className={styles.personName}>{name}</span>
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
      badgeLabel={member.currentStatus ? eventAttendanceLabels[member.currentStatus] : "Sem marcação"}
      status={member.currentStatus}
    />
  );
}

function AttendanceGroup({ group }: { group: EventAttendanceGroup }) {
  if (group.members.length === 0) return null;

  const tone = attendanceVisualTone(group.members[0]?.currentStatus);

  return (
    <section className={cn(styles.attendanceGroup, attendanceToneClass[tone])}>
      <div className={styles.groupHeader}>
        <div>
          <p className={styles.groupTitle}>{group.title}</p>
          <p className={styles.groupDescription}>{group.description}</p>
        </div>
      </div>
      <div className={styles.rows}>
        {group.members.map((member) => (
          <AttendanceMemberRow key={member.personId} member={member} />
        ))}
      </div>
    </section>
  );
}

export function EventReadOnlySummary({
  completed,
  isFutureEvent,
  isCancelled,
  closedLabel,
  members,
  visitors,
  permissionHint,
}: {
  completed: boolean;
  isFutureEvent: boolean;
  isCancelled: boolean;
  closedLabel: string;
  members: EventReadOnlyMember[];
  visitors: EventReadOnlyVisitor[];
  permissionHint?: string;
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
    <section className={styles.summarySection}>
      {permissionHint ? (
        <Card className={styles.permissionHint}>
          {permissionHint}
        </Card>
      ) : null}

      <Card className={styles.attendanceCard}>
        <div className={styles.cardHeader}>
          <div className={styles.heading}>
            <p className={styles.title}>Membros da célula</p>
            <p className={styles.total}>{attendanceView.memberTotalLabel}</p>
            <p className={styles.breakdown}>{attendanceView.memberBreakdownLabel}</p>
          </div>
          <span className={styles.statusPill}>Registrada</span>
        </div>

        <div className={cn(styles.pastoralCue, styles[`pastoralCue-${attendanceView.pastoralCue.tone}`])}>
          <p className={styles.pastoralCueTitle}>{attendanceView.pastoralCue.title}</p>
          <p className={styles.pastoralCueDescription}>{attendanceView.pastoralCue.description}</p>
        </div>

        <div className={styles.groupList}>
          {attendanceView.groups.map((group) => (
            <AttendanceGroup key={group.title} group={group} />
          ))}
        </div>

        {attendanceView.presentMembers.length > 0 ? (
          <details className={styles.presentDisclosure}>
            <summary className={styles.presentSummary}>
              <span>
                <span className={styles.groupTitle}>Presentes ({attendanceView.presentMembers.length})</span>
                <span className={styles.groupDescription}>Lista completa dos presentes.</span>
              </span>
              <span className={styles.presentAction} aria-hidden="true">
                <span className={styles.closedLabel}>Mostrar presentes</span>
                <span className={styles.openLabel}>Ocultar</span>
              </span>
            </summary>
            <div className={styles.presentContent}>
              {attendanceView.presentMembers.map((member) => (
                <AttendanceMemberRow key={member.personId} member={member} />
              ))}
            </div>
          </details>
        ) : null}
      </Card>

      {visitors.length > 0 ? (
        <Card className={styles.attendanceCard}>
          <div className={styles.cardHeader}>
            <div className={styles.heading}>
              <p className={styles.title}>Visitantes</p>
              <p className={styles.breakdown}>Pessoas novas ou visitantes marcados neste encontro.</p>
            </div>
          </div>
          <div className={cn(styles.rows, styles.groupList)}>
            {sortPeopleByName(visitors).map((visitor) => (
              <AttendancePersonRow
                key={visitor.id}
                href={ROUTES.person(visitor.personId)}
                name={visitor.fullName}
                badgeTone="info"
                badgeLabel="Visitante"
                visualTone="visitor"
              />
            ))}
          </div>
        </Card>
      ) : null}
    </section>
  );
}
