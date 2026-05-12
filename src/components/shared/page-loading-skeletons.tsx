import type { ReactNode } from "react";
import { Skeleton, SkeletonCard, SkeletonList, SkeletonSection, SkeletonText } from "@/components/ui/skeleton";
import { cn } from "@/lib/cn";

function AppLoadingShell({ children }: { children: ReactNode }) {
  return (
    <main className="safe-page">
      <header className="app-header" aria-hidden="true">
        <div className="flex items-start justify-between gap-4">
          <div className="w-24">
            <SkeletonText className="h-3 w-20 bg-[var(--color-theme-icon-active-bg)] opacity-70" />
            <SkeletonText className="mt-2 h-3 w-14 bg-[var(--color-theme-icon-active-bg)] opacity-60" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-[38px] w-[38px] rounded-2xl bg-[var(--color-theme-icon-active-bg)] opacity-60" />
            <Skeleton className="h-[38px] w-[38px] rounded-2xl bg-[var(--color-theme-icon-active-bg)] opacity-60" />
          </div>
        </div>

        <div className="mt-5 flex items-end justify-between gap-4">
          <div className="w-full max-w-44">
            <SkeletonText className="h-3.5 w-10 bg-[var(--color-theme-icon-active-bg)] opacity-60" />
            <SkeletonText className="mt-3 h-12 w-32 rounded-2xl bg-[var(--color-theme-icon-active-bg)] opacity-70" />
          </div>
          <Skeleton className="h-[38px] w-[38px] rounded-2xl bg-[var(--color-theme-icon-active-bg)] opacity-60" />
        </div>
      </header>

      <section className="content-flow" aria-busy="true" aria-live="polite">
        <span className="sr-only">Carregando conteúdo...</span>
        {children}
      </section>

      <nav
        aria-hidden="true"
        className="fixed left-1/2 z-50 max-w-[448px] -translate-x-1/2"
        style={{
          bottom: "calc(env(safe-area-inset-bottom) + var(--bottom-nav-offset))",
          width: "calc(100% - 32px)",
        }}
      >
        <div className="grid h-[var(--bottom-nav-height)] grid-cols-3 gap-1 rounded-[1.35rem] border border-[var(--color-border-tab)] bg-[var(--color-bg-tab)] p-1 shadow-[var(--color-shadow-nav)] backdrop-blur-[2px]">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex min-h-12 flex-col items-center justify-center rounded-[1rem] px-2 py-1">
              <Skeleton className="h-[18px] w-[18px] bg-[var(--color-bg-tab-active)] opacity-70" />
              <SkeletonText className="mt-2 h-2.5 w-12 bg-[var(--color-bg-tab-active)] opacity-60" />
            </div>
          ))}
        </div>
      </nav>
    </main>
  );
}

function SearchSkeleton() {
  return (
    <SkeletonCard className="flex min-h-12 items-center gap-3 rounded-[1.15rem] p-4">
      <Skeleton className="h-4 w-4 shrink-0" />
      <SkeletonText className="h-3.5 w-40" />
    </SkeletonCard>
  );
}

function FilterChipsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="group-member-filter-row mb-3" aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton key={index} className={cn("h-8 rounded-full", index === 0 ? "w-16" : "w-24")} />
      ))}
    </div>
  );
}

