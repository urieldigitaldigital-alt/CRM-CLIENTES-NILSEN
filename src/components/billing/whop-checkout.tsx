"use client";

import { loadWhop } from "@whop/elements";
import { WhopElements, Checkout, CheckoutElement } from "@whop/elements-react";

const whop = loadWhop();

export function WhopCheckout({ userId, email }: { userId: string; email: string }) {
  const plan = process.env.NEXT_PUBLIC_WHOP_PLAN_ID;
  if (!plan) {
    return (
      <p className="text-sm text-danger">
        Falta configurar NEXT_PUBLIC_WHOP_PLAN_ID.
      </p>
    );
  }

  return (
    <WhopElements elements={whop}>
      <Checkout
        plan={plan}
        metadata={{ userId }}
        returnUrl={`${typeof window !== "undefined" ? window.location.origin : ""}/dashboard?checkout=success`}
      >
        <CheckoutElement buyerEmail={email} lockBuyerEmail />
      </Checkout>
    </WhopElements>
  );
}
