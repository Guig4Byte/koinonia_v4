"use client";

import { useMemo, useState } from "react";
import { ChoicePickerField } from "@/components/ui/choice-picker-field";
import { Field } from "@/components/ui/field";
import type { UserPersonOption } from "@/features/users/user-form";

type PersonPickerOption = {
  value: string;
  label: string;
  searchText: string;
};

const emptyPersonOption: PersonPickerOption = {
  value: "",
  label: "Sem vínculo por enquanto",
  searchText: "sem vinculo sem vínculo sem pessoa",
};

const pinnedPersonOptionValues = [emptyPersonOption.value];

function personOptionLabel(person: UserPersonOption) {
  return `${person.fullName}${person.phone ? ` · ${person.phone}` : ""}`;
}

function personPickerOptions(people: UserPersonOption[]): PersonPickerOption[] {
  return [
    emptyPersonOption,
    ...people.map((person) => ({
      value: person.id,
      label: personOptionLabel(person),
      searchText: `${person.fullName} ${person.phone ?? ""}`,
    })),
  ];
}

export function UserPersonPickerField({
  id,
  name,
  label,
  defaultValue,
  people,
  error,
  description,
}: {
  id: string;
  name: string;
  label: string;
  defaultValue: string;
  people: UserPersonOption[];
  error?: string;
  description: string;
}) {
  const [selectedValue, setSelectedValue] = useState(defaultValue);
  const options = useMemo(() => personPickerOptions(people), [people]);
  const descriptionId = `${id}-description`;
  const errorId = `${id}-error`;

  return (
    <Field
      htmlFor={id}
      label={label}
      labelVariant="item"
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
        surface="warm"
        fieldSpacing="none"
        popoverWidth="control"
        searchable
        searchPlaceholder="Buscar pessoa por nome ou telefone"
        emptyMessage="Nenhuma pessoa encontrada. Confira o nome ou telefone."
        maxVisibleOptions={7}
        pinnedOptionValues={pinnedPersonOptionValues}
        ariaDescribedBy={`${descriptionId}${error ? ` ${errorId}` : ""}`}
        ariaInvalid={Boolean(error)}
        onValueChange={setSelectedValue}
      />
    </Field>
  );
}
