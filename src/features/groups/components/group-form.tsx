import { CalendarDays } from "lucide-react";
import { BackLink, InfoCard } from "@/components/shared/base-cards";
import { Card } from "@/components/ui/card";
import { GroupFormActions } from "@/features/groups/components/group-form-actions";
import { GroupMeetingTimeInput } from "@/features/groups/components/group-meeting-time-input";
import {
  GROUP_LOCATION_MAX_LENGTH,
  GROUP_NAME_MAX_LENGTH,
  WEEKDAY_OPTIONS,
  groupFormErrorMessage,
  groupFormFieldErrors,
  type GroupFormValues,
} from "@/features/groups/group-form";
import { cn } from "@/lib/cn";
import styles from "./group-form.module.css";

type GroupFormInitialValues = GroupFormValues;

function FormSectionTitle({ children }: { children: string }) {
  return (
    <p className="k-section-kicker">{children}</p>
  );
}

function RequiredMark() {
  return (
    <span className="ml-2 rounded-full border border-[var(--color-badge-info-border)] bg-[var(--color-badge-info-bg)] px-2 py-0.5 align-middle text-[0.625rem] font-semibold uppercase tracking-[0.08em] text-[color:var(--color-badge-info-text)]">
      Obrigatório
    </span>
  );
}

function FieldError({ id, children }: { id: string; children?: string }) {
  if (!children) return null;

  return (
    <span id={id} className="block text-[length:var(--text-xs)] font-semibold leading-relaxed text-[color:var(--color-metric-atencoes)]">
      {children}
    </span>
  );
}

const inputBaseClassName = "min-h-12 w-full rounded-2xl border bg-[var(--surface-alt)] px-4 text-[length:var(--text-sm)] font-medium text-[color:var(--color-text-primary)] outline-none transition placeholder:font-normal placeholder:text-[color:var(--color-text-muted)] hover:border-[var(--color-brand-accent)] focus:border-[var(--color-focus-ring)] focus:bg-[var(--color-bg-card)] focus:ring-2 focus:ring-[var(--color-focus-ring-soft)]";
const groupSelectClassName = "min-h-12 w-full appearance-none rounded-2xl border bg-[var(--surface-alt)] px-4 pr-12 text-[length:var(--text-sm)] font-medium text-[color:var(--color-text-primary)] outline-none transition hover:border-[var(--color-brand-accent)] focus:border-[var(--color-focus-ring)] focus:bg-[var(--color-bg-card)] focus:ring-2 focus:ring-[var(--color-focus-ring-soft)]";
const helperTextClassName = "block text-[length:var(--text-xs)] leading-relaxed text-[color:var(--color-text-secondary)]";

function fieldClassName(hasError: boolean, baseClassName = inputBaseClassName) {
  return cn(
    baseClassName,
    hasError
      ? "border-[var(--color-metric-atencoes)] focus:border-[var(--color-metric-atencoes)]"
      : "border-[var(--color-border-card)]",
  );
}

