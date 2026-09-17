import "server-only";
import { MercadoPagoConfig, PreApproval } from "mercadopago";
import { prisma } from "@/lib/prisma";
import type { User, SubscriptionStatus } from "@prisma/client";

function getAccessToken() {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) throw new Error("MERCADOPAGO_ACCESS_TOKEN no está configurado en .env");
  return token;
}

function getConfig() {
  return new MercadoPagoConfig({ accessToken: getAccessToken() });
}

function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

function getPriceArs() {
  const price = process.env.MERCADOPAGO_SUBSCRIPTION_PRICE_ARS;
  if (!price) throw new Error("MERCADOPAGO_SUBSCRIPTION_PRICE_ARS no está configurado en .env");
  const amount = Number(price);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("MERCADOPAGO_SUBSCRIPTION_PRICE_ARS tiene un valor inválido");
  }
  return amount;
}

export async function createSubscriptionCheckoutUrl(user: User): Promise<string> {
  const preApproval = new PreApproval(getConfig());
  const appUrl = getAppUrl();

  const subscription = await preApproval.create({
    body: {
      reason: "Operaciones — suscripción mensual",
      external_reference: user.id,
      payer_email: user.email,
      back_url: `${appUrl}/dashboard?checkout=success`,
      auto_recurring: {
        frequency: 1,
        frequency_type: "months",
        transaction_amount: getPriceArs(),
        currency_id: "ARS",
      },
      status: "pending",
    },
  });

  const url = subscription.init_point;
  if (!url) throw new Error("Mercado Pago no devolvió una URL de checkout");

  if (subscription.id) {
    await prisma.user.update({
      where: { id: user.id },
      data: { mercadoPagoPreapprovalId: subscription.id },
    });
  }

  return url;
}

export async function cancelPreapproval(preapprovalId: string): Promise<void> {
  const preApproval = new PreApproval(getConfig());
  await preApproval.update({ id: preapprovalId, body: { status: "cancelled" } });
}

export async function getPreapproval(preapprovalId: string) {
  const preApproval = new PreApproval(getConfig());
  return preApproval.get({ id: preapprovalId });
}

export function mapPreapprovalStatus(status: string | undefined): SubscriptionStatus {
  switch (status) {
    case "authorized":
      return "ACTIVE";
    case "paused":
      return "PAST_DUE";
    case "cancelled":
      return "CANCELED";
    case "pending":
    default:
      return "INCOMPLETE";
  }
}
