import { describe, expect, it } from "vitest";
import { careContactInfo, careNoteId, careSavedMessage, digitsOnly } from "./care-actions-view";

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
    expect(careContactInfo("12345")).toEqual({
      digits: "12345",
      hasPhone: false,
      links: {},
    });
  });

  it("mantém textos e ids do fluxo de cuidado explícitos", () => {
    expect(careNoteId("person-1")).toBe("note-person-1");
    expect(careNoteId()).toBe("note-person");
    expect(careSavedMessage(false)).toBe("Contato feito.");
    expect(careSavedMessage(true)).toBe("Contato feito com anotação.");
  });
});