function SummarySkeleton({ items = 4, balanced = false }: { items?: number; balanced?: boolean }) {
  return (
    <SkeletonCard className={cn("context-summary mb-5 rounded-[1.15rem] p-4", balanced && "context-summary-balanced")}>
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

function PersonCardSkeleton({ compact = false }: { compact?: boolean }) {
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

function GroupCardSkeleton() {
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

function EventCardSkeleton() {
  return (
    <SkeletonCard className="event-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <SkeletonText className="h-4 w-40" />
          <SkeletonText className="mt-2 h-3 w-56" />
        </div>
        <Skeleton className="h-6 w-20 shrink-0 rounded-full" />
      </div>
      <div className="event-card-stats">
        <SkeletonText className="h-8 rounded-xl" />
        <SkeletonText className="h-8 rounded-xl" />
        <SkeletonText className="h-8 rounded-xl" />
      </div>
      <SkeletonText className="mt-3 h-8 w-32 rounded-full" />
    </SkeletonCard>
  );
}

function TeamSupervisorSkeleton() {
  return (
    <SkeletonCard className="team-supervisor-card p-3">
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

function ConsultationCardsSkeleton() {
  return (
    <div className="space-y-3">
      <SkeletonCard>
        <SkeletonText className="h-4 w-40" />
        <SkeletonText className="mt-3 h-3 w-full" />
        <SkeletonText className="mt-2 h-3 w-2/3" />
        <SkeletonText className="mt-4 h-3.5 w-24" />
      </SkeletonCard>
      <SkeletonCard>
        <SkeletonText className="h-4 w-36" />
        <SkeletonText className="mt-3 h-3 w-full" />
        <SkeletonText className="mt-2 h-3 w-3/4" />
        <SkeletonText className="mt-4 h-3.5 w-24" />
      </SkeletonCard>
    </div>
  );
}

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
      <div className="team-page">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <SkeletonText className="h-8 w-28 rounded-2xl" />
            <SkeletonText className="mt-3 h-3.5 w-full max-w-80" />
            <SkeletonText className="mt-2 h-3.5 w-2/3" />
          </div>
          <Skeleton className="h-9 w-28 shrink-0 rounded-2xl" />
        </div>

        <div className="team-summary-block">
          <SummarySkeleton />
        </div>

        <SkeletonSection titleWidth="w-44" detailWidth="w-64">
          <SearchSkeleton />
          <div className="mt-3">
            <FilterChipsSkeleton count={5} />
          </div>
          <div className="cell-priority-sections mt-6">
            <div className="cell-priority-section">
              <div className="cell-priority-heading">
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
      <div className="team-page">
        <div className="team-page-header flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <SkeletonText className="h-8 w-28 rounded-2xl" />
            <SkeletonText className="mt-3 h-3.5 w-full max-w-80" />
            <SkeletonText className="mt-2 h-3.5 w-2/3" />
          </div>
          <Skeleton className="h-9 w-28 shrink-0 rounded-2xl" />
        </div>

        <div className="team-summary-block">
          <SkeletonText className="mb-2 mt-6 h-4 w-20" />
          <SummarySkeleton balanced />
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
      <div className="events-page">
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
function BackLinkSkeleton() {
  return (
    <div className="mb-4 flex min-h-10 items-center gap-2 px-2.5" aria-hidden="true">
      <Skeleton className="h-4 w-4" />
      <SkeletonText className="h-3.5 w-20" />
    </div>
  );
}

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
      <div className="mt-4 space-y-2 border-t border-[var(--color-border-divider)] pt-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="flex items-center justify-between gap-3 rounded-2xl bg-[var(--metric-card-bg)] px-3 py-2">
            <div className="min-w-0 flex-1">
              <SkeletonText className="h-3.5 w-32" />
              <SkeletonText className="mt-2 h-3 w-24" />
            </div>
            <Skeleton className="h-6 w-20 shrink-0 rounded-full" />
          </div>
        ))}
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

function GroupDetailHeroSkeleton() {
  return (
    <SkeletonCard className="group-detail-hero p-5">
      <SkeletonText className="h-3 w-16" />
      <SkeletonText className="mt-3 h-8 w-44 rounded-2xl" />
      <SkeletonText className="mt-3 h-3.5 w-full max-w-72" />
      <SkeletonText className="mt-4 h-7 w-56 rounded-full" />
    </SkeletonCard>
  );
}

function PendingEventDetailSkeleton() {
  return (
    <SkeletonCard className="event-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <SkeletonText className="h-4 w-40" />
          <SkeletonText className="mt-2 h-3 w-56" />
        </div>
        <Skeleton className="h-6 w-20 shrink-0 rounded-full" />
      </div>
      <div className="event-card-stats">
        <SkeletonText className="h-8 rounded-xl" />
        <SkeletonText className="h-8 rounded-xl" />
        <SkeletonText className="h-8 rounded-xl" />
      </div>
      <SkeletonText className="mt-3 h-9 w-full rounded-2xl" />
    </SkeletonCard>
  );
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
        <SummarySkeleton items={3} balanced />
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
        <div className="mt-4 space-y-4">
          {Array.from({ length: 2 }).map((_, groupIndex) => (
            <div key={groupIndex} className="space-y-2">
              <div>
                <SkeletonText className="h-4 w-32" />
                <SkeletonText className="mt-2 h-3 w-52" />
              </div>
              <div className="space-y-1.5">
                {Array.from({ length: 3 }).map((__, index) => (
                  <div key={index} className="flex items-center justify-between gap-3 rounded-2xl bg-[var(--metric-card-bg)] px-3 py-2">
                    <SkeletonText className="h-3.5 w-36" />
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
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
    <AppLoadingShell>
      <BackLinkSkeleton />
      <PersonDetailHeroSkeleton />

      <SkeletonSection titleWidth="w-36">
        <PersonPresenceDetailSkeleton />
      </SkeletonSection>

      <SkeletonSection titleWidth="w-44">
        <SkeletonList count={2}>{() => <SignalDetailCardSkeleton />}</SkeletonList>
      </SkeletonSection>

      <SkeletonSection titleWidth="w-32">
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
    <AppLoadingShell>
      <div className="group-detail-page">
        <BackLinkSkeleton />

        <div className="mb-4 flex justify-end">
          <Skeleton className="h-10 w-28 rounded-2xl" />
        </div>

        <GroupDetailHeroSkeleton />

        <div>
          <SkeletonCard className="relative overflow-hidden rounded-[1.35rem] p-5">
            <Skeleton className="absolute inset-x-0 top-0 h-1 rounded-none bg-[var(--color-brand-accent)]" />
            <SkeletonText className="h-6 w-full max-w-72 rounded-2xl" />
            <SkeletonText className="mt-3 h-3.5 w-full" />
            <SkeletonText className="mt-2 h-3.5 w-3/4" />
          </SkeletonCard>
        </div>

        <div className="group-detail-summary">
          <SummarySkeleton balanced />
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
    <AppLoadingShell>
      <BackLinkSkeleton />
      <EventDetailHeaderSkeleton />

      <SkeletonSection titleWidth="w-40">
        <EventReadOnlyDetailSkeleton />
      </SkeletonSection>
    </AppLoadingShell>
  );
}

