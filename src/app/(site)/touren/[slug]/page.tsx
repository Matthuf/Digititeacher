import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, MapPin, Mountain } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import {
  localizeStations,
  localizeTour,
  type Station,
  type StationMedia,
  type StationTranslation,
  type Tour,
  type TourFeedback,
  type TourTranslation,
} from "@/lib/tours";
import {
  BASE_LOCALE,
  LOCALE_LABELS,
  isTranslationLocale,
  type Locale,
} from "@/lib/locales";
import { GENRES, isGenre } from "@/lib/genres";
import { TourPlayer } from "@/components/tour-player";
import { TourFeedbackSection } from "@/components/tour-feedback";
import { Reveal } from "@/components/reveal";
import { T } from "@/components/i18n/t";
import { submitFeedback } from "./actions";

type TourData = {
  tour: Tour;
  stations: Station[];
  tourTranslations: TourTranslation[];
  stationTranslations: StationTranslation[];
  media: Record<string, StationMedia[]>;
  feedback: TourFeedback[];
};

async function getTour(slug: string): Promise<TourData | null> {
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

  const stationIds = (stations ?? []).map((s) => s.id);

  // Übersetzungen, Medien und Feedback sind optional (Migration 003/004/005) –
  // still ignorieren, falls die Migration noch nicht ausgeführt wurde.
  const [tt, st, md, fb] = await Promise.all([
    supabase.from("tour_translations").select("*").eq("tour_id", tour.id),
    supabase
      .from("station_translations")
      .select("*")
      .in("station_id", stationIds),
    supabase
      .from("station_media")
      .select("*")
      .in("station_id", stationIds)
      .order("order_index", { ascending: true }),
    supabase
      .from("tour_feedback")
      .select("*")
      .eq("tour_id", tour.id)
      .order("created_at", { ascending: false }),
  ]);

  const media: Record<string, StationMedia[]> = {};
  if (!md.error) {
    for (const m of md.data ?? []) {
      (media[m.station_id] ??= []).push(m);
    }
  }

  // Aufruf für die Studio-Statistik zählen – best effort, kein Blocker.
  supabase
    .from("tour_views")
    .insert({ tour_id: tour.id })
    .then(
      () => {},
      () => {},
    );

  return {
    tour,
    stations: stations ?? [],
    tourTranslations: tt.error ? [] : (tt.data ?? []),
    stationTranslations: st.error ? [] : (st.data ?? []),
    media,
    feedback: fb.error ? [] : (fb.data ?? []),
  };
}

export default async function TourDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lang?: string; feedback?: string; error?: string }>;
}) {
  const { slug } = await params;
  const { lang, feedback: justSubmitted, error: feedbackError } =
    await searchParams;

  if (!isSupabaseConfigured) notFound();

  let result: TourData | null = null;
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
          <T k="tour.loadError.title" />
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          <T k="tour.loadError.text" />
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-2 text-sm text-primary hover:underline"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          <T k="tour.back" />
        </Link>
      </div>
    );
  }

  if (!result) notFound();
  const { tourTranslations, stationTranslations } = result;

  // Verfügbare Sprachen: Basis + Sprachen mit Inhalten.
  const translatedLocales = [
    ...new Set(
      [...tourTranslations, ...stationTranslations].map((t) => t.locale),
    ),
  ].filter(isTranslationLocale);
  const availableLocales: Locale[] = [BASE_LOCALE, ...translatedLocales];

  const activeLocale: Locale =
    isTranslationLocale(lang) && translatedLocales.includes(lang)
      ? lang
      : BASE_LOCALE;

  const tour =
    activeLocale === BASE_LOCALE
      ? result.tour
      : localizeTour(
          result.tour,
          tourTranslations.find((t) => t.locale === activeLocale),
        );
  const stations =
    activeLocale === BASE_LOCALE
      ? result.stations
      : localizeStations(
          result.stations,
          stationTranslations.filter((t) => t.locale === activeLocale),
        );

  const genre = isGenre(tour.genre) ? GENRES[tour.genre] : null;

  return (
    <article className="mx-auto max-w-3xl px-6 py-12 sm:py-16">
      <Reveal>
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/#touren"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            <T k="tour.back" />
          </Link>
          {availableLocales.length > 1 && (
            <nav
              aria-label="Sprache wählen / Choose language"
              className="flex items-center gap-1 rounded-full border p-1"
            >
              {availableLocales.map((locale) => (
                <Link
                  key={locale}
                  href={
                    locale === BASE_LOCALE
                      ? `/touren/${slug}`
                      : `/touren/${slug}?lang=${locale}`
                  }
                  aria-current={locale === activeLocale ? "page" : undefined}
                  title={LOCALE_LABELS[locale]}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium uppercase transition-colors ${
                    locale === activeLocale
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {locale}
                </Link>
              ))}
            </nav>
          )}
        </div>
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
                  {tour.duration_minutes} <T k="tour.minutes" />
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
        <TourPlayer tourId={tour.id} stations={stations} media={result.media} />
      </div>

      <TourFeedbackSection
        action={submitFeedback.bind(null, result.tour.id, slug)}
        feedback={result.feedback}
        justSubmitted={justSubmitted === "1"}
        error={feedbackError}
        lang={activeLocale !== BASE_LOCALE ? activeLocale : undefined}
      />
    </article>
  );
}
