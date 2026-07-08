"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function submitFeedback(
  tourId: string,
  slug: string,
  formData: FormData,
) {
  const rating = Number(formData.get("rating"));
  const comment = String(formData.get("comment") ?? "").trim() || null;
  const lang = String(formData.get("lang") ?? "");
  const query = lang ? `?lang=${encodeURIComponent(lang)}&` : "?";

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
