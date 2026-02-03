const CACHE_NAME = "retatrutide-cache-v2";
const OFFLINE_URLS = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/vite.svg",
  "/src/main.tsx"
];

// On install — pre‑cache essential assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(OFFLINE_URLS)
    )
  );
  console.log("[SW] Installed and cached offline assets");
});

// Serve cached content if the network is unavailable
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return (
        cached ||
        fetch(event.request).catch(() =>
          caches.match("/index.html")
        )
      );
    })
  );
});

// Remove old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))
      )
    )
  );
  console.log("[SW] Activated");
});