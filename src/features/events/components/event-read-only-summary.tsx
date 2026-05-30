import Link from "next/link";
import { AttendanceStatus } from "@/generated/prisma/client";
import { Card, type CardAccentTone } from "@/components/ui/card";
import { DisclosureCard } from "@/components/ui/disclosure-card";
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

function pastoralCueAccentTone(tone: string): CardAccentTone {
  if (tone === "ok") return "success";
  if (tone === "warn") return "warning";
  if (tone === "risk") return "danger";
  return "default";
}

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


function PresentDisclosureAction() {
  return (
    <span className={styles.presentAction} aria-hidden="true">
      <span className={styles.closedLabel}>Ver lista de presentes</span>
      <span className={styles.openLabel}>Ocultar presentes</span>
      <span className={styles.presentArrow}>→</span>
    </span>
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
      <Card textStyle="bodyMuted">
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
        <Card surface="notice" textStyle="noticeStrong">
          {permissionHint}
        </Card>
      ) : null}

      <Card surface="pastoralCue" accentTone={pastoralCueAccentTone(attendanceView.pastoralCue.tone)} layout="media">
        <span className={styles.pastoralCueIcon} aria-hidden="true">♡</span>
        <div>
          <p className={styles.pastoralCueTitle}>{attendanceView.pastoralCue.title}</p>
          <p className={styles.pastoralCueDescription}>{attendanceView.pastoralCue.description}</p>
        </div>
      </Card>

      <Card surface="summaryGlow">
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
          <div className={styles.presentDisclosureWrap}>
            <DisclosureCard
              title={`Presentes (${attendanceView.presentMembers.length})`}
              description="Lista completa dos presentes."
              tone="accentInset"
              size="sm"
              layout="stacked"
              action={<PresentDisclosureAction />}
              contentClassName={styles.presentContent}
              titleClassName={styles.groupTitle}
              descriptionClassName={styles.groupDescription}
            >
              {attendanceView.presentMembers.map((member) => (
                <AttendanceMemberRow key={member.personId} member={member} />
              ))}
            </DisclosureCard>
          </div>
        ) : null}
      </Card>

      {visitors.length > 0 ? (
        <Card surface="summaryGlow">
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
