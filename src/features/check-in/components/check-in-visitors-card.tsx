"use client";

import type { ReactNode } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
    <Card tone="metric" padding="row" radius="sm" elevation="none" className="flex items-center justify-between" textStyle="bodyPrimary">
      <span className="font-medium">{name}</span>
      {trailing}
    </Card>
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
    <Card>
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
        <Card tone="metric" padding="row" radius="sm" elevation="none" textStyle="bodyMuted" className="mt-3">
          {countLabel(fallbackSavedVisitorCount, "visitante já salvo", "visitantes já salvos")}.
        </Card>
      ) : (
        <p className="mt-2 text-[length:var(--text-sm)] text-[color:var(--color-text-secondary)]">Nenhum visitante marcado neste encontro.</p>
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
        <Button type="button" variant="secondary" size="sm" shape="rounded" onClick={onAddVisitor} aria-label="Adicionar visitante" disabled={disabled}>
          <Plus className="h-4 w-4" />
        </Button>
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
    </Card>
  );
}
