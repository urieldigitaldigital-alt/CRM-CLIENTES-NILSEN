"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Mail } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { sendUserMessageAction, type SendMessageState } from "@/actions/admin";

export function SendMessageDialog({ userId, email }: { userId: string; email: string }) {
  const [open, setOpen] = useState(false);
  const action = sendUserMessageAction.bind(null, userId);
  const [state, formAction, isPending] = useActionState<SendMessageState, FormData>(action, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs">
          <Mail className="size-3.5" /> Mensaje
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enviar mensaje</DialogTitle>
          <DialogDescription>Le va a llegar por email a {email}, como si fuera de Operaciones.</DialogDescription>
        </DialogHeader>
        <form ref={formRef} action={formAction} className="space-y-4">
          <div>
            <Label htmlFor="subject">Asunto</Label>
            <Input id="subject" name="subject" required className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="message">Mensaje</Label>
            <Textarea id="message" name="message" rows={6} required className="mt-1.5" />
          </div>
          {state?.error && <p className="text-sm text-danger">{state.error}</p>}
          {state?.success && <p className="text-sm text-success">{state.success}</p>}
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending && <Spinner className="size-3.5" />}
              {isPending ? "Enviando..." : "Enviar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
