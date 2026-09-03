import { TIMEZONE } from "@/lib/format";

const BA_OFFSET_HOURS = 3;

function baYMD(date: Date): { y: number; m: number; d: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
  const [y, m, d] = parts.split("-").map(Number);
  return { y, m, d };
}

/** UTC [start, end) instants for a Buenos Aires calendar day, `dayOffset` days from today. */
export function getDayRangeBA(dayOffset = 0): { start: Date; end: Date } {
  const { y, m, d } = baYMD(new Date());
  const start = new Date(Date.UTC(y, m - 1, d + dayOffset, BA_OFFSET_HOURS, 0, 0));
  const end = new Date(Date.UTC(y, m - 1, d + dayOffset + 1, BA_OFFSET_HOURS, 0, 0));
  return { start, end };
}

/** UTC [start, end) instants spanning `days` Buenos Aires calendar days starting today. */
export function getRangeFromTodayBA(days: number): { start: Date; end: Date } {
  const { start } = getDayRangeBA(0);
  const { end } = getDayRangeBA(days - 1);
  return { start, end };
}

/** Parses a "YYYY-MM-DD" query param, falling back to today in Buenos Aires. */
export function parseDateParam(date?: string): { y: number; m: number; d: number } {
  if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const [y, m, d] = date.split("-").map(Number);
    return { y, m, d };
  }
  return baYMD(new Date());
}

/** UTC [start, end) instants for the Buenos Aires calendar day y-m-d. */
export function getDayRangeForYMD(y: number, m: number, d: number): { start: Date; end: Date } {
  const start = new Date(Date.UTC(y, m - 1, d, BA_OFFSET_HOURS, 0, 0));
  const end = new Date(Date.UTC(y, m - 1, d + 1, BA_OFFSET_HOURS, 0, 0));
  return { start, end };
}

/** A UTC-midnight marker (not a real instant) representing a calendar day, for grid rendering. */
function dayMarker(y: number, m: number, d: number): Date {
  return new Date(Date.UTC(y, m - 1, d));
}

/** Monday-start 7-day window (as day markers) containing y-m-d. */
export function getWeekDays(y: number, m: number, d: number): Date[] {
  const anchor = dayMarker(y, m, d);
  const isoDow = anchor.getUTCDay() === 0 ? 7 : anchor.getUTCDay(); // 1=Mon .. 7=Sun
  const monday = new Date(anchor);
  monday.setUTCDate(anchor.getUTCDate() - (isoDow - 1));
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(monday);
    day.setUTCDate(monday.getUTCDate() + i);
    return day;
  });
}

/** Monday-start 6-week (42 day) grid covering the month of y-m, as day markers. */
export function getMonthGridDays(y: number, m: number): { monthStart: Date; days: Date[] } {
  const monthStart = dayMarker(y, m, 1);
  const firstWeek = getWeekDays(y, m, 1);
  const days = Array.from({ length: 42 }, (_, i) => {
    const day = new Date(firstWeek[0]);
    day.setUTCDate(firstWeek[0].getUTCDate() + i);
    return day;
  });
  return { monthStart, days };
}
