import { ActionPanel } from "@/components/ui/action-panel";
import { Button } from "@/components/ui/button";
import { closeEventActionCopy, closedWithoutPresenceCopy } from "@/features/events/event-actions-view";

export function EventCloseAction({
  isClosedWithoutPresence,
  isFutureEvent,
  disabled,
  onClose,
  onReopen,
}: {
  isClosedWithoutPresence: boolean;
  isFutureEvent: boolean;
  disabled: boolean;
  onClose: () => void;
  onReopen: () => void;
}) {
  if (isClosedWithoutPresence) {
    return (
      <ActionPanel
        title="Aconteceu nesta semana?"
        description={closedWithoutPresenceCopy(isFutureEvent)}
        className="mt-4"
      >
        <Button type="button" variant="secondary" shape="soft" fullWidth onClick={onReopen} disabled={disabled}>
          Marcar que houve encontro
        </Button>
      </ActionPanel>
    );
  }

  const copy = closeEventActionCopy(isFutureEvent);

  return (
    <ActionPanel title={copy.title} description={copy.description} className="mt-4">
      <Button type="button" variant="secondary" shape="soft" fullWidth onClick={onClose} disabled={disabled}>
        {copy.actionLabel}
      </Button>
    </ActionPanel>
  );
}
