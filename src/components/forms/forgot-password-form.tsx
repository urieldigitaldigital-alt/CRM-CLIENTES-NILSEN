"use client";

import { useActionState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { requestPasswordResetAction, type RequestPasswordResetState } from "@/actions/auth";

export function ForgotPasswordForm() {
  const [state, formAction, isPending] = useActionState<RequestPasswordResetState, FormData>(
    requestPasswordResetAction,
    undefined
  );

  if (state?.sent) {
    return (
      <p className="text-sm text-success">
        Si existe una cuenta con ese email, te mandamos un enlace para restablecer tu contraseña.
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required className="mt-1.5" />
      </div>
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      <Button type="submit" size="lg" className="w-full" disabled={isPending}>
        {isPending ? "Enviando..." : "Enviar enlace de recuperación"}
      </Button>
    </form>
  );
}
