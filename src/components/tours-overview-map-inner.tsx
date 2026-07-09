"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import Link from "next/link";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import { GENRES, isGenre } from "@/lib/genres";
import { TILE_LAYER } from "@/lib/map-tiles";

export type TourPin = {
  id: string;
  title: string;
  slug: string;
  genre: string | null;
  latitude: number;
  longitude: number;
};

function tourIcon(genre: string | null) {
  const color = isGenre(genre) ? GENRES[genre].colorVar : "var(--primary)";
  return L.divIcon({
    className: "dt-pin-wrap",
    html: `<div style="width:16px;height:16px;border-radius:9999px;background:${color};border:2px solid var(--card);box-shadow:0 1px 4px rgb(0 0 0 / 0.35)"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -8],
  });
}

export function ToursOverviewMap({
  tours,
  className,
}: {
  tours: TourPin[];
  className?: string;
}) {
  if (tours.length === 0) return null;

  const center: [number, number] = [tours[0].latitude, tours[0].longitude];

  return (
    <MapContainer
      center={center}
      zoom={11}
      scrollWheelZoom={false}
      className={className ?? "h-96 w-full"}
    >
      <TileLayer attribution={TILE_LAYER.attribution} url={TILE_LAYER.url} />
      {tours.map((tour) => (
        <Marker
          key={tour.id}
          position={[tour.latitude, tour.longitude]}
          icon={tourIcon(tour.genre)}
        >
          <Popup>
            <Link href={`/touren/${tour.slug}`} className="font-medium underline">
              {tour.title}
            </Link>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
