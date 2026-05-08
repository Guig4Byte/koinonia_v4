import Link from "next/link";
import { EmptyState, PersonMiniCard } from "@/components/cards";
import type { BadgeTone } from "@/components/ui/badge";
import { ProgressiveList } from "@/components/progressive-list";
import { MEMBERS_FILTERS, membersFilterHref, type MembersFilter } from "@/features/people/member-filters";
import { cn } from "@/lib/cn";

export type MemberPriorityCardTone = BadgeTone | "stable" | "muted";

export type MemberPriorityListItem = {
  initials: string;
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
      <div className="group-member-filter-row mb-3">
        {MEMBERS_FILTERS.map((option) => {
          const active = option.value === activeFilter;

          return (
            <Link
              key={option.value}
              href={membersFilterHref(basePath, option.value)}
              aria-current={active ? "page" : undefined}
              className={cn("team-filter-chip", active && "team-filter-chip-active")}
            >
              {option.label}
            </Link>
          );
        })}
      </div>

      {activeFilter === "todos" ? (
        <div className="group-detail-list">
          {priorityMembers.length > 0 ? (
            <div className="space-y-2">
              <div>
                <p className="text-sm font-semibold text-[var(--color-text-primary)]">Quem merece proximidade</p>
                <p className="mt-0.5 text-xs leading-relaxed text-[var(--color-text-secondary)]">
                  {priorityMembers.length} {priorityMembers.length === 1 ? "pessoa no radar" : "pessoas no radar"}
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
                    initials={member.initials}
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
                  <p className="text-sm font-semibold text-[var(--color-text-primary)]">Ativos</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-[var(--color-text-secondary)]">
                    {regularMembers.length} {regularMembers.length === 1 ? "membro sem sinal aberto" : "membros sem sinal aberto"}
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
                    initials={member.initials}
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
        <div className="group-detail-list">
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
                initials={member.initials}
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
