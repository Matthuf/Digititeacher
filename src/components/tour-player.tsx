"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  FileText,
  HelpCircle,
  MapPin,
  Navigation,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  Trophy,
  X,
} from "lucide-react";
import { TourMap } from "@/components/tour-map";
import { MediaCarousel } from "@/components/media-carousel";
import { Button } from "@/components/ui/button";
import { distanceMeters } from "@/lib/geo";
import type { Station, StationMedia, StationQuiz } from "@/lib/tours";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/language-context";

const QUIZ_GENRES = new Set(["kinder", "schule"]);

function StationQuizBlock({
  quiz,
  answer,
  onAnswer,
}: {
  quiz: StationQuiz;
  answer?: "correct" | "wrong";
  onAnswer: (result: "correct" | "wrong") => void;
}) {
  const { t } = useLanguage();
  const [selected, setSelected] = useState<number | null>(null);
  const revealed = answer !== undefined;

  function choose(i: number) {
    if (revealed) return;
    setSelected(i);
    onAnswer(i === quiz.correct_index ? "correct" : "wrong");
  }

  return (
    <div className="mt-4 rounded-xl border border-dashed border-primary/40 bg-primary/[0.03] p-4">
      <p className="flex items-start gap-1.5 text-sm font-medium">
        <HelpCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
        {quiz.question}
      </p>
      <div className="mt-3 flex flex-col gap-2">
        {quiz.options.map((opt, i) => {
          const isCorrect = i === quiz.correct_index;
          const isSelected = selected === i;
          return (
            <button
              key={i}
              type="button"
              disabled={revealed}
              onClick={() => choose(i)}
              className={cn(
                "rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                !revealed && "hover:border-primary/60",
                revealed && isCorrect && "border-mist bg-mist/10 text-foreground",
                revealed &&
                  isSelected &&
                  !isCorrect &&
                  "border-destructive bg-destructive/10",
              )}
            >
              {opt}
            </button>
          );
        })}
      </div>
      {answer && (
        <p
          className={cn(
            "mt-2 text-sm font-medium",
            answer === "correct" ? "text-mist" : "text-destructive",
          )}
        >
          {answer === "correct" ? t("quiz.correct") : t("quiz.wrong")}
        </p>
      )}
    </div>
  );
}

const DEFAULT_TRIGGER_RADIUS_METERS = 40;

