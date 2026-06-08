import { ROUTES } from "@/lib/routes";

export type RegistrationQualityPerson = {
  fullName: string;
  phone?: string | null;
};

export type RegistrationQualityUser = {
  email: string;
  personId?: string | null;
};

export type RegistrationQualityIssueKey =
  | "possiblyIncompleteName"
  | "missingPhone"
  | "internalLogin"
  | "unlinkedUser";

export type RegistrationQualityIssue = {
  key: RegistrationQualityIssueKey;
  count: number;
  label: string;
  detail: string;
  href: string;
  actionLabel: string;
};

export type RegistrationQualitySummary = {
  title: string;
  detail: string;
  hasIssues: boolean;
  totalIssues: number;
  issues: RegistrationQualityIssue[];
};

const INTERNAL_LOGIN_DOMAIN = "@koinonia.local";

export function isInternalLogin(email: string): boolean {
  return email.trim().toLowerCase().endsWith(INTERNAL_LOGIN_DOMAIN);
}

export function isPossiblyIncompleteName(fullName: string): boolean {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  return parts.length < 2;
}

function missingPhoneCount(people: RegistrationQualityPerson[]) {
  return people.filter((person) => !person.phone?.trim()).length;
}

function possiblyIncompleteNameCount(people: RegistrationQualityPerson[]) {
  return people.filter((person) => isPossiblyIncompleteName(person.fullName)).length;
}

function internalLoginCount(users: RegistrationQualityUser[]) {
  return users.filter((user) => isInternalLogin(user.email)).length;
}

function unlinkedUserCount(users: RegistrationQualityUser[]) {
  return users.filter((user) => !user.personId).length;
}

function personLabel(count: number, singular: string, plural: string) {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function actionableRegistrationQualityIssues(
  summary: Pick<RegistrationQualitySummary, "issues">,
): RegistrationQualityIssue[] {
  return summary.issues.filter((issue) => issue.count > 0);
}

export function buildRegistrationQualitySummary({
  people,
  users,
}: {
  people: RegistrationQualityPerson[];
  users: RegistrationQualityUser[];
}): RegistrationQualitySummary {
  const possiblyIncompleteNames = possiblyIncompleteNameCount(people);
  const peopleWithoutPhone = missingPhoneCount(people);
  const usersWithInternalLogin = internalLoginCount(users);
  const usersWithoutLinkedPerson = unlinkedUserCount(users);
  const issues: RegistrationQualityIssue[] = [
    {
      key: "possiblyIncompleteName",
      count: possiblyIncompleteNames,
      label: personLabel(
        possiblyIncompleteNames,
        "cadastro com nome possivelmente incompleto",
        "cadastros com nome possivelmente incompleto",
      ),
      detail: "Nomes com apenas uma palavra podem ser revisados depois.",
      href: ROUTES.team,
      actionLabel: "Ver equipe",
    },
    {
      key: "missingPhone",
      count: peopleWithoutPhone,
      label: personLabel(peopleWithoutPhone, "pessoa sem telefone", "pessoas sem telefone"),
      detail: "Telefone ajuda o cuidado pastoral a acontecer com menos atrito.",
      href: ROUTES.team,
      actionLabel: "Ver equipe",
    },
    {
      key: "internalLogin",
      count: usersWithInternalLogin,
      label: personLabel(usersWithInternalLogin, "usuário com login interno", "usuários com login interno"),
      detail: "Logins internos podem ser trocados por e-mails reais quando forem coletados.",
      href: ROUTES.users,
      actionLabel: "Ver usuários",
    },
    {
      key: "unlinkedUser",
      count: usersWithoutLinkedPerson,
      label: personLabel(usersWithoutLinkedPerson, "usuário sem pessoa vinculada", "usuários sem pessoa vinculada"),
      detail: "O vínculo conecta acesso, ficha pastoral e telefone da pessoa.",
      href: ROUTES.users,
      actionLabel: "Ver usuários",
    },
  ];
  const totalIssues = issues.reduce((sum, issue) => sum + issue.count, 0);

  return {
    title: "Dados a completar",
    detail: totalIssues > 0
      ? "Qualidade cadastral da base inicial, sem impacto em sinais pastorais."
      : "Base cadastral sem pendências aparentes neste momento.",
    hasIssues: totalIssues > 0,
    totalIssues,
    issues,
  };
}
