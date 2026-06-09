import type { SVGProps } from "react";

export function UserAccessHeroIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <circle cx="9.1" cy="7.45" r="2.75" />
      <path d="M4 18.3c0-3.18 2.35-5.35 5.25-5.35s5.25 2.17 5.25 5.35" />
      <path d="M18.45 7.65v5.1" />
      <path d="M15.9 10.2H21" />
    </svg>
  );
}

export function AccountAccessHeroIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <circle cx="8.9" cy="7.45" r="2.65" />
      <path d="M4.35 18.3c0-3.08 2.05-5.15 4.55-5.15s4.55 2.07 4.55 5.15" />
      <circle cx="16.45" cy="8.75" r="2.2" />
      <path d="M18.68 8.75h3.22" />
      <path d="M20.25 8.75v1.55" />
      <path d="M21.72 8.75v1.15" />
    </svg>
  );
}

export function CellHeroIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <circle cx="9" cy="7.5" r="2.35" />
      <circle cx="16" cy="7.5" r="2.35" />
      <path d="M4.75 18.25c0-3.1 2.35-5.15 5.25-5.15h.9c2.9 0 5.25 2.05 5.25 5.15" />
      <path d="M13.4 13.5c.72-.28 1.48-.42 2.25-.42h.55c2.5 0 4.55 1.74 4.55 4.37" />
    </svg>
  );
}
