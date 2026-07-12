// Stripe-Anbindung über das offizielle SDK. Ohne STRIPE_SECRET_KEY bleibt die
// Kauf-Funktion einfach ausgeblendet (Muster wie lib/ai/deepl.ts).

import Stripe from "stripe";

let cached: Stripe | null = null;

export function stripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY;
}

export function stripeWebhookConfigured(): boolean {
  return !!process.env.STRIPE_WEBHOOK_SECRET;
}

// Währung für Checkout-Beträge. Server-seitig, Standard CHF – konfigurierbar
// per TOUR_CURRENCY (kein vollständiges Multi-Currency-System pro Tour).
const TOUR_CURRENCY = (process.env.TOUR_CURRENCY ?? "chf").toLowerCase();

/** Lazily initialisierter Stripe-Client (nur mit gesetztem Secret aufrufen). */
function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY ist nicht gesetzt.");
  if (!cached) cached = new Stripe(key);
  return cached;
}

export async function createCheckoutSession(params: {
  tourId: string;
  title: string;
  priceChf: number;
  successUrl: string;
  cancelUrl: string;
}): Promise<{ url: string }> {
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: TOUR_CURRENCY,
          unit_amount: Math.round(params.priceChf * 100),
          product_data: { name: params.title },
        },
      },
    ],
    metadata: { tour_id: params.tourId },
  });

  if (!session.url) throw new Error("Stripe hat keine Checkout-URL geliefert.");
  return { url: session.url };
}

export type StripeCheckoutSession = {
  payment_status: string;
  metadata: Record<string, string>;
  customer_details: { email: string | null } | null;
};

export async function retrieveCheckoutSession(
  sessionId: string,
): Promise<StripeCheckoutSession | null> {
  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    return {
      payment_status: session.payment_status ?? "",
      metadata: (session.metadata ?? {}) as Record<string, string>,
      customer_details: session.customer_details
        ? { email: session.customer_details.email ?? null }
        : null,
    };
  } catch {
    return null;
  }
}

/**
 * Webhook-Signatur über das offizielle SDK prüfen und Event parsen. Ersetzt
 * die frühere Eigenbau-HMAC-Prüfung – inkl. Timestamp-Toleranz gegen Replays.
 * Wirft bei ungültiger Signatur.
 */
export function constructWebhookEvent(
  payload: string,
  signature: string,
  secret: string,
): Stripe.Event {
  return getStripe().webhooks.constructEvent(payload, signature, secret);
}
