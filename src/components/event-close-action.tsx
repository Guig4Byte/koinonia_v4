import { GhostButton } from "@/components/ui/button";
import { closeEventActionCopy, closedWithoutPresenceCopy } from "@/features/events/event-actions-view";

export function EventCloseAction({
  hasPresenceData,
  isClosedWithoutPresence,
  isFutureEvent,
  disabled,
  onClose,
  onReopen,
}: {
  hasPresenceData: boolean;
  isClosedWithoutPresence: boolean;
  isFutureEvent: boolean;
  disabled: boolean;
  onClose: () => void;
  onReopen: () => void;
}) {
  if (hasPresenceData) {
    return (
      <p className="mt-4 rounded-2xl border border-[var(--color-border-divider)] bg-[var(--surface-alt)] p-3 text-xs leading-relaxed text-[var(--color-text-secondary)]">
        Este encontro já tem presença registrada. O local ainda pode ser ajustado, mas o encontro não pode ser cancelado ou remarcado.
      </p>
    );
  }

  if (isClosedWithoutPresence) {
    return (
      <div className="mt-4 rounded-2xl border border-[var(--color-border-divider)] bg-[var(--surface-alt)] p-3">
        <p className="text-sm font-semibold text-[var(--color-text-primary)]">Aconteceu nesta semana?</p>
        <p className="mt-1 text-xs leading-relaxed text-[var(--color-text-secondary)]">{closedWithoutPresenceCopy(isFutureEvent)}</p>
        <GhostButton type="button" onClick={onReopen} disabled={disabled} className="mt-3 w-full rounded-xl">
          Marcar que houve encontro
        </GhostButton>
      </div>
    );
  }

  const copy = closeEventActionCopy(isFutureEvent);

  return (
    <div className="mt-4 rounded-2xl border border-[var(--color-border-divider)] bg-[var(--surface-alt)] p-3">
      <p className="text-sm font-semibold text-[var(--color-text-primary)]">{copy.title}</p>
      <p className="mt-1 text-xs leading-relaxed text-[var(--color-text-secondary)]">{copy.description}</p>
      <GhostButton
        type="button"
        onClick={onClose}
        disabled={disabled}
        className="mt-3 w-full rounded-xl"
      >
        {copy.actionLabel}
      </GhostButton>
    </div>
  );
}
