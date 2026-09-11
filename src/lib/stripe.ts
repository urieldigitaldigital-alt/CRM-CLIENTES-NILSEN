import "server-only";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import type { User } from "@prisma/client";

function getSecretKey() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY no está configurado en .env");
  return key;
}

export const stripe = new Stripe(getSecretKey());

export const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID ?? "";

function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

async function ensureStripeCustomer(user: User): Promise<string> {
  if (user.stripeCustomerId) return user.stripeCustomerId;

  const customer = await stripe.customers.create({
    email: user.email,
    name: user.name,
    metadata: { userId: user.id },
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { stripeCustomerId: customer.id },
  });

  return customer.id;
}

export async function createCheckoutSessionUrl(user: User): Promise<string> {
  const customerId = await ensureStripeCustomer(user);
  const appUrl = getAppUrl();

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: STRIPE_PRICE_ID, quantity: 1 }],
    success_url: `${appUrl}/dashboard?checkout=success`,
    cancel_url: `${appUrl}/suscripcion`,
    client_reference_id: user.id,
    metadata: { userId: user.id },
  });

  if (!session.url) throw new Error("Stripe no devolvió una URL de checkout");
  return session.url;
}

export async function createBillingPortalUrl(user: User): Promise<string> {
  const customerId = await ensureStripeCustomer(user);
  const appUrl = getAppUrl();

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${appUrl}/suscripcion`,
  });

  return session.url;
}
