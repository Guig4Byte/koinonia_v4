"use client";

import { createContext, useContext, useEffect, useMemo, useState, type FormEvent, type MouseEvent, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { FixedActionBar, FixedActionBarContent } from "@/components/ui/fixed-action-bar";
import { cn } from "@/lib/cn";
import styles from "./group-form.module.css";

type GroupFormGuardContextValue = {
  isDirty: boolean;
  markDirty: () => void;
  resetDirty: () => void;
  confirmLeave: () => boolean;
};

const GroupFormGuardContext = createContext<GroupFormGuardContextValue | null>(null);
const GroupFormDirtyContext = createContext<(() => void) | null>(null);

const unsavedChangesMessage = "Você tem alterações não salvas. Deseja sair sem salvar?";

function useGroupFormGuard() {
  const context = useContext(GroupFormGuardContext);

  if (!context) {
    throw new Error("GroupForm components must be rendered inside GroupFormGuard.");
  }

  return context;
}

export function useGroupFormDirty() {
  return useContext(GroupFormDirtyContext);
}

export function GroupFormGuard({ children }: { children: ReactNode }) {
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (!isDirty) return undefined;

    function confirmBrowserLeave(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", confirmBrowserLeave);

    return () => {
      window.removeEventListener("beforeunload", confirmBrowserLeave);
    };
  }, [isDirty]);

  const value = useMemo<GroupFormGuardContextValue>(() => {
    function markDirty() {
      setIsDirty(true);
    }

    function resetDirty() {
      setIsDirty(false);
    }

    function confirmLeave() {
      if (!isDirty) return true;
      return window.confirm(unsavedChangesMessage);
    }

    return {
      isDirty,
      markDirty,
      resetDirty,
      confirmLeave,
    };
  }, [isDirty]);

  return (
    <GroupFormGuardContext.Provider value={value}>
      <GroupFormDirtyContext.Provider value={value.markDirty}>{children}</GroupFormDirtyContext.Provider>
    </GroupFormGuardContext.Provider>
  );
}

export function GroupFormBackLink({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  const { confirmLeave } = useGroupFormGuard();

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (!confirmLeave()) event.preventDefault();
  }

  return (
    <Link
      href={href}
      className={cn(
        "mb-4 inline-flex min-h-12 items-center gap-2 rounded-2xl px-3 pr-4 text-[length:var(--text-sm)] font-semibold text-[color:var(--color-brand)] transition hover:bg-[var(--surface-alt)] active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus-ring)]",
        className,
      )}
      onClick={handleClick}
    >
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      {children}
    </Link>
  );
}

type GroupFormActionsProps = {
  action: (formData: FormData) => void | Promise<void>;
  backHref: string;
  cancelLabel?: string;
  submitLabel: string;
  idleMessage?: string;
  dirtyMessage?: string;
  confirmDeactivation?: boolean;
  className?: string;
  children: ReactNode;
};

function SubmitButton({ disabled, label }: { disabled: boolean; label: string }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" size="lg" loading={pending} disabled={disabled || pending} aria-busy={pending} fullWidth>
      {pending ? "Salvando..." : label}
    </Button>
  );
}

export function GroupFormActions({
  action,
  backHref,
  cancelLabel = "Cancelar",
  submitLabel,
  idleMessage = "Nenhuma alteração pendente.",
  dirtyMessage = "Alterações não salvas.",
  confirmDeactivation = false,
  className,
  children,
}: GroupFormActionsProps) {
  const { isDirty, markDirty, resetDirty, confirmLeave } = useGroupFormGuard();

  function confirmCancel(event: MouseEvent<HTMLAnchorElement>) {
    if (!confirmLeave()) event.preventDefault();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (confirmDeactivation) {
      const formData = new FormData(event.currentTarget);
      const willDeactivate = !formData.has("isActive");

      if (willDeactivate) {
        const shouldDeactivate = window.confirm(
          "Você está desativando esta célula. Ela sairá das superfícies padrão, encontros e check-in. Deseja continuar?",
        );

        if (!shouldDeactivate) {
          event.preventDefault();
          return;
        }
      }
    }

    resetDirty();
  }

  const statusMessage = isDirty ? dirtyMessage : idleMessage;

  return (
    <form
      action={action}
      className={className}
      onChange={() => markDirty()}
      onInput={() => markDirty()}
      onSubmit={handleSubmit}
    >
      <FixedActionBarContent>{children}</FixedActionBarContent>

      <FixedActionBar tone="muted">
        <div className={styles.actionBar}>
          <Badge tone={isDirty ? "warn" : "neutral"} shape="rounded" truncate={false} className="w-full" aria-live="polite">
            {statusMessage}
          </Badge>

          <div className={styles.actionButtons}>
            <ButtonLink href={backHref} variant="secondary" size="lg" onClick={confirmCancel} fullWidth>
              {cancelLabel}
            </ButtonLink>
            <SubmitButton label={submitLabel} disabled={!isDirty} />
          </div>
        </div>
      </FixedActionBar>
    </form>
  );
}
