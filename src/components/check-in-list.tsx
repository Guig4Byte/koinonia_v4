"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { CheckInMemberCard } from "@/components/check-in-member-card";
import { CheckInSaveBar } from "@/components/check-in-save-bar";
import { CheckInSummaryCard } from "@/components/check-in-summary-card";
import { CheckInVisitorsCard } from "@/components/check-in-visitors-card";
import {
  ATTENDANCE,
  checkInConfirmationParam,
  checkInHelperText,
  getInitialMemberStatus,
  summarizeCheckInItems,
  type AttendanceStatus,
  type CheckInItem,
  type CheckInMode,
  type MemberAttendanceStatus,
} from "@/features/check-in/check-in-view";
import { findDuplicateVisitorName } from "@/features/check-in/visitor-validation";
import { isRecord, readJsonResponse } from "@/lib/json";
import { API_ROUTES } from "@/lib/api-routes";
import { ROUTES } from "@/lib/routes";

type Member = {
  personId: string;
  fullName: string;
  currentStatus?: AttendanceStatus | null;
};

type VisitorRecord = {
  id: string;
  fullName: string;
};

type VisitorDraft = {
  id: string;
  fullName: string;
};

type CheckInResponse = {
  error?: string;
};

function isCheckInResponse(value: unknown): value is CheckInResponse {
  return (
    isRecord(value)
    && (value.error === undefined || typeof value.error === "string")
  );
}

function makeVisitorId() {
  return `visitor-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function initialCheckInItems(members: Member[]): CheckInItem[] {
  return members.map((member) => ({
    personId: member.personId,
    fullName: member.fullName,
    status: getInitialMemberStatus(member.currentStatus),
  }));
}

export function CheckInList({
  eventId,
  members,
  initialVisitors = [],
  initialVisitorCount = 0,
  submitLabel = "Salvar presença",
  mode = "register",
  cancelHref,
  cancelLabel = "Cancelar",
  saveBarOffset = "nav",
}: {
  eventId: string;
  members: Member[];
  initialVisitors?: VisitorRecord[];
  initialVisitorCount?: number;
  submitLabel?: string;
  mode?: CheckInMode;
  cancelHref?: string;
  cancelLabel?: string;
  saveBarOffset?: "nav" | "page";
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [visitorName, setVisitorName] = useState("");
  const [savedVisitors] = useState<VisitorRecord[]>(initialVisitors);
  const [visitors, setVisitors] = useState<VisitorDraft[]>([]);
  const [items, setItems] = useState<CheckInItem[]>(() => initialCheckInItems(members));

  const savedVisitorCount = Math.max(initialVisitorCount, savedVisitors.length);
  const visitorTotal = savedVisitorCount + visitors.length;
  const summary = useMemo(() => summarizeCheckInItems(items, visitorTotal), [items, visitorTotal]);

  const canSave = summary.pending === 0 && !isPending;
  const allMembersPresent = summary.totalMembers > 0 && summary.present === summary.totalMembers;

  function clearTransientState() {
    setErrorMessage(null);
  }

  function setStatus(personId: string, status: MemberAttendanceStatus) {
    clearTransientState();
    setItems((current) => current.map((item) => (item.personId === personId ? { ...item, status } : item)));
  }

  function markAllAsPresent() {
    const hasNonPresentStatus = items.some((item) => item.status !== ATTENDANCE.PRESENT);
    if (!hasNonPresentStatus) return;

    const hasAbsenceOrJustification = items.some(
      (item) => item.status === ATTENDANCE.ABSENT || item.status === ATTENDANCE.JUSTIFIED,
    );

    if (
      hasAbsenceOrJustification
      && !window.confirm("Isso vai trocar ausentes e justificativas para presentes. Continuar?")
    ) {
      return;
    }

    clearTransientState();
    setItems((current) => current.map((item) => ({ ...item, status: ATTENDANCE.PRESENT })));
  }

  function addVisitor() {
    const name = visitorName.trim();
    if (!name) return;

    const duplicate = findDuplicateVisitorName(savedVisitors, [...visitors, { fullName: name }]);
    if (duplicate) {
      setErrorMessage(duplicate + " já está registrado como visitante neste encontro.");
      return;
    }

    clearTransientState();
    setVisitors((current) => [...current, { id: makeVisitorId(), fullName: name }]);
    setVisitorName("");
  }

  function removeVisitor(id: string) {
    clearTransientState();
    setVisitors((current) => current.filter((visitor) => visitor.id !== id));
  }

  function save() {
    if (summary.pending > 0) {
      setErrorMessage("Ainda falta marcar algumas pessoas antes de salvar a presença.");
      return;
    }

    startTransition(async () => {
      setErrorMessage(null);

      const response = await fetch(API_ROUTES.eventCheckIn(eventId), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attendances: items.map(({ personId, status }) => ({ personId, status })),
          visitors: visitors.map((visitor) => ({ fullName: visitor.fullName })),
        }),
      });

      const payload = await readJsonResponse(response);
      const responseBody = isCheckInResponse(payload) ? payload : null;

      if (!response.ok) {
        setErrorMessage(responseBody?.error ?? "Não foi possível salvar a presença.");
        return;
      }

      router.replace(ROUTES.eventPresenceConfirmation(eventId, checkInConfirmationParam(mode)));
    });
  }

  return (
    <section className="space-y-3">
      <CheckInSummaryCard
        summary={summary}
        helperText={checkInHelperText(mode)}
        allMembersPresent={allMembersPresent}
        isPending={isPending}
        errorMessage={errorMessage}
        onMarkAllAsPresent={markAllAsPresent}
      />

      <CheckInVisitorsCard
        savedVisitors={savedVisitors}
        fallbackSavedVisitorCount={savedVisitorCount}
        visitors={visitors}
        visitorName={visitorName}
        onVisitorNameChange={setVisitorName}
        onAddVisitor={addVisitor}
        onRemoveVisitor={removeVisitor}
      />

      <div className="space-y-3">
        {items.map((item) => (
          <CheckInMemberCard key={item.personId} item={item} onSetStatus={setStatus} />
        ))}
      </div>

      <CheckInSaveBar
        summary={summary}
        mode={mode}
        cancelHref={cancelHref}
        cancelLabel={cancelLabel}
        canSave={canSave}
        isPending={isPending}
        submitLabel={submitLabel}
        saveBarOffset={saveBarOffset}
        onSave={save}
      />
    </section>
  );
}
