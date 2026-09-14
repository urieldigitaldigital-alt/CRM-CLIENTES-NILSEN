"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe, createBillingPortalUrl, createCheckoutSessionUrl } from "@/lib/stripe";

export async function startCheckoutAction() {
  const user = await requireUser();
  const url = await createCheckoutSessionUrl(user);
  redirect(url);
}

export async function openBillingPortalAction() {
  const user = await requireUser();
  const url = await createBillingPortalUrl(user);
  redirect(url);
}

/**
 * Cancels the subscription immediately (not at period end) and flips the
 * local status right away so requireActiveUser() locks the account out on
 * the very next request, instead of waiting for the Stripe webhook.
 */
export async function cancelSubscriptionAction() {
  const user = await requireUser();

  if (user.stripeSubscriptionId) {
    try {
      await stripe.subscriptions.cancel(user.stripeSubscriptionId);
    } catch {
      // Already canceled on Stripe's side or otherwise unreachable — the
      // local status flip below is what actually enforces the lockout.
    }
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { subscriptionStatus: "CANCELED" },
  });

  redirect("/suscripcion");
}
