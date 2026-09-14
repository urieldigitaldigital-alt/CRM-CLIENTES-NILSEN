"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { resendVerificationAction, type ResendVerificationState } from "@/actions/auth";

export function ResendVerificationForm({ email }: { email: string }) {
  const [state, formAction, isPending] = useActionState<ResendVerificationState, FormData>(
    resendVerificationAction,
    undefined
  );

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="email" value={email} />
      {state?.sent && (
        <p className="text-sm text-success">Te reenviamos el email. Revisá tu bandeja de entrada.</p>
      )}
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      <Button type="submit" variant="secondary" className="w-full" disabled={isPending}>
        {isPending ? "Enviando..." : "Reenviar email de verificación"}
      </Button>
    </form>
  );
}
