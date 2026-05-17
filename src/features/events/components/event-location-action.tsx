import { GhostButton } from "@/components/ui/button";
import { InputField } from "@/components/ui/field";
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
    <div className="mt-5 flex flex-col gap-2">
      <InputField
        id="event-location-name"
        label="Local deste encontro"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={defaultLocationName ? `Padrão: ${defaultLocationName}` : "Ex.: Casa da família Souza"}
        maxLength={EVENT_LOCATION_MAX_LENGTH}
        required
        size="sm"
        surface="muted"
      />
      <GhostButton type="button" onClick={onSave} disabled={disabled} fullWidth shape="pill">
        {actionLabel}
      </GhostButton>
    </div>
  );
}
