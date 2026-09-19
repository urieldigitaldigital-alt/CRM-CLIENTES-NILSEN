"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { cancelPreapproval } from "@/lib/mercadopago";

// Points at a Mercado Pago "Plan de suscripción" checkout link (created in the
// seller dashboard, not via API) — no Access Token required. It's a single
// shared link, so payments aren't tied back to a user automatically; activate
// the account manually once a payment comes in until the API-based checkout
// (src/lib/mercadopago.ts createSubscriptionCheckoutUrl) is wired up.
function getSubscriptionLink() {
  const url = process.env.MERCADOPAGO_SUBSCRIPTION_LINK;
  if (!url) throw new Error("MERCADOPAGO_SUBSCRIPTION_LINK no está configurado en .env");
  return url;
}

export async function startCheckoutAction() {
  await requireUser();
  redirect(getSubscriptionLink());
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
