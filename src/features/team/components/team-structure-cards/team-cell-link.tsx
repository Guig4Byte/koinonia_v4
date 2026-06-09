import Link from "next/link";
import {
  groupSignalLabel,
  groupSignalTone,
  teamGroupHref,
  type TeamFilter,
  type TeamGroup,
  type TeamSignalTone,
} from "@/features/team/team-view";
import { FILTER_ALL } from "@/lib/filter-param";
import { cn } from "@/lib/cn";
import { cellLinkToneClass } from "./team-structure-cards.constants";
import styles from "../team-structure-cards.module.css";

function pastoralSignalLabel(
  name: string,
  subtitle: string,
  signalLabel?: string,
  presenceLabel?: string,
) {
  const signalText = signalLabel ? `. Sinal pastoral: ${signalLabel}` : "";
  const presenceText = presenceLabel ? `. ${presenceLabel}` : "";

  return `${name}. ${subtitle}${signalText}${presenceText}`;
}

function compactSignalLabel(label: string) {
  if (label === "Apoio pedido") return "Apoio";
  if (label === "Em atenção") return "Atenção";
  if (label === "Em cuidado") return "Cuidado";
  return label;
}


export function cellToneClass(tone?: TeamSignalTone) {
  return tone ? cellLinkToneClass[tone] : undefined;
}

export function TeamCellLink({
  href,
  name,
  subtitle,
  signalLabel,
  visibleSignalLabel,
  presenceRate,
  hasPresenceData,
  className,
}: {
  href: string;
  name: string;
  subtitle: string;
  signalLabel?: string;
  visibleSignalLabel?: string;
  presenceRate?: number;
  hasPresenceData?: boolean;
  className?: string;
}) {
  const itemPresenceLabel =
    hasPresenceData && presenceRate !== undefined
      ? `${presenceRate}% presença`
      : "Sem presença";

  return (
    <Link
      href={href}
      className={cn(styles.cellLink, className)}
      aria-label={pastoralSignalLabel(
        name,
        subtitle,
        signalLabel,
        itemPresenceLabel,
      )}
    >
      <span className={styles.cellText}>
        <span className={styles.cellTitle}>{name}</span>
        <span className={styles.cellSubtitle}>{subtitle}</span>
      </span>
      {visibleSignalLabel ? (
        <span className={styles.cellSignalLabel}>{visibleSignalLabel}</span>
      ) : null}
      <span className={styles.cellPresence}>
        <span className={styles.cellPresenceLabel}>{itemPresenceLabel}</span>
        {hasPresenceData && presenceRate !== undefined ? (
          <span className={styles.cellPresenceTrack} aria-hidden="true">
            <span
              className={styles.cellPresenceFill}
              style={{ width: `${presenceRate}%` }}
            />
          </span>
        ) : null}
      </span>
    </Link>
  );
}

export function TeamGroupLink({
  group,
  activeFilter,
}: {
  group: TeamGroup;
  activeFilter?: TeamFilter;
}) {
  const tone = groupSignalTone(group);
  const signalLabel = groupSignalLabel(group);
  const shouldShowSignalLabel =
    tone !== "ok" && (!activeFilter || activeFilter === FILTER_ALL);

  return (
    <TeamCellLink
      href={teamGroupHref(group.id, activeFilter)}
      name={group.name}
      subtitle={group.leadershipName}
      signalLabel={signalLabel}
      visibleSignalLabel={
        shouldShowSignalLabel ? compactSignalLabel(signalLabel) : undefined
      }
      presenceRate={group.presenceRate}
      hasPresenceData={group.hasPresenceData}
      className={cellToneClass(tone)}
    />
  );
}

