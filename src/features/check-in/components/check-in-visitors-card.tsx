"use client";

import type { ReactNode } from "react";
import { Plus } from "lucide-react";
import { GhostButton } from "@/components/ui/button";
import { InputField } from "@/components/ui/field";
import { countLabel } from "@/lib/format";

type VisitorRecord = {
  id: string;
  fullName: string;
};

type VisitorDraft = {
  id: string;
  fullName: string;
};

type CheckInVisitorsCardProps = {
  savedVisitors: VisitorRecord[];
  fallbackSavedVisitorCount: number;
  visitors: VisitorDraft[];
  visitorName: string;
  onVisitorNameChange: (name: string) => void;
  onAddVisitor: () => void;
  onRemoveVisitor: (id: string) => void;
  disabled?: boolean;
};

function VisitorSectionTitle({ children }: { children: string }) {
  return (
    <p className="text-[length:var(--text-xs)] font-semibold uppercase tracking-[0.12em] text-[color:var(--color-text-secondary)]">
      {children}
    </p>
  );
}

function VisitorRow({ name, trailing }: { name: string; trailing: ReactNode }) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-[var(--metric-card-bg)] px-3 py-2 text-[length:var(--text-sm)]">
      <span className="font-medium text-[color:var(--color-text-primary)]">{name}</span>
      {trailing}
    </div>
  );
}

export function CheckInVisitorsCard({
  savedVisitors,
  fallbackSavedVisitorCount,
  visitors,
  visitorName,
  onVisitorNameChange,
  onAddVisitor,
  onRemoveVisitor,
  disabled = false,
}: CheckInVisitorsCardProps) {
  return (
    <div className="rounded-[1.15rem] border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-4 shadow-card">
      <p className="k-item-title">Visitantes do encontro</p>
      {savedVisitors.length > 0 ? (
        <div className="mt-3 space-y-2">
          <VisitorSectionTitle>Já salvos</VisitorSectionTitle>
          {savedVisitors.map((visitor) => (
            <VisitorRow
              key={visitor.id}
              name={visitor.fullName}
              trailing={
                <span className="text-[length:var(--text-xs)] font-semibold text-[color:var(--color-text-secondary)]">salvo</span>
              }
            />
          ))}
        </div>
      ) : fallbackSavedVisitorCount > 0 ? (
        <p className="mt-3 rounded-2xl bg-[var(--metric-card-bg)] px-3 py-2 text-[length:var(--text-sm)] text-[color:var(--color-text-secondary)]">
          {countLabel(fallbackSavedVisitorCount, "visitante já salvo", "visitantes já salvos")}.
        </p>
      ) : (
        <p className="mt-2 text-[length:var(--text-sm)] text-[color:var(--color-text-secondary)]">Nenhum visitante marcado neste encontro até agora.</p>
      )}

      <div className="mt-4 flex gap-2">
        <InputField
          id="visitor-name"
          label="Nome do visitante"
          labelHidden
          value={visitorName}
          onChange={(event) => onVisitorNameChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              onAddVisitor();
            }
          }}
          placeholder="Nome do visitante"
          disabled={disabled}
          size="sm"
          surface="muted"
          className="flex-1"
        />
        <GhostButton type="button" onClick={onAddVisitor} className="px-3" aria-label="Adicionar visitante" disabled={disabled}>
          <Plus className="h-4 w-4" />
        </GhostButton>
      </div>

      {visitors.length > 0 ? (
        <div className="mt-3 space-y-2">
          <VisitorSectionTitle>Para incluir ao salvar</VisitorSectionTitle>
          {visitors.map((visitor) => (
            <VisitorRow
              key={visitor.id}
              name={visitor.fullName}
              trailing={
                <button
                  type="button"
                  onClick={() => onRemoveVisitor(visitor.id)}
                  disabled={disabled}
                  className="text-[length:var(--text-xs)] font-semibold text-[color:var(--color-text-secondary)] disabled:cursor-not-allowed disabled:saturate-75"
                >
                  remover
                </button>
              }
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
