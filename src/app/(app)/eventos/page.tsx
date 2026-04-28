import { AppShell } from "@/components/app-shell";
import { SearchBox } from "@/components/search-box";
import { Badge } from "@/components/ui/badge";
import { getCurrentUser } from "@/lib/auth/current-user";
import { formatShortDate, formatTime, percent } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export default async function EventsPage() {
  const user = await getCurrentUser();
  const where = user.role === "LEADER"
    ? { churchId: user.churchId, group: { is: { leaderUserId: user.id } } }
    : user.role === "SUPERVISOR"
      ? { churchId: user.churchId, group: { is: { supervisorUserId: user.id } } }
      : { churchId: user.churchId };

  const events = await prisma.event.findMany({
    where,
    include: { group: true, attendances: true },
    orderBy: { startsAt: "desc" },
    take: 20,
  });

  return (
    <AppShell
      userName={user.name}
      role={user.role}
      nav={[
        { href: user.role === "LEADER" ? "/lider" : user.role === "SUPERVISOR" ? "/supervisor" : "/pastor", label: "Visão", icon: "home" },
        { href: "/pessoas", label: "Pessoas", icon: "people" },
        { href: "/eventos", label: "Eventos", icon: "calendar", active: true },
        { href: "#buscar", label: "Busca", icon: "search" },
      ]}
    >
      <SearchBox placeholder="Buscar pessoa..." />
      <h2 className="mb-4 text-2xl font-semibold">Eventos</h2>
      <div className="space-y-3">
        {events.map((event) => {
          const accountable = event.attendances.filter((attendance) => attendance.status !== "VISITOR");
          const present = accountable.filter((attendance) => attendance.status === "PRESENT").length;
          const rate = percent(present, accountable.length);
          return (
            <article key={event.id} className="rounded-[1.15rem] border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-4 shadow-card">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{event.title}</p>
                  <p className="mt-0.5 text-sm text-[var(--color-text-secondary)]">{event.group?.name ?? "Evento geral"} · {formatShortDate(event.startsAt)}, {formatTime(event.startsAt)}</p>
                </div>
                <Badge tone={event.status === "COMPLETED" ? "ok" : "neutral"}>{event.status === "COMPLETED" ? "feito" : "previsto"}</Badge>
              </div>
              <p className="mt-3 text-sm text-[var(--color-text-secondary)]">Presença: <strong className="text-[var(--color-text-primary)]">{rate}%</strong> · {event.attendances.length} marcações</p>
            </article>
          );
        })}
      </div>
    </AppShell>
  );
}
