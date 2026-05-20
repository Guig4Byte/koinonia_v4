import { describe, expect, it } from "vitest";
import { CARE_PHONE_MIN_DIGITS, careContactInfo, careKindForContactMethod, careNoteId, careSavedMessage, digitsOnly } from "./care-actions-view";
import { careConfirmContactCopy } from "./care-copy";

// Mantém as decisões de UX do fluxo de cuidado em funções puras para evitar regressões.
describe("care-actions-view", () => {
  it("normaliza telefone para links de contato", () => {
    expect(digitsOnly("+55 (11) 91234-5678")).toBe("5511912345678");
    expect(careContactInfo("(11) 91234-5678")).toEqual({
      digits: "11912345678",
      hasPhone: true,
      links: {
        tel: "tel:+11912345678",
        whatsapp: "https://wa.me/11912345678",
      },
    });
  });

  it("não gera links quando o telefone é insuficiente", () => {
    expect(CARE_PHONE_MIN_DIGITS).toBe(10);
    expect(careContactInfo("12345")).toEqual({
      digits: "12345",
      hasPhone: false,
      links: {},
    });
  });

  it("preserva o canal usado no registro do cuidado", () => {
    expect(careKindForContactMethod("call")).toBe("CALL");
    expect(careKindForContactMethod("whatsapp")).toBe("WHATSAPP");
    expect(careKindForContactMethod("existing")).toBe("MARKED_CARED");
    expect(careKindForContactMethod()).toBe("MARKED_CARED");
  });

  it("personaliza a confirmação pelo canal de contato", () => {
    expect(careConfirmContactCopy("call").title).toBe("Conseguiu falar por ligação?");
    expect(careConfirmContactCopy("call").confirmLabel).toBe("Sim, falei por ligação");
    expect(careConfirmContactCopy("whatsapp").title).toBe("Conseguiu conversar pelo WhatsApp?");
    expect(careConfirmContactCopy("whatsapp").confirmLabel).toBe("Sim, conversei");
    expect(careConfirmContactCopy().title).toBe("O contato aconteceu?");
  });

  it("mantém textos e ids do fluxo de cuidado explícitos", () => {
    expect(careNoteId("person-1")).toBe("note-person-1");
    expect(careNoteId()).toBe("note-person");
    expect(careSavedMessage(false)).toBe("Cuidado registrado.");
    expect(careSavedMessage(true)).toBe("Cuidado registrado com anotação.");
    expect(careSavedMessage(false, "call")).toBe("Ligação registrada.");
    expect(careSavedMessage(true, "whatsapp")).toBe("WhatsApp registrado com anotação.");
  });
});
