import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import type { Station, Tour } from "@/lib/tours";
import { TourMap } from "@/components/tour-map";
import { Badge } from "@/components/ui/badge";

async function getTour(
  slug: string,
): Promise<{ tour: Tour; stations: Station[] } | null> {
  const supabase = await createClient();
  const { data: tour, error: tourError } = await supabase
    .from("tours")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (tourError) throw tourError;
  if (!tour) return null;

  const { data: stations, error: stationsError } = await supabase
    .from("stations")
    .select("*")
    .eq("tour_id", tour.id)
    .order("order_index", { ascending: true });

  if (stationsError) throw stationsError;

  return { tour, stations: stations ?? [] };
}

export default async function TourDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  if (!isSupabaseConfigured) notFound();

  const result = await getTour(slug);
  if (!result) notFound();

  const { tour, stations } = result;

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">{tour.title}</h1>
      <div className="mt-2 flex gap-2">
        {tour.region && <Badge variant="secondary">{tour.region}</Badge>}
        {tour.duration_minutes && (
          <Badge variant="outline">{tour.duration_minutes} min</Badge>
        )}
        {tour.difficulty && <Badge variant="outline">{tour.difficulty}</Badge>}
      </div>
      {tour.description && (
        <p className="mt-4 text-muted-foreground">{tour.description}</p>
      )}

      <div className="mt-8">
        <TourMap
          stations={stations.map((s) => ({
            id: s.id,
            title: s.title,
            latitude: s.latitude,
            longitude: s.longitude,
          }))}
        />
      </div>

      <ol className="mt-8 flex flex-col gap-6">
        {stations.map((station, index) => (
          <li key={station.id} className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">
              Station {index + 1}
            </p>
            <h2 className="text-lg font-medium">{station.title}</h2>
            {station.description && (
              <p className="mt-1 text-sm text-muted-foreground">
                {station.description}
              </p>
            )}
            {station.audio_url && (
              <audio className="mt-3 w-full" controls src={station.audio_url} />
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
