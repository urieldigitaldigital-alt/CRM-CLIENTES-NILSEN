"use client";

import { useActionState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { activateSubscriptionAction, type ActivateSubscriptionState } from "@/actions/admin";

export function ActivateUserCard() {
  const [state, formAction, isPending] = useActionState<ActivateSubscriptionState, FormData>(
    activateSubscriptionAction,
    undefined
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activar suscripción (admin)</CardTitle>
        <CardDescription>
          Cuando alguien pague por el link de Mercado Pago, poné su email acá para darle acceso.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Label htmlFor="activate-email">Email del usuario</Label>
            <Input id="activate-email" name="email" type="email" required className="mt-1.5" />
          </div>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Activando..." : "Activar"}
          </Button>
        </form>
        {state?.error && <p className="mt-3 text-sm text-danger">{state.error}</p>}
        {state?.success && <p className="mt-3 text-sm text-success">{state.success}</p>}
      </CardContent>
    </Card>
  );
}
