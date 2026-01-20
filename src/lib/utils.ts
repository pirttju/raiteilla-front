import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { COUNTRY_TIMEZONES } from './constants';

// Standard utility to merge Tailwind classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Helper to determine if the train is 6+ minutes late
export function checkIsLate(scheduled: string | null | undefined, actual: string | null | undefined) {
  if (!scheduled || !actual) return false;
  
  const scheduledTime = new Date(scheduled).getTime();
  const actualTime = new Date(actual).getTime();

  // Ensure dates are valid
  if (isNaN(scheduledTime) || isNaN(actualTime)) return false;

  const differenceInMinutes = (actualTime - scheduledTime) / 60000;
  return differenceInMinutes >= 6;
};

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
      hour12: false, // Forces 24-hour format (00:00 - 23:59)
    });
  } catch (error) {
    console.error(`Error formatting time for ${country}:`, error);
    return '-';
  }
}

/**
 * Returns YYYY-MM-DD string for a specific country's timezone
 * given a day offset from "now".
 */
export function getDateInZone(countryCode: string, dayOffset: number = 0): string {
  const timeZone = COUNTRY_TIMEZONES[countryCode.toLowerCase()] || COUNTRY_TIMEZONES.default;
  
  const date = new Date();
  // Adjust date by offset
  date.setDate(date.getDate() + dayOffset);

  // Format to YYYY-MM-DD in the specific timezone
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}