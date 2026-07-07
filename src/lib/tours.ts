export type TourStatus = "draft" | "published";

export type Tour = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  cover_image_url: string | null;
  region: string | null;
  duration_minutes: number | null;
  difficulty: string | null;
  genre?: string | null;
  status: TourStatus;
  price: number | null;
  created_at: string;
  updated_at: string;
};

export type Station = {
  id: string;
  tour_id: string;
  order_index: number;
  title: string;
  description: string | null;
  latitude: number;
  longitude: number;
  audio_url: string | null;
  audio_duration_seconds: number | null;
  transcript?: string | null;
  trigger_radius_m?: number | null;
  image_url: string | null;
};

export type TourTranslation = {
  id: string;
  tour_id: string;
  locale: string;
  title: string | null;
  description: string | null;
};

export type StationTranslation = {
  id: string;
  station_id: string;
  locale: string;
  title: string | null;
  description: string | null;
  transcript: string | null;
  audio_url: string | null;
  audio_duration_seconds: number | null;
};

/** Feldweises Fallback: Übersetzung, sonst deutsche Basis. */
export function localizeTour(tour: Tour, t?: TourTranslation): Tour {
  if (!t) return tour;
  return {
    ...tour,
    title: t.title ?? tour.title,
    description: t.description ?? tour.description,
  };
}

export function localizeStations(
  stations: Station[],
  translations: StationTranslation[],
): Station[] {
  const byStation = new Map(translations.map((t) => [t.station_id, t]));
  return stations.map((station) => {
    const t = byStation.get(station.id);
    if (!t) return station;
    return {
      ...station,
      title: t.title ?? station.title,
      description: t.description ?? station.description,
      transcript: t.transcript ?? station.transcript,
      audio_url: t.audio_url ?? station.audio_url,
      audio_duration_seconds:
        t.audio_duration_seconds ?? station.audio_duration_seconds,
    };
  });
}

export function slugify(title: string) {
  return title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
