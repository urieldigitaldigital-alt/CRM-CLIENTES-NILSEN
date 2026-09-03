"use client";

import { RowActions } from "@/components/shared/row-actions";
import { PaymentForm } from "@/components/forms/payment-form";
import type { ClientOption } from "@/components/forms/task-form";
import { deletePayment } from "@/actions/payments";
import type { PaymentStatus } from "@prisma/client";

interface PaymentDefaults {
  id: string;
  clientId: string;
  service: string | null;
  amount: number;
  contractedDate: Date | null;
  dueDate: Date;
  status: PaymentStatus;
  paymentMethod: string | null;
  notes: string | null;
  isRecurring: boolean;
  reminders?: { offsetLabel: string }[];
}

export function PaymentRowActions({ payment, clients }: { payment: PaymentDefaults; clients: ClientOption[] }) {
  return (
    <RowActions
      editTitle="Editar cobro"
      editForm={
        <PaymentForm
          clients={clients}
          defaults={{ ...payment, reminderOffsets: payment.reminders?.map((r) => r.offsetLabel) }}
        />
      }
      deleteAction={() => deletePayment(payment.id)}
      deleteConfirm="¿Eliminar este cobro?"
      deleteSuccess="Cobro eliminado"
    />
  );
}
