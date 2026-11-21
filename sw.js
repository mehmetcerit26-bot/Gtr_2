// Gladiator Tablet - internetsiz calisma (service worker)
// CRT Otomasyon · 21.11.2026 · v12
// Sayfa dosyalari tablete kaydedilir. Internet yokken kayitli kopya acilir.
// Internet varken arka planda yeni surum indirilir (bir sonraki acilista gelir).
// Yeni surum yuklerken asagidaki numarayi 1 artir.
const SURUM = "gladiator-v12";
const DOSYALAR = ["./", "./index.html", "./manifest.json", "./icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(SURUM).then(c => c.addAll(DOSYALAR)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(adlar => Promise.all(adlar.filter(a => a !== SURUM).map(a => caches.delete(a))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const istek = e.request;
  if (istek.method !== "GET" || new URL(istek.url).origin !== location.origin) return;
  e.respondWith((async () => {
    const depo = await caches.open(SURUM);
    let kayitli = await depo.match(istek, { ignoreSearch: true });
    if (!kayitli && istek.mode === "navigate") kayitli = await depo.match("./index.html");
    const yeni = fetch(istek)
      .then(c => { if (c.ok) depo.put(istek, c.clone()); return c; })
      .catch(() => kayitli);
    if (kayitli) { e.waitUntil(yeni.catch(() => {})); return kayitli; }   // once kayitli kopya (hizli, internetsiz)
    return yeni;
  })());
});
