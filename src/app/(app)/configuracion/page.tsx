import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ProfileForm } from "@/components/configuracion/profile-form";
import { NotificationPrefsForm } from "@/components/configuracion/notification-prefs-form";
import { ThemeSelector } from "@/components/configuracion/theme-selector";
import { PushSubscribeCard } from "@/components/configuracion/push-subscribe-card";

export default async function ConfiguracionPage() {
  const user = await requireUser();
  const prefs = await prisma.notificationPreference.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Configuración</h1>
        <p className="mt-1 text-sm text-muted">Tu perfil, notificaciones y preferencias.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Perfil</CardTitle>
          <CardDescription>Tu nombre, email, zona horaria y formato de fecha.</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm name={user.name} email={user.email} timezone={user.timezone} dateFormat={user.dateFormat} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Apariencia</CardTitle>
          <CardDescription>Elegí cómo se ve la aplicación.</CardDescription>
        </CardHeader>
        <CardContent>
          <ThemeSelector />
        </CardContent>
      </Card>

      <PushSubscribeCard />

      <Card>
        <CardHeader>
          <CardTitle>Preferencias de notificaciones</CardTitle>
          <CardDescription>Qué avisos querés recibir y con cuánta anticipación por defecto.</CardDescription>
        </CardHeader>
        <CardContent>
          <NotificationPrefsForm
            prefs={{
              pushEnabled: prefs.pushEnabled,
              taskReminders: prefs.taskReminders,
              meetingReminders: prefs.meetingReminders,
              paymentReminders: prefs.paymentReminders,
              defaultTaskReminder: prefs.defaultTaskReminder,
              defaultMeetingReminder: prefs.defaultMeetingReminder,
              defaultPaymentReminder: prefs.defaultPaymentReminder,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
