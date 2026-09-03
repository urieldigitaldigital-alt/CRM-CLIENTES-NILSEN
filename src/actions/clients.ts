"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { ActivityType, ClientStatus } from "@prisma/client";
import { parseDateOnly } from "@/lib/format";

const clientSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  companyName: z.string().optional(),
  whatsapp: z.string().optional(),
  email: z.string().optional(),
  instagram: z.string().optional(),
  website: z.string().optional(),
  service: z.string().optional(),
  price: z.coerce.number().optional(),
  paymentMethod: z.string().optional(),
  nextPaymentDate: z.string().optional(),
  status: z.nativeEnum(ClientStatus),
  startDate: z.string().optional(),
  notes: z.string().optional(),
});

export type ClientFormState = { error?: string; fieldErrors?: Record<string, string> } | undefined;

function parseClientForm(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const parsed = clientSchema.safeParse({
    ...raw,
    price: raw.price ? Number(raw.price) : undefined,
  });
  return parsed;
}

export async function createClient(
  _prevState: ClientFormState,
  formData: FormData
): Promise<ClientFormState> {
  const user = await requireUser();
  const parsed = parseClientForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const data = parsed.data;

  const client = await prisma.client.create({
    data: {
      userId: user.id,
      name: data.name,
      companyName: data.companyName || null,
      whatsapp: data.whatsapp || null,
      email: data.email || null,
      instagram: data.instagram || null,
      website: data.website || null,
      service: data.service || null,
      price: data.price ?? null,
      paymentMethod: data.paymentMethod || null,
      nextPaymentDate: data.nextPaymentDate ? parseDateOnly(data.nextPaymentDate) : null,
      status: data.status,
      startDate: data.startDate ? parseDateOnly(data.startDate) : null,
      closedAt: data.status === ClientStatus.CERRADO ? new Date() : null,
      notes: data.notes || null,
    },
  });

  await prisma.activityLog.create({
    data: {
      userId: user.id,
      clientId: client.id,
      type: ActivityType.CLIENTE_CREADO,
      message: `Cliente creado: ${client.companyName ?? client.name}`,
    },
  });

  revalidatePath("/clientes");
  revalidatePath("/dashboard");
  return undefined;
}

export async function updateClient(
  id: string,
  _prevState: ClientFormState,
  formData: FormData
): Promise<ClientFormState> {
  const user = await requireUser();
  const parsed = parseClientForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const data = parsed.data;

  const existing = await prisma.client.findFirst({ where: { id, userId: user.id } });
  if (!existing) return { error: "Cliente no encontrado" };

  const client = await prisma.client.update({
    where: { id },
    data: {
      name: data.name,
      companyName: data.companyName || null,
      whatsapp: data.whatsapp || null,
      email: data.email || null,
      instagram: data.instagram || null,
      website: data.website || null,
      service: data.service || null,
      price: data.price ?? null,
      paymentMethod: data.paymentMethod || null,
      nextPaymentDate: data.nextPaymentDate ? parseDateOnly(data.nextPaymentDate) : null,
      status: data.status,
      startDate: data.startDate ? parseDateOnly(data.startDate) : null,
      closedAt:
        data.status === ClientStatus.CERRADO
          ? existing.closedAt ?? new Date()
          : existing.status === ClientStatus.CERRADO
            ? existing.closedAt
            : null,
      notes: data.notes || null,
    },
  });

  if (existing.status !== data.status && data.status === ClientStatus.CERRADO) {
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        clientId: client.id,
        type: ActivityType.CLIENTE_CERRADO,
        message: `${client.companyName ?? client.name} pasó a estado Cerrado`,
      },
    });
  } else {
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        clientId: client.id,
        type: ActivityType.CLIENTE_ACTUALIZADO,
        message: `Datos actualizados de ${client.companyName ?? client.name}`,
      },
    });
  }

  revalidatePath("/clientes");
  revalidatePath(`/clientes/${id}`);
  revalidatePath("/dashboard");
  return undefined;
}

export async function deleteClient(id: string) {
  const user = await requireUser();
  await prisma.client.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/clientes");
  revalidatePath("/dashboard");
}

export async function addClientNote(clientId: string, content: string) {
  const user = await requireUser();
  if (!content.trim()) return;
  await prisma.note.create({
    data: { clientId, userId: user.id, content: content.trim() },
  });
  await prisma.activityLog.create({
    data: {
      userId: user.id,
      clientId,
      type: ActivityType.NOTA_AGREGADA,
      message: "Nota agregada",
    },
  });
  revalidatePath(`/clientes/${clientId}`);
}
