import { EmptyState } from "@/components/shared/base-cards";
import { PersonMiniCard } from "@/components/shared/person-cards";
import type { BadgeTone } from "@/components/ui/badge";
import { FilterChip } from "@/components/ui/filter-chip";
import { ProgressiveList } from "@/components/shared/progressive-list";
import { MEMBERS_FILTERS, membersFilterHref, type MembersFilter } from "@/features/people/member-filters";
import { cn } from "@/lib/cn";
import { countLabel } from "@/lib/format";
import { FILTER_ACTIVE, FILTER_ALL, FILTER_IN_CARE } from "@/lib/filter-param";
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
  badgeToneForMember?: (member: TMember) => BadgeTone | undefined;
  cardToneForMember?: (member: TMember) => MemberPriorityCardTone | undefined;
  compactForMember?: (member: TMember) => boolean;
};

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
  badgeToneForMember,
  cardToneForMember,
  compactForMember,
}: MemberCardsProps<TMember>) {
  return (
    <>
      {members.map((member) => {
        const cardTone = cardToneForMember?.(member) ?? member.cardTone;

        return (
          <PersonMiniCard
            key={keyForMember(member)}
            href={hrefForMember(member)}
            name={member.name}
            context={contextForMember?.(member)}
            badgeLabel={badgeLabelForMember ? badgeLabelForMember(member) : member.badgeLabel}
            badgeTone={badgeToneForMember ? badgeToneForMember(member) ?? member.badgeTone : member.badgeTone}
            cardTone={cardTone}
            ctaLabel={memberCtaLabel(member)}
            compact={compactForMember?.(member) ?? false}
            prioritySurface="accentStrip"
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
  inCareMembers?: TMember[];
  regularMembers: TMember[];
  filterCounts?: Partial<Record<MembersFilter, number>>;
  keyForMember: (member: TMember) => string;
  hrefForMember: (member: TMember) => string;
  priorityContextForMember?: (member: TMember) => string | undefined;
  filteredContextForMember?: (member: TMember) => string | undefined;
  priorityBadgeLabelForMember?: (member: TMember) => string | undefined;
  priorityBadgeToneForMember?: (member: TMember) => BadgeTone | undefined;
  filteredBadgeLabelForMember?: (member: TMember) => string | undefined;
  filteredBadgeToneForMember?: (member: TMember) => BadgeTone | undefined;
  priorityMoreLabel?: string;
  priorityLessLabel?: string;
  regularInitialCount?: number;
  regularStep?: number;
  regularMoreLabel?: string;
  regularLessLabel?: string;
  emptyText?: string;
};

function filteredSectionMeta(activeFilter: MembersFilter, count: number) {
  if (activeFilter === FILTER_IN_CARE) {
    return {
      title: "Em cuidado",
      detail: countLabel(count, "acompanhamento em andamento", "acompanhamentos em andamento"),
    };
  }

  if (activeFilter === FILTER_ACTIVE) {
    return {
      title: "Sem sinal aberto",
      detail: countLabel(count, "membro sem sinal aberto", "membros sem sinal aberto"),
    };
  }

  return {
    title: "Sinais",
    detail: countLabel(count, "irmão com sinal aberto", "irmãos com sinais abertos"),
  };
}

export function MemberPriorityList<TMember extends MemberPriorityListItem>({
  basePath,
  activeFilter,
  priorityMembers,
  inCareMembers = [],
  regularMembers,
  filterCounts,
  keyForMember,
  hrefForMember,
  priorityContextForMember,
  filteredContextForMember,
  priorityBadgeLabelForMember,
  priorityBadgeToneForMember,
  filteredBadgeLabelForMember,
  filteredBadgeToneForMember,
  priorityMoreLabel = "Ver mais irmãos no radar",
  priorityLessLabel = "Mostrar menos irmãos no radar",
  regularInitialCount = 6,
  regularStep = 6,
  regularMoreLabel = "Ver mais membros",
  regularLessLabel = "Mostrar menos membros",
  emptyText = "Nenhum irmão nesse recorte.",
}: MemberPriorityListProps<TMember>) {
  const filteredMeta = filteredSectionMeta(activeFilter, regularMembers.length);

  return (
    <>
      <div className={styles.filterRow}>
        {MEMBERS_FILTERS.map((option) => {
          const active = option.value === activeFilter;
          const count = filterCounts?.[option.value];
          if (option.value === FILTER_IN_CARE && count === 0 && !active) return null;

          return (
            <FilterChip
              key={option.value}
              href={membersFilterHref(basePath, option.value)}
              aria-current={active ? "page" : undefined}
              active={active}
            >
              <span>{option.label}</span>
              {count !== undefined ? (
                <span className={styles.filterCount}>{count}</span>
              ) : null}
            </FilterChip>
          );
        })}
      </div>

      {activeFilter === FILTER_ALL ? (
        <div className={styles.sectionStack}>
          {priorityMembers.length > 0 ? (
            <div className={styles.sectionStack}>
              <MemberSectionHeader
                title="Sinais"
                detail={countLabel(priorityMembers.length, "irmão com sinal aberto", "irmãos com sinais abertos")}
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
                  badgeLabelForMember={priorityBadgeLabelForMember}
                  badgeToneForMember={priorityBadgeToneForMember}
                />
              </ProgressiveList>
            </div>
          ) : null}

          {inCareMembers.length > 0 ? (
            <div className={cn(styles.sectionStack, priorityMembers.length > 0 && styles.regularSection)}>
              <MemberSectionHeader
                title="Em cuidado"
                detail={countLabel(inCareMembers.length, "acompanhamento em andamento", "acompanhamentos em andamento")}
              />
              <ProgressiveList
                initialCount={4}
                step={4}
                moreLabel="Ver mais em cuidado"
                lessLabel="Mostrar menos em cuidado"
              >
                <MemberCards
                  members={inCareMembers}
                  keyForMember={keyForMember}
                  hrefForMember={hrefForMember}
                  contextForMember={priorityContextForMember}
                  badgeLabelForMember={priorityBadgeLabelForMember}
                  badgeToneForMember={priorityBadgeToneForMember}
                />
              </ProgressiveList>
            </div>
          ) : null}

          {regularMembers.length > 0 ? (
            <div className={cn(styles.sectionStack, (priorityMembers.length > 0 || inCareMembers.length > 0) && styles.regularSection)}>
              {priorityMembers.length > 0 || inCareMembers.length > 0 ? (
                <MemberSectionHeader
                  title="Sem sinal aberto"
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

          {priorityMembers.length === 0 && inCareMembers.length === 0 && regularMembers.length === 0 ? (
            <EmptyState compact>{emptyText}</EmptyState>
          ) : null}
        </div>
      ) : (
        <div className={styles.sectionStack}>
          <MemberSectionHeader
            title={filteredMeta.title}
            detail={filteredMeta.detail}
          />
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
              badgeLabelForMember={(member) => filteredBadgeLabelForMember
                ? filteredBadgeLabelForMember(member)
                : member.priorityRank >= 5 ? undefined : member.badgeLabel}
              badgeToneForMember={(member) => filteredBadgeToneForMember
                ? filteredBadgeToneForMember(member)
                : member.badgeTone}
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
