import Link from "next/link";
import { Eye, Star } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { Tour } from "@/lib/tours";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type TourStats = { views: number; ratingAvg: number | null; ratingCount: number };

async function getAllTours(): Promise<Tour[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tours")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

// Statistik ist optional (Migration 005) – tolerant, falls sie noch fehlt.
async function getStatsByTour(
  tourIds: string[],
): Promise<Map<string, TourStats>> {
  const stats = new Map<string, TourStats>();
  if (tourIds.length === 0) return stats;

  const supabase = await createClient();
  const [views, feedback] = await Promise.all([
    supabase.from("tour_views").select("tour_id").in("tour_id", tourIds),
    supabase
      .from("tour_feedback")
      .select("tour_id, rating")
      .in("tour_id", tourIds),
  ]);

  if (views.error || feedback.error) return stats;

  for (const id of tourIds) stats.set(id, { views: 0, ratingAvg: null, ratingCount: 0 });

  for (const v of views.data ?? []) {
    const s = stats.get(v.tour_id);
    if (s) s.views += 1;
  }

  const ratingSums = new Map<string, number>();
  for (const f of feedback.data ?? []) {
    const s = stats.get(f.tour_id);
    if (!s) continue;
    s.ratingCount += 1;
    ratingSums.set(f.tour_id, (ratingSums.get(f.tour_id) ?? 0) + f.rating);
  }
  for (const [tourId, sum] of ratingSums) {
    const s = stats.get(tourId);
    if (s) s.ratingAvg = sum / s.ratingCount;
  }

  return stats;
}

export default async function StudioDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ imported?: string }>;
}) {
  const tours = await getAllTours();
  const stats = await getStatsByTour(tours.map((t) => t.id));
  const { imported } = await searchParams;

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Deine Touren</h1>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/studio/import">Excel-Import</Link>
          </Button>
          <Button asChild>
            <Link href="/studio/tours/new">Neue Tour</Link>
          </Button>
        </div>
      </div>

      {imported && (
        <p className="mt-6 rounded-lg border border-mist/40 bg-mist/5 p-4 text-sm">
          {imported} {Number(imported) === 1 ? "Tour" : "Touren"} als Entwurf
          importiert.
        </p>
      )}

      {tours.length === 0 && (
        <p className="mt-8 rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
          Noch keine Touren angelegt.
        </p>
      )}

      <div className="mt-8 flex flex-col gap-4">
        {tours.map((tour) => (
          <Link key={tour.id} href={`/studio/tours/${tour.id}`}>
            <Card className="transition-shadow hover:shadow-md">
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle>{tour.title}</CardTitle>
                <Badge variant={tour.status === "published" ? "default" : "secondary"}>
                  {tour.status === "published" ? "veröffentlicht" : "Entwurf"}
                </Badge>
              </CardHeader>
              {(tour.region || stats.has(tour.id)) && (
                <CardContent className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  {tour.region && <span>{tour.region}</span>}
                  {stats.has(tour.id) && (
                    <>
                      <span className="flex items-center gap-1.5">
                        <Eye aria-hidden="true" className="size-3.5" />
                        {stats.get(tour.id)!.views}
                      </span>
                      {stats.get(tour.id)!.ratingCount > 0 && (
                        <span className="flex items-center gap-1.5">
                          <Star aria-hidden="true" className="size-3.5 fill-current" />
                          {stats.get(tour.id)!.ratingAvg!.toFixed(1)} (
                          {stats.get(tour.id)!.ratingCount})
                        </span>
                      )}
                    </>
                  )}
                </CardContent>
              )}
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
