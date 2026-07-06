import Link from "next/link";
import { Compass, Navigation, PenLine, Smartphone } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import type { Tour } from "@/lib/tours";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/reveal";
import { Ridgeline } from "@/components/ridgeline";
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

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
        >
          <div className="absolute right-[6%] top-8 size-44 rounded-full bg-primary/25 blur-3xl sm:size-64" />
          <div className="absolute right-[11%] top-16 size-20 rounded-full bg-primary/60 blur-lg sm:size-28" />
          <Ridgeline className="absolute bottom-0 left-0 h-28 w-full text-foreground sm:h-40" />
        </div>

        <div className="relative mx-auto max-w-6xl px-6 pb-36 pt-20 sm:pb-48 sm:pt-28">
          <Reveal>
            <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-primary">
              <Compass aria-hidden="true" className="size-4" />
              GPS-Audioguides zum Wandern
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
              GPS-geführte Audiotouren, die genau dort weitererzählen, wo du
              gerade stehst – mitten in der Landschaft, direkt im Browser.
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
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="font-serif text-3xl font-semibold tracking-tight">
                  Alle Touren
                </h2>
                {tours.length > 0 && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {tours.length} {tours.length === 1 ? "Tour" : "Touren"}{" "}
                    online
                  </p>
                )}
              </div>
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

          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {tours.map((tour, i) => (
              <Reveal key={tour.id} delay={Math.min(i * 0.07, 0.35)} className="h-full">
                <TourCard tour={tour} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
