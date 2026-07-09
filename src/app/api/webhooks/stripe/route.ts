import { NextResponse } from "next/server";
import { verifyStripeSignature } from "@/lib/payments/stripe";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Webhook nicht konfiguriert." }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  const payload = await request.text();

  if (!signature || !verifyStripeSignature(payload, signature, secret)) {
    return NextResponse.json({ error: "Ungültige Signatur." }, { status: 400 });
  }

  const event = JSON.parse(payload) as {
    type: string;
    data: {
      object: {
        id: string;
        payment_status?: string;
        payment_intent?: string;
        metadata?: Record<string, string>;
        customer_details?: { email: string | null } | null;
      };
    };
  };

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const tourId = session.metadata?.tour_id;

    if (tourId && session.payment_status === "paid") {
      const supabase = createServiceClient();
      if (supabase) {
        await supabase.from("purchases").insert({
          tour_id: tourId,
          email: session.customer_details?.email ?? "unknown@sendalore.ch",
          stripe_payment_id: session.payment_intent ?? session.id,
        });
      }
    }
  }

  return NextResponse.json({ received: true });
}
