export type PersonDetailInitialAction = "telefone" | "nome" | "aniversario" | null;

type PersonDetailActionParam = string | string[] | undefined;

function firstSearchParam(value: PersonDetailActionParam) {
  return Array.isArray(value) ? value[0] : value;
}

export function resolvePersonDetailInitialAction(value: PersonDetailActionParam): PersonDetailInitialAction {
  const requestedAction = firstSearchParam(value);

  if (requestedAction === "telefone") return "telefone";
  if (requestedAction === "nome") return "nome";
  if (requestedAction === "aniversario") return "aniversario";

  return null;
}
