import { format, isToday, isTomorrow } from "date-fns";
import { ptBR } from "date-fns/locale";

export function formatShortDate(date: Date) {
  if (isToday(date)) return "Hoje";
  if (isTomorrow(date)) return "Amanhã";
  return format(date, "dd MMM", { locale: ptBR });
}

export function formatTime(date: Date) {
  return format(date, "HH:mm", { locale: ptBR });
}

export function percent(numerator: number, denominator: number) {
  if (denominator === 0) return 0;
  return Math.round((numerator / denominator) * 100);
}
