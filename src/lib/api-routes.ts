export const API_ROUTES = {
  prefix: "/api/",
  search: "/api/search",

  care: (personId: string) => `/api/care/${personId}`,
  event: (eventId: string) => `/api/events/${eventId}`,
  eventCheckIn: (eventId: string) => `/api/events/${eventId}/check-in`,
  markPersonActive: (personId: string) => `/api/people/${personId}/mark-active`,
  personPhone: (personId: string) => `/api/people/${personId}/phone`,
  signalSupport: (signalId: string) => `/api/signals/${signalId}/support`,
  searchPeople: (query: string) => `/api/search?q=${encodeURIComponent(query)}`,
} as const;
