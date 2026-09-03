import Link from "next/link";
import { EventChip } from "@/components/calendario/event-chip";
import type { CalendarEvent } from "@/lib/calendar-data";
import { TIMEZONE } from "@/lib/format";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function keyFor(date: Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIMEZONE }).format(date);
}

export function MonthView({
  monthStart,
  days,
  events,
  todayKey,
}: {
  monthStart: Date;
  days: Date[];
  events: CalendarEvent[];
  todayKey: string;
}) {
  const eventsByDay = new Map<string, CalendarEvent[]>();
  for (const e of events) {
    const key = keyFor(e.date);
    if (!eventsByDay.has(key)) eventsByDay.set(key, []);
    eventsByDay.get(key)!.push(e);
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <div className="grid grid-cols-7 border-b border-border bg-surface-2">
        {WEEKDAYS.map((d) => (
          <div key={d} className="px-2 py-2 text-center text-xs font-medium text-muted">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const key = keyFor(day);
          const inMonth = day.getUTCMonth() === monthStart.getUTCMonth();
          const dayEvents = eventsByDay.get(key) ?? [];
          const isToday = key === todayKey;
          return (
            <div
              key={key}
              className={cn(
                "min-h-24 border-b border-r border-border p-1.5 last:border-r-0 sm:min-h-28",
                !inMonth && "bg-surface-2/40"
              )}
            >
              <Link
                href={`/calendario?view=day&date=${key}`}
                className={cn(
                  "mb-1 inline-flex size-5 items-center justify-center rounded-full text-xs font-medium",
                  isToday ? "bg-accent text-accent-foreground" : inMonth ? "text-foreground" : "text-muted"
                )}
              >
                {day.getUTCDate()}
              </Link>
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map((e) => (
                  <EventChip key={e.id} event={e} compact />
                ))}
                {dayEvents.length > 3 && (
                  <Link href={`/calendario?view=day&date=${key}`} className="block text-[11px] text-accent hover:underline">
                    +{dayEvents.length - 3} más
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
