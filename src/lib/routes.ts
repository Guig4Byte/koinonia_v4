type RouteQueryValue = string | number | boolean | null | undefined;

export function routeWithQuery(
  pathname: string,
  query: Record<string, RouteQueryValue>,
): string {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value === null || value === undefined || value === "") continue;
    params.set(key, String(value));
  }

  const search = params.toString();
  return search ? `${pathname}?${search}` : pathname;
}

export const ROUTES = {
  root: "/",
  login: "/login",
  logout: "/logout",

  pastor: "/pastor",
  supervisor: "/supervisor",
  leader: "/lider",

  team: "/equipe",
  cells: "/celulas",
  newCell: "/celulas/nova",

  events: "/eventos",

  group: (groupId: string) => `/celulas/${groupId}`,
  editGroup: (groupId: string) => `/celulas/${groupId}/editar`,
  person: (personId: string) => `/pessoas/${personId}`,
  event: (eventId: string) => `/eventos/${eventId}`,

  eventCheckInAdjustment: (eventId: string) => routeWithQuery(`/eventos/${eventId}`, { modo: "ajuste" }),
  eventPresenceConfirmation: (eventId: string, confirmation: string) => routeWithQuery(`/eventos/${eventId}`, { presenca: confirmation }),
  eventsConsultation: (consulta: string, periodo: string) => routeWithQuery("/eventos", { consulta, periodo }),
  teamFilter: (filter: string) => routeWithQuery("/equipe", { filtro: filter }),
  loginError: (nextPath?: string | null) => routeWithQuery("/login", { erro: "credenciais", next: nextPath }),
} as const;

export function isAuthRoute(pathname: string): boolean {
  return pathname.startsWith(ROUTES.login) || pathname.startsWith(ROUTES.logout);
}
