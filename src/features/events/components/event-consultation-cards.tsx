import { ArrowRight, CalendarClock, ClipboardCheck, type LucideIcon } from "lucide-react";
import { CardLink } from "@/components/ui/card-link";
import type { EventsConsultationSummary } from "@/features/events/events-page-view";
import { countLabel } from "@/lib/format";
import { eventsConsultationSectionHref } from "./event-consultation-routes";
import styles from "./events-page-sections.module.css";

function ConsultationCard({
  href,
  title,
  description,
  icon: Icon,
  count,
  tone = "neutral",
}: {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
  count: number;
  tone?: "neutral" | "attention";
}) {
  const metricToneClass = tone === "attention" && count > 0
    ? styles.consultationMetricAttention
    : styles.consultationMetric;

  return (
    <CardLink
      href={href}
      padding="sm"
      radius="sm"
      minHeight="sm"
      surface="consultation"
      className="group"
      aria-label={`${title}: ${countLabel(count, "encontro", "encontros")}. ${description}`}
    >
      <span className={styles.consultationLayout}>
        <span className={styles.consultationIcon} aria-hidden="true">
          <Icon className="h-4 w-4" />
        </span>
        <span className={styles.consultationTitle}>{title}</span>
        <span className={styles.consultationArrow} aria-hidden="true">
          <ArrowRight className="h-4 w-4" />
        </span>
        <span className={styles.consultationStatus}>
          <span className={metricToneClass} aria-label={`${count} ${count === 1 ? "encontro" : "encontros"}`}>
            {count}
          </span>
          <span className={styles.consultationDescription}>{description}</span>
        </span>
      </span>
    </CardLink>
  );
}

export function EventConsultationCards({ summary }: { summary: EventsConsultationSummary }) {
  return (
    <nav className={styles.consultationActions} aria-label="Consultas de encontros">
      <ConsultationCard
        href={eventsConsultationSectionHref("sem-presenca", "30d")}
        title="Aguardando registro"
        description={summary.pendingDescription}
        icon={ClipboardCheck}
        count={summary.pendingCount}
        tone="attention"
      />
      <ConsultationCard
        href={eventsConsultationSectionHref("historico", "30d")}
        title="Histórico"
        description={summary.historyDescription}
        icon={CalendarClock}
        count={summary.historyCount}
      />
    </nav>
  );
}
