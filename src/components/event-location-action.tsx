import { GhostButton } from "@/components/ui/button";
import { EVENT_LOCATION_MAX_LENGTH } from "@/features/events/event-fields";

export function EventLocationAction({
  value,
  defaultLocationName,
  actionLabel,
  disabled,
  onChange,
  onSave,
}: {
  value: string;
  defaultLocationName?: string | null;
  actionLabel: string;
  disabled: boolean;
  onChange: (value: string) => void;
  onSave: () => void;
}) {
  return (
    <>
      <label className="mt-4 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-secondary)]" htmlFor="event-location-name">
        Local deste encontro
      </label>
      <div className="mt-2 flex flex-col gap-2">
        <input
          id="event-location-name"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={defaultLocationName ? `Padrão: ${defaultLocationName}` : "Ex.: Casa da família Souza"}
          className="min-h-11 rounded-2xl border border-[var(--color-border-card)] bg-[var(--metric-card-bg)] px-3 text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-brand)]"
          maxLength={EVENT_LOCATION_MAX_LENGTH}
          required
        />
        <GhostButton type="button" onClick={onSave} disabled={disabled} className="w-full rounded-xl">
          {actionLabel}
        </GhostButton>
      </div>
    </>
  );
}
