"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/tours";
import { isGenre } from "@/lib/genres";

function genreFromForm(formData: FormData) {
  const value = String(formData.get("genre") ?? "");
  return isGenre(value) ? value : null;
}

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect(`/studio/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/studio");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/studio/login");
}

export async function createTour(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  if (!title) {
    redirect("/studio/tours/new?error=Titel%20ist%20erforderlich");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tours")
    .insert({
      title,
      slug: `${slugify(title)}-${Date.now().toString(36)}`,
      region: String(formData.get("region") ?? "") || null,
      duration_minutes: formData.get("duration_minutes")
        ? Number(formData.get("duration_minutes"))
        : null,
      difficulty: String(formData.get("difficulty") ?? "") || null,
      genre: genreFromForm(formData),
      description: String(formData.get("description") ?? "") || null,
      status: "draft",
    })
    .select("id")
    .single();

  if (error) {
    redirect(`/studio/tours/new?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/studio");
  redirect(`/studio/tours/${data.id}`);
}

export async function updateTour(tourId: string, formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("tours")
    .update({
      title: String(formData.get("title") ?? "").trim(),
      region: String(formData.get("region") ?? "") || null,
      duration_minutes: formData.get("duration_minutes")
        ? Number(formData.get("duration_minutes"))
        : null,
      difficulty: String(formData.get("difficulty") ?? "") || null,
      genre: genreFromForm(formData),
      description: String(formData.get("description") ?? "") || null,
      status: formData.get("status") === "published" ? "published" : "draft",
      updated_at: new Date().toISOString(),
    })
    .eq("id", tourId);

  if (error) {
    redirect(
      `/studio/tours/${tourId}?error=${encodeURIComponent(error.message)}`,
    );
  }

  revalidatePath(`/studio/tours/${tourId}`);
  revalidatePath("/studio");
  redirect(`/studio/tours/${tourId}?saved=1`);
}

function stationFieldsFromForm(formData: FormData) {
  const radius = formData.get("trigger_radius_m");
  const duration = formData.get("audio_duration_seconds");

  return {
    title: String(formData.get("title") ?? "").trim(),
    description: String(formData.get("description") ?? "") || null,
    latitude: Number(formData.get("latitude")),
    longitude: Number(formData.get("longitude")),
    audio_url: String(formData.get("audio_url") ?? "") || null,
    audio_duration_seconds: duration ? Number(duration) : null,
    transcript: String(formData.get("transcript") ?? "") || null,
    trigger_radius_m: radius ? Number(radius) : null,
  };
}

export async function addStation(tourId: string, formData: FormData) {
  const supabase = await createClient();

  const { count } = await supabase
    .from("stations")
    .select("id", { count: "exact", head: true })
    .eq("tour_id", tourId);

  const { error } = await supabase.from("stations").insert({
    tour_id: tourId,
    order_index: count ?? 0,
    ...stationFieldsFromForm(formData),
  });

  if (error) {
    redirect(
      `/studio/tours/${tourId}?error=${encodeURIComponent(error.message)}`,
    );
  }

  revalidatePath(`/studio/tours/${tourId}`);
  redirect(`/studio/tours/${tourId}`);
}

export async function updateStation(
  tourId: string,
  stationId: string,
  formData: FormData,
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("stations")
    .update({
      ...stationFieldsFromForm(formData),
      updated_at: new Date().toISOString(),
    })
    .eq("id", stationId);

  if (error) {
    redirect(
      `/studio/tours/${tourId}?error=${encodeURIComponent(error.message)}`,
    );
  }

  revalidatePath(`/studio/tours/${tourId}`);
  redirect(`/studio/tours/${tourId}?saved=1`);
}

export async function upsertTranslations(
  tourId: string,
  locale: string,
  formData: FormData,
) {
  const supabase = await createClient();
  const text = (key: string) => String(formData.get(key) ?? "").trim() || null;

  // Tour-Ebene
  const tourTitle = text("tour-title");
  const tourDescription = text("tour-description");

  let error = null;
  if (tourTitle || tourDescription) {
    ({ error } = await supabase.from("tour_translations").upsert(
      {
        tour_id: tourId,
        locale,
        title: tourTitle,
        description: tourDescription,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "tour_id,locale" },
    ));
  } else {
    ({ error } = await supabase
      .from("tour_translations")
      .delete()
      .eq("tour_id", tourId)
      .eq("locale", locale));
  }

  if (error) {
    redirect(
      `/studio/tours/${tourId}?error=${encodeURIComponent(error.message)}`,
    );
  }

  // Stations-Ebene
  const { data: stations } = await supabase
    .from("stations")
    .select("id")
    .eq("tour_id", tourId);

  for (const station of stations ?? []) {
    const p = `s-${station.id}`;
    const fields = {
      title: text(`${p}-title`),
      description: text(`${p}-description`),
      transcript: text(`${p}-transcript`),
      audio_url: text(`${p}-audio_url`),
      audio_duration_seconds: formData.get(`${p}-audio_duration_seconds`)
        ? Number(formData.get(`${p}-audio_duration_seconds`))
        : null,
    };
    const hasContent = Object.values(fields).some((v) => v !== null);

    const { error: stationError } = hasContent
      ? await supabase.from("station_translations").upsert(
          {
            station_id: station.id,
            locale,
            ...fields,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "station_id,locale" },
        )
      : await supabase
          .from("station_translations")
          .delete()
          .eq("station_id", station.id)
          .eq("locale", locale);

    if (stationError) {
      redirect(
        `/studio/tours/${tourId}?error=${encodeURIComponent(stationError.message)}`,
      );
    }
  }

  revalidatePath(`/studio/tours/${tourId}`);
  redirect(`/studio/tours/${tourId}?saved=1`);
}

export async function deleteStation(tourId: string, stationId: string) {
  const supabase = await createClient();
  await supabase.from("stations").delete().eq("id", stationId);

  revalidatePath(`/studio/tours/${tourId}`);
  redirect(`/studio/tours/${tourId}`);
}
