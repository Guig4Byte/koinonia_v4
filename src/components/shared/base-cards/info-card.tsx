import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import type { ReactNode } from "react";
import { Card, type CardStatusTone, type CardTextStyle } from "@/components/ui/card";

export function InfoCard({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: "default" | "success" | "error" | "warning";
}) {
  const cardTone: Record<typeof tone, CardStatusTone> = {
    default: "none",
    success: "success",
    error: "danger",
    warning: "warning",
  };

  const textStyle: Record<typeof tone, CardTextStyle> = {
    default: "bodyMuted",
    success: "bodyPrimary",
    error: "bodyPrimary",
    warning: "bodyPrimary",
  };

  const Icon = {
    default: Info,
    success: CheckCircle2,
    error: AlertCircle,
    warning: AlertCircle,
  }[tone];

  return (
    <Card
      radius="sm"
      statusTone={cardTone[tone]}
      textStyle={textStyle[tone]}
      className="mb-4 flex items-start gap-2.5"
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <p>{children}</p>
    </Card>
  );
}
