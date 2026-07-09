const CACHE_PREFIX = "sendalore-tour-";

function tourCacheName(tourId: string) {
  return `${CACHE_PREFIX}${tourId}`;
}

export async function cacheTourForOffline(tourId: string, urls: string[]) {
  if (!("caches" in window)) {
    throw new Error("Offline-Speicherung wird von diesem Browser nicht unterstützt.");
  }
  const cache = await caches.open(tourCacheName(tourId));
  const uniqueUrls = [...new Set(urls.filter(Boolean))];
  await Promise.all(
    uniqueUrls.map((url) =>
      cache.add(url).catch(() => {
        // Einzelne fehlgeschlagene Datei ist kein Showstopper.
      }),
    ),
  );
}

export async function removeTourOfflineCache(tourId: string) {
  if (!("caches" in window)) return;
  await caches.delete(tourCacheName(tourId));
}

export async function isTourCached(tourId: string) {
  if (!("caches" in window)) return false;
  return caches.has(tourCacheName(tourId));
}
