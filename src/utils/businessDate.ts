/**
 * FIRE & ASH Business Date Utility (Africa/Cairo timezone)
 * Restaurant operating hours: 11:00 AM - 03:30 AM.
 * Orders placed before 05:00 AM Cairo time belong to the previous calendar day's shift.
 */

export interface CairoDateParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

export function getCairoDateParts(date: Date = new Date()): CairoDateParts {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Africa/Cairo',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const partMap: Record<string, number> = {};
  for (const p of parts) {
    if (p.type !== 'literal') {
      partMap[p.type] = parseInt(p.value, 10);
    }
  }

  return {
    year: partMap.year ?? date.getFullYear(),
    month: partMap.month ?? date.getMonth() + 1,
    day: partMap.day ?? date.getDate(),
    hour: (partMap.hour === 24 ? 0 : partMap.hour) ?? date.getHours(),
    minute: partMap.minute ?? date.getMinutes(),
    second: partMap.second ?? date.getSeconds(),
  };
}

/**
 * Returns YYYY-MM-DD for the business shift in Africa/Cairo.
 * Any timestamp before 05:00 AM Cairo time is assigned to the previous calendar day.
 */
export function getBusinessDate(date: Date = new Date()): string {
  const parts = getCairoDateParts(date);
  const cairoCalDate = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
  if (parts.hour < 5) {
    cairoCalDate.setUTCDate(cairoCalDate.getUTCDate() - 1);
  }
  const y = cairoCalDate.getUTCFullYear();
  const m = String(cairoCalDate.getUTCMonth() + 1).padStart(2, '0');
  const d = String(cairoCalDate.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Formats a date/timestamp into Cairo 12-hour time (e.g. "09:45 م")
 */
export function formatCairoTime(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('ar-EG', {
    timeZone: 'Africa/Cairo',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

/**
 * Formats a date/timestamp into Cairo date and time (e.g. "2026/11/23 - 09:45 م")
 */
export function formatCairoDateTime(date: Date = new Date()): string {
  const d = new Intl.DateTimeFormat('ar-EG', {
    timeZone: 'Africa/Cairo',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).format(date);
  const t = formatCairoTime(date);
  return `${d} — ${t}`;
}
