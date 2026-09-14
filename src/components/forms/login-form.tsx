"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { loginAction, type LoginState } from "@/actions/auth";
import { ResendVerificationForm } from "@/components/forms/resend-verification-form";

export function LoginForm({ from }: { from: string }) {
  const [state, formAction, isPending] = useActionState<LoginState, FormData>(loginAction, undefined);

  return (
    <div className="space-y-4">
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="from" value={from} />
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="mt-1.5"
          />
        </div>
        <div>
          <div className="flex items-baseline justify-between">
            <Label htmlFor="password">Contraseña</Label>
            <Link href="/recuperar-contrasena" className="text-xs text-accent hover:underline">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="mt-1.5"
          />
        </div>
        {state?.error && <p className="text-sm text-danger">{state.error}</p>}
        <Button type="submit" size="lg" className="w-full" disabled={isPending}>
          {isPending ? "Ingresando..." : "Ingresar"}
        </Button>
      </form>

      {state?.unverifiedEmail && (
        <div className="rounded-lg border border-border bg-surface-2 p-3">
          <ResendVerificationForm email={state.unverifiedEmail} />
        </div>
      )}
    </div>
  );
}
