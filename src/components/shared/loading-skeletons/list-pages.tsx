import { SkeletonCard, SkeletonList, SkeletonSection, SkeletonText } from "@/components/ui/skeleton";
import { cn } from "@/lib/cn";
import pageStyles from "@/components/shared/consultation-page.module.css";
import cellsStyles from "@/features/groups/components/cells-page-sections.module.css";
import {
  ConsultationCardsSkeleton,
  EventCardSkeleton,
  FilterChipsSkeleton,
  GroupCardSkeleton,
  PageIntroSkeleton,
  PersonCardSkeleton,
  SearchSkeleton,
  SummarySkeleton,
  TeamSupervisorSkeleton,
} from "./common";
import { AppLoadingShell } from "./app-loading-shell";

export function PeoplePageSkeleton() {
  return (
    <AppLoadingShell>
      <SearchSkeleton />
      <SkeletonSection titleWidth="w-28" detailWidth="w-56">
        <FilterChipsSkeleton />
        <div>
          <div className="space-y-2">
            <div>
              <SkeletonText className="h-4 w-44" />
              <SkeletonText className="mt-2 h-3 w-32" />
            </div>
            <SkeletonList count={4}>{() => <PersonCardSkeleton />}</SkeletonList>
          </div>
          <div className="space-y-2 pt-1">
            <div>
              <SkeletonText className="h-4 w-20" />
              <SkeletonText className="mt-2 h-3 w-44" />
            </div>
            <SkeletonList count={3}>{() => <PersonCardSkeleton compact />}</SkeletonList>
          </div>
        </div>
      </SkeletonSection>
    </AppLoadingShell>
  );
}

export function CellsPageSkeleton() {
  return (
    <AppLoadingShell>
      <div className={pageStyles.page}>
        <PageIntroSkeleton action />

        <div className={pageStyles.summaryBlock}>
          <SummarySkeleton />
        </div>

        <SkeletonSection titleWidth="w-44" detailWidth="w-64">
          <SearchSkeleton />
          <div className="mt-3">
            <FilterChipsSkeleton count={5} />
          </div>
          <div className={cn(cellsStyles.sections, "mt-6")}>
            <div className={cellsStyles.section}>
              <div className={cellsStyles.heading}>
                <SkeletonText className="h-3 w-36" />
              </div>
              <SkeletonList count={3}>{() => <GroupCardSkeleton />}</SkeletonList>
            </div>
          </div>
        </SkeletonSection>

        <SkeletonSection titleWidth="w-24">
          <SkeletonCard>
            <SkeletonText className="h-3.5 w-full" />
            <SkeletonText className="mt-2 h-3.5 w-3/4" />
          </SkeletonCard>
        </SkeletonSection>
      </div>
    </AppLoadingShell>
  );
}

export function TeamPageSkeleton() {
  return (
    <AppLoadingShell>
      <div className={pageStyles.page}>
        <div className={pageStyles.header}>
          <PageIntroSkeleton action />
        </div>

        <div className={pageStyles.summaryBlock}>
          <SkeletonText className="mb-2 mt-6 h-4 w-20" />
          <SummarySkeleton />
        </div>

        <SkeletonSection titleWidth="w-40" detailWidth="w-64">
          <SearchSkeleton />
          <div className="mt-3">
            <FilterChipsSkeleton count={5} />
          </div>
        </SkeletonSection>

        <SkeletonSection titleWidth="w-32" detailWidth="w-72">
          <SkeletonList count={3}>{() => <TeamSupervisorSkeleton />}</SkeletonList>
        </SkeletonSection>

        <SkeletonSection titleWidth="w-24">
          <SkeletonCard>
            <SkeletonText className="h-3.5 w-full" />
            <SkeletonText className="mt-2 h-3.5 w-3/4" />
          </SkeletonCard>
        </SkeletonSection>
      </div>
    </AppLoadingShell>
  );
}

export function EventsPageSkeleton() {
  return (
    <AppLoadingShell>
      <div className={cn(pageStyles.page, pageStyles.eventsPage)}>
        <SkeletonText className="h-8 w-36 rounded-2xl" />
        <SkeletonText className="mt-3 h-3.5 w-full max-w-80" />
        <SkeletonText className="mt-2 h-3.5 w-2/3" />

        <SkeletonSection titleWidth="w-16">
          <SkeletonList count={2}>{() => <EventCardSkeleton />}</SkeletonList>
        </SkeletonSection>

        <SkeletonSection titleWidth="w-40">
          <SkeletonList count={3}>{() => <EventCardSkeleton />}</SkeletonList>
        </SkeletonSection>

        <SkeletonSection titleWidth="w-52" detailWidth="w-72">
          <ConsultationCardsSkeleton />
        </SkeletonSection>
      </div>
    </AppLoadingShell>
  );
}
