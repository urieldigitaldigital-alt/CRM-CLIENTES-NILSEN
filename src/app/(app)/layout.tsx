import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser, isOnTrial, trialHoursLeft } from "@/lib/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Header } from "@/components/layout/header";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const onTrial = isOnTrial(user);
  const hoursLeft = trialHoursLeft(user);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        {onTrial && (
          <div className="bg-accent-soft px-4 py-2 text-center text-xs font-medium text-accent sm:px-6">
            Estás en tu prueba gratis — te quedan {hoursLeft} {hoursLeft === 1 ? "hora" : "horas"}.{" "}
            <Link href="/suscripcion" className="underline underline-offset-2">
              Suscribite
            </Link>{" "}
            para no perder el acceso.
          </div>
        )}
        <main className="flex-1 px-4 pt-5 pb-[calc(5rem+env(safe-area-inset-bottom))] sm:px-6 sm:pb-8">{children}</main>
      </div>
      <MobileNav />
    </div>
  );
}
