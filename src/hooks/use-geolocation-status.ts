"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { distanceMeters } from "@/lib/geo";

/**
 * GPS-Status-Enum (Anforderungsdokument §15.2). Genau ein Wert beschreibt zu
 * jedem Zeitpunkt den Standort-Zustand des Players.
 */
export type GpsStatus =
  | "idle"
  | "requesting"
  | "granted"
  | "inaccurate"
  | "denied"
  | "unsupported"
  | "offline"
  | "outside-route";

/** Genauigkeit schlechter als dieser Wert (Meter) gilt als „ungenau“. */
const INACCURATE_ACCURACY_METERS = 50;
/** Distanz zur nächsten Station (Meter), ab der man als „ausserhalb“ gilt. */
const OUTSIDE_ROUTE_METERS = 3000;

type StationPoint = { latitude: number; longitude: number };

type UseGeolocationStatus = {
  /** Abgeleiteter Einzelzustand für die UI. */
  status: GpsStatus;
  /** Rohposition – von der Hysterese/Distanz-Logik im Player weiter genutzt. */
  position: GeolocationCoordinates | null;
  /** Erneuter Standortversuch nach einer Ablehnung/Fehler. */
  retry: () => void;
};

/**
 * Kapselt Permissions-Vorabprüfung, `watchPosition`-Abo, Online/Offline-Listener
 * und leitet daraus den `GpsStatus` ab. `enabled` steuert, ob überhaupt nach der
 * Position gesucht wird (entspricht „Tour läuft“).
 *
 * Prioritätsreihenfolge des abgeleiteten Status:
 * unsupported > denied > idle (solange nicht aktiv) > offline > requesting >
 * outside-route > inaccurate > granted. Offline hat also Vorrang vor
 * outside-route/inaccurate, damit sich die Statusmeldungen nie überlagern.
 */
export function useGeolocationStatus({
  enabled,
  stations,
}: {
  enabled: boolean;
  stations: StationPoint[];
}): UseGeolocationStatus {
  const [position, setPosition] = useState<GeolocationCoordinates | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [online, setOnline] = useState(true);
  const [retryNonce, setRetryNonce] = useState(0);

  const supported =
    typeof navigator !== "undefined" && "geolocation" in navigator;

  // Online/Offline-Status verfolgen (Teil des Statusmodells, siehe §15.2).
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    // Erst-Synchronisierung deferred, um react-hooks/set-state-in-effect zu vermeiden.
    const timer = setTimeout(update, 0);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  // Permissions-API-Vorabprüfung: erlaubt, den „denied“-Zustand zu zeigen, bevor
  // der Nutzer überhaupt anfragt. Feature-detected – ältere Browser (Safari)
  // fallen still auf den klick-getriggerten Ablauf zurück.
  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.permissions?.query) {
      return;
    }
    let cancelled = false;
    let permStatus: PermissionStatus | null = null;
    const onChange = () => {
      if (permStatus) setPermissionDenied(permStatus.state === "denied");
    };
    navigator.permissions
      .query({ name: "geolocation" as PermissionName })
      .then((res) => {
        if (cancelled) return;
        permStatus = res;
        setPermissionDenied(res.state === "denied");
        res.addEventListener("change", onChange);
      })
      .catch(() => {
        // Permissions-API nicht verfügbar/blockiert – klick-getriggerter Fallback.
      });
    return () => {
      cancelled = true;
      permStatus?.removeEventListener("change", onChange);
    };
  }, [retryNonce]);

  // Positionsabo – nur wenn aktiv. `retryNonce` erzwingt ein Neu-Abo.
  useEffect(() => {
    if (!enabled || !supported) return;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setPermissionDenied(false);
        setPosition(pos.coords);
      },
      (err) => {
        // Nur die harte Ablehnung wird zum „denied“-Zustand; Timeout/
        // Position-unavailable lassen die Suche (requesting) weiterlaufen.
        if (err.code === err.PERMISSION_DENIED) setPermissionDenied(true);
      },
      { enableHighAccuracy: true },
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [enabled, supported, retryNonce]);

  const nearestDistance = useMemo(() => {
    if (!position || stations.length === 0) return null;
    let min = Infinity;
    for (const s of stations) {
      const d = distanceMeters(
        { latitude: position.latitude, longitude: position.longitude },
        s,
      );
      if (d < min) min = d;
    }
    return min;
  }, [position, stations]);

  const status: GpsStatus = useMemo(() => {
    if (!supported) return "unsupported";
    if (permissionDenied) return "denied";
    if (!enabled) return "idle";
    if (!online) return "offline";
    if (!position) return "requesting";
    if (nearestDistance != null && nearestDistance > OUTSIDE_ROUTE_METERS) {
      return "outside-route";
    }
    if (position.accuracy > INACCURATE_ACCURACY_METERS) return "inaccurate";
    return "granted";
  }, [supported, permissionDenied, enabled, online, position, nearestDistance]);

  const retry = useCallback(() => {
    setPermissionDenied(false);
    setRetryNonce((n) => n + 1);
  }, []);

  return { status, position, retry };
}
