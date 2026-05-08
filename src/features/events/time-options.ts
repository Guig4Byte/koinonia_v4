export const CELL_MEETING_TIME_OPTIONS = ["18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00"];

export function timeOptionsWithCurrent(currentTime: string) {
  return currentTime && !CELL_MEETING_TIME_OPTIONS.includes(currentTime)
    ? [currentTime, ...CELL_MEETING_TIME_OPTIONS]
    : CELL_MEETING_TIME_OPTIONS;
}
