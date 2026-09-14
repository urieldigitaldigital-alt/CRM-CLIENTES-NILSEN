"use client";

import { useActionState, useEffect, useRef, useState, type ChangeEvent } from "react";
import { toast } from "sonner";
import { Camera, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { createClient, updateClient, type ClientFormState } from "@/actions/clients";
import { CLIENT_STATUS_LABEL } from "@/lib/constants";
import { ClientStatus } from "@prisma/client";
import { Spinner } from "@/components/ui/spinner";
import { compressImageToDataUrl } from "@/lib/image";

type ClientDefaults = {
  id?: string;
  name?: string;
  companyName?: string | null;
  photoUrl?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  instagram?: string | null;
  website?: string | null;
  service?: string | null;
  price?: number | null;
  paymentMethod?: string | null;
  nextPaymentDate?: Date | string | null;
  status?: ClientStatus;
  startDate?: Date | string | null;
  notes?: string | null;
};

function toDateInputValue(value?: Date | string | null) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

export function ClientForm({
  defaults,
  onSuccess,
}: {
  defaults?: ClientDefaults;
  onSuccess?: () => void;
}) {
  const isEdit = Boolean(defaults?.id);
  const action = isEdit
    ? updateClient.bind(null, defaults!.id!)
    : createClient;
  const [state, formAction, isPending] = useActionState<ClientFormState, FormData>(
    action,
    undefined
  );
  const wasPending = useRef(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(defaults?.photoUrl ?? null);
  const [photoError, setPhotoError] = useState<string | null>(null);

  useEffect(() => {
    if (wasPending.current && !isPending && !state?.error) {
      toast.success(isEdit ? "Cliente actualizado" : "Cliente creado");
      onSuccess?.();
    }
    wasPending.current = isPending;
  }, [isPending, state, isEdit, onSuccess]);

  async function handlePhotoChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoError(null);
    try {
      const dataUrl = await compressImageToDataUrl(file);
      setPhotoUrl(dataUrl);
    } catch {
      setPhotoError("No pudimos procesar esa imagen. Probá con otra.");
    }
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="photoUrl" value={photoUrl ?? ""} />

      <div className="flex items-center gap-4">
        <div className="relative">
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- data: URI preview, not an optimizable remote image
            <img src={photoUrl} alt="" className="size-16 rounded-full object-cover" />
          ) : (
            <div className="flex size-16 items-center justify-center rounded-full bg-surface-2 text-muted">
              <Camera className="size-6" />
            </div>
          )}
          {photoUrl && (
            <button
              type="button"
              onClick={() => setPhotoUrl(null)}
              className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-danger text-white"
              aria-label="Quitar foto"
            >
              <X className="size-3" />
            </button>
          )}
        </div>
        <div>
          <Label htmlFor="photo" className="cursor-pointer text-sm font-medium text-accent hover:underline">
            {photoUrl ? "Cambiar foto" : "Agregar foto del negocio"}
          </Label>
          <input
            id="photo"
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            className="hidden"
          />
          <p className="mt-0.5 text-xs text-muted">Opcional. Ayuda a reconocer al cliente de un vistazo.</p>
          {photoError && <p className="mt-1 text-xs text-danger">{photoError}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 sm:col-span-1">
          <Label htmlFor="name">Nombre *</Label>
          <Input id="name" name="name" defaultValue={defaults?.name} required className="mt-1.5" />
        </div>
        <div className="col-span-2 sm:col-span-1">
          <Label htmlFor="companyName">Empresa</Label>
          <Input id="companyName" name="companyName" defaultValue={defaults?.companyName ?? ""} className="mt-1.5" />
        </div>
        <div className="col-span-2 sm:col-span-1">
          <Label htmlFor="whatsapp">WhatsApp</Label>
          <Input id="whatsapp" name="whatsapp" defaultValue={defaults?.whatsapp ?? ""} className="mt-1.5" placeholder="+54 9 11 ..." />
        </div>
        <div className="col-span-2 sm:col-span-1">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" defaultValue={defaults?.email ?? ""} className="mt-1.5" />
        </div>
        <div className="col-span-2 sm:col-span-1">
          <Label htmlFor="instagram">Instagram</Label>
          <Input id="instagram" name="instagram" defaultValue={defaults?.instagram ?? ""} className="mt-1.5" placeholder="@usuario" />
        </div>
        <div className="col-span-2 sm:col-span-1">
          <Label htmlFor="website">Sitio web</Label>
          <Input id="website" name="website" defaultValue={defaults?.website ?? ""} className="mt-1.5" />
        </div>
        <div className="col-span-2 sm:col-span-1">
          <Label htmlFor="service">Servicio contratado</Label>
          <Input id="service" name="service" defaultValue={defaults?.service ?? ""} className="mt-1.5" />
        </div>
        <div className="col-span-2 sm:col-span-1">
          <Label htmlFor="price">Precio del servicio</Label>
          <Input id="price" name="price" type="number" step="1" defaultValue={defaults?.price ?? ""} className="mt-1.5" />
        </div>
        <div className="col-span-2 sm:col-span-1">
          <Label htmlFor="paymentMethod">Método de pago</Label>
          <Input id="paymentMethod" name="paymentMethod" defaultValue={defaults?.paymentMethod ?? ""} className="mt-1.5" placeholder="Transferencia, MercadoPago..." />
        </div>
        <div className="col-span-2 sm:col-span-1">
          <Label htmlFor="nextPaymentDate">Próxima fecha de pago</Label>
          <Input id="nextPaymentDate" name="nextPaymentDate" type="date" defaultValue={toDateInputValue(defaults?.nextPaymentDate)} className="mt-1.5" />
        </div>
        <div className="col-span-2 sm:col-span-1">
          <Label htmlFor="startDate">Fecha de inicio</Label>
          <Input id="startDate" name="startDate" type="date" defaultValue={toDateInputValue(defaults?.startDate)} className="mt-1.5" />
        </div>
        <div className="col-span-2 sm:col-span-1">
          <Label htmlFor="status">Estado</Label>
          <Select name="status" defaultValue={defaults?.status ?? ClientStatus.PROSPECTO}>
            <SelectTrigger id="status" className="mt-1.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.values(ClientStatus).map((s) => (
                <SelectItem key={s} value={s}>
                  {CLIENT_STATUS_LABEL[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-2">
          <Label htmlFor="notes">Notas</Label>
          <Textarea id="notes" name="notes" defaultValue={defaults?.notes ?? ""} className="mt-1.5" rows={3} />
        </div>
      </div>

      {state?.error && <p className="text-sm text-danger">{state.error}</p>}

      <DialogFooter>
        <Button type="submit" disabled={isPending}>
          {isPending && <Spinner className="size-3.5" />}
          {isPending ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear cliente"}
        </Button>
      </DialogFooter>
    </form>
  );
}
