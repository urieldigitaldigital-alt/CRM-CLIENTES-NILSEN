"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { ActivityType, Priority, ReminderTargetType, TaskStatus } from "@prisma/client";
import { computeRemindAt } from "@/lib/reminders";
import { fromDateTimeLocalValue } from "@/lib/format";

const taskSchema = z.object({
  title: z.string().min(1, "El título es obligatorio"),
  description: z.string().optional(),
  clientId: z.string().optional(),
  date: z.string().min(1, "La fecha y hora son obligatorias"),
  priority: z.nativeEnum(Priority),
  status: z.nativeEnum(TaskStatus),
});

export type TaskFormState = { error?: string } | undefined;

async function syncReminders(taskId: string, date: Date, offsets: string[]) {
  await prisma.reminder.deleteMany({ where: { taskId, sentAt: null } });
  for (const code of offsets) {
    await prisma.reminder.create({
      data: {
        targetType: ReminderTargetType.TASK,
        taskId,
        offsetLabel: code,
        remindAt: computeRemindAt(date, code),
      },
    });
  }
}

export async function createTask(
  _prevState: TaskFormState,
  formData: FormData
): Promise<TaskFormState> {
  const user = await requireUser();
  const raw = Object.fromEntries(formData.entries());
  const parsed = taskSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  const offsets = formData.getAll("reminders").map(String);
  const data = parsed.data;
  const date = fromDateTimeLocalValue(data.date);

  const task = await prisma.task.create({
    data: {
      userId: user.id,
      clientId: data.clientId || null,
      title: data.title,
      description: data.description || null,
      date,
      priority: data.priority,
      status: data.status,
    },
  });

  await syncReminders(task.id, date, offsets);

  await prisma.activityLog.create({
    data: {
      userId: user.id,
      clientId: data.clientId || null,
      taskId: task.id,
      type: ActivityType.TAREA_CREADA,
      message: `Tarea creada: ${task.title}`,
    },
  });

  revalidatePath("/tareas");
  revalidatePath("/dashboard");
  revalidatePath("/calendario");
  if (data.clientId) revalidatePath(`/clientes/${data.clientId}`);
  return undefined;
}

export async function updateTask(
  id: string,
  _prevState: TaskFormState,
  formData: FormData
): Promise<TaskFormState> {
  const user = await requireUser();
  const existing = await prisma.task.findFirst({ where: { id, userId: user.id } });
  if (!existing) return { error: "Tarea no encontrada" };

  const raw = Object.fromEntries(formData.entries());
  const parsed = taskSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  const offsets = formData.getAll("reminders").map(String);
  const data = parsed.data;
  const date = fromDateTimeLocalValue(data.date);

  const task = await prisma.task.update({
    where: { id },
    data: {
      clientId: data.clientId || null,
      title: data.title,
      description: data.description || null,
      date,
      priority: data.priority,
      status: data.status,
    },
  });

  await syncReminders(task.id, date, offsets);

  if (existing.status !== TaskStatus.COMPLETADA && data.status === TaskStatus.COMPLETADA) {
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        clientId: data.clientId || null,
        taskId: task.id,
        type: ActivityType.TAREA_COMPLETADA,
        message: `Tarea completada: ${task.title}`,
      },
    });
  }

  revalidatePath("/tareas");
  revalidatePath("/dashboard");
  revalidatePath("/calendario");
  if (data.clientId) revalidatePath(`/clientes/${data.clientId}`);
  if (existing.clientId && existing.clientId !== data.clientId) {
    revalidatePath(`/clientes/${existing.clientId}`);
  }
  return undefined;
}

export async function setTaskStatus(id: string, status: TaskStatus) {
  const user = await requireUser();
  const existing = await prisma.task.findFirst({ where: { id, userId: user.id } });
  if (!existing) throw new Error("No autorizado");
  const task = await prisma.task.update({
    where: { id },
    data: { status },
  });
  if (status === TaskStatus.COMPLETADA) {
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        clientId: task.clientId,
        taskId: task.id,
        type: ActivityType.TAREA_COMPLETADA,
        message: `Tarea completada: ${task.title}`,
      },
    });
  }
  revalidatePath("/tareas");
  revalidatePath("/dashboard");
  revalidatePath("/calendario");
  if (task.clientId) revalidatePath(`/clientes/${task.clientId}`);
}

export async function deleteTask(id: string) {
  const user = await requireUser();
  await prisma.task.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/tareas");
  revalidatePath("/dashboard");
  revalidatePath("/calendario");
}
