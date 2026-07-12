import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Backpack,
  Car,
  Check,
  ChevronDown,
  Clock,
  Flag,
  Footprints,
  MapPin,
  Mountain,
  Play,
  Star,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { distanceMeters } from "@/lib/geo";
import { getSimilarTours } from "@/lib/get-tours";
import {
  localizeStations,
  localizeTour,
  type Station,
  type StationMedia,
  type StationQuiz,
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
import { retrieveCheckoutSession, stripeConfigured } from "@/lib/payments/stripe";
import { hasPurchase } from "@/lib/payments/purchases";
import { TourPlayer } from "@/components/tour-player";
import { TourFeedbackSection } from "@/components/tour-feedback";
import { OfflineDownloadButton } from "@/components/offline-download-button";
import { PurchaseGate } from "@/components/purchase-gate";
import { TourPreviewMap } from "@/components/tour-preview-map";
import { TourStickyCta } from "@/components/tour-sticky-cta";
import { TourCard } from "@/components/tour-card";
import { Reveal } from "@/components/reveal";
import { T } from "@/components/i18n/t";
import { restorePurchase, startCheckout, submitFeedback } from "./actions";

type TourData = {
  tour: Tour;
  stations: Station[];
  tourTranslations: TourTranslation[];
  stationTranslations: StationTranslation[];
  media: Record<string, StationMedia[]>;
  feedback: TourFeedback[];
  quiz: Record<string, StationQuiz>;
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

  // Übersetzungen, Medien, Feedback und Quiz sind optional
  // (Migration 003/004/005/006) – still ignorieren, falls sie noch fehlen.
  const [tt, st, md, fb, qz] = await Promise.all([
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
    supabase.from("station_quiz").select("*").in("station_id", stationIds),
  ]);

  const media: Record<string, StationMedia[]> = {};
  if (!md.error) {
    for (const m of md.data ?? []) {
      (media[m.station_id] ??= []).push(m);
    }
  }

  const quiz: Record<string, StationQuiz> = {};
  if (!qz.error) {
    for (const q of qz.data ?? []) quiz[q.station_id] = q;
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
    quiz,
  };
}

const FALLBACK_METADATA: Metadata = {
  title: "SendaLore – Geschichten, die deinen Weg begleiten",
  description:
    "Audiotouren für Natur, Kultur und kleine Abenteuer. Die Geschichten starten automatisch dort, wo du gerade stehst. Ohne App.",
};

// Individuelle Metadaten pro Tour: teilbare Links (WhatsApp, Facebook,
// Google) zeigen Tourname, -beschreibung und Coverbild statt des
// generischen Seitentitels. Fehlt Supabase/die Tour, greift der Fallback –
// nie werfen, damit die Seite trotzdem rendert.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  if (!isSupabaseConfigured) return FALLBACK_METADATA;

  const { slug } = await params;
  try {
    const supabase = await createClient();
    const { data: tour } = await supabase
      .from("tours")
      .select("title, description, cover_image_url")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();

    if (!tour) return FALLBACK_METADATA;

    const description = tour.description ?? FALLBACK_METADATA.description!;
    const images = tour.cover_image_url ? [tour.cover_image_url] : undefined;

    return {
      title: `${tour.title} – SendaLore`,
      description,
      openGraph: {
        title: tour.title,
        description,
        type: "article",
        ...(images ? { images } : {}),
      },
    };
  } catch {
    return FALLBACK_METADATA;
  }
}

