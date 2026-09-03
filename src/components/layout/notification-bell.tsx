"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Bell, Check, CheckCheck } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatRelativeDay, formatTime } from "@/lib/format";
import {
  getRecentNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/actions/notifications";

type NotificationItem = Awaited<ReturnType<typeof getRecentNotifications>>[number];

export function NotificationBell({
  initialNotifications,
  initialUnread,
}: {
  initialNotifications: NotificationItem[];
  initialUnread: number;
}) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(initialNotifications);
  const [unread, setUnread] = useState(initialUnread);
  const [isPending, startTransition] = useTransition();

  async function refresh() {
    const [list, count] = await Promise.all([
      getRecentNotifications(10),
      getUnreadNotificationCount(),
    ]);
    setItems(list);
    setUnread(count);
  }

  useEffect(() => {
    const interval = setInterval(() => {
      refresh();
    }, 30_000);
    return () => clearInterval(interval);
  }, []);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) refresh();
  }

  function handleMarkRead(id: string) {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setUnread((prev) => Math.max(0, prev - 1));
    startTransition(() => {
      markNotificationRead(id);
    });
  }

  function handleMarkAll() {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnread(0);
    startTransition(() => {
      markAllNotificationsRead();
    });
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          className="relative flex size-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
          aria-label="Notificaciones"
        >
          <Bell className="size-5" />
          {unread > 0 && (
            <span className="absolute right-1.5 top-1.5 flex size-4 items-center justify-center rounded-full bg-danger text-[10px] font-semibold text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[360px] p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <span className="font-display text-sm font-semibold">Notificaciones</span>
          {unread > 0 && (
            <button
              onClick={handleMarkAll}
              disabled={isPending}
              className="flex items-center gap-1 text-xs font-medium text-accent hover:underline"
            >
              <CheckCheck className="size-3.5" />
              Marcar todas
            </button>
          )}
        </div>
        <div className="max-h-[360px] overflow-y-auto scrollbar-thin">
          {items.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-muted">
              No tenés notificaciones todavía.
            </p>
          )}
          {items.map((n) => (
            <div
              key={n.id}
              className={cn(
                "flex gap-3 border-b border-border px-4 py-3 last:border-0",
                !n.read && "bg-accent-soft/40"
              )}
            >
              <Link
                href={n.link ?? "/notificaciones"}
                onClick={() => setOpen(false)}
                className="flex-1 min-w-0"
              >
                <p className="text-[13px] font-medium leading-snug">{n.title}</p>
                <p className="mt-0.5 text-[13px] leading-snug text-muted line-clamp-2">{n.body}</p>
                <p className="mt-1 text-[11px] text-muted">
                  {formatRelativeDay(n.createdAt)} · {formatTime(n.createdAt)}
                </p>
              </Link>
              {!n.read && (
                <button
                  onClick={() => handleMarkRead(n.id)}
                  className="shrink-0 self-start rounded-md p-1 text-muted hover:bg-surface-2 hover:text-accent"
                  aria-label="Marcar como leída"
                  title="Marcar como leída"
                >
                  <Check className="size-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
        <div className="border-t border-border p-2">
          <Button asChild variant="ghost" size="sm" className="w-full">
            <Link href="/notificaciones" onClick={() => setOpen(false)}>
              Ver todas
            </Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
