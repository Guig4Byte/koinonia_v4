import { Skeleton, SkeletonCard, SkeletonList, SkeletonSection, SkeletonText } from "@/components/ui/skeleton";
import { cn } from "@/lib/cn";
import pageStyles from "@/components/shared/consultation-page.module.css";
import styles from "./loading-skeletons.module.css";
import {
  ConsultationCardsSkeleton,
  EventCardSkeleton,
  FilterChipsSkeleton,
  GroupCardSkeleton,
  PageIntroSkeleton,
  SearchSkeleton,
  SummarySkeleton,
  TeamSupervisorSkeleton,
} from "./common";
import { AppLoadingShell } from "./app-loading-shell";

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
          <div className={cn(styles.cellsSections, "mt-6")}>
            <div className={styles.cellsSection}>
              <div className={styles.cellsHeading}>
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

function TeamStructureAdjustmentsSkeleton() {
  return (
    <SkeletonSection titleWidth="w-44" detailWidth="w-72" className="mt-6">
      <SkeletonCard className="space-y-3 rounded-3xl p-3">
        {Array.from({ length: 2 }).map((_, index) => (
          <SkeletonCard key={index} className="overflow-hidden rounded-2xl p-0 shadow-none">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 p-4">
              <div className="flex min-w-0 items-center gap-3">
                <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
                <div className="min-w-0">
                  <SkeletonText className={cn("h-4", index === 0 ? "w-36" : "w-40")} />
                  <SkeletonText className="mt-2 h-3 w-44" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-7 w-8 rounded-xl" />
                <Skeleton className="h-4 w-4" />
              </div>
            </div>
            <div className="px-4 pb-3">
              <div className="grid min-h-12 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
                <Skeleton className="h-1.5 w-1.5 rounded-full" />
                <div className="min-w-0">
                  <SkeletonText className="h-4 w-36" />
                  <SkeletonText className="mt-2 h-3 w-44" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-4 w-4" />
                </div>
              </div>
            </div>
          </SkeletonCard>
        ))}
      </SkeletonCard>
    </SkeletonSection>
  );
}

export function TeamPageSkeleton() {
  return (
    <AppLoadingShell headerVariant="compact">
      <div className={pageStyles.page}>
        <div className={pageStyles.header}>
          <PageIntroSkeleton action />
        </div>

        <SkeletonSection titleWidth="w-40" detailWidth="w-64">
          <SearchSkeleton />
          <div className="mt-3">
            <FilterChipsSkeleton count={5} />
          </div>
        </SkeletonSection>

        <SkeletonSection titleWidth="w-32" detailWidth="w-72" className="mt-6">
          <SkeletonList count={3}>{() => <TeamSupervisorSkeleton />}</SkeletonList>
        </SkeletonSection>

        <TeamStructureAdjustmentsSkeleton />
      </div>
    </AppLoadingShell>
  );
}

function PastorRadarSkeleton() {
  return (
    <SkeletonCard className="overflow-hidden rounded-3xl p-4">
      <div className="min-w-0">
        <SkeletonText className="h-3 w-28" />
        <SkeletonText className="mt-3 h-7 w-56 rounded-2xl" />
        <SkeletonText className="mt-2 h-3.5 w-full max-w-72" />
      </div>
    </SkeletonCard>
  );
}

function PastoralHealthCardSkeleton() {
  return (
    <SkeletonCard className="mt-4 overflow-hidden rounded-3xl p-0">
      <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-4 p-4 pb-0">
        <Skeleton className="h-16 w-16 rounded-full" />
        <div className="min-w-0 pt-1">
          <SkeletonText className="h-5 w-44 rounded-xl" />
          <SkeletonText className="mt-3 h-3.5 w-full max-w-72" />
          <SkeletonText className="mt-2 h-3.5 w-3/4" />
        </div>
      </div>
      <div className="px-4 pt-4">
        <Skeleton className="h-3 w-full rounded-full" />
      </div>
      <div className="grid gap-2 p-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <SkeletonCard key={index} className="flex min-h-11 items-center justify-between gap-3 rounded-2xl px-3 py-2 shadow-none">
            <div className="flex min-w-0 flex-1 items-center gap-2.5">
              <Skeleton className="h-3 w-3 shrink-0 rounded-full" />
              <SkeletonText className={cn("h-3.5", index % 2 === 0 ? "w-32" : "w-40")} />
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <SkeletonText className="h-4 w-5" />
              <Skeleton className="h-6 w-6 rounded-full" />
            </div>
          </SkeletonCard>
        ))}
      </div>
    </SkeletonCard>
  );
}

function PastorPresenceCardSkeleton() {
  return (
    <SkeletonCard className="mt-4 overflow-hidden rounded-3xl p-4">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div className="min-w-0">
          <SkeletonText className="h-3 w-36" />
          <SkeletonText className="mt-2 h-10 w-24 rounded-2xl" />
        </div>
        <Skeleton className="h-12 w-12 rounded-full" />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Skeleton className="h-6 w-28 rounded-full" />
        <SkeletonText className="h-3 w-36" />
      </div>
      <SkeletonText className="mt-3 h-3.5 w-full max-w-64" />
      <Skeleton className="mt-3 h-20 w-full rounded-2xl" />
    </SkeletonCard>
  );
}

function PastorTeamSummarySkeleton() {
  return (
    <SkeletonCard className="my-4 rounded-[1.15rem] p-4">
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="min-w-0">
          <SkeletonText className="h-3 w-28" />
          <SkeletonText className="mt-2 h-4 w-36" />
          <SkeletonText className="mt-2 h-3 w-48" />
        </div>
        <SkeletonText className="h-4 w-10" />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <SkeletonCard key={index} className="rounded-2xl p-3 shadow-none">
            <SkeletonText className="h-6 w-8 rounded-xl" />
            <SkeletonText className="mt-2 h-3 w-20" />
          </SkeletonCard>
        ))}
      </div>
    </SkeletonCard>
  );
}

export function PastorPageSkeleton() {
  return (
    <AppLoadingShell>
      <PastorRadarSkeleton />
      <SearchSkeleton />
      <PastoralHealthCardSkeleton />
      <PastorPresenceCardSkeleton />
      <PastorTeamSummarySkeleton />
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
