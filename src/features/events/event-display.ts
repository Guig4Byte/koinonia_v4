export function eventEffectiveLocation(event: {
  locationName?: string | null;
  group?: { locationName?: string | null } | null;
}) {
  return event.locationName ?? event.group?.locationName ?? null;
}

export function isClosedWithoutPresenceStatus(status: string) {
  return status === "CANCELLED" || status === "NO_MEETING";
}

export function closedWithoutPresenceLabel(status: string, fallback = "Sobre o encontro") {
  if (status === "CANCELLED") return "Cancelado";
  if (status === "NO_MEETING") return "Não houve encontro";
  return fallback;
}
