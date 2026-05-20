import { EmptyState } from "@/components/shared/base-cards";
import { PersonMiniCard } from "@/components/shared/person-cards";
import type { BadgeTone } from "@/components/ui/badge";
import { FilterChip } from "@/components/ui/filter-chip";
import { ProgressiveList } from "@/components/shared/progressive-list";
import { MEMBERS_FILTERS, membersFilterHref, type MembersFilter } from "@/features/people/member-filters";
import { cn } from "@/lib/cn";
import { countLabel } from "@/lib/format";
import { FILTER_ALL } from "@/lib/filter-param";
import styles from "./member-priority-list.module.css";

export type MemberPriorityCardTone = BadgeTone | "stable" | "muted";

export type MemberPriorityListItem = {
  name: string;
  context?: string;
  badgeLabel?: string;
  badgeTone?: BadgeTone;
  cardTone?: MemberPriorityCardTone;
  priorityRank: number;
};


type MemberCardsProps<TMember extends MemberPriorityListItem> = {
  members: TMember[];
  keyForMember: (member: TMember) => string;
  hrefForMember: (member: TMember) => string;
  contextForMember?: (member: TMember) => string | undefined;
  badgeLabelForMember?: (member: TMember) => string | undefined;
  cardToneForMember?: (member: TMember) => MemberPriorityCardTone | undefined;
  compactForMember?: (member: TMember) => boolean;
};

function memberCardToneClass(tone: MemberPriorityCardTone | undefined) {
  if (tone === "risk") return styles.memberCardRisk;
  if (tone === "warn") return styles.memberCardWarn;
  if (tone === "care" || tone === "info") return styles.memberCardCare;
  if (tone === "support") return styles.memberCardSupport;
  if (tone === "ok" || tone === "stable") return styles.memberCardStable;
  return styles.memberCardMuted;
}

function memberCtaLabel(member: MemberPriorityListItem) {
  if (member.priorityRank <= 3) return "Entender motivo";
  if (member.priorityRank === 4) return "Continuar cuidado";
  return "Ver perfil pastoral";
}

function MemberCards<TMember extends MemberPriorityListItem>({
  members,
  keyForMember,
  hrefForMember,
  contextForMember,
  badgeLabelForMember,
  cardToneForMember,
  compactForMember,
}: MemberCardsProps<TMember>) {
  return (
    <>
      {members.map((member) => {
        const cardTone = cardToneForMember?.(member) ?? member.cardTone;
        const effectiveTone = cardTone ?? member.badgeTone;

        return (
          <PersonMiniCard
            key={keyForMember(member)}
            href={hrefForMember(member)}
            name={member.name}
            context={contextForMember?.(member)}
            badgeLabel={badgeLabelForMember ? badgeLabelForMember(member) : member.badgeLabel}
            badgeTone={member.badgeTone}
            cardTone={cardTone}
            ctaLabel={memberCtaLabel(member)}
            compact={compactForMember?.(member) ?? false}
            className={cn(styles.memberCard, memberCardToneClass(effectiveTone))}
          />
        );
      })}
    </>
  );
}

function MemberSectionHeader({ title, detail }: { title: string; detail: string }) {
  return (
    <div className={styles.sectionHeader}>
      <div>
        <p className={styles.sectionTitle}>{title}</p>
        <p className={styles.sectionDetail}>{detail}</p>
      </div>
    </div>
  );
}

type MemberPriorityListProps<TMember extends MemberPriorityListItem> = {
  basePath: string;
  activeFilter: MembersFilter;
  priorityMembers: TMember[];
  regularMembers: TMember[];
  filterCounts?: Partial<Record<MembersFilter, number>>;
  keyForMember: (member: TMember) => string;
  hrefForMember: (member: TMember) => string;
  priorityContextForMember?: (member: TMember) => string | undefined;
  filteredContextForMember?: (member: TMember) => string | undefined;
  prioritySectionTitle?: string;
  prioritySectionDetail?: string;
  priorityMoreLabel?: string;
  priorityLessLabel?: string;
  regularInitialCount?: number;
  regularStep?: number;
  regularMoreLabel?: string;
  regularLessLabel?: string;
  emptyText?: string;
};

