import "server-only";
import Stripe from "stripe";

// Legacy: only used to cancel/track subscribers who signed up before the
// switch to Mercado Pago (see src/lib/mercadopago.ts). Not used for new checkouts.
function getSecretKey() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY no está configurado en .env");
  return key;
}

export const stripe = new Stripe(getSecretKey());
