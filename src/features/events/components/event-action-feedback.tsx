import { Feedback } from "@/components/ui/feedback";

export function EventActionFeedback({ message, errorMessage }: { message: string | null; errorMessage: string | null }) {
  return (
    <>
      {message ? (
        <Feedback tone="success" compact className="mt-3 font-semibold">
          {message}
        </Feedback>
      ) : null}
      {errorMessage ? (
        <Feedback tone="error" compact role="alert" ariaLive="assertive" className="mt-3 font-semibold">
          {errorMessage}
        </Feedback>
      ) : null}
    </>
  );
}
