"use client";

import { Plus } from "lucide-react";
import { GhostButton } from "@/components/ui/button";
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
          <p className="text-[length:var(--text-xs)] font-semibold uppercase tracking-[0.12em] text-[color:var(--color-text-secondary)]">Já salvos</p>
          {savedVisitors.map((visitor) => (
            <div key={visitor.id} className="flex items-center justify-between rounded-2xl bg-[var(--metric-card-bg)] px-3 py-2 text-[length:var(--text-sm)]">
              <span className="font-medium text-[color:var(--color-text-primary)]">{visitor.fullName}</span>
              <span className="text-[length:var(--text-xs)] font-semibold text-[color:var(--color-text-secondary)]">salvo</span>
            </div>
          ))}
        </div>
      ) : fallbackSavedVisitorCount > 0 ? (
        <p className="mt-3 rounded-2xl bg-[var(--metric-card-bg)] px-3 py-2 text-[length:var(--text-sm)] text-[color:var(--color-text-secondary)]">
          {countLabel(fallbackSavedVisitorCount, "visitante já salvo", "visitantes já salvos")}.
        </p>
      ) : (
        <p className="mt-2 text-[length:var(--text-sm)] text-[color:var(--color-text-secondary)]">Nenhum visitante neste encontro até agora.</p>
      )}

      <div className="mt-4 flex gap-2">
        <input
          value={visitorName}
          onChange={(event) => onVisitorNameChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              onAddVisitor();
            }
          }}
          placeholder="Adicionar visitante"
          aria-label="Nome do visitante"
          disabled={disabled}
          className="min-h-11 flex-1 rounded-2xl border border-[var(--color-border-card)] bg-[var(--metric-card-bg)] px-3 text-[length:var(--text-sm)] text-[color:var(--color-text-primary)] outline-none placeholder:text-[color:var(--color-text-muted)] disabled:cursor-not-allowed disabled:opacity-60 focus:border-[var(--color-brand)]"
        />
        <GhostButton type="button" onClick={onAddVisitor} className="px-3" aria-label="Adicionar visitante" disabled={disabled}>
          <Plus className="h-4 w-4" />
        </GhostButton>
      </div>

      {visitors.length > 0 ? (
        <div className="mt-3 space-y-2">
          <p className="text-[length:var(--text-xs)] font-semibold uppercase tracking-[0.12em] text-[color:var(--color-text-secondary)]">Para incluir ao salvar</p>
          {visitors.map((visitor) => (
            <div key={visitor.id} className="flex items-center justify-between rounded-2xl bg-[var(--metric-card-bg)] px-3 py-2 text-[length:var(--text-sm)]">
              <span className="font-medium text-[color:var(--color-text-primary)]">{visitor.fullName}</span>
              <button
                type="button"
                onClick={() => onRemoveVisitor(visitor.id)}
                disabled={disabled}
                className="text-[length:var(--text-xs)] font-semibold text-[color:var(--color-text-secondary)] disabled:cursor-not-allowed disabled:saturate-75"
              >
                remover
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
