"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";

const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export type StationPin = {
  id: string;
  title: string;
  latitude: number;
  longitude: number;
};

export function TourMap({
  stations,
  className,
}: {
  stations: StationPin[];
  className?: string;
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
      className={className ?? "h-96 w-full rounded-lg"}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {stations.map((station) => (
        <Marker
          key={station.id}
          position={[station.latitude, station.longitude]}
          icon={markerIcon}
        >
          <Popup>{station.title}</Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
