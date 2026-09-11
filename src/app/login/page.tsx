import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getCurrentUser } from "@/lib/auth";
import { LoginForm } from "@/components/forms/login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");
  const { from } = await searchParams;

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
          <h1 className="font-display text-xl font-semibold tracking-tight">
            Operaciones
          </h1>
          <p className="mt-1 text-sm text-muted">
            Iniciá sesión para ver tu día.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
          <LoginForm from={from ?? "/dashboard"} />
        </div>

        <p className="mt-4 text-center text-sm text-muted">
          ¿No tenés cuenta?{" "}
          <Link href="/register" className="font-medium text-accent hover:underline">
            Registrate
          </Link>
        </p>

        <p className="mt-2 text-center text-xs text-muted">
          Cuenta de demostración precargada · demo@agencia.com / demo1234
        </p>
      </div>
    </div>
  );
}
