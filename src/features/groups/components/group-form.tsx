import { InfoCard } from "@/components/shared/base-cards";
import { Card } from "@/components/ui/card";
import { FieldError, InputField } from "@/components/ui/field";
import {
  FormFieldStack,
  FormSection,
  formStackClassName,
} from "@/components/ui/form-section";
import { ToggleCardField } from "@/components/ui/toggle-card-field";
import {
  GroupFormActions,
  GroupFormBackLink,
  GroupFormGuard,
} from "@/features/groups/components/group-form-actions";
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
  const isEditingExistingCell = initialValues.name.trim().length > 0;
  const idleMessage = isEditingExistingCell
    ? "Nada para salvar agora."
    : "Só o essencial já permite salvar.";

  return (
    <GroupFormGuard>
      <div className={styles.page}>
        <GroupFormBackLink href={backHref} className={styles.backLink}>
          {backLabel}
        </GroupFormBackLink>

        <Card padding="sm" radius="lg" surface="heroGlow">
          <p className={styles.heroKicker}>Célula</p>
          <h2 className={styles.heroTitle}>{title}</h2>
          <p className={styles.heroDescription}>{description}</p>
        </Card>

        {errorMessage ? <InfoCard tone="error">{errorMessage}</InfoCard> : null}

        <GroupFormActions
          action={action}
          backHref={backHref}
          submitLabel={submitLabel}
          idleMessage={idleMessage}
          confirmDeactivation={initialValues.isActive && isEditingExistingCell}
          className={formStackClassName}
        >
          <FormSection title="Dados básicos">
            <FormFieldStack>
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
                surface="warm"
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
                surface="warm"
              />
            </FormFieldStack>
          </FormSection>

          <FormSection title="Agenda padrão">
            <div className={styles.scheduleFields}>
              <div className={styles.timeFieldShell}>
                <label
                  className={styles.fieldLabel}
                  htmlFor="meeting-day-of-week"
                >
                  Dia padrão
                </label>
                <GroupMeetingDayInput
                  defaultValue={initialValues.meetingDayOfWeek}
                  ariaInvalid={hasScheduleError}
                  ariaDescribedBy={scheduleDescribedBy}
                />
              </div>

              <div className={styles.timeFieldShell}>
                <label className={styles.fieldLabel} htmlFor="meeting-time">
                  Horário padrão
                </label>
                <GroupMeetingTimeInput
                  defaultValue={initialValues.meetingTime}
                  ariaInvalid={hasScheduleError}
                  ariaDescribedBy={scheduleDescribedBy}
                />
              </div>
            </div>

            <span id={scheduleHintId} className={styles.hint}>
              Dia e horário precisam estar juntos. Os dois podem ficar em branco
              quando a célula não tiver agenda fixa.
            </span>
            <FieldError id={scheduleErrorId}>{fieldErrors.schedule}</FieldError>
          </FormSection>

          <FormSection title="Status">
            <ToggleCardField
              name="isActive"
              title="Célula ativa"
              description="Células inativas ficam guardadas fora das listas principais, encontros e check-in."
              defaultChecked={initialValues.isActive}
            />
          </FormSection>
        </GroupFormActions>
      </div>
    </GroupFormGuard>
  );
}
