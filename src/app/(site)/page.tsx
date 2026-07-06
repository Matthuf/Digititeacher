import Link from "next/link";
import { Compass, Navigation, PenLine, Smartphone } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import type { Tour } from "@/lib/tours";
import { GENRE_KEYS, GENRES, isGenre } from "@/lib/genres";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/reveal";
import { TwilightRidges } from "@/components/twilight-ridges";
import { TourCard } from "@/components/tour-card";

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

const features = [
  {
    icon: Navigation,
    title: "GPS-Autoplay",
    text: "Die Erzählung startet automatisch, sobald du eine Station erreichst.",
  },
  {
    icon: Smartphone,
    title: "Keine App nötig",
    text: "Alles läuft direkt im Browser – Link öffnen und loswandern.",
  },
  {
    icon: PenLine,
    title: "Von Hand gemacht",
    text: "Jede Tour ist recherchiert, geschrieben und selbst vertont.",
  },
];

function groupByGenre(tours: Tour[]) {
  const withGenre = GENRE_KEYS.map((key) => ({
    key,
    label: GENRES[key].label,
    tours: tours.filter((t) => t.genre === key),
  })).filter((group) => group.tours.length > 0);

  const rest = tours.filter((t) => !isGenre(t.genre));
  return { withGenre, rest };
}

export default async function HomePage() {
  let tours: Tour[] = [];
  let loadError = false;

  if (isSupabaseConfigured) {
    try {
      tours = await getPublishedTours();
    } catch {
      loadError = true;
    }
  }

  const { withGenre, rest } = groupByGenre(tours);
  const useSections = withGenre.length > 0;

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <TwilightRidges className="absolute inset-0" />

        <div className="relative mx-auto max-w-6xl px-6 pb-52 pt-20 sm:pb-72 sm:pt-28">
          <Reveal>
            <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-primary">
              <Compass aria-hidden="true" className="size-4" />
              GPS-Audiotouren zum Erleben
            </p>
          </Reveal>
          <Reveal delay={0.08}>
            <h1 className="mt-5 max-w-2xl font-serif text-4xl font-semibold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Wege, die{" "}
              <em className="italic text-primary">erzählen</em>.
            </h1>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
              Geschichten für Kinder, Wissen über Natur und Kultur, Rundgänge
              zu zweit – erzählt genau dort, wo du gerade stehst. Direkt im
              Browser.
            </p>
          </Reveal>
          <Reveal delay={0.24}>
            <div className="mt-9">
              <Button asChild size="lg" className="rounded-full px-7">
                <Link href="/#touren">Touren entdecken</Link>
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Feature strip */}
      <section className="border-y bg-card/60">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 sm:grid-cols-3 sm:gap-6">
          {features.map((feature, i) => (
            <Reveal key={feature.title} delay={i * 0.08}>
              <div className="flex gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/12 text-primary">
                  <feature.icon aria-hidden="true" className="size-5" />
                </span>
                <div>
                  <h2 className="font-medium">{feature.title}</h2>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {feature.text}
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
                Alle Touren
              </h2>
              {tours.length > 0 && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {tours.length} {tours.length === 1 ? "Tour" : "Touren"} online
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
                  Supabase ist noch nicht konfiguriert. Sobald das Projekt
                  verbunden ist, erscheinen hier die veröffentlichten Touren.
                </p>
              </div>
            </Reveal>
          )}

          {loadError && (
            <Reveal delay={0.1}>
              <div className="mt-10 rounded-2xl border border-destructive/40 bg-destructive/5 p-10 text-center">
                <p className="text-sm text-muted-foreground">
                  Die Touren können gerade nicht geladen werden. Bitte versuche
                  es in ein paar Minuten noch einmal.
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
                  Noch keine Touren veröffentlicht. Die erste entsteht gerade im{" "}
                  <Link href="/studio" className="underline hover:text-foreground">
                    Studio
                  </Link>
                  .
                </p>
              </div>
            </Reveal>
          )}

          {useSections ? (
            <div className="mt-10 flex flex-col gap-14">
              {withGenre.map((group) => (
                <div key={group.key}>
                  <Reveal>
                    <div className="flex items-center gap-3">
                      <span
                        aria-hidden="true"
                        className={`h-6 w-1 rounded-full ${GENRES[group.key].lineClass}`}
                      />
                      <h3 className="font-serif text-xl font-semibold tracking-tight">
                        {group.label}
                      </h3>
                    </div>
                  </Reveal>
                  <div className="mt-5 grid gap-6 sm:grid-cols-2">
                    {group.tours.map((tour, i) => (
                      <Reveal
                        key={tour.id}
                        delay={Math.min(i * 0.07, 0.35)}
                        className="h-full"
                      >
                        <TourCard tour={tour} />
                      </Reveal>
                    ))}
                  </div>
                </div>
              ))}
              {rest.length > 0 && (
                <div>
                  <Reveal>
                    <h3 className="font-serif text-xl font-semibold tracking-tight">
                      Weitere Touren
                    </h3>
                  </Reveal>
                  <div className="mt-5 grid gap-6 sm:grid-cols-2">
                    {rest.map((tour, i) => (
                      <Reveal
                        key={tour.id}
                        delay={Math.min(i * 0.07, 0.35)}
                        className="h-full"
                      >
                        <TourCard tour={tour} />
                      </Reveal>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="mt-10 grid gap-6 sm:grid-cols-2">
              {tours.map((tour, i) => (
                <Reveal
                  key={tour.id}
                  delay={Math.min(i * 0.07, 0.35)}
                  className="h-full"
                >
                  <TourCard tour={tour} />
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
