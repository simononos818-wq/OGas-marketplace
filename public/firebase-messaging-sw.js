/* OGas FCM service worker */
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDWvX8sL_08ecR5sqtQbGTV8RR-NiNHzEc",
  authDomain: "ogasapp-5a003.firebaseapp.com",
  projectId: "ogasapp-5a003",
  storageBucket: "ogasapp-5a003.firebasestorage.app",
  messagingSenderId: "233768058710",
  appId: "1:233768058710:web:a0a378df2be9f453fce0f7"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const n = payload.notification || {};
  self.registration.showNotification(n.title || 'OGas', {
    body: n.body || '',
    icon: '/ogas-icon.svg',
    badge: '/ogas-icon.svg',
    data: payload.data || {}
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow('/orders'));
});
