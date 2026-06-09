export type SelectableSignal = {
  personId: string;
};

export function selectBestSignalByPerson<T extends SelectableSignal>(
  signals: T[],
  compare: (a: T, b: T) => number,
): T[] {
  const selectedByPerson = new Map<string, T>();

  for (const signal of signals) {
    const current = selectedByPerson.get(signal.personId);

    if (!current || compare(signal, current) < 0) {
      selectedByPerson.set(signal.personId, signal);
    }
  }

  return Array.from(selectedByPerson.values());
}
