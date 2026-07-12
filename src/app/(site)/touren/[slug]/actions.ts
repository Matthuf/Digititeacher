"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createCheckoutSession, stripeConfigured } from "@/lib/payments/stripe";
import { hasPurchase } from "@/lib/payments/purchases";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const TEN_MINUTES = 10 * 60 * 1000;

export async function submitFeedback(
  tourId: string,
  slug: string,
  formData: FormData,
) {
  const rating = Number(formData.get("rating"));
  const comment = String(formData.get("comment") ?? "").trim() || null;
  const lang = String(formData.get("lang") ?? "");
  const query = lang ? `?lang=${encodeURIComponent(lang)}&` : "?";

  const ip = await clientIp();
  if (!rateLimit(`feedback:${ip}`, 5, TEN_MINUTES)) {
    redirect(
      `/touren/${slug}${query}error=${encodeURIComponent(
        "Zu viele Anfragen. Bitte versuche es in ein paar Minuten erneut.",
      )}`,
    );
  }

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    redirect(`/touren/${slug}${query}error=Bitte%20eine%20Bewertung%20wählen`);
  }

  const supabase = await createClient();
  const { error } = await supabase.from("tour_feedback").insert({
    tour_id: tourId,
    rating,
    comment,
  });

  if (error) {
    redirect(`/touren/${slug}${query}error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/touren/${slug}`);
  redirect(`/touren/${slug}${query}feedback=1`);
}

export async function startCheckout(tourId: string, slug: string) {
  if (!stripeConfigured()) {
    redirect(
      `/touren/${slug}?error=${encodeURIComponent("Zahlungen sind noch nicht eingerichtet.")}`,
    );
  }

  const ip = await clientIp();
  if (!rateLimit(`checkout:${ip}`, 10, TEN_MINUTES)) {
    redirect(
      `/touren/${slug}?error=${encodeURIComponent(
        "Zu viele Anfragen. Bitte versuche es in ein paar Minuten erneut.",
      )}`,
    );
  }

  const supabase = await createClient();
  const { data: tour, error } = await supabase
    .from("tours")
    .select("id, title, price")
    .eq("id", tourId)
    .eq("status", "published")
    .maybeSingle();

  if (error || !tour || !tour.price) {
    redirect(
      `/touren/${slug}?error=${encodeURIComponent("Diese Tour kann nicht gekauft werden.")}`,
    );
  }

  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  const protocol = headerList.get("x-forwarded-proto") ?? "https";
  const origin = host ? `${protocol}://${host}` : "";

  let checkoutUrl: string;
  try {
    const session = await createCheckoutSession({
      tourId: tour.id,
      title: tour.title,
      priceChf: tour.price,
      successUrl: `${origin}/touren/${slug}?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${origin}/touren/${slug}?checkout=cancel`,
    });
    checkoutUrl = session.url;
  } catch (err) {
    redirect(
      `/touren/${slug}?error=${encodeURIComponent(
        err instanceof Error ? err.message : "Checkout fehlgeschlagen.",
      )}`,
    );
  }

  redirect(checkoutUrl);
}

// Kauf auf einem anderen Gerät/Browser wiederherstellen: E-Mail gegen die
// purchases-Tabelle prüfen (Service-Role, keine RLS-Öffnung). Bei Treffer
// wird die E-Mail als Query-Param zurückgegeben; die Tourseite verifiziert
// sie serverseitig erneut (analog zur Stripe-Session-Prüfung), damit ein
// manuell getippter Parameter allein nicht freischaltet.
export async function restorePurchase(
  tourId: string,
  slug: string,
  formData: FormData,
) {
  const email = String(formData.get("email") ?? "").trim();

  // Enumerierungsschutz: strenger als der Checkout, da hier E-Mails geraten
  // werden könnten.
  const ip = await clientIp();
  if (!rateLimit(`restore:${ip}`, 5, TEN_MINUTES)) {
    redirect(
      `/touren/${slug}?error=${encodeURIComponent(
        "Zu viele Versuche. Bitte versuche es in ein paar Minuten erneut.",
      )}`,
    );
  }

  if (!email || !email.includes("@")) {
    redirect(`/touren/${slug}?restored=notfound`);
  }

  const found = await hasPurchase(tourId, email);
  if (!found) {
    redirect(`/touren/${slug}?restored=notfound`);
  }

  redirect(`/touren/${slug}?restored=${encodeURIComponent(email)}`);
}
