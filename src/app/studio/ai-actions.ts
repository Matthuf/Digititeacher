"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { deeplSupports, deeplTranslate } from "@/lib/ai/deepl";
import { elevenLabsTts } from "@/lib/ai/elevenlabs";
import { voiceForGenre } from "@/lib/ai/voices";

function fail(tourId: string, message: string): never {
  redirect(`/studio/tours/${tourId}?error=${encodeURIComponent(message)}`);
}

/**
 * Übersetzt Tour- und Stationstexte mit DeepL von Deutsch ins Ziel-Locale
 * und speichert sie als Übersetzung. Bestehende Übersetzungen werden
 * überschrieben – gedacht als Startpunkt zur redaktionellen Nachkontrolle.
 */
export async function translateTour(tourId: string, locale: string) {
  if (!deeplSupports(locale)) {
    fail(tourId, `DeepL unterstützt "${locale}" nicht (nur EN, IT, FR).`);
  }

  const supabase = await createClient();

  const { data: tour } = await supabase
    .from("tours")
    .select("id, title, description")
    .eq("id", tourId)
    .maybeSingle();
  if (!tour) fail(tourId, "Tour nicht gefunden.");

  const { data: stations } = await supabase
    .from("stations")
    .select("id, title, description, transcript")
    .eq("tour_id", tourId)
    .order("order_index", { ascending: true });

  // Alle Texte in einen Batch, Reihenfolge merken.
  const texts: string[] = [tour!.title ?? "", tour!.description ?? ""];
  for (const s of stations ?? []) {
    texts.push(s.title ?? "", s.description ?? "", s.transcript ?? "");
  }

  let translated: string[];
  try {
    translated = await deeplTranslate(texts, locale);
  } catch (err) {
    fail(tourId, err instanceof Error ? err.message : "Übersetzung fehlgeschlagen.");
  }

  const tourError = (
    await supabase.from("tour_translations").upsert(
      {
        tour_id: tourId,
        locale,
        title: translated[0] || null,
        description: translated[1] || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "tour_id,locale" },
    )
  ).error;
  if (tourError) fail(tourId, tourError.message);

  let idx = 2;
  for (const s of stations ?? []) {
    const title = translated[idx++] || null;
    const description = translated[idx++] || null;
    const transcript = translated[idx++] || null;
    if (!title && !description && !transcript) continue;

    const { error } = await supabase.from("station_translations").upsert(
      {
        station_id: s.id,
        locale,
        title,
        description,
        transcript,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "station_id,locale" },
    );
    if (error) fail(tourId, error.message);
  }

  revalidatePath(`/studio/tours/${tourId}`);
  redirect(`/studio/tours/${tourId}?saved=1`);
}

/**
 * Erzeugt mit ElevenLabs Audio für eine Station in einer Sprache.
 * locale = "de" vertont die deutsche Basis, sonst die Übersetzung.
 * Stimme richtet sich nach dem Tour-Genre.
 */
export async function generateStationAudio(
  tourId: string,
  stationId: string,
  locale: string,
) {
  const supabase = await createClient();

  const { data: tour } = await supabase
    .from("tours")
    .select("genre")
    .eq("id", tourId)
    .maybeSingle();

  const { data: station } = await supabase
    .from("stations")
    .select("transcript")
    .eq("id", stationId)
    .maybeSingle();
  if (!station) fail(tourId, "Station nicht gefunden.");

  // Text bestimmen: bei Übersetzung das übersetzte Transkript, sonst Basis.
  let text = station!.transcript ?? "";
  if (locale !== "de") {
    const { data: t } = await supabase
      .from("station_translations")
      .select("transcript")
      .eq("station_id", stationId)
      .eq("locale", locale)
      .maybeSingle();
    text = t?.transcript ?? "";
  }

  if (!text.trim()) {
    fail(
      tourId,
      "Kein Transkript vorhanden – zuerst Text (bzw. Übersetzung) speichern.",
    );
  }

  const voice = voiceForGenre(tour?.genre);

  let audio: ArrayBuffer;
  try {
    audio = await elevenLabsTts(text, voice.id);
  } catch (err) {
    fail(tourId, err instanceof Error ? err.message : "Audioerzeugung fehlgeschlagen.");
  }

  const path = `${tourId}/tts-${stationId}-${locale}-${Date.now()}.mp3`;
  const { error: uploadError } = await supabase.storage
    .from("audio")
    .upload(path, audio, { contentType: "audio/mpeg", upsert: false });
  if (uploadError) fail(tourId, `Upload: ${uploadError.message}`);

  const { data: pub } = supabase.storage.from("audio").getPublicUrl(path);

  if (locale === "de") {
    const { error } = await supabase
      .from("stations")
      .update({ audio_url: pub.publicUrl, updated_at: new Date().toISOString() })
      .eq("id", stationId);
    if (error) fail(tourId, error.message);
  } else {
    const { error } = await supabase.from("station_translations").upsert(
      {
        station_id: stationId,
        locale,
        audio_url: pub.publicUrl,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "station_id,locale" },
    );
    if (error) fail(tourId, error.message);
  }

  revalidatePath(`/studio/tours/${tourId}`);
  redirect(`/studio/tours/${tourId}?saved=1`);
}
