"use client";

import { filterChipClassName } from "@/components/ui/filter-chip";
import { Feedback } from "@/components/ui/feedback";
import { CheckInMemberCard } from "@/features/check-in/components/check-in-member-card";
import {
  CHECK_IN_MEMBER_FILTERS,
  checkInFilterCount,
  checkInFilterLabel,
  checkInFilteredEmptyMessage,
  filterCheckInItems,
  type CheckInItem,
  type CheckInMemberFilter,
  type CheckInSummary,
  type MemberAttendanceStatus,
} from "@/features/check-in/check-in-view";
import { cn } from "@/lib/cn";
import styles from "./check-in-member-section.module.css";

type CheckInMemberSectionProps = {
  activeFilter: CheckInMemberFilter;
  disabled?: boolean;
  items: CheckInItem[];
  summary: CheckInSummary;
  onActiveFilterChange: (filter: CheckInMemberFilter) => void;
  onSetStatus: (personId: string, status: MemberAttendanceStatus) => void;
};

export function CheckInMemberSection({
  activeFilter,
  disabled = false,
  items,
  summary,
  onActiveFilterChange,
  onSetStatus,
}: CheckInMemberSectionProps) {
  const filteredItems = filterCheckInItems(items, activeFilter);
  const activeFilterCount = checkInFilterCount(summary, activeFilter);

  return (
    <div className={styles.memberSection}>
      <div className={styles.memberSectionHeader}>
        <div className={styles.memberSectionCopy}>
          <p className={styles.memberSectionTitle}>Membros da célula</p>
          <p className={styles.memberSectionDescription}>
            Presença, ausência ou justificativa de cada irmão.
          </p>
        </div>
        <span className={styles.memberCount} aria-live="polite">
          {activeFilterCount} / {summary.totalMembers}
        </span>
      </div>

      <div
        className={styles.filterScroller}
        role="group"
        aria-label="Filtrar membros por status de presença"
      >
        {CHECK_IN_MEMBER_FILTERS.map((filter) => {
          const active = activeFilter === filter;
          const count = checkInFilterCount(summary, filter);

          return (
            <button
              key={filter}
              type="button"
              className={cn(
                filterChipClassName({ active, variant: "period" }),
                styles.filterButton,
              )}
              aria-pressed={active}
              onClick={() => onActiveFilterChange(filter)}
              disabled={disabled}
            >
              <span>{checkInFilterLabel(filter)}</span>
              <span className={styles.filterCount}>{count}</span>
            </button>
          );
        })}
      </div>

      {filteredItems.length > 0 ? (
        <div className={styles.memberList}>
          {filteredItems.map((item) => (
            <CheckInMemberCard
              key={item.personId}
              item={item}
              onSetStatus={onSetStatus}
              disabled={disabled}
            />
          ))}
        </div>
      ) : (
        <Feedback tone="info" compact>
          {checkInFilteredEmptyMessage(activeFilter)}
        </Feedback>
      )}
    </div>
  );
}
