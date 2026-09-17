"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { createSubscriptionCheckoutUrl, cancelPreapproval } from "@/lib/mercadopago";

export async function startCheckoutAction() {
  const user = await requireUser();
  const url = await createSubscriptionCheckoutUrl(user);
  redirect(url);
}

/**
 * Cancels the subscription immediately (not at period end) and flips the
 * local status right away so requireActiveUser() locks the account out on
 * the very next request, instead of waiting for a webhook round-trip.
 * Checks both providers since a user may have subscribed before the
 * switch from Stripe to Mercado Pago.
 */
export async function cancelSubscriptionAction() {
  const user = await requireUser();

  if (user.stripeSubscriptionId) {
    try {
      await stripe.subscriptions.cancel(user.stripeSubscriptionId);
    } catch {
      // Already canceled on Stripe's side or otherwise unreachable.
    }
  }

  if (user.mercadoPagoPreapprovalId) {
    try {
      await cancelPreapproval(user.mercadoPagoPreapprovalId);
    } catch {
      // Already canceled on Mercado Pago's side or otherwise unreachable.
    }
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { subscriptionStatus: "CANCELED" },
  });

  redirect("/suscripcion");
}
