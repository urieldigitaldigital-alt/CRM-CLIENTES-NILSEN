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
import { createTask, updateTask, type TaskFormState } from "@/actions/tasks";
import { PRIORITY_LABEL, TASK_STATUS_LABEL, TASK_REMINDER_OPTIONS } from "@/lib/constants";
import { Priority, TaskStatus } from "@prisma/client";
import { toDateTimeLocalValue } from "@/lib/format";
import { Spinner } from "@/components/ui/spinner";

export interface ClientOption {
  id: string;
  name: string;
  companyName: string | null;
}

type TaskDefaults = {
  id?: string;
  title?: string;
  description?: string | null;
  clientId?: string | null;
  date?: Date | string;
  priority?: Priority;
  status?: TaskStatus;
  reminderOffsets?: string[];
};

export function TaskForm({
  clients,
  defaults,
  fixedClientId,
  onSuccess,
}: {
  clients: ClientOption[];
  defaults?: TaskDefaults;
  fixedClientId?: string;
  onSuccess?: () => void;
}) {
  const isEdit = Boolean(defaults?.id);
  const action = isEdit ? updateTask.bind(null, defaults!.id!) : createTask;
  const [state, formAction, isPending] = useActionState<TaskFormState, FormData>(action, undefined);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !isPending && !state?.error) {
      toast.success(isEdit ? "Tarea actualizada" : "Tarea creada");
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
      <div>
        <Label htmlFor="description">Descripción</Label>
        <Textarea id="description" name="description" defaultValue={defaults?.description ?? ""} className="mt-1.5" rows={2} />
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
          <Label htmlFor="priority">Prioridad</Label>
          <Select name="priority" defaultValue={defaults?.priority ?? Priority.MEDIA}>
            <SelectTrigger id="priority" className="mt-1.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.values(Priority).map((p) => (
                <SelectItem key={p} value={p}>
                  {PRIORITY_LABEL[p]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <Label htmlFor="status">Estado</Label>
          <Select name="status" defaultValue={defaults?.status ?? TaskStatus.PENDIENTE}>
            <SelectTrigger id="status" className="mt-1.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.values(TaskStatus).map((s) => (
                <SelectItem key={s} value={s}>
                  {TASK_STATUS_LABEL[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <ReminderPicker options={TASK_REMINDER_OPTIONS} defaultValues={defaults?.reminderOffsets} />

      {state?.error && <p className="text-sm text-danger">{state.error}</p>}

      <DialogFooter>
        <Button type="submit" disabled={isPending}>
          {isPending && <Spinner className="size-3.5" />}
          {isPending ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear tarea"}
        </Button>
      </DialogFooter>
    </form>
  );
}
