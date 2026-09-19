"use server";

import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Single-owner tool: only this account can activate subscriptions manually.
// Needed because checkout goes through a shared Mercado Pago plan link
// (see src/actions/billing.ts) instead of the API, so there's no webhook to
// auto-activate accounts when someone pays.
const OWNER_EMAIL = "urielbarboza2020@gmail.com";

export type ActivateSubscriptionState = { error?: string; success?: string } | undefined;

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

  return { success: `Listo — ${email} ya tiene acceso.` };
}
