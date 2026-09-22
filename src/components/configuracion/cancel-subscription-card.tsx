"use client";

import Link from "next/link";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cancelSubscriptionAction } from "@/actions/billing";
import type { SubscriptionStatus } from "@prisma/client";

const LABELS: Record<SubscriptionStatus, string> = {
  ACTIVE: "Tu plan está activo — $13.000/mes.",
  EXEMPT: "Tenés acceso de cortesía, sin suscripción para cancelar.",
  PAST_DUE: "Tu último pago no se pudo procesar.",
  CANCELED: "No tenés una suscripción activa.",
  INCOMPLETE: "No tenés una suscripción activa.",
};

export function CancelSubscriptionCard({ status }: { status: SubscriptionStatus }) {
  const [isPending, startTransition] = useTransition();

  function handleCancel() {
    if (
      !window.confirm(
        "¿Seguro que querés cancelar tu suscripción? Vas a perder el acceso a la aplicación al instante."
      )
    ) {
      return;
    }
    startTransition(async () => {
      await cancelSubscriptionAction();
      toast.success("Suscripción cancelada.");
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Suscripción</CardTitle>
        <CardDescription>{LABELS[status]}</CardDescription>
      </CardHeader>
      <CardContent>
        {status === "ACTIVE" ? (
          <Button variant="destructive" onClick={handleCancel} disabled={isPending}>
            {isPending ? "Cancelando..." : "Cancelar suscripción"}
          </Button>
        ) : status === "PAST_DUE" || status === "CANCELED" || status === "INCOMPLETE" ? (
          <Button asChild variant="secondary">
            <Link href="/suscripcion">Gestionar suscripción</Link>
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
