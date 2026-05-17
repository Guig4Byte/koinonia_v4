import Link, { type LinkProps } from "next/link";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import {
  buttonClassName,
  type ButtonAlign,
  type ButtonDensity,
  type ButtonResponsiveWidth,
  type ButtonShape,
  type ButtonSize,
  type ButtonVariant,
} from "@/components/ui/button";

type ButtonLinkProps = LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps | "className"> & {
    variant?: ButtonVariant;
    size?: ButtonSize;
    shape?: ButtonShape;
    density?: ButtonDensity;
    align?: ButtonAlign;
    fullWidth?: boolean;
    responsiveWidth?: ButtonResponsiveWidth;
    className?: string;
    children: ReactNode;
  };

export function ButtonLink({
  variant = "primary",
  size = "md",
  shape = "default",
  density = "default",
  align = "center",
  fullWidth = false,
  responsiveWidth = "auto",
  className,
  children,
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      className={buttonClassName({ variant, size, shape, density, align, fullWidth, responsiveWidth, className })}
      {...props}
    >
      {children}
    </Link>
  );
}
