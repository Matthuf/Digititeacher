import { notFound } from "next/navigation";
import { Eye, Star } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type {
  Station,
  StationMedia,
  StationTranslation,
  Tour,
  TourFeedback,
  TourTranslation,
} from "@/lib/tours";
import {
  addStation,
  deleteFeedback,
  deleteStation,
  deleteStationMedia,
  updateStation,
  updateTour,
} from "@/app/studio/actions";
import { GENRE_KEYS, GENRES } from "@/lib/genres";
import { aiStatus } from "@/lib/ai/status";
import { MediaUpload } from "@/components/media-upload";
import { CoverUpload } from "@/components/cover-upload";
import { StationFields } from "./station-fields";
import { TranslationsEditor } from "./translations-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

async function getTourWithStations(
  id: string,
): Promise<{ tour: Tour; stations: Station[] } | null> {
  const supabase = await createClient();
  const { data: tour, error: tourError } = await supabase
    .from("tours")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (tourError) throw tourError;
  if (!tour) return null;

  const { data: stations, error: stationsError } = await supabase
    .from("stations")
    .select("*")
    .eq("tour_id", id)
    .order("order_index", { ascending: true });

  if (stationsError) throw stationsError;

  return { tour, stations: stations ?? [] };
}

export default async function EditTourPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const { id } = await params;
  const { error, saved } = await searchParams;

  const result = await getTourWithStations(id);
  if (!result) notFound();
  const { tour, stations } = result;

  // Übersetzungen laden – tolerant, falls Migration 003 noch fehlt.
  let tourTranslations: TourTranslation[] | null = null;
  let stationTranslations: StationTranslation[] = [];
  try {
    const supabase = await createClient();
    const [tt, st] = await Promise.all([
      supabase.from("tour_translations").select("*").eq("tour_id", tour.id),
      supabase
        .from("station_translations")
        .select("*")
        .in("station_id", stations.map((s) => s.id)),
    ]);
    if (!tt.error) {
      tourTranslations = tt.data ?? [];
      stationTranslations = st.data ?? [];
    }
  } catch {
    tourTranslations = null;
  }

  // Medien pro Station laden – tolerant, falls Migration 004 noch fehlt.
  const mediaByStation = new Map<string, StationMedia[]>();
  try {
    const supabase = await createClient();
    const { data, error: mediaError } = await supabase
      .from("station_media")
      .select("*")
      .in("station_id", stations.map((s) => s.id))
      .order("order_index", { ascending: true });
    if (!mediaError) {
      for (const m of data ?? []) {
        const list = mediaByStation.get(m.station_id) ?? [];
        list.push(m);
        mediaByStation.set(m.station_id, list);
      }
    }
  } catch {
    // Migration 004 fehlt – Medien-Bereich zeigt dann nur den Hinweis.
  }

  // Feedback + Aufrufe laden – tolerant, falls Migration 005 noch fehlt.
  let feedback: TourFeedback[] | null = null;
  let viewCount = 0;
  try {
    const supabase = await createClient();
    const [fb, views] = await Promise.all([
      supabase
        .from("tour_feedback")
        .select("*")
        .eq("tour_id", tour.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("tour_views")
        .select("id", { count: "exact", head: true })
        .eq("tour_id", tour.id),
    ]);
    if (!fb.error) {
      feedback = fb.data ?? [];
      viewCount = views.count ?? 0;
    }
  } catch {
    feedback = null;
  }

  const ai = aiStatus();
  const updateTourWithId = updateTour.bind(null, tour.id);
  const addStationWithId = addStation.bind(null, tour.id);

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <Card>
        <CardHeader>
          <CardTitle>Tour bearbeiten</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateTourWithId} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="title">Titel</Label>
              <Input id="title" name="title" defaultValue={tour.title} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="description">Beschreibung</Label>
              <Input
                id="description"
                name="description"
                defaultValue={tour.description ?? ""}
              />
            </div>
            <CoverUpload tourId={tour.id} defaultUrl={tour.cover_image_url} />
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="region">Region</Label>
                <Input id="region" name="region" defaultValue={tour.region ?? ""} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="duration_minutes">Dauer (Min.)</Label>
                <Input
                  id="duration_minutes"
                  name="duration_minutes"
                  type="number"
                  defaultValue={tour.duration_minutes ?? ""}
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="difficulty">Schwierigkeit</Label>
              <Input
                id="difficulty"
                name="difficulty"
                defaultValue={tour.difficulty ?? ""}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="genre">Erlebnis-Genre</Label>
              <select
                id="genre"
                name="genre"
                defaultValue={tour.genre ?? ""}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">– Kein Genre –</option>
                {GENRE_KEYS.map((key) => (
                  <option key={key} value={key}>
                    {GENRES[key].label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                name="status"
                defaultValue={tour.status}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="draft">Entwurf</option>
                <option value="published">Veröffentlicht</option>
              </select>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            {saved && <p className="text-sm text-muted-foreground">Gespeichert.</p>}
            <Button type="submit" className="mt-2">
              Speichern
            </Button>
          </form>
        </CardContent>
      </Card>

      <h2 className="mt-10 text-xl font-semibold tracking-tight">Stationen</h2>

      <div className="mt-4 flex flex-col gap-3">
        {stations.map((station, index) => (
          <Card key={station.id}>
            <CardContent className="py-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Station {index + 1}
                  </p>
                  <p className="font-medium">{station.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {station.latitude}, {station.longitude}
                    {station.trigger_radius_m
                      ? ` · Radius ${station.trigger_radius_m} m`
                      : ""}
                  </p>
                </div>
                <form action={deleteStation.bind(null, tour.id, station.id)}>
                  <Button type="submit" variant="ghost" size="sm">
                    Entfernen
                  </Button>
                </form>
              </div>

              <details className="group mt-3">
                <summary className="cursor-pointer list-none text-sm font-medium text-primary hover:underline">
                  <span className="group-open:hidden">Bearbeiten</span>
                  <span className="hidden group-open:inline">
                    Bearbeiten schliessen
                  </span>
                </summary>
                <form
                  action={updateStation.bind(null, tour.id, station.id)}
                  className="mt-4 flex flex-col gap-4 border-t pt-4"
                >
                  <StationFields
                    idPrefix={`station-${station.id}`}
                    tourId={tour.id}
                    station={station}
                    ai={ai}
                  />
                  <Button type="submit" className="mt-2 self-start">
                    Station speichern
                  </Button>
                </form>
              </details>

              <details className="group mt-2">
                <summary className="cursor-pointer list-none text-sm font-medium text-primary hover:underline">
                  Fotos &amp; Videos
                  {mediaByStation.get(station.id)?.length
                    ? ` (${mediaByStation.get(station.id)!.length})`
                    : ""}
                </summary>
                <div className="mt-4 flex flex-col gap-4 border-t pt-4">
                  {(mediaByStation.get(station.id)?.length ?? 0) > 0 && (
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                      {mediaByStation.get(station.id)!.map((m) => (
                        <div
                          key={m.id}
                          className="group/media relative overflow-hidden rounded-md border"
                        >
                          {m.media_type === "video" ? (
                            <video
                              src={m.url}
                              className="aspect-square w-full object-cover"
                            />
                          ) : (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={m.url}
                              alt={m.caption ?? ""}
                              className="aspect-square w-full object-cover"
                            />
                          )}
                          <form
                            action={deleteStationMedia.bind(null, tour.id, m.id)}
                            className="absolute right-1 top-1"
                          >
                            <button
                              type="submit"
                              aria-label="Medium entfernen"
                              className="rounded-full bg-background/90 px-2 py-0.5 text-xs font-medium text-destructive shadow-sm"
                            >
                              ✕
                            </button>
                          </form>
                        </div>
                      ))}
                    </div>
                  )}
                  <MediaUpload tourId={tour.id} stationId={station.id} />
                </div>
              </details>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Station hinzufügen</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={addStationWithId} className="flex flex-col gap-4">
            <StationFields idPrefix="new-station" tourId={tour.id} />
            <Button type="submit" className="mt-2">
              Station hinzufügen
            </Button>
          </form>
        </CardContent>
      </Card>

      {tourTranslations === null ? (
        <p className="mt-10 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
          Übersetzungen: Migration 003 (tour_translations /
          station_translations) in Supabase ausführen, um Sprachfassungen zu
          pflegen.
        </p>
      ) : (
        <TranslationsEditor
          tour={tour}
          stations={stations}
          tourTranslations={tourTranslations}
          stationTranslations={stationTranslations}
          ai={ai}
        />
      )}

      <h2 className="mt-10 text-xl font-semibold tracking-tight">
        Feedback &amp; Statistik
      </h2>

      {feedback === null ? (
        <p className="mt-4 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
          Migration 005 (tour_feedback / tour_views) in Supabase ausführen, um
          Bewertungen und Aufrufe zu sehen.
        </p>
      ) : (
        <Card className="mt-4">
          <CardContent className="py-4">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Eye aria-hidden="true" className="size-4" />
                {viewCount} Aufrufe
              </span>
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Star aria-hidden="true" className="size-4 fill-current text-primary" />
                {feedback.length > 0
                  ? `${(feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length).toFixed(1)} Ø (${feedback.length})`
                  : "Noch keine Bewertungen"}
              </span>
            </div>

            {feedback.length > 0 && (
              <ul className="mt-4 flex flex-col gap-3 border-t pt-4">
                {feedback.map((f) => (
                  <li
                    key={f.id}
                    className="flex items-start justify-between gap-4 text-sm"
                  >
                    <div>
                      <div className="flex items-center gap-0.5 text-primary">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Star
                            key={i}
                            aria-hidden="true"
                            className="size-3.5"
                            fill={i <= f.rating ? "currentColor" : "none"}
                          />
                        ))}
                      </div>
                      {f.comment && (
                        <p className="mt-1 text-muted-foreground">{f.comment}</p>
                      )}
                    </div>
                    <form action={deleteFeedback.bind(null, tour.id, f.id)}>
                      <Button type="submit" variant="ghost" size="sm">
                        Entfernen
                      </Button>
                    </form>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
