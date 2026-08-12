const CACHE_NAME = 'istighfar-cache-v3';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './tailwind.css',
  './script.js',
  './js/constants.js',
  './js/storage.js',
  './js/services/haptics.js',
  './js/services/notifications.js',
  './js/services/prayer.js',
  './vendor/adhan/Adhan.js',
  './vendor/adhan/Astronomical.js',
  './vendor/adhan/CalculationMethod.js',
  './vendor/adhan/CalculationParameters.js',
  './vendor/adhan/Coordinates.js',
  './vendor/adhan/DateUtils.js',
  './vendor/adhan/HighLatitudeRule.js',
  './vendor/adhan/Madhab.js',
  './vendor/adhan/MathUtils.js',
  './vendor/adhan/PolarCircleResolution.js',
  './vendor/adhan/Prayer.js',
  './vendor/adhan/PrayerTimes.js',
  './vendor/adhan/Qibla.js',
  './vendor/adhan/Rounding.js',
  './vendor/adhan/Shafaq.js',
  './vendor/adhan/SolarCoordinates.js',
  './vendor/adhan/SolarTime.js',
  './vendor/adhan/SunnahTimes.js',
  './vendor/adhan/TimeComponents.js',
  './vendor/adhan/TypeUtils.js',
  './lib/chart.umd.js',
  './assets/icon.png',
  './assets/fonts/Inter-Light.ttf',
  './assets/fonts/Inter-Regular.ttf',
  './assets/fonts/Inter-Medium.ttf',
  './assets/fonts/Inter-SemiBold.ttf',
  './assets/fonts/Inter-Bold.ttf',
  './assets/fonts/Inter-ExtraBold.ttf',
  './assets/fonts/NotoNaskhArabic-Variable.ttf'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.all(
        ASSETS_TO_CACHE.map((url) =>
          cache.add(url).catch((err) => console.log('Cache failed for', url, err))
        )
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          // Cache successful GET responses for future offline use
          if (event.request.method === 'GET' && response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          }
          return response;
        })
        .catch(() => cached);
    })
  );
});
