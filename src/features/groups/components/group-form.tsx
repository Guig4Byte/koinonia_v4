import { BackLink, InfoCard } from "@/components/shared/base-cards";
import { Card } from "@/components/ui/card";
import { FieldError, InputField } from "@/components/ui/field";
import { GroupFormActions } from "@/features/groups/components/group-form-actions";
import { GroupMeetingDayInput } from "@/features/groups/components/group-meeting-day-input";
import { GroupMeetingTimeInput } from "@/features/groups/components/group-meeting-time-input";
import {
  GROUP_LOCATION_MAX_LENGTH,
  GROUP_NAME_MAX_LENGTH,
  groupFormErrorMessage,
  groupFormFieldErrors,
  type GroupFormValues,
} from "@/features/groups/group-form";
import styles from "./group-form.module.css";

type GroupFormInitialValues = GroupFormValues;

function FormSectionTitle({ children }: { children: string }) {
  return <p className={styles.sectionKicker}>{children}</p>;
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
    <div className={styles.page}>
      <BackLink href={backHref} className={styles.backLink}>{backLabel}</BackLink>

      <Card padding="lg" radius="lg" className={styles.heroCard}>
        <p className={styles.heroKicker}>Célula</p>
        <h2 className={styles.heroTitle}>{title}</h2>
        <p className={styles.heroDescription}>{description}</p>
      </Card>

      {errorMessage ? <InfoCard tone="error">{errorMessage}</InfoCard> : null}

      <GroupFormActions
        action={action}
        backHref={backHref}
        submitLabel={submitLabel}
        className={styles.formCard}
      >
        <section className={styles.formSection}>
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
            inputClassName={styles.control}
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
            inputClassName={styles.control}
          />
        </section>

        <section className={styles.formSection}>
          <FormSectionTitle>Agenda padrão</FormSectionTitle>

          <div className={styles.scheduleFields}>
            <div className={styles.timeFieldShell}>
              <label className={styles.fieldLabel} htmlFor="meeting-day-of-week">Dia padrão</label>
              <GroupMeetingDayInput
                defaultValue={initialValues.meetingDayOfWeek}
                ariaInvalid={hasScheduleError}
                ariaDescribedBy={scheduleDescribedBy}
              />
            </div>

            <div className={styles.timeFieldShell}>
              <label className={styles.fieldLabel} htmlFor="meeting-time">Horário padrão</label>
              <GroupMeetingTimeInput
                defaultValue={initialValues.meetingTime}
                ariaInvalid={hasScheduleError}
                ariaDescribedBy={scheduleDescribedBy}
              />
            </div>
          </div>

          <span id={scheduleHintId} className={styles.hint}>
            Dia e horário precisam ser preenchidos juntos. Deixe os dois em branco se a célula não tiver agenda fixa.
          </span>
          <FieldError id={scheduleErrorId}>{fieldErrors.schedule}</FieldError>
        </section>

        <section className={styles.formSection}>
          <FormSectionTitle>Status</FormSectionTitle>

          <label className={styles.statusOption}>
            <input
              name="isActive"
              type="checkbox"
              defaultChecked={initialValues.isActive}
              className={styles.statusCheckbox}
            />
            <span className={styles.statusVisual} aria-hidden="true">
              <span className={styles.statusKnob} />
            </span>
            <span className={styles.statusCopy}>
              <span className={styles.statusTitle}>Célula ativa</span>
              <span className={styles.statusDetail}>
                Células inativas não aparecem nas superfícies padrão, encontros ou check-in.
              </span>
            </span>
          </label>
        </section>
      </GroupFormActions>
    </div>
  );
}
