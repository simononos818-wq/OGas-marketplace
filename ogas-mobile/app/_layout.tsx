import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../contexts/AuthContext';
import { OrderProvider } from '../contexts/OrderContext';
import { ChatProvider } from '../contexts/ChatContext';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <OrderProvider>
          <ChatProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="(app)" />
              <Stack.Screen name="auth/index" />
              <Stack.Screen name="auth/login" />
              <Stack.Screen name="auth/register" />
              <Stack.Screen name="auth/seller-register" />
              <Stack.Screen name="order/cart" />
              <Stack.Screen name="order/checkout" />
              <Stack.Screen name="order/tracking" />
              <Stack.Screen name="seller/index" />
              <Stack.Screen name="seller/lpg-calculator" />
              <Stack.Screen name="chat/[id]" options={{ presentation: 'modal' }} />
              <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
              <Stack.Screen name="terms" />
              <Stack.Screen name="download" />
              <Stack.Screen name="+not-found" />
            </Stack>
            <StatusBar style="auto" />
          </ChatProvider>
        </OrderProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
