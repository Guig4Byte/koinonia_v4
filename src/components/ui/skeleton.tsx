import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/cn";

type SkeletonProps = ComponentPropsWithoutRef<"div">;

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse rounded-full bg-[var(--surface-alt)]", className)}
      {...props}
    />
  );
}

export function SkeletonText({ className, ...props }: SkeletonProps) {
  return <Skeleton className={cn("h-3.5", className)} {...props} />;
}

export function SkeletonCard({ className, ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "rounded-[1.15rem] border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-4 shadow-card",
        className,
      )}
      {...props}
    />
  );
}

export function SkeletonList({
  count = 3,
  className,
  itemClassName,
  children,
}: {
  count?: number;
  className?: string;
  itemClassName?: string;
  children?: (index: number) => ReactNode;
}) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className={itemClassName}>
          {children ? children(index) : <SkeletonCard />}
        </div>
      ))}
    </div>
  );
}

export function SkeletonSection({
  titleWidth = "w-32",
  detailWidth,
  children,
  className,
}: {
  titleWidth?: string;
  detailWidth?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("mt-6", className)}>
      <SkeletonText className={cn("h-4", titleWidth)} />
      {detailWidth ? <SkeletonText className={cn("mt-2 h-3", detailWidth)} /> : null}
      {children ? <div className="mt-3">{children}</div> : null}
    </section>
  );
}
