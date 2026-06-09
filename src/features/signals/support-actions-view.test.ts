import { describe, expect, it } from "vitest";
import {
  signalSupportActionCopyForStage,
  signalSupportGuidance,
  signalSupportRequestPayload,
  shouldShowSignalSupportActions,
} from "./support-actions-view";

describe("support-actions-view", () => {
  it("descreve pedido de apoio à supervisão", () => {
    expect(signalSupportActionCopyForStage("request-supervisor", { canRequestSupervisor: true })).toMatchObject({
      action: "REQUEST_SUPERVISOR",
      title: "Pedir apoio à supervisão?",
      label: "Pedir apoio",
    });
  });

  it("descreve encaminhamento ao pastor com contexto de apoio disponível", () => {
    const copy = signalSupportActionCopyForStage("escalate-pastor", { canRequestSupervisor: true });

    expect(copy.action).toBe("ESCALATE_PASTOR");
    expect(copy.detail).toContain("A supervisão também está disponível como apoio");
  });

  it("mostra orientação conforme ações disponíveis", () => {
    expect(signalSupportGuidance(true, true)).toContain("O pastor pode ser envolvido");
    expect(signalSupportGuidance(true, false)).toContain("apoio à supervisão");
    expect(signalSupportGuidance(false, true)).toContain("encaminhamento ao pastor");
    expect(signalSupportGuidance(false, false)).toBeNull();
  });

  it("mostra o bloco quando há mensagem ou ação disponível", () => {
    expect(shouldShowSignalSupportActions({ assignmentMessage: "Apoio solicitado", canRequestSupervisor: false, canEscalatePastor: false })).toBe(true);
    expect(shouldShowSignalSupportActions({ canRequestSupervisor: true, canEscalatePastor: false })).toBe(true);
    expect(shouldShowSignalSupportActions({ canRequestSupervisor: false, canEscalatePastor: true })).toBe(true);
    expect(shouldShowSignalSupportActions({ canRequestSupervisor: false, canEscalatePastor: false })).toBe(false);
  });

  it("remove nota vazia do payload", () => {
    expect(signalSupportRequestPayload("REQUEST_SUPERVISOR", "  ")).toEqual({ action: "REQUEST_SUPERVISOR", note: undefined });
    expect(signalSupportRequestPayload("ESCALATE_PASTOR", "  contexto breve  ")).toEqual({ action: "ESCALATE_PASTOR", note: "contexto breve" });
  });
});
