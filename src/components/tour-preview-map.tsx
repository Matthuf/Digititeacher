"use client";

import { TourMap, type StationPin } from "@/components/tour-map";

/**
 * Vorschaukarte vor Tourstart: zeigt alle Stationen in Reihenfolge, mit einer
 * gestrichelten Linie verbunden. Kein Standort, kein Live-Routing – rein
 * informativ. Client-Wrapper, weil Leaflet nicht SSR-fähig ist.
 */
export function TourPreviewMap({ stations }: { stations: StationPin[] }) {
  if (stations.length === 0) return null;

  return (
    <div className="h-72 overflow-hidden rounded-2xl border sm:h-96">
      <TourMap stations={stations} previewRoute className="h-full w-full" />
    </div>
  );
}
