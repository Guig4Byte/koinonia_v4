import { isRecord } from "@/lib/json";

export const SIGNAL_SUPPORT_ACTIONS = ["REQUEST_SUPERVISOR", "ESCALATE_PASTOR"] as const;
export type SignalSupportAction = (typeof SIGNAL_SUPPORT_ACTIONS)[number];

export const SIGNAL_SUPPORT_NOTE_MAX_LENGTH = 500;

export type ParsedSignalSupportPayload = {
  action: SignalSupportAction;
  note?: string;
};

const signalSupportActionValues = new Set<string>(SIGNAL_SUPPORT_ACTIONS);

export function isSignalSupportAction(value: unknown): value is SignalSupportAction {
  return typeof value === "string" && signalSupportActionValues.has(value);
}

export function normalizeSignalSupportNote(value: unknown): string | undefined | null {
  if (value === undefined) return undefined;
  if (typeof value !== "string") return null;

  const note = value.trim();
  if (note.length > SIGNAL_SUPPORT_NOTE_MAX_LENGTH) return null;

  return note.length > 0 ? note : undefined;
}

export function parseSignalSupportPayload(input: unknown): ParsedSignalSupportPayload | null {
  if (!isRecord(input) || !isSignalSupportAction(input.action)) return null;

  const note = normalizeSignalSupportNote(input.note);
  if (note === null) return null;

  return { action: input.action, note };
}

export function signalSupportRequestPayload(action: SignalSupportAction, note: string): ParsedSignalSupportPayload {
  const normalizedNote = normalizeSignalSupportNote(note);

  return {
    action,
    note: normalizedNote ?? undefined,
  };
}
