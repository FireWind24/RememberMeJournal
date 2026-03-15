/// <reference lib="webworker" />
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching'

declare const self: ServiceWorkerGlobalScope

cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST)

// Handle push notifications
self.addEventListener('push', (event: PushEvent) => {
  const data = event.data?.json() ?? {}
  const title = data.title ?? 'Remember Me ✿'
  const body  = data.body  ?? 'Time to write in your journal 🌸'
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/icon.svg',
      badge: '/icon.svg',
      tag: 'remember-me-reminder',
      data: { url: self.location.origin },
    })
  )
})

// Tap notification → open app
self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close()
  const url = event.notification.data?.url ?? self.location.origin
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      const existing = clients.find(c => c.url === url)
      if (existing) return existing.focus()
      return self.clients.openWindow(url)
    })
  )
})

// Background sync — fires when coming back online
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(self as any).addEventListener('sync', (event: any) => {
  if (event.tag === 'sync-entries') {
    event.waitUntil(
      self.clients.matchAll().then(clients => {
        clients.forEach(c => c.postMessage({ type: 'SYNC_ENTRIES' }))
      })
    )
  }
})
