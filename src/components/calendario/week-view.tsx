import Link from "next/link";
import { EventChip } from "@/components/calendario/event-chip";
import type { CalendarEvent } from "@/lib/calendar-data";
import { TIMEZONE } from "@/lib/format";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function keyFor(date: Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIMEZONE }).format(date);
}

export function WeekView({ days, events, todayKey }: { days: Date[]; events: CalendarEvent[]; todayKey: string }) {
  const eventsByDay = new Map<string, CalendarEvent[]>();
  for (const e of events) {
    const key = keyFor(e.date);
    if (!eventsByDay.has(key)) eventsByDay.set(key, []);
    eventsByDay.get(key)!.push(e);
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-7">
      {days.map((day, i) => {
        const key = keyFor(day);
        const dayEvents = (eventsByDay.get(key) ?? []).sort((a, b) => a.date.getTime() - b.date.getTime());
        const isToday = key === todayKey;
        return (
          <div key={key} className="rounded-xl border border-border">
            <Link
              href={`/calendario?view=day&date=${key}`}
              className={cn(
                "flex items-center justify-between border-b border-border px-2.5 py-2 text-xs font-medium",
                isToday && "bg-accent-soft text-accent"
              )}
            >
              <span>{WEEKDAYS[i]}</span>
              <span
                className={cn(
                  "flex size-5 items-center justify-center rounded-full",
                  isToday && "bg-accent text-accent-foreground"
                )}
              >
                {day.getUTCDate()}
              </span>
            </Link>
            <div className="space-y-1 p-1.5">
              {dayEvents.length === 0 && <p className="px-1 py-2 text-center text-[11px] text-muted">Sin eventos</p>}
              {dayEvents.map((e) => (
                <EventChip key={e.id} event={e} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
