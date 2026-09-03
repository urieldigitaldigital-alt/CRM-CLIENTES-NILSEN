import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { NotificationList } from "@/components/notificaciones/notification-list";

export default async function NotificacionesPage() {
  const user = await requireUser();
  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Notificaciones</h1>
        <p className="mt-1 text-sm text-muted">Recordatorios de tareas, reuniones y cobros.</p>
      </div>
      <NotificationList initialItems={notifications} />
    </div>
  );
}
