import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { ResetPasswordForm } from "@/components/forms/reset-password-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function RestablecerContrasenaPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const user = await prisma.user.findUnique({ where: { passwordResetToken: token } });
  const valid = !!user && !!user.passwordResetExpiresAt && user.passwordResetExpiresAt > new Date();

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
            <CardTitle>{valid ? "Elegí tu nueva contraseña" : "Enlace inválido"}</CardTitle>
            <CardDescription>
              {valid
                ? "Escribí una contraseña nueva para tu cuenta."
                : "Este enlace venció o ya se usó. Pedí uno nuevo."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {valid ? (
              <ResetPasswordForm token={token} />
            ) : (
              <Button asChild className="w-full">
                <Link href="/recuperar-contrasena">Pedir un enlace nuevo</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
