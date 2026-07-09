// Stripe-Anbindung per REST-API (kein SDK), analog zu lib/ai/deepl.ts.
// Ohne STRIPE_SECRET_KEY bleibt die Kauf-Funktion einfach ausgeblendet.

import { createHmac, timingSafeEqual } from "crypto";

const STRIPE_API = "https://api.stripe.com/v1";

export function stripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY;
}

export function stripeWebhookConfigured(): boolean {
  return !!process.env.STRIPE_WEBHOOK_SECRET;
}

function authHeader() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY ist nicht gesetzt.");
  return { Authorization: `Bearer ${key}` };
}

export async function createCheckoutSession(params: {
  tourId: string;
  title: string;
  priceChf: number;
  successUrl: string;
  cancelUrl: string;
}): Promise<{ url: string }> {
  const body = new URLSearchParams();
  body.set("mode", "payment");
  body.set("success_url", params.successUrl);
  body.set("cancel_url", params.cancelUrl);
  body.set("line_items[0][quantity]", "1");
  body.set("line_items[0][price_data][currency]", "chf");
  body.set(
    "line_items[0][price_data][unit_amount]",
    String(Math.round(params.priceChf * 100)),
  );
  body.set("line_items[0][price_data][product_data][name]", params.title);
  body.set("metadata[tour_id]", params.tourId);

  const res = await fetch(`${STRIPE_API}/checkout/sessions`, {
    method: "POST",
    headers: {
      ...authHeader(),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Stripe-Fehler (${res.status}): ${detail.slice(0, 200)}`);
  }

  const data = (await res.json()) as { url: string | null };
  if (!data.url) throw new Error("Stripe hat keine Checkout-URL geliefert.");
  return { url: data.url };
}

export type StripeCheckoutSession = {
  payment_status: string;
  metadata: Record<string, string>;
  customer_details: { email: string | null } | null;
};

export async function retrieveCheckoutSession(
  sessionId: string,
): Promise<StripeCheckoutSession | null> {
  const res = await fetch(
    `${STRIPE_API}/checkout/sessions/${encodeURIComponent(sessionId)}`,
    { headers: authHeader() },
  );
  if (!res.ok) return null;
  return (await res.json()) as StripeCheckoutSession;
}

/** Stripe-Webhook-Signatur prüfen (HMAC-SHA256, Header-Format "t=...,v1=..."). */
export function verifyStripeSignature(
  payload: string,
  signatureHeader: string,
  secret: string,
): boolean {
  const parts = signatureHeader.split(",").reduce<Record<string, string>>(
    (acc, part) => {
      const [k, v] = part.split("=");
      if (k && v) acc[k] = v;
      return acc;
    },
    {},
  );

  const timestamp = parts.t;
  const signature = parts.v1;
  if (!timestamp || !signature) return false;

  const expected = createHmac("sha256", secret)
    .update(`${timestamp}.${payload}`)
    .digest("hex");

  const expectedBuf = Buffer.from(expected, "utf8");
  const signatureBuf = Buffer.from(signature, "utf8");
  if (expectedBuf.length !== signatureBuf.length) return false;
  return timingSafeEqual(expectedBuf, signatureBuf);
}
