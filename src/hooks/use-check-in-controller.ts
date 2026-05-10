"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import {
  ATTENDANCE,
  checkInConfirmationParam,
  getInitialMemberStatus,
  summarizeCheckInItems,
  type AttendanceStatus,
  type CheckInItem,
  type CheckInMode,
  type MemberAttendanceStatus,
} from "@/features/check-in/check-in-view";
import { findDuplicateVisitorName } from "@/features/check-in/visitor-validation";
import { API_ROUTES } from "@/lib/api-routes";
import { isRecord, readJsonResponse } from "@/lib/json";
import { ROUTES } from "@/lib/routes";

export type CheckInMember = {
  personId: string;
  fullName: string;
  currentStatus?: AttendanceStatus | null;
};

export type CheckInVisitorRecord = {
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

type UseCheckInControllerOptions = {
  eventId: string;
  members: CheckInMember[];
  initialVisitors?: CheckInVisitorRecord[];
  initialVisitorCount?: number;
  mode: CheckInMode;
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

function initialCheckInItems(members: CheckInMember[]): CheckInItem[] {
  return members.map((member) => ({
    personId: member.personId,
    fullName: member.fullName,
    status: getInitialMemberStatus(member.currentStatus),
  }));
}

export function useCheckInController({
  eventId,
  members,
  initialVisitors = [],
  initialVisitorCount = 0,
  mode,
}: UseCheckInControllerOptions) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [visitorName, setVisitorName] = useState("");
  const [savedVisitors] = useState<CheckInVisitorRecord[]>(initialVisitors);
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

  return {
    allMembersPresent,
    canSave,
    errorMessage,
    isPending,
    items,
    savedVisitorCount,
    savedVisitors,
    summary,
    visitorName,
    visitors,
    addVisitor,
    markAllAsPresent,
    removeVisitor,
    save,
    setStatus,
    setVisitorName,
  };
}
