import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";

export function PulseCard({
  title,
  subtitle,
  tone = "calm",
  className,
}: {
  title: string;
  subtitle?: string;
  tone?: "calm" | "attention" | "ok";
  className?: string;
}) {
  const toneStyles = {
    calm: {
      accentClass: "bg-[var(--color-card-decoration)]",
      surfaceStyle: undefined,
    },
    attention: {
      accentClass: "bg-[var(--color-metric-atencoes)]",
      surfaceStyle: {
        borderColor: "color-mix(in srgb, var(--color-metric-atencoes) 18%, var(--color-border-card) 82%)",
        background: "color-mix(in srgb, var(--color-bg-card) 97%, var(--color-metric-atencoes) 3%)",
      },
    },
    ok: {
      accentClass: "bg-[var(--color-metric-presenca)]",
      surfaceStyle: undefined,
    },
  }[tone];

  return (
    <Card
      as="section"
      radius="lg"
      padding="pulse"
      containment="hidden"
      className={cn("relative isolate mb-4", className)}
      style={toneStyles.surfaceStyle}
    >
      <div className={cn("absolute inset-x-0 top-0 h-0.5", toneStyles.accentClass)} />
      <div
        className="pointer-events-none absolute -right-10 -top-16 -z-10 h-32 w-32 rounded-full"
        style={{ background: "color-mix(in srgb, var(--color-card-decoration) 18%, transparent)" }}
      />
      <p className="k-eyebrow mb-2">Radar pastoral</p>
      <p className="font-serif-display text-[length:var(--text-xl)] font-semibold leading-[1.12] tracking-normal text-[color:var(--color-text-primary)] text-balance">{title}</p>
      {subtitle ? <p className="mt-1.5 text-[length:var(--text-sm)] leading-relaxed text-[color:var(--color-text-secondary)]">{subtitle}</p> : null}
    </Card>
  );
}
