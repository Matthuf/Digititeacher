"use client";

import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import L from "leaflet";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { TILE_LAYER } from "@/lib/map-tiles";

const pickIcon = L.divIcon({
  className: "dt-pin-wrap",
  html: `<div class="dt-pin dt-pin-active"></div>`,
  iconSize: [30, 38],
  iconAnchor: [15, 37],
});

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Karte liegt in einem <details>, das anfangs display:none sein kann – Leaflet
// misst dann 0px. Beim Aufklappen ändert sich die Grösse; invalidateSize()
// zeichnet die Kacheln neu.
function ResizeFix() {
  const map = useMap();
  useEffect(() => {
    const container = map.getContainer();
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(container);
    return () => observer.disconnect();
  }, [map]);
  return null;
}

export function StationCoordinatePickerMap({
  lat,
  lng,
  center,
  onPick,
}: {
  lat: number | null;
  lng: number | null;
  center: [number, number];
  onPick: (lat: number, lng: number) => void;
}) {
  const hasPoint = lat != null && lng != null;
  return (
    <MapContainer
      center={hasPoint ? [lat, lng] : center}
      zoom={13}
      scrollWheelZoom={false}
      className="h-full w-full"
    >
      <TileLayer attribution={TILE_LAYER.attribution} url={TILE_LAYER.url} />
      <ResizeFix />
      <ClickHandler onPick={onPick} />
      {hasPoint && <Marker position={[lat, lng]} icon={pickIcon} />}
    </MapContainer>
  );
}
