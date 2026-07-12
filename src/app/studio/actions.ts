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

/** Kommagetrenntes Textfeld → getrimmtes String-Array, null wenn leer. */
function stringArrayFromForm(formData: FormData, key: string): string[] | null {
  const parts = String(formData.get(key) ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts : null;
}

/** Ganzzahliges Zahlenfeld → Zahl oder null. */
function intFromForm(formData: FormData, key: string): number | null {
  const raw = formData.get(key);
  return raw ? Math.round(Number(raw)) : null;
}

/** Bis zu 8 indexierte FAQ-Paare (faq-q-N / faq-a-N) → {question, answer}[], null wenn leer. */
function faqFromForm(
  formData: FormData,
): { question: string; answer: string }[] | null {
  const pairs: { question: string; answer: string }[] = [];
  for (let i = 0; i < 8; i++) {
    const question = String(formData.get(`faq-q-${i}`) ?? "").trim();
    if (!question) continue;
    pairs.push({
      question,
      answer: String(formData.get(`faq-a-${i}`) ?? "").trim(),
    });
  }
  return pairs.length > 0 ? pairs : null;
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
      price: formData.get("price") ? Number(formData.get("price")) : null,
      is_featured: formData.get("is_featured") === "on",
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
      cover_image_url: String(formData.get("cover_image_url") ?? "") || null,
      price: formData.get("price") ? Number(formData.get("price")) : null,
      is_featured: formData.get("is_featured") === "on",
      status: formData.get("status") === "published" ? "published" : "draft",
      distance_km: formData.get("distance_km")
        ? Number(formData.get("distance_km"))
        : null,
      elevation_gain_m: intFromForm(formData, "elevation_gain_m"),
      elevation_loss_m: intFromForm(formData, "elevation_loss_m"),
      target_groups: stringArrayFromForm(formData, "target_groups"),
      equipment: stringArrayFromForm(formData, "equipment"),
      suitability_tags: stringArrayFromForm(formData, "suitability_tags"),
      arrival_info: String(formData.get("arrival_info") ?? "") || null,
      accessibility_info:
        String(formData.get("accessibility_info") ?? "") || null,
      audio_preview_url:
        String(formData.get("audio_preview_url") ?? "") || null,
      audio_preview_duration_seconds: intFromForm(
        formData,
        "audio_preview_duration_seconds",
      ),
      faq: faqFromForm(formData),
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

export async function importTours(formData: FormData) {
  const raw = String(formData.get("payload") ?? "");
  let tours: import("@/lib/import/parse").ParsedTour[];
  try {
    tours = JSON.parse(raw);
  } catch {
    redirect("/studio/import?error=Ung%C3%BCltige%20Daten");
  }

  if (!Array.isArray(tours) || tours.length === 0) {
    redirect("/studio/import?error=Keine%20Touren%20gefunden");
  }

  const supabase = await createClient();
  let imported = 0;

  for (const tour of tours) {
    if (!tour.title?.trim()) continue;

    const { data: created, error: tourError } = await supabase
      .from("tours")
      .insert({
        title: tour.title.trim(),
        slug: `${slugify(tour.title)}-${Date.now().toString(36)}-${imported}`,
        region: tour.region ?? null,
        duration_minutes: tour.duration_minutes ?? null,
        difficulty: tour.difficulty ?? null,
        genre: isGenre(tour.genre) ? tour.genre : null,
        status: "draft",
      })
      .select("id")
      .single();

    if (tourError) {
      redirect(`/studio/import?error=${encodeURIComponent(tourError.message)}`);
    }

    const stationRows = tour.stations
      .filter((s) => s.title?.trim())
      .map((s, index) => ({
        tour_id: created.id,
        order_index: index,
        title: s.title.trim(),
        description: s.description ?? null,
        latitude: s.latitude ?? 0,
        longitude: s.longitude ?? 0,
        transcript: s.transcript ?? null,
        audio_url: s.audio_url ?? null,
      }));

    if (stationRows.length > 0) {
      const { error: stationError } = await supabase
        .from("stations")
        .insert(stationRows);
      if (stationError) {
        redirect(
          `/studio/import?error=${encodeURIComponent(stationError.message)}`,
        );
      }
    }

    imported++;
  }

  revalidatePath("/studio");
  redirect(`/studio?imported=${imported}`);
}

export async function addStationMedia(
  tourId: string,
  stationId: string,
  formData: FormData,
) {
  const url = String(formData.get("url") ?? "").trim();
  const mediaType = String(formData.get("media_type") ?? "");
  if (!url || (mediaType !== "image" && mediaType !== "video")) {
    redirect(`/studio/tours/${tourId}?error=Ung%C3%BCltiges%20Medium`);
  }

  const supabase = await createClient();
  const { count } = await supabase
    .from("station_media")
    .select("id", { count: "exact", head: true })
    .eq("station_id", stationId);

  const { error } = await supabase.from("station_media").insert({
    station_id: stationId,
    media_type: mediaType,
    url,
    caption: String(formData.get("caption") ?? "").trim() || null,
    order_index: count ?? 0,
  });

  if (error) {
    redirect(`/studio/tours/${tourId}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/studio/tours/${tourId}`);
  redirect(`/studio/tours/${tourId}`);
}

export async function deleteStationMedia(tourId: string, mediaId: string) {
  const supabase = await createClient();
  await supabase.from("station_media").delete().eq("id", mediaId);
  revalidatePath(`/studio/tours/${tourId}`);
  redirect(`/studio/tours/${tourId}`);
}

export async function deleteStation(tourId: string, stationId: string) {
  const supabase = await createClient();
  await supabase.from("stations").delete().eq("id", stationId);

  revalidatePath(`/studio/tours/${tourId}`);
  redirect(`/studio/tours/${tourId}`);
}

export async function upsertStationQuiz(
  tourId: string,
  stationId: string,
  formData: FormData,
) {
  const question = String(formData.get("question") ?? "").trim();
  const options = ["option-0", "option-1", "option-2", "option-3"]
    .map((key) => String(formData.get(key) ?? "").trim())
    .filter(Boolean);
  const correctIndex = Number(formData.get("correct_index"));

  const supabase = await createClient();

  if (!question || options.length < 2) {
    await supabase.from("station_quiz").delete().eq("station_id", stationId);
    revalidatePath(`/studio/tours/${tourId}`);
    redirect(`/studio/tours/${tourId}?saved=1`);
  }

  const { error } = await supabase.from("station_quiz").upsert(
    {
      station_id: stationId,
      question,
      options,
      correct_index:
        Number.isInteger(correctIndex) && correctIndex < options.length
          ? correctIndex
          : 0,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "station_id" },
  );

  if (error) {
    redirect(
      `/studio/tours/${tourId}?error=${encodeURIComponent(error.message)}`,
    );
  }

  revalidatePath(`/studio/tours/${tourId}`);
  redirect(`/studio/tours/${tourId}?saved=1`);
}

export async function deleteStationQuiz(tourId: string, stationId: string) {
  const supabase = await createClient();
  await supabase.from("station_quiz").delete().eq("station_id", stationId);

  revalidatePath(`/studio/tours/${tourId}`);
  redirect(`/studio/tours/${tourId}`);
}

export async function deleteFeedback(tourId: string, feedbackId: string) {
  const supabase = await createClient();
  await supabase.from("tour_feedback").delete().eq("id", feedbackId);

  revalidatePath(`/studio/tours/${tourId}`);
  redirect(`/studio/tours/${tourId}`);
}
