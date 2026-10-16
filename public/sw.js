const CACHE_NAME = "bujo-dungeon-v1";
const ASSETS = ["/", "/index.html"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;

  // Online-first: la red manda; la caché es respaldo (incluso offline).
  // Las navegaciones evitan la caché HTTP para no servir un HTML viejo.
  const fromNetwork = fetch(e.request, {
    cache: e.request.mode === "navigate" ? "no-cache" : "default",
  }).then((res) => {
    if (res.ok) {
      const clone = res.clone();
      caches.open(CACHE_NAME).then((c) => c.put(e.request, clone));
    }
    return res;
  });

  e.respondWith(
    fromNetwork.catch(() =>
      caches.match(e.request).then((cached) => cached || caches.match("/index.html")),
    ),
  );
});
