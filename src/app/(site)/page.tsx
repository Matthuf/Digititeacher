import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import type { Tour } from "@/lib/tours";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

async function getPublishedTours(): Promise<Tour[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tours")
    .select("*")
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export default async function HomePage() {
  const tours = isSupabaseConfigured ? await getPublishedTours() : [];

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Audiotouren</h1>
      <p className="mt-2 text-muted-foreground">
        Entdecke selbst erstellte Audioguides und höre sie direkt im Browser.
      </p>

      {!isSupabaseConfigured && (
        <p className="mt-8 rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
          Supabase ist noch nicht konfiguriert (NEXT_PUBLIC_SUPABASE_URL /
          NEXT_PUBLIC_SUPABASE_ANON_KEY fehlen). Sobald das Projekt verbunden
          ist, erscheinen hier veröffentlichte Touren.
        </p>
      )}

      {isSupabaseConfigured && tours.length === 0 && (
        <p className="mt-8 rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
          Noch keine veröffentlichten Touren. Lege im{" "}
          <Link href="/studio" className="underline">
            Studio
          </Link>{" "}
          deine erste Tour an.
        </p>
      )}

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        {tours.map((tour) => (
          <Link key={tour.id} href={`/touren/${tour.slug}`}>
            <Card className="h-full transition-shadow hover:shadow-md">
              <CardHeader>
                <CardTitle>{tour.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {tour.description && (
                  <p className="text-sm text-muted-foreground">
                    {tour.description}
                  </p>
                )}
                <div className="flex gap-2">
                  {tour.region && <Badge variant="secondary">{tour.region}</Badge>}
                  {tour.duration_minutes && (
                    <Badge variant="outline">{tour.duration_minutes} min</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
