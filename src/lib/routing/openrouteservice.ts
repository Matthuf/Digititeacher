// Fussweg-Routing per OpenRouteService-REST-API (kein SDK), analog zu
// lib/ai/deepl.ts. Ohne OPENROUTESERVICE_API_KEY bleibt die Karte bei der
// Luftlinie zur nächsten Station.

const ORS_DIRECTIONS_URL =
  "https://api.openrouteservice.org/v2/directions/foot-walking";

export function routingConfigured(): boolean {
  return !!process.env.OPENROUTESERVICE_API_KEY;
}

/** Gibt eine Liste von [lat, lng]-Punkten entlang des Fussweges zurück, oder null. */
export async function fetchWalkingRoute(
  from: { latitude: number; longitude: number },
  to: { latitude: number; longitude: number },
): Promise<[number, number][] | null> {
  const key = process.env.OPENROUTESERVICE_API_KEY;
  if (!key) return null;

  const url = new URL(ORS_DIRECTIONS_URL);
  url.searchParams.set("api_key", key);
  url.searchParams.set("start", `${from.longitude},${from.latitude}`);
  url.searchParams.set("end", `${to.longitude},${to.latitude}`);

  const res = await fetch(url.toString());
  if (!res.ok) return null;

  const data = (await res.json()) as {
    features?: { geometry?: { coordinates?: [number, number][] } }[];
  };
  const coords = data.features?.[0]?.geometry?.coordinates;
  if (!coords || coords.length === 0) return null;

  // ORS liefert [lon, lat] – Leaflet erwartet [lat, lon].
  return coords.map(([lon, lat]) => [lat, lon]);
}
