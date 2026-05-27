import Link from "next/link";
import { AttendanceStatus } from "@/generated/prisma/client";
import { Card } from "@/components/ui/card";
import {
  buildEventReadOnlyAttendanceView,
  eventReadOnlyEmptyMessage,
  sortPeopleByName,
} from "@/features/events/event-detail-view";
import type { EventAttendanceGroup, EventReadOnlyMember, EventReadOnlyVisitor } from "@/features/events/event-detail-view";
import { cn } from "@/lib/cn";
import { ROUTES } from "@/lib/routes";
import { initials } from "@/lib/text";
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
  status,
  visualTone,
}: {
  href: string;
  name: string;
  status?: AttendanceStatus | null;
  visualTone?: AttendanceVisualTone;
}) {
  const tone = visualTone ?? attendanceVisualTone(status);

  return (
    <Link href={href} className={cn(styles.personRow, attendanceToneClass[tone])}>
      <span className={styles.personInitials} aria-hidden="true">{initials(name)}</span>
      <span className={styles.personName}>{name}</span>
      <span className={styles.personArrow} aria-hidden="true">→</span>
    </Link>
  );
}

function AttendanceMemberRow({ member }: { member: EventReadOnlyMember }) {
  return (
    <AttendancePersonRow
      href={ROUTES.person(member.personId)}
      name={member.fullName}
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
          {group.description ? <p className={styles.groupDescription}>{group.description}</p> : null}
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

function Metric({ value, label, tone }: { value: number | string; label: string; tone?: "present" | "attention" | "justified" }) {
  return (
    <div className={cn(styles.metric, tone === "present" && styles.metricPresent, tone === "attention" && styles.metricAttention, tone === "justified" && styles.metricJustified)}>
      <span className={styles.metricValue}>{value}</span>
      <span className={styles.metricLabel}>{label}</span>
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
  const absentCount = members.filter((member) => member.currentStatus === AttendanceStatus.ABSENT).length;
  const justifiedCount = members.filter((member) => member.currentStatus === AttendanceStatus.JUSTIFIED).length;
  const presentCount = attendanceView.presentMembers.length;

  return (
    <section className={styles.summarySection}>
      {permissionHint ? (
        <Card className={styles.permissionHint}>
          {permissionHint}
        </Card>
      ) : null}

      <Card className={cn(styles.pastoralCueCard, styles[`pastoralCue-${attendanceView.pastoralCue.tone}`])}>
        <span className={styles.pastoralCueIcon} aria-hidden="true">♡</span>
        <div>
          <p className={styles.pastoralCueTitle}>{attendanceView.pastoralCue.title}</p>
          <p className={styles.pastoralCueDescription}>{attendanceView.pastoralCue.description}</p>
        </div>
      </Card>

      <Card className={styles.attendanceCard}>
        <div className={styles.cardHeader}>
          <p className={styles.title}>Membros da célula</p>
          <span className={styles.statusPill}>Registrada</span>
        </div>

        <div className={cn(styles.metricsGrid, justifiedCount > 0 && styles.metricsGridWithJustified)} aria-label={attendanceView.memberSummary}>
          <Metric value={members.length} label={members.length === 1 ? "membro" : "membros"} />
          <Metric value={presentCount} label={presentCount === 1 ? "presente" : "presentes"} tone="present" />
          <Metric value={absentCount} label={absentCount === 1 ? "ausente" : "ausentes"} tone="attention" />
          {justifiedCount > 0 ? (
            <Metric value={justifiedCount} label={justifiedCount === 1 ? "justificou" : "justificaram"} tone="justified" />
          ) : null}
        </div>

        <div className={styles.groupList}>
          {attendanceView.groups.map((group) => (
            <AttendanceGroup key={group.title} group={group} />
          ))}
        </div>

        {attendanceView.presentMembers.length > 0 ? (
          <details className={styles.presentDisclosure}>
            <summary className={styles.presentSummary}>
              <span className={styles.presentSummaryCopy}>
                <span className={styles.groupTitle}>Presentes ({attendanceView.presentMembers.length})</span>
                <span className={styles.groupDescription}>Lista completa dos presentes.</span>
              </span>
              <span className={styles.presentAction} aria-hidden="true">
                <span className={styles.closedLabel}>Ver lista de presentes</span>
                <span className={styles.openLabel}>Ocultar presentes</span>
                <span className={styles.presentArrow}>→</span>
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
              <p className={styles.breakdown}>Irmãos novos ou visitantes marcados neste encontro.</p>
            </div>
          </div>
          <div className={cn(styles.rows, styles.groupList)}>
            {sortPeopleByName(visitors).map((visitor) => (
              <AttendancePersonRow
                key={visitor.id}
                href={ROUTES.person(visitor.personId)}
                name={visitor.fullName}
                visualTone="visitor"
              />
            ))}
          </div>
        </Card>
      ) : null}
    </section>
  );
}
