import Link from "next/link";
import { CalendarClock, CheckSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatTime } from "@/lib/format";
import { PRIORITY_BADGE, PRIORITY_LABEL, TASK_STATUS_BADGE, TASK_STATUS_LABEL } from "@/lib/constants";
import type { Priority, TaskStatus } from "@prisma/client";
import { cn } from "@/lib/utils";

export interface AgendaItem {
  id: string;
  time: Date;
  title: string;
  clientName?: string | null;
  href: string;
  kind: "task" | "meeting";
  priority?: Priority;
  status?: TaskStatus;
}

export function TodayTimeline({ items, emptyLabel }: { items: AgendaItem[]; emptyLabel: string }) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border py-12 text-center">
        <CalendarClock className="size-6 text-muted" />
        <p className="text-sm text-muted">{emptyLabel}</p>
      </div>
    );
  }

  return (
    <ol className="relative">
      <div className="absolute left-[52px] top-1 bottom-1 w-px bg-border" aria-hidden />
      {items.map((item) => (
        <li key={`${item.kind}-${item.id}`} className="relative flex gap-4 pb-5 last:pb-0">
          <div className="w-11 shrink-0 pt-0.5 text-right font-mono-data text-[13px] font-medium text-muted">
            {formatTime(item.time)}
          </div>
          <span
            className={cn(
              "relative z-10 mt-1.5 size-2.5 shrink-0 rounded-full ring-4 ring-background",
              item.priority ? priorityDot[item.priority] : "bg-info"
            )}
            aria-hidden
          />
          <Link
            href={item.href}
            className="flex-1 min-w-0 rounded-lg border border-border bg-surface px-3.5 py-2.5 transition-colors hover:border-accent/50 hover:bg-surface-2"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium leading-snug">{item.title}</p>
              {item.kind === "meeting" ? (
                <Badge variant="info">Reunión</Badge>
              ) : (
                item.status && <Badge variant={TASK_STATUS_BADGE[item.status]}>{TASK_STATUS_LABEL[item.status]}</Badge>
              )}
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-muted">
              {item.clientName && <span>{item.clientName}</span>}
              {item.priority && (
                <>
                  {item.clientName && <span aria-hidden>·</span>}
                  <Badge variant={PRIORITY_BADGE[item.priority]} dot>
                    {PRIORITY_LABEL[item.priority]}
                  </Badge>
                </>
              )}
              {item.kind === "task" && !item.priority && (
                <span className="inline-flex items-center gap-1">
                  <CheckSquare className="size-3" /> Tarea
                </span>
              )}
            </div>
          </Link>
        </li>
      ))}
    </ol>
  );
}

const priorityDot: Record<Priority, string> = {
  BAJA: "bg-muted",
  MEDIA: "bg-info",
  ALTA: "bg-warning",
  URGENTE: "bg-danger",
};
