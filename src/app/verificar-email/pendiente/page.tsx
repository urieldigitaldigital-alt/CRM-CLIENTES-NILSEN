import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ResendVerificationForm } from "@/components/forms/resend-verification-form";

export default async function VerificarEmailPendientePage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;

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
            <CardTitle>Revisá tu email</CardTitle>
            <CardDescription>
              Te mandamos un enlace de verificación{email ? ` a ${email}` : ""}. Tocalo para activar tu
              cuenta. Si no lo ves, revisá spam.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <ResendVerificationForm email={email ?? ""} />
            <Link href="/login" className="text-center text-sm text-accent hover:underline">
              Ya verifiqué, iniciar sesión
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
