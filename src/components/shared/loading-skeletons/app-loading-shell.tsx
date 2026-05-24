import type { ReactNode } from "react";
import { Skeleton, SkeletonText } from "@/components/ui/skeleton";
import { cn } from "@/lib/cn";

export function AppLoadingShell({
  children,
  headerVariant = "full",
}: {
  children: ReactNode;
  headerVariant?: "full" | "compact";
}) {
  return (
    <main className="safe-page safe-page-with-nav">
      <header className={cn("app-header", headerVariant === "compact" && "app-header-compact")} aria-hidden="true">
        {headerVariant === "compact" ? (
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <SkeletonText className="h-3 w-20 bg-[var(--color-theme-icon-active-bg)] opacity-70" />
              <SkeletonText className="mt-2 h-4 w-40 bg-[var(--color-theme-icon-active-bg)] opacity-60" />
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Skeleton className="h-[38px] w-[38px] rounded-2xl bg-[var(--color-theme-icon-active-bg)] opacity-60" />
              <Skeleton className="h-[38px] w-[38px] rounded-2xl bg-[var(--color-theme-icon-active-bg)] opacity-60" />
              <Skeleton className="h-[38px] w-[38px] rounded-2xl bg-[var(--color-theme-icon-active-bg)] opacity-60" />
            </div>
          </div>
        ) : (
          <>
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
          </>
        )}
      </header>

      <section className="content-flow" aria-busy="true" aria-live="polite">
        <span className="sr-only">Carregando conteúdo...</span>
        {children}
      </section>

      <nav
        aria-hidden="true"
        className="fixed left-1/2 z-50 max-w-[424px] -translate-x-1/2"
        style={{
          bottom: "calc(env(safe-area-inset-bottom) + var(--bottom-nav-offset))",
          width: "calc(100% - 24px)",
        }}
      >
        <div className="grid h-[var(--bottom-nav-height)] grid-cols-3 gap-1 rounded-[1.25rem] border border-[var(--color-border-tab)] bg-[var(--color-bg-tab)] p-1 shadow-[var(--color-shadow-nav)] backdrop-blur-[2px]">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex min-h-12 flex-col items-center justify-center rounded-[1rem] px-1.5 py-1">
              <Skeleton className="h-[18px] w-[18px] bg-[var(--color-bg-tab-active)] opacity-70" />
              <SkeletonText className="mt-2 h-2.5 w-12 bg-[var(--color-bg-tab-active)] opacity-60" />
            </div>
          ))}
        </div>
      </nav>
    </main>
  );
}