export default async function TourDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    lang?: string;
    feedback?: string;
    error?: string;
    checkout?: string;
    session_id?: string;
    restored?: string;
  }>;
}) {
  const { slug } = await params;
  const {
    lang,
    feedback: justSubmitted,
    error: feedbackError,
    checkout,
    session_id: checkoutSessionId,
    restored,
  } = await searchParams;

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
          href="/touren"
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

  // Nach erfolgreichem Stripe-Checkout die Session serverseitig verifizieren,
  // bevor der Kauf im Browser als "freigeschaltet" markiert wird.
  let unlocked = false;
  if (checkout === "success" && checkoutSessionId && stripeConfigured()) {
    const session = await retrieveCheckoutSession(checkoutSessionId);
    unlocked =
      session?.payment_status === "paid" &&
      session.metadata?.tour_id === tour.id;
  }

  // Kauf-Wiederherstellung: Die E-Mail aus dem Query-Param (vom restorePurchase-
  // Server-Action gesetzt) unabhängig gegen die purchases-Tabelle verifizieren –
  // ein manuell getippter Parameter allein schaltet nicht frei.
  let restoreFailed = false;
  if (!unlocked && restored) {
    if (restored === "notfound") {
      restoreFailed = true;
    } else {
      const valid = await hasPurchase(tour.id, restored);
      if (valid) unlocked = true;
      else restoreFailed = true;
    }
  }

  const isPaid = !!tour.price && tour.price > 0 && stripeConfigured();
  const checkoutAction = startCheckout.bind(null, tour.id, slug);
  const restoreAction = restorePurchase.bind(null, tour.id, slug);

  // Dateien für den Offline-Download: Cover, Audios und Stationsbilder.
  // Videos und Kartenkacheln bleiben aussen vor (Grösse/CORS).
  const offlineUrls = [
    tour.cover_image_url,
    ...stations.map((s) => s.audio_url),
    ...Object.values(result.media)
      .flat()
      .filter((m) => m.media_type === "image")
      .map((m) => m.url),
  ].filter((url): url is string => Boolean(url));

  // Durchschnittsbewertung aus den bereits geladenen Feedbacks (keine neue Query).
  const avgRating =
    result.feedback.length > 0
      ? Math.round(
          (result.feedback.reduce((sum, f) => sum + f.rating, 0) /
            result.feedback.length) *
            10,
        ) / 10
      : null;

  // Kartenpins für die Vorschaukarte (Stationen in Reihenfolge).
  const stationPins = stations.map((s) => ({
    id: s.id,
    title: s.title,
    latitude: s.latitude,
    longitude: s.longitude,
  }));
  const startStation = stations[0] ?? null;

  // Entfernte, erweiterte Wegdaten für den "Tourdaten"-Block: nur zeigen, wenn
  // mindestens eines dieser Felder gesetzt ist (sonst dupliziert der Block nur
  // die Hero-Metazeile und wird weggelassen).
  const hasTrackData =
    tour.distance_km != null ||
    tour.elevation_gain_m != null ||
    tour.elevation_loss_m != null;

  // Ähnliche Touren (gleiches Genre) – best effort, blockiert die Seite nie.
  let similarTours: Tour[] = [];
  if (tour.genre) {
    try {
      similarTours = await getSimilarTours(tour.genre, tour.id, 3);
    } catch {
      similarTours = [];
    }
  }

  // Entfernung ab Start pro Station (aus Koordinaten, keine neue Spalte).
  const stationDistanceLabel = (station: Station): string | null => {
    if (!startStation) return null;
    const m = distanceMeters(startStation, station);
    if (m < 1) return null;
    return m >= 1000
      ? `${(m / 1000).toFixed(1)} km`
      : `${Math.round(m)} m`;
  };

  return (
    <article className="mx-auto max-w-3xl px-6 pt-12 pb-28 sm:py-16">
      <Reveal>
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/touren"
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

      {/* 1. Hero: Cover, Genre, Titel, Metazeile, CTA */}
      <header className="mt-6">
        {tour.cover_image_url && (
          <Reveal delay={0.05}>
            <div className="relative aspect-[5/2] overflow-hidden rounded-2xl border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={tour.cover_image_url}
                alt={`Cover von ${tour.title}`}
                className="absolute inset-0 size-full object-cover"
              />
            </div>
          </Reveal>
        )}
        <Reveal delay={0.1}>
          {genre && (
            <div className="mt-6 flex items-center gap-3">
              <span
                aria-hidden="true"
                className={`h-1 w-12 rounded-full ${genre.lineClass}`}
              />
              <span className="text-sm font-medium text-muted-foreground">
                {genre.label}
              </span>
            </div>
          )}
          <h1 className="mt-3 font-serif text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            {tour.title}
          </h1>
        </Reveal>
        <Reveal delay={0.14}>
          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
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
            {tour.distance_km != null && (
              <span className="flex items-center gap-1.5">
                <Footprints aria-hidden="true" className="size-4 text-primary" />
                <span className="tabular-nums">{tour.distance_km} km</span>
              </span>
            )}
            {tour.elevation_gain_m != null && (
              <span className="flex items-center gap-1.5">
                <TrendingUp aria-hidden="true" className="size-4 text-primary" />
                <span className="tabular-nums">{tour.elevation_gain_m} m</span>
              </span>
            )}
            {tour.elevation_loss_m != null && (
              <span className="flex items-center gap-1.5">
                <TrendingDown
                  aria-hidden="true"
                  className="size-4 text-primary"
                />
                <span className="tabular-nums">{tour.elevation_loss_m} m</span>
              </span>
            )}
            {tour.difficulty && (
              <span className="flex items-center gap-1.5">
                <Mountain aria-hidden="true" className="size-4 text-primary" />
                {tour.difficulty}
              </span>
            )}
            {stations.length > 0 && (
              <span className="flex items-center gap-1.5">
                <Flag aria-hidden="true" className="size-4 text-primary" />
                <span className="tabular-nums">
                  {stations.length}{" "}
                  <T
                    k={
                      stations.length === 1
                        ? "tour.stations.one"
                        : "tour.stations.other"
                    }
                  />
                </span>
              </span>
            )}
            {avgRating != null && (
              <span className="flex items-center gap-1.5">
                <Star
                  aria-hidden="true"
                  className="size-4 fill-current text-primary"
                />
                <span className="sr-only">
                  <T k="tour.ratingAria" />:{" "}
                </span>
                <span className="tabular-nums">
                  {avgRating.toFixed(1)} ({result.feedback.length})
                </span>
              </span>
            )}
          </div>
        </Reveal>
        <Reveal delay={0.18}>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button asChild size="lg">
              <a href="#tour-player">
                <Play aria-hidden="true" />
                <T k="tour.startTour" />
              </a>
            </Button>
            {offlineUrls.length > 0 && (
              <OfflineDownloadButton tourId={tour.id} urls={offlineUrls} />
            )}
          </div>
        </Reveal>
      </header>

      {/* 2. Vorschaukarte mit Route und Stationen */}
      {stationPins.length > 0 && (
        <Reveal className="mt-12">
          <h2 className="font-serif text-2xl font-semibold tracking-tight">
            <T k="tour.section.map" />
          </h2>
          <div className="mt-5">
            <TourPreviewMap stations={stationPins} />
          </div>
        </Reveal>
      )}

      {/* 3. Tourbeschreibung */}
      {tour.description && (
        <Reveal className="mt-12">
          <h2 className="font-serif text-2xl font-semibold tracking-tight">
            <T k="tour.section.about" />
          </h2>
          <p className="mt-4 whitespace-pre-line text-lg leading-relaxed text-muted-foreground">
            {tour.description}
          </p>
        </Reveal>
      )}

      {/* 4. Hörprobe */}
      {tour.audio_preview_url && (
        <Reveal className="mt-12">
          <h2 className="font-serif text-2xl font-semibold tracking-tight">
            <T k="tour.section.preview" />
          </h2>
          <div className="mt-4 rounded-2xl border bg-card p-4">
            <audio
              controls
              preload="none"
              src={tour.audio_preview_url}
              className="w-full"
            />
            {tour.audio_preview_duration_seconds != null && (
              <p className="mt-2 text-xs tabular-nums text-muted-foreground">
                {Math.floor(tour.audio_preview_duration_seconds / 60)}:
                {String(tour.audio_preview_duration_seconds % 60).padStart(
                  2,
                  "0",
                )}{" "}
                min
              </p>
            )}
          </div>
        </Reveal>
      )}

      {/* 5. Diese Tour passt zu dir, wenn … */}
      {tour.suitability_tags && tour.suitability_tags.length > 0 && (
        <Reveal className="mt-12">
          <h2 className="font-serif text-2xl font-semibold tracking-tight">
            <T k="tour.section.suitability" />
          </h2>
          <ul className="mt-4 space-y-2">
            {tour.suitability_tags.map((tag, i) => (
              <li key={i} className="flex gap-2.5 text-muted-foreground">
                <Check
                  aria-hidden="true"
                  className="mt-0.5 size-5 shrink-0 text-primary"
                />
                <span>{tag}</span>
              </li>
            ))}
          </ul>
        </Reveal>
      )}

      {/* 6. Tourdaten – nur wenn erweiterte Wegdaten vorhanden sind
          (sonst dupliziert der Block nur die Hero-Metazeile). */}
      {hasTrackData && (
        <Reveal className="mt-12">
          <h2 className="font-serif text-2xl font-semibold tracking-tight">
            <T k="tour.section.details" />
          </h2>
          <dl className="mt-4 divide-y rounded-2xl border">
            {tour.distance_km != null && (
              <div className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
                <dt className="text-muted-foreground">
                  <T k="tour.detail.distance" />
                </dt>
                <dd className="font-medium tabular-nums">
                  {tour.distance_km} km
                </dd>
              </div>
            )}
            {tour.elevation_gain_m != null && (
              <div className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
                <dt className="text-muted-foreground">
                  <T k="tour.detail.elevationGain" />
                </dt>
                <dd className="font-medium tabular-nums">
                  {tour.elevation_gain_m} m
                </dd>
              </div>
            )}
            {tour.elevation_loss_m != null && (
              <div className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
                <dt className="text-muted-foreground">
                  <T k="tour.detail.elevationLoss" />
                </dt>
                <dd className="font-medium tabular-nums">
                  {tour.elevation_loss_m} m
                </dd>
              </div>
            )}
            {tour.duration_minutes && (
              <div className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
                <dt className="text-muted-foreground">
                  <T k="tour.detail.duration" />
                </dt>
                <dd className="font-medium tabular-nums">
                  {tour.duration_minutes} <T k="tour.minutes" />
                </dd>
              </div>
            )}
            {tour.difficulty && (
              <div className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
                <dt className="text-muted-foreground">
                  <T k="tour.detail.difficulty" />
                </dt>
                <dd className="font-medium">{tour.difficulty}</dd>
              </div>
            )}
            {tour.region && (
              <div className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
                <dt className="text-muted-foreground">
                  <T k="tour.detail.region" />
                </dt>
                <dd className="font-medium">{tour.region}</dd>
              </div>
            )}
            {stations.length > 0 && (
              <div className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
                <dt className="text-muted-foreground">
                  <T k="tour.detail.stations" />
                </dt>
                <dd className="font-medium tabular-nums">{stations.length}</dd>
              </div>
            )}
          </dl>
        </Reveal>
      )}

      {/* 7. Empfohlene Ausrüstung */}
      {tour.equipment && tour.equipment.length > 0 && (
        <Reveal className="mt-12">
          <h2 className="flex items-center gap-2 font-serif text-2xl font-semibold tracking-tight">
            <Backpack aria-hidden="true" className="size-6 text-primary" />
            <T k="tour.section.equipment" />
          </h2>
          <ul className="mt-4 space-y-2">
            {tour.equipment.map((item, i) => (
              <li key={i} className="flex gap-2.5 text-muted-foreground">
                <span
                  aria-hidden="true"
                  className="mt-2 size-1.5 shrink-0 rounded-full bg-primary"
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Reveal>
      )}

      {/* 8. Anreise und Parkplatz */}
      {tour.arrival_info && (
        <Reveal className="mt-12">
          <h2 className="flex items-center gap-2 font-serif text-2xl font-semibold tracking-tight">
            <Car aria-hidden="true" className="size-6 text-primary" />
            <T k="tour.section.arrival" />
          </h2>
          <p className="mt-4 whitespace-pre-line leading-relaxed text-muted-foreground">
            {tour.arrival_info}
          </p>
        </Reveal>
      )}

      {/* 9. Zugänglichkeit */}
      {tour.accessibility_info && (
        <Reveal className="mt-12">
          <h2 className="font-serif text-2xl font-semibold tracking-tight">
            <T k="tour.section.accessibility" />
          </h2>
          <p className="mt-4 whitespace-pre-line leading-relaxed text-muted-foreground">
            {tour.accessibility_info}
          </p>
        </Reveal>
      )}

      {/* 10. Stationen als Timeline (keine Spoiler: nur Teaser, kein Transkript) */}
      {stations.length > 0 && (
        <Reveal className="mt-12">
          <h2 className="font-serif text-2xl font-semibold tracking-tight">
            <T k="tour.section.stations" />
          </h2>
          <ol className="mt-6 space-y-4">
            {stations.map((station, index) => {
              const dist = stationDistanceLabel(station);
              return (
                <li key={station.id} className="flex gap-4">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold tabular-nums text-primary">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1 border-b pb-4">
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="font-semibold">{station.title}</h3>
                      {dist && (
                        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                          {dist} <T k="tour.fromStart" />
                        </span>
                      )}
                    </div>
                    {station.description && (
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {station.description}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </Reveal>
      )}

      {/* Player – Scroll-Ziel der Hero-CTA und der Sticky-CTA */}
      <div id="tour-player" className="mt-12 scroll-mt-24">
        {isPaid ? (
          <PurchaseGate
            tourId={tour.id}
            price={tour.price!}
            unlocked={unlocked}
            restoreFailed={restoreFailed}
            checkoutAction={checkoutAction}
            restoreAction={restoreAction}
          >
            <TourPlayer
              tourId={tour.id}
              tourTitle={tour.title}
              coverImageUrl={tour.cover_image_url}
              stations={stations}
              media={result.media}
              quiz={result.quiz}
              genre={tour.genre}
            />
          </PurchaseGate>
        ) : (
          <TourPlayer
            tourId={tour.id}
            tourTitle={tour.title}
            coverImageUrl={tour.cover_image_url}
            stations={stations}
            media={result.media}
            quiz={result.quiz}
            genre={tour.genre}
          />
        )}
      </div>

      {/* 11. FAQ */}
      {tour.faq && tour.faq.length > 0 && (
        <Reveal className="mt-12">
          <h2 className="font-serif text-2xl font-semibold tracking-tight">
            <T k="tour.section.faq" />
          </h2>
          <div className="mt-6 space-y-3">
            {tour.faq.map((item, i) => (
              <details key={i} className="group rounded-lg border bg-card">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold">
                  <span>{item.question}</span>
                  <ChevronDown
                    aria-hidden="true"
                    className="size-4 shrink-0 text-primary transition-transform group-open:rotate-180"
                  />
                </summary>
                <p className="whitespace-pre-line px-4 pb-4 text-sm leading-relaxed text-muted-foreground">
                  {item.answer}
                </p>
              </details>
            ))}
          </div>
        </Reveal>
      )}

      {/* 12. Bewertungen */}
      <TourFeedbackSection
        action={submitFeedback.bind(null, result.tour.id, slug)}
        feedback={result.feedback}
        justSubmitted={justSubmitted === "1"}
        error={feedbackError}
        lang={activeLocale !== BASE_LOCALE ? activeLocale : undefined}
      />

      {/* 13. Ähnliche Touren */}
      {similarTours.length > 0 && (
        <Reveal className="mt-16">
          <h2 className="font-serif text-2xl font-semibold tracking-tight">
            <T k="tour.section.similar" />
          </h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {similarTours.map((similar) => (
              <TourCard key={similar.id} tour={similar} />
            ))}
          </div>
        </Reveal>
      )}

      {/* Mobile Sticky-CTA */}
      <TourStickyCta targetId="tour-player" />
    </article>
  );
}
