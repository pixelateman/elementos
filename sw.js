const CACHE_NAME = 'elementos-v1';
const ARCHIVOS = ['./', './index.html', './manifest.json', './icono.png', './chemical-elements.js', './periodic-table-app.js', './flags/', './flags/br.svg/', './flags/cz.svg/', './flags/de.svg/', './flags/es.svg/', './flags/fr.svg/', './flags/gb.svg/', './flags/in.svg/', './flags/pl.svg/', './flags/ru.svg/', './flags/tr.svg/'];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ARCHIVOS))
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then((respuestaLocal) => {
      // Devuelve SIEMPRE la copia guardada en el iPhone sin depender del servidor
      return respuestaLocal || fetch(e.request);
    })
  );
});
