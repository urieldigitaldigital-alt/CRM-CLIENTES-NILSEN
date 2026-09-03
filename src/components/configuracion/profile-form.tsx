"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { updateProfile, type ProfileFormState } from "@/actions/settings";
import { Spinner } from "@/components/ui/spinner";

export function ProfileForm({
  name,
  email,
  timezone,
  dateFormat,
}: {
  name: string;
  email: string;
  timezone: string;
  dateFormat: string;
}) {
  const [state, formAction, isPending] = useActionState<ProfileFormState, FormData>(updateProfile, undefined);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !isPending && !state?.error) {
      toast.success("Perfil actualizado");
    }
    wasPending.current = isPending;
  }, [isPending, state]);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="name">Nombre</Label>
          <Input id="name" name="name" defaultValue={name} required className="mt-1.5" />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" defaultValue={email} required className="mt-1.5" />
        </div>
        <div>
          <Label htmlFor="timezone">Zona horaria</Label>
          <Input id="timezone" name="timezone" defaultValue={timezone} className="mt-1.5" />
        </div>
        <div>
          <Label htmlFor="dateFormat">Formato de fecha</Label>
          <Input id="dateFormat" name="dateFormat" defaultValue={dateFormat} className="mt-1.5" />
        </div>
      </div>
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      <Button type="submit" disabled={isPending}>
        {isPending && <Spinner className="size-3.5" />}
        {isPending ? "Guardando..." : "Guardar cambios"}
      </Button>
    </form>
  );
}
