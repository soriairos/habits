const CACHE = "habits-__VERSION__";
const ASSETS = __ASSETS__;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(ASSETS.map((url) => new Request(url, { cache: "reload" }))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request.url, { cache: "reload" }).catch(() =>
        caches.match("./index.html", { cacheName: CACHE }).then((hit) => hit ?? Response.error()),
      ),
    );
    return;
  }
  event.respondWith(caches.match(request).then((hit) => hit ?? fetch(request)));
});
