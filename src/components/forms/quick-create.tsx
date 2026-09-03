"use client";

import { useState } from "react";
import { Plus, Users, CheckSquare, Wallet, Calendar, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ClientForm } from "@/components/forms/client-form";
import { TaskForm, type ClientOption } from "@/components/forms/task-form";
import { MeetingForm } from "@/components/forms/meeting-form";
import { PaymentForm } from "@/components/forms/payment-form";

type QuickCreateType = "cliente" | "tarea" | "reunion" | "cobro";

const OPTIONS: { type: QuickCreateType; label: string; icon: typeof Plus; description: string }[] = [
  { type: "tarea", label: "Nueva tarea", icon: CheckSquare, description: "Con fecha, prioridad y recordatorios" },
  { type: "cliente", label: "Nuevo cliente", icon: Users, description: "Alta rápida de un prospecto o cliente" },
  { type: "cobro", label: "Nuevo cobro", icon: Wallet, description: "Registrar un pago pendiente" },
  { type: "reunion", label: "Nueva reunión", icon: Calendar, description: "Agendar con link y recordatorio" },
];

const TITLES: Record<QuickCreateType, string> = {
  cliente: "Nuevo cliente",
  tarea: "Nueva tarea",
  reunion: "Nueva reunión",
  cobro: "Nuevo cobro",
};

export function QuickCreate({ clients }: { clients: ClientOption[] }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<QuickCreateType | null>(null);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) setSelected(null);
  }

  function handleSuccess() {
    setOpen(false);
    setSelected(null);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Button onClick={() => setOpen(true)} size="sm" className="gap-1.5">
        <Plus className="size-4" />
        <span className="hidden sm:inline">Crear</span>
      </Button>
      <DialogContent>
        {!selected ? (
          <>
            <DialogHeader>
              <DialogTitle>¿Qué querés crear?</DialogTitle>
              <DialogDescription>Elegí un tipo para cargarlo sin salir de esta pantalla.</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-2">
              {OPTIONS.map((opt) => (
                <button
                  key={opt.type}
                  onClick={() => setSelected(opt.type)}
                  className="flex flex-col items-start gap-2 rounded-lg border border-border p-3.5 text-left transition-colors hover:border-accent hover:bg-accent-soft"
                >
                  <opt.icon className="size-5 text-accent" />
                  <span className="text-sm font-semibold">{opt.label}</span>
                  <span className="text-xs text-muted">{opt.description}</span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <button
                onClick={() => setSelected(null)}
                className="mb-1 flex items-center gap-1 text-xs font-medium text-muted hover:text-foreground"
              >
                <ChevronLeft className="size-3.5" />
                Volver
              </button>
              <DialogTitle>{TITLES[selected]}</DialogTitle>
            </DialogHeader>
            {selected === "cliente" && <ClientForm onSuccess={handleSuccess} />}
            {selected === "tarea" && <TaskForm clients={clients} onSuccess={handleSuccess} />}
            {selected === "reunion" && <MeetingForm clients={clients} onSuccess={handleSuccess} />}
            {selected === "cobro" && <PaymentForm clients={clients} onSuccess={handleSuccess} />}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
