// public/sw.js
const CACHE_NAME = "pj-cache-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)),
        ),
      ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return; // never cache POST/PUT/DELETE

  // Page navigations: try network first, fall back to last cached version
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return res;
        })
        .catch(() =>
          caches
            .match(request)
            .then((cached) => cached || caches.match("/home")),
        ),
    );
    return;
  }

  // Static assets & API GETs: serve cache instantly, refresh in background
  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request)
        .then((res) => {
          caches
            .open(CACHE_NAME)
            .then((cache) => cache.put(request, res.clone()));
          return res;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    }),
  );
});
