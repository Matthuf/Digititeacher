import { createClient } from "@/lib/supabase/server";
import type { Tour } from "@/lib/tours";

export type TourWithPin = Tour & {
  mapPosition: { lat: number; lng: number } | null;
};

async function withPins(tours: Tour[]): Promise<TourWithPin[]> {
  if (tours.length === 0) return [];
  const supabase = await createClient();

  const { data: stations } = await supabase
    .from("stations")
    .select("tour_id, latitude, longitude, order_index")
    .in(
      "tour_id",
      tours.map((t) => t.id),
    )
    .order("order_index", { ascending: true });

  const firstStationByTour = new Map<string, { lat: number; lng: number }>();
  for (const s of stations ?? []) {
    if (!firstStationByTour.has(s.tour_id)) {
      firstStationByTour.set(s.tour_id, { lat: s.latitude, lng: s.longitude });
    }
  }

  return tours.map((tour) => ({
    ...tour,
    mapPosition: firstStationByTour.get(tour.id) ?? null,
  }));
}

export async function getPublishedToursWithPins(): Promise<TourWithPin[]> {
  const supabase = await createClient();
  const { data: tours, error } = await supabase
    .from("tours")
    .select("*")
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return withPins(tours ?? []);
}

/**
 * Highlight-Touren für die Startseite: manuell im Studio markiert
 * (is_featured). Solange noch keine markiert sind, fallen die neuesten
 * veröffentlichten Touren als Platzhalter ein, damit die Startseite nicht
 * leer wirkt.
 */
export async function getFeaturedToursWithPins(
  limit = 8,
): Promise<TourWithPin[]> {
  const supabase = await createClient();
  const { data: featured, error } = await supabase
    .from("tours")
    .select("*")
    .eq("status", "published")
    .eq("is_featured", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  if (featured && featured.length > 0) return withPins(featured);

  const { data: fallback, error: fallbackError } = await supabase
    .from("tours")
    .select("*")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (fallbackError) throw fallbackError;
  return withPins(fallback ?? []);
}

/**
 * Ähnliche Touren: veröffentlichte Touren mit demselben Genre, ohne die
 * aktuelle Tour. Für die "Ähnliche Touren"-Sektion der Tourdetailseite.
 */
export async function getSimilarTours(
  genre: string,
  excludeTourId: string,
  limit = 3,
): Promise<Tour[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tours")
    .select("*")
    .eq("status", "published")
    .eq("genre", genre)
    .neq("id", excludeTourId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}
