"use client";

import { RowActions } from "@/components/shared/row-actions";
import { ClientForm } from "@/components/forms/client-form";
import { deleteClient } from "@/actions/clients";
import type { ClientStatus } from "@prisma/client";

interface ClientDefaults {
  id: string;
  name: string;
  companyName: string | null;
  whatsapp: string | null;
  email: string | null;
  instagram: string | null;
  website: string | null;
  service: string | null;
  price: number | null;
  paymentMethod: string | null;
  nextPaymentDate: Date | null;
  status: ClientStatus;
  startDate: Date | null;
  notes: string | null;
}

export function ClientRowActions({ client }: { client: ClientDefaults }) {
  return (
    <RowActions
      editTitle="Editar cliente"
      editForm={<ClientForm defaults={client} />}
      deleteAction={() => deleteClient(client.id)}
      deleteConfirm={`¿Eliminar a ${client.companyName ?? client.name}? Esta acción no se puede deshacer.`}
      deleteSuccess="Cliente eliminado"
    />
  );
}
