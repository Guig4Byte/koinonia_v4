import { describe, expect, it } from "vitest";
import {
  isSignalSupportAction,
  normalizeSignalSupportNote,
  parseSignalSupportPayload,
  SIGNAL_SUPPORT_NOTE_MAX_LENGTH,
  signalSupportRequestPayload,
} from "./support-payload";

describe("support-payload", () => {
  it("reconhece apenas ações oficiais de apoio e encaminhamento", () => {
    expect(isSignalSupportAction("REQUEST_SUPERVISOR")).toBe(true);
    expect(isSignalSupportAction("ESCALATE_PASTOR")).toBe(true);
    expect(isSignalSupportAction("OTHER")).toBe(false);
    expect(isSignalSupportAction(null)).toBe(false);
  });

  it("normaliza anotação opcional", () => {
    expect(normalizeSignalSupportNote(undefined)).toBeUndefined();
    expect(normalizeSignalSupportNote("   ")).toBeUndefined();
    expect(normalizeSignalSupportNote("  contexto breve  ")).toBe("contexto breve");
  });

  it("rejeita anotação inválida ou longa demais", () => {
    expect(normalizeSignalSupportNote(123)).toBeNull();
    expect(normalizeSignalSupportNote("a".repeat(SIGNAL_SUPPORT_NOTE_MAX_LENGTH + 1))).toBeNull();
  });

  it("parseia payload válido", () => {
    expect(parseSignalSupportPayload({ action: "REQUEST_SUPERVISOR", note: "  ajuda  " })).toEqual({
      action: "REQUEST_SUPERVISOR",
      note: "ajuda",
    });

    expect(parseSignalSupportPayload({ action: "ESCALATE_PASTOR", note: "  " })).toEqual({
      action: "ESCALATE_PASTOR",
      note: undefined,
    });
  });

  it("rejeita payload inválido", () => {
    expect(parseSignalSupportPayload(null)).toBeNull();
    expect(parseSignalSupportPayload({ action: "OTHER" })).toBeNull();
    expect(parseSignalSupportPayload({ action: "REQUEST_SUPERVISOR", note: 123 })).toBeNull();
  });

  it("monta payload de request sem nota vazia", () => {
    expect(signalSupportRequestPayload("REQUEST_SUPERVISOR", "  ")).toEqual({ action: "REQUEST_SUPERVISOR", note: undefined });
    expect(signalSupportRequestPayload("ESCALATE_PASTOR", "  contexto breve  ")).toEqual({ action: "ESCALATE_PASTOR", note: "contexto breve" });
  });
});
