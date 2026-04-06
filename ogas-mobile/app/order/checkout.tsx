import { View, Text, TouchableOpacity, StyleSheet, TextInput, Alert } from "react-native";
import { useOrder } from "@/contexts/OrderContext";
import { MapPin, CreditCard, Truck } from "lucide-react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import * as Location from "expo-location";

export default function CheckoutScreen() {
  const { cart, cartTotal, createOrder } = useOrder();
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handlePlaceOrder = async () => {
    if (!address.trim()) {
      Alert.alert("Error", "Please enter delivery address");
      return;
    }

    setLoading(true);
    try {
      let location = await Location.getCurrentPositionAsync({});
      const orderId = await createOrder(address, {
        lat: location.coords.latitude,
        lng: location.coords.longitude
      });
      
      Alert.alert(
        "Order Placed!",
        "Your gas order has been placed. Track it in real-time.",
        [
          { 
            text: "Track Order", 
            onPress: () => router.push(`/order/tracking?id=${orderId}`) 
          }
        ]
      );
    } catch (error) {
      Alert.alert("Error", "Failed to place order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Checkout</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Address</Text>
          <View style={styles.inputContainer}>
            <MapPin color="#f97316" size={20} />
            <TextInput
              style={styles.input}
              placeholder="Enter your address"
              placeholderTextColor="#6b7280"
              value={address}
              onChangeText={setAddress}
              multiline
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          {cart.map((item, idx) => (
            <View key={idx} style={styles.summaryRow}>
              <Text style={styles.summaryText}>{item.size} × {item.quantity}</Text>
              <Text style={styles.summaryPrice}>₦{(item.price * item.quantity).toLocaleString()}</Text>
            </View>
          ))}
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalText}>Total</Text>
            <Text style={styles.totalAmount}>₦{cartTotal.toLocaleString()}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <TouchableOpacity style={styles.paymentOption}>
            <CreditCard color="#f97316" size={24} />
            <Text style={styles.paymentText}>Pay on Delivery</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.placeOrderBtn, loading && styles.disabledBtn]}
          onPress={handlePlaceOrder}
          disabled={loading}
        >
          <Truck color="white" size={20} />
          <Text style={styles.placeOrderText}>
            {loading ? "Placing Order..." : "Place Order"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "black" },
  header: { padding: 16, paddingTop: 48, borderBottomWidth: 1, borderBottomColor: "#374151" },
  headerTitle: { color: "white", fontSize: 24, fontWeight: "bold" },
  content: { padding: 16, flex: 1 },
  section: { marginBottom: 24 },
  sectionTitle: { color: "#9ca3af", fontSize: 14, marginBottom: 12, textTransform: "uppercase" },
  inputContainer: { backgroundColor: "#111827", borderRadius: 12, padding: 16, flexDirection: "row", alignItems: "flex-start", gap: 12, borderWidth: 1, borderColor: "#374151" },
  input: { color: "white", fontSize: 16, flex: 1, minHeight: 60, textAlignVertical: "top" },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  summaryText: { color: "#d1d5db", fontSize: 16 },
  summaryPrice: { color: "white", fontSize: 16 },
  totalRow: { borderTopWidth: 1, borderTopColor: "#374151", paddingTop: 12, marginTop: 12 },
  totalText: { color: "white", fontSize: 18, fontWeight: "bold" },
  totalAmount: { color: "#f97316", fontSize: 20, fontWeight: "bold" },
  paymentOption: { backgroundColor: "#111827", borderRadius: 12, padding: 16, flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderColor: "#374151" },
  paymentText: { color: "white", fontSize: 16 },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: "#374151" },
  placeOrderBtn: { backgroundColor: "#f97316", padding: 16, borderRadius: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  disabledBtn: { opacity: 0.7 },
  placeOrderText: { color: "white", fontWeight: "bold", fontSize: 16 },
});
