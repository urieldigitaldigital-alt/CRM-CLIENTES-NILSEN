import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function VerificarEmailInvalidoPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;
  const expired = reason === "expired";

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
            <CardTitle>{expired ? "El enlace venció" : "Enlace de verificación inválido"}</CardTitle>
            <CardDescription>
              {expired
                ? "Este enlace de verificación ya no es válido. Pedí uno nuevo."
                : "No pudimos verificar tu email con ese enlace. Puede que ya se haya usado."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button asChild className="w-full">
              <Link href="/register">Registrarme de nuevo</Link>
            </Button>
            <Button asChild variant="ghost" className="w-full">
              <Link href="/login">Ir a iniciar sesión</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
