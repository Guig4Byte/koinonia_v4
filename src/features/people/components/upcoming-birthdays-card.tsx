import Link from "next/link";
import { Cake, ChevronRight } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import type { UpcomingBirthdayItem } from "@/features/people/upcoming-birthdays";
import { ROUTES } from "@/lib/routes";
import styles from "./upcoming-birthdays-card.module.css";

const UPCOMING_BIRTHDAYS_VISIBLE_LIMIT = 4;

function BirthdayListItem({ birthday }: { birthday: UpcomingBirthdayItem }) {
  return (
    <Link
      href={ROUTES.person(birthday.personId)}
      className={styles.item}
      aria-label={`Abrir perfil de ${birthday.fullName}`}
    >
      <Avatar name={birthday.fullName} size="sm" />
      <div className={styles.copy}>
        <p className={styles.name}>{birthday.fullName}</p>
        <p className={styles.context}>
          {[birthday.groupName, birthday.dateLabel].filter(Boolean).join(" · ")}
        </p>
      </div>
      <span className={styles.relativeLabel}>
        {birthday.relativeLabel}
        <ChevronRight className={styles.relativeLabelIcon} aria-hidden="true" strokeWidth={2.3} />
      </span>
    </Link>
  );
}

export function UpcomingBirthdaysCard({
  birthdays,
  className,
}: {
  birthdays: UpcomingBirthdayItem[];
  className?: string;
}) {
  if (birthdays.length === 0) return null;

  const visibleBirthdays = birthdays.slice(0, UPCOMING_BIRTHDAYS_VISIBLE_LIMIT);
  const hiddenCount = birthdays.length - visibleBirthdays.length;

  return (
    <Card as="section" padding="sm" radius="lg" surface="pastoralCue" accentTone="care" className={className}>
      <div className={styles.content}>
        <div className={styles.header}>
          <span className={styles.iconWrap} aria-hidden="true">
            <Cake className="h-4 w-4" strokeWidth={2.2} />
          </span>
          <div className="min-w-0">
            <p className="k-eyebrow mb-1">Aniversários próximos</p>
            <h2 className={styles.title}>Celebrar também é cuidado</h2>
            <p className={styles.description}>Datas dos próximos 30 dias no seu escopo pastoral.</p>
          </div>
        </div>

        <div className={styles.list}>
          {visibleBirthdays.map((birthday) => (
            <BirthdayListItem key={birthday.personId} birthday={birthday} />
          ))}
        </div>

        {hiddenCount > 0 ? (
          <p className={styles.moreMessage}>
            Mais {hiddenCount} aniversário{hiddenCount === 1 ? "" : "s"} nos próximos 30 dias.
          </p>
        ) : null}
      </div>
    </Card>
  );
}
