// Einfacher Offline-Modus: Netzwerk zuerst, bei Fehler (offline) auf den
// Cache zurückfallen. Die eigentlichen Dateien (Cover, Stationsbilder,
// Audio) werden nicht hier, sondern vom "Für offline speichern"-Button auf
// der Tourseite direkt per Cache API in einen tourspezifischen Cache gelegt
// (src/lib/offline.ts) – der Service Worker muss sie nur wiederfinden.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request).catch(async () => {
      const cached = await caches.match(event.request, { ignoreVary: true });
      if (cached) return cached;
      throw new Error("Offline und nicht im Cache gefunden.");
    }),
  );
});
