import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Phone,
  Mail,
  AtSign,
  Globe,
  Pencil,
  Plus,
  UserPlus,
  CheckSquare,
  Calendar,
  Wallet,
  StickyNote,
  Activity as ActivityIcon,
  ArrowLeft,
  Repeat,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FormDialog } from "@/components/forms/form-dialog";
import { ClientForm } from "@/components/forms/client-form";
import { TaskForm } from "@/components/forms/task-form";
import { PaymentForm } from "@/components/forms/payment-form";
import { NoteForm } from "@/components/clientes/note-form";
import { TaskRowActions } from "@/components/tareas/task-row-actions";
import { TaskStatusSelect } from "@/components/tareas/task-status-select";
import { PaymentRowActions } from "@/components/cobros/payment-row-actions";
import { MarkPaidButton } from "@/components/cobros/mark-paid-button";
import { ClientAvatar } from "@/components/clientes/client-avatar";
import {
  CLIENT_STATUS_BADGE,
  CLIENT_STATUS_LABEL,
  PAYMENT_STATUS_BADGE,
  PAYMENT_STATUS_LABEL,
  PRIORITY_BADGE,
  PRIORITY_LABEL,
} from "@/lib/constants";
import { formatCurrency, formatDate, formatDateTime, formatRelativeDay } from "@/lib/format";
import { PaymentStatus } from "@prisma/client";

