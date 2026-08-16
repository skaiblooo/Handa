// Minimal service worker: exists to satisfy the browser's installability
// criteria (Chrome requires a registered fetch handler before it'll offer
// "Add to Home Screen") and because iOS requires one in place before push
// notifications can work there at all. No offline caching here on purpose —
// this app's data changes too often for a cache strategy to be worth the
// invalidation complexity that comes with it.
self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', () => {
  // Plain network passthrough — no caching. Exists purely so the browser
  // recognizes this as a real service worker for install-prompt purposes.
})
