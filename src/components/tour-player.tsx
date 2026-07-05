"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { TourMap } from "@/components/tour-map";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { distanceMeters } from "@/lib/geo";
import type { Station } from "@/lib/tours";
import { MapPin, Pause, Play } from "lucide-react";

const TRIGGER_RADIUS_METERS = 40;

export function TourPlayer({ stations }: { stations: Station[] }) {
  const [position, setPosition] = useState<GeolocationCoordinates | null>(
    null,
  );
  const [geoError, setGeoError] = useState<string | null>(null);
  const [autoPlay, setAutoPlay] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRefs = useRef(new Map<string, HTMLAudioElement>());
  const triggeredRef = useRef(new Set<string>());

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

      if (distance <= TRIGGER_RADIUS_METERS) {
        triggeredRef.current.add(station.id);
        playStation(station.id);
        break;
      }
    }
  }, [position, autoPlay, stations, playStation]);

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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between rounded-lg border p-4">
        <div>
          <p className="font-medium">GPS-Autoplay</p>
          <p className="text-sm text-muted-foreground">
            Startet Audio automatisch, wenn du eine Station erreichst.
          </p>
          {geoError && <p className="mt-1 text-sm text-destructive">{geoError}</p>}
        </div>
        <Button
          type="button"
          variant={autoPlay ? "default" : "outline"}
          onClick={() => (autoPlay ? setAutoPlay(false) : enableAutoPlay())}
        >
          {autoPlay ? "Aktiv" : "Aktivieren"}
        </Button>
      </div>

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
      />

      <ol className="flex flex-col gap-4">
        {stations.map((station, index) => {
          const distance = position
            ? Math.round(
                distanceMeters(
                  { latitude: position.latitude, longitude: position.longitude },
                  station,
                ),
              )
            : null;
          const isPlaying = playingId === station.id;

          return (
            <li key={station.id}>
              <Card className={isPlaying ? "border-primary" : undefined}>
                <CardContent className="flex flex-col gap-3 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Station {index + 1}
                      </p>
                      <h2 className="text-lg font-medium">{station.title}</h2>
                      {station.description && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {station.description}
                        </p>
                      )}
                    </div>
                    {distance !== null && (
                      <Badge variant="outline" className="flex shrink-0 items-center gap-1">
                        <MapPin className="size-3" />
                        {distance} m
                      </Badge>
                    )}
                  </div>

                  {station.audio_url && (
                    <div className="flex items-center gap-3">
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        onClick={() => toggleStation(station.id)}
                      >
                        {isPlaying ? <Pause /> : <Play />}
                      </Button>
                      <audio
                        ref={(el) => {
                          if (el) audioRefs.current.set(station.id, el);
                          else audioRefs.current.delete(station.id);
                        }}
                        className="w-full"
                        controls
                        src={station.audio_url}
                        onPlay={() => setPlayingId(station.id)}
                        onPause={() =>
                          setPlayingId((current) =>
                            current === station.id ? null : current,
                          )
                        }
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
