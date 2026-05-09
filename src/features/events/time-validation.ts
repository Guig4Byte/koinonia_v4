export const MIN_CLOCK_HOUR = 0;
export const MAX_CLOCK_HOUR = 23;
export const MIN_CLOCK_MINUTE = 0;
export const MAX_CLOCK_MINUTE = 59;

export type ClockTimeParts = {
  hours: number;
  minutes: number;
};

export function isValidClockTimeParts({ hours, minutes }: ClockTimeParts) {
  return (
    Number.isInteger(hours) &&
    Number.isInteger(minutes) &&
    hours >= MIN_CLOCK_HOUR &&
    hours <= MAX_CLOCK_HOUR &&
    minutes >= MIN_CLOCK_MINUTE &&
    minutes <= MAX_CLOCK_MINUTE
  );
}

export function parseClockTime(timeValue: string, options: { allowSingleDigitHour?: boolean } = {}): ClockTimeParts | null {
  const hourPattern = options.allowSingleDigitHour ? "\\d{1,2}" : "\\d{2}";
  const match = new RegExp(`^(${hourPattern}):(\\d{2})$`).exec(timeValue.trim());
  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const time = { hours, minutes };

  return isValidClockTimeParts(time) ? time : null;
}
