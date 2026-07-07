import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type {
  Station,
  StationTranslation,
  Tour,
  TourTranslation,
} from "@/lib/tours";
import {
  addStation,
  deleteStation,
  updateStation,
  updateTour,
} from "@/app/studio/actions";
import { GENRE_KEYS, GENRES } from "@/lib/genres";
import { aiStatus } from "@/lib/ai/status";
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
    </div>
  );
}
