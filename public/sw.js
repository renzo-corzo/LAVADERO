/* Service worker de la PWA Lavadero.
 *
 * Estrategia pensada para un negocio EN VIVO (datos que cambian):
 *  - Assets estáticos (_next/static, íconos): cache-first (rápidos, no cambian).
 *  - Navegación y /api/*: network-first, con fallback a caché/offline solo si no hay red.
 *  Nunca se cachea /api de forma que muestre datos viejos cuando hay conexión.
 */

const VERSION = 'v2'
const STATIC_CACHE = `lavadero-static-${VERSION}`
const PAGES_CACHE = `lavadero-pages-${VERSION}`
const OFFLINE_URL = '/offline.html'

// Precargar la pantalla offline
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll([OFFLINE_URL]))
  )
  self.skipWaiting()
})

// Limpiar cachés de versiones anteriores
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => !k.endsWith(VERSION))
          .map((k) => caches.delete(k))
      )
    )
  )
  self.clients.claim()
})

function esEstatico(url) {
  return (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icon-') ||
    url.pathname === '/favicon.svg' ||
    url.pathname === '/apple-touch-icon.png' ||
    url.pathname === '/manifest.json' ||
    /\.(png|jpg|jpeg|svg|webp|ico|woff2?)$/.test(url.pathname)
  )
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  // 1) Assets estáticos → cache-first
  if (esEstatico(url)) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((res) => {
            const copy = res.clone()
            caches.open(STATIC_CACHE).then((c) => c.put(request, copy))
            return res
          })
      )
    )
    return
  }

  // 2) API → network-only (nunca datos viejos; si no hay red, error normal)
  if (url.pathname.startsWith('/api/')) {
    return // dejamos que el navegador lo maneje directo
  }

  // 3) Navegación (páginas) → network-first, fallback a caché o pantalla offline
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone()
          caches.open(PAGES_CACHE).then((c) => c.put(request, copy))
          return res
        })
        .catch(async () => {
          const cached = await caches.match(request)
          return cached || caches.match(OFFLINE_URL)
        })
    )
  }
})

// ---------- Notificaciones push ----------

self.addEventListener('push', (event) => {
  let data = { title: 'Lavadero', body: '', url: '/tablero', tag: 'lavadero' }
  try {
    if (event.data) data = { ...data, ...event.data.json() }
  } catch (_) {
    if (event.data) data.body = event.data.text()
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: data.tag,
      renotify: true,
      data: { url: data.url || '/tablero' },
    })
  )
})

// Al tocar la notificación: enfocar una ventana existente o abrir la app
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const destino = (event.notification.data && event.notification.data.url) || '/tablero'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientes) => {
      for (const c of clientes) {
        if ('focus' in c) {
          c.navigate(destino)
          return c.focus()
        }
      }
      return self.clients.openWindow(destino)
    })
  )
})
