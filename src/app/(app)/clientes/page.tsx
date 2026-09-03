import Link from "next/link";
import { Users, Phone, Mail, ChevronRight, UserPlus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { ClientStatus, type Prisma } from "@prisma/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FormDialog } from "@/components/forms/form-dialog";
import { ClientForm } from "@/components/forms/client-form";
import { ClientFilters } from "@/components/clientes/client-filters";
import { ClientRowActions } from "@/components/clientes/client-row-actions";
import { ClientAvatar } from "@/components/clientes/client-avatar";
import { CLIENT_STATUS_BADGE, CLIENT_STATUS_LABEL } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/format";

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const user = await requireUser();
  const { q, status } = await searchParams;

  const where: Prisma.ClientWhereInput = {
    userId: user.id,
    ...(status ? { status: status as ClientStatus } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q } },
            { companyName: { contains: q } },
            { email: { contains: q } },
            { service: { contains: q } },
          ],
        }
      : {}),
  };

  const clients = await prisma.client.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Clientes</h1>
          <p className="mt-1 text-sm text-muted">{clients.length} en total</p>
        </div>
        <FormDialog
          trigger={
            <Button className="gap-1.5">
              <UserPlus className="size-4" />
              <span className="hidden sm:inline">Nuevo cliente</span>
            </Button>
          }
          title="Nuevo cliente"
        >
          <ClientForm />
        </FormDialog>
      </div>

      <ClientFilters initialQuery={q ?? ""} initialStatus={status ?? ""} />

      {clients.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 py-16 text-center">
          <Users className="size-8 text-muted" />
          <p className="font-medium">No hay clientes que coincidan</p>
          <p className="text-sm text-muted">Probá con otro filtro o creá tu primer cliente.</p>
        </Card>
      ) : (
        <>
          {/* Desktop table */}
          <Card className="hidden overflow-hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Servicio</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Próx. pago</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <ClientAvatar name={c.companyName ?? c.name} />
                        <div>
                          <Link href={`/clientes/${c.id}`} className="font-medium hover:text-accent">
                            {c.companyName ?? c.name}
                          </Link>
                          {c.companyName && <p className="text-xs text-muted">{c.name}</p>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5 text-xs text-muted">
                        {c.whatsapp && (
                          <span className="flex items-center gap-1">
                            <Phone className="size-3" /> {c.whatsapp}
                          </span>
                        )}
                        {c.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="size-3" /> {c.email}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{c.service ?? "—"}</TableCell>
                    <TableCell className="font-mono-data text-sm">
                      {c.price ? formatCurrency(c.price) : "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted">
                      {c.nextPaymentDate ? formatDate(c.nextPaymentDate) : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={CLIENT_STATUS_BADGE[c.status]}>{CLIENT_STATUS_LABEL[c.status]}</Badge>
                    </TableCell>
                    <TableCell>
                      <ClientRowActions client={c} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          {/* Mobile cards */}
          <div className="grid gap-3 md:hidden">
            {clients.map((c) => (
              <Card key={c.id} className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <Link href={`/clientes/${c.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                    <ClientAvatar name={c.companyName ?? c.name} />
                    <div className="min-w-0">
                      <p className="truncate font-medium">{c.companyName ?? c.name}</p>
                      {c.companyName && <p className="truncate text-xs text-muted">{c.name}</p>}
                    </div>
                  </Link>
                  <ClientRowActions client={c} />
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Badge variant={CLIENT_STATUS_BADGE[c.status]}>{CLIENT_STATUS_LABEL[c.status]}</Badge>
                  {c.service && <Badge>{c.service}</Badge>}
                </div>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="font-mono-data font-medium">{c.price ? formatCurrency(c.price) : "—"}</span>
                  {c.nextPaymentDate && (
                    <span className="text-xs text-muted">Próx. pago {formatDate(c.nextPaymentDate)}</span>
                  )}
                </div>
                <Link
                  href={`/clientes/${c.id}`}
                  className="mt-3 flex items-center justify-center gap-1 rounded-lg border border-border py-2 text-sm font-medium text-accent"
                >
                  Ver ficha <ChevronRight className="size-3.5" />
                </Link>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
