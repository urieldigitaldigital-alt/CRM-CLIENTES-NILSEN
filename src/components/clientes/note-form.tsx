"use client";

import { useRef, useTransition } from "react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { addClientNote } from "@/actions/clients";
import { Spinner } from "@/components/ui/spinner";

export function NoteForm({ clientId }: { clientId: string }) {
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(formData: FormData) {
    const content = String(formData.get("content") ?? "");
    if (!content.trim()) return;
    startTransition(async () => {
      await addClientNote(clientId, content);
      formRef.current?.reset();
      toast.success("Nota agregada");
    });
  }

  return (
    <form ref={formRef} action={handleSubmit} className="flex flex-col gap-2">
      <Textarea name="content" placeholder="Escribí una nota sobre este cliente..." rows={2} required />
      <Button type="submit" size="sm" className="self-end" disabled={isPending}>
        {isPending && <Spinner className="size-3.5" />}
        {isPending ? "Guardando..." : "Agregar nota"}
      </Button>
    </form>
  );
}
