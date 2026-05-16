import { ArrowRight, CalendarClock, ClipboardCheck, type LucideIcon } from "lucide-react";
import { CardLink } from "@/components/ui/card-link";
import { cn } from "@/lib/cn";
import { eventsConsultationSectionHref } from "./event-consultation-routes";
import styles from "./events-page-sections.module.css";

function ConsultationCard({
  href,
  title,
  description,
  icon: Icon,
}: {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <CardLink href={href} padding="sm" className={cn(styles.consultationCard, "group")} aria-label={`${title}: ${description}`}>
      <span className={styles.consultationIcon} aria-hidden="true">
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0">
        <span className={styles.consultationTitle}>{title}</span>
        <span className={styles.consultationDescription}>{description}</span>
      </span>
      <span className={styles.consultationArrow} aria-hidden="true">
        <ArrowRight className="h-4 w-4" />
      </span>
    </CardLink>
  );
}

export function EventConsultationCards() {
  return (
    <nav className={styles.consultationActions} aria-label="Consultas de encontros">
      <ConsultationCard
        href={eventsConsultationSectionHref("sem-presenca", "30d")}
        title="Pendências"
        description="Encontros sem presença registrada"
        icon={ClipboardCheck}
      />
      <ConsultationCard
        href={eventsConsultationSectionHref("historico", "30d")}
        title="Histórico"
        description="Encontros com presença registrada"
        icon={CalendarClock}
      />
    </nav>
  );
}
