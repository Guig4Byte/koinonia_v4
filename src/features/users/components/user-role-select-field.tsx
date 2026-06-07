"use client";

import { useState } from "react";
import { ChoicePickerField } from "@/components/ui/choice-picker-field";
import { Field } from "@/components/ui/field";

export type UserRoleSelectOption = {
  value: string;
  label: string;
  description: string;
};

export function UserRoleSelectField({
  id,
  name,
  label,
  defaultValue,
  options,
  required = false,
  disabled = false,
  error,
}: {
  id: string;
  name: string;
  label: string;
  defaultValue: string;
  options: UserRoleSelectOption[];
  required?: boolean;
  disabled?: boolean;
  error?: string;
}) {
  const [selectedValue, setSelectedValue] = useState(defaultValue);
  const selectedOption = options.find((option) => option.value === selectedValue);
  const description = selectedOption?.description ?? "Escolha o papel de acesso deste usuário.";
  const descriptionId = `${id}-description`;
  const errorId = `${id}-error`;

  return (
    <Field
      htmlFor={id}
      label={label}
      labelVariant="item"
      required={required}
      description={description}
      descriptionId={descriptionId}
      error={error}
      errorId={error ? errorId : undefined}
    >
      <ChoicePickerField
        id={id}
        name={name}
        defaultValue={defaultValue}
        value={selectedValue}
        options={options}
        disabled={disabled}
        surface="warm"
        fieldSpacing="none"
        popoverWidth="control"
        ariaDescribedBy={`${descriptionId}${error ? ` ${errorId}` : ""}`}
        ariaInvalid={Boolean(error)}
        onValueChange={setSelectedValue}
      />
    </Field>
  );
}
