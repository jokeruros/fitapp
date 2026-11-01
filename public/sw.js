self.addEventListener('push', event => {
  let message = {}
  try {
    message = event.data ? event.data.json() : {}
  } catch {
    message = { body: event.data?.text() ?? '' }
  }

  event.waitUntil(self.registration.showNotification(message.title || 'NutriTrack', {
    body: message.body || 'Remember to save today’s progress.',
    icon: '/nutritrack-icon.svg',
    badge: '/nutritrack-icon.svg',
    tag: 'daily-progress-reminder',
    data: { url: message.url || '/' }
  }))
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  event.waitUntil((async () => {
    const target = new URL(event.notification.data?.url || '/', self.location.origin).href
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    for (const client of windows) {
      if (client.url.startsWith(self.location.origin)) {
        await client.focus()
        if ('navigate' in client && client.url !== target) await client.navigate(target)
        return
      }
    }
    await self.clients.openWindow(target)
  })())
})
