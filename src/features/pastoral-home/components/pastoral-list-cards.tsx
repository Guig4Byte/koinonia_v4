import { PersonSignalCard, type PersonSignalCardActionDisplay, type PersonSignalCardEmphasis } from "@/features/pastoral-home/components/person-signal-card";
import { PastoralListSection, type PastoralSectionTone } from "@/features/pastoral-home/components/pastoral-section";
import { groupNameOrFallback } from "@/features/groups/group-display";
import { signalBadgeForViewer, signalDescriptionForViewer } from "@/features/signals/display";
import { isSupportRequest } from "@/features/signals/sections";
import { SignalSeverity, UserRole } from "@/generated/prisma/client";
import { ROUTES } from "@/lib/routes";

export const PASTORAL_SECTION_LIMIT = 4;

type PastoralViewer = {
  id: string;
  role: UserRole;
};

type PastoralSignalCardItem = {
  id: string;
  personId: string;
  reason: string;
  severity: SignalSeverity;
  assignedToId?: string | null;
  assignedTo?: { role: UserRole } | null;
  person: { id: string; fullName: string };
  group?: { name?: string | null } | null;
};

type InCarePersonCardItem = {
  id: string;
  fullName: string;
  groupName?: string | null;
  memberships?: Array<{ group?: { name?: string | null } | null }>;
};

function defaultSignalContext(signal: PastoralSignalCardItem): string {
  return groupNameOrFallback(signal.group);
}

function pastoralSignalCards<TSignal extends PastoralSignalCardItem>({
  signals,
  viewer,
  contextForSignal = defaultSignalContext,
  reasonForSignal = (signal, currentViewer) => signalDescriptionForViewer(signal, currentViewer),
  ctaLabelForSignal = (signal, currentViewer) => isSupportRequest(signal, currentViewer) ? "Ver pedido" : "Acompanhar pessoa",
  actionDisplay = "icon",
  emphasisForSignal = (signal) => signal.severity === SignalSeverity.URGENT ? "strong" : "subtle",
}: {
  signals: TSignal[];
  viewer: PastoralViewer;
  contextForSignal?: (signal: TSignal, viewer: PastoralViewer) => string | undefined;
  reasonForSignal?: (signal: TSignal, viewer: PastoralViewer) => string | undefined;
  ctaLabelForSignal?: (signal: TSignal, viewer: PastoralViewer) => string;
  actionDisplay?: PersonSignalCardActionDisplay;
  emphasisForSignal?: (signal: TSignal, viewer: PastoralViewer) => PersonSignalCardEmphasis;
}) {
  return signals.map((signal) => {
    const badge = signalBadgeForViewer(signal, viewer);

    return (
      <PersonSignalCard
        key={signal.id}
        name={signal.person.fullName}
        detailHref={ROUTES.person(signal.person.id)}
        context={contextForSignal(signal, viewer)}
        reason={reasonForSignal(signal, viewer)}
        severity={signal.severity === SignalSeverity.URGENT ? "risk" : "warn"}
        badgeLabel={badge.label}
        badgeTone={badge.tone}
        ctaLabel={ctaLabelForSignal(signal, viewer)}
        actionDisplay={actionDisplay}
        emphasis={emphasisForSignal(signal, viewer)}
      />
    );
  });
}

export function PastoralSignalSection<TSignal extends PastoralSignalCardItem>({
  title,
  detail,
  emptyMessage,
  signals,
  viewer,
  contextForSignal,
  reasonForSignal,
  ctaLabelForSignal,
  actionDisplay,
  emphasisForSignal,
  tone,
}: {
  title: string;
  detail?: string;
  emptyMessage: string;
  signals: TSignal[];
  viewer: PastoralViewer;
  contextForSignal?: (signal: TSignal, viewer: PastoralViewer) => string | undefined;
  reasonForSignal?: (signal: TSignal, viewer: PastoralViewer) => string | undefined;
  ctaLabelForSignal?: (signal: TSignal, viewer: PastoralViewer) => string;
  actionDisplay?: PersonSignalCardActionDisplay;
  emphasisForSignal?: (signal: TSignal, viewer: PastoralViewer) => PersonSignalCardEmphasis;
  tone?: PastoralSectionTone;
}) {
  const visibleCards = pastoralSignalCards({
    signals: signals.slice(0, PASTORAL_SECTION_LIMIT),
    viewer,
    contextForSignal,
    reasonForSignal,
    ctaLabelForSignal,
    actionDisplay,
    emphasisForSignal,
  });
  const hiddenCards = pastoralSignalCards({
    signals: signals.slice(PASTORAL_SECTION_LIMIT),
    viewer,
    contextForSignal,
    reasonForSignal,
    ctaLabelForSignal,
    actionDisplay,
    emphasisForSignal,
  });

  return (
    <PastoralListSection
      title={title}
      detail={detail}
      emptyMessage={emptyMessage}
      hiddenChildren={hiddenCards}
      tone={tone}
    >
      {visibleCards}
    </PastoralListSection>
  );
}

function inCarePersonCards<TPerson extends InCarePersonCardItem>({
  people,
  contextForPerson,
}: {
  people: TPerson[];
  contextForPerson?: (person: TPerson) => string | undefined;
}) {
  return people.map((person) => (
    <PersonSignalCard
      key={person.id}
      name={person.fullName}
      context={contextForPerson?.(person)}
      detailHref={ROUTES.person(person.id)}
      severity="info"
      badgeLabel="Em cuidado"
      badgeTone="care"
      ctaLabel="Continuar cuidado"
      emphasis="subtle"
    />
  ));
}

export function InCareSection<TPerson extends InCarePersonCardItem>({
  title,
  detail,
  emptyMessage,
  people,
  contextForPerson,
  tone,
}: {
  title: string;
  detail?: string;
  emptyMessage: string;
  people: TPerson[];
  contextForPerson?: (person: TPerson) => string | undefined;
  tone?: PastoralSectionTone;
}) {
  const visibleCards = inCarePersonCards({ people: people.slice(0, PASTORAL_SECTION_LIMIT), contextForPerson });
  const hiddenCards = inCarePersonCards({ people: people.slice(PASTORAL_SECTION_LIMIT), contextForPerson });

  return (
    <PastoralListSection
      title={title}
      detail={detail}
      emptyMessage={emptyMessage}
      hiddenChildren={hiddenCards}
      tone={tone}
    >
      {visibleCards}
    </PastoralListSection>
  );
}
