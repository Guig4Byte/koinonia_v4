import { Skeleton, SkeletonCard, SkeletonList, SkeletonSection, SkeletonText } from "@/components/ui/skeleton";
import styles from "./loading-skeletons.module.css";
import {
  BackLinkSkeleton,
  EventCardSkeleton,
  FilterChipsSkeleton,
  GroupDetailHeroSkeleton,
  GroupedMetricPlaceholderRows,
  MetricPlaceholderRows,
  PersonCardSkeleton,
  SummarySkeleton,
} from "./common";
import { AppLoadingShell } from "./app-loading-shell";

function PersonDetailHeroSkeleton() {
  return (
    <SkeletonCard className="rounded-[1.15rem] p-4">
      <div className="flex items-start gap-3">
        <Skeleton className="h-12 w-12 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <SkeletonText className="h-7 w-44 rounded-2xl" />
              <SkeletonText className="mt-2 h-3 w-40" />
            </div>
            <Skeleton className="h-6 w-24 shrink-0 rounded-full" />
          </div>
          <SkeletonText className="mt-3 h-12 w-full rounded-2xl" />
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <SkeletonText className="h-10 rounded-2xl" />
        <SkeletonText className="h-10 rounded-2xl" />
      </div>
    </SkeletonCard>
  );
}

function PersonPresenceDetailSkeleton() {
  return (
    <SkeletonCard>
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <SkeletonText className="h-4 w-32" />
          <SkeletonText className="mt-2 h-3 w-full" />
          <SkeletonText className="mt-2 h-3 w-2/3" />
        </div>
        <div className="shrink-0 text-right">
          <SkeletonText className="h-7 w-14 rounded-xl" />
          <SkeletonText className="ml-auto mt-2 h-3 w-12" />
        </div>
      </div>
      <MetricPlaceholderRows />
    </SkeletonCard>
  );
}

function CareOverviewSkeleton() {
  return (
    <SkeletonCard className="rounded-[1.35rem] p-4">
      <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="min-w-0">
          <SkeletonText className="h-4 w-44" />
          <SkeletonText className="mt-2 h-3 w-full" />
          <SkeletonText className="mt-2 h-3 w-3/4" />
        </div>
      </div>
      <SkeletonText className="mt-4 h-8 w-full rounded-2xl" />
      <div className="mt-3 grid grid-cols-2 gap-2">
        <SkeletonText className="h-10 rounded-2xl" />
        <SkeletonText className="h-10 rounded-2xl" />
      </div>
    </SkeletonCard>
  );
}

function SignalDetailCardSkeleton() {
  return (
    <SkeletonCard className="rounded-[1.15rem] p-4">
      <SkeletonText className="h-4 w-40" />
      <SkeletonText className="mt-2 h-3 w-52" />
      <SkeletonText className="mt-3 h-14 w-full rounded-2xl" />
      <div className="mt-4 grid grid-cols-2 gap-2 border-t border-[var(--color-border-divider)] pt-3">
        <SkeletonText className="h-10 rounded-2xl" />
        <SkeletonText className="h-10 rounded-2xl" />
      </div>
    </SkeletonCard>
  );
}

function HistoryCardSkeleton() {
  return (
    <SkeletonCard>
      <div className="divide-y divide-[var(--color-border-divider)]">
        {Array.from({ length: 3 }).map((_, index) => (
          <article key={index} className="py-3 first:pt-0 last:pb-0">
            <SkeletonText className="h-4 w-36" />
            <SkeletonText className="mt-2 h-3 w-48" />
            {index === 0 ? <SkeletonText className="mt-3 h-8 w-full rounded-2xl" /> : null}
          </article>
        ))}
      </div>
    </SkeletonCard>
  );
}

function PendingEventDetailSkeleton() {
  return <EventCardSkeleton action="full" />;
}

function EventDetailHeaderSkeleton() {
  return (
    <SkeletonCard>
      <div className="k-card-header-row">
        <div className="min-w-0 flex-1">
          <SkeletonText className="h-3 w-28" />
          <SkeletonText className="mt-3 h-7 w-48 rounded-2xl" />
          <SkeletonText className="mt-2 h-3 w-56" />
          <SkeletonText className="mt-2 h-3 w-36" />
          <SkeletonText className="mt-4 h-3.5 w-20" />
        </div>
        <Skeleton className="h-6 w-20 shrink-0 rounded-full" />
      </div>
      <div className="mt-4">
        <SummarySkeleton items={3} />
      </div>
    </SkeletonCard>
  );
}

