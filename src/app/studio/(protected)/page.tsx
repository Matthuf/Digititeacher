import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Tour } from "@/lib/tours";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

async function getAllTours(): Promise<Tour[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tours")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export default async function StudioDashboardPage() {
  const tours = await getAllTours();

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Deine Touren</h1>
        <Button asChild>
          <Link href="/studio/tours/new">Neue Tour</Link>
        </Button>
      </div>

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
              {tour.region && (
                <CardContent className="text-sm text-muted-foreground">
                  {tour.region}
                </CardContent>
              )}
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
