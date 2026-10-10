"use client";

import { useActionState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { activateSubscriptionAction, type ActivateSubscriptionState } from "@/actions/admin";

export function ActivateByEmailForm() {
  const [state, formAction, isPending] = useActionState<ActivateSubscriptionState, FormData>(
    activateSubscriptionAction,
    undefined
  );

  return (
    <div>
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
    </div>
  );
}
