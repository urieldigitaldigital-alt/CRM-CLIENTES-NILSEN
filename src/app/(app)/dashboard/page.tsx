import Link from "next/link";
import { Users, CheckSquare, Calendar, Wallet, Banknote, UserCheck, ArrowRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { ClientStatus, TaskStatus, PaymentStatus } from "@prisma/client";
import { getDayRangeBA, getRangeFromTodayBA } from "@/lib/dates";
import { formatCurrency, formatDate } from "@/lib/format";
import { StatCard } from "@/components/dashboard/stat-card";
import { TodayTimeline, type AgendaItem } from "@/components/dashboard/today-timeline";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PAYMENT_STATUS_BADGE, PAYMENT_STATUS_LABEL } from "@/lib/constants";

export default async function DashboardPage() {
  const user = await requireUser();
  const today = getDayRangeBA(0);
  const tomorrow = getDayRangeBA(1);
  const next30 = getRangeFromTodayBA(30);
  const now = new Date();

  const [
    activeClients,
    closedClients,
    pendingTasks,
    upcomingMeetingsCount,
    upcomingPayments,
    pendingMoney,
    todayTasks,
    todayMeetings,
    tomorrowCount,
  ] = await Promise.all([
    prisma.client.count({ where: { userId: user.id, status: ClientStatus.ACTIVO } }),
    prisma.client.count({ where: { userId: user.id, status: ClientStatus.CERRADO } }),
    prisma.task.count({ where: { userId: user.id, status: { not: TaskStatus.COMPLETADA } } }),
    prisma.meeting.count({ where: { userId: user.id, date: { gte: now } } }),
    prisma.payment.findMany({
      where: {
        userId: user.id,
        status: { in: [PaymentStatus.PENDIENTE, PaymentStatus.VENCIDO] },
        dueDate: { lte: next30.end },
      },
      include: { client: true },
      orderBy: { dueDate: "asc" },
      take: 5,
    }),
    prisma.payment.aggregate({
      where: { userId: user.id, status: { in: [PaymentStatus.PENDIENTE, PaymentStatus.VENCIDO] } },
      _sum: { amount: true },
    }),
    prisma.task.findMany({
      where: { userId: user.id, date: { gte: today.start, lt: today.end } },
      include: { client: true },
      orderBy: { date: "asc" },
    }),
    prisma.meeting.findMany({
      where: { userId: user.id, date: { gte: today.start, lt: today.end } },
      include: { client: true },
      orderBy: { date: "asc" },
    }),
    prisma.task.count({ where: { userId: user.id, date: { gte: tomorrow.start, lt: tomorrow.end } } }),
  ]);

  const agendaItems: AgendaItem[] = [
    ...todayTasks.map((t) => ({
      id: t.id,
      time: t.date,
      title: t.title,
      clientName: t.client?.companyName ?? t.client?.name,
      href: "/tareas",
      kind: "task" as const,
      priority: t.priority,
      status: t.status,
    })),
    ...todayMeetings.map((m) => ({
      id: m.id,
      time: m.date,
      title: m.title,
      clientName: m.client?.companyName ?? m.client?.name,
      href: "/calendario",
      kind: "meeting" as const,
    })),
  ].sort((a, b) => a.time.getTime() - b.time.getTime());

  const firstName = user.name.split(" ")[0];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Hola, {firstName} 👋</h1>
        <p className="mt-1 text-sm text-muted">{formatDate(new Date())} · Esto es lo que tenés hoy.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Clientes activos" value={String(activeClients)} icon={UserCheck} tone="success" />
        <StatCard label="Clientes cerrados" value={String(closedClients)} icon={Users} tone="accent" />
        <StatCard label="Tareas pendientes" value={String(pendingTasks)} icon={CheckSquare} tone="warning" />
        <StatCard label="Reuniones próximas" value={String(upcomingMeetingsCount)} icon={Calendar} tone="default" />
        <StatCard label="Cobros próximos" value={String(upcomingPayments.length)} icon={Wallet} tone="default" />
        <StatCard
          label="Dinero pendiente"
          value={formatCurrency(pendingMoney._sum.amount ?? 0)}
          icon={Banknote}
          tone="danger"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Hoy</CardTitle>
              <p className="text-sm text-muted">Todo lo que tenés que hacer durante el día.</p>
            </div>
            <Badge variant="accent">{agendaItems.length} eventos</Badge>
          </CardHeader>
          <CardContent>
            <TodayTimeline items={agendaItems} emptyLabel="No tenés tareas ni reuniones cargadas para hoy." />
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle>Próximos cobros</CardTitle>
              <Link href="/cobros" className="text-xs font-medium text-accent hover:underline flex items-center gap-1">
                Ver todos <ArrowRight className="size-3" />
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingPayments.length === 0 && (
                <p className="text-sm text-muted">No tenés cobros próximos en los próximos 30 días.</p>
              )}
              {upcomingPayments.map((p) => (
                <Link
                  key={p.id}
                  href="/cobros"
                  className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 hover:bg-surface-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{p.client.companyName ?? p.client.name}</p>
                    <p className="text-xs text-muted">Vence {formatDate(p.dueDate)}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="font-mono-data text-sm font-semibold">{formatCurrency(p.amount)}</span>
                    <Badge variant={PAYMENT_STATUS_BADGE[p.status]}>{PAYMENT_STATUS_LABEL[p.status]}</Badge>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Mañana</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted">
                Tenés{" "}
                <span className="font-semibold text-foreground">{tomorrowCount}</span>{" "}
                {tomorrowCount === 1 ? "tarea" : "tareas"} programadas.
              </p>
              <Link href="/calendario" className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline">
                Ver calendario <ArrowRight className="size-3" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
