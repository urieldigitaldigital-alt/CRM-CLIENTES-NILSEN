import { CalendarClock } from "lucide-react";
import { EventChip } from "@/components/calendario/event-chip";
import type { CalendarEvent } from "@/lib/calendar-data";

export function DayView({ events }: { events: CalendarEvent[] }) {
  const sorted = [...events].sort((a, b) => a.date.getTime() - b.date.getTime());

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border py-16 text-center">
        <CalendarClock className="size-6 text-muted" />
        <p className="text-sm text-muted">No hay tareas, reuniones ni cobros este día.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {sorted.map((e) => (
        <EventChip key={e.id} event={e} variant="row" />
      ))}
    </div>
  );
}
