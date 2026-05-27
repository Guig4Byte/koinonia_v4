"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { ChevronRight } from "lucide-react";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button, buttonClassName, type ButtonVariant } from "@/components/ui/button";
import { StatusCard, type StatusCardTone } from "@/components/ui/status-card";
import {
  ATTENDANCE,
  ATTENDANCE_LABELS,
  MEMBER_ATTENDANCE_OPTIONS,
  checkInStatusOptionDescription,
  type AttendanceSelection,
  type CheckInItem,
  type MemberAttendanceStatus,
} from "@/features/check-in/check-in-view";
import { cn } from "@/lib/cn";
import { initials } from "@/lib/text";
import styles from "./check-in.module.css";

function memberCardTone(status: AttendanceSelection): StatusCardTone {
  if (status === ATTENDANCE.PRESENT) return "success";
  if (status === ATTENDANCE.ABSENT) return "danger";
  if (status === ATTENDANCE.JUSTIFIED) return "warning";
  return "neutral";
}

function statusButtonVariant(status: MemberAttendanceStatus, selected: boolean): ButtonVariant {
  if (!selected) return "outline";
  if (status === ATTENDANCE.PRESENT) return "stableSoft";
  if (status === ATTENDANCE.ABSENT) return "dangerSoft";
  return "attentionSoft";
}

function statusTriggerVariant(status: AttendanceSelection): ButtonVariant {
  if (status === ATTENDANCE.PRESENT) return "stableSoft";
  if (status === ATTENDANCE.ABSENT) return "dangerSoft";
  if (status === ATTENDANCE.JUSTIFIED) return "attentionSoft";
  return "outline";
}

function memberAvatarToneClass(status: AttendanceSelection) {
  if (status === ATTENDANCE.PRESENT) return styles.memberAvatarPresent;
  if (status === ATTENDANCE.ABSENT) return styles.memberAvatarAbsent;
  if (status === ATTENDANCE.JUSTIFIED) return styles.memberAvatarJustified;
  return styles.memberAvatarPending;
}

type CheckInMemberCardProps = {
  item: CheckInItem;
  onSetStatus: (personId: string, status: MemberAttendanceStatus) => void;
  disabled?: boolean;
};

export function CheckInMemberCard({ item, onSetStatus, disabled = false }: CheckInMemberCardProps) {
  const [selectorOpen, setSelectorOpen] = useState(false);
  const titleId = useId();
  const descriptionId = useId();
  const statusButtonRef = useRef<HTMLButtonElement>(null);
  const selectedOptionRef = useRef<HTMLButtonElement>(null);
  const firstOptionRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  const statusLabel = item.status ? ATTENDANCE_LABELS[item.status] : "Sem marcação";

  const closeSelector = useCallback(() => {
    setSelectorOpen(false);
  }, []);

  function openSelector() {
    if (disabled) return;

    statusButtonRef.current?.scrollIntoView({
      block: "center",
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
    setSelectorOpen(true);
  }

  const restoreStatusButtonFocus = useCallback(() => {
    window.setTimeout(() => statusButtonRef.current?.focus(), 0);
  }, []);

  const closeSelectorAndRestoreFocus = useCallback(() => {
    closeSelector();
    restoreStatusButtonFocus();
  }, [closeSelector, restoreStatusButtonFocus]);

  function handleSelectStatus(status: MemberAttendanceStatus) {
    onSetStatus(item.personId, status);
    closeSelectorAndRestoreFocus();
  }

  useEffect(() => {
    if (!selectorOpen) return undefined;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeSelectorAndRestoreFocus();
        return;
      }

      if (event.key !== "Tab") return;

      const root = sheetRef.current;
      if (!root) return;

      const focusable = Array.from(root.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ));

      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
        return;
      }

      if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);
    window.setTimeout(() => (selectedOptionRef.current ?? firstOptionRef.current)?.focus(), 0);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeSelectorAndRestoreFocus, selectorOpen]);

  return (
    <StatusCard
      as="article"
      tone={memberCardTone(item.status)}
      padding="sm"
      radius="sm"
      containment="hidden"
      className={styles.memberCard}
      data-testid="check-in-member-card"
    >
      <div className={styles.memberRow}>
        <span className={cn(styles.memberAvatar, memberAvatarToneClass(item.status))} aria-hidden="true">
          {initials(item.fullName)}
        </span>

        <p className={styles.memberName}>{item.fullName}</p>

        <button
          ref={statusButtonRef}
          type="button"
          className={buttonClassName({
            variant: statusTriggerVariant(item.status),
            size: "sm",
            shape: "pill",
            density: "badge",
            className: cn(styles.memberStatusButton, "shrink-0 gap-1.5 font-semibold"),
          })}
          aria-haspopup="dialog"
          aria-expanded={selectorOpen}
          aria-label={`Alterar presença de ${item.fullName}. Status atual: ${statusLabel}.`}
          onClick={openSelector}
          disabled={disabled}
        >
          <span className={styles.statusDot} aria-hidden="true" />
          {statusLabel}
        </button>

        <ChevronRight className={styles.memberChevron} aria-hidden="true" />
      </div>

      {selectorOpen ? (
        <BottomSheet
          dismissLabel="Fechar seleção de presença"
          onDismiss={closeSelectorAndRestoreFocus}
          panelRef={sheetRef}
          placement="center"
          tone="accent"
          panelProps={{
            role: "dialog",
            "aria-modal": true,
            "aria-labelledby": titleId,
            "aria-describedby": descriptionId,
          }}
        >
          <div className="space-y-1 text-center">
            <h2 id={titleId} className="k-pastoral-title text-[length:var(--text-lg)]">
              {item.fullName}
            </h2>
            <p id={descriptionId} className="text-[length:var(--text-sm)] text-[color:var(--color-text-secondary)]">
              Marque com calma. Essa informação vira contexto de cuidado depois do encontro.
            </p>
          </div>

          <div className="mt-4 space-y-2">
            {MEMBER_ATTENDANCE_OPTIONS.map((status, index) => {
              const selected = item.status === status;

              return (
                <button
                  key={status}
                  ref={selected ? selectedOptionRef : index === 0 ? firstOptionRef : undefined}
                  type="button"
                  className={buttonClassName({
                    variant: statusButtonVariant(status, selected),
                    size: "lg",
                    fullWidth: true,
                    align: "between",
                    className: "px-4",
                  })}
                  aria-pressed={selected}
                  onClick={() => handleSelectStatus(status)}
                >
                  <span className="text-left">
                    <span className="block">{ATTENDANCE_LABELS[status]}</span>
                    <span className="mt-0.5 block font-medium opacity-80">
                      {checkInStatusOptionDescription(status)}
                    </span>
                  </span>
                  {selected ? <span aria-hidden="true">✓</span> : null}
                </button>
              );
            })}
          </div>

          <Button
            type="button"
            variant="ghost"
            size="lg"
            fullWidth
            onClick={closeSelectorAndRestoreFocus}
            className="mt-3"
          >
            Cancelar
          </Button>
        </BottomSheet>
      ) : null}
    </StatusCard>
  );
}
