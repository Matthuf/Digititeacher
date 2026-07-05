import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import type { Station, Tour } from "@/lib/tours";
import { TourPlayer } from "@/components/tour-player";
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
        <TourPlayer stations={stations} />
      </div>
    </div>
  );
}
