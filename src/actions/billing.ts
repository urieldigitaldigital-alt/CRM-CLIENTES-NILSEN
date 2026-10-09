"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { cancelPreapproval } from "@/lib/mercadopago";
import { cancelMembership } from "@/lib/whop";

/**
 * Cancels the subscription immediately (not at period end) and flips the
 * local status right away so requireActiveUser() locks the account out on
 * the very next request, instead of waiting for a webhook round-trip.
 * Checks every provider since a user may have subscribed before a later
 * switch (Stripe → Mercado Pago → Whop).
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

  if (user.whopMembershipId) {
    try {
      await cancelMembership(user.whopMembershipId);
    } catch {
      // Already canceled on Whop's side or otherwise unreachable.
    }
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { subscriptionStatus: "CANCELED" },
  });

  redirect("/suscripcion");
}
