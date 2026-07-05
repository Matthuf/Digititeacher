import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Station, Tour } from "@/lib/tours";
import { addStation, deleteStation, updateTour } from "@/app/studio/actions";
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
            <CardContent className="flex items-start justify-between gap-4 py-4">
              <div>
                <p className="text-sm text-muted-foreground">
                  Station {index + 1}
                </p>
                <p className="font-medium">{station.title}</p>
                <p className="text-sm text-muted-foreground">
                  {station.latitude}, {station.longitude}
                </p>
              </div>
              <form action={deleteStation.bind(null, tour.id, station.id)}>
                <Button type="submit" variant="ghost" size="sm">
                  Entfernen
                </Button>
              </form>
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
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="station-title">Titel</Label>
              <Input id="station-title" name="title" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="station-description">Beschreibung</Label>
              <Input id="station-description" name="description" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="latitude">Breitengrad</Label>
                <Input
                  id="latitude"
                  name="latitude"
                  type="number"
                  step="any"
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="longitude">Längengrad</Label>
                <Input
                  id="longitude"
                  name="longitude"
                  type="number"
                  step="any"
                  required
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="audio_url">Audio-URL</Label>
              <Input id="audio_url" name="audio_url" placeholder="https://..." />
            </div>
            <Button type="submit" className="mt-2">
              Station hinzufügen
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
