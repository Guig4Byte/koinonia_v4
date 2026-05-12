import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { avatarColorForName, initials } from "@/lib/text";

export type AvatarSize = "sm" | "md" | "lg" | "xl";

type AvatarProps = HTMLAttributes<HTMLSpanElement> & {
  name: string;
  size?: AvatarSize;
};

const avatarSizeClass: Record<AvatarSize, string> = {
  sm: "h-8 w-8 text-[length:var(--text-xs)]",
  md: "h-9 w-9 text-[length:var(--text-xs)]",
  lg: "h-11 w-11 text-[length:var(--text-sm)]",
  xl: "h-12 w-12 text-[length:var(--text-sm)]",
};

export function Avatar({ name, size = "md", className, style, ...props }: AvatarProps) {
  const colors = avatarColorForName(name);

  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-bold",
        avatarSizeClass[size],
        className,
      )}
      style={{ backgroundColor: colors.bg, color: colors.text, ...style }}
      aria-hidden="true"
      {...props}
    >
      {initials(name)}
    </span>
  );
}
