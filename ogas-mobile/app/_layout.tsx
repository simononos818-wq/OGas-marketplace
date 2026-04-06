import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import { OrderProvider } from "@/contexts/OrderContext";
import EmergencyButton from "@/components/EmergencyButton";

export default function RootLayout() {
  return (
    <OrderProvider>
      <View style={{ flex: 1 }}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="order/cart" options={{ headerShown: false }} />
          <Stack.Screen name="order/checkout" options={{ headerShown: false }} />
          <Stack.Screen name="order/tracking" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="auto" />
        <EmergencyButton />
      </View>
    </OrderProvider>
  );
}
