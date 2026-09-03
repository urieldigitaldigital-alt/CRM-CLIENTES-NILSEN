"use server";

import { z } from "zod";
import { addMonths } from "date-fns";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { ActivityType, Payment, PaymentStatus, ReminderTargetType } from "@prisma/client";
import { computeRemindAt } from "@/lib/reminders";
import { formatDate, parseDateOnly } from "@/lib/format";

const paymentSchema = z.object({
  clientId: z.string().min(1, "Elegí un cliente"),
  service: z.string().optional(),
  amount: z.coerce.number().positive("El importe debe ser mayor a 0"),
  contractedDate: z.string().optional(),
  dueDate: z.string().min(1, "La fecha de vencimiento es obligatoria"),
  status: z.nativeEnum(PaymentStatus),
  paymentMethod: z.string().optional(),
  notes: z.string().optional(),
  isRecurring: z.string().optional(),
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

/**
 * When a recurring payment gets marked PAGADO, auto-generate next month's
 * payment (same client/amount/service, same reminder offsets) so "pago hoy"
 * alone sets up the reminder that fires again ~30 days out. Guarded against
 * duplicates: a payment only ever spawns one follow-up.
 */
async function createRecurringFollowUp(payment: Payment) {
  if (!payment.isRecurring) return;

  const alreadyGenerated = await prisma.payment.findFirst({
    where: { recurringParentId: payment.id },
    select: { id: true },
  });
  if (alreadyGenerated) return;

  const nextDueDate = addMonths(payment.dueDate, 1);

  const previousReminders = await prisma.reminder.findMany({
    where: { paymentId: payment.id },
    select: { offsetLabel: true },
    distinct: ["offsetLabel"],
  });

  const nextPayment = await prisma.payment.create({
    data: {
      userId: payment.userId,
      clientId: payment.clientId,
      service: payment.service,
      amount: payment.amount,
      contractedDate: payment.contractedDate,
      dueDate: nextDueDate,
      status: PaymentStatus.PENDIENTE,
      paymentMethod: payment.paymentMethod,
      notes: payment.notes,
      isRecurring: true,
      recurringParentId: payment.id,
    },
  });

  for (const r of previousReminders) {
    await prisma.reminder.create({
      data: {
        targetType: ReminderTargetType.PAYMENT,
        paymentId: nextPayment.id,
        offsetLabel: r.offsetLabel,
        remindAt: computeRemindAt(nextDueDate, r.offsetLabel),
      },
    });
  }

  await prisma.activityLog.create({
    data: {
      userId: payment.userId,
      clientId: payment.clientId,
      paymentId: nextPayment.id,
      type: ActivityType.PAGO_RECURRENTE_GENERADO,
      message: `Cobro recurrente generado automáticamente: $${payment.amount.toLocaleString("es-AR")} vence ${formatDate(nextDueDate)}`,
    },
  });
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
  const isRecurring = data.isRecurring === "on";

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
      isRecurring,
    },
  });

  await syncReminders(payment.id, dueDate, offsets);

  await prisma.activityLog.create({
    data: {
      userId: user.id,
      clientId: data.clientId,
      paymentId: payment.id,
      type: ActivityType.PAGO_REGISTRADO,
      message: `Cobro registrado: $${data.amount.toLocaleString("es-AR")}${isRecurring ? " (recurrente mensual)" : ""}`,
    },
  });

  if (data.status === PaymentStatus.PAGADO && isRecurring) {
    await createRecurringFollowUp(payment);
  }

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
  const isRecurring = data.isRecurring === "on";

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
      isRecurring,
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
    if (isRecurring) {
      await createRecurringFollowUp(payment);
    }
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
  if (existing.status !== PaymentStatus.PAGADO && payment.isRecurring) {
    await createRecurringFollowUp(payment);
  }
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
