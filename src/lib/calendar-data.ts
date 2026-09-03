import { prisma } from "@/lib/prisma";
import type { Priority, TaskStatus, PaymentStatus } from "@prisma/client";

export interface CalendarEvent {
  id: string;
  type: "task" | "meeting" | "payment";
  date: Date;
  title: string;
  clientId?: string | null;
  clientName?: string | null;
  priority?: Priority;
  taskStatus?: TaskStatus;
  paymentStatus?: PaymentStatus;
  detail?: string | null;
  amount?: number;
  meetingLink?: string | null;
  durationMin?: number;
}

export async function getCalendarEvents(userId: string, start: Date, end: Date): Promise<CalendarEvent[]> {
  const [tasks, meetings, payments] = await Promise.all([
    prisma.task.findMany({
      where: { userId, date: { gte: start, lt: end } },
      include: { client: true },
    }),
    prisma.meeting.findMany({
      where: { userId, date: { gte: start, lt: end } },
      include: { client: true },
    }),
    prisma.payment.findMany({
      where: { userId, dueDate: { gte: start, lt: end } },
      include: { client: true },
    }),
  ]);

  const events: CalendarEvent[] = [
    ...tasks.map((t) => ({
      id: `task-${t.id}`,
      type: "task" as const,
      date: t.date,
      title: t.title,
      clientId: t.client?.id,
      clientName: t.client?.companyName ?? t.client?.name,
      priority: t.priority,
      taskStatus: t.status,
      detail: t.description,
    })),
    ...meetings.map((m) => ({
      id: `meeting-${m.id}`,
      type: "meeting" as const,
      date: m.date,
      title: m.title,
      clientId: m.client?.id,
      clientName: m.client?.companyName ?? m.client?.name,
      detail: m.notes,
      meetingLink: m.meetingLink,
      durationMin: m.durationMin,
    })),
    ...payments.map((p) => ({
      id: `payment-${p.id}`,
      type: "payment" as const,
      date: p.dueDate,
      title: p.service ?? "Cobro",
      clientId: p.client.id,
      clientName: p.client.companyName ?? p.client.name,
      paymentStatus: p.status,
      amount: p.amount,
    })),
  ];

  return events.sort((a, b) => a.date.getTime() - b.date.getTime());
}
