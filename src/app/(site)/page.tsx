import Link from "next/link";
import { ArrowRight, Compass, Navigation, PenLine, Smartphone } from "lucide-react";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { getFeaturedToursWithPins, type TourWithPin } from "@/lib/get-tours";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/reveal";
import { TwilightRidges } from "@/components/twilight-ridges";
import { TourCarousel } from "@/components/tour-carousel";
import { T } from "@/components/i18n/t";

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
      tours = await getFeaturedToursWithPins();
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
                <Link href="/touren">
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

      {/* Highlight-Touren */}
      {isSupabaseConfigured && !loadError && tours.length > 0 && (
        <section id="touren" className="scroll-mt-24">
          <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
            <Reveal>
              <div className="flex flex-wrap items-end justify-between gap-4">
                <h2 className="font-serif text-3xl font-semibold tracking-tight">
                  <T k="home.highlights.title" />
                </h2>
                <Link
                  href="/touren"
                  className="flex items-center gap-1.5 text-sm font-bold text-primary"
                >
                  <T k="home.highlights.viewAll" />
                  <ArrowRight aria-hidden="true" className="size-4" />
                </Link>
              </div>
            </Reveal>
            <div className="mt-8">
              <TourCarousel tours={tours} />
            </div>
          </div>
        </section>
      )}
    </>
  );
}
