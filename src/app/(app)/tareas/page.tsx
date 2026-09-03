import Link from "next/link";
import { CheckSquare, Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { TaskStatus, type Prisma } from "@prisma/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormDialog } from "@/components/forms/form-dialog";
import { TaskForm } from "@/components/forms/task-form";
import { TaskRowActions } from "@/components/tareas/task-row-actions";
import { TaskStatusSelect } from "@/components/tareas/task-status-select";
import { PRIORITY_BADGE, PRIORITY_LABEL } from "@/lib/constants";
import { formatDateTime, formatRelativeDay } from "@/lib/format";
import { cn } from "@/lib/utils";

const STATUS_TABS: { value: string; label: string }[] = [
  { value: "", label: "Todas" },
  { value: TaskStatus.PENDIENTE, label: "Pendientes" },
  { value: TaskStatus.EN_PROGRESO, label: "En progreso" },
  { value: TaskStatus.COMPLETADA, label: "Completadas" },
];

export default async function TareasPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const user = await requireUser();
  const { status } = await searchParams;

  const where: Prisma.TaskWhereInput = {
    userId: user.id,
    ...(status ? { status: status as TaskStatus } : {}),
  };

  const [tasks, clients] = await Promise.all([
    prisma.task.findMany({
      where,
      include: { client: true, reminders: true },
      orderBy: { date: "asc" },
    }),
    prisma.client.findMany({
      where: { userId: user.id },
      select: { id: true, name: true, companyName: true },
      orderBy: { companyName: "asc" },
    }),
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Tareas</h1>
          <p className="mt-1 text-sm text-muted">{tasks.length} en total</p>
        </div>
        <FormDialog
          trigger={
            <Button className="gap-1.5">
              <Plus className="size-4" />
              <span className="hidden sm:inline">Nueva tarea</span>
            </Button>
          }
          title="Nueva tarea"
        >
          <TaskForm clients={clients} />
        </FormDialog>
      </div>

      <div className="flex gap-1.5 overflow-x-auto">
        {STATUS_TABS.map((tab) => (
          <Link
            key={tab.value}
            href={tab.value ? `/tareas?status=${tab.value}` : "/tareas"}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
              (status ?? "") === tab.value
                ? "border-accent bg-accent-soft text-accent"
                : "border-border text-muted hover:bg-surface-2"
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {tasks.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 py-16 text-center">
          <CheckSquare className="size-8 text-muted" />
          <p className="font-medium">No hay tareas para mostrar</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {tasks.map((t) => (
            <Card key={t.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 flex-1">
                <p className="font-medium">{t.title}</p>
                {t.description && <p className="mt-0.5 text-sm text-muted line-clamp-1">{t.description}</p>}
                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted">
                  <span>{formatRelativeDay(t.date)} · {formatDateTime(t.date)}</span>
                  {t.client && (
                    <>
                      <span aria-hidden>·</span>
                      <Link href={`/clientes/${t.client.id}`} className="hover:text-accent">
                        {t.client.companyName ?? t.client.name}
                      </Link>
                    </>
                  )}
                  <Badge variant={PRIORITY_BADGE[t.priority]} dot>
                    {PRIORITY_LABEL[t.priority]}
                  </Badge>
                  {t.reminders.length > 0 && <Badge variant="default">🔔 {t.reminders.length}</Badge>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <TaskStatusSelect taskId={t.id} status={t.status} />
                <TaskRowActions
                  task={t}
                  clients={clients}
                />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
