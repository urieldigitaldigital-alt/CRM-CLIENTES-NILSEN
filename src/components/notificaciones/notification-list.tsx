"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Check, CheckCheck, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatDateTime, formatRelativeDay } from "@/lib/format";
import { markAllNotificationsRead, markNotificationRead } from "@/actions/notifications";
import type { getRecentNotifications } from "@/actions/notifications";

type NotificationItem = Awaited<ReturnType<typeof getRecentNotifications>>[number];

export function NotificationList({ initialItems }: { initialItems: NotificationItem[] }) {
  const [items, setItems] = useState(initialItems);
  const [isPending, startTransition] = useTransition();
  const unreadCount = items.filter((n) => !n.read).length;

  function handleMarkRead(id: string) {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    startTransition(() => markNotificationRead(id));
  }

  function handleMarkAll() {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    startTransition(() => markAllNotificationsRead());
  }

  if (items.length === 0) {
    return (
      <Card className="flex flex-col items-center gap-2 py-16 text-center">
        <Bell className="size-8 text-muted" />
        <p className="font-medium">No tenés notificaciones todavía</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {unreadCount > 0 && (
        <div className="flex justify-end">
          <Button variant="secondary" size="sm" className="gap-1.5" onClick={handleMarkAll} disabled={isPending}>
            <CheckCheck className="size-3.5" />
            Marcar todas como leídas
          </Button>
        </div>
      )}
      {items.map((n) => (
        <Card
          key={n.id}
          className={cn("flex items-start gap-3 p-4", !n.read && "border-accent/40 bg-accent-soft/30")}
        >
          <Link href={n.link ?? "/notificaciones"} className="min-w-0 flex-1">
            <p className="font-medium">{n.title}</p>
            <p className="mt-0.5 text-sm text-muted">{n.body}</p>
            <p className="mt-1.5 text-xs text-muted">
              {formatRelativeDay(n.createdAt)} · {formatDateTime(n.createdAt)}
            </p>
          </Link>
          {!n.read && (
            <button
              onClick={() => handleMarkRead(n.id)}
              className="flex shrink-0 items-center gap-1 rounded-md border border-border px-2 py-1 text-xs font-medium text-muted hover:bg-surface-2 hover:text-accent"
            >
              <Check className="size-3.5" /> Leída
            </button>
          )}
        </Card>
      ))}
    </div>
  );
}
