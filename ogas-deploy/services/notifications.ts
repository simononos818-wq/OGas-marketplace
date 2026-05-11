import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { db } from '../config/firebase';
import { doc, setDoc, collection, query, where, onSnapshot } from 'firebase/firestore';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotificationsAsync(userId: string) {
  if (!Device.isDevice) {
    console.log('Must use physical device for Push Notifications');
    return;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Failed to get push token for push notification!');
    return;
  }

  const token = (await Notifications.getExpoPushTokenAsync()).data;
  
  await setDoc(doc(db, 'pushTokens', userId), {
    token,
    userId,
    platform: Platform.OS,
    updatedAt: new Date(),
  });

  return token;
}

export function listenForNewOrders(userId: string, onNewOrder: (order: any) => void) {
  const q = query(
    collection(db, 'orders'),
    where('sellerId', '==', userId),
    where('status', '==', 'pending')
  );

  return onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        const order = { id: change.doc.id, ...change.doc.data() } as any;
        
        Notifications.scheduleNotificationAsync({
          content: {
            title: '🛒 New Order Received!',
            body: `${order.customerName || 'Customer'} ordered ${order.items?.[0]?.quantity || 1}x ${order.items?.[0]?.size || 'LPG'} cylinder - ₦${order.totalAmount?.toLocaleString() || 'N/A'}`,
            data: { orderId: order.id, screen: 'seller/dashboard' },
            sound: 'default',
          },
          trigger: null,
        });

        onNewOrder(order);
      }
    });
  });
}

export function listenForOrderUpdates(userId: string, onUpdate: (order: any) => void) {
  const q = query(collection(db, 'orders'), where('userId', '==', userId));

  return onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'modified') {
        const order = { id: change.doc.id, ...change.doc.data() } as any;
        
        let title = '';
        let body = '';
        
        switch (order.status) {
          case 'confirmed':
            title = '✅ Order Confirmed';
            body = `${order.sellerName || 'Seller'} has accepted your order`;
            break;
          case 'out_for_delivery':
            title = '🚚 Out for Delivery';
            body = 'Your gas cylinder is on the way!';
            break;
          case 'delivered':
            title = '🎉 Order Delivered';
            body = 'Your order has been delivered successfully';
            break;
          case 'cancelled':
            title = '❌ Order Cancelled';
            body = 'Your order has been cancelled by the seller';
            break;
        }

        if (title) {
          Notifications.scheduleNotificationAsync({
            content: { title, body, data: { orderId: order.id, screen: 'buyer/orders' }, sound: 'default' },
            trigger: null,
          });
        }

        onUpdate(order);
      }
    });
  });
}
