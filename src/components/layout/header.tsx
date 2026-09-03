import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getRecentNotifications, getUnreadNotificationCount } from "@/actions/notifications";
import { NotificationBell } from "@/components/layout/notification-bell";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { UserMenu } from "@/components/layout/user-menu";
import { MobileMenu } from "@/components/layout/mobile-menu";
import { QuickCreate } from "@/components/forms/quick-create";

export async function Header() {
  const user = await requireUser();
  const [notifications, unread, clients] = await Promise.all([
    getRecentNotifications(10),
    getUnreadNotificationCount(),
    prisma.client.findMany({
      where: { userId: user.id },
      select: { id: true, name: true, companyName: true },
      orderBy: { companyName: "asc" },
    }),
  ]);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-surface/90 px-4 backdrop-blur sm:px-6">
      <MobileMenu />
      <div className="flex-1" />
      <QuickCreate clients={clients} />
      <NotificationBell initialNotifications={notifications} initialUnread={unread} />
      <ThemeToggle />
      <UserMenu name={user.name} email={user.email} />
    </header>
  );
}