function EventReadOnlyDetailSkeleton() {
  return (
    <section className="space-y-3">
      <SkeletonCard>
        <SkeletonText className="h-4 w-20" />
        <SkeletonText className="mt-2 h-3 w-64" />
        <GroupedMetricPlaceholderRows />
      </SkeletonCard>
      <SkeletonCard>
        <SkeletonText className="h-4 w-24" />
        <SkeletonText className="mt-2 h-3 w-56" />
        <div className="mt-3 space-y-1.5">
          <div className="flex items-center justify-between gap-3 rounded-2xl bg-[var(--metric-card-bg)] px-3 py-2">
            <SkeletonText className="h-3.5 w-36" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        </div>
      </SkeletonCard>
    </section>
  );
}

export function PersonDetailPageSkeleton() {
  return (
    <AppLoadingShell headerVariant="compact">
      <BackLinkSkeleton />
      <PersonDetailHeroSkeleton />

      <SkeletonSection titleWidth="w-36" detailWidth="w-64">
        <CareOverviewSkeleton />
      </SkeletonSection>

      <SkeletonSection titleWidth="w-44" detailWidth="w-72">
        <SkeletonList count={2}>{() => <SignalDetailCardSkeleton />}</SkeletonList>
      </SkeletonSection>

      <SkeletonSection titleWidth="w-36">
        <PersonPresenceDetailSkeleton />
      </SkeletonSection>

      <SkeletonSection titleWidth="w-32" detailWidth="w-64">
        <HistoryCardSkeleton />
      </SkeletonSection>

      <SkeletonSection titleWidth="w-36">
        <SkeletonCard>
          <div className="k-card-header-row">
            <div className="min-w-0 flex-1">
              <SkeletonText className="h-4 w-40" />
              <SkeletonText className="mt-2 h-3 w-64" />
            </div>
          </div>
          <SkeletonText className="mt-3 h-3.5 w-20" />
        </SkeletonCard>
      </SkeletonSection>
    </AppLoadingShell>
  );
}

export function GroupDetailPageSkeleton() {
  return (
    <AppLoadingShell headerVariant="compact">
      <div className={styles.groupPage}>
        <BackLinkSkeleton />

        <GroupDetailHeroSkeleton />

        <div>
          <SkeletonCard className="relative overflow-hidden rounded-[1.35rem] p-5">
            <Skeleton className="absolute inset-x-0 top-0 h-1 rounded-none bg-[var(--color-brand-accent)]" />
            <SkeletonText className="h-6 w-full max-w-72 rounded-2xl" />
            <SkeletonText className="mt-3 h-3.5 w-full" />
            <SkeletonText className="mt-2 h-3.5 w-3/4" />
          </SkeletonCard>
        </div>

        <div className={styles.groupSummary}>
          <SummarySkeleton />
        </div>

        <PendingEventDetailSkeleton />

        <SkeletonSection titleWidth="w-20" detailWidth="w-52">
          <FilterChipsSkeleton />
          <div>
            <div className="space-y-2">
              <SkeletonText className="h-4 w-44" />
              <SkeletonList count={3}>{() => <PersonCardSkeleton />}</SkeletonList>
            </div>
            <div className="space-y-2 pt-1">
              <SkeletonText className="h-4 w-20" />
              <SkeletonList count={3}>{() => <PersonCardSkeleton compact />}</SkeletonList>
            </div>
          </div>
        </SkeletonSection>

        <SkeletonSection titleWidth="w-44">
          <SkeletonList count={2}>{() => <EventCardSkeleton />}</SkeletonList>
        </SkeletonSection>
      </div>
    </AppLoadingShell>
  );
}

export function EventDetailPageSkeleton() {
  return (
    <AppLoadingShell headerVariant="compact">
      <BackLinkSkeleton />
      <EventDetailHeaderSkeleton />

      <SkeletonSection titleWidth="w-40">
        <EventReadOnlyDetailSkeleton />
      </SkeletonSection>
    </AppLoadingShell>
  );
}
