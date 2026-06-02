// Service Worker for OGas Marketplace
// Handles push notifications and background tasks

const CACHE_NAME = 'ogas-marketplace-v1';
const urlsToCache = [
  '/',
  '/products',
  '/tracking',
  '/price-comparison',
];

// Install event - cache app shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache opened');
        return cache.addAll(urlsToCache).catch(err => {
          console.log('Cache addAll error:', err);
        });
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }

        return fetch(event.request).then(response => {
          // Don't cache non-successful responses
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      })
      .catch(() => {
        // Return offline page or cached response
        return caches.match('/');
      })
  );
});

// Push notification event
self.addEventListener('push', event => {
  if (!event.data) {
    console.log('Push notification received but no data');
    return;
  }

  let notificationData = {
    title: 'OGas Marketplace',
    body: 'You have a new notification',
    icon: '/ogas-icon-192x192.png',
    badge: '/ogas-badge-72x72.png',
  };

  try {
    const data = event.data.json();
    notificationData = {
      ...notificationData,
      ...data,
      tag: data.tag || 'ogas-notification',
      requireInteraction: data.requireInteraction || false,
    };
  } catch (e) {
    notificationData.body = event.data.text();
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      requireInteraction: notificationData.requireInteraction,
      data: {
        dateOfArrival: Date.now(),
        primaryKey: notificationData.tag,
        url: notificationData.url || '/',
      },
      actions: notificationData.actions || [
        {
          action: 'open',
          title: 'Open',
        },
        {
          action: 'close',
          title: 'Close',
        },
      ],
    })
  );
});

// Notification click event
self.addEventListener('notificationclick', event => {
  console.log('Notification clicked:', event.action);

  if (event.action === 'close' || !event.action) {
    event.notification.close();
    return;
  }

  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      // Check if app is already open
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === event.notification.data.url && 'focus' in client) {
          return client.focus();
        }
      }

      // If not open, open the app
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data.url);
      }
    })
  );
});

// Notification close event
self.addEventListener('notificationclose', event => {
  console.log('Notification closed');
  
  event.waitUntil(
    fetch('/api/notifications/mark-delivered', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        notificationId: event.notification.data.primaryKey,
      }),
    })
  );
});

// Background sync for refill reminders
self.addEventListener('sync', event => {
  if (event.tag === 'refill-reminder-sync') {
    event.waitUntil(
      fetch('/api/notifications/check-reminders', {
        method: 'GET',
      })
        .then(response => response.json())
        .then(data => {
          if (data.remindersToSend && data.remindersToSend.length > 0) {
            data.remindersToSend.forEach(reminder => {
              self.registration.showNotification(
                '⏰ Gas Refill Reminder',
                {
                  body: `Time to refill your ${reminder.productName}! You usually use one every ${reminder.averageDaysUsage} days.`,
                  icon: '/ogas-icon-192x192.png',
                  badge: '/ogas-badge-72x72.png',
                  tag: `refill-${reminder.reminderId}`,
                  data: {
                    url: '/products',
                    reminderId: reminder.reminderId,
                    productId: reminder.productId,
                  },
                  actions: [
                    {
                      action: 'order',
                      title: 'Order Now',
                    },
                    {
                      action: 'later',
                      title: 'Later',
                    },
                  ],
                }
              );
            });
          }
        })
        .catch(err => console.error('Refill reminder sync failed:', err))
    );
  }
});

// Periodic background sync (for checking reminders periodically)
self.addEventListener('periodicsync', event => {
  if (event.tag === 'check-refill-reminders') {
    event.waitUntil(
      fetch('/api/notifications/schedule-reminder?action=check-due')
        .then(response => response.json())
        .then(data => {
          if (data.dueSoon && data.dueSoon.length > 0) {
            data.dueSoon.forEach(reminder => {
              self.registration.showNotification(
                '💡 Gas Running Low Soon',
                {
                  body: `Your ${reminder.productName} will run out in about ${reminder.daysUntilReminder} days`,
                  icon: '/ogas-icon-192x192.png',
                  tag: `upcoming-${reminder.reminderId}`,
                  data: {
                    url: '/price-comparison',
                    reminderId: reminder.reminderId,
                  },
                }
              );
            });
          }
        })
    );
  }
});

// Handle messages from the app
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'SCHEDULE_REFILL_CHECK') {
    // Schedule periodic sync if available
    if ('periodicSync' in self.registration) {
      self.registration.periodicSync.register('check-refill-reminders', {
        minInterval: 24 * 60 * 60 * 1000, // 24 hours
      }).catch(err => console.error('Failed to register periodic sync:', err));
    }
  }
});

console.log('OGas Service Worker loaded');