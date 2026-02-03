const CACHE_NAME = "retatrutide-cache-v3";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      // "/*" will include your built JS, CSS, and index.html from dist
      cache.addAll(["/", "/index.html", "/manifest.webmanifest", "/vite.svg"])
    )
  );
  console.log("[SW] Installed and cached basic files");
});

self.addEventListener("fetch", (event) => {
  // Only handle GET requests
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {
        // Return cached first (offline‑first)
        return cached;
      }

      return fetch(event.request)
        .then((response) => {
          // Cache new assets dynamically as they’re fetched
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, response.clone());
            return response;
          });
        })
        .catch(() => caches.match("/index.html"));
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.map((n) => n !== CACHE_NAME && caches.delete(n)))
    )
  );
  console.log("[SW] Activated, old caches cleared");
});