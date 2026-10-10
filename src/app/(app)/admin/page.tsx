import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Users,
  UserPlus,
  Crown,
  Clock,
  Ban,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  CalendarDays,
  ShieldCheck,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { requireUser, isOnTrial, trialHoursLeft } from "@/lib/auth";
import { getDayRangeBA } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import { OWNER_EMAIL, SUBSCRIPTION_STATUS_BADGE, SUBSCRIPTION_STATUS_LABEL } from "@/lib/constants";
import { formatCurrency, formatDate, TIMEZONE } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatCard } from "@/components/dashboard/stat-card";
import { UserStatusSelect } from "@/components/admin/user-status-select";
import { ActivateByEmailForm } from "@/components/admin/activate-by-email-form";
import { SendMessageDialog } from "@/components/admin/send-message-dialog";
import { SubscriptionStatus } from "@prisma/client";

const STATUS_TABS: { value: string; label: string }[] = [
  { value: "", label: "Todos" },
  { value: "TRIAL", label: "En prueba" },
  { value: SubscriptionStatus.ACTIVE, label: "Activos" },
  { value: "FREE", label: "Sin plan" },
  { value: SubscriptionStatus.PAST_DUE, label: "Vencidos" },
  { value: SubscriptionStatus.CANCELED, label: "Cancelados" },
  { value: SubscriptionStatus.EXEMPT, label: "Exentos" },
];

const PLAN_PRICE = 8;

function dayKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIMEZONE }).format(date);
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const owner = await requireUser();
  if (owner.email !== OWNER_EMAIL) notFound();

  const { status } = await searchParams;

  const [users, payments] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { clients: true, tasks: true, meetings: true, payments: true } },
      },
    }),
    prisma.subscriptionPayment.findMany({ orderBy: { createdAt: "desc" } }),
  ]);

  const now = new Date();
  const todayKey = dayKey(now);
  const todayStart = getDayRangeBA(0).start;
  const startOfWeek = new Date(now);
  startOfWeek.setDate(startOfWeek.getDate() - 7);
  const startOfMonth = new Date(now);
  startOfMonth.setDate(startOfMonth.getDate() - 30);

  const category = (u: (typeof users)[number]) => {
    if (u.subscriptionStatus === "ACTIVE") return "ACTIVE" as const;
    if (u.subscriptionStatus === "EXEMPT") return "EXEMPT" as const;
    if (isOnTrial(u)) return "TRIAL" as const;
    if (u.subscriptionStatus === "PAST_DUE") return "PAST_DUE" as const;
    if (u.subscriptionStatus === "CANCELED") return "CANCELED" as const;
    return "FREE" as const;
  };

  const totalUsers = users.length;
  const activeUsers = users.filter((u) => category(u) === "ACTIVE");
  const trialUsers = users.filter((u) => category(u) === "TRIAL");
  const freeUsers = users.filter((u) => category(u) === "FREE");
  const pastDueUsers = users.filter((u) => category(u) === "PAST_DUE");
  const canceledUsers = users.filter((u) => category(u) === "CANCELED");
  const exemptUsers = users.filter((u) => category(u) === "EXEMPT");

  const newToday = users.filter((u) => u.createdAt >= todayStart).length;
  const newThisWeek = users.filter((u) => u.createdAt >= startOfWeek).length;
  const newThisMonth = users.filter((u) => u.createdAt >= startOfMonth).length;

  const mrr = activeUsers.length * PLAN_PRICE;

  const revenueToday = payments.filter((p) => dayKey(p.createdAt) === todayKey).reduce((s, p) => s + p.amount, 0);
  const revenueWeek = payments.filter((p) => p.createdAt >= startOfWeek).reduce((s, p) => s + p.amount, 0);
  const revenueMonth = payments.filter((p) => p.createdAt >= startOfMonth).reduce((s, p) => s + p.amount, 0);
  const revenueTotal = payments.reduce((s, p) => s + p.amount, 0);

  const dailyRevenueMap = new Map<string, { amount: number; count: number }>();
  for (const p of payments) {
    const key = dayKey(p.createdAt);
    const entry = dailyRevenueMap.get(key) ?? { amount: 0, count: 0 };
    entry.amount += p.amount;
    entry.count += 1;
    dailyRevenueMap.set(key, entry);
  }
  const dailyRevenue = [...dailyRevenueMap.entries()]
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .slice(0, 30);

  const filteredUsers =
    !status || status === ""
      ? users
      : users.filter((u) => category(u) === status);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center gap-2">
        <ShieldCheck className="size-6 text-accent" />
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Panel de administrador</h1>
          <p className="mt-1 text-sm text-muted">Usuarios, suscripciones e ingresos de toda la plataforma.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        <StatCard label="Usuarios totales" value={String(totalUsers)} icon={Users} />
        <StatCard label="Activos (pagando)" value={String(activeUsers.length)} icon={Crown} tone="success" />
        <StatCard label="En prueba" value={String(trialUsers.length)} icon={Clock} tone="accent" />
        <StatCard label="Sin plan" value={String(freeUsers.length)} icon={UserPlus} />
        <StatCard label="Pago vencido" value={String(pastDueUsers.length)} icon={AlertTriangle} tone="warning" />
        <StatCard label="Cancelados" value={String(canceledUsers.length)} icon={Ban} tone="danger" />
        <StatCard label="Exentos" value={String(exemptUsers.length)} icon={ShieldCheck} />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <StatCard label="MRR estimado" value={formatCurrency(mrr)} icon={DollarSign} tone="success" />
        <StatCard label="Ingresos hoy" value={formatCurrency(revenueToday)} icon={TrendingUp} tone="accent" />
        <StatCard label="Nuevos hoy" value={String(newToday)} icon={CalendarDays} tone="accent" />
        <StatCard label="Nuevos (7 días)" value={String(newThisWeek)} icon={CalendarDays} />
        <StatCard label="Nuevos (30 días)" value={String(newThisMonth)} icon={CalendarDays} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ingresos</CardTitle>
          <CardDescription>Pagos reales registrados desde el webhook de Whop.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <RevenueStat label="Hoy" value={revenueToday} />
            <RevenueStat label="Últimos 7 días" value={revenueWeek} />
            <RevenueStat label="Últimos 30 días" value={revenueMonth} />
            <RevenueStat label="Histórico total" value={revenueTotal} />
          </div>

          {dailyRevenue.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border py-8 text-center text-sm text-muted">
              Todavía no hay pagos registrados. Se van a ir sumando automáticamente cuando Whop confirme un cobro.
            </p>
          ) : (
            <div className="max-h-80 overflow-y-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Día</TableHead>
                    <TableHead>Pagos</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dailyRevenue.map(([day, { amount, count }]) => (
                    <TableRow key={day}>
                      <TableCell className="text-sm">{formatDayLabel(day)}</TableCell>
                      <TableCell className="text-sm text-muted">{count}</TableCell>
                      <TableCell className="text-right font-mono-data text-sm font-medium">
                        {formatCurrency(amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Activar por email</CardTitle>
          <CardDescription>
            Si alguien pagó pero el webhook no lo detectó, activalo manualmente acá.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ActivateByEmailForm />
        </CardContent>
      </Card>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold tracking-tight">Usuarios ({filteredUsers.length})</h2>
        </div>
        <div className="mb-3 flex gap-1.5 overflow-x-auto">
          {STATUS_TABS.map((tab) => (
            <Link
              key={tab.value}
              href={tab.value ? `/admin?status=${tab.value}` : "/admin"}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                (status ?? "") === tab.value
                  ? "border-accent bg-accent-soft text-accent"
                  : "border-border text-muted hover:bg-surface-2"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>

        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Registro</TableHead>
                <TableHead>Verificado</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Uso</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((u) => {
                const cat = category(u);
                return (
                  <TableRow key={u.id}>
                    <TableCell>
                      <p className="font-medium">{u.name}</p>
                      <p className="text-xs text-muted">{u.email}</p>
                    </TableCell>
                    <TableCell className="text-sm text-muted">{formatDate(u.createdAt, { withYear: true })}</TableCell>
                    <TableCell>
                      {u.emailVerifiedAt ? (
                        <CheckCircle2 className="size-4 text-success" />
                      ) : (
                        <XCircle className="size-4 text-muted" />
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1.5">
                        <UserStatusSelect userId={u.id} status={u.subscriptionStatus} />
                        {cat === "TRIAL" && (
                          <Badge variant="accent" className="w-fit">
                            Prueba: {trialHoursLeft(u)}h restantes
                          </Badge>
                        )}
                        {cat !== "TRIAL" && (
                          <Badge variant={SUBSCRIPTION_STATUS_BADGE[u.subscriptionStatus]} className="w-fit">
                            {SUBSCRIPTION_STATUS_LABEL[u.subscriptionStatus]}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted">
                      {u._count.clients} clientes · {u._count.tasks} tareas · {u._count.meetings} reuniones ·{" "}
                      {u._count.payments} cobros
                    </TableCell>
                    <TableCell>
                      <SendMessageDialog userId={u.id} email={u.email} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}

function RevenueStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 font-display text-xl font-semibold tracking-tight">{formatCurrency(value)}</p>
    </div>
  );
}

function formatDayLabel(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  return formatDate(new Date(Date.UTC(y, m - 1, d, 12)), { withYear: true });
}
