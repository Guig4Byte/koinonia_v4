"use client";

import { CalendarPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { ChoicePickerField } from "@/components/ui/choice-picker-field";
import { Feedback } from "@/components/ui/feedback";
import { Field, InputField } from "@/components/ui/field";
import { EventDatePickerField } from "@/features/events/components/event-date-picker-field";
import { EventTimePickerField } from "@/features/events/components/event-time-picker-field";
import {
  formatBrasiliaDate,
  parseBrasiliaDateTime,
  parseBrasiliaDateValue,
  type CalendarMonth,
} from "@/features/events/brasilia-date-time";
import { EVENT_LOCATION_MAX_LENGTH } from "@/features/events/event-fields";
import { API_ROUTES } from "@/lib/api-routes";
import { getBrasiliaDateParts } from "@/lib/brasilia-time";
import { isRecord, readJsonResponse } from "@/lib/json";
import { ROUTES } from "@/lib/routes";
import styles from "./past-cell-meeting-action.module.css";

export type PastCellMeetingActionGroup = {
  id: string;
  name: string;
  locationName?: string | null;
  meetingTime?: string | null;
  statusLabel?: string | null;
};

type OpenPastMeetingPicker = "group" | "date" | "time" | null;

function todayBrasiliaDateValue(referenceDate = new Date()) {
  const parts = getBrasiliaDateParts(referenceDate);

  return formatBrasiliaDate({
    year: parts.year,
    month: parts.month,
    day: parts.day,
  });
}

function calendarMonthFromDateValue(dateValue: string, referenceDate = new Date()): CalendarMonth {
  const dateParts = parseBrasiliaDateValue(dateValue);

  if (dateParts) {
    return { year: dateParts.year, monthIndex: dateParts.month - 1 };
  }

  const brasiliaParts = getBrasiliaDateParts(referenceDate);
  return { year: brasiliaParts.year, monthIndex: brasiliaParts.month - 1 };
}

function eventIdFromCreateResponse(body: unknown) {
  if (!isRecord(body) || !isRecord(body.event)) return null;

  return typeof body.event.id === "string" ? body.event.id : null;
}

export function PastCellMeetingAction({ groups }: { groups: PastCellMeetingActionGroup[] }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [groupId, setGroupId] = useState(groups[0]?.id ?? "");
  const [date, setDate] = useState(() => todayBrasiliaDateValue());
  const [time, setTime] = useState(groups[0]?.meetingTime || "19:30");
  const [locationName, setLocationName] = useState("");
  const [openPicker, setOpenPicker] = useState<OpenPastMeetingPicker>(null);
  const [calendarMonth, setCalendarMonth] = useState<CalendarMonth>(() => calendarMonthFromDateValue(todayBrasiliaDateValue()));
  const [errorMessage, setErrorMessage] = useState("");

  if (groups.length === 0) return null;

  const selectedGroup = groups.find((group) => group.id === groupId) ?? groups[0]!;
  const selectedDateParts = parseBrasiliaDateValue(date);
  const groupOptions = groups.map((group) => ({
    value: group.id,
    label: group.name,
    description: group.statusLabel ?? undefined,
  }));
  const locationPlaceholder = selectedGroup.locationName
    ? `Padrão: ${selectedGroup.locationName}`
    : "Ex.: Casa da família Souza";

  function openSheet() {
    setErrorMessage("");
    setIsOpen(true);
  }

  function closeSheet() {
    if (isPending) return;
    setIsOpen(false);
    setOpenPicker(null);
  }

  function updateGroup(nextGroupId: string) {
    const nextGroup = groups.find((group) => group.id === nextGroupId);
    setGroupId(nextGroupId);
    setTime(nextGroup?.meetingTime || "19:30");
    setLocationName("");
    setErrorMessage("");
  }

  function updateDate(nextDate: string) {
    setDate(nextDate);
    setErrorMessage("");

    const dateParts = parseBrasiliaDateValue(nextDate);
    if (dateParts) {
      setCalendarMonth({ year: dateParts.year, monthIndex: dateParts.month - 1 });
    }
  }

  function selectCalendarDay(day: number) {
    const nextDate = formatBrasiliaDate({
      year: calendarMonth.year,
      month: calendarMonth.monthIndex + 1,
      day,
    });

    updateDate(nextDate);
    setOpenPicker(null);
  }

  function selectTime(nextTime: string) {
    setTime(nextTime);
    setOpenPicker(null);
    setErrorMessage("");
  }

  function submitPastMeeting() {
    const startsAt = parseBrasiliaDateTime(date, time);

    if (!startsAt) {
      setErrorMessage("Informe data e horário válidos no horário de Brasília.");
      return;
    }

    if (new Date(startsAt).getTime() > Date.now()) {
      setErrorMessage("Use uma data e horário que já passaram para registrar encontro anterior.");
      return;
    }

    setErrorMessage("");

    startTransition(async () => {
      const response = await fetch(API_ROUTES.pastCellMeeting, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId,
          date,
          time,
          locationName: locationName.trim() || undefined,
        }),
      });
      const body = await readJsonResponse(response);

      if (!response.ok) {
        setErrorMessage(isRecord(body) && typeof body.error === "string"
          ? body.error
          : "Não foi possível registrar o encontro anterior agora.");
        return;
      }

      const eventId = eventIdFromCreateResponse(body);
      if (!eventId) {
        setErrorMessage("Encontro criado, mas não foi possível abrir o detalhe automaticamente.");
        router.refresh();
        return;
      }

      setIsOpen(false);
      router.push(ROUTES.event(eventId));
      router.refresh();
    });
  }

  return (
    <>
      <div className={styles.actionBar}>
        <Button
          type="button"
          variant="secondary"
          size="md"
          shape="pill"
          responsiveWidth="fullUntilSm"
          onClick={openSheet}
        >
          <CalendarPlus className={styles.triggerIcon} aria-hidden="true" />
          Registrar encontro anterior
        </Button>
      </div>

      {isOpen ? (
        <BottomSheet
          onDismiss={closeSheet}
          dismissLabel="Fechar registro de encontro anterior"
          tone="accent"
          size="md"
          overflowMode="visibleOnWide"
          panelProps={{ role: "dialog", "aria-modal": true, "aria-labelledby": "past-cell-meeting-title" }}
        >
          <div className={styles.sheet}>
            <div className={styles.sheetHeader}>
              <span className={styles.sheetIcon} aria-hidden="true">
                <CalendarPlus className={styles.sheetIconSvg} />
              </span>
              <div>
                <h2 id="past-cell-meeting-title" className={styles.sheetTitle}>
                  Registrar encontro
                </h2>
                <p className={styles.sheetDescription}>
                  Para quando a célula se reuniu antes e a presença ficou para registrar depois.
                </p>
              </div>
            </div>

            <div className={styles.fields}>
              {groups.length > 1 ? (
                <Field htmlFor="past-cell-meeting-group" label="Célula" required>
                  <ChoicePickerField
                    id="past-cell-meeting-group"
                    name="past-cell-meeting-group"
                    options={groupOptions}
                    value={groupId}
                    isOpen={openPicker === "group"}
                    surface="warm"
                    fieldSpacing="none"
                    popoverWidth="control"
                    searchable={groups.length > 6}
                    searchPlaceholder="Buscar célula..."
                    emptyMessage="Nenhuma célula encontrada."
                    maxVisibleOptions={6}
                    onValueChange={updateGroup}
                    onOpenChange={(isGroupOpen) => setOpenPicker(isGroupOpen ? "group" : null)}
                  />
                </Field>
              ) : null}

              <div className={styles.dateTimeFields}>
                <EventDatePickerField
                  id="past-cell-meeting-date"
                  label="Data"
                  popoverAlign="left"
                  value={date}
                  isOpen={openPicker === "date"}
                  calendarMonth={calendarMonth}
                  selectedDateParts={selectedDateParts}
                  onChange={updateDate}
                  onOpenChange={(isDateOpen) => setOpenPicker(isDateOpen ? "date" : null)}
                  onCalendarMonthChange={setCalendarMonth}
                  onCalendarDaySelect={selectCalendarDay}
                />
                <EventTimePickerField
                  id="past-cell-meeting-time"
                  label="Horário"
                  value={time}
                  isOpen={openPicker === "time"}
                  onChange={selectTime}
                  onOpenChange={(isTimeOpen) => setOpenPicker(isTimeOpen ? "time" : null)}
                  onTimeSelect={selectTime}
                />
              </div>

              <InputField
                id="past-cell-meeting-location"
                label="Local"
                description="Opcional. Se ficar em branco, será usado o local padrão da célula."
                value={locationName}
                onChange={(event) => {
                  setLocationName(event.target.value);
                  setErrorMessage("");
                }}
                placeholder={locationPlaceholder}
                maxLength={EVENT_LOCATION_MAX_LENGTH}
                size="md"
                surface="muted"
              />
            </div>

            {errorMessage ? (
              <Feedback tone="error" compact role="alert" ariaLive="assertive">
                {errorMessage}
              </Feedback>
            ) : null}

            <div className={styles.sheetActions}>
              <Button type="button" variant="secondary" size="md" shape="pill" onClick={closeSheet} disabled={isPending}>
                Cancelar
              </Button>
              <Button type="button" variant="primary" size="md" shape="pill" onClick={submitPastMeeting} disabled={isPending}>
                {isPending ? "Registrando..." : "Registrar encontro"}
              </Button>
            </div>
          </div>
        </BottomSheet>
      ) : null}
    </>
  );
}
