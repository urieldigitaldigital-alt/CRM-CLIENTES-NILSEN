"use client";

import { RowActions } from "@/components/shared/row-actions";
import { TaskForm, type ClientOption } from "@/components/forms/task-form";
import { deleteTask } from "@/actions/tasks";
import type { Priority, TaskStatus } from "@prisma/client";

interface TaskDefaults {
  id: string;
  title: string;
  description: string | null;
  clientId: string | null;
  date: Date;
  priority: Priority;
  status: TaskStatus;
  reminders?: { offsetLabel: string }[];
}

export function TaskRowActions({ task, clients }: { task: TaskDefaults; clients: ClientOption[] }) {
  return (
    <RowActions
      editTitle="Editar tarea"
      editForm={
        <TaskForm
          clients={clients}
          defaults={{ ...task, reminderOffsets: task.reminders?.map((r) => r.offsetLabel) }}
        />
      }
      deleteAction={() => deleteTask(task.id)}
      deleteConfirm={`¿Eliminar la tarea "${task.title}"?`}
      deleteSuccess="Tarea eliminada"
    />
  );
}
