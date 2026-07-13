"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  FileText,
  Flag,
  Footprints,
  HelpCircle,
  MapPin,
  Navigation,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  Trophy,
  WifiOff,
  X,
} from "lucide-react";
import { TourMap } from "@/components/tour-map";
import { MediaCarousel } from "@/components/media-carousel";
import { Button } from "@/components/ui/button";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { distanceMeters } from "@/lib/geo";
import { useGeolocationStatus } from "@/hooks/use-geolocation-status";
import type { Station, StationMedia, StationQuiz } from "@/lib/tours";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/language-context";

const QUIZ_GENRES = new Set(["kinder", "schule"]);
const DEFAULT_TRIGGER_RADIUS_METERS = 40;

function formatDistance(meters: number) {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1).replace(".", ",")} km`;
  }
  return `${Math.round(meters)} m`;
}

/** Kurzer Ankunfts-Ton (zwei Töne), synthetisiert per Web Audio API – kein Audio-Asset nötig. */
function playArrivalChime() {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;
    [660, 880].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, now + i * 0.16);
      gain.gain.linearRampToValueAtTime(0.16, now + i * 0.16 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.16 + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.16);
      osc.stop(now + i * 0.16 + 0.4);
    });
    setTimeout(() => ctx.close(), 900);
  } catch {
    // Web Audio nicht verfügbar – kein Blocker.
  }
}

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
    <div className="mt-4 rounded-xl border border-primary/25 bg-primary/[0.04] p-4">
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
                "min-h-11 rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                !revealed && "hover:border-primary/60",
                revealed && isCorrect && "border-secondary bg-secondary/10",
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
            answer === "correct" ? "text-secondary" : "text-destructive",
          )}
        >
          {answer === "correct" ? t("quiz.correct") : t("quiz.wrong")}
        </p>
      )}
    </div>
  );
}

export function TourPlayer({
  tourId,
  tourTitle,
  coverImageUrl,
  stations,
  media = {},
  quiz = {},
  genre,
}: {
  tourId: string;
  tourTitle?: string;
  coverImageUrl?: string | null;
  stations: Station[];
  media?: Record<string, StationMedia[]>;
  quiz?: Record<string, StationQuiz>;
  genre?: string | null;
}) {
  const { t } = useLanguage();
  const [hasStarted, setHasStarted] = useState(false);
  const [showLocationSheet, setShowLocationSheet] = useState(false);
  const [outsideRouteDismissed, setOutsideRouteDismissed] = useState(false);
  const { status: gpsStatus, position, retry: retryLocation } =
    useGeolocationStatus({ enabled: hasStarted, stations });
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
  const [showOverview, setShowOverview] = useState(false);
  const [routeCoords, setRouteCoords] = useState<[number, number][] | null>(
    null,
  );

  const audioRefs = useRef(new Map<string, HTMLAudioElement>());
  const triggeredRef = useRef(new Set<string>());
  // Hysterese: zählt, wie oft eine Station in Folge im Radius lag. Erst ab
  // zwei aufeinanderfolgenden Fixes wird ausgelöst – dämpft GPS-Jitter an der
  // Radiusgrenze. Stationen, die wieder aus dem Radius fallen, werden gelöscht.
  const proximityRef = useRef(new Map<string, number>());
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const routeAnchorRef = useRef<{
    stationId: string;
    latitude: number;
    longitude: number;
  } | null>(null);

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

  const openStation = useCallback(
    (id: string, { chime = false }: { chime?: boolean } = {}) => {
      for (const [otherId, audio] of audioRefs.current) {
        if (otherId !== id) audio.pause();
      }
      setShowOverview(false);
      setProgress(null);
      setActiveStationId(id);
      if (chime) playArrivalChime();
      const audio = audioRefs.current.get(id);
      if (audio) audio.play();
    },
    [],
  );

  const closeStation = useCallback(() => {
    if (activeStationId) audioRefs.current.get(activeStationId)?.pause();
    setActiveStationId(null);
    setIsPlaying(false);
    setProgress(null);
  }, [activeStationId]);

  const togglePlayback = useCallback(() => {
    if (!activeStationId) return;
    const audio = audioRefs.current.get(activeStationId);
    if (!audio) return;
    if (audio.paused) audio.play();
    else audio.pause();
  }, [activeStationId]);

  const skip = useCallback(
    (seconds: number) => {
      if (!activeStationId) return;
      const audio = audioRefs.current.get(activeStationId);
      if (!audio) return;
      audio.currentTime = Math.max(
        0,
        Math.min(audio.currentTime + seconds, audio.duration || Infinity),
      );
    },
    [activeStationId],
  );

  // Standortdialog: „Tour starten“ öffnet das Sheet (idle), erst „Standort
  // aktivieren“ startet die eigentliche GPS-Suche.
  const openLocationSheet = useCallback(() => setShowLocationSheet(true), []);
  const activateLocation = useCallback(() => setHasStarted(true), []);
  // „Tour zuerst ansehen“ / Escape / Backdrop: GPS-Suche stoppen, Sheet zu.
  const dismissLocationSheet = useCallback(() => {
    setShowLocationSheet(false);
    setHasStarted(false);
  }, []);
  const retrySheetLocation = useCallback(() => {
    setHasStarted(true);
    retryLocation();
  }, [retryLocation]);

  // Sobald eine Position vorliegt (granted/inaccurate/outside-route), schliesst
  // sich das Sheet und der Laufmodus wird sichtbar.
  useEffect(() => {
    if (!showLocationSheet || !hasStarted || !position) return;
    const timer = setTimeout(() => setShowLocationSheet(false), 0);
    return () => clearTimeout(timer);
  }, [showLocationSheet, hasStarted, position]);

  useEffect(() => {
    if (!hasStarted || !position || activeStationId) return;

    const counts = proximityRef.current;
    let arrived: string | null = null;

    for (const station of stations) {
      if (triggeredRef.current.has(station.id)) continue;

      const distance = distanceMeters(
        { latitude: position.latitude, longitude: position.longitude },
        station,
      );
      const radius = station.trigger_radius_m ?? DEFAULT_TRIGGER_RADIUS_METERS;

      if (distance <= radius) {
        const streak = (counts.get(station.id) ?? 0) + 1;
        counts.set(station.id, streak);
        // Erste Station, die zwei Fixes in Folge im Radius liegt, gewinnt.
        if (streak >= 2 && arrived === null) arrived = station.id;
      } else {
        // Aus dem Radius gefallen – Zähler zurücksetzen.
        counts.delete(station.id);
      }
    }

    if (!arrived) return;
    triggeredRef.current.add(arrived);
    counts.delete(arrived);

    const timer = setTimeout(() => openStation(arrived!, { chime: true }), 0);
    return () => clearTimeout(timer);
  }, [position, hasStarted, activeStationId, stations, openStation]);

  // Bildschirm während aktiver Tour wach halten (progressive enhancement).
  useEffect(() => {
    const active = hasStarted || isPlaying;

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
  }, [hasStarted, isPlaying]);

  const heardCount = stations.filter((s) => heard.has(s.id)).length;
  const activeStation = activeStationId
    ? (stations.find((s) => s.id === activeStationId) ?? null)
    : null;
  const allHeard = stations.length > 0 && heardCount === stations.length;
  const quizStationIds = stations.filter((s) => quiz[s.id]).map((s) => s.id);
  const quizPoints = quizStationIds.filter(
    (id) => quizAnswers[id] === "correct",
  ).length;

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
  const activeStationImage = activeStation
    ? (media[activeStation.id] ?? []).find((m) => m.media_type === "image")
    : undefined;

  // Audio der nächsten Station vorab laden: wärmt den Browser-Cache, damit
  // beim Stationswechsel nicht bei Null geladen wird. Nicht abspielen, nicht
  // ins DOM hängen – der bare Audio-Node wird danach vom GC eingesammelt.
  useEffect(() => {
    const url = nextStation?.audio_url;
    if (!url) return;
    const audio = new Audio();
    audio.preload = "auto";
    audio.src = url;
    audio.load();
  }, [nextStation?.audio_url]);

  // Echte Fussweg-Route zur nächsten Station holen (OpenRouteService, falls
  // konfiguriert) – nur bei Stationswechsel oder deutlicher Bewegung neu
  // abfragen, nicht bei jedem GPS-Tick.
  useEffect(() => {
    if (!position || !nextStation) {
      const timer = setTimeout(() => {
        setRouteCoords(null);
        routeAnchorRef.current = null;
      }, 0);
      return () => clearTimeout(timer);
    }

    const anchor = routeAnchorRef.current;
    const moved =
      !anchor ||
      anchor.stationId !== nextStation.id ||
      distanceMeters(anchor, {
        latitude: position.latitude,
        longitude: position.longitude,
      }) > 25;

    if (!moved) return;

    routeAnchorRef.current = {
      stationId: nextStation.id,
      latitude: position.latitude,
      longitude: position.longitude,
    };

    let cancelled = false;
    const params = new URLSearchParams({
      fromLat: String(position.latitude),
      fromLng: String(position.longitude),
      toLat: String(nextStation.latitude),
      toLng: String(nextStation.longitude),
    });

    fetch(`/api/route?${params}`)
      .then((res) => res.json())
      .then((data: { route?: [number, number][] | null }) => {
        if (!cancelled) setRouteCoords(data.route ?? null);
      })
      .catch(() => {
        if (!cancelled) setRouteCoords(null);
      });

    return () => {
      cancelled = true;
    };
  }, [position, nextStation]);

  // MediaSession: Sperrbildschirm-/Benachrichtigungs-Steuerung, falls vom Browser unterstützt.
  useEffect(() => {
    if (!activeStation || !("mediaSession" in navigator)) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: activeStation.title,
      artist: tourTitle ?? "SendaLore",
      artwork: coverImageUrl
        ? [{ src: coverImageUrl, sizes: "512x512", type: "image/jpeg" }]
        : [],
    });
    navigator.mediaSession.setActionHandler("play", togglePlayback);
    navigator.mediaSession.setActionHandler("pause", togglePlayback);
    navigator.mediaSession.setActionHandler("seekbackward", () => skip(-15));
    navigator.mediaSession.setActionHandler("seekforward", () => skip(15));

    return () => {
      navigator.mediaSession.setActionHandler("play", null);
      navigator.mediaSession.setActionHandler("pause", null);
      navigator.mediaSession.setActionHandler("seekbackward", null);
      navigator.mediaSession.setActionHandler("seekforward", null);
    };
  }, [activeStation, tourTitle, coverImageUrl, togglePlayback, skip]);

  const chapterOf = (id: string) => stations.findIndex((s) => s.id === id) + 1;

  return (
    <div className="flex flex-col gap-6">
      {/* Utility-Leiste: Fortschritt + Übersicht, immer erreichbar */}
      <div className="flex items-center justify-between text-sm">
        <p className="text-muted-foreground">
          {heardCount > 0 ? (
            <>
              <span className="font-medium text-foreground">{heardCount}</span>{" "}
              {t("player.of")} {stations.length} {t("player.progress")}
            </>
          ) : (
            <span>
              {stations.length} {t("player.stationsTotal")}
            </span>
          )}
        </p>
        <div className="flex items-center gap-3">
          {showQuiz && quizStationIds.length > 0 && (
            <p className="flex items-center gap-1.5 font-medium text-primary">
              <Trophy aria-hidden="true" className="size-4" />
              {quizPoints}/{quizStationIds.length}
            </p>
          )}
          <button
            type="button"
            onClick={() => setShowOverview(true)}
            className="text-sm font-medium text-primary hover:underline"
          >
            {t("player.overview")}
          </button>
        </div>
      </div>

      {heardCount > 0 && (
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={stations.length}
          aria-valuenow={heardCount}
          className="-mt-4 h-1.5 overflow-hidden rounded-full bg-muted"
        >
          <div
            className="h-full rounded-full bg-secondary transition-all duration-500"
            style={{ width: `${(heardCount / stations.length) * 100}%` }}
          />
        </div>
      )}

      {/* Bühne: aktuell aktive Station */}
      {activeStation && (
        <div className="rounded-2xl border bg-card p-5">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={closeStation}
              aria-label={t("player.back")}
              className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <ArrowLeft aria-hidden="true" className="size-4" />
            </button>
            <p className="text-sm font-medium text-muted-foreground">
              {t("player.chapter")} {chapterOf(activeStation.id)} {t("player.of")}{" "}
              {stations.length}
            </p>
            <span className="size-9" aria-hidden="true" />
          </div>

          <h2 className="mt-3 text-center font-serif text-2xl font-semibold tracking-tight">
            {activeStation.title}
          </h2>
          {activeStation.description && (
            <p className="mt-2 text-center text-sm leading-relaxed text-muted-foreground">
              {activeStation.description}
            </p>
          )}

          {activeStationImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={activeStationImage.url}
              alt={activeStationImage.caption ?? activeStation.title}
              className="mx-auto mt-4 aspect-[4/3] w-full max-w-sm rounded-xl object-cover"
            />
          )}

          {activeStation.audio_url ? (
            <>
              <div className="mt-6 flex items-center justify-center gap-4">
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => skip(-15)}
                  aria-label="15 Sekunden zurück"
                  className="size-11 shrink-0 rounded-full text-muted-foreground"
                >
                  <RotateCcw aria-hidden="true" className="size-5" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  onClick={togglePlayback}
                  aria-label={isPlaying ? "Pausieren" : "Abspielen"}
                  className="size-16 shrink-0 rounded-full"
                >
                  {isPlaying ? (
                    <Pause aria-hidden="true" className="size-6" />
                  ) : (
                    <Play aria-hidden="true" className="ml-0.5 size-6" />
                  )}
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => skip(15)}
                  aria-label="15 Sekunden vor"
                  className="size-11 shrink-0 rounded-full text-muted-foreground"
                >
                  <RotateCw aria-hidden="true" className="size-5" />
                </Button>
              </div>
              {progress && progress.duration > 0 && (
                <div className="mx-auto mt-4 h-1.5 w-full max-w-sm overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-200"
                    style={{
                      width: `${(progress.currentTime / progress.duration) * 100}%`,
                    }}
                  />
                </div>
              )}
              <audio
                ref={(el) => {
                  if (el) audioRefs.current.set(activeStation.id, el);
                  else audioRefs.current.delete(activeStation.id);
                }}
                className="hidden"
                preload="auto"
                src={activeStation.audio_url}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onTimeUpdate={(e) =>
                  setProgress({
                    currentTime: e.currentTarget.currentTime,
                    duration: e.currentTarget.duration || 0,
                  })
                }
                onEnded={() => {
                  markHeard(activeStation.id);
                  setIsPlaying(false);
                }}
              />
            </>
          ) : (
            <p className="mt-4 text-center text-sm italic text-muted-foreground/70">
              {t("player.noAudio")}
            </p>
          )}

          {heard.has(activeStation.id) && (
            <div className="mt-6 flex justify-center">
              <Button type="button" variant="outline" onClick={closeStation}>
                {nextStation ? t("player.continueNext") : t("player.backToOverview")}
              </Button>
            </div>
          )}

          {activeStation.transcript && (
            <details className="group mt-6">
              <summary className="flex cursor-pointer list-none items-center justify-center gap-1.5 text-sm font-medium text-primary hover:underline">
                <FileText aria-hidden="true" className="size-4" />
                <span className="group-open:hidden">
                  {t("player.transcriptShow")}
                </span>
                <span className="hidden group-open:inline">
                  {t("player.transcriptHide")}
                </span>
              </summary>
              <p className="mt-3 whitespace-pre-line rounded-lg bg-muted/60 p-4 text-sm leading-relaxed text-foreground/90">
                {activeStation.transcript}
              </p>
            </details>
          )}

          <MediaCarousel media={media[activeStation.id] ?? []} />

          {showQuiz && quiz[activeStation.id] && (
            <StationQuizBlock
              quiz={quiz[activeStation.id]}
              answer={quizAnswers[activeStation.id]}
              onAnswer={(result) => answerQuiz(activeStation.id, result)}
            />
          )}
        </div>
      )}

      {/* Start-Bildschirm */}
      {!activeStation && !hasStarted && (
        <div className="rounded-2xl bg-secondary p-6 text-center text-secondary-foreground">
          <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Footprints aria-hidden="true" className="size-6" />
          </span>
          <p className="mt-4 text-sm opacity-80">{t("player.intro.text")}</p>
          <Button
            type="button"
            size="lg"
            onClick={openLocationSheet}
            className="mt-5 rounded-full px-8"
          >
            {t("player.intro.start")}
          </Button>
        </div>
      )}

      {/* Laufen: nächste Station im Blick */}
      {!activeStation && hasStarted && !allHeard && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4 rounded-2xl border border-primary/25 bg-primary/[0.04] p-4">
            {nextStationImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={nextStationImage.url}
                alt=""
                className="size-16 shrink-0 rounded-xl object-cover"
              />
            ) : (
              <span className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary">
                <MapPin aria-hidden="true" className="size-6" />
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium uppercase tracking-wide text-primary">
                {t("player.nextStation")}
              </p>
              <p className="truncate font-serif text-lg font-semibold">
                {nextStation?.title}
              </p>
              <p className="text-sm text-muted-foreground">
                {nextDistance !== null
                  ? formatDistance(nextDistance)
                  : t("player.locating")}
              </p>
            </div>
            {nextStation && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => openStation(nextStation.id, { chime: true })}
                className="shrink-0"
              >
                {t("player.imHere")}
              </Button>
            )}
          </div>
          {/* Offline hat Vorrang vor outside-route/inaccurate, damit sich die
              Statusmeldungen nie stapeln (einziger Enum-Wert je Moment). */}
          {gpsStatus === "offline" && (
            <div
              role="status"
              className="flex items-start gap-2.5 rounded-xl border bg-muted/50 px-4 py-3 text-sm text-foreground"
            >
              <WifiOff
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0 text-muted-foreground"
              />
              <span>{t("player.gps.offline")}</span>
            </div>
          )}
          {gpsStatus === "outside-route" && !outsideRouteDismissed && (
            <div
              role="status"
              className="flex items-start gap-2.5 rounded-xl border border-primary/25 bg-primary/[0.04] px-4 py-3 text-sm"
            >
              <Navigation
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0 text-primary"
              />
              <div className="min-w-0 flex-1">
                <p className="font-medium">{t("player.gps.outsideRoute")}</p>
                <p className="mt-0.5 text-muted-foreground">
                  {t("player.gps.outsideRouteHint")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOutsideRouteDismissed(true)}
                aria-label={t("player.gps.dismiss")}
                className="-mr-1 flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                <X aria-hidden="true" className="size-4" />
              </button>
            </div>
          )}
          {gpsStatus === "inaccurate" && (
            <p className="text-sm text-muted-foreground" role="status">
              {t("player.gps.inaccurate")}
            </p>
          )}
          <div className="h-72 overflow-hidden rounded-2xl border sm:h-96">
            <TourMap
              stations={stations.map((s) => ({
                id: s.id,
                title: s.title,
                latitude: s.latitude,
                longitude: s.longitude,
              }))}
              activeStationId={null}
              userPosition={
                position
                  ? { latitude: position.latitude, longitude: position.longitude }
                  : null
              }
              routeTarget={
                nextStation
                  ? { latitude: nextStation.latitude, longitude: nextStation.longitude }
                  : null
              }
              routeCoords={routeCoords}
              className="h-72 w-full sm:h-96"
            />
          </div>
        </div>
      )}

      {/* Fertig */}
      {!activeStation && allHeard && (
        <div className="rounded-2xl bg-secondary p-6 text-center text-secondary-foreground">
          <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Flag aria-hidden="true" className="size-6" />
          </span>
          <p className="mt-4 font-serif text-xl font-semibold">
            {t("player.finished.title")}
          </p>
          <p className="mt-1 text-sm opacity-80">{t("player.finished.text")}</p>
          {showQuiz && quizStationIds.length > 0 && (
            <p className="mt-3 flex items-center justify-center gap-1.5 font-medium text-primary">
              <Trophy aria-hidden="true" className="size-4" />
              {quizPoints}/{quizStationIds.length} {t("quiz.points")}
            </p>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowOverview(true)}
            className="mt-5 rounded-full"
          >
            {t("player.overview")}
          </Button>
        </div>
      )}

      {/* Übersicht: alle Stationen kompakt, jederzeit erreichbar */}
      <BottomSheet
        open={showOverview}
        onClose={() => setShowOverview(false)}
        title={t("player.overview")}
      >
          <div className="mt-4 h-64 shrink-0 overflow-hidden rounded-2xl border">
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
              routeTarget={
                nextStation
                  ? { latitude: nextStation.latitude, longitude: nextStation.longitude }
                  : null
              }
              routeCoords={routeCoords}
              className="h-64 w-full"
            />
          </div>

          <ol className="mt-4 flex flex-col gap-2 overflow-y-auto">
            {stations.map((station, index) => {
              const isHeard = heard.has(station.id);
              const isActive = activeStationId === station.id;
              const distance = position
                ? distanceMeters(
                    { latitude: position.latitude, longitude: position.longitude },
                    station,
                  )
                : null;

              return (
                <li key={station.id}>
                  <button
                    type="button"
                    onClick={() => openStation(station.id)}
                    className={cn(
                      "flex min-h-11 w-full items-center gap-3 rounded-xl border px-3 py-2 text-left transition-colors",
                      isActive
                        ? "border-primary/60 bg-primary/[0.04]"
                        : "hover:border-primary/40",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : isHeard
                            ? "bg-secondary/15 text-secondary"
                            : "bg-primary/12 text-primary",
                      )}
                    >
                      {isHeard && !isActive ? (
                        <Check aria-hidden="true" className="size-4" />
                      ) : (
                        index + 1
                      )}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">
                      {station.title}
                    </span>
                    {distance !== null && (
                      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                        {formatDistance(distance)}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ol>
      </BottomSheet>

      {/* Standortdialog: erklärt den GPS-Zugriff und surft die GPS-Zustände
          idle/requesting/denied/unsupported (Anforderung P1.4). */}
      <BottomSheet
        open={showLocationSheet}
        onClose={dismissLocationSheet}
        title={t("player.gps.sheetTitle")}
        closeLabel={t("player.gps.viewFirst")}
      >
        <div className="mt-4 flex flex-col gap-4">
          {gpsStatus === "unsupported" ? (
            <>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {t("player.gps.unsupported")}
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={dismissLocationSheet}
                className="w-full rounded-full"
              >
                {t("player.gps.viewFirst")}
              </Button>
            </>
          ) : gpsStatus === "denied" ? (
            <>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {t("player.gps.denied")}
              </p>
              <div className="flex flex-col gap-2">
                <Button
                  type="button"
                  onClick={retrySheetLocation}
                  className="w-full rounded-full"
                >
                  {t("player.gps.retry")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={dismissLocationSheet}
                  className="w-full rounded-full"
                >
                  {t("player.gps.viewFirst")}
                </Button>
              </div>
            </>
          ) : gpsStatus === "requesting" ? (
            <>
              <p className="flex items-start gap-2.5 text-sm leading-relaxed text-muted-foreground">
                <Navigation
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0 animate-pulse text-primary"
                />
                <span>{t("player.gps.requesting")}</span>
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={dismissLocationSheet}
                className="w-full rounded-full"
              >
                {t("player.gps.viewFirst")}
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {t("player.gps.explain")}
              </p>
              <div className="flex flex-col gap-2">
                <Button
                  type="button"
                  onClick={activateLocation}
                  className="w-full rounded-full"
                >
                  {t("player.gps.activate")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={dismissLocationSheet}
                  className="w-full rounded-full"
                >
                  {t("player.gps.viewFirst")}
                </Button>
              </div>
              <Link
                href="/datenschutz#gps-standort"
                className="text-center text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                {t("player.gps.privacyLink")}
              </Link>
            </>
          )}
        </div>
      </BottomSheet>
    </div>
  );
}
