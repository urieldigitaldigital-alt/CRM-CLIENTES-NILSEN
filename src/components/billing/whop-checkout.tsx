"use client";

import { useState } from "react";
import { loadWhop } from "@whop/elements";
import { WhopElements, Checkout, CheckoutElement } from "@whop/elements-react";
import { Button } from "@/components/ui/button";

const whop = loadWhop();

export function WhopCheckout({
  userId,
  email,
  ctaLabel,
}: {
  userId: string;
  email: string;
  ctaLabel: string;
}) {
  const [started, setStarted] = useState(false);
  const plan = process.env.NEXT_PUBLIC_WHOP_PLAN_ID;

  if (!plan) {
    return <p className="text-sm text-danger">Falta configurar NEXT_PUBLIC_WHOP_PLAN_ID.</p>;
  }

  if (!started) {
    return (
      <Button className="w-full" size="lg" onClick={() => setStarted(true)}>
        {ctaLabel}
      </Button>
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
