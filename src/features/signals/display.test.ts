import { describe, expect, it } from "vitest";
import { SignalSeverity, SignalSource, UserRole } from "../../generated/prisma/client";
import {
  signalBadgeForViewer,
  signalDescriptionForViewer,
  signalDetailForViewer,
  signalPastoralMessageForViewer,
  signalReasonForViewer,
} from "./display";

describe("signal display helpers", () => {
  it("keeps urgent as urgent for every viewer even when support was requested", () => {
    const signal = { severity: SignalSeverity.URGENT, assignedTo: { role: UserRole.SUPERVISOR } };

    expect(signalBadgeForViewer(signal, { role: UserRole.LEADER })).toEqual({ label: "Urgente", tone: "risk" });
    expect(signalBadgeForViewer(signal, { role: UserRole.SUPERVISOR })).toEqual({ label: "Urgente", tone: "risk" });
    expect(signalBadgeForViewer(signal, { role: UserRole.PASTOR })).toEqual({ label: "Urgente", tone: "risk" });
  });

  it("shows supervisor support as a request for supervisors and as requested support for leaders", () => {
    const signal = { severity: SignalSeverity.ATTENTION, assignedTo: { role: UserRole.SUPERVISOR } };

    expect(signalBadgeForViewer(signal, { role: UserRole.SUPERVISOR })).toEqual({ label: "Pedido de apoio", tone: "support" });
    expect(signalBadgeForViewer(signal, { role: UserRole.LEADER })).toEqual({ label: "Apoio solicitado", tone: "support" });
  });

  it("keeps urgent unassigned signals consistent", () => {
    expect(signalBadgeForViewer({ severity: SignalSeverity.URGENT }, { role: UserRole.LEADER })).toEqual({ label: "Urgente", tone: "risk" });
    expect(signalBadgeForViewer({ severity: SignalSeverity.URGENT }, { role: UserRole.SUPERVISOR })).toEqual({ label: "Urgente", tone: "risk" });
    expect(signalBadgeForViewer({ severity: SignalSeverity.URGENT }, { role: UserRole.PASTOR })).toEqual({ label: "Urgente", tone: "risk" });
  });

  it("shows informational signals as informative for pastoral viewers", () => {
    expect(signalBadgeForViewer({ severity: SignalSeverity.INFO }, { role: UserRole.PASTOR })).toEqual({ label: "Informativo", tone: "info" });
    expect(signalBadgeForViewer({ severity: SignalSeverity.INFO }, { role: UserRole.ADMIN })).toEqual({ label: "Informativo", tone: "info" });
  });

  it("keeps legacy reason normalization available for leader viewers", () => {
    expect(signalReasonForViewer("Líder pediu apoio da supervisão", { role: UserRole.LEADER })).toBe("Apoio solicitado à supervisão");
    expect(signalReasonForViewer("Líder pediu apoio da supervisão", { role: UserRole.SUPERVISOR })).toBe("Líder pediu apoio da supervisão");
  });

  it("uses contextual pastoral messages before raw technical reasons", () => {
    const supportSignal = {
      reason: "Líder pediu apoio da supervisão",
      severity: SignalSeverity.ATTENTION,
      assignedTo: { role: UserRole.SUPERVISOR },
    };
    const pastoralSignal = {
      reason: "Faltas consecutivas",
      severity: SignalSeverity.ATTENTION,
      assignedTo: { role: UserRole.PASTOR },
    };

    expect(signalDetailForViewer(supportSignal, { role: UserRole.SUPERVISOR })).toBe("Pedido de apoio da célula.");
    expect(signalDetailForViewer(supportSignal, { role: UserRole.LEADER })).toBe("Apoio solicitado à supervisão.");
    expect(signalDetailForViewer(pastoralSignal, { role: UserRole.PASTOR })).toBe("Encaminhado ao cuidado pastoral.");
    expect(signalDetailForViewer(pastoralSignal, { role: UserRole.LEADER })).toBe("Encaminhado ao pastor.");
  });

  it("describes attendance signals without ordering the user to act", () => {
    const signal = {
      reason: "3 faltas seguidas. Pode estar se afastando.",
      evidence: "Presença recente indica afastamento.",
      source: SignalSource.ATTENDANCE,
      severity: SignalSeverity.URGENT,
    };

    expect(signalPastoralMessageForViewer(signal, { role: UserRole.LEADER })).toEqual({
      title: "Ausência recorrente percebida.",
      description: "Parece que houve ausências recorrentes sem justificativa registrada.",
    });
  });

  it("keeps a separate human description for signal cards", () => {
    const signal = {
      source: SignalSource.ATTENDANCE,
      severity: SignalSeverity.ATTENTION,
    };

    expect(signalDetailForViewer(signal, { role: UserRole.LEADER })).toBe("Ausência recente percebida.");
    expect(signalDescriptionForViewer(signal, { role: UserRole.LEADER })).toBe("Parece que houve ausências sem justificativa registrada.");
  });

  it("keeps attendance evidence out of compact signal cards by default", () => {
    const signal = {
      source: SignalSource.ATTENDANCE,
      severity: SignalSeverity.URGENT,
      evidence: "Ausente nos últimos 3 encontros registrados: 16 abr, 23 abr e 30 abr.",
    };

    expect(signalDescriptionForViewer(signal, { role: UserRole.LEADER })).toBe(
      "Parece que houve ausências recorrentes sem justificativa registrada.",
    );
  });

  it("adds attendance evidence dates when explicitly requested", () => {
    const signal = {
      source: SignalSource.ATTENDANCE,
      severity: SignalSeverity.URGENT,
      evidence: "Ausente nos últimos 3 encontros registrados: 16 abr, 23 abr e 30 abr.",
    };

    expect(signalDescriptionForViewer(signal, { role: UserRole.LEADER }, { includeEvidence: true })).toBe(
      "Parece que houve ausências recorrentes sem justificativa registrada. Pode ser um bom momento para cuidar mais de perto, com calma e proximidade.\nAusente nos últimos 3 encontros registrados: 16 abr, 23 abr e 30 abr.",
    );
  });
});