export function MemberPriorityList<TMember extends MemberPriorityListItem>({
  basePath,
  activeFilter,
  priorityMembers,
  regularMembers,
  filterCounts,
  keyForMember,
  hrefForMember,
  priorityContextForMember,
  filteredContextForMember,
  prioritySectionTitle = "Quem merece proximidade",
  prioritySectionDetail,
  priorityMoreLabel = "Ver mais pessoas no radar",
  priorityLessLabel = "Mostrar menos pessoas no radar",
  regularInitialCount = 6,
  regularStep = 6,
  regularMoreLabel = "Ver mais membros",
  regularLessLabel = "Mostrar menos membros",
  emptyText = "Nenhum membro encontrado nesse recorte.",
}: MemberPriorityListProps<TMember>) {
  return (
    <>
      <div className={styles.filterRow}>
        {MEMBERS_FILTERS.map((option) => {
          const active = option.value === activeFilter;

          return (
            <FilterChip
              key={option.value}
              href={membersFilterHref(basePath, option.value)}
              aria-current={active ? "page" : undefined}
              active={active}
              className={cn(styles.filterChip, active && styles.filterChipActive)}
            >
              <span>{option.label}</span>
              {filterCounts?.[option.value] !== undefined ? (
                <span className={styles.filterCount}>{filterCounts[option.value]}</span>
              ) : null}
            </FilterChip>
          );
        })}
      </div>

      {activeFilter === FILTER_ALL ? (
        <div>
          {priorityMembers.length > 0 ? (
            <div className={styles.sectionStack}>
              <MemberSectionHeader
                title={prioritySectionTitle}
                detail={prioritySectionDetail ?? countLabel(priorityMembers.length, "pessoa no radar", "pessoas no radar")}
              />
              <ProgressiveList
                initialCount={4}
                step={4}
                moreLabel={priorityMoreLabel}
                lessLabel={priorityLessLabel}
              >
                <MemberCards
                  members={priorityMembers}
                  keyForMember={keyForMember}
                  hrefForMember={hrefForMember}
                  contextForMember={priorityContextForMember}
                />
              </ProgressiveList>
            </div>
          ) : null}

          {regularMembers.length > 0 ? (
            <div className={cn(styles.sectionStack, priorityMembers.length > 0 && styles.regularSection)}>
              {priorityMembers.length > 0 ? (
                <MemberSectionHeader
                  title="Ativos"
                  detail={countLabel(regularMembers.length, "membro sem sinal aberto", "membros sem sinal aberto")}
                />
              ) : null}
              <ProgressiveList
                initialCount={regularInitialCount}
                step={regularStep}
                moreLabel={regularMoreLabel}
                lessLabel={regularLessLabel}
              >
                <MemberCards
                  members={regularMembers}
                  keyForMember={keyForMember}
                  hrefForMember={hrefForMember}
                  contextForMember={(member) => member.context}
                  badgeLabelForMember={() => undefined}
                  cardToneForMember={() => "muted"}
                  compactForMember={() => true}
                />
              </ProgressiveList>
            </div>
          ) : null}

          {priorityMembers.length === 0 && regularMembers.length === 0 ? (
            <EmptyState compact>{emptyText}</EmptyState>
          ) : null}
        </div>
      ) : (
        <div>
          <ProgressiveList
            initialCount={6}
            step={6}
            moreLabel={regularMoreLabel}
            lessLabel={regularLessLabel}
          >
            <MemberCards
              members={regularMembers}
              keyForMember={keyForMember}
              hrefForMember={hrefForMember}
              contextForMember={filteredContextForMember}
              badgeLabelForMember={(member) => member.priorityRank >= 5 ? undefined : member.badgeLabel}
              cardToneForMember={(member) => member.priorityRank >= 5 ? "muted" : member.cardTone}
              compactForMember={(member) => member.priorityRank >= 5}
            />
          </ProgressiveList>
          {regularMembers.length === 0 ? (
            <EmptyState compact>{emptyText}</EmptyState>
          ) : null}
        </div>
      )}
    </>
  );
}
