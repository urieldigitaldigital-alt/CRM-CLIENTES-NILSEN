"use client";

import { useActionState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { resetPasswordAction, type ResetPasswordState } from "@/actions/auth";

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, isPending] = useActionState<ResetPasswordState, FormData>(
    resetPasswordAction,
    undefined
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <div>
        <Label htmlFor="password">Nueva contraseña</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className="mt-1.5"
        />
        <p className="mt-1 text-xs text-muted">Mínimo 8 caracteres.</p>
      </div>
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      <Button type="submit" size="lg" className="w-full" disabled={isPending}>
        {isPending ? "Guardando..." : "Guardar nueva contraseña"}
      </Button>
    </form>
  );
}
