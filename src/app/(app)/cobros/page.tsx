import Link from "next/link";
import { Wallet, Plus, Repeat } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { PaymentStatus, type Prisma } from "@prisma/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormDialog } from "@/components/forms/form-dialog";
import { PaymentForm } from "@/components/forms/payment-form";
import { PaymentRowActions } from "@/components/cobros/payment-row-actions";
import { MarkPaidButton } from "@/components/cobros/mark-paid-button";
import { PAYMENT_STATUS_BADGE, PAYMENT_STATUS_LABEL } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

const STATUS_TABS: { value: string; label: string }[] = [
  { value: "", label: "Todos" },
  { value: PaymentStatus.PENDIENTE, label: "Pendientes" },
  { value: PaymentStatus.VENCIDO, label: "Vencidos" },
  { value: PaymentStatus.PAGADO, label: "Pagados" },
];

export default async function CobrosPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const user = await requireUser();
  const { status } = await searchParams;

  const where: Prisma.PaymentWhereInput = {
    userId: user.id,
    ...(status ? { status: status as PaymentStatus } : {}),
  };

  const [payments, clients, totals] = await Promise.all([
    prisma.payment.findMany({
      where,
      include: { client: true, reminders: true },
      orderBy: { dueDate: "asc" },
    }),
    prisma.client.findMany({
      where: { userId: user.id },
      select: { id: true, name: true, companyName: true },
      orderBy: { companyName: "asc" },
    }),
    prisma.payment.aggregate({
      where: { userId: user.id, status: { in: [PaymentStatus.PENDIENTE, PaymentStatus.VENCIDO] } },
      _sum: { amount: true },
    }),
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Cobros</h1>
          <p className="mt-1 text-sm text-muted">
            Pendiente de cobrar: <span className="font-semibold text-foreground">{formatCurrency(totals._sum.amount ?? 0)}</span>
          </p>
        </div>
        <FormDialog
          trigger={
            <Button className="gap-1.5">
              <Plus className="size-4" />
              <span className="hidden sm:inline">Nuevo cobro</span>
            </Button>
          }
          title="Nuevo cobro"
        >
          <PaymentForm clients={clients} />
        </FormDialog>
      </div>

      <div className="flex gap-1.5 overflow-x-auto">
        {STATUS_TABS.map((tab) => (
          <Link
            key={tab.value}
            href={tab.value ? `/cobros?status=${tab.value}` : "/cobros"}
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

      {payments.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 py-16 text-center">
          <Wallet className="size-8 text-muted" />
          <p className="font-medium">No hay cobros para mostrar</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {payments.map((p) => (
            <Card key={p.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Link href={`/clientes/${p.client.id}`} className="font-medium hover:text-accent">
                    {p.client.companyName ?? p.client.name}
                  </Link>
                  <Badge variant={PAYMENT_STATUS_BADGE[p.status]}>{PAYMENT_STATUS_LABEL[p.status]}</Badge>
                  {p.isRecurring && (
                    <Badge variant="accent" className="gap-1">
                      <Repeat className="size-3" /> Mensual
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted">{p.service ?? "Servicio"}</p>
                <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-muted">
                  <span>Vence {formatDate(p.dueDate)}</span>
                  {p.paidDate && <span>Pagado {formatDate(p.paidDate)}</span>}
                  {p.paymentMethod && <span>{p.paymentMethod}</span>}
                  {p.reminders.length > 0 && <span>🔔 {p.reminders.length} recordatorio(s)</span>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono-data text-lg font-semibold">{formatCurrency(p.amount)}</span>
                {p.status !== PaymentStatus.PAGADO && <MarkPaidButton id={p.id} />}
                <PaymentRowActions payment={p} clients={clients} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
