"use client";

import { Clock3 } from "lucide-react";
import { useState } from "react";
import { CELL_MEETING_TIME_OPTIONS } from "@/features/events/time-options";
import { cn } from "@/lib/cn";

export function GroupMeetingTimeInput({ defaultValue }: { defaultValue?: string | null }) {
  const [meetingTime, setMeetingTime] = useState(defaultValue ?? "");
  const [isOpen, setIsOpen] = useState(false);
  const timeOptions = meetingTime && !CELL_MEETING_TIME_OPTIONS.includes(meetingTime)
    ? [meetingTime, ...CELL_MEETING_TIME_OPTIONS]
    : CELL_MEETING_TIME_OPTIONS;

  function selectTime(time: string) {
    setMeetingTime(time);
    setIsOpen(false);
  }

  return (
    <div className="event-picker-field group-time-field">
      <input
        id="meeting-time"
        name="meetingTime"
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder="hh:mm"
        maxLength={5}
        pattern="([01][0-9]|2[0-3]):[0-5][0-9]"
        title="Use o formato hh:mm, como 19:30."
        value={meetingTime}
        onChange={(event) => setMeetingTime(event.target.value)}
        className="event-picker-input min-h-12 w-full rounded-2xl border border-[var(--color-border-card)] bg-[var(--surface-alt)] text-sm font-medium text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)] transition focus:border-[var(--color-brand)] focus:bg-[var(--color-bg-card)]"
      />
      <button
        type="button"
        className="event-picker-trigger"
        aria-label="Escolher horário padrão"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
      >
        <Clock3 className="h-4 w-4" aria-hidden="true" />
      </button>
      {isOpen ? (
        <div className="event-picker-popover event-time-popover group-time-popover">
          {timeOptions.map((time) => (
            <button
              key={time}
              type="button"
              className={cn("event-time-option", meetingTime === time && "event-time-option-selected")}
              onClick={() => selectTime(time)}
            >
              {time}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
