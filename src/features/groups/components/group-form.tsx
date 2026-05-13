import { CalendarDays } from "lucide-react";
import { BackLink, InfoCard } from "@/components/shared/base-cards";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import { GroupMeetingTimeInput } from "@/features/groups/components/group-meeting-time-input";
import { GROUP_LOCATION_MAX_LENGTH, GROUP_NAME_MAX_LENGTH, WEEKDAY_OPTIONS, groupFormErrorMessage, type GroupFormValues } from "@/features/groups/group-form";
import styles from "./group-form.module.css";

type GroupFormInitialValues = GroupFormValues;

function FormSectionTitle({ children }: { children: string }) {
  return (
    <p className="k-section-kicker">{children}</p>
  );
}

const groupTextInputClassName = "min-h-12 w-full rounded-2xl border border-[var(--color-border-card)] bg-[var(--surface-alt)] px-4 text-[length:var(--text-sm)] font-medium text-[color:var(--color-text-primary)] outline-none transition placeholder:font-normal placeholder:text-[color:var(--color-text-muted)] hover:border-[var(--color-brand-accent)] focus:border-[var(--color-brand)] focus:bg-[var(--color-bg-card)] focus:ring-2 focus:ring-[var(--color-brand-accent)]";
const groupSelectClassName = "min-h-12 w-full appearance-none rounded-2xl border border-[var(--color-border-card)] bg-[var(--surface-alt)] px-4 pr-12 text-[length:var(--text-sm)] font-medium text-[color:var(--color-text-primary)] outline-none transition hover:border-[var(--color-brand-accent)] focus:border-[var(--color-brand)] focus:bg-[var(--color-bg-card)] focus:ring-2 focus:ring-[var(--color-brand-accent)]";
const helperTextClassName = "block text-[length:var(--text-xs)] leading-relaxed text-[color:var(--color-text-secondary)]";

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

  return (
    <div className="space-y-5">
      <BackLink href={backHref}>{backLabel}</BackLink>

      <Card padding="lg" className="rounded-[1.35rem]">
        <p className="k-section-kicker">Célula</p>
        <h2 className="mt-1 text-[length:var(--text-2xl)] font-semibold tracking-[-0.03em] text-[color:var(--color-text-primary)]">{title}</h2>
        <p className="mt-2 text-[length:var(--text-sm)] leading-relaxed text-[color:var(--color-text-secondary)]">{description}</p>
      </Card>

      {errorMessage ? (
        <InfoCard>{errorMessage}</InfoCard>
      ) : null}

      <form action={action} className="space-y-5 rounded-[1.35rem] border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-5 shadow-card">
        <section className="space-y-4">
          <FormSectionTitle>Dados básicos</FormSectionTitle>

          <label className="block space-y-1.5">
            <span className="k-item-title-sm">Nome</span>
            <input
              name="name"
              defaultValue={initialValues.name}
              maxLength={GROUP_NAME_MAX_LENGTH}
              required
              placeholder="Ex.: Célula Central"
              className={groupTextInputClassName}
            />
          </label>

          <label className="block space-y-1.5">
            <span className="k-item-title-sm">Local padrão</span>
            <input
              name="locationName"
              defaultValue={initialValues.locationName ?? ""}
              maxLength={GROUP_LOCATION_MAX_LENGTH}
              placeholder="Casa, bairro ou referência"
              className={groupTextInputClassName}
            />
            <span className={helperTextClassName}>
              O local padrão é copiado para novos encontros, mas cada encontro pode ter local próprio.
            </span>
          </label>
        </section>

        <section className="space-y-4 border-t border-[var(--color-border-divider)] pt-4">
          <FormSectionTitle>Agenda padrão</FormSectionTitle>

          <div className={styles.scheduleFields}>
            <label className="block min-w-0 space-y-1.5">
              <span className="k-item-title-sm">Dia padrão</span>
              <div className={styles.selectField}>
                <select
                  name="meetingDayOfWeek"
                  defaultValue={initialValues.meetingDayOfWeek ?? ""}
                  className={groupSelectClassName}
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

            <label className="block min-w-0 space-y-1.5">
              <span className="k-item-title-sm">Horário padrão</span>
              <GroupMeetingTimeInput defaultValue={initialValues.meetingTime} />
            </label>
          </div>

          <span className={helperTextClassName}>
            Informe dia e horário juntos para gerar encontros automaticamente.
          </span>
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

        <div className="flex flex-col-reverse gap-3 border-t border-[var(--color-border-divider)] pt-4 sm:flex-row sm:justify-end">
          <ButtonLink href={backHref} variant="secondary" size="lg">
            Cancelar
          </ButtonLink>
          <Button type="submit" size="lg">
            {submitLabel}
          </Button>
        </div>
      </form>
    </div>
  );
}
