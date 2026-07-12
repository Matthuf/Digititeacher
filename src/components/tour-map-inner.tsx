"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import {
  CircleMarker,
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
} from "react-leaflet";
import { TILE_LAYER } from "@/lib/map-tiles";

export type StationPin = {
  id: string;
  title: string;
  latitude: number;
  longitude: number;
};

function stationIcon(index: number, active: boolean) {
  return L.divIcon({
    className: "dt-pin-wrap",
    html: `<div class="dt-pin${active ? " dt-pin-active" : ""}">${index + 1}</div>`,
    iconSize: [30, 38],
    iconAnchor: [15, 37],
    popupAnchor: [0, -34],
  });
}

export function TourMap({
  stations,
  className,
  activeStationId,
  userPosition,
  routeTarget,
  routeCoords,
  previewRoute,
}: {
  stations: StationPin[];
  className?: string;
  activeStationId?: string | null;
  userPosition?: { latitude: number; longitude: number } | null;
  /** Zeichnet eine Luftlinie von userPosition zu diesem Punkt, falls keine echte Route vorliegt. */
  routeTarget?: { latitude: number; longitude: number } | null;
  /** Echte Fussweg-Route (OpenRouteService) als [lat, lng]-Punkte; hat Vorrang vor routeTarget. */
  routeCoords?: [number, number][] | null;
  /** Vorschau vor Tourstart: verbindet alle Stationen in Reihenfolge mit einer
   *  gestrichelten Linie (ohne Standort/Live-Routing). */
  previewRoute?: boolean;
}) {
  if (stations.length === 0) {
    return null;
  }

  const center: [number, number] = [
    stations[0].latitude,
    stations[0].longitude,
  ];

  const previewPositions: [number, number][] | null =
    previewRoute && stations.length > 1
      ? stations.map((s) => [s.latitude, s.longitude])
      : null;

  const routePositions: [number, number][] | null =
    routeCoords && routeCoords.length > 1
      ? routeCoords
      : userPosition && routeTarget
        ? [
            [userPosition.latitude, userPosition.longitude],
            [routeTarget.latitude, routeTarget.longitude],
          ]
        : null;

  return (
    <MapContainer
      center={center}
      zoom={13}
      scrollWheelZoom={false}
      className={className ?? "h-96 w-full"}
    >
      <TileLayer attribution={TILE_LAYER.attribution} url={TILE_LAYER.url} />
      {previewPositions && (
        <Polyline
          positions={previewPositions}
          pathOptions={{
            color: "#b6672a",
            weight: 3,
            opacity: 0.8,
            dashArray: "6 10",
            lineCap: "round",
            lineJoin: "round",
          }}
        />
      )}
      {stations.map((station, index) => (
        <Marker
          key={`${station.id}-${station.id === activeStationId ? "active" : "idle"}`}
          position={[station.latitude, station.longitude]}
          icon={stationIcon(index, station.id === activeStationId)}
        >
          <Popup>{station.title}</Popup>
        </Marker>
      ))}
      {routePositions && (
        <Polyline
          positions={routePositions}
          pathOptions={{
            color: "#b6672a",
            weight: 4,
            opacity: 0.85,
            dashArray: routeCoords && routeCoords.length > 1 ? undefined : "1 10",
            lineCap: "round",
          }}
        />
      )}
      {userPosition && (
        <CircleMarker
          center={[userPosition.latitude, userPosition.longitude]}
          radius={8}
          pathOptions={{
            color: "#f7f1e6",
            weight: 3,
            fillColor: "#18312b",
            fillOpacity: 1,
          }}
        />
      )}
    </MapContainer>
  );
}
