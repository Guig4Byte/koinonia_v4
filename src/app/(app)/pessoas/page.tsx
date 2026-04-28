import Link from "next/link";
import { MembershipRole, PersonStatus, UserRole } from "../../../generated/prisma/client";
import { AppShell } from "@/components/app-shell";
import { PersonSignalCard, SectionTitle } from "@/components/cards";
import { SearchBox } from "@/components/search-box";
import { Badge } from "@/components/ui/badge";
import { getVisibleMembershipWhere, getVisibleOpenSignalWhere, getVisiblePersonWhere } from "@/features/permissions/permissions";
import { getPrimarySignalsByPerson } from "@/features/signals/attention";
import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";

const personStatusLabels: Record<PersonStatus, string> = {
  ACTIVE: "Ativo",
  VISITOR: "Visitante",
  NEW: "Novo",
  NEEDS_ATTENTION: "Em atenção",
  COOLING_AWAY: "Esfriando",
  INACTIVE: "Inativo",
};

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function statusTone(status: PersonStatus): "ok" | "warn" | "risk" | "info" {
  if (status === PersonStatus.ACTIVE) return "ok";
  if (status === PersonStatus.VISITOR || status === PersonStatus.NEW) return "info";
  if (status === PersonStatus.INACTIVE) return "warn";
  return "risk";
}

export default async function PeoplePage() {
  const user = await getCurrentUser();
  const isLeader = user.role === UserRole.LEADER;
  const homeHref = isLeader ? "/lider" : user.role === UserRole.SUPERVISOR ? "/supervisor" : "/pastor";
  const peopleLabel = isLeader ? "Membros" : "Pessoas";
  const searchPlaceholder = isLeader ? "Buscar membro..." : user.role === UserRole.SUPERVISOR ? "Buscar pessoa nas suas células..." : "Buscar pessoa...";

  const memberMembershipWhere = {
    ...getVisibleMembershipWhere(user),
    role: { not: MembershipRole.VISITOR },
  };

  const [openSignals, visibleMembers] = await Promise.all([
    prisma.careSignal.findMany({
      where: getVisibleOpenSignalWhere(user),
      include: { person: true, group: { include: { leader: true } } },
      orderBy: { detectedAt: "desc" },
      take: 50,
    }),
    isLeader
      ? prisma.person.findMany({
          where: {
            AND: [
              getVisiblePersonWhere(user),
              { memberships: { some: memberMembershipWhere } },
            ],
          },
          include: {
            memberships: {
              where: memberMembershipWhere,
              include: { group: true },
              take: 1,
            },
          },
          orderBy: { fullName: "asc" },
          take: 80,
        })
      : Promise.resolve([]),
  ]);

  const attentionPeople = getPrimarySignalsByPerson(openSignals);
  const attentionPersonIds = new Set(attentionPeople.map((signal) => signal.personId));

  return (
    <AppShell
      userName={user.name}
      role={user.role}
      nav={[
        { href: homeHref, label: "Visão", icon: "home" },
        { href: "/pessoas", label: peopleLabel, icon: "people", active: true, attention: attentionPeople.length > 0 },
        { href: "/eventos", label: "Eventos", icon: "calendar" },
      ]}
    >
      <SearchBox placeholder={searchPlaceholder} />

      <SectionTitle>{isLeader ? "Membros em atenção" : "Pessoas em atenção"}</SectionTitle>
      <div className="space-y-3">
        {attentionPeople.map((signal) => (
          <PersonSignalCard
            key={signal.id}
            initials={initials(signal.person.fullName)}
            name={signal.person.fullName}
            detailHref={`/pessoas/${signal.person.id}`}
            context={`${signal.group?.name ?? "Sem célula"} · ${signal.group?.leader?.name ?? "Sem líder"}`}
            reason={signal.reason}
            severity={signal.severity === "URGENT" ? "risk" : "warn"}
          />
        ))}
        {attentionPeople.length === 0 ? (
          <p className="rounded-2xl border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-4 shadow-card text-sm text-[var(--color-text-secondary)]">
            {isLeader ? "Nenhum membro da sua célula está em atenção agora." : "Nenhuma pessoa em atenção agora."}
          </p>
        ) : null}
      </div>

      {isLeader ? (
        <>
          <SectionTitle>Membros da célula</SectionTitle>
          <div className="space-y-2">
            {visibleMembers.map((person) => {
              const isInAttention = attentionPersonIds.has(person.id);

              return (
                <Link
                  key={person.id}
                  href={`/pessoas/${person.id}`}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--color-border-card)] bg-[var(--color-bg-card)] px-3 py-3 shadow-card transition active:scale-[0.99]"
                >
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-[var(--color-text-primary)]">{person.fullName}</span>
                    <span className="mt-0.5 block text-xs text-[var(--color-text-secondary)]">{person.memberships[0]?.group.name ?? "Sua célula"}</span>
                  </span>
                  <Badge tone={isInAttention ? "warn" : statusTone(person.status)}>
                    {isInAttention ? "em atenção" : personStatusLabels[person.status]}
                  </Badge>
                </Link>
              );
            })}
          </div>
        </>
      ) : (
        <>
          <SectionTitle>Consulta</SectionTitle>
          <p className="rounded-2xl border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-4 text-sm leading-relaxed text-[var(--color-text-secondary)] shadow-card">
            A lista acima mostra apenas quem merece atenção. Para consultar outra pessoa do seu escopo, use a busca pelo nome.
          </p>
        </>
      )}
    </AppShell>
  );
}
