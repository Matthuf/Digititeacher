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
  image_url: string | null;
};

export function slugify(title: string) {
  return title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
