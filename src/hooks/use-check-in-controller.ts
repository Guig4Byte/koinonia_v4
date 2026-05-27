"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
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
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [visitorName, setVisitorName] = useState("");
  const initialItems = useMemo(() => initialCheckInItems(members), [members]);
  const [savedVisitors] = useState<CheckInVisitorRecord[]>(initialVisitors);
  const [visitors, setVisitors] = useState<VisitorDraft[]>([]);
  const [items, setItems] = useState<CheckInItem[]>(() => initialItems);

  const savedVisitorCount = Math.max(initialVisitorCount, savedVisitors.length);
  const visitorTotal = savedVisitorCount + visitors.length;
  const summary = useMemo(() => summarizeCheckInItems(items, visitorTotal), [items, visitorTotal]);

  const hasMemberChanges = useMemo(
    () => items.some((item, index) => item.status !== initialItems[index]?.status),
    [initialItems, items],
  );
  const hasUnsavedChanges = hasMemberChanges || visitors.length > 0;
  const canSave = summary.pending === 0 && !isSaving && (mode === "register" || hasUnsavedChanges);

  function clearTransientState() {
    setErrorMessage(null);
  }

  function setStatus(personId: string, status: MemberAttendanceStatus) {
    if (isSaving) return;

    clearTransientState();
    setItems((current) => current.map((item) => (item.personId === personId ? { ...item, status } : item)));
  }

  function markAllPresent() {
    if (isSaving) return;

    clearTransientState();
    setItems((current) => current.map((item) => (item.status === ATTENDANCE.PRESENT ? item : { ...item, status: ATTENDANCE.PRESENT })));
  }

  function addVisitor() {
    if (isSaving) return;

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
    if (isSaving) return;

    clearTransientState();
    setVisitors((current) => current.filter((visitor) => visitor.id !== id));
  }

  async function save() {
    if (isSaving) return;

    if (!canSave) {
      if (summary.pending > 0) {
        setErrorMessage("Ainda há irmãos sem marcação antes de salvar a presença.");
      } else if (mode === "adjust" && !hasUnsavedChanges) {
        setErrorMessage("Ainda não há alteração para salvar.");
      }
      return;
    }

    setErrorMessage(null);
    setIsSaving(true);

    try {
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
        setErrorMessage(responseBody?.error ?? "Não foi possível salvar a presença agora. Vale tentar novamente em instantes.");
        setIsSaving(false);
        return;
      }

      router.replace(ROUTES.eventPresenceConfirmation(eventId, checkInConfirmationParam(mode)));
    } catch {
      setErrorMessage("Não foi possível salvar agora. Verifique sua conexão e tente novamente.");
      setIsSaving(false);
    }
  }

  return {
    canSave,
    errorMessage,
    hasUnsavedChanges,
    isPending: isSaving,
    items,
    savedVisitorCount,
    savedVisitors,
    summary,
    visitorName,
    visitors,
    addVisitor,
    removeVisitor,
    markAllPresent,
    save,
    setStatus,
    setVisitorName,
  };
}
