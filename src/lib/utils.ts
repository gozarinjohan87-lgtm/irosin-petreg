import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type Params = Partial<
  Record<keyof URLSearchParams, string | number | null | undefined>
>;

export function createQueryString(
  params: Params,
  searchParams: URLSearchParams
) {
  const newSearchParams = new URLSearchParams(searchParams?.toString());

  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined) {
      newSearchParams.delete(key);
    } else {
      newSearchParams.set(key, String(value));
    }
  }

  return newSearchParams.toString();
}

export function formatDate(date: Date | string | number): string {
  return new Intl.DateTimeFormat("en-PH", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export function formatDateShort(date: Date | string | number): string {
  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export function generateId(): string {
  return Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 5).toUpperCase();
}

export function isOverdue(dateStr: string): boolean {
  return new Date(dateStr) < new Date();
}

export function isDueSoon(dateStr: string, daysAhead: number): boolean {
  const due = new Date(dateStr);
  const now = new Date();
  const threshold = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
  return due >= now && due <= threshold;
}

export function getVaccStatus(nextBoosterDue: string): 'up-to-date' | 'due-soon' | 'overdue' {
  if (isOverdue(nextBoosterDue)) return 'overdue';
  if (isDueSoon(nextBoosterDue, 30)) return 'due-soon';
  return 'up-to-date';
}
