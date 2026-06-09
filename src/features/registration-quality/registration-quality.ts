import { ROUTES } from "@/lib/routes";

export type RegistrationQualityPerson = {
  id?: string;
  fullName: string;
  phone?: string | null;
  primaryGroup?: {
    id: string;
    name: string;
  } | null;
};

export type RegistrationQualityUser = {
  id?: string;
  name?: string;
  email: string;
  role?: string;
  personId?: string | null;
  person?: {
    id: string;
    fullName: string;
  } | null;
};

export type RegistrationQualityIssueKey =
  | "possiblyIncompleteName"
  | "missingPhone"
  | "internalLogin"
  | "unlinkedUser";

export type RegistrationQualityIssueItem = {
  id: string;
  title: string;
  detail: string;
  href: string;
  actionLabel: string;
};

export type RegistrationQualityIssue = {
  key: RegistrationQualityIssueKey;
  count: number;
  label: string;
  detail: string;
  items: RegistrationQualityIssueItem[];
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

function personLabel(count: number, singular: string, plural: string) {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function actionableRegistrationQualityIssues(
  summary: Pick<RegistrationQualitySummary, "issues">,
): RegistrationQualityIssue[] {
  return summary.issues.filter((issue) => issue.count > 0);
}

function personIssueItem(person: RegistrationQualityPerson): RegistrationQualityIssueItem {
  return {
    id: person.id ?? person.fullName,
    title: person.fullName,
    detail: person.primaryGroup?.name ?? "Sem célula ativa",
    href: person.id ? ROUTES.person(person.id) : ROUTES.team,
    actionLabel: "Abrir pessoa",
  };
}

function userIssueTitle(user: RegistrationQualityUser): string {
  return user.person?.fullName ?? user.name?.trim() ?? user.email;
}

function userIssueDetail(user: RegistrationQualityUser, fallback: string): string {
  const parts = [user.email, user.role].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : fallback;
}

function userIssueItem(user: RegistrationQualityUser, detailFallback: string): RegistrationQualityIssueItem {
  return {
    id: user.id ?? user.email,
    title: userIssueTitle(user),
    detail: userIssueDetail(user, detailFallback),
    href: user.id ? ROUTES.editUser(user.id) : ROUTES.users,
    actionLabel: "Editar usuário",
  };
}

export function buildRegistrationQualitySummary({
  people,
  users,
}: {
  people: RegistrationQualityPerson[];
  users: RegistrationQualityUser[];
}): RegistrationQualitySummary {
  const peopleWithPossiblyIncompleteNames = people.filter((person) => isPossiblyIncompleteName(person.fullName));
  const peopleWithoutPhoneItems = people.filter((person) => !person.phone?.trim());
  const usersWithInternalLoginItems = users.filter((user) => isInternalLogin(user.email));
  const usersWithoutLinkedPersonItems = users.filter((user) => !user.personId && !user.person?.id);
  const possiblyIncompleteNames = peopleWithPossiblyIncompleteNames.length;
  const peopleWithoutPhone = peopleWithoutPhoneItems.length;
  const usersWithInternalLogin = usersWithInternalLoginItems.length;
  const usersWithoutLinkedPerson = usersWithoutLinkedPersonItems.length;
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
      items: peopleWithPossiblyIncompleteNames.map(personIssueItem),
    },
    {
      key: "missingPhone",
      count: peopleWithoutPhone,
      label: personLabel(peopleWithoutPhone, "pessoa sem telefone", "pessoas sem telefone"),
      detail: "Telefone ajuda o cuidado pastoral a acontecer com menos atrito.",
      items: peopleWithoutPhoneItems.map(personIssueItem),
    },
    {
      key: "internalLogin",
      count: usersWithInternalLogin,
      label: personLabel(usersWithInternalLogin, "usuário com login interno", "usuários com login interno"),
      detail: "Logins internos podem ser trocados por e-mails reais quando forem coletados.",
      items: usersWithInternalLoginItems.map((user) => userIssueItem(user, "Login interno")),
    },
    {
      key: "unlinkedUser",
      count: usersWithoutLinkedPerson,
      label: personLabel(usersWithoutLinkedPerson, "usuário sem pessoa vinculada", "usuários sem pessoa vinculada"),
      detail: "O vínculo conecta acesso, ficha pastoral e telefone da pessoa.",
      items: usersWithoutLinkedPersonItems.map((user) => userIssueItem(user, "Sem pessoa vinculada")),
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
