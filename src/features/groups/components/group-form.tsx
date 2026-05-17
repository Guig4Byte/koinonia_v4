import { CalendarDays } from "lucide-react";
import { BackLink, InfoCard } from "@/components/shared/base-cards";
import { Card } from "@/components/ui/card";
import { FieldError, InputField, SelectField } from "@/components/ui/field";
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
import styles from "./group-form.module.css";

type GroupFormInitialValues = GroupFormValues;

function FormSectionTitle({ children }: { children: string }) {
  return <p className="k-section-kicker">{children}</p>;
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
  const scheduleHintId = "group-schedule-hint";
  const scheduleErrorId = "group-schedule-error";
  const hasScheduleError = Boolean(fieldErrors.schedule);
  const scheduleDescribedBy = `${scheduleHintId}${hasScheduleError ? ` ${scheduleErrorId}` : ""}`;

  return (
    <div className="space-y-5">
      <BackLink href={backHref}>{backLabel}</BackLink>

      <Card padding="lg" radius="lg">
        <p className="k-section-kicker">Célula</p>
        <h2 className="mt-1 text-[length:var(--text-2xl)] font-semibold tracking-[-0.03em] text-[color:var(--color-text-primary)]">{title}</h2>
        <p className="mt-2 text-[length:var(--text-sm)] leading-relaxed text-[color:var(--color-text-secondary)]">{description}</p>
      </Card>

      {errorMessage ? <InfoCard tone="error">{errorMessage}</InfoCard> : null}

      <GroupFormActions
        action={action}
        backHref={backHref}
        submitLabel={submitLabel}
        className="space-y-5 rounded-[1.35rem] border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-5 shadow-card"
      >
        <section className="space-y-4">
          <FormSectionTitle>Dados básicos</FormSectionTitle>

          <InputField
            id="group-name"
            name="name"
            label="Nome"
            labelVariant="item"
            defaultValue={initialValues.name}
            maxLength={GROUP_NAME_MAX_LENGTH}
            required
            error={fieldErrors.name}
            placeholder="Ex.: Célula Central"
          />

          <InputField
            id="group-location"
            name="locationName"
            label="Local padrão"
            labelVariant="item"
            defaultValue={initialValues.locationName ?? ""}
            maxLength={GROUP_LOCATION_MAX_LENGTH}
            error={fieldErrors.locationName}
            description="O local padrão é copiado para novos encontros, mas cada encontro pode ter local próprio."
            placeholder="Casa, bairro ou referência"
          />
        </section>

        <section className="space-y-4 border-t border-[var(--color-border-divider)] pt-4">
          <FormSectionTitle>Agenda padrão</FormSectionTitle>

          <div className={styles.scheduleFields}>
            <SelectField
              id="meeting-day-of-week"
              name="meetingDayOfWeek"
              label="Dia padrão"
              labelVariant="item"
              className="min-w-0"
              defaultValue={initialValues.meetingDayOfWeek ?? ""}
              aria-invalid={hasScheduleError || undefined}
              aria-describedby={scheduleDescribedBy}
              icon={<CalendarDays className="h-4 w-4" />}
            >
              <option value="">Sem dia fixo</option>
              {WEEKDAY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </SelectField>

            <div className="block min-w-0 space-y-1.5">
              <label className="k-item-title-sm block" htmlFor="meeting-time">Horário padrão</label>
              <GroupMeetingTimeInput
                defaultValue={initialValues.meetingTime}
                ariaInvalid={hasScheduleError}
                ariaDescribedBy={scheduleDescribedBy}
              />
            </div>
          </div>

          <span id={scheduleHintId} className="block text-[length:var(--text-xs)] leading-relaxed text-[color:var(--color-text-secondary)]">
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
