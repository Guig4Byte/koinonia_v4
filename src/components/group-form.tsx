import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { BackLink, InfoCard } from "@/components/base-cards";
import { GroupMeetingTimeInput } from "@/components/group-meeting-time-input";
import { GROUP_LOCATION_MAX_LENGTH, GROUP_NAME_MAX_LENGTH, WEEKDAY_OPTIONS, groupFormErrorMessage, type GroupFormValues } from "@/features/groups/group-form";

type GroupFormInitialValues = GroupFormValues;

function FormSectionTitle({ children }: { children: string }) {
  return (
    <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-text-secondary)]">{children}</p>
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

  return (
    <div className="group-form-page space-y-5">
      <BackLink href={backHref}>{backLabel}</BackLink>

      <section className="rounded-[1.35rem] border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-5 shadow-card">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-text-secondary)]">Célula</p>
        <h2 className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-[var(--color-text-primary)]">{title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">{description}</p>
      </section>

      {errorMessage ? (
        <InfoCard>{errorMessage}</InfoCard>
      ) : null}

      <form action={action} className="space-y-5 rounded-[1.35rem] border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-5 shadow-card">
        <section className="space-y-4">
          <FormSectionTitle>Dados básicos</FormSectionTitle>

          <label className="block space-y-1.5">
            <span className="text-sm font-semibold text-[var(--color-text-primary)]">Nome</span>
            <input
              name="name"
              defaultValue={initialValues.name}
              maxLength={GROUP_NAME_MAX_LENGTH}
              required
              placeholder="Ex.: Célula Central"
              className="min-h-12 w-full rounded-2xl border border-[var(--color-border-card)] bg-[var(--surface-alt)] px-4 text-sm font-medium text-[var(--color-text-primary)] outline-none transition focus:border-[var(--color-brand)] focus:bg-[var(--color-bg-card)]"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-semibold text-[var(--color-text-primary)]">Local padrão</span>
            <input
              name="locationName"
              defaultValue={initialValues.locationName ?? ""}
              maxLength={GROUP_LOCATION_MAX_LENGTH}
              placeholder="Casa, bairro ou referência"
              className="min-h-12 w-full rounded-2xl border border-[var(--color-border-card)] bg-[var(--surface-alt)] px-4 text-sm font-medium text-[var(--color-text-primary)] outline-none transition focus:border-[var(--color-brand)] focus:bg-[var(--color-bg-card)]"
            />
            <span className="block text-xs leading-relaxed text-[var(--color-text-secondary)]">
              O local padrão é copiado para novos encontros, mas cada encontro pode ter local próprio.
            </span>
          </label>
        </section>

        <section className="space-y-4 border-t border-[var(--color-border-divider)] pt-4">
          <FormSectionTitle>Agenda padrão</FormSectionTitle>

          <div className="group-schedule-fields">
            <label className="block min-w-0 space-y-1.5">
              <span className="text-sm font-semibold text-[var(--color-text-primary)]">Dia padrão</span>
              <div className="group-select-field">
                <select
                  name="meetingDayOfWeek"
                  defaultValue={initialValues.meetingDayOfWeek ?? ""}
                  className="min-h-12 w-full appearance-none rounded-2xl border border-[var(--color-border-card)] bg-[var(--surface-alt)] px-4 pr-12 text-sm font-medium text-[var(--color-text-primary)] outline-none transition focus:border-[var(--color-brand)] focus:bg-[var(--color-bg-card)]"
                >
                  <option value="">Sem dia fixo</option>
                  {WEEKDAY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <span className="group-select-icon" aria-hidden="true">
                  <CalendarDays className="h-4 w-4" />
                </span>
              </div>
            </label>

            <label className="block min-w-0 space-y-1.5">
              <span className="text-sm font-semibold text-[var(--color-text-primary)]">Horário padrão</span>
              <GroupMeetingTimeInput defaultValue={initialValues.meetingTime} />
            </label>
          </div>

          <span className="block text-xs leading-relaxed text-[var(--color-text-secondary)]">
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
              <span className="block text-sm font-semibold text-[var(--color-text-primary)]">Célula ativa</span>
              <span className="mt-1 block text-xs leading-relaxed text-[var(--color-text-secondary)]">
                Células inativas não aparecem nas superfícies padrão, encontros ou check-in.
              </span>
            </span>
          </label>
        </section>

        <div className="flex flex-col-reverse gap-3 border-t border-[var(--color-border-divider)] pt-4 sm:flex-row sm:justify-end">
          <Link
            href={backHref}
            className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-[var(--color-btn-secondary-border)] bg-[var(--color-btn-secondary-bg)] px-4 text-sm font-semibold text-[var(--color-btn-secondary-text)] transition active:scale-[0.98]"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-[var(--color-btn-primary-bg)] bg-[var(--color-btn-primary-bg)] px-4 text-sm font-semibold text-[var(--color-btn-primary-text)] shadow-card transition active:scale-[0.98]"
          >
            {submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
}
