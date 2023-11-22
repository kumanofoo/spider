const CACHE_NAME = "spider-caches-v1";
// Cache targets
const urlsToCache = [
  "/",
  "/index.html",
  "/manifest.json",
  "/sw.js",
  "/wall.jpg",
  "/mushi_kumo.png",
  "/icons/icon-48x48.png",
  "/icons/icon-72x72.png",
  "/icons/icon-96x96.png",
  "/icons/icon-144x144.png",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
];

const cardsPath = "/cards";
const suits = ["S", "H", "C", "D"];
const ranks = [];
for (let i = 1; i <= 13; i++) {
  let rank = i + "";
  if (i == 1) rank = "A";
  if (i == 11) rank = "J";
  if (i == 12) rank = "Q";
  if (i == 13) rank = "K";
  ranks.push(rank);
}
const svgs = [`${cardsPath}/BLUE_BACK.svg`, `${cardsPath}/RED_BACK.svg`];
suits.forEach(s => {
  ranks.forEach(r => {
    svgs.push(`${cardsPath}/${r}${s}.svg`);
  })
});
console.log(svgs);
urlsToCache.push(...svgs);
console.log(urlsToCache);

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches
      .match(event.request)
      .then((response) => {
        return response ? response : fetch(event.request);
      })
  );
});
