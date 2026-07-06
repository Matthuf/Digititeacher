import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, MapPin, Mountain } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import type { Station, Tour } from "@/lib/tours";
import { GENRES, isGenre } from "@/lib/genres";
import { TourPlayer } from "@/components/tour-player";
import { Reveal } from "@/components/reveal";

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

  let result: { tour: Tour; stations: Station[] } | null = null;
  let loadError = false;
  try {
    result = await getTour(slug);
  } catch {
    loadError = true;
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-24 text-center">
        <h1 className="font-serif text-2xl font-semibold">
          Tour kann gerade nicht geladen werden
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Bitte versuche es in ein paar Minuten noch einmal.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-2 text-sm text-primary hover:underline"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Zurück zu allen Touren
        </Link>
      </div>
    );
  }

  if (!result) notFound();
  const { tour, stations } = result;
  const genre = isGenre(tour.genre) ? GENRES[tour.genre] : null;

  return (
    <article className="mx-auto max-w-3xl px-6 py-12 sm:py-16">
      <Reveal>
        <Link
          href="/#touren"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Alle Touren
        </Link>
      </Reveal>

      <header className="mt-6">
        <Reveal delay={0.05}>
          <h1 className="font-serif text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            {tour.title}
          </h1>
          {genre && (
            <div className="mt-4 flex items-center gap-3">
              <span
                aria-hidden="true"
                className={`h-1 w-12 rounded-full ${genre.lineClass}`}
              />
              <span className="text-sm font-medium text-muted-foreground">
                {genre.label}
              </span>
            </div>
          )}
        </Reveal>
        <Reveal delay={0.12}>
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
            {tour.region && (
              <span className="flex items-center gap-1.5">
                <MapPin aria-hidden="true" className="size-4 text-primary" />
                {tour.region}
              </span>
            )}
            {tour.duration_minutes && (
              <span className="flex items-center gap-1.5">
                <Clock aria-hidden="true" className="size-4 text-primary" />
                <span className="tabular-nums">
                  {tour.duration_minutes} Minuten
                </span>
              </span>
            )}
            {tour.difficulty && (
              <span className="flex items-center gap-1.5">
                <Mountain aria-hidden="true" className="size-4 text-primary" />
                {tour.difficulty}
              </span>
            )}
          </div>
        </Reveal>
        {tour.description && (
          <Reveal delay={0.18}>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              {tour.description}
            </p>
          </Reveal>
        )}
      </header>

      {tour.cover_image_url && (
        <Reveal delay={0.22}>
          <div className="relative mt-8 aspect-[5/2] overflow-hidden rounded-2xl border">
            <Image
              src={tour.cover_image_url}
              alt={`Cover von ${tour.title}`}
              fill
              priority
              sizes="(min-width: 768px) 768px, 100vw"
              className="object-cover"
            />
          </div>
        </Reveal>
      )}

      <div className="mt-10">
        <TourPlayer stations={stations} />
      </div>
    </article>
  );
}
