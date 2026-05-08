export function EventActionFeedback({ message, errorMessage }: { message: string | null; errorMessage: string | null }) {
  return (
    <>
      {message ? <p className="mt-3 text-sm font-semibold text-[var(--color-metric-presenca)]">{message}</p> : null}
      {errorMessage ? <p className="mt-3 text-sm font-semibold text-[var(--color-badge-risco-text)]">{errorMessage}</p> : null}
    </>
  );
}
