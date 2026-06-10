"use client";

import { Cake, CalendarDays, ChevronLeft, ChevronRight, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { Feedback } from "@/components/ui/feedback";
import { FieldError } from "@/components/ui/field";
import { API_ROUTES } from "@/lib/api-routes";
import { cn } from "@/lib/cn";
import { useApiAction } from "@/hooks/use-api-action";
import {
  formatPersonBirthday,
  formatPersonBirthdayDraftInput,
  personBirthdayErrorMessage,
  validatePersonBirthdayValue,
} from "@/features/people/person-birthday";
import pickerStyles from "@/components/ui/picker.module.css";

const BIRTHDAY_MIN_YEAR = 1900;
const CURRENT_YEAR = new Date().getFullYear();

const BIRTHDAY_DAY_OPTIONS = Array.from({ length: 31 }, (_, index) => String(index + 1).padStart(2, "0"));

function isLeapYear(year: number) {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

function birthdayDayLimit(month?: string, year?: string) {
  const monthNumber = Number(month);
  const yearNumber = Number(year);

  if (!monthNumber) return 31;
  if ([4, 6, 9, 11].includes(monthNumber)) return 30;
  if (monthNumber === 2) {
    return Number.isInteger(yearNumber) && year?.length === 4
      ? isLeapYear(yearNumber)
        ? 29
        : 28
      : 29;
  }

  return 31;
}

function birthdayDayOptions(month?: string, year?: string) {
  return BIRTHDAY_DAY_OPTIONS.slice(0, birthdayDayLimit(month, year));
}

const BIRTHDAY_MONTH_OPTIONS = [
  { value: "01", label: "Jan" },
  { value: "02", label: "Fev" },
  { value: "03", label: "Mar" },
  { value: "04", label: "Abr" },
  { value: "05", label: "Mai" },
  { value: "06", label: "Jun" },
  { value: "07", label: "Jul" },
  { value: "08", label: "Ago" },
  { value: "09", label: "Set" },
  { value: "10", label: "Out" },
  { value: "11", label: "Nov" },
  { value: "12", label: "Dez" },
];

type BirthdayPickerDraft = {
  day: string;
  month: string;
  year: string;
};

function digitsOnly(value: string, maxLength: number) {
  return value.replace(/\D/g, "").slice(0, maxLength);
}

function birthdayDraftFromInput(value: string): BirthdayPickerDraft {
  const [day = "", month = "", year = ""] = formatPersonBirthdayDraftInput(value).split("/");

  return { day, month, year };
}

function birthdayInputFromPickerDraft({ day, month, year }: BirthdayPickerDraft) {
  if (!day || !month || year.length !== 4) return "";

  return `${day}/${month}/${year}`;
}

function decadeStartFromYear(year?: string) {
  const parsedYear = Number(year);
  const fallbackYear = CURRENT_YEAR - 30;
  const yearForDecade = Number.isInteger(parsedYear) && parsedYear >= BIRTHDAY_MIN_YEAR && parsedYear <= CURRENT_YEAR
    ? parsedYear
    : fallbackYear;

  return Math.floor(yearForDecade / 10) * 10;
}

function yearsForDecade(decadeStart: number) {
  return Array.from({ length: 10 }, (_, index) => decadeStart + index)
    .filter((year) => year >= BIRTHDAY_MIN_YEAR && year <= CURRENT_YEAR)
    .map(String);
}

function nextDecadeStart(decadeStart: number, direction: "previous" | "next") {
  const nextValue = direction === "previous" ? decadeStart - 10 : decadeStart + 10;
  const currentDecadeStart = Math.floor(CURRENT_YEAR / 10) * 10;

  return Math.min(Math.max(nextValue, BIRTHDAY_MIN_YEAR), currentDecadeStart);
}

export function PersonBirthdayCard({
  personId,
  birthDate,
  startWithForm = false,
  className,
}: {
  personId: string;
  birthDate?: string | null;
  startWithForm?: boolean;
  className?: string;
}) {
  const router = useRouter();
  const [savedBirthDate, setSavedBirthDate] = useState(birthDate ?? "");
  const [draft, setDraft] = useState(birthDate ?? "");
  const [isEditing, setIsEditing] = useState(startWithForm);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [pickerDraft, setPickerDraft] = useState<BirthdayPickerDraft>(() => birthdayDraftFromInput(birthDate ?? ""));
  const [yearDecadeStart, setYearDecadeStart] = useState(() => decadeStartFromYear(birthdayDraftFromInput(birthDate ?? "").year));
  const [fieldError, setFieldError] = useState("");
  const [pickerError, setPickerError] = useState("");
  const [savedMessage, setSavedMessage] = useState("");
  const { isPending, errorMessage, clearError, runApiAction } = useApiAction();
  const hasBirthday = Boolean(savedBirthDate);
  const displayBirthday = formatPersonBirthday(savedBirthDate);
  const selectedMonthLabel = BIRTHDAY_MONTH_OPTIONS.find((month) => month.value === pickerDraft.month)?.label;
  const pickerDayOptions = birthdayDayOptions(pickerDraft.month, pickerDraft.year);

  function openForm() {
    clearError();
    setFieldError("");
    setPickerError("");
    setSavedMessage("");
    setDraft(savedBirthDate);
    setIsEditing(true);
  }

  function cancelForm() {
    clearError();
    setFieldError("");
    setPickerError("");
    setSavedMessage("");
    setDraft(savedBirthDate);
    setIsEditing(false);
    setIsPickerOpen(false);
  }

  function updateDraft(value: string) {
    setDraft(formatPersonBirthdayDraftInput(value));
    setFieldError("");
    setPickerError("");
    setSavedMessage("");
  }

  function openPicker() {
    const nextPickerDraft = birthdayDraftFromInput(draft);

    clearError();
    setFieldError("");
    setPickerError("");
    setSavedMessage("");
    setPickerDraft(nextPickerDraft);
    setYearDecadeStart(decadeStartFromYear(nextPickerDraft.year));
    setIsPickerOpen(true);
  }

  function selectPickerValue(field: keyof BirthdayPickerDraft, value: string) {
    setPickerDraft((currentDraft) => {
      const nextDraft = {
        ...currentDraft,
        [field]: field === "year" ? digitsOnly(value, 4) : digitsOnly(value, 2),
      };
      const dayLimit = birthdayDayLimit(nextDraft.month, nextDraft.year);

      if (nextDraft.day && Number(nextDraft.day) > dayLimit) {
        nextDraft.day = "";
      }

      return nextDraft;
    });
    setPickerError("");
  }

  function usePickerDate() {
    const hasAnyPickerValue = Boolean(pickerDraft.day || pickerDraft.month || pickerDraft.year);
    const hasCompletePickerValue = Boolean(pickerDraft.day && pickerDraft.month && pickerDraft.year.length === 4);

    if (hasAnyPickerValue && !hasCompletePickerValue) {
      setPickerError("Escolha dia, mês e ano para usar esta data.");
      return;
    }

    const nextDraft = hasAnyPickerValue ? birthdayInputFromPickerDraft(pickerDraft) : "";
    const parsed = validatePersonBirthdayValue(nextDraft);

    if (!parsed.ok) {
      setPickerError("Escolha um dia válido para o mês selecionado.");
      return;
    }

    setDraft(parsed.inputValue);
    setFieldError("");
    setPickerError("");
    setIsPickerOpen(false);
  }

  function saveBirthday() {
    const parsed = validatePersonBirthdayValue(draft);

    if (!parsed.ok) {
      setFieldError(personBirthdayErrorMessage(parsed.error) ?? "Data inválida.");
      return;
    }

    runApiAction(
      () =>
        fetch(API_ROUTES.personBirthday(personId), {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ birthDate: parsed.inputValue }),
        }),
      {
        fallbackErrorMessage: "Não foi possível salvar o aniversário agora.",
        onSuccess: (responseBody) => {
          setSavedBirthDate(parsed.inputValue);
          setDraft(parsed.inputValue);
          setIsEditing(false);
          setIsPickerOpen(false);
          setSavedMessage(responseBody?.message ?? "Aniversário salvo no perfil da pessoa.");
          router.refresh();
        },
      },
    );
  }

  return (
    <div className={cn("rounded-2xl border p-3", className)}>
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-[length:var(--text-xs)] font-extrabold uppercase tracking-[0.08em] text-[color:var(--color-text-secondary)]">
            <Cake className="h-3.5 w-3.5 shrink-0" aria-hidden="true" strokeWidth={2.3} />
            Aniversário
          </p>
          <p className="mt-1 text-[length:var(--text-sm)] font-bold text-[color:var(--color-text-primary)]">
            {displayBirthday}
          </p>
          <p className="mt-1 text-[length:var(--text-xs)] font-medium leading-relaxed text-[color:var(--color-text-secondary)]">
            Ajuda a celebrar datas importantes sem pesar o cadastro.
          </p>
        </div>

        {!isEditing ? (
          <Button
            type="button"
            variant="actionPillSecondary"
            size="sm"
            density="actionPillCompact"
            className="shrink-0"
            onClick={openForm}
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden="true" strokeWidth={2.3} />
            {hasBirthday ? "Editar" : "Adicionar"}
          </Button>
        ) : null}
      </div>

      {savedMessage ? (
        <Feedback tone="care" compact className="mt-3" ariaLive="polite">
          {savedMessage}
        </Feedback>
      ) : null}
      {errorMessage ? (
        <Feedback tone="error" compact className="mt-3" role="alert" ariaLive="assertive">
          {errorMessage}
        </Feedback>
      ) : null}

      {isEditing ? (
        <div className="mt-3 rounded-xl border border-[color-mix(in_srgb,var(--brown-400)_20%,var(--color-border-card))] bg-[color-mix(in_srgb,var(--brown-400)_6%,transparent)] p-3">
          <label className={pickerStyles.label} htmlFor={`person-birthday-${personId}`}>
            Data de nascimento
          </label>
          <div className={cn(pickerStyles.field, pickerStyles.fieldFlush)}>
            <input
              id={`person-birthday-${personId}`}
              type="text"
              value={draft}
              onChange={(event) => updateDraft(event.target.value)}
              aria-describedby={`person-birthday-${personId}-description${fieldError ? ` person-birthday-${personId}-error` : ""}`}
              aria-invalid={Boolean(fieldError) || undefined}
              inputMode="numeric"
              maxLength={10}
              placeholder="dd/mm/aaaa"
              autoComplete="bday"
              className={cn(
                pickerStyles.input,
                pickerStyles.inputControl,
                pickerStyles.inputWarm,
                pickerStyles.inputWithLeadingIcon,
                fieldError && pickerStyles.inputInvalid,
              )}
            />
            <button
              type="button"
              className={cn(pickerStyles.trigger, pickerStyles.triggerWarm)}
              aria-label="Escolher aniversário"
              aria-expanded={isPickerOpen}
              disabled={isPending}
              onClick={openPicker}
            >
              <CalendarDays className="h-4 w-4" aria-hidden="true" strokeWidth={2.2} />
            </button>
          </div>
          <p
            id={`person-birthday-${personId}-description`}
            className="mt-2 text-[length:var(--text-xs)] font-medium leading-relaxed text-[color:var(--color-text-secondary)]"
          >
            Digite manualmente ou toque no calendário para selecionar a data.
          </p>
          <FieldError id={`person-birthday-${personId}-error`} className="mt-1">
            {fieldError}
          </FieldError>

          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Button type="button" fullWidth disabled={isPending} onClick={saveBirthday}>
              {isPending ? "Salvando..." : "Salvar aniversário"}
            </Button>
            <Button type="button" variant="secondary" fullWidth disabled={isPending} onClick={cancelForm}>
              Cancelar
            </Button>
          </div>
        </div>
      ) : null}

      {isPickerOpen ? (
        <BottomSheet
          placement="center"
          tone="accent"
          size="sm"
          dismissLabel="Fechar escolha de aniversário"
          onDismiss={() => setIsPickerOpen(false)}
          panelProps={{
            role: "dialog",
            "aria-modal": true,
            "aria-labelledby": `person-birthday-${personId}-picker-title`,
          }}
        >
          <div className="space-y-4">
            <div>
              <p
                id={`person-birthday-${personId}-picker-title`}
                className="text-[length:var(--text-lg)] font-extrabold leading-tight text-[color:var(--color-text-primary)]"
              >
                Escolher aniversário
              </p>
              <p className="mt-1 text-[length:var(--text-sm)] font-medium leading-relaxed text-[color:var(--color-text-secondary)]">
                Selecione dia, mês e ano. O campo manual continua disponível se for mais rápido digitar.
              </p>
            </div>

            <div>
              <p className={pickerStyles.label}>Dia</p>
              <div className="grid grid-cols-7 gap-1.5" role="group" aria-label="Escolher dia do aniversário">
                {pickerDayOptions.map((day) => (
                  <Button
                    key={day}
                    type="button"
                    variant={pickerDraft.day === day ? "warmSoft" : "secondary"}
                    size="sm"
                    density="inlineCompact"
                    onClick={() => selectPickerValue("day", day)}
                  >
                    {day}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <p className={pickerStyles.label}>Mês</p>
              <div className="grid grid-cols-3 gap-2" role="group" aria-label="Escolher mês do aniversário">
                {BIRTHDAY_MONTH_OPTIONS.map((month) => (
                  <Button
                    key={month.value}
                    type="button"
                    variant={pickerDraft.month === month.value ? "warmSoft" : "secondary"}
                    size="sm"
                    density="inlineCompact"
                    fullWidth
                    onClick={() => selectPickerValue("month", month.value)}
                  >
                    {month.label}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <div>
                  <p className={pickerStyles.label}>Ano</p>
                  <p className="text-[length:var(--text-xs)] font-semibold text-[color:var(--color-text-secondary)]">
                    {yearDecadeStart}–{Math.min(yearDecadeStart + 9, CURRENT_YEAR)}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    density="inlineCompact"
                    aria-label="Ver década anterior"
                    disabled={yearDecadeStart <= BIRTHDAY_MIN_YEAR}
                    onClick={() => setYearDecadeStart((currentDecade) => nextDecadeStart(currentDecade, "previous"))}
                  >
                    <ChevronLeft className="h-4 w-4" aria-hidden="true" strokeWidth={2.3} />
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    density="inlineCompact"
                    aria-label="Ver próxima década"
                    disabled={yearDecadeStart >= Math.floor(CURRENT_YEAR / 10) * 10}
                    onClick={() => setYearDecadeStart((currentDecade) => nextDecadeStart(currentDecade, "next"))}
                  >
                    <ChevronRight className="h-4 w-4" aria-hidden="true" strokeWidth={2.3} />
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-5 gap-2" role="group" aria-label="Escolher ano do aniversário">
                {yearsForDecade(yearDecadeStart).map((year) => (
                  <Button
                    key={year}
                    type="button"
                    variant={pickerDraft.year === year ? "warmSoft" : "secondary"}
                    size="sm"
                    density="inlineCompact"
                    fullWidth
                    onClick={() => selectPickerValue("year", year)}
                  >
                    {year}
                  </Button>
                ))}
              </div>
              {pickerDraft.year ? (
                <p className="mt-2 text-[length:var(--text-xs)] font-semibold text-[color:var(--color-text-secondary)]">
                  Selecionado: {pickerDraft.day || "--"}/{pickerDraft.month || "--"}/{pickerDraft.year}
                  {selectedMonthLabel ? ` · ${selectedMonthLabel}` : ""}
                </p>
              ) : null}
            </div>

            {pickerError ? (
              <Feedback tone="error" compact role="alert" ariaLive="assertive">
                {pickerError}
              </Feedback>
            ) : null}

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Button type="button" fullWidth onClick={usePickerDate}>
                Usar esta data
              </Button>
              <Button type="button" variant="secondary" fullWidth onClick={() => setIsPickerOpen(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </BottomSheet>
      ) : null}
    </div>
  );
}
