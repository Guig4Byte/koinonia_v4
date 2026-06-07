import { UserRole } from "@/generated/prisma/client";

export const USER_NAME_MAX_LENGTH = 120;
export const USER_EMAIL_MAX_LENGTH = 160;
export const USER_PASSWORD_MIN_LENGTH = 8;

const USER_ROLE_VALUES = new Set<string>([UserRole.ADMIN, UserRole.PASTOR, UserRole.SUPERVISOR, UserRole.LEADER]);

export const userFormErrorCodes = [
  "nome-obrigatorio",
  "nome-longo",
  "email-obrigatorio",
  "email-invalido",
  "email-longo",
  "email-em-uso",
  "senha-obrigatoria",
  "senha-curta",
  "papel-invalido",
  "pessoa-indisponivel",
  "usuario-nao-encontrado",
  "permissao",
] as const;

export type UserFormError = (typeof userFormErrorCodes)[number];

export type UserFormValues = {
  name: string;
  email: string;
  role: UserRole;
  password?: string;
  personId: string | null;
  isActive: boolean;
};

export type ParseUserFormResult =
  | { ok: true; values: UserFormValues }
  | { ok: false; error: UserFormError };

type ParseUserFormOptions = {
  requirePassword: boolean;
};

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeEmail(value: unknown) {
  return stringValue(value).toLowerCase();
}

function parseRole(value: unknown) {
  const role = stringValue(value);
  return USER_ROLE_VALUES.has(role) ? (role as UserRole) : null;
}

function parsePersonId(value: unknown) {
  const personId = stringValue(value);
  return personId.length > 0 ? personId : null;
}

function parseIsActive(value: unknown) {
  return value === "on" || value === "true" || value === true;
}

function looksLikeEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function parseUserFormFields(
  fields: {
    name?: unknown;
    email?: unknown;
    role?: unknown;
    password?: unknown;
    personId?: unknown;
    isActive?: unknown;
  },
  options: ParseUserFormOptions,
): ParseUserFormResult {
  const name = stringValue(fields.name);
  if (!name) return { ok: false, error: "nome-obrigatorio" };
  if (name.length > USER_NAME_MAX_LENGTH) return { ok: false, error: "nome-longo" };

  const email = normalizeEmail(fields.email);
  if (!email) return { ok: false, error: "email-obrigatorio" };
  if (email.length > USER_EMAIL_MAX_LENGTH) return { ok: false, error: "email-longo" };
  if (!looksLikeEmail(email)) return { ok: false, error: "email-invalido" };

  const role = parseRole(fields.role);
  if (!role) return { ok: false, error: "papel-invalido" };

  const password = typeof fields.password === "string" ? fields.password : "";
  if (options.requirePassword && !password) return { ok: false, error: "senha-obrigatoria" };
  if (password && password.length < USER_PASSWORD_MIN_LENGTH) return { ok: false, error: "senha-curta" };

  return {
    ok: true,
    values: {
      name,
      email,
      role,
      password: password || undefined,
      personId: parsePersonId(fields.personId),
      isActive: parseIsActive(fields.isActive),
    },
  };
}

export function parseUserFormData(formData: FormData, options: ParseUserFormOptions) {
  return parseUserFormFields({
    name: formData.get("name"),
    email: formData.get("email"),
    role: formData.get("role"),
    password: formData.get("password"),
    personId: formData.get("personId"),
    isActive: formData.get("isActive"),
  }, options);
}

export type UserFormFieldName = "name" | "email" | "role" | "password" | "personId";

export function userFormFieldErrors(error: string | undefined): Partial<Record<UserFormFieldName, string>> {
  if (!error) return {};

  const messages: Partial<Record<UserFormError, { field: UserFormFieldName; message: string }>> = {
    "nome-obrigatorio": { field: "name", message: "O nome é obrigatório." },
    "nome-longo": { field: "name", message: `Até ${USER_NAME_MAX_LENGTH} caracteres.` },
    "email-obrigatorio": { field: "email", message: "O login é obrigatório." },
    "email-invalido": { field: "email", message: "Use um formato de e-mail válido, mesmo que seja temporário." },
    "email-longo": { field: "email", message: `Até ${USER_EMAIL_MAX_LENGTH} caracteres.` },
    "email-em-uso": { field: "email", message: "Este login já está em uso." },
    "senha-obrigatoria": { field: "password", message: "Defina uma senha inicial." },
    "senha-curta": { field: "password", message: `Use pelo menos ${USER_PASSWORD_MIN_LENGTH} caracteres.` },
    "papel-invalido": { field: "role", message: "Escolha um papel válido." },
    "pessoa-indisponivel": { field: "personId", message: "Esta pessoa já está vinculada a outro usuário." },
  };

  const fieldError = messages[error as UserFormError];
  return fieldError ? { [fieldError.field]: fieldError.message } : {};
}

export function userFormErrorMessage(error: string | undefined) {
  const messages: Partial<Record<UserFormError, string>> = {
    "nome-obrigatorio": "Informe o nome do usuário.",
    "nome-longo": `O nome pode ter até ${USER_NAME_MAX_LENGTH} caracteres.`,
    "email-obrigatorio": "Informe o login do usuário.",
    "email-invalido": "O login precisa ter formato de e-mail.",
    "email-longo": `O login pode ter até ${USER_EMAIL_MAX_LENGTH} caracteres.`,
    "email-em-uso": "Já existe usuário com este login.",
    "senha-obrigatoria": "Defina uma senha inicial para o primeiro acesso.",
    "senha-curta": `A senha precisa ter pelo menos ${USER_PASSWORD_MIN_LENGTH} caracteres.`,
    "papel-invalido": "Escolha um papel válido para o usuário.",
    "pessoa-indisponivel": "A pessoa selecionada já está vinculada a outro usuário.",
    "usuario-nao-encontrado": "Usuário não encontrado.",
    permissao: "Usuários não estão disponíveis para alteração no seu acesso.",
  };

  if (!error) return null;
  return messages[error as UserFormError] ?? "Não foi possível salvar o usuário.";
}
