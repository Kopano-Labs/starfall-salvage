const CACHE_NAME = "starfall-salvage-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./src/game.js",
  "./kopano-flight-mark.svg",
  "./manifest.webmanifest"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