export function GroupForm({
  title,
  description,
  backHref,
  backLabel,
  action,
  submitLabel,
  initialValues,
  errorCode,
}: {
  title: string;
  description: string;
  backHref: string;
  backLabel: string;
  action: (formData: FormData) => void | Promise<void>;
  submitLabel: string;
  initialValues: GroupFormInitialValues;
  errorCode?: string;
}) {
  const errorMessage = groupFormErrorMessage(errorCode);
  const fieldErrors = groupFormFieldErrors(errorCode);
  const nameErrorId = "group-name-error";
  const locationErrorId = "group-location-error";
  const scheduleHintId = "group-schedule-hint";
  const scheduleErrorId = "group-schedule-error";
  const hasNameError = Boolean(fieldErrors.name);
  const hasLocationError = Boolean(fieldErrors.locationName);
  const hasScheduleError = Boolean(fieldErrors.schedule);

  return (
    <div className="space-y-5">
      <BackLink href={backHref}>{backLabel}</BackLink>

      <Card padding="lg" className="rounded-[1.35rem]">
        <p className="k-section-kicker">Célula</p>
        <h2 className="mt-1 text-[length:var(--text-2xl)] font-semibold tracking-[-0.03em] text-[color:var(--color-text-primary)]">{title}</h2>
        <p className="mt-2 text-[length:var(--text-sm)] leading-relaxed text-[color:var(--color-text-secondary)]">{description}</p>
      </Card>

      {errorMessage ? (
        <InfoCard tone="error">{errorMessage}</InfoCard>
      ) : null}

      <GroupFormActions
        action={action}
        backHref={backHref}
        submitLabel={submitLabel}
        className="space-y-5 rounded-[1.35rem] border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-5 shadow-card"
      >
        <section className="space-y-4">
          <FormSectionTitle>Dados básicos</FormSectionTitle>

          <label className="block space-y-1.5" htmlFor="group-name">
            <span className="k-item-title-sm">Nome<RequiredMark /></span>
            <input
              id="group-name"
              name="name"
              defaultValue={initialValues.name}
              maxLength={GROUP_NAME_MAX_LENGTH}
              required
              aria-invalid={hasNameError || undefined}
              aria-describedby={hasNameError ? nameErrorId : undefined}
              placeholder="Ex.: Célula Central"
              className={fieldClassName(hasNameError)}
            />
            <FieldError id={nameErrorId}>{fieldErrors.name}</FieldError>
          </label>

          <label className="block space-y-1.5" htmlFor="group-location">
            <span className="k-item-title-sm">Local padrão</span>
            <input
              id="group-location"
              name="locationName"
              defaultValue={initialValues.locationName ?? ""}
              maxLength={GROUP_LOCATION_MAX_LENGTH}
              aria-invalid={hasLocationError || undefined}
              aria-describedby={hasLocationError ? locationErrorId : undefined}
              placeholder="Casa, bairro ou referência"
              className={fieldClassName(hasLocationError)}
            />
            <FieldError id={locationErrorId}>{fieldErrors.locationName}</FieldError>
            <span className={helperTextClassName}>
              O local padrão é copiado para novos encontros, mas cada encontro pode ter local próprio.
            </span>
          </label>
        </section>

        <section className="space-y-4 border-t border-[var(--color-border-divider)] pt-4">
          <FormSectionTitle>Agenda padrão</FormSectionTitle>

          <div className={styles.scheduleFields}>
            <label className="block min-w-0 space-y-1.5" htmlFor="meeting-day-of-week">
              <span className="k-item-title-sm">Dia padrão</span>
              <div className={styles.selectField}>
                <select
                  id="meeting-day-of-week"
                  name="meetingDayOfWeek"
                  defaultValue={initialValues.meetingDayOfWeek ?? ""}
                  aria-invalid={hasScheduleError || undefined}
                  aria-describedby={`${scheduleHintId}${hasScheduleError ? ` ${scheduleErrorId}` : ""}`}
                  className={fieldClassName(hasScheduleError, groupSelectClassName)}
                >
                  <option value="">Sem dia fixo</option>
                  {WEEKDAY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <span className={styles.selectIcon} aria-hidden="true">
                  <CalendarDays className="h-4 w-4" />
                </span>
              </div>
            </label>

            <div className="block min-w-0 space-y-1.5">
              <label className="k-item-title-sm block" htmlFor="meeting-time">Horário padrão</label>
              <GroupMeetingTimeInput
                defaultValue={initialValues.meetingTime}
                ariaInvalid={hasScheduleError}
                ariaDescribedBy={`${scheduleHintId}${hasScheduleError ? ` ${scheduleErrorId}` : ""}`}
              />
            </div>
          </div>

          <span id={scheduleHintId} className={helperTextClassName}>
            Dia e horário precisam ser preenchidos juntos. Deixe os dois em branco se a célula não tiver agenda fixa.
          </span>
          <FieldError id={scheduleErrorId}>{fieldErrors.schedule}</FieldError>
        </section>

        <section className="space-y-3 border-t border-[var(--color-border-divider)] pt-4">
          <FormSectionTitle>Status</FormSectionTitle>

          <label className="flex items-start gap-3 rounded-2xl border border-[var(--color-border-card)] bg-[var(--surface-alt)] p-4">
            <input
              name="isActive"
              type="checkbox"
              defaultChecked={initialValues.isActive}
              className="mt-1 h-4 w-4 rounded border-[var(--color-border-card)] accent-[var(--color-brand)]"
            />
            <span>
              <span className="k-item-title-sm block">Célula ativa</span>
              <span className="mt-1 block text-[length:var(--text-xs)] leading-relaxed text-[color:var(--color-text-secondary)]">
                Células inativas não aparecem nas superfícies padrão, encontros ou check-in.
              </span>
            </span>
          </label>
        </section>
      </GroupFormActions>
    </div>
  );
}