function formatDistance(meters: number) {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1).replace(".", ",")} km`;
  }
  return `${Math.round(meters)} m`;
}

export function TourPlayer({
  tourId,
  stations,
  media = {},
  quiz = {},
  genre,
}: {
  tourId: string;
  stations: Station[];
  media?: Record<string, StationMedia[]>;
  quiz?: Record<string, StationQuiz>;
  genre?: string | null;
}) {
  const { t } = useLanguage();
  const [position, setPosition] = useState<GeolocationCoordinates | null>(
    null,
  );
  const [geoError, setGeoError] = useState<string | null>(null);
  const [autoPlay, setAutoPlay] = useState(false);
  const [activeStationId, setActiveStationId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState<{
    currentTime: number;
    duration: number;
  } | null>(null);
  const [heard, setHeard] = useState<Set<string>>(new Set());
  const [quizAnswers, setQuizAnswers] = useState<
    Record<string, "correct" | "wrong">
  >({});
  const audioRefs = useRef(new Map<string, HTMLAudioElement>());
  const stationRefs = useRef(new Map<string, HTMLLIElement>());
  const triggeredRef = useRef(new Set<string>());
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  const storageKey = `dt-heard-${tourId}`;
  const quizStorageKey = `dt-quiz-${tourId}`;
  const showQuiz = genre ? QUIZ_GENRES.has(genre) : false;

  // Gehörte Stationen + Quiz-Antworten aus localStorage laden – nach der
  // Hydration, damit Server- und Client-HTML übereinstimmen.
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const raw = localStorage.getItem(storageKey);
        if (raw) setHeard(new Set(JSON.parse(raw) as string[]));
      } catch {
        // localStorage nicht verfügbar (z. B. Privatmodus) – Fortschritt aus.
      }
      try {
        const raw = localStorage.getItem(quizStorageKey);
        if (raw) setQuizAnswers(JSON.parse(raw));
      } catch {
        // ignorieren
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [storageKey, quizStorageKey]);

  const answerQuiz = useCallback(
    (stationId: string, result: "correct" | "wrong") => {
      setQuizAnswers((current) => {
        if (current[stationId]) return current;
        const next = { ...current, [stationId]: result };
        try {
          localStorage.setItem(quizStorageKey, JSON.stringify(next));
        } catch {
          // ignorieren
        }
        return next;
      });
    },
    [quizStorageKey],
  );

  const markHeard = useCallback(
    (id: string) => {
      setHeard((current) => {
        if (current.has(id)) return current;
        const next = new Set(current);
        next.add(id);
        try {
          localStorage.setItem(storageKey, JSON.stringify([...next]));
        } catch {
          // ignorieren
        }
        return next;
      });
    },
    [storageKey],
  );

  const playStation = useCallback((id: string) => {
    for (const [otherId, audio] of audioRefs.current) {
      if (otherId !== id) audio.pause();
    }
    const audio = audioRefs.current.get(id);
    if (audio) {
      setProgress(null);
      audio.play();
      setActiveStationId(id);
    }
  }, []);

  function enableAutoPlay() {
    if (!("geolocation" in navigator)) {
      setGeoError("Geolocation wird von diesem Browser nicht unterstützt.");
      return;
    }
    setGeoError(null);
    setAutoPlay(true);
  }

  useEffect(() => {
    if (!autoPlay) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setGeoError(null);
        setPosition(pos.coords);
      },
      (err) => setGeoError(err.message),
      { enableHighAccuracy: true },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [autoPlay]);

  useEffect(() => {
    if (!autoPlay || !position) return;

    for (const station of stations) {
      if (triggeredRef.current.has(station.id)) continue;

      const distance = distanceMeters(
        { latitude: position.latitude, longitude: position.longitude },
        station,
      );
      const radius = station.trigger_radius_m ?? DEFAULT_TRIGGER_RADIUS_METERS;

      if (distance <= radius) {
        triggeredRef.current.add(station.id);
        playStation(station.id);
        break;
      }
    }
  }, [position, autoPlay, stations, playStation]);

  // Bildschirm während aktiver Tour wach halten (progressive enhancement).
  useEffect(() => {
    const active = autoPlay || isPlaying;

    async function acquire() {
      try {
        if (active && !wakeLockRef.current && "wakeLock" in navigator) {
          wakeLockRef.current = await navigator.wakeLock.request("screen");
          wakeLockRef.current.addEventListener("release", () => {
            wakeLockRef.current = null;
          });
        }
      } catch {
        // Wake Lock nicht verfügbar/erlaubt – kein Problem.
      }
    }

    function handleVisibility() {
      if (document.visibilityState === "visible") acquire();
    }

    if (active) {
      acquire();
      document.addEventListener("visibilitychange", handleVisibility);
      return () => {
        document.removeEventListener("visibilitychange", handleVisibility);
        wakeLockRef.current?.release().catch(() => {});
        wakeLockRef.current = null;
      };
    }

    wakeLockRef.current?.release().catch(() => {});
    wakeLockRef.current = null;
  }, [autoPlay, isPlaying]);

  function toggleStation(id: string) {
    const audio = audioRefs.current.get(id);
    if (!audio) return;
    if (activeStationId === id && !audio.paused) {
      audio.pause();
    } else {
      playStation(id);
    }
  }

  function skip(id: string, seconds: number) {
    const audio = audioRefs.current.get(id);
    if (!audio) return;
    audio.currentTime = Math.max(
      0,
      Math.min(audio.currentTime + seconds, audio.duration || Infinity),
    );
  }

  function scrollToStation(id: string) {
    stationRefs.current.get(id)?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }

  function markArrived(id: string) {
    triggeredRef.current.add(id);
    playStation(id);
    scrollToStation(id);
  }

  const heardCount = stations.filter((s) => heard.has(s.id)).length;
  const quizStationIds = stations.filter((s) => quiz[s.id]).map((s) => s.id);
  const quizPoints = quizStationIds.filter(
    (id) => quizAnswers[id] === "correct",
  ).length;

  const activeStation = activeStationId
    ? stations.find((s) => s.id === activeStationId) ?? null
    : null;
  const chapterNumber = activeStationId
    ? stations.findIndex((s) => s.id === activeStationId) + 1
    : Math.min(heardCount + 1, stations.length);

  const activeIndex = activeStationId
    ? stations.findIndex((s) => s.id === activeStationId)
    : -1;
  const nextStation =
    stations.slice(activeIndex + 1).find((s) => !heard.has(s.id)) ?? null;
  const nextDistance =
    position && nextStation
      ? distanceMeters(
          { latitude: position.latitude, longitude: position.longitude },
          nextStation,
        )
      : null;
  const nextStationImage = nextStation
    ? (media[nextStation.id] ?? []).find((m) => m.media_type === "image")
    : undefined;

  return (
    <div className={cn("flex flex-col gap-8", activeStationId && "pb-24")}>
      {/* GPS-Autoplay */}
      <div>
        <div className="flex flex-col gap-4 rounded-2xl bg-secondary p-5 text-secondary-foreground sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Navigation aria-hidden="true" className="size-5" />
            </span>
            <div>
              <p className="flex items-center gap-2 font-medium">
                {t("player.autoplay.title")}
                {autoPlay && (
                  <span
                    aria-hidden="true"
                    className="size-2 animate-pulse rounded-full bg-primary"
                  />
                )}
              </p>
              <p className="mt-0.5 text-sm opacity-80">
                {t("player.autoplay.text")}
              </p>
            </div>
          </div>
          <Button
            type="button"
            onClick={() => (autoPlay ? setAutoPlay(false) : enableAutoPlay())}
            className={cn(
              "shrink-0 rounded-full",
              autoPlay &&
                "border border-primary/50 bg-primary/15 text-secondary-foreground hover:bg-primary/25",
            )}
          >
            {autoPlay ? t("player.autoplay.on") : t("player.autoplay.off")}
          </Button>
        </div>
        {geoError && (
          <p className="mt-2 text-sm text-destructive" role="alert">
            {geoError}
          </p>
        )}
      </div>

      {/* Nächste Station: Vorschau + manueller Fallback */}
      {autoPlay && nextStation && (
        <div className="flex items-center gap-4 rounded-2xl border border-dashed border-primary/40 bg-primary/[0.03] p-4">
          {nextStationImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={nextStationImage.url}
              alt=""
              className="size-14 shrink-0 rounded-xl object-cover"
            />
          ) : (
            <span className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary">
              <MapPin aria-hidden="true" className="size-5" />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-wide text-primary">
              {t("player.nextStation")}
            </p>
            <p className="truncate text-sm font-semibold">{nextStation.title}</p>
            <p className="text-xs text-muted-foreground">
              {nextDistance !== null
                ? formatDistance(nextDistance)
                : t("player.locating")}
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => markArrived(nextStation.id)}
            className="shrink-0"
          >
            {t("player.imHere")}
          </Button>
        </div>
      )}

      {/* Karte */}
      <div className="relative z-0 overflow-hidden rounded-2xl border">
        <TourMap
          stations={stations.map((s) => ({
            id: s.id,
            title: s.title,
            latitude: s.latitude,
            longitude: s.longitude,
          }))}
          activeStationId={activeStationId}
          userPosition={
            position
              ? { latitude: position.latitude, longitude: position.longitude }
              : null
          }
          className="h-72 w-full sm:h-96"
        />
      </div>

      {/* Fortschritt */}
      <div>
        <div className="flex items-center justify-between text-sm">
          <p className="text-muted-foreground">
            <span className="font-medium text-foreground">
              {t("player.chapter")} {chapterNumber}
            </span>{" "}
            {t("player.of")} {stations.length}
          </p>
          {showQuiz && quizStationIds.length > 0 && (
            <p className="flex items-center gap-1.5 font-medium text-primary">
              <Trophy aria-hidden="true" className="size-4" />
              {quizPoints} / {quizStationIds.length} {t("quiz.points")}
            </p>
          )}
        </div>
        {heardCount > 0 && (
          <>
            <div
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={stations.length}
              aria-valuenow={heardCount}
              className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"
            >
              <div
                className="h-full rounded-full bg-mist transition-all duration-500"
                style={{ width: `${(heardCount / stations.length) * 100}%` }}
              />
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              {heardCount} {t("player.of")} {stations.length} {t("player.progress")}
            </p>
          </>
        )}
      </div>

      {/* Stationen */}
      <ol className="flex flex-col gap-4">
        {stations.map((station, index) => {
          const distance = position
            ? distanceMeters(
                {
                  latitude: position.latitude,
                  longitude: position.longitude,
                },
                station,
              )
            : null;
          const isActive = activeStationId === station.id;
          const isHeard = heard.has(station.id);

          return (
            <li
              key={station.id}
              ref={(el) => {
                if (el) stationRefs.current.set(station.id, el);
                else stationRefs.current.delete(station.id);
              }}
            >
              <div
                className={cn(
                  "rounded-2xl border bg-card p-5 transition-all duration-300",
                  isActive &&
                    "border-primary/60 bg-primary/[0.04] ring-1 ring-primary/40",
                )}
              >
                <div className="flex items-start gap-4">
                  <span
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-full font-serif text-sm font-semibold transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : isHeard
                          ? "bg-mist/15 text-mist"
                          : "bg-primary/12 text-primary",
                    )}
                  >
                    {isHeard && !isActive ? (
                      <Check aria-hidden="true" className="size-4" />
                    ) : (
                      index + 1
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <h2 className="flex items-center gap-2.5 font-serif text-lg font-semibold tracking-tight">
                        {station.title}
                        {isActive && isPlaying && (
                          <span aria-hidden="true" className="dt-eq">
                            <span />
                            <span />
                            <span />
                          </span>
                        )}
                      </h2>
                      {distance !== null && (
                        <span className="flex shrink-0 items-center gap-1 text-xs tabular-nums text-muted-foreground">
                          <MapPin
                            aria-hidden="true"
                            className="size-3.5 text-primary"
                          />
                          {formatDistance(distance)}
                        </span>
                      )}
                    </div>
                    {station.description && (
                      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                        {station.description}
                      </p>
                    )}

                    {station.audio_url ? (
                      <div className="mt-4 flex items-center gap-2">
                        <Button
                          type="button"
                          size="icon"
                          onClick={() => toggleStation(station.id)}
                          aria-label={
                            isActive && isPlaying
                              ? `${station.title} pausieren`
                              : `${station.title} abspielen`
                          }
                          className="size-11 shrink-0 rounded-full"
                        >
                          {isActive && isPlaying ? (
                            <Pause aria-hidden="true" />
                          ) : (
                            <Play aria-hidden="true" className="ml-0.5" />
                          )}
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => skip(station.id, -15)}
                          aria-label="15 Sekunden zurück"
                          className="size-9 shrink-0 rounded-full text-muted-foreground"
                        >
                          <RotateCcw aria-hidden="true" className="size-4" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => skip(station.id, 15)}
                          aria-label="15 Sekunden vor"
                          className="size-9 shrink-0 rounded-full text-muted-foreground"
                        >
                          <RotateCw aria-hidden="true" className="size-4" />
                        </Button>
                        <audio
                          ref={(el) => {
                            if (el) audioRefs.current.set(station.id, el);
                            else audioRefs.current.delete(station.id);
                          }}
                          className="h-10 w-full min-w-0"
                          controls
                          preload="none"
                          src={station.audio_url}
                          onPlay={() => {
                            setActiveStationId(station.id);
                            setIsPlaying(true);
                          }}
                          onPause={() =>
                            setIsPlaying((current) =>
                              activeStationId === station.id ? false : current,
                            )
                          }
                          onTimeUpdate={(e) =>
                            setProgress({
                              currentTime: e.currentTarget.currentTime,
                              duration: e.currentTarget.duration || 0,
                            })
                          }
                          onEnded={() => {
                            markHeard(station.id);
                            setIsPlaying(false);
                            setProgress(null);
                          }}
                        />
                      </div>
                    ) : (
                      <p className="mt-3 text-sm italic text-muted-foreground/70">
                        {t("player.noAudio")}
                      </p>
                    )}

                    {station.transcript && (
                      <details className="group mt-3">
                        <summary className="flex cursor-pointer list-none items-center gap-1.5 text-sm font-medium text-mist hover:underline">
                          <FileText aria-hidden="true" className="size-4" />
                          <span className="group-open:hidden">
                            {t("player.transcriptShow")}
                          </span>
                          <span className="hidden group-open:inline">
                            {t("player.transcriptHide")}
                          </span>
                        </summary>
                        <p className="mt-3 whitespace-pre-line rounded-lg bg-muted/60 p-4 text-sm leading-relaxed text-foreground/90">
                          {station.transcript}
                        </p>
                      </details>
                    )}

                    <MediaCarousel media={media[station.id] ?? []} />

                    {showQuiz && quiz[station.id] && (
                      <StationQuizBlock
                        quiz={quiz[station.id]}
                        answer={quizAnswers[station.id]}
                        onAnswer={(result) => answerQuiz(station.id, result)}
                      />
                    )}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      {/* Persistenter Mini-Player */}
      {activeStation && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-secondary text-secondary-foreground shadow-lg">
          {progress && progress.duration > 0 && (
            <div className="h-1 w-full bg-white/15">
              <div
                className="h-full bg-primary transition-all duration-200"
                style={{
                  width: `${(progress.currentTime / progress.duration) * 100}%`,
                }}
              />
            </div>
          )}
          <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
            <button
              type="button"
              onClick={() => scrollToStation(activeStation.id)}
              className="flex min-w-0 flex-1 items-center gap-3 text-left"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
                {isPlaying ? (
                  <span aria-hidden="true" className="dt-eq">
                    <span />
                    <span />
                    <span />
                  </span>
                ) : (
                  <MapPin aria-hidden="true" className="size-4" />
                )}
              </span>
              <span className="min-w-0">
                <span className="block text-xs opacity-70">
                  {t("player.chapter")} {chapterNumber} {t("player.of")}{" "}
                  {stations.length}
                </span>
                <span className="block truncate text-sm font-semibold">
                  {activeStation.title}
                </span>
              </span>
            </button>
            <div className="flex shrink-0 items-center gap-1.5">
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => skip(activeStation.id, -15)}
                aria-label="15 Sekunden zurück"
                className="size-9 shrink-0 rounded-full text-secondary-foreground hover:bg-white/10"
              >
                <RotateCcw aria-hidden="true" className="size-4" />
              </Button>
              <Button
                type="button"
                size="icon"
                onClick={() => toggleStation(activeStation.id)}
                aria-label={isPlaying ? "Pausieren" : "Abspielen"}
                className="size-11 shrink-0 rounded-full"
              >
                {isPlaying ? (
                  <Pause aria-hidden="true" />
                ) : (
                  <Play aria-hidden="true" className="ml-0.5" />
                )}
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => skip(activeStation.id, 15)}
                aria-label="15 Sekunden vor"
                className="size-9 shrink-0 rounded-full text-secondary-foreground hover:bg-white/10"
              >
                <RotateCw aria-hidden="true" className="size-4" />
              </Button>
              {nextStation && (
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => scrollToStation(nextStation.id)}
                  aria-label={t("player.nextStation")}
                  className="hidden size-9 shrink-0 rounded-full text-secondary-foreground hover:bg-white/10 sm:flex"
                >
                  <ArrowRight aria-hidden="true" className="size-4" />
                </Button>
              )}
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => {
                  audioRefs.current.get(activeStation.id)?.pause();
                  setActiveStationId(null);
                  setIsPlaying(false);
                  setProgress(null);
                }}
                aria-label="Player schliessen"
                className="size-9 shrink-0 rounded-full text-secondary-foreground hover:bg-white/10"
              >
                <X aria-hidden="true" className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
