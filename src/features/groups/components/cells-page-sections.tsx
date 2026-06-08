import { GroupCard } from "@/features/groups/components/group-card";
import { ProgressiveList } from "@/components/shared/progressive-list";
import {
  CELLS_PAGE_SECTION_LIMIT,
  groupBadge,
  groupDetailHref,
  groupStatusSummary,
  groupSubtitle,
  sectionCardTone,
  type CellsPageView,
  type GroupSectionKey,
  type SupervisorGroup,
} from "@/features/groups/cells-page-view";
import type { CellsFilter } from "@/features/groups/cells-page-filters";
import { countLabel } from "@/lib/format";
import styles from "./cells-page-sections.module.css";

function CellsGroupCard({ group, sectionKey, activeFilter }: { group: SupervisorGroup; sectionKey: GroupSectionKey; activeFilter: CellsFilter }) {
  const badge = groupBadge(group, activeFilter);

  return (
    <GroupCard
      name={group.name}
      subtitle={groupSubtitle(group)}
      presenceRate={group.presenceRate}
      badgeLabel={badge?.label}
      badgeTone={badge?.tone}
      statusSummary={groupStatusSummary(group, activeFilter)}
      cardTone={sectionCardTone(sectionKey)}
      href={groupDetailHref(group, activeFilter)}
      hasPresenceData={group.hasPresenceData}
      recordedEventsCount={group.recordedEventsCount}
      presenceTrend={group.presenceTrend}
    />
  );
}

function sectionDetailLabel(section: CellsPageView["groupedSections"][number]) {
  const count = countLabel(section.groups.length, "célula", "células");
  const isSingular = section.groups.length === 1;

  if (section.key === "care") return `${count} ${isSingular ? "pede" : "pedem"} prioridade no acompanhamento.`;
  if (section.key === "presence") return `${count} ${isSingular ? "precisa" : "precisam"} de leitura sobre presença.`;
  return `${count} sem sinal aberto no momento.`;
}

export function CellsPageSections({ sections, activeFilter }: { sections: CellsPageView["groupedSections"]; activeFilter: CellsFilter }) {
  return (
    <div className={styles.sections}>
      {sections.map((section) => (
        <div key={section.key} className={styles.section}>
          <div className={styles.heading}>
            <h3 className={`${styles.headingTitle} k-section-kicker`}>{section.title}</h3>
            <p className={`${styles.headingDetail} k-section-detail`}>{sectionDetailLabel(section)}</p>
          </div>
          <ProgressiveList
            initialCount={CELLS_PAGE_SECTION_LIMIT}
            step={CELLS_PAGE_SECTION_LIMIT}
            moreLabel="Ver mais células"
            lessLabel="Mostrar menos células"
          >
            {section.groups.map((group) => (
              <CellsGroupCard key={group.id} group={group} sectionKey={section.key} activeFilter={activeFilter} />
            ))}
          </ProgressiveList>
        </div>
      ))}
    </div>
  );
}
