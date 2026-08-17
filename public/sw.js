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

self.addEventListener('push', (event) => {
  let data
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    data = { title: 'Orbit', body: event.data ? event.data.text() : '' }
  }
  event.waitUntil(
    self.registration.showNotification(data.title || 'Orbit', {
      body: data.body || '',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: { url: data.url || '/' },
    })
  )
})

// The app has no URL routing to deep-link into, so a click just brings an
// already-open tab to the front rather than opening a fresh one wherever
// possible — a new tab would just reload to the same place anyway.
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) return client.focus()
      }
      if (self.clients.openWindow) return self.clients.openWindow(url)
    })
  )
})
