import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getCalendarEvents } from "@/lib/calendar-data";
import {
  getDayRangeForYMD,
  getMonthGridDays,
  getWeekDays,
  parseDateParam,
} from "@/lib/dates";
import { Button } from "@/components/ui/button";
import { FormDialog } from "@/components/forms/form-dialog";
import { TaskForm } from "@/components/forms/task-form";
import { MonthView } from "@/components/calendario/month-view";
import { WeekView } from "@/components/calendario/week-view";
import { DayView } from "@/components/calendario/day-view";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";
import { TIMEZONE } from "@/lib/format";

type ViewType = "day" | "week" | "month";

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function ymdKey(y: number, m: number, d: number) {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function shiftYMD(y: number, m: number, d: number, view: ViewType, dir: 1 | -1): string {
  const date = new Date(Date.UTC(y, m - 1, d));
  if (view === "day") date.setUTCDate(date.getUTCDate() + dir);
  else if (view === "week") date.setUTCDate(date.getUTCDate() + dir * 7);
  else date.setUTCMonth(date.getUTCMonth() + dir);
  return ymdKey(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
}

export default async function CalendarioPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; date?: string }>;
}) {
  const user = await requireUser();
  const { view: rawView, date: rawDate } = await searchParams;
  const view: ViewType = rawView === "day" || rawView === "week" ? rawView : "month";
  const { y, m, d } = parseDateParam(rawDate);
  const todayKey = new Intl.DateTimeFormat("en-CA", { timeZone: TIMEZONE }).format(new Date());

  let rangeStart: Date;
  let rangeEnd: Date;
  let monthDays: Date[] = [];
  let monthStart = new Date();
  let weekDays: Date[] = [];

  if (view === "day") {
    const r = getDayRangeForYMD(y, m, d);
    rangeStart = r.start;
    rangeEnd = r.end;
  } else if (view === "week") {
    weekDays = getWeekDays(y, m, d);
    rangeStart = getDayRangeForYMD(
      weekDays[0].getUTCFullYear(),
      weekDays[0].getUTCMonth() + 1,
      weekDays[0].getUTCDate()
    ).start;
    const last = weekDays[6];
    rangeEnd = getDayRangeForYMD(last.getUTCFullYear(), last.getUTCMonth() + 1, last.getUTCDate()).end;
  } else {
    const grid = getMonthGridDays(y, m);
    monthDays = grid.days;
    monthStart = grid.monthStart;
    const first = monthDays[0];
    const last = monthDays[monthDays.length - 1];
    rangeStart = getDayRangeForYMD(first.getUTCFullYear(), first.getUTCMonth() + 1, first.getUTCDate()).start;
    rangeEnd = getDayRangeForYMD(last.getUTCFullYear(), last.getUTCMonth() + 1, last.getUTCDate()).end;
  }

  const [events, clients] = await Promise.all([
    getCalendarEvents(user.id, rangeStart, rangeEnd),
    prisma.client.findMany({
      where: { userId: user.id },
      select: { id: true, name: true, companyName: true },
      orderBy: { companyName: "asc" },
    }),
  ]);

  const currentKey = ymdKey(y, m, d);
  const prevKey = shiftYMD(y, m, d, view, -1);
  const nextKey = shiftYMD(y, m, d, view, 1);

  const heading =
    view === "day"
      ? `${d} de ${MONTH_NAMES[m - 1]} de ${y}`
      : view === "week"
        ? `${weekDays[0].getUTCDate()} — ${weekDays[6].getUTCDate()} de ${MONTH_NAMES[weekDays[6].getUTCMonth()]} ${y}`
        : `${MONTH_NAMES[m - 1]} ${y}`;

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Calendario</h1>
          <p className="mt-1 text-sm capitalize text-muted">{heading}</p>
        </div>
        <FormDialog
          trigger={
            <Button className="gap-1.5">
              <Plus className="size-4" />
              <span className="hidden sm:inline">Nueva tarea</span>
            </Button>
          }
          title="Nueva tarea"
        >
          <TaskForm clients={clients} />
        </FormDialog>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <Link
            href={`/calendario?view=${view}&date=${prevKey}`}
            className="flex size-8 items-center justify-center rounded-md border border-border hover:bg-surface-2"
          >
            <ChevronLeft className="size-4" />
          </Link>
          <Link
            href={`/calendario?view=${view}&date=${todayKey}`}
            className="rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-surface-2"
          >
            Hoy
          </Link>
          <Link
            href={`/calendario?view=${view}&date=${nextKey}`}
            className="flex size-8 items-center justify-center rounded-md border border-border hover:bg-surface-2"
          >
            <ChevronRight className="size-4" />
          </Link>
        </div>
        <div className="flex gap-1 rounded-lg bg-surface-2 p-1">
          {(["day", "week", "month"] as ViewType[]).map((v) => (
            <Link
              key={v}
              href={`/calendario?view=${v}&date=${currentKey}`}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                view === v ? "bg-surface shadow-sm text-foreground" : "text-muted hover:text-foreground"
              )}
            >
              {v === "day" ? "Día" : v === "week" ? "Semana" : "Mes"}
            </Link>
          ))}
        </div>
      </div>

      {view === "month" && (
        <MonthView monthStart={monthStart} days={monthDays} events={events} todayKey={todayKey} />
      )}
      {view === "week" && <WeekView days={weekDays} events={events} todayKey={todayKey} />}
      {view === "day" && <DayView events={events} />}
    </div>
  );
}
