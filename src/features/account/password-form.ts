import {
  passwordPolicyErrorMessage,
  passwordValue,
  validateConfirmedNewPassword,
} from "@/lib/auth/password-policy";

export type PasswordChangeError =
  | "senha-atual-obrigatoria"
  | "senha-nova-obrigatoria"
  | "senha-curta"
  | "senha-confirmacao"
  | "senha-atual-invalida"
  | "senha-igual-atual"
  | "usuario-nao-encontrado";

export type PasswordChangeValues = {
  currentPassword: string;
  newPassword: string;
};

export type PasswordChangeFieldName = "currentPassword" | "newPassword" | "newPasswordConfirmation";

export type ParsePasswordChangeResult =
  | { ok: true; values: PasswordChangeValues }
  | { ok: false; error: PasswordChangeError };

export function parsePasswordChangeFields(fields: {
  currentPassword?: unknown;
  newPassword?: unknown;
  newPasswordConfirmation?: unknown;
}): ParsePasswordChangeResult {
  const currentPassword = passwordValue(fields.currentPassword);
  const newPassword = passwordValue(fields.newPassword);
  const newPasswordConfirmation = passwordValue(fields.newPasswordConfirmation);

  if (!currentPassword) return { ok: false, error: "senha-atual-obrigatoria" };

  const newPasswordError = validateConfirmedNewPassword(newPassword, newPasswordConfirmation);
  if (newPasswordError === "senha-obrigatoria") return { ok: false, error: "senha-nova-obrigatoria" };
  if (newPasswordError) return { ok: false, error: newPasswordError };

  return { ok: true, values: { currentPassword, newPassword } };
}

export function parsePasswordChangeFormData(formData: FormData) {
  return parsePasswordChangeFields({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    newPasswordConfirmation: formData.get("newPasswordConfirmation"),
  });
}

export function passwordChangeFieldErrors(error: string | undefined): Partial<Record<PasswordChangeFieldName, string>> {
  if (error === "senha-atual-obrigatoria") return { currentPassword: "Informe sua senha atual." };
  if (error === "senha-atual-invalida") return { currentPassword: "Senha atual incorreta." };
  if (error === "senha-nova-obrigatoria") return { newPassword: "Informe a nova senha." };
  if (error === "senha-igual-atual") return { newPassword: "Escolha uma senha diferente da atual." };
  if (error === "senha-confirmacao") return { newPasswordConfirmation: "A confirmação precisa repetir a nova senha." };

  const passwordError = passwordPolicyErrorMessage(error);
  if (passwordError) return { newPassword: passwordError };

  return {};
}

export function passwordChangeErrorMessage(error: string | undefined) {
  const messages: Partial<Record<PasswordChangeError, string>> = {
    "senha-atual-obrigatoria": "Informe sua senha atual.",
    "senha-nova-obrigatoria": "Informe a nova senha.",
    "senha-curta": passwordPolicyErrorMessage("senha-curta") ?? "A nova senha está curta.",
    "senha-confirmacao": "A confirmação precisa repetir a nova senha.",
    "senha-atual-invalida": "A senha atual não confere.",
    "senha-igual-atual": "Escolha uma senha diferente da atual.",
    "usuario-nao-encontrado": "Não foi possível localizar seu usuário.",
  };

  if (!error) return null;
  return messages[error as PasswordChangeError] ?? "Não foi possível trocar a senha.";
}
