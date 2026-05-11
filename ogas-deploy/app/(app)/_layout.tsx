import { Stack, useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';

export default function AppLayout() {
  const { user, initialized } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (initialized && !user) {
      router.replace('/auth/login');
    }
  }, [user, initialized]);

  if (!initialized) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color="#FF6B35" /></View>;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="buyer/order" />
      <Stack.Screen name="buyer/orders" />
      <Stack.Screen name="buyer/sellers" />
      <Stack.Screen name="seller/dashboard" />
    </Stack>
  );
}
