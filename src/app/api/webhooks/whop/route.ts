import { NextRequest, NextResponse } from "next/server";
import { unwrapWebhook, WebhookVerificationError } from "@whop/sdk/helpers";
import { prisma } from "@/lib/prisma";

interface WhopEvent {
  type?: string;
  data?: {
    id?: string;
    membership_id?: string | null;
    customer_email?: string | null;
    metadata?: Record<string, unknown> | null;
    final_amount?: number | string | null;
    amount?: number | string | null;
    currency?: string | null;
  };
}

export async function POST(request: NextRequest) {
  const secret = process.env.WHOP_WEBHOOK_SECRET;
  const rawBody = await request.text();

  let event: WhopEvent;
  try {
    event = unwrapWebhook<WhopEvent>(rawBody, {
      headers: Object.fromEntries(request.headers.entries()),
      key: secret,
    });
  } catch (error) {
    if (error instanceof WebhookVerificationError) {
      return NextResponse.json({ error: "Firma inválida" }, { status: 400 });
    }
    throw error;
  }

  const data = event.data;
  if (!data) return NextResponse.json({ received: true });

  if (event.type === "payment.succeeded") {
    const userId = typeof data.metadata?.userId === "string" ? data.metadata.userId : undefined;
    const user = userId
      ? await prisma.user.findUnique({ where: { id: userId } })
      : data.customer_email
        ? await prisma.user.findUnique({ where: { email: data.customer_email } })
        : null;

    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          subscriptionStatus: "ACTIVE",
          whopMembershipId: data.membership_id ?? user.whopMembershipId,
        },
      });

      // Best-effort revenue log for the admin panel — never let a logging
      // problem block the activation above, which already happened.
      try {
        const amountRaw = data.final_amount ?? data.amount;
        const amount = amountRaw != null ? Number(amountRaw) : 8;
        if (!Number.isNaN(amount)) {
          await prisma.subscriptionPayment.create({
            data: {
              userId: user.id,
              amount,
              currency: data.currency ?? "usd",
              whopPaymentId: data.id,
            },
          });
        }
      } catch {}
    }
  }

  if (event.type === "membership.deactivated") {
    const membershipId = data.id;
    if (membershipId) {
      await prisma.user.updateMany({
        where: { whopMembershipId: membershipId },
        data: { subscriptionStatus: "CANCELED" },
      });
    }
  }

  return NextResponse.json({ received: true });
}