const ACTIVITY_ICON: Record<string, typeof ActivityIcon> = {
  CLIENTE_CREADO: UserPlus,
  CLIENTE_ACTUALIZADO: Pencil,
  CLIENTE_CERRADO: CheckSquare,
  TAREA_CREADA: CheckSquare,
  TAREA_COMPLETADA: CheckSquare,
  REUNION_CREADA: Calendar,
  PAGO_REGISTRADO: Wallet,
  PAGO_COBRADO: Wallet,
  PAGO_RECURRENTE_GENERADO: Repeat,
  NOTA_AGREGADA: StickyNote,
};

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;

  const client = await prisma.client.findFirst({
    where: { id, userId: user.id },
    include: {
      tasks: { orderBy: { date: "asc" }, include: { reminders: true } },
      payments: { orderBy: { dueDate: "desc" } },
      clientNotes: { orderBy: { createdAt: "desc" } },
      activityLogs: { orderBy: { createdAt: "desc" }, take: 30 },
    },
  });

  if (!client) notFound();

  const totalPending = client.payments
    .filter((p) => p.status !== PaymentStatus.PAGADO)
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <Link href="/clientes" className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground">
        <ArrowLeft className="size-3.5" /> Volver a clientes
      </Link>

      <Card>
        <CardContent className="pt-5">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div className="flex items-start gap-4">
              <ClientAvatar name={client.companyName ?? client.name} className="mt-0.5 size-12 text-base" />
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-display text-xl font-semibold tracking-tight">
                    {client.companyName ?? client.name}
                  </h1>
                  <Badge variant={CLIENT_STATUS_BADGE[client.status]}>{CLIENT_STATUS_LABEL[client.status]}</Badge>
                </div>
                {client.companyName && <p className="text-sm text-muted">{client.name}</p>}
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-muted">
                  {client.whatsapp && (
                    <a href={`https://wa.me/${client.whatsapp.replace(/\D/g, "")}`} target="_blank" className="flex items-center gap-1.5 hover:text-accent">
                      <Phone className="size-3.5" /> {client.whatsapp}
                    </a>
                  )}
                  {client.email && (
                    <a href={`mailto:${client.email}`} className="flex items-center gap-1.5 hover:text-accent">
                      <Mail className="size-3.5" /> {client.email}
                    </a>
                  )}
                  {client.instagram && (
                    <span className="flex items-center gap-1.5">
                      <AtSign className="size-3.5" /> {client.instagram}
                    </span>
                  )}
                  {client.website && (
                    <a href={client.website} target="_blank" className="flex items-center gap-1.5 hover:text-accent">
                      <Globe className="size-3.5" /> Sitio web
                    </a>
                  )}
                </div>
              </div>
            </div>
            <FormDialog
              trigger={
                <Button variant="secondary" size="sm" className="gap-1.5 shrink-0">
                  <Pencil className="size-3.5" /> Editar
                </Button>
              }
              title="Editar cliente"
            >
              <ClientForm defaults={client} />
            </FormDialog>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 border-t border-border pt-4 sm:grid-cols-4">
            <Info label="Servicio" value={client.service ?? "—"} />
            <Info label="Precio" value={client.price ? formatCurrency(client.price) : "—"} />
            <Info label="Inicio" value={client.startDate ? formatDate(client.startDate) : "—"} />
            <Info label="Próx. pago" value={client.nextPaymentDate ? formatDate(client.nextPaymentDate) : "—"} />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="tareas">
        <TabsList>
          <TabsTrigger value="tareas">Tareas ({client.tasks.length})</TabsTrigger>
          <TabsTrigger value="cobros">Cobros ({client.payments.length})</TabsTrigger>
          <TabsTrigger value="notas">Notas ({client.clientNotes.length})</TabsTrigger>
          <TabsTrigger value="actividad">Actividad</TabsTrigger>
        </TabsList>

        <TabsContent value="tareas" className="space-y-3">
          <div className="flex justify-end">
            <FormDialog
              trigger={
                <Button size="sm" className="gap-1.5">
                  <Plus className="size-3.5" /> Nueva tarea
                </Button>
              }
              title="Nueva tarea"
            >
              <TaskForm clients={[]} fixedClientId={client.id} />
            </FormDialog>
          </div>
          {client.tasks.length === 0 && <EmptyState label="Sin tareas para este cliente todavía." />}
          {client.tasks.map((t) => (
            <Card key={t.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="font-medium">{t.title}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                  <span>{formatDateTime(t.date)}</span>
                  <Badge variant={PRIORITY_BADGE[t.priority]} dot>{PRIORITY_LABEL[t.priority]}</Badge>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <TaskStatusSelect taskId={t.id} status={t.status} />
                <TaskRowActions task={t} clients={[]} />
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="cobros" className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted">
              Pendiente de cobro: <span className="font-semibold text-foreground">{formatCurrency(totalPending)}</span>
            </p>
            <FormDialog
              trigger={
                <Button size="sm" className="gap-1.5">
                  <Plus className="size-3.5" /> Nuevo cobro
                </Button>
              }
              title="Nuevo cobro"
            >
              <PaymentForm clients={[]} fixedClientId={client.id} />
            </FormDialog>
          </div>
          {client.payments.length === 0 && <EmptyState label="Sin cobros registrados." />}
          {client.payments.map((p) => (
            <Card key={p.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{p.service ?? "Servicio"}</p>
                  {p.isRecurring && (
                    <Badge variant="accent" className="gap-1">
                      <Repeat className="size-3" /> Mensual
                    </Badge>
                  )}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                  <span>Vence {formatDate(p.dueDate)}</span>
                  {p.paidDate && <span>· Pagado {formatDate(p.paidDate)}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono-data font-semibold">{formatCurrency(p.amount)}</span>
                <Badge variant={PAYMENT_STATUS_BADGE[p.status]}>{PAYMENT_STATUS_LABEL[p.status]}</Badge>
                {p.status !== PaymentStatus.PAGADO && <MarkPaidButton id={p.id} />}
                <PaymentRowActions payment={p} clients={[]} />
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="notas" className="space-y-3">
          <NoteForm clientId={client.id} />
          {client.clientNotes.length === 0 && <EmptyState label="Sin notas todavía." />}
          {client.clientNotes.map((n) => (
            <Card key={n.id} className="p-4">
              <p className="text-sm whitespace-pre-wrap">{n.content}</p>
              <p className="mt-2 text-xs text-muted">{formatDateTime(n.createdAt)}</p>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="actividad">
          {client.activityLogs.length === 0 && <EmptyState label="Sin actividad registrada." />}
          <ol className="relative">
            <div className="absolute left-[13px] top-1 bottom-1 w-px bg-border" aria-hidden />
            {client.activityLogs.map((log) => {
              const Icon = ACTIVITY_ICON[log.type] ?? ActivityIcon;
              return (
                <li key={log.id} className="relative flex gap-3 pb-4 last:pb-0">
                  <span className="relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent ring-4 ring-background">
                    <Icon className="size-3.5" />
                  </span>
                  <div className="pt-1">
                    <p className="text-sm">{log.message}</p>
                    <p className="text-xs text-muted">{formatRelativeDay(log.createdAt)} · {formatDateTime(log.createdAt)}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-0.5 text-sm font-medium">{value}</p>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border py-10 text-center text-sm text-muted">
      {label}
    </div>
  );
}
