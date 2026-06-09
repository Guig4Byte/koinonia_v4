export const PASSWORD_MIN_LENGTH = 8;

export type NewPasswordValidationError =
  | "senha-obrigatoria"
  | "senha-curta"
  | "senha-confirmacao";

export function passwordValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

export function validatePasswordPolicy(password: string): Exclude<NewPasswordValidationError, "senha-confirmacao"> | null {
  if (!password) return "senha-obrigatoria";
  if (password.length < PASSWORD_MIN_LENGTH) return "senha-curta";
  return null;
}

export function validateConfirmedNewPassword(
  password: string,
  confirmation: string,
): NewPasswordValidationError | null {
  const policyError = validatePasswordPolicy(password);
  if (policyError) return policyError;
  if (password !== confirmation) return "senha-confirmacao";
  return null;
}

export function passwordPolicyErrorMessage(error: string | undefined) {
  const messages: Partial<Record<NewPasswordValidationError, string>> = {
    "senha-obrigatoria": "Informe a nova senha.",
    "senha-curta": `Use pelo menos ${PASSWORD_MIN_LENGTH} caracteres.`,
    "senha-confirmacao": "A confirmação precisa repetir a nova senha.",
  };

  if (!error) return null;
  return messages[error as NewPasswordValidationError] ?? null;
}
