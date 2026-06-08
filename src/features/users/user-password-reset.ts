import {
  passwordPolicyErrorMessage,
  passwordValue,
  validateConfirmedNewPassword,
} from "@/lib/auth/password-policy";

export type UserPasswordResetError =
  | "senha-obrigatoria"
  | "senha-curta"
  | "senha-confirmacao"
  | "senha-propria"
  | "usuario-nao-encontrado"
  | "permissao";

export type UserPasswordResetValues = {
  password: string;
};

export type UserPasswordResetFieldName = "password" | "passwordConfirmation";

export type ParseUserPasswordResetResult =
  | { ok: true; values: UserPasswordResetValues }
  | { ok: false; error: UserPasswordResetError };

export function parseUserPasswordResetFields(fields: {
  password?: unknown;
  passwordConfirmation?: unknown;
}): ParseUserPasswordResetResult {
  const password = passwordValue(fields.password);
  const passwordConfirmation = passwordValue(fields.passwordConfirmation);
  const error = validateConfirmedNewPassword(password, passwordConfirmation);

  if (error) return { ok: false, error };

  return { ok: true, values: { password } };
}

export function parseUserPasswordResetFormData(formData: FormData) {
  return parseUserPasswordResetFields({
    password: formData.get("password"),
    passwordConfirmation: formData.get("passwordConfirmation"),
  });
}

export function userPasswordResetFieldErrors(error: string | undefined): Partial<Record<UserPasswordResetFieldName, string>> {
  if (error === "senha-confirmacao") {
    return { passwordConfirmation: "A confirmação precisa repetir a nova senha." };
  }

  const passwordError = passwordPolicyErrorMessage(error);
  if (passwordError) return { password: passwordError };

  return {};
}

export function userPasswordResetErrorMessage(error: string | undefined) {
  const passwordError = passwordPolicyErrorMessage(error);
  if (passwordError) return passwordError;

  const messages: Partial<Record<UserPasswordResetError, string>> = {
    "senha-confirmacao": "A confirmação precisa repetir a nova senha.",
    "senha-propria": "Use Minha conta para trocar a sua própria senha.",
    "usuario-nao-encontrado": "Usuário não encontrado.",
    permissao: "Você não tem permissão para redefinir senhas.",
  };

  if (!error) return null;
  return messages[error as UserPasswordResetError] ?? "Não foi possível redefinir a senha.";
}
