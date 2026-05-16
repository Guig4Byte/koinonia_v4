"use client";

import { createContext, useContext, useState, type MouseEvent, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";

const GroupFormDirtyContext = createContext<(() => void) | null>(null);

export function useGroupFormDirty() {
  return useContext(GroupFormDirtyContext);
}

type GroupFormActionsProps = {
  action: (formData: FormData) => void | Promise<void>;
  backHref: string;
  cancelLabel?: string;
  submitLabel: string;
  className?: string;
  children: ReactNode;
};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" size="lg" loading={pending} aria-busy={pending}>
      {pending ? "Salvando..." : label}
    </Button>
  );
}

export function GroupFormActions({
  action,
  backHref,
  cancelLabel = "Cancelar",
  submitLabel,
  className,
  children,
}: GroupFormActionsProps) {
  const [isDirty, setIsDirty] = useState(false);

  function markDirty() {
    setIsDirty(true);
  }

  function confirmCancel(event: MouseEvent<HTMLAnchorElement>) {
    if (!isDirty) return;

    const shouldLeave = window.confirm("Você tem alterações não salvas. Deseja sair sem salvar?");
    if (!shouldLeave) event.preventDefault();
  }

  return (
    <form
      action={action}
      className={className}
      onChange={markDirty}
      onInput={markDirty}
      onSubmit={() => setIsDirty(false)}
    >
      <GroupFormDirtyContext.Provider value={markDirty}>
        {children}
      </GroupFormDirtyContext.Provider>
      <div className="flex flex-col-reverse gap-3 border-t border-[var(--color-border-divider)] pt-4 sm:flex-row sm:justify-end">
        <ButtonLink href={backHref} variant="secondary" size="lg" onClick={confirmCancel}>
          {cancelLabel}
        </ButtonLink>
        <SubmitButton label={submitLabel} />
      </div>
    </form>
  );
}
