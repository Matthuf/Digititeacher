import Link from "next/link";
import { Compass, Navigation, PenLine, Smartphone } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import type { Tour } from "@/lib/tours";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/reveal";
import { TwilightRidges } from "@/components/twilight-ridges";
import { CatalogBrowser } from "@/components/catalog-browser";
import { T } from "@/components/i18n/t";

type TourWithPin = Tour & { mapPosition: { lat: number; lng: number } | null };

async function getPublishedToursWithPins(): Promise<TourWithPin[]> {
  const supabase = await createClient();
  const { data: tours, error } = await supabase
    .from("tours")
    .select("*")
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (error) throw error;
  if (!tours || tours.length === 0) return [];

  const { data: stations } = await supabase
    .from("stations")
    .select("tour_id, latitude, longitude, order_index")
    .in("tour_id", tours.map((t) => t.id))
    .order("order_index", { ascending: true });

  const firstStationByTour = new Map<string, { lat: number; lng: number }>();
  for (const s of stations ?? []) {
    if (!firstStationByTour.has(s.tour_id)) {
      firstStationByTour.set(s.tour_id, { lat: s.latitude, lng: s.longitude });
    }
  }

  return tours.map((tour) => ({
    ...tour,
    mapPosition: firstStationByTour.get(tour.id) ?? null,
  }));
}

const features = [
  { icon: Navigation, key: "autoplay" },
  { icon: Smartphone, key: "noapp" },
  { icon: PenLine, key: "handmade" },
];

export default async function HomePage() {
  let tours: TourWithPin[] = [];
  let loadError = false;

  if (isSupabaseConfigured) {
    try {
      tours = await getPublishedToursWithPins();
    } catch {
      loadError = true;
    }
  }

  return (
    <>
      {/* Hero */}
      <section className="group/hero relative overflow-hidden">
        <TwilightRidges className="absolute inset-0" />

        <div className="relative mx-auto max-w-6xl px-6 pb-52 pt-20 sm:pb-72 sm:pt-28">
          <Reveal>
            <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-primary">
              <Compass aria-hidden="true" className="size-4" />
              <T k="hero.eyebrow" />
            </p>
          </Reveal>
          <Reveal delay={0.08}>
            <h1 className="mt-5 max-w-2xl font-serif text-4xl font-semibold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              <T k="hero.titleMain" />{" "}
              <em className="italic text-primary">
                <T k="hero.titleAccent" />
              </em>
              .
            </h1>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
              <T k="hero.subtitle" />
            </p>
          </Reveal>
          <Reveal delay={0.24}>
            <div className="mt-9">
              <Button asChild size="lg" className="rounded-full px-7">
                <Link href="/#touren">
                  <T k="hero.cta" />
                </Link>
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Feature strip */}
      <section className="border-y bg-card/60">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 sm:grid-cols-3 sm:gap-6">
          {features.map((feature, i) => (
            <Reveal key={feature.key} delay={i * 0.08}>
              <div className="flex gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/12 text-primary">
                  <feature.icon aria-hidden="true" className="size-5" />
                </span>
                <div>
                  <h2 className="font-medium">
                    <T k={`features.${feature.key}.title`} />
                  </h2>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    <T k={`features.${feature.key}.text`} />
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Catalog */}
      <section id="touren" className="scroll-mt-24">
        <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
          <Reveal>
            <div>
              <h2 className="font-serif text-3xl font-semibold tracking-tight">
                <T k="catalog.title" />
              </h2>
              {tours.length > 0 && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {tours.length}{" "}
                  <T k={tours.length === 1 ? "catalog.count.one" : "catalog.count.other"} />
                </p>
              )}
            </div>
          </Reveal>

          {!isSupabaseConfigured && (
            <Reveal delay={0.1}>
              <div className="mt-10 rounded-2xl border border-dashed p-10 text-center">
                <Compass
                  aria-hidden="true"
                  className="mx-auto size-8 text-muted-foreground"
                />
                <p className="mt-4 text-sm text-muted-foreground">
                  <T k="catalog.notConfigured" />
                </p>
              </div>
            </Reveal>
          )}

          {loadError && (
            <Reveal delay={0.1}>
              <div className="mt-10 rounded-2xl border border-destructive/40 bg-destructive/5 p-10 text-center">
                <p className="text-sm text-muted-foreground">
                  <T k="catalog.loadError" />
                </p>
              </div>
            </Reveal>
          )}

          {isSupabaseConfigured && !loadError && tours.length === 0 && (
            <Reveal delay={0.1}>
              <div className="mt-10 rounded-2xl border border-dashed p-10 text-center">
                <Compass
                  aria-hidden="true"
                  className="mx-auto size-8 text-muted-foreground"
                />
                <p className="mt-4 text-sm text-muted-foreground">
                  <T k="catalog.empty.before" />{" "}
                  <Link href="/studio" className="underline hover:text-foreground">
                    <T k="catalog.empty.studio" />
                  </Link>
                  .
                </p>
              </div>
            </Reveal>
          )}

          {isSupabaseConfigured && !loadError && tours.length > 0 && (
            <CatalogBrowser tours={tours} />
          )}
        </div>
      </section>
    </>
  );
}
