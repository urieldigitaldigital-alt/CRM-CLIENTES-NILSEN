const TIMEZONE = "America/Argentina/Buenos_Aires";

export function formatDate(date: Date | string, opts?: { withYear?: boolean }) {
  const d = new Date(date);
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: opts?.withYear === false ? undefined : "numeric",
    timeZone: TIMEZONE,
  }).format(d);
}

export function formatTime(date: Date | string) {
  const d = new Date(date);
  return new Intl.DateTimeFormat("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: TIMEZONE,
  }).format(d);
}

export function formatDateTime(date: Date | string) {
  return `${formatDate(date)} · ${formatTime(date)}`;
}

export function formatRelativeDay(date: Date | string) {
  const d = new Date(date);
  const now = new Date();
  const startOfDay = (x: Date) =>
    new Date(x.toLocaleDateString("en-US", { timeZone: TIMEZONE })).setHours(0, 0, 0, 0);
  const diffDays = Math.round((startOfDay(d) - startOfDay(now)) / 86_400_000);

  if (diffDays === 0) return "Hoy";
  if (diffDays === 1) return "Mañana";
  if (diffDays === -1) return "Ayer";
  if (diffDays > 1 && diffDays < 7) return `En ${diffDays} días`;
  if (diffDays < -1 && diffDays > -7) return `Hace ${Math.abs(diffDays)} días`;
  return formatDate(d);
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(amount);
}

// Formats a Date into the wall-clock value an <input type="datetime-local">
// expects, expressed in the agency's timezone (not the server's/browser's).
export function toDateTimeLocalValue(date: Date | string) {
  const d = new Date(date);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

// Interprets a "YYYY-MM-DDTHH:mm" value (from a datetime-local input) as wall-clock
// time in the agency's timezone and returns the equivalent UTC instant.
export function fromDateTimeLocalValue(value: string) {
  const [datePart, timePart] = value.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);

  // Find the UTC instant whose local representation in TIMEZONE matches the input.
  const guessUtc = Date.UTC(year, month - 1, day, hour, minute);
  const asLocalString = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(guessUtc));
  const [gDate, gTime] = asLocalString.split(", ");
  const [gYear, gMonth, gDay] = gDate.split("-").map(Number);
  const [gHour, gMinute] = gTime.split(":").map(Number);
  const localAsUtc = Date.UTC(gYear, gMonth - 1, gDay, gHour, gMinute);
  const offset = localAsUtc - guessUtc;
  return new Date(guessUtc - offset);
}

// Parses a "YYYY-MM-DD" value (from a date input) into a Date that displays as that
// same calendar day regardless of server timezone (anchored at UTC noon).
export function parseDateOnly(value: string): Date {
  return new Date(`${value}T12:00:00.000Z`);
}

export { TIMEZONE };
