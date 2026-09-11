import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { logoutAction } from "@/actions/auth";
import { startCheckoutAction, openBillingPortalAction } from "@/actions/billing";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default async function SuscripcionPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.subscriptionStatus === "ACTIVE" || user.subscriptionStatus === "EXEMPT") {
    redirect("/dashboard");
  }

  const isPastDue = user.subscriptionStatus === "PAST_DUE";

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      <div
        className="pointer-events-none absolute -top-40 left-1/2 h-[32rem] w-[32rem] -translate-x-1/2 rounded-full opacity-40 blur-[100px]"
        style={{
          background:
            "radial-gradient(circle, color-mix(in srgb, var(--color-accent) 35%, transparent) 0%, transparent 70%)",
        }}
        aria-hidden
      />
      <div className="relative w-full max-w-sm animate-rise-in">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex size-14 items-center justify-center overflow-hidden rounded-xl shadow-lg shadow-accent/20">
            <Image src="/icons/icon-192.png" alt="" width={56} height={56} />
          </div>
          <h1 className="font-display text-xl font-semibold tracking-tight">Operaciones</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{isPastDue ? "Tu pago no se pudo procesar" : "Activá tu suscripción"}</CardTitle>
            <CardDescription>
              {isPastDue
                ? "Actualizá tu método de pago para seguir usando Operaciones."
                : "Necesitás una suscripción activa para usar esta sección. USD 9 por mes, cancelás cuando quieras."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {isPastDue ? (
              <form action={openBillingPortalAction}>
                <Button type="submit" className="w-full" size="lg">
                  Actualizar método de pago
                </Button>
              </form>
            ) : (
              <form action={startCheckoutAction}>
                <Button type="submit" className="w-full" size="lg">
                  Suscribirme por 9 USD/mes
                </Button>
              </form>
            )}
            <Button asChild variant="ghost" className="w-full">
              <Link href="/dashboard">Volver al panel</Link>
            </Button>
            <form action={logoutAction}>
              <Button type="submit" variant="ghost" className="w-full">
                Cerrar sesión
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
