"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Leaflet nur clientseitig laden (kein SSR), analog zu tour-map.tsx.
const PickerMap = dynamic(
  () =>
    import("./station-coordinate-picker-map").then(
      (mod) => mod.StationCoordinatePickerMap,
    ),
  { ssr: false },
);

// Sinnvoller Standard-Kartenmittelpunkt, wenn weder Station noch andere
// Stationen Koordinaten haben (Flims, Schweizer Alpen).
const FLIMS: [number, number] = [46.8182, 9.2966];

export function StationCoordinatePicker({
  idPrefix,
  defaultLat,
  defaultLng,
  center,
}: {
  idPrefix: string;
  defaultLat?: number | null;
  defaultLng?: number | null;
  /** Fallback-Zentrum (z. B. Schwerpunkt der übrigen Stationen). */
  center?: { lat: number; lng: number } | null;
}) {
  const [lat, setLat] = useState(defaultLat != null ? String(defaultLat) : "");
  const [lng, setLng] = useState(defaultLng != null ? String(defaultLng) : "");

  const latNum = lat.trim() === "" ? NaN : Number(lat);
  const lngNum = lng.trim() === "" ? NaN : Number(lng);
  const hasPoint = Number.isFinite(latNum) && Number.isFinite(lngNum);
  const mapCenter: [number, number] = center ? [center.lat, center.lng] : FLIMS;

  return (
    <div className="flex flex-col gap-2">
      <div className="h-56 overflow-hidden rounded-md border">
        <PickerMap
          lat={hasPoint ? latNum : null}
          lng={hasPoint ? lngNum : null}
          center={mapCenter}
          onPick={(la, lo) => {
            setLat(la.toFixed(6));
            setLng(lo.toFixed(6));
          }}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Auf die Karte tippen, um die Koordinaten zu setzen. Die Felder lassen
        sich auch von Hand anpassen.
      </p>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${idPrefix}-latitude`}>Breitengrad</Label>
          <Input
            id={`${idPrefix}-latitude`}
            name="latitude"
            type="number"
            step="any"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${idPrefix}-longitude`}>Längengrad</Label>
          <Input
            id={`${idPrefix}-longitude`}
            name="longitude"
            type="number"
            step="any"
            value={lng}
            onChange={(e) => setLng(e.target.value)}
            required
          />
        </div>
      </div>
    </div>
  );
}
