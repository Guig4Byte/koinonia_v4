import { GroupCard } from "@/features/groups/components/group-card";
import { ProgressiveList } from "@/components/shared/progressive-list";
import {
  CELLS_PAGE_SECTION_LIMIT,
  groupBadge,
  groupDetailHref,
  groupSubtitle,
  sectionCardTone,
  type CellsPageView,
  type GroupSectionKey,
  type SupervisorGroup,
} from "@/features/groups/cells-page-view";
import { NO_RECENT_PRESENCE_LABEL } from "@/lib/filter-param";
import { countLabel } from "@/lib/format";
import styles from "./cells-page-sections.module.css";

function CellsGroupCard({ group, sectionKey }: { group: SupervisorGroup; sectionKey: GroupSectionKey }) {
  const badge = groupBadge(group);

  return (
    <GroupCard
      name={group.name}
      subtitle={groupSubtitle(group)}
      presenceRate={group.presenceRate}
      attentionCount={group.attentionCount}
      badgeLabel={badge?.label}
      badgeTone={badge?.tone}
      showBadge={Boolean(badge)}
      cardTone={sectionCardTone(sectionKey)}
      href={groupDetailHref(group)}
      hasPresenceData={group.hasPresenceData}
      presenceTrend={group.presenceTrend}
      noPresenceLabel={NO_RECENT_PRESENCE_LABEL}
    />
  );
}

export function CellsPageSections({ sections }: { sections: CellsPageView["groupedSections"] }) {
  return (
    <div className={styles.sections}>
      {sections.map((section) => (
        <div key={section.key} className={styles.section}>
          <div className={styles.heading}>
            <div className={styles.headingTopline}>
              <h3>{section.title}</h3>
              <span>{countLabel(section.groups.length, "célula", "células")}</span>
            </div>
            <p>{section.detail}</p>
          </div>
          <ProgressiveList
            initialCount={CELLS_PAGE_SECTION_LIMIT}
            step={CELLS_PAGE_SECTION_LIMIT}
            moreLabel="Ver mais células"
            lessLabel="Mostrar menos células"
          >
            {section.groups.map((group) => (
              <CellsGroupCard key={group.id} group={group} sectionKey={section.key} />
            ))}
          </ProgressiveList>
        </div>
      ))}
    </div>
  );
}
