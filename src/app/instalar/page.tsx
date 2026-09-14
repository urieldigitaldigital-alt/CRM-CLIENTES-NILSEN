import Link from "next/link";
import Image from "next/image";
import { Share, SquarePlus, Smartphone, MoreVertical, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

function Step({
  number,
  icon,
  title,
  description,
}: {
  number: number;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
          {icon}
        </div>
        <span className="mt-1 text-xs font-medium text-muted">{number}</span>
      </div>
      <div className="pt-1.5">
        <p className="font-medium text-foreground">{title}</p>
        <p className="mt-0.5 text-sm text-muted">{description}</p>
      </div>
    </div>
  );
}

export default function InstalarPage() {
  return (
    <div className="mx-auto max-w-lg space-y-6 px-4 py-10">
      <div className="flex flex-col items-center text-center">
        <div className="mb-4 flex size-14 items-center justify-center overflow-hidden rounded-xl shadow-lg shadow-accent/20">
          <Image src="/icons/icon-192.png" alt="" width={56} height={56} />
        </div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          Instalá Operaciones en tu celular
        </h1>
        <p className="mt-1 text-sm text-muted">
          Se agrega como un ícono en tu pantalla de inicio, igual que una app normal. No hace falta
          bajar nada de ninguna tienda.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>En iPhone (Safari)</CardTitle>
          <CardDescription>
            Tiene que ser desde la app Safari — no funciona desde Chrome ni otro navegador en iPhone.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <Step
            number={1}
            icon={<Smartphone className="size-5" />}
            title="Abrí Operaciones en Safari"
            description="Entrá a la app desde el navegador Safari de tu iPhone."
          />
          <Step
            number={2}
            icon={<Share className="size-5" />}
            title='Tocá el botón "Compartir"'
            description="Es el ícono del cuadrado con la flecha hacia arriba, abajo al centro de la pantalla."
          />
          <Step
            number={3}
            icon={<SquarePlus className="size-5" />}
            title='Elegí "Agregar a pantalla de inicio"'
            description='Deslizá la lista de opciones hasta encontrar "Agregar a pantalla de inicio" y tocala.'
          />
          <Step
            number={4}
            icon={<Download className="size-5" />}
            title='Confirmá tocando "Agregar"'
            description="Va a aparecer el ícono de Operaciones en tu pantalla de inicio, como cualquier otra app."
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>En Android (Chrome)</CardTitle>
          <CardDescription>Desde el navegador Chrome.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <Step
            number={1}
            icon={<Smartphone className="size-5" />}
            title="Abrí Operaciones en Chrome"
            description="Entrá a la app desde el navegador Chrome de tu celular."
          />
          <Step
            number={2}
            icon={<MoreVertical className="size-5" />}
            title="Tocá el menú (los tres puntos)"
            description="Arriba a la derecha de la pantalla."
          />
          <Step
            number={3}
            icon={<Download className="size-5" />}
            title='Elegí "Instalar aplicación" o "Agregar a pantalla de inicio"'
            description="El texto puede variar un poco según la versión de Chrome."
          />
        </CardContent>
      </Card>

      <p className="text-center text-sm text-muted">
        <Link href="/login" className="font-medium text-accent hover:underline">
          Volver a iniciar sesión
        </Link>
      </p>
    </div>
  );
}
