"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckSquare, Calendar as CalendarIcon, Wallet, ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatCurrency, formatDateTime, formatTime } from "@/lib/format";
import {
  PAYMENT_STATUS_BADGE,
  PAYMENT_STATUS_LABEL,
  PRIORITY_BADGE,
  PRIORITY_LABEL,
  TASK_STATUS_BADGE,
  TASK_STATUS_LABEL,
} from "@/lib/constants";
import type { CalendarEvent } from "@/lib/calendar-data";

const TYPE_ICON = { task: CheckSquare, meeting: CalendarIcon, payment: Wallet } as const;
const TYPE_LABEL = { task: "Tarea", meeting: "Reunión", payment: "Cobro" } as const;
const TYPE_DOT = { task: "bg-warning", meeting: "bg-info", payment: "bg-success" } as const;
const TYPE_HREF = { task: "/tareas", meeting: "/reuniones", payment: "/cobros" } as const;

export function EventChip({
  event,
  compact,
  variant = "chip",
}: {
  event: CalendarEvent;
  compact?: boolean;
  variant?: "chip" | "row";
}) {
  const [open, setOpen] = useState(false);
  const Icon = TYPE_ICON[event.type];

  return (
    <>
      {variant === "row" ? (
        <button
          onClick={() => setOpen(true)}
          className="flex w-full items-center gap-3 rounded-lg border border-border bg-surface px-3.5 py-2.5 text-left transition-colors hover:border-accent/50 hover:bg-surface-2"
        >
          <span className="w-11 shrink-0 font-mono-data text-[13px] font-medium text-muted">
            {formatTime(event.date)}
          </span>
          <span className={cn("size-2 shrink-0 rounded-full", TYPE_DOT[event.type])} aria-hidden />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">{event.title}</span>
            {event.clientName && <span className="block truncate text-xs text-muted">{event.clientName}</span>}
          </span>
          <Badge variant="default">{TYPE_LABEL[event.type]}</Badge>
        </button>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className={cn(
            "flex w-full items-center gap-1.5 truncate rounded-md px-1.5 py-1 text-left text-[11px] font-medium transition-colors hover:opacity-80",
            compact ? "bg-transparent" : "border border-border bg-surface-2"
          )}
        >
          <span className={cn("size-1.5 shrink-0 rounded-full", TYPE_DOT[event.type])} aria-hidden />
          <span className="truncate">{event.title}</span>
        </button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Icon className="size-4 text-accent" />
              <DialogTitle>{event.title}</DialogTitle>
            </div>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="accent">{TYPE_LABEL[event.type]}</Badge>
              {event.priority && (
                <Badge variant={PRIORITY_BADGE[event.priority]} dot>
                  {PRIORITY_LABEL[event.priority]}
                </Badge>
              )}
              {event.taskStatus && (
                <Badge variant={TASK_STATUS_BADGE[event.taskStatus]}>{TASK_STATUS_LABEL[event.taskStatus]}</Badge>
              )}
              {event.paymentStatus && (
                <Badge variant={PAYMENT_STATUS_BADGE[event.paymentStatus]}>
                  {PAYMENT_STATUS_LABEL[event.paymentStatus]}
                </Badge>
              )}
            </div>
            <p className="text-muted">{formatDateTime(event.date)}</p>
            {event.clientName && (
              <p>
                Cliente:{" "}
                {event.clientId ? (
                  <Link href={`/clientes/${event.clientId}`} className="font-medium text-accent hover:underline">
                    {event.clientName}
                  </Link>
                ) : (
                  <span className="font-medium">{event.clientName}</span>
                )}
              </p>
            )}
            {event.amount != null && (
              <p>
                Importe: <span className="font-mono-data font-semibold">{formatCurrency(event.amount)}</span>
              </p>
            )}
            {event.durationMin && <p>Duración: {event.durationMin} minutos</p>}
            {event.detail && <p className="whitespace-pre-wrap text-muted">{event.detail}</p>}
            {event.meetingLink && (
              <a
                href={event.meetingLink}
                target="_blank"
                className="inline-flex items-center gap-1 font-medium text-accent hover:underline"
              >
                <ExternalLink className="size-3.5" /> Unirse a la reunión
              </a>
            )}
            <Link
              href={TYPE_HREF[event.type]}
              className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"
            >
              Ver en {TYPE_LABEL[event.type]}s <ExternalLink className="size-3" />
            </Link>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
