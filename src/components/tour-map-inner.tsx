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
}: {
  stations: StationPin[];
  className?: string;
  activeStationId?: string | null;
  userPosition?: { latitude: number; longitude: number } | null;
  /** Zeichnet eine Linie von userPosition zu diesem Punkt (z. B. die nächste Station). */
  routeTarget?: { latitude: number; longitude: number } | null;
}) {
  if (stations.length === 0) {
    return null;
  }

  const center: [number, number] = [
    stations[0].latitude,
    stations[0].longitude,
  ];

  return (
    <MapContainer
      center={center}
      zoom={13}
      scrollWheelZoom={false}
      className={className ?? "h-96 w-full"}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {stations.map((station, index) => (
        <Marker
          key={`${station.id}-${station.id === activeStationId ? "active" : "idle"}`}
          position={[station.latitude, station.longitude]}
          icon={stationIcon(index, station.id === activeStationId)}
        >
          <Popup>{station.title}</Popup>
        </Marker>
      ))}
      {userPosition && routeTarget && (
        <Polyline
          positions={[
            [userPosition.latitude, userPosition.longitude],
            [routeTarget.latitude, routeTarget.longitude],
          ]}
          pathOptions={{
            color: "#b6672a",
            weight: 4,
            opacity: 0.85,
            dashArray: "1 10",
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
