import { describe, expect, it } from "vitest";
import { parsePasswordChangeFields } from "./password-form";

describe("parsePasswordChangeFields", () => {
  it("accepts a valid password change payload", () => {
    expect(parsePasswordChangeFields({
      currentPassword: "senha-antiga",
      newPassword: "nova-senha-segura",
      newPasswordConfirmation: "nova-senha-segura",
    })).toEqual({
      ok: true,
      values: {
        currentPassword: "senha-antiga",
        newPassword: "nova-senha-segura",
      },
    });
  });

  it("requires the current password", () => {
    expect(parsePasswordChangeFields({
      currentPassword: "",
      newPassword: "nova-senha-segura",
      newPasswordConfirmation: "nova-senha-segura",
    })).toEqual({ ok: false, error: "senha-atual-obrigatoria" });
  });

  it("requires the new password", () => {
    expect(parsePasswordChangeFields({
      currentPassword: "senha-antiga",
      newPassword: "",
      newPasswordConfirmation: "",
    })).toEqual({ ok: false, error: "senha-nova-obrigatoria" });
  });

  it("rejects short passwords", () => {
    expect(parsePasswordChangeFields({
      currentPassword: "senha-antiga",
      newPassword: "curta",
      newPasswordConfirmation: "curta",
    })).toEqual({ ok: false, error: "senha-curta" });
  });

  it("requires password confirmation to match", () => {
    expect(parsePasswordChangeFields({
      currentPassword: "senha-antiga",
      newPassword: "nova-senha-segura",
      newPasswordConfirmation: "outra-senha-segura",
    })).toEqual({ ok: false, error: "senha-confirmacao" });
  });
});
