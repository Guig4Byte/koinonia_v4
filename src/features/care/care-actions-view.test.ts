import { describe, expect, it } from "vitest";
import {
  CARE_PHONE_MIN_DIGITS,
  careContactInfo,
  careKindForContactMethod,
  careNoteId,
  careSavedMessage,
  careWhatsappMessage,
  digitsOnly,
  whatsappDigitsForPhone,
} from "./care-actions-view";
import { careConfirmContactCopy } from "./care-copy";

// Mantém as decisões de UX do fluxo de cuidado em funções puras para evitar regressões.
describe("care-actions-view", () => {
  it("normaliza telefone para links de contato", () => {
    expect(digitsOnly("+55 (11) 91234-5678")).toBe("5511912345678");
    expect(careContactInfo("(11) 91234-5678", { personName: "Maria Silva" })).toEqual({
      digits: "11912345678",
      displayPhone: "(11) 91234-5678",
      hasPhone: true,
      links: {
        tel: "tel:+11912345678",
        whatsapp: "https://wa.me/5511912345678?text=Ol%C3%A1%2C%20Maria!%20Gra%C3%A7a%20e%20paz.%20Como%20voc%C3%AA%20est%C3%A1%3F",
      },
    });
  });

  it("usa DDI brasileiro no WhatsApp sem duplicar número internacional", () => {
    expect(whatsappDigitsForPhone("21 98442-9982")).toBe("5521984429982");
    expect(whatsappDigitsForPhone("+55 21 98442-9982")).toBe("5521984429982");
    expect(whatsappDigitsForPhone("+1 415 555 1212")).toBe("14155551212");
  });

  it("não gera links quando o telefone é insuficiente", () => {
    expect(CARE_PHONE_MIN_DIGITS).toBe(10);
    expect(careContactInfo("12345")).toEqual({
      digits: "12345",
      displayPhone: "12345",
      hasPhone: false,
      links: {},
    });
  });

  it("monta mensagem pastoral para WhatsApp", () => {
    expect(careWhatsappMessage("Maria Silva")).toBe("Olá, Maria! Graça e paz. Como você está?");
    expect(careWhatsappMessage()).toBe("Olá! Graça e paz. Como você está?");
  });

  it("preserva o canal usado ao guardar o cuidado", () => {
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
