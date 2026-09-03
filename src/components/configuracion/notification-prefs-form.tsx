"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateNotificationPrefs } from "@/actions/settings";
import { Spinner } from "@/components/ui/spinner";

const TASK_OFFSETS = [
  { value: "PT15M", label: "15 minutos antes" },
  { value: "PT30M", label: "30 minutos antes" },
  { value: "PT1H", label: "1 hora antes" },
  { value: "PT2H", label: "2 horas antes" },
  { value: "PT3H", label: "3 horas antes" },
  { value: "PT6H", label: "6 horas antes" },
  { value: "PT12H", label: "12 horas antes" },
  { value: "P1D", label: "1 día antes" },
];

const PAYMENT_OFFSETS = [
  { value: "P7D", label: "7 días antes" },
  { value: "P3D", label: "3 días antes" },
  { value: "P1D", label: "1 día antes" },
  { value: "P0D", label: "El mismo día" },
];

interface Prefs {
  pushEnabled: boolean;
  taskReminders: boolean;
  meetingReminders: boolean;
  paymentReminders: boolean;
  defaultTaskReminder: string;
  defaultMeetingReminder: string;
  defaultPaymentReminder: string;
}

export function NotificationPrefsForm({ prefs }: { prefs: Prefs }) {
  const [, formAction, isPending] = useActionState<undefined, FormData>(updateNotificationPrefs, undefined);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !isPending) toast.success("Preferencias guardadas");
    wasPending.current = isPending;
  }, [isPending]);

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-3">
        <ToggleRow name="pushEnabled" label="Notificaciones push" description="Recibir avisos reales en el celular/navegador" defaultChecked={prefs.pushEnabled} />
        <ToggleRow name="taskReminders" label="Recordatorios de tareas" defaultChecked={prefs.taskReminders} />
        <ToggleRow name="meetingReminders" label="Recordatorios de reuniones" defaultChecked={prefs.meetingReminders} />
        <ToggleRow name="paymentReminders" label="Recordatorios de cobros" defaultChecked={prefs.paymentReminders} />
      </div>

      <div className="grid gap-4 border-t border-border pt-4 sm:grid-cols-3">
        <div>
          <Label htmlFor="defaultTaskReminder">Recordatorio predet. (tareas)</Label>
          <Select name="defaultTaskReminder" defaultValue={prefs.defaultTaskReminder}>
            <SelectTrigger id="defaultTaskReminder" className="mt-1.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TASK_OFFSETS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="defaultMeetingReminder">Recordatorio predet. (reuniones)</Label>
          <Select name="defaultMeetingReminder" defaultValue={prefs.defaultMeetingReminder}>
            <SelectTrigger id="defaultMeetingReminder" className="mt-1.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TASK_OFFSETS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="defaultPaymentReminder">Recordatorio predet. (cobros)</Label>
          <Select name="defaultPaymentReminder" defaultValue={prefs.defaultPaymentReminder}>
            <SelectTrigger id="defaultPaymentReminder" className="mt-1.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAYMENT_OFFSETS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending && <Spinner className="size-3.5" />}
        {isPending ? "Guardando..." : "Guardar preferencias"}
      </Button>
    </form>
  );
}

function ToggleRow({
  name,
  label,
  description,
  defaultChecked,
}: {
  name: string;
  label: string;
  description?: string;
  defaultChecked: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {description && <p className="text-xs text-muted">{description}</p>}
      </div>
      <Switch name={name} defaultChecked={defaultChecked} />
    </div>
  );
}
