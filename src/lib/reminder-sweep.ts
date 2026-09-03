import { prisma } from "@/lib/prisma";
import { sendPushToUser } from "@/lib/push";
import {
  meetingReminderMessage,
  paymentOverdueMessage,
  paymentReminderMessage,
  taskReminderMessage,
} from "@/lib/reminders";
import { NotificationType, PaymentStatus } from "@prisma/client";

export interface SweepResult {
  remindersSent: number;
  paymentsMarkedOverdue: number;
}

/**
 * Core reminder logic, shared by the local dev cron (scripts/reminder-cron.ts)
 * and the /api/cron/check-reminders endpoint a production scheduler would call.
 *
 * For each due, unsent Reminder: build the message, create the in-app
 * notification, send a real Web Push, then mark it sent — in that order, so a
 * crash before the final update just means the next tick retries instead of
 * silently dropping the reminder. The sentAt guard on the query is what makes
 * re-running this safe (no double sends) if the tick overlaps.
 */
export async function runReminderSweep(): Promise<SweepResult> {
  const now = new Date();

  const dueReminders = await prisma.reminder.findMany({
    where: { sentAt: null, remindAt: { lte: now } },
    include: {
      task: { include: { client: true } },
      meeting: { include: { client: true } },
      payment: { include: { client: true } },
    },
  });

  let remindersSent = 0;

  for (const reminder of dueReminders) {
    let userId: string | null = null;
    let notificationType: NotificationType = NotificationType.GENERAL;
    let message: { title: string; body: string } | null = null;
    let link = "/notificaciones";

    if (reminder.targetType === "TASK" && reminder.task) {
      userId = reminder.task.userId;
      notificationType = NotificationType.TASK;
      link = "/tareas";
      message = taskReminderMessage({
        offsetCode: reminder.offsetLabel,
        title: reminder.task.title,
        clientName: reminder.task.client?.companyName ?? reminder.task.client?.name,
      });
    } else if (reminder.targetType === "MEETING" && reminder.meeting) {
      userId = reminder.meeting.userId;
      notificationType = NotificationType.MEETING;
      link = "/calendario";
      message = meetingReminderMessage({
        offsetCode: reminder.offsetLabel,
        title: reminder.meeting.title,
        clientName: reminder.meeting.client?.companyName ?? reminder.meeting.client?.name,
      });
    } else if (reminder.targetType === "PAYMENT" && reminder.payment) {
      userId = reminder.payment.userId;
      notificationType = NotificationType.PAYMENT_UPCOMING;
      link = "/cobros";
      message = paymentReminderMessage({
        offsetCode: reminder.offsetLabel,
        clientName: reminder.payment.client.companyName ?? reminder.payment.client.name,
        amountLabel: `$${reminder.payment.amount.toLocaleString("es-AR")}`,
      });
    }

    if (!userId || !message) {
      // Orphaned reminder (parent was deleted) — mark sent so it stops matching.
      await prisma.reminder.update({ where: { id: reminder.id }, data: { sentAt: now } });
      continue;
    }

    await prisma.notification.create({
      data: { userId, type: notificationType, title: message.title, body: message.body, link },
    });
    await sendPushToUser(userId, { ...message, url: link, tag: reminder.id });
    await prisma.reminder.update({ where: { id: reminder.id }, data: { sentAt: now } });
    remindersSent += 1;
  }

  const overduePayments = await prisma.payment.findMany({
    where: { status: PaymentStatus.PENDIENTE, dueDate: { lt: now } },
    include: { client: true },
  });

  for (const payment of overduePayments) {
    await prisma.payment.update({ where: { id: payment.id }, data: { status: PaymentStatus.VENCIDO } });
    const message = paymentOverdueMessage({
      clientName: payment.client.companyName ?? payment.client.name,
      amountLabel: `$${payment.amount.toLocaleString("es-AR")}`,
    });
    await prisma.notification.create({
      data: {
        userId: payment.userId,
        type: NotificationType.PAYMENT_OVERDUE,
        title: message.title,
        body: message.body,
        link: "/cobros",
      },
    });
    await sendPushToUser(payment.userId, { ...message, url: "/cobros", tag: `overdue-${payment.id}` });
  }

  return { remindersSent, paymentsMarkedOverdue: overduePayments.length };
}
