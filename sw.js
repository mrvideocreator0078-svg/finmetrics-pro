/**
 * FINMETRICS PRO — EDGE SERVICE WORKER (PWA & OFFLINE ENGINE)
 * High-Speed Cache-First Strategy for Instant 0ms Load Times & Infinite Scalability
 */

const CACHE_NAME = 'finmetrics-pro-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/assets/css/main.css',
  '/assets/css/calculator.css',
  '/assets/css/premium-animations.css',
  '/assets/js/core.js',
  '/assets/js/math-utils.js',
  '/assets/js/animated-counter.js',
  '/assets/js/chart.min.js',
  '/assets/favicon.svg',
  '/calculators/compound-interest/index.html',
  '/calculators/compound-interest/app.js',
  '/calculators/mortgage-payoff/index.html',
  '/calculators/mortgage-payoff/app.js',
  '/calculators/debt-payoff/index.html',
  '/calculators/debt-payoff/app.js',
  '/calculators/auto-loan-lease/index.html',
  '/calculators/auto-loan-lease/app.js',
  '/about.html',
  '/methodology.html',
  '/disclaimer.html',
  '/privacy.html',
  '/terms.html',
  '/contact.html'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  // Only cache GET requests
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then((cached) => {
      const networked = fetch(e.request).then((res) => {
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
        }
        return res;
      }).catch(() => cached);
      return cached || networked;
    })
  );
});
