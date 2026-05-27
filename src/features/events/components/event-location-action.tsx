"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { InputField } from "@/components/ui/field";
import { EVENT_LOCATION_MAX_LENGTH } from "@/features/events/event-fields";
import styles from "./event-location-action.module.css";

export function EventLocationAction({
  value,
  defaultLocationName,
  actionLabel,
  disabled,
  helperText,
  onChange,
  onSave,
}: {
  value: string;
  defaultLocationName?: string | null;
  actionLabel: string;
  disabled: boolean;
  helperText?: string;
  onChange: (value: string) => void;
  onSave: (value?: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [draftLocationName, setDraftLocationName] = useState(value);
  const currentLocationName = value.trim() || defaultLocationName?.trim() || "Local não definido";

  function openEditor() {
    setDraftLocationName(value.trim() || defaultLocationName?.trim() || "");
    setIsOpen(true);
  }

  function closeEditor() {
    if (disabled) return;
    setIsOpen(false);
  }

  function saveDraft() {
    const nextLocationName = draftLocationName.trim();

    if (!nextLocationName) {
      onSave(nextLocationName);
      return;
    }

    onChange(nextLocationName);
    onSave(nextLocationName);
    setIsOpen(false);
  }

  return (
    <>
      <div className={styles.summary}>
        <div className={styles.locationCopy}>
          <p className={styles.eyebrow}>Local desta semana</p>
          <p className={styles.locationName}>{currentLocationName}</p>
        </div>

        <Button
          type="button"
          variant="quiet"
          size="sm"
          shape="pill"
          density="compact"
          className={styles.editButton}
          onClick={openEditor}
          disabled={disabled}
        >
          Alterar local
        </Button>
      </div>

      {helperText ? <p className={styles.helperText}>{helperText}</p> : null}

      {isOpen ? (
        <BottomSheet
          onDismiss={closeEditor}
          dismissLabel="Fechar ajuste de local"
          tone="accent"
          size="md"
          panelClassName={styles.sheetPanel}
          panelProps={{ role: "dialog", "aria-modal": true, "aria-labelledby": "event-location-sheet-title" }}
        >
          <div className={styles.sheet}>
            <div className={styles.sheetHeader}>
              <span className={styles.sheetIcon} aria-hidden="true">
                <MapPin className={styles.sheetIconSvg} />
              </span>
              <div>
                <h2 id="event-location-sheet-title" className={styles.sheetTitle}>Alterar local deste encontro</h2>
                <p className={styles.sheetDescription}>Você pode ajustar apenas o local deste encontro.</p>
              </div>
            </div>

            <div className={styles.currentLocation}>
              <p className={styles.currentLocationLabel}>Local atual</p>
              <p className={styles.currentLocationName}>{currentLocationName}</p>
            </div>

            <InputField
              id="event-location-name"
              label="Novo local"
              value={draftLocationName}
              onChange={(event) => setDraftLocationName(event.target.value)}
              placeholder={defaultLocationName ? `Padrão: ${defaultLocationName}` : "Ex.: Casa da família Souza"}
              maxLength={EVENT_LOCATION_MAX_LENGTH}
              required
              size="md"
              surface="muted"
            />

            <p className={styles.sheetHint}>
              A presença e o horário permanecem como estão; somente o local será atualizado.
            </p>

            <div className={styles.sheetActions}>
              <Button type="button" variant="secondary" size="md" shape="pill" onClick={closeEditor} disabled={disabled}>
                Cancelar
              </Button>
              <Button type="button" variant="primary" size="md" shape="pill" onClick={saveDraft} disabled={disabled}>
                {actionLabel}
              </Button>
            </div>
          </div>
        </BottomSheet>
      ) : null}
    </>
  );
}
