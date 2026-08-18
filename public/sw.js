// Caches the app shell (the HTML/JS/CSS Vite builds, not any document data —
// that's the user's actual government-document records, which this worker
// never touches; Dashboard.jsx handles that itself with a localStorage
// fallback). Bump CACHE_VERSION on any change to what/how this worker
// caches, so the activate handler drops the old cache instead of a stale
// shell lingering forever.
const CACHE_VERSION = 'orbit-shell-v1'

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  // Cross-origin requests (Supabase REST/auth, Google Fonts, etc.) are never
  // intercepted — they carry per-user auth and change far too often for a
  // cache to be anything but wrong.
  if (url.origin !== self.location.origin) return
  if (event.request.method !== 'GET') return

  if (event.request.mode === 'navigate') {
    // Network-first: always prefer the live page when one's reachable, and
    // only fall back to the cached shell when the network fails outright —
    // i.e. actually offline, not just "cache exists."
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone()
          caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, copy))
          return response
        })
        .catch(() => caches.match(event.request).then((cached) => cached || caches.match('/')))
    )
    return
  }

  // Same-origin static assets (Vite's content-hashed JS/CSS/images): the
  // hash in the filename means a cached copy is never stale, so cache-first
  // is safe and skips the network round-trip entirely on repeat visits.
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached
      return fetch(event.request).then((response) => {
        const copy = response.clone()
        caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, copy))
        return response
      })
    })
  )
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
