import Link, { type LinkProps } from "next/link";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { priorityCardSurfaceClassName, type PriorityCardPadding } from "@/components/ui/priority-card";
import type { CardPriorityTone } from "@/lib/card-priority";

type CardLinkProps = LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps | "className"> & {
    priorityTone?: CardPriorityTone;
    padding?: PriorityCardPadding;
    className?: string;
    children: ReactNode;
  };

export function CardLink({ priorityTone, padding = "md", className, children, ...props }: CardLinkProps) {
  return (
    <Link
      className={priorityCardSurfaceClassName({
        priorityTone,
        padding,
        interactive: true,
        className: ["block", className].filter(Boolean).join(" "),
      })}
      {...props}
    >
      {children}
    </Link>
  );
}
