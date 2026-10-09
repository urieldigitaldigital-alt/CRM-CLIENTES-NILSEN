import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Check } from "lucide-react";
import { getCurrentUser, hasActiveAccess } from "@/lib/auth";
import { logoutAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { WhopCheckout } from "@/components/billing/whop-checkout";

const FEATURES = [
  "Gestión completa de clientes",
  "Tareas, calendario y recordatorios",
  "Seguimiento de cobros",
  "Notificaciones push en tiempo real",
  "Cancelás cuando quieras, sin costo",
];

export default async function SuscripcionPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (hasActiveAccess(user)) {
    redirect("/dashboard");
  }

  const isPastDue = user.subscriptionStatus === "PAST_DUE";

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10">
      <div
        className="pointer-events-none absolute -top-40 left-1/2 h-[32rem] w-[32rem] -translate-x-1/2 rounded-full opacity-40 blur-[100px]"
        style={{
          background:
            "radial-gradient(circle, color-mix(in srgb, var(--color-accent) 35%, transparent) 0%, transparent 70%)",
        }}
        aria-hidden
      />
      <div className="relative w-full max-w-md animate-rise-in">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex size-14 items-center justify-center overflow-hidden rounded-xl shadow-lg shadow-accent/20">
            <Image src="/icons/icon-192.png" alt="" width={56} height={56} />
          </div>
          <h1 className="font-display text-xl font-semibold tracking-tight">Operaciones</h1>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
          <div className="border-b border-border p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-accent">Plan mensual</p>
            <h2 className="mt-1 font-display text-lg font-semibold tracking-tight">
              {isPastDue ? "Tu pago no se pudo procesar" : "Operaciones"}
            </h2>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="font-display text-4xl font-semibold tracking-tight">$8</span>
              <span className="text-sm text-muted">USD/mes</span>
            </div>
            <ul className="mt-5 space-y-2.5">
              {FEATURES.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 size-4 shrink-0 text-success" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-6">
            <WhopCheckout
              userId={user.id}
              email={user.email}
              ctaLabel={isPastDue ? "Reactivar mi suscripción" : "Suscribirme"}
            />
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2">
          <Button asChild variant="ghost" className="w-full">
            <Link href="/dashboard">Volver al panel</Link>
          </Button>
          <form action={logoutAction}>
            <Button type="submit" variant="ghost" className="w-full">
              Cerrar sesión
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
