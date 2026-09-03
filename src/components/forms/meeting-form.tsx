"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { ReminderPicker } from "@/components/forms/reminder-picker";
import { createMeeting, updateMeeting, type MeetingFormState } from "@/actions/meetings";
import { TASK_REMINDER_OPTIONS } from "@/lib/constants";
import { toDateTimeLocalValue } from "@/lib/format";
import type { ClientOption } from "@/components/forms/task-form";
import { Spinner } from "@/components/ui/spinner";

type MeetingDefaults = {
  id?: string;
  title?: string;
  clientId?: string | null;
  date?: Date | string;
  durationMin?: number;
  meetingLink?: string | null;
  notes?: string | null;
  reminderOffsets?: string[];
};

export function MeetingForm({
  clients,
  defaults,
  fixedClientId,
  onSuccess,
}: {
  clients: ClientOption[];
  defaults?: MeetingDefaults;
  fixedClientId?: string;
  onSuccess?: () => void;
}) {
  const isEdit = Boolean(defaults?.id);
  const action = isEdit ? updateMeeting.bind(null, defaults!.id!) : createMeeting;
  const [state, formAction, isPending] = useActionState<MeetingFormState, FormData>(action, undefined);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !isPending && !state?.error) {
      toast.success(isEdit ? "Reunión actualizada" : "Reunión creada");
      onSuccess?.();
    }
    wasPending.current = isPending;
  }, [isPending, state, isEdit, onSuccess]);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <Label htmlFor="title">Título *</Label>
        <Input id="title" name="title" defaultValue={defaults?.title} required className="mt-1.5" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {!fixedClientId && (
          <div className="col-span-2">
            <Label htmlFor="clientId">Cliente</Label>
            <Select name="clientId" defaultValue={defaults?.clientId ?? undefined}>
              <SelectTrigger id="clientId" className="mt-1.5">
                <SelectValue placeholder="Sin cliente asociado" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.companyName ?? c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        {fixedClientId && <input type="hidden" name="clientId" value={fixedClientId} />}
        <div className="col-span-2 sm:col-span-1">
          <Label htmlFor="date">Fecha y hora *</Label>
          <Input
            id="date"
            name="date"
            type="datetime-local"
            defaultValue={defaults?.date ? toDateTimeLocalValue(defaults.date) : ""}
            required
            className="mt-1.5"
          />
        </div>
        <div className="col-span-2 sm:col-span-1">
          <Label htmlFor="durationMin">Duración (min)</Label>
          <Input
            id="durationMin"
            name="durationMin"
            type="number"
            step="5"
            defaultValue={defaults?.durationMin ?? 30}
            className="mt-1.5"
          />
        </div>
        <div className="col-span-2">
          <Label htmlFor="meetingLink">Link de reunión</Label>
          <Input id="meetingLink" name="meetingLink" defaultValue={defaults?.meetingLink ?? ""} placeholder="https://meet.google.com/..." className="mt-1.5" />
        </div>
        <div className="col-span-2">
          <Label htmlFor="notes">Notas</Label>
          <Textarea id="notes" name="notes" defaultValue={defaults?.notes ?? ""} className="mt-1.5" rows={2} />
        </div>
      </div>

      <ReminderPicker options={TASK_REMINDER_OPTIONS} defaultValues={defaults?.reminderOffsets} />

      {state?.error && <p className="text-sm text-danger">{state.error}</p>}

      <DialogFooter>
        <Button type="submit" disabled={isPending}>
          {isPending && <Spinner className="size-3.5" />}
          {isPending ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear reunión"}
        </Button>
      </DialogFooter>
    </form>
  );
}
