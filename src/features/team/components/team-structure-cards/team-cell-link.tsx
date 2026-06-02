import Link from "next/link";
import { ChevronRight } from "lucide-react";
import {
  compactGroupSubtitle,
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
) {
  return `${name}. ${subtitle}${signalLabel ? `. Sinal pastoral: ${signalLabel}` : ""}`;
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
  className,
}: {
  href: string;
  name: string;
  subtitle: string;
  signalLabel?: string;
  visibleSignalLabel?: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(styles.cellLink, className)}
      aria-label={pastoralSignalLabel(name, subtitle, signalLabel)}
    >
      <span className={styles.cellText}>
        <span className={styles.cellTitle}>{name}</span>
        <span className={styles.cellSubtitle}>{subtitle}</span>
        {visibleSignalLabel ? (
          <span className={styles.cellSignalLabel}>{visibleSignalLabel}</span>
        ) : null}
      </span>
      <span className={styles.cellAction}>
        <ChevronRight className={styles.cellChevron} aria-hidden="true" />
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
  const shouldShowSignalLabel = !activeFilter || activeFilter === FILTER_ALL;

  return (
    <TeamCellLink
      href={teamGroupHref(group.id, activeFilter)}
      name={group.name}
      subtitle={compactGroupSubtitle(group)}
      signalLabel={signalLabel}
      visibleSignalLabel={shouldShowSignalLabel ? signalLabel : undefined}
      className={cellToneClass(tone)}
    />
  );
}
