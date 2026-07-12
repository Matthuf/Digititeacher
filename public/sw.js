// Offline-Strategie in zwei Teilen:
//
// 1. Tour-Assets (Cover, Stationsbilder, Audio) legt der "Für offline
//    speichern"-Button per Cache API in einen tourspezifischen Cache
//    (src/lib/offline.ts). Für alle übrigen Requests gilt: Netzwerk zuerst,
//    bei Fehler (offline) auf den Cache zurückfallen.
//
// 2. Kartenkacheln (Thunderforest/OpenStreetMap) und Route-Antworten
//    (/api/route) werden zusätzlich "stale-while-revalidate" gecacht: was
//    einmal online gesehen wurde, ist später auch im Funkloch verfügbar –
//    ohne dass der Nutzer sie explizit herunterladen muss.

const TILE_CACHE = "sendalore-tiles-v1";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Alte Tile-Cache-Versionen aufräumen.
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k.startsWith("sendalore-tiles-") && k !== TILE_CACHE)
          .map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

function isTileOrRoute(url) {
  return (
    url.hostname.endsWith("tile.thunderforest.com") ||
    url.hostname.endsWith("tile.openstreetmap.org") ||
    url.pathname === "/api/route"
  );
}

// Stale-while-revalidate: sofort aus dem Cache liefern (falls vorhanden) und
// parallel im Hintergrund aktualisieren. Fällt das Netz aus, bleibt der
// gecachte Stand nutzbar.
async function staleWhileRevalidate(request) {
  const cache = await caches.open(TILE_CACHE);
  const cached = await cache.match(request, { ignoreVary: true });

  const network = fetch(request)
    .then((response) => {
      // Nur erfolgreiche Antworten cachen (auch "opaque" von fremden Hosts).
      if (response && (response.ok || response.type === "opaque")) {
        cache.put(request, response.clone()).catch(() => {});
      }
      return response;
    })
    .catch(() => null);

  return cached || (await network) || Promise.reject(new Error("Offline."));
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  let url;
  try {
    url = new URL(event.request.url);
  } catch {
    return;
  }

  if (isTileOrRoute(url)) {
    event.respondWith(staleWhileRevalidate(event.request));
    return;
  }

  event.respondWith(
    fetch(event.request).catch(async () => {
      const cached = await caches.match(event.request, { ignoreVary: true });
      if (cached) return cached;
      throw new Error("Offline und nicht im Cache gefunden.");
    }),
  );
});
