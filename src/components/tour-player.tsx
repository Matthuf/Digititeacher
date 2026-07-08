"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
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
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [heard, setHeard] = useState<Set<string>>(new Set());
  const [quizAnswers, setQuizAnswers] = useState<
    Record<string, "correct" | "wrong">
  >({});
  const audioRefs = useRef(new Map<string, HTMLAudioElement>());
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
      audio.play();
      setPlayingId(id);
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
    const active = autoPlay || playingId !== null;

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
  }, [autoPlay, playingId]);

  function toggleStation(id: string) {
    const audio = audioRefs.current.get(id);
    if (!audio) return;
    if (playingId === id && !audio.paused) {
      audio.pause();
      setPlayingId(null);
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

  const heardCount = stations.filter((s) => heard.has(s.id)).length;
  const quizStationIds = stations
    .filter((s) => quiz[s.id])
    .map((s) => s.id);
  const quizPoints = quizStationIds.filter(
    (id) => quizAnswers[id] === "correct",
  ).length;

  return (
    <div className="flex flex-col gap-8">
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

      {/* Karte */}
      <div className="relative z-0 overflow-hidden rounded-2xl border">
        <TourMap
          stations={stations.map((s) => ({
            id: s.id,
            title: s.title,
            latitude: s.latitude,
            longitude: s.longitude,
          }))}
          activeStationId={playingId}
          userPosition={
            position
              ? { latitude: position.latitude, longitude: position.longitude }
              : null
          }
          className="h-72 w-full sm:h-96"
        />
      </div>

      {/* Fortschritt */}
      {heardCount > 0 && (
        <div>
          <div className="flex items-center justify-between text-sm">
            <p className="text-muted-foreground">
              <span className="font-medium text-foreground">
                {heardCount} {t("player.of")} {stations.length}
              </span>{" "}
              {t("player.progress")}
            </p>
            {showQuiz && quizStationIds.length > 0 && (
              <p className="flex items-center gap-1.5 font-medium text-primary">
                <Trophy aria-hidden="true" className="size-4" />
                {quizPoints} / {quizStationIds.length} {t("quiz.points")}
              </p>
            )}
          </div>
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
        </div>
      )}

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
          const isPlaying = playingId === station.id;
          const isHeard = heard.has(station.id);

          return (
            <li key={station.id}>
              <div
                className={cn(
                  "rounded-2xl border bg-card p-5 transition-all duration-300",
                  isPlaying &&
                    "border-primary/60 bg-primary/[0.04] ring-1 ring-primary/40",
                )}
              >
                <div className="flex items-start gap-4">
                  <span
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-full font-serif text-sm font-semibold transition-colors",
                      isPlaying
                        ? "bg-primary text-primary-foreground"
                        : isHeard
                          ? "bg-mist/15 text-mist"
                          : "bg-primary/12 text-primary",
                    )}
                  >
                    {isHeard && !isPlaying ? (
                      <Check aria-hidden="true" className="size-4" />
                    ) : (
                      index + 1
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <h2 className="flex items-center gap-2.5 font-serif text-lg font-semibold tracking-tight">
                        {station.title}
                        {isPlaying && (
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
                            isPlaying
                              ? `${station.title} pausieren`
                              : `${station.title} abspielen`
                          }
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
                          onPlay={() => setPlayingId(station.id)}
                          onPause={() =>
                            setPlayingId((current) =>
                              current === station.id ? null : current,
                            )
                          }
                          onEnded={() => {
                            markHeard(station.id);
                            setPlayingId((current) =>
                              current === station.id ? null : current,
                            );
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
    </div>
  );
}
