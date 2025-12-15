import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { COUNTRY_TIMEZONES } from './constants';

// Standard utility to merge Tailwind classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format "2025-11-20" to "20.11.2025" (Finnish style) or local specific
export function formatDateDisplay(dateStr: string, locale: string) {
  return new Date(dateStr).toLocaleDateString(locale, {
    weekday: 'short',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric'
  });
}

// Calculate next and previous dates for navigation
export function getNavDates(currentDate: string) {
  const date = new Date(currentDate);
  
  const prev = new Date(date);
  prev.setDate(date.getDate() - 1);
  
  const next = new Date(date);
  next.setDate(date.getDate() + 1);

  return {
    prev: prev.toISOString().split('T')[0],
    next: next.toISOString().split('T')[0]
  };
}

export function formatStationTime(
  dateStr: string | null | undefined, 
  country: string, 
  lang: string
): string {
  if (!dateStr) return '-';
  
  // Resolve timezone, default to UTC if unknown
  const timeZone = COUNTRY_TIMEZONES[country] || 'UTC';
  
  try {
    return new Date(dateStr).toLocaleTimeString(lang, {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: timeZone,
    });
  } catch (error) {
    console.error(`Error formatting time for ${country}:`, error);
    return '-';
  }
}