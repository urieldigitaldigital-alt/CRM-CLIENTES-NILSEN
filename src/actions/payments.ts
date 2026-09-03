"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { ActivityType, PaymentStatus, ReminderTargetType } from "@prisma/client";
import { computeRemindAt } from "@/lib/reminders";
import { parseDateOnly } from "@/lib/format";

const paymentSchema = z.object({
  clientId: z.string().min(1, "Elegí un cliente"),
  service: z.string().optional(),
  amount: z.coerce.number().positive("El importe debe ser mayor a 0"),
  contractedDate: z.string().optional(),
  dueDate: z.string().min(1, "La fecha de vencimiento es obligatoria"),
  status: z.nativeEnum(PaymentStatus),
  paymentMethod: z.string().optional(),
  notes: z.string().optional(),
});

export type PaymentFormState = { error?: string } | undefined;

async function syncReminders(paymentId: string, dueDate: Date, offsets: string[]) {
  await prisma.reminder.deleteMany({ where: { paymentId, sentAt: null } });
  for (const code of offsets) {
    await prisma.reminder.create({
      data: {
        targetType: ReminderTargetType.PAYMENT,
        paymentId,
        offsetLabel: code,
        remindAt: computeRemindAt(dueDate, code),
      },
    });
  }
}

export async function createPayment(
  _prevState: PaymentFormState,
  formData: FormData
): Promise<PaymentFormState> {
  const user = await requireUser();
  const raw = Object.fromEntries(formData.entries());
  const parsed = paymentSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  const offsets = formData.getAll("reminders").map(String);
  const data = parsed.data;
  const dueDate = parseDateOnly(data.dueDate);

  const payment = await prisma.payment.create({
    data: {
      userId: user.id,
      clientId: data.clientId,
      service: data.service || null,
      amount: data.amount,
      contractedDate: data.contractedDate ? parseDateOnly(data.contractedDate) : null,
      dueDate,
      status: data.status,
      paidDate: data.status === PaymentStatus.PAGADO ? new Date() : null,
      paymentMethod: data.paymentMethod || null,
      notes: data.notes || null,
    },
  });

  await syncReminders(payment.id, dueDate, offsets);

  await prisma.activityLog.create({
    data: {
      userId: user.id,
      clientId: data.clientId,
      paymentId: payment.id,
      type: ActivityType.PAGO_REGISTRADO,
      message: `Cobro registrado: $${data.amount.toLocaleString("es-AR")}`,
    },
  });

  revalidatePath("/cobros");
  revalidatePath("/dashboard");
  revalidatePath("/calendario");
  revalidatePath(`/clientes/${data.clientId}`);
  return undefined;
}

export async function updatePayment(
  id: string,
  _prevState: PaymentFormState,
  formData: FormData
): Promise<PaymentFormState> {
  const user = await requireUser();
  const existing = await prisma.payment.findFirst({ where: { id, userId: user.id } });
  if (!existing) return { error: "Cobro no encontrado" };

  const raw = Object.fromEntries(formData.entries());
  const parsed = paymentSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  const offsets = formData.getAll("reminders").map(String);
  const data = parsed.data;
  const dueDate = parseDateOnly(data.dueDate);

  const payment = await prisma.payment.update({
    where: { id },
    data: {
      clientId: data.clientId,
      service: data.service || null,
      amount: data.amount,
      contractedDate: data.contractedDate ? parseDateOnly(data.contractedDate) : null,
      dueDate,
      status: data.status,
      paidDate:
        data.status === PaymentStatus.PAGADO ? existing.paidDate ?? new Date() : null,
      paymentMethod: data.paymentMethod || null,
      notes: data.notes || null,
    },
  });

  await syncReminders(payment.id, dueDate, offsets);

  if (existing.status !== PaymentStatus.PAGADO && data.status === PaymentStatus.PAGADO) {
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        clientId: data.clientId,
        paymentId: payment.id,
        type: ActivityType.PAGO_COBRADO,
        message: `Pago cobrado: $${data.amount.toLocaleString("es-AR")}`,
      },
    });
  }

  revalidatePath("/cobros");
  revalidatePath("/dashboard");
  revalidatePath("/calendario");
  revalidatePath(`/clientes/${data.clientId}`);
  return undefined;
}

export async function markPaymentPaid(id: string) {
  const user = await requireUser();
  const existing = await prisma.payment.findFirst({ where: { id, userId: user.id } });
  if (!existing) throw new Error("No autorizado");
  const payment = await prisma.payment.update({
    where: { id },
    data: { status: PaymentStatus.PAGADO, paidDate: new Date() },
  });
  await prisma.activityLog.create({
    data: {
      userId: user.id,
      clientId: payment.clientId,
      paymentId: payment.id,
      type: ActivityType.PAGO_COBRADO,
      message: `Pago cobrado: $${payment.amount.toLocaleString("es-AR")}`,
    },
  });
  revalidatePath("/cobros");
  revalidatePath("/dashboard");
  revalidatePath(`/clientes/${payment.clientId}`);
}

export async function deletePayment(id: string) {
  const user = await requireUser();
  await prisma.payment.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/cobros");
  revalidatePath("/dashboard");
}
