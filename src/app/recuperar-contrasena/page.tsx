import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getCurrentUser } from "@/lib/auth";
import { ForgotPasswordForm } from "@/components/forms/forgot-password-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default async function RecuperarContrasenaPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      <div className="relative w-full max-w-sm animate-rise-in">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex size-14 items-center justify-center overflow-hidden rounded-xl shadow-lg shadow-accent/20">
            <Image src="/icons/icon-192.png" alt="" width={56} height={56} />
          </div>
          <h1 className="font-display text-xl font-semibold tracking-tight">Operaciones</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recuperar contraseña</CardTitle>
            <CardDescription>
              Ingresá tu email y te mandamos un enlace para elegir una nueva contraseña.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ForgotPasswordForm />
          </CardContent>
        </Card>

        <p className="mt-4 text-center text-sm text-muted">
          <Link href="/login" className="font-medium text-accent hover:underline">
            Volver a iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
