"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createBillingPortalUrl, createCheckoutSessionUrl } from "@/lib/stripe";

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
