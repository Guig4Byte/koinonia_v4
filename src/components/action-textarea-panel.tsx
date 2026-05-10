import type { ReactNode } from "react";
import { ActionPanel } from "@/components/ui/action-panel";
import { Button, type ButtonSize, type ButtonVariant } from "@/components/ui/button";
import { TextareaField } from "@/components/ui/field";

type ActionTextareaPanelAction = {
  id: string;
  label: ReactNode;
  icon?: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  onClick: () => void;
};

type ActionTextareaPanelProps = {
  title: ReactNode;
  description?: ReactNode;
  fieldId: string;
  fieldLabel: ReactNode;
  value: string;
  onValueChange: (value: string) => void;
  rows?: number;
  maxLength?: number;
  placeholder?: string;
  actions: ActionTextareaPanelAction[];
};

export function ActionTextareaPanel({
  title,
  description,
  fieldId,
  fieldLabel,
  value,
  onValueChange,
  rows = 3,
  maxLength,
  placeholder,
  actions,
}: ActionTextareaPanelProps) {
  return (
    <ActionPanel title={title} description={description}>
      <TextareaField
        id={fieldId}
        label={fieldLabel}
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        rows={rows}
        maxLength={maxLength}
        placeholder={placeholder}
        className="mb-2"
      />
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {actions.map((action) => (
          <Button
            key={action.id}
            type="button"
            variant={action.variant}
            size={action.size}
            fullWidth
            disabled={action.disabled}
            onClick={action.onClick}
          >
            {action.icon}
            {action.label}
          </Button>
        ))}
      </div>
    </ActionPanel>
  );
}
