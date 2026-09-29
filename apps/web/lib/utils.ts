import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDowntime(minutes: number | null | undefined): string {
  if (minutes === null || minutes === undefined || isNaN(minutes) || minutes < 0) {
    return "--";
  }
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  if (remainingMins === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${remainingMins}m`;
}

export function calculateDowntimeMinutes(startIso?: string | null, endIso?: string | null): number {
  if (!startIso || !endIso) return 0;
  try {
    const start = new Date(startIso).getTime();
    const end = new Date(endIso).getTime();
    if (isNaN(start) || isNaN(end) || end < start) return 0;
    return Math.round((end - start) / (1000 * 60));
  } catch {
    return 0;
  }
}
