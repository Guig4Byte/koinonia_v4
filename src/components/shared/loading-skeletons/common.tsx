import { Skeleton, SkeletonCard, SkeletonText } from "@/components/ui/skeleton";
import { cn } from "@/lib/cn";
import memberStyles from "@/features/people/components/member-priority-list.module.css";
import eventStyles from "@/features/events/components/events-page-sections.module.css";
import teamStyles from "@/features/team/components/team-structure-cards.module.css";
import groupStyles from "@/features/groups/components/group-detail.module.css";

export function PageIntroSkeleton({ action = false }: { action?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0 flex-1">
        <SkeletonText className="h-8 w-28 rounded-2xl" />
        <SkeletonText className="mt-3 h-3.5 w-full max-w-80" />
        <SkeletonText className="mt-2 h-3.5 w-2/3" />
      </div>
      {action ? <Skeleton className="h-9 w-28 shrink-0 rounded-2xl" /> : null}
    </div>
  );
}

export function SearchSkeleton() {
  return (
    <SkeletonCard className="flex min-h-12 items-center gap-3 rounded-[1.15rem] p-4">
      <Skeleton className="h-4 w-4 shrink-0" />
      <SkeletonText className="h-3.5 w-40" />
    </SkeletonCard>
  );
}

export function FilterChipsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className={cn(memberStyles.filterRow, "mb-3")} aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton key={index} className={cn("h-8 rounded-full", index === 0 ? "w-16" : "w-24")} />
      ))}
    </div>
  );
}

export function SummarySkeleton({ items = 4 }: { items?: number }) {
  return (
    <SkeletonCard className="mb-5 rounded-[1.15rem] p-4">
      <div className="space-y-3">
        {Array.from({ length: items }).map((_, index) => (
          <div key={index} className="flex items-center justify-between gap-4 border-b border-[var(--color-border-divider)] pb-3 last:border-0 last:pb-0">
            <div className="min-w-0 flex-1">
              <SkeletonText className={cn("h-4", index % 2 === 0 ? "w-32" : "w-44")} />
              <SkeletonText className={cn("mt-2 h-3", index % 2 === 0 ? "w-52" : "w-40")} />
            </div>
            <SkeletonText className="h-7 w-10 shrink-0 rounded-xl" />
          </div>
        ))}
      </div>
    </SkeletonCard>
  );
}

export function PersonCardSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <SkeletonCard className={cn("rounded-[1.15rem] p-4", compact && "py-3")}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <SkeletonText className="h-4 w-36" />
          {!compact ? <SkeletonText className="mt-2 h-3 w-52" /> : null}
        </div>
        <Skeleton className="h-6 w-20 shrink-0 rounded-full" />
      </div>
      {!compact ? <SkeletonText className="mt-3 h-3 w-24" /> : null}
    </SkeletonCard>
  );
}

export function GroupCardSkeleton() {
  return (
    <SkeletonCard className="rounded-[1.15rem] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <SkeletonText className="h-4 w-36" />
          <SkeletonText className="mt-2 h-3 w-56" />
        </div>
        <Skeleton className="h-6 w-20 shrink-0 rounded-full" />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-[var(--color-border-divider)] pt-3">
        <SkeletonText className="h-8 rounded-xl" />
        <SkeletonText className="h-8 rounded-xl" />
        <SkeletonText className="h-8 rounded-xl" />
      </div>
    </SkeletonCard>
  );
}

export function EventCardSkeleton({ action = "pill" }: { action?: "full" | "pill" }) {
  return (
    <SkeletonCard className={cn(eventStyles.card, "p-4")}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <SkeletonText className="h-4 w-40" />
          <SkeletonText className="mt-2 h-3 w-56" />
        </div>
        <Skeleton className="h-6 w-20 shrink-0 rounded-full" />
      </div>
      <div className={eventStyles.stats}>
        <SkeletonText className="h-8 rounded-xl" />
        <SkeletonText className="h-8 rounded-xl" />
        <SkeletonText className="h-8 rounded-xl" />
      </div>
      <SkeletonText className={cn("mt-3 rounded-full", action === "full" ? "h-9 w-full rounded-2xl" : "h-8 w-32")} />
    </SkeletonCard>
  );
}

export function TeamSupervisorSkeleton() {
  return (
    <SkeletonCard className={cn(teamStyles.supervisorCard, "p-3")}>
      <div className="flex items-start gap-2.5">
        <Skeleton className="h-9 w-9 shrink-0" />
        <div className="min-w-0 flex-1">
          <SkeletonText className="h-4 w-36" />
          <SkeletonText className="mt-3 h-3 w-full" />
          <SkeletonText className="mt-2 h-3 w-28" />
          <div className="mt-4 space-y-3 border-t border-[var(--color-border-divider)] pt-3">
            <SkeletonText className="h-3.5 w-full" />
            <SkeletonText className="h-3.5 w-4/5" />
          </div>
        </div>
      </div>
    </SkeletonCard>
  );
}

export function ConsultationCardsSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 2 }).map((_, index) => (
        <SkeletonCard key={index}>
          <SkeletonText className={cn("h-4", index === 0 ? "w-40" : "w-36")} />
          <SkeletonText className="mt-3 h-3 w-full" />
          <SkeletonText className={cn("mt-2 h-3", index === 0 ? "w-2/3" : "w-3/4")} />
          <SkeletonText className="mt-4 h-3.5 w-24" />
        </SkeletonCard>
      ))}
    </div>
  );
}

export function BackLinkSkeleton() {
  return (
    <div className="mb-4 flex min-h-10 items-center gap-2 px-2.5" aria-hidden="true">
      <Skeleton className="h-4 w-4" />
      <SkeletonText className="h-3.5 w-20" />
    </div>
  );
}

export function GroupDetailHeroSkeleton() {
  return (
    <SkeletonCard className={cn(groupStyles.hero, "p-5")}>
      <SkeletonText className="h-3 w-16" />
      <SkeletonText className="mt-3 h-8 w-44 rounded-2xl" />
      <SkeletonText className="mt-3 h-3.5 w-full max-w-72" />
      <SkeletonText className="mt-4 h-7 w-56 rounded-full" />
    </SkeletonCard>
  );
}

export function MetricPlaceholderRows({ count = 3 }: { count?: number }) {
  return (
    <div className="mt-4 space-y-2 border-t border-[var(--color-border-divider)] pt-3">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="flex items-center justify-between gap-3 rounded-2xl bg-[var(--metric-card-bg)] px-3 py-2">
          <div className="min-w-0 flex-1">
            <SkeletonText className="h-3.5 w-32" />
            <SkeletonText className="mt-2 h-3 w-24" />
          </div>
          <Skeleton className="h-6 w-20 shrink-0 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function GroupedMetricPlaceholderRows({ groups = 2, rowsPerGroup = 3 }: { groups?: number; rowsPerGroup?: number }) {
  return (
    <div className="mt-4 space-y-4">
      {Array.from({ length: groups }).map((_, groupIndex) => (
        <div key={groupIndex} className="space-y-2">
          <div>
            <SkeletonText className="h-4 w-32" />
            <SkeletonText className="mt-2 h-3 w-52" />
          </div>
          <div className="space-y-1.5">
            {Array.from({ length: rowsPerGroup }).map((__, index) => (
              <div key={index} className="flex items-center justify-between gap-3 rounded-2xl bg-[var(--metric-card-bg)] px-3 py-2">
                <SkeletonText className="h-3.5 w-36" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
