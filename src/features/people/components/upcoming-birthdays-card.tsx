import Link from "next/link";
import { Cake, ChevronRight } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import type { UpcomingBirthdayItem } from "@/features/people/upcoming-birthdays";
import { ROUTES } from "@/lib/routes";
import styles from "./upcoming-birthdays-card.module.css";

const UPCOMING_BIRTHDAYS_VISIBLE_LIMIT = 4;
const GROUPED_UPCOMING_BIRTHDAYS_VISIBLE_LIMIT = 5;

type UpcomingBirthdaysCardVariant = "list" | "grouped";

function BirthdayListItem({
  birthday,
  showGroupName = true,
}: {
  birthday: UpcomingBirthdayItem;
  showGroupName?: boolean;
}) {
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
          {[showGroupName ? birthday.groupName : null, birthday.dateLabel].filter(Boolean).join(" · ")}
        </p>
      </div>
      <span className={styles.relativeLabel}>
        {birthday.relativeLabel}
        <ChevronRight className={styles.relativeLabelIcon} aria-hidden="true" strokeWidth={2.3} />
      </span>
    </Link>
  );
}

function groupVisibleBirthdaysByCell(birthdays: UpcomingBirthdayItem[]) {
  const groups = new Map<string, UpcomingBirthdayItem[]>();

  birthdays.forEach((birthday) => {
    const groupName = birthday.groupName || "Sem célula informada";
    const currentBirthdays = groups.get(groupName) ?? [];

    currentBirthdays.push(birthday);
    groups.set(groupName, currentBirthdays);
  });

  return Array.from(groups.entries()).map(([groupName, groupBirthdays]) => ({
    groupName,
    birthdays: groupBirthdays,
  }));
}

export function UpcomingBirthdaysCard({
  birthdays,
  className,
  description = "Datas dos próximos 30 dias no seu escopo pastoral.",
  title = "Celebrar também é cuidado",
  variant = "list",
  visibleLimit,
}: {
  birthdays: UpcomingBirthdayItem[];
  className?: string;
  description?: string;
  title?: string;
  variant?: UpcomingBirthdaysCardVariant;
  visibleLimit?: number;
}) {
  if (birthdays.length === 0) return null;

  const resolvedVisibleLimit = visibleLimit
    ?? (variant === "grouped"
      ? GROUPED_UPCOMING_BIRTHDAYS_VISIBLE_LIMIT
      : UPCOMING_BIRTHDAYS_VISIBLE_LIMIT);
  const visibleBirthdays = birthdays.slice(0, resolvedVisibleLimit);
  const hiddenCount = birthdays.length - visibleBirthdays.length;
  const groupedBirthdays = variant === "grouped" ? groupVisibleBirthdaysByCell(visibleBirthdays) : [];

  return (
    <Card as="section" padding="sm" radius="lg" surface="pastoralCue" accentTone="care" className={className}>
      <div className={styles.content}>
        <div className={styles.header}>
          <span className={styles.iconWrap} aria-hidden="true">
            <Cake className="h-4 w-4" strokeWidth={2.2} />
          </span>
          <div className="min-w-0">
            <p className="k-eyebrow mb-1">Aniversários próximos</p>
            <h2 className={styles.title}>{title}</h2>
            <p className={styles.description}>{description}</p>
          </div>
        </div>

        {variant === "grouped" ? (
          <div className={styles.groupedList}>
            {groupedBirthdays.map((group) => (
              <div key={group.groupName} className={styles.groupBlock}>
                <p className={styles.groupTitle}>{group.groupName}</p>
                <div className={styles.list}>
                  {group.birthdays.map((birthday) => (
                    <BirthdayListItem key={birthday.personId} birthday={birthday} showGroupName={false} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.list}>
            {visibleBirthdays.map((birthday) => (
              <BirthdayListItem key={birthday.personId} birthday={birthday} />
            ))}
          </div>
        )}

        {hiddenCount > 0 ? (
          <p className={styles.moreMessage}>
            Mais {hiddenCount} aniversário{hiddenCount === 1 ? "" : "s"} nos próximos 30 dias.
          </p>
        ) : null}
      </div>
    </Card>
  );
}
