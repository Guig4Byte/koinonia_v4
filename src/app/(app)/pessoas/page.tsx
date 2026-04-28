import { AppShell } from "@/components/app-shell";
import { PersonSignalCard, SectionTitle } from "@/components/cards";
import { SearchBox } from "@/components/search-box";
import { getVisibleOpenSignalWhere } from "@/features/permissions/permissions";
import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

export default async function PeoplePage() {
  const user = await getCurrentUser();
  const signals = await prisma.careSignal.findMany({
    where: getVisibleOpenSignalWhere(user),
    include: { person: true, group: { include: { leader: true } } },
    orderBy: { detectedAt: "desc" },
    take: 50,
  });

  return (
    <AppShell
      userName={user.name}
      role={user.role}
      nav={[
        { href: user.role === "LEADER" ? "/lider" : user.role === "SUPERVISOR" ? "/supervisor" : "/pastor", label: "Visão", icon: "home" },
        { href: "/pessoas", label: "Pessoas", icon: "people", active: true, attention: signals.length > 0 },
        { href: "/eventos", label: "Eventos", icon: "calendar" },
        { href: "#buscar", label: "Busca", icon: "search" },
      ]}
    >
      <SearchBox />
      <SectionTitle>Pessoas em atenção</SectionTitle>
      <div className="space-y-3">
        {signals.map((signal) => (
          <PersonSignalCard
            key={signal.id}
            initials={initials(signal.person.fullName)}
            name={signal.person.fullName}
            personId={signal.person.id}
            detailHref={`/pessoas/${signal.person.id}`}
            phone={signal.person.phone}
            context={`${signal.group?.name ?? "Sem célula"} · ${signal.group?.leader?.name ?? "Sem líder"}`}
            reason={signal.reason}
            severity={signal.severity === "URGENT" ? "risk" : "warn"}
          />
        ))}
        {signals.length === 0 ? <p className="rounded-2xl border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-4 shadow-card text-sm text-[var(--color-text-secondary)]">Nenhuma pessoa em atenção agora.</p> : null}
      </div>
    </AppShell>
  );
}
