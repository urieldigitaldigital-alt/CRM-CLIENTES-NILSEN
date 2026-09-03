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
import { createPayment, updatePayment, type PaymentFormState } from "@/actions/payments";
import { PAYMENT_STATUS_LABEL, PAYMENT_REMINDER_OPTIONS } from "@/lib/constants";
import { PaymentStatus } from "@prisma/client";
import type { ClientOption } from "@/components/forms/task-form";
import { Spinner } from "@/components/ui/spinner";

type PaymentDefaults = {
  id?: string;
  clientId?: string;
  service?: string | null;
  amount?: number;
  contractedDate?: Date | string | null;
  dueDate?: Date | string;
  status?: PaymentStatus;
  paymentMethod?: string | null;
  notes?: string | null;
  reminderOffsets?: string[];
};

function toDateInputValue(value?: Date | string | null) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

export function PaymentForm({
  clients,
  defaults,
  fixedClientId,
  onSuccess,
}: {
  clients: ClientOption[];
  defaults?: PaymentDefaults;
  fixedClientId?: string;
  onSuccess?: () => void;
}) {
  const isEdit = Boolean(defaults?.id);
  const action = isEdit ? updatePayment.bind(null, defaults!.id!) : createPayment;
  const [state, formAction, isPending] = useActionState<PaymentFormState, FormData>(action, undefined);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !isPending && !state?.error) {
      toast.success(isEdit ? "Cobro actualizado" : "Cobro creado");
      onSuccess?.();
    }
    wasPending.current = isPending;
  }, [isPending, state, isEdit, onSuccess]);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {!fixedClientId && (
          <div className="col-span-2">
            <Label htmlFor="clientId">Cliente *</Label>
            <Select name="clientId" defaultValue={defaults?.clientId} required>
              <SelectTrigger id="clientId" className="mt-1.5">
                <SelectValue placeholder="Elegí un cliente" />
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
          <Label htmlFor="service">Servicio</Label>
          <Input id="service" name="service" defaultValue={defaults?.service ?? ""} className="mt-1.5" />
        </div>
        <div className="col-span-2 sm:col-span-1">
          <Label htmlFor="amount">Importe (ARS) *</Label>
          <Input id="amount" name="amount" type="number" step="1" defaultValue={defaults?.amount ?? ""} required className="mt-1.5" />
        </div>
        <div className="col-span-2 sm:col-span-1">
          <Label htmlFor="contractedDate">Fecha de contratación</Label>
          <Input id="contractedDate" name="contractedDate" type="date" defaultValue={toDateInputValue(defaults?.contractedDate)} className="mt-1.5" />
        </div>
        <div className="col-span-2 sm:col-span-1">
          <Label htmlFor="dueDate">Fecha de vencimiento *</Label>
          <Input id="dueDate" name="dueDate" type="date" defaultValue={toDateInputValue(defaults?.dueDate)} required className="mt-1.5" />
        </div>
        <div className="col-span-2 sm:col-span-1">
          <Label htmlFor="status">Estado</Label>
          <Select name="status" defaultValue={defaults?.status ?? PaymentStatus.PENDIENTE}>
            <SelectTrigger id="status" className="mt-1.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.values(PaymentStatus).map((s) => (
                <SelectItem key={s} value={s}>
                  {PAYMENT_STATUS_LABEL[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <Label htmlFor="paymentMethod">Método de pago</Label>
          <Input id="paymentMethod" name="paymentMethod" defaultValue={defaults?.paymentMethod ?? ""} className="mt-1.5" />
        </div>
        <div className="col-span-2">
          <Label htmlFor="notes">Notas</Label>
          <Textarea id="notes" name="notes" defaultValue={defaults?.notes ?? ""} className="mt-1.5" rows={2} />
        </div>
      </div>

      <ReminderPicker options={PAYMENT_REMINDER_OPTIONS} defaultValues={defaults?.reminderOffsets} />

      {state?.error && <p className="text-sm text-danger">{state.error}</p>}

      <DialogFooter>
        <Button type="submit" disabled={isPending}>
          {isPending && <Spinner className="size-3.5" />}
          {isPending ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear cobro"}
        </Button>
      </DialogFooter>
    </form>
  );
}
