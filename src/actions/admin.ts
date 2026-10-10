"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OWNER_EMAIL } from "@/lib/constants";
import type { SubscriptionStatus } from "@prisma/client";

async function requireOwner() {
  const user = await requireUser();
  if (user.email !== OWNER_EMAIL) throw new Error("No autorizado");
  return user;
}

export type ActivateSubscriptionState = { error?: string; success?: string } | undefined;

// Single-owner tool: only this account can activate subscriptions manually.
// Needed because checkout goes through a shared Whop plan link instead of
// the API, so an email alone (no user id) is how a payment gets matched.
export async function activateSubscriptionAction(
  _prevState: ActivateSubscriptionState,
  formData: FormData
): Promise<ActivateSubscriptionState> {
  const owner = await requireUser();
  if (owner.email !== OWNER_EMAIL) {
    return { error: "No autorizado." };
  }

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) return { error: "Ingresá un email." };

  const target = await prisma.user.findUnique({ where: { email } });
  if (!target) return { error: `No existe ninguna cuenta con el email ${email}.` };

  await prisma.user.update({
    where: { id: target.id },
    data: { subscriptionStatus: "ACTIVE" },
  });

  revalidatePath("/admin");
  return { success: `Listo — ${email} ya tiene acceso.` };
}

export async function setUserStatusAction(userId: string, status: SubscriptionStatus) {
  await requireOwner();
  await prisma.user.update({ where: { id: userId }, data: { subscriptionStatus: status } });
  revalidatePath("/admin");
}
