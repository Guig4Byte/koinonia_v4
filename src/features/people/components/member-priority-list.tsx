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
  cardToneForMember?: (member: TMember) => MemberPriorityCardTone | undefined;
  compactForMember?: (member: TMember) => boolean;
};

function MemberCards<TMember extends MemberPriorityListItem>({
  members,
  keyForMember,
  hrefForMember,
  contextForMember,
  cardToneForMember,
  compactForMember,
}: MemberCardsProps<TMember>) {
  return (
    <>
      {members.map((member) => (
        <PersonMiniCard
          key={keyForMember(member)}
          href={hrefForMember(member)}
          name={member.name}
          context={contextForMember?.(member)}
          badgeLabel={member.badgeLabel}
          badgeTone={member.badgeTone}
          cardTone={cardToneForMember?.(member) ?? member.cardTone}
          compact={compactForMember?.(member) ?? false}
        />
      ))}
    </>
  );
}

function MemberSectionHeader({ title, detail }: { title: string; detail: string }) {
  return (
    <div>
      <p className="k-item-title-sm">{title}</p>
      <p className="k-item-detail-tight">{detail}</p>
    </div>
  );
}

type MemberPriorityListProps<TMember extends MemberPriorityListItem> = {
  basePath: string;
  activeFilter: MembersFilter;
  priorityMembers: TMember[];
  regularMembers: TMember[];
  keyForMember: (member: TMember) => string;
  hrefForMember: (member: TMember) => string;
  priorityContextForMember?: (member: TMember) => string | undefined;
  filteredContextForMember?: (member: TMember) => string | undefined;
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
  keyForMember,
  hrefForMember,
  priorityContextForMember,
  filteredContextForMember,
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
      <div className={cn(styles.filterRow, "mb-3")}>
        {MEMBERS_FILTERS.map((option) => {
          const active = option.value === activeFilter;

          return (
            <FilterChip
              key={option.value}
              href={membersFilterHref(basePath, option.value)}
              aria-current={active ? "page" : undefined}
              active={active}
            >
              {option.label}
            </FilterChip>
          );
        })}
      </div>

      {activeFilter === FILTER_ALL ? (
        <div>
          {priorityMembers.length > 0 ? (
            <div className="space-y-2">
              <MemberSectionHeader
                title="Quem merece proximidade"
                detail={countLabel(priorityMembers.length, "pessoa no radar", "pessoas no radar")}
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
            <div className={cn("space-y-2", priorityMembers.length > 0 && "pt-1")}>
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
