importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "YOUR_API_KEY",
  authDomain: "ogasapp-5a003.firebaseapp.com",
  projectId: "ogasapp-5a003",
  storageBucket: "ogasapp-5a003.appspot.com",
  messagingSenderId: "233768058710",
  appId: "YOUR_APP_ID",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification || {};
  
  // Zoho-level vibration: strong, insistent pattern
  const vibrationPattern = [500, 200, 500, 200, 800];
  
  self.registration.showNotification(title || '🔥 New OGas Order!', {
    body: body || 'You have a new gas order. Tap to view.',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: payload.data?.orderId || 'new-order',
    requireInteraction: true,
    vibrate: vibrationPattern,
    data: payload.data || {},
    actions: [
      { action: 'accept', title: '✅ Accept' },
      { action: 'dismiss', title: '❌ Dismiss' }
    ],
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const { orderId, url } = event.notification.data || {};
  
  if (event.action === 'accept') {
    event.waitUntil(clients.openWindow(`${url || '/seller/dashboard'}?order=${orderId}&action=accept`));
  } else {
    event.waitUntil(clients.openWindow(url || '/seller/dashboard'));
  }
});
