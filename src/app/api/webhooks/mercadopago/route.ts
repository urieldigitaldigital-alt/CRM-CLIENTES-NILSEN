import { NextRequest, NextResponse } from "next/server";
import { WebhookSignatureValidator, InvalidWebhookSignatureError } from "mercadopago";
import { prisma } from "@/lib/prisma";
import { getPreapproval, mapPreapprovalStatus } from "@/lib/mercadopago";

export async function POST(request: NextRequest) {
  const url = new URL(request.url);
  const body = await request.json().catch(() => null);

  const type = url.searchParams.get("type") ?? body?.type ?? body?.topic;
  const dataId = url.searchParams.get("data.id") ?? body?.data?.id ?? url.searchParams.get("id");

  if (!dataId || (type !== "preapproval" && type !== "subscription_preapproval")) {
    return NextResponse.json({ received: true });
  }

  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (secret) {
    try {
      WebhookSignatureValidator.validate({
        xSignature: request.headers.get("x-signature"),
        xRequestId: request.headers.get("x-request-id"),
        dataId,
        secret,
      });
    } catch (error) {
      if (error instanceof InvalidWebhookSignatureError) {
        return NextResponse.json({ error: "Firma inválida" }, { status: 400 });
      }
      throw error;
    }
  }

  try {
    const preapproval = await getPreapproval(String(dataId));
    const userId = preapproval.external_reference;
    if (userId) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          mercadoPagoPreapprovalId: preapproval.id,
          subscriptionStatus: mapPreapprovalStatus(preapproval.status),
        },
      });
    }
  } catch {
    // Mercado Pago retries failed webhook deliveries automatically.
  }

  return NextResponse.json({ received: true });
}
