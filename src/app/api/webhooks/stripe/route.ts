import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { constructWebhookEvent } from "@/lib/payments/stripe";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Webhook nicht konfiguriert." }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  // Stripe braucht den *rohen*, unveränderten Body zur Signaturprüfung.
  const payload = await request.text();

  if (!signature) {
    return NextResponse.json({ error: "Signatur fehlt." }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = constructWebhookEvent(payload, signature, secret);
  } catch {
    return NextResponse.json({ error: "Ungültige Signatur." }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const tourId = session.metadata?.tour_id;

    if (tourId && session.payment_status === "paid") {
      const supabase = createServiceClient();
      if (supabase) {
        await supabase.from("purchases").insert({
          tour_id: tourId,
          email: session.customer_details?.email ?? "unknown@sendalore.ch",
          stripe_payment_id:
            typeof session.payment_intent === "string"
              ? session.payment_intent
              : session.id,
        });
      }
    }
  }

  return NextResponse.json({ received: true });
}
