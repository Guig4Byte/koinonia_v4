export type VisitorNameInput = {
  fullName: string;
};

export type VisitorValidationResult =
  | { ok: true }
  | { ok: false; error: string };

export function normalizeVisitorName(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("pt-BR");
}

export function findDuplicateVisitorName(existingVisitors: VisitorNameInput[], newVisitors: VisitorNameInput[]) {
  const seen = new Map<string, string>();

  for (const visitor of existingVisitors) {
    const normalized = normalizeVisitorName(visitor.fullName);
    if (normalized) seen.set(normalized, visitor.fullName.trim());
  }

  for (const visitor of newVisitors) {
    const normalized = normalizeVisitorName(visitor.fullName);
    if (!normalized) continue;

    const previous = seen.get(normalized);
    if (previous) return visitor.fullName.trim() || previous;

    seen.set(normalized, visitor.fullName.trim());
  }

  return null;
}

export function validateNewVisitors(existingVisitors: VisitorNameInput[], newVisitors: VisitorNameInput[]): VisitorValidationResult {
  const duplicate = findDuplicateVisitorName(existingVisitors, newVisitors);

  if (duplicate) {
    return { ok: false, error: `${duplicate} já está registrado como visitante neste encontro.` };
  }

  return { ok: true };
}
