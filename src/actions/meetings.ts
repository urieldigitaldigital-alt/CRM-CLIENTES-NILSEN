"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { ActivityType, ReminderTargetType } from "@prisma/client";
import { computeRemindAt } from "@/lib/reminders";
import { fromDateTimeLocalValue } from "@/lib/format";

const meetingSchema = z.object({
  title: z.string().min(1, "El título es obligatorio"),
  clientId: z.string().optional(),
  date: z.string().min(1, "La fecha y hora son obligatorias"),
  durationMin: z.coerce.number().min(5).default(30),
  meetingLink: z.string().optional(),
  notes: z.string().optional(),
});

export type MeetingFormState = { error?: string } | undefined;

async function syncReminders(meetingId: string, date: Date, offsets: string[]) {
  await prisma.reminder.deleteMany({ where: { meetingId, sentAt: null } });
  for (const code of offsets) {
    await prisma.reminder.create({
      data: {
        targetType: ReminderTargetType.MEETING,
        meetingId,
        offsetLabel: code,
        remindAt: computeRemindAt(date, code),
      },
    });
  }
}

export async function createMeeting(
  _prevState: MeetingFormState,
  formData: FormData
): Promise<MeetingFormState> {
  const user = await requireUser();
  const raw = Object.fromEntries(formData.entries());
  const parsed = meetingSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  const offsets = formData.getAll("reminders").map(String);
  const data = parsed.data;
  const date = fromDateTimeLocalValue(data.date);

  const meeting = await prisma.meeting.create({
    data: {
      userId: user.id,
      clientId: data.clientId || null,
      title: data.title,
      date,
      durationMin: data.durationMin,
      meetingLink: data.meetingLink || null,
      notes: data.notes || null,
    },
  });

  await syncReminders(meeting.id, date, offsets);

  await prisma.activityLog.create({
    data: {
      userId: user.id,
      clientId: data.clientId || null,
      meetingId: meeting.id,
      type: ActivityType.REUNION_CREADA,
      message: `Reunión creada: ${meeting.title}`,
    },
  });

  revalidatePath("/reuniones");
  revalidatePath("/dashboard");
  revalidatePath("/calendario");
  if (data.clientId) revalidatePath(`/clientes/${data.clientId}`);
  return undefined;
}

export async function updateMeeting(
  id: string,
  _prevState: MeetingFormState,
  formData: FormData
): Promise<MeetingFormState> {
  const user = await requireUser();
  const existing = await prisma.meeting.findFirst({ where: { id, userId: user.id } });
  if (!existing) return { error: "Reunión no encontrada" };

  const raw = Object.fromEntries(formData.entries());
  const parsed = meetingSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  const offsets = formData.getAll("reminders").map(String);
  const data = parsed.data;
  const date = fromDateTimeLocalValue(data.date);

  const meeting = await prisma.meeting.update({
    where: { id },
    data: {
      clientId: data.clientId || null,
      title: data.title,
      date,
      durationMin: data.durationMin,
      meetingLink: data.meetingLink || null,
      notes: data.notes || null,
    },
  });

  await syncReminders(meeting.id, date, offsets);

  revalidatePath("/reuniones");
  revalidatePath("/dashboard");
  revalidatePath("/calendario");
  if (data.clientId) revalidatePath(`/clientes/${data.clientId}`);
  if (existing.clientId && existing.clientId !== data.clientId) {
    revalidatePath(`/clientes/${existing.clientId}`);
  }
  return undefined;
}

export async function deleteMeeting(id: string) {
  const user = await requireUser();
  await prisma.meeting.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/reuniones");
  revalidatePath("/dashboard");
  revalidatePath("/calendario");
}
