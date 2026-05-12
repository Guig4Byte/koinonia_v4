import { EmptyState } from "@/components/shared/base-cards";
import { PersonMiniCard } from "@/features/people/components/person-cards";
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
              <div>
                <p className="k-item-title-sm">Quem merece proximidade</p>
                <p className="k-item-detail-tight">
                  {countLabel(priorityMembers.length, "pessoa no radar", "pessoas no radar")}
                </p>
              </div>
              <ProgressiveList
                initialCount={4}
                step={4}
                moreLabel={priorityMoreLabel}
                lessLabel={priorityLessLabel}
              >
                {priorityMembers.map((member) => (
                  <PersonMiniCard
                    key={keyForMember(member)}
                    href={hrefForMember(member)}
                    name={member.name}
                    context={priorityContextForMember?.(member)}
                    badgeLabel={member.badgeLabel}
                    badgeTone={member.badgeTone}
                    cardTone={member.cardTone}
                  />
                ))}
              </ProgressiveList>
            </div>
          ) : null}

          {regularMembers.length > 0 ? (
            <div className={cn("space-y-2", priorityMembers.length > 0 && "pt-1")}>
              {priorityMembers.length > 0 ? (
                <div>
                  <p className="k-item-title-sm">Ativos</p>
                  <p className="k-item-detail-tight">
                    {countLabel(regularMembers.length, "membro sem sinal aberto", "membros sem sinal aberto")}
                  </p>
                </div>
              ) : null}
              <ProgressiveList
                initialCount={regularInitialCount}
                step={regularStep}
                moreLabel={regularMoreLabel}
                lessLabel={regularLessLabel}
              >
                {regularMembers.map((member) => (
                  <PersonMiniCard
                    key={keyForMember(member)}
                    href={hrefForMember(member)}
                    name={member.name}
                    badgeLabel={member.badgeLabel}
                    badgeTone={member.badgeTone}
                    cardTone="muted"
                    compact
                  />
                ))}
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
            {regularMembers.map((member) => (
              <PersonMiniCard
                key={keyForMember(member)}
                href={hrefForMember(member)}
                name={member.name}
                context={filteredContextForMember?.(member)}
                badgeLabel={member.badgeLabel}
                badgeTone={member.badgeTone}
                cardTone={member.priorityRank >= 5 ? "muted" : member.cardTone}
                compact={member.priorityRank >= 5}
              />
            ))}
          </ProgressiveList>
          {regularMembers.length === 0 ? (
            <EmptyState compact>{emptyText}</EmptyState>
          ) : null}
        </div>
      )}
    </>
  );
}
