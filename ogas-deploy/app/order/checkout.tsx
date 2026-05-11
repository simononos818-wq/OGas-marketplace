import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, 
Alert, Switch } from "react-native";
import { useOrder } from "../../contexts/OrderContext";
import { useAuth } from "../../contexts/AuthContext";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { FontAwesome } from "@expo/vector-icons";
import { usePaystack } from "../../hooks/usePaystack";

export default function CheckoutScreen() {
  const { cart, getCartTotal, placeOrder, clearCart } = useOrder();
  const { userData } = useAuth();
  const router = useRouter();
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState(userData?.phone || "");
  const [loading, setLoading] = useState(false);
  const [deliveryRequested, setDeliveryRequested] = useState(false);
  const { initializePayment, processing } = usePaystack();

  const sellerDeliveryAvailable = cart.some((item) => 
item.sellerDeliveryAvailable);
  const sellerDeliveryFee = cart.find((item) => 
item.sellerDeliveryAvailable)?.sellerDeliveryFee || 0;

  useEffect(() => {
    setDeliveryRequested(sellerDeliveryAvailable);
  }, [sellerDeliveryAvailable]);

  const subtotal = getCartTotal();
  const deliveryFee = deliveryRequested ? sellerDeliveryFee : 0;
  const total = subtotal + deliveryFee;

  const handlePayment = async () => {
    if (!phone) {
      Alert.alert("Error", "Please enter your phone number");
      return;
    }
    if (deliveryRequested && !address) {
      Alert.alert("Error", "Please enter a delivery address or disable delivery");
      return;
    }
    if (cart.length === 0) {
      Alert.alert("Error", "Your cart is empty");
      return;
    }

    setLoading(true);
    try {
      const orderId = await placeOrder({
        customerAddress: address,
        customerPhone: phone,
        deliveryRequested,
        deliveryFee,
      });

      await initializePayment(
        total,
        userData?.email || "customer@ogas.com",
        orderId,
        (reference) => {
          Alert.alert(
            "Payment Verified!",
            `Your order #${orderId.slice(-6).toUpperCase()} has been 
confirmed.`,
            [{ text: "OK", onPress: () => {
              clearCart();
              router.replace("/(tabs)/orders");
            }}]
          );
        },
        () => {
          Alert.alert("Payment Not Confirmed", "Your payment was not completed. You can try again.");
        }
      );
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <FontAwesome name="shopping-cart" size={64} color="#ccc" />
        <Text style={styles.emptyText}>Your cart is empty</Text>
        <TouchableOpacity style={styles.browseBtn} onPress={() => 
router.back()}>
          <Text style={styles.browseBtnText}>Browse Gas</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Checkout</Text>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Order Summary</Text>
        {cart.map((item, index) => (
          <View key={index} style={styles.cartItem}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemPrice}>N{(item.price * 
item.quantity).toLocaleString()}</Text>
          </View>
        ))}
        <View style={styles.divider} />
        <View style={styles.row}>
          <Text>Subtotal</Text>
          <Text>N{subtotal.toLocaleString()}</Text>
        </View>
        <View style={styles.row}>
          <Text>Delivery Fee</Text>
          <Text>N{deliveryFee.toLocaleString()}</Text>
        </View>
        <View style={[styles.row, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text 
style={styles.totalAmount}>N{total.toLocaleString()}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Delivery Details</Text>
        {sellerDeliveryAvailable ? (
          <View style={styles.deliveryRow}>
            <Text style={styles.label}>Request delivery</Text>
            <Switch value={deliveryRequested} 
onValueChange={setDeliveryRequested} trackColor={{ false: "#767577", true: 
"#FF6B35" }} thumbColor="#fff" />
          </View>
        ) : (
          <Text style={styles.infoText}>This seller only supports pickup 
orders.</Text>
        )}
        <Text style={styles.label}>Phone Number</Text>
        <TextInput style={styles.input} value={phone} 
onChangeText={setPhone} keyboardType="phone-pad" placeholder="Enter phone number" />
        <Text style={styles.label}>Delivery Address</Text>
        <TextInput style={[styles.input, styles.textArea]} value={address} 
onChangeText={setAddress} placeholder={sellerDeliveryAvailable ? "Enter full address" : "Pickup location optional"} multiline numberOfLines={3} 
editable={sellerDeliveryAvailable} />
      </View>

      <TouchableOpacity style={[styles.payButton, (loading || processing) 
&& styles.disabled]} onPress={handlePayment} disabled={loading || 
processing}>
        <Text style={styles.payButtonText}>{processing ? "Verifying Payment..." : loading ? "Processing..." : "Pay N" + 
total.toLocaleString()}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.cancelBtn} onPress={() => 
router.back()}>
        <Text style={styles.cancelText}>Cancel</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5", padding: 15 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 15, color: 
"#333" },
  section: { backgroundColor: "#fff", padding: 15, borderRadius: 12, 
marginBottom: 15 },
  sectionTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 15, 
color: "#333" },
  cartItem: { flexDirection: "row", justifyContent: "space-between", 
marginBottom: 10 },
  itemName: { color: "#333" },
  itemPrice: { fontWeight: "600", color: "#FF6B35" },
  divider: { height: 1, backgroundColor: "#f0f0f0", marginVertical: 10 },
  row: { flexDirection: "row", justifyContent: "space-between", 
marginBottom: 8 },
  totalRow: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, 
borderTopColor: "#f0f0f0" },
  totalLabel: { fontSize: 18, fontWeight: "bold", color: "#333" },
  totalAmount: { fontSize: 20, fontWeight: "bold", color: "#FF6B35" },
  label: { fontSize: 14, color: "#666", marginBottom: 8 },
  deliveryRow: { flexDirection: "row", justifyContent: "space-between", 
alignItems: "center", marginBottom: 14 },
  infoText: { fontSize: 14, color: "#666", marginBottom: 14 },
  input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 8, padding: 
12, marginBottom: 15, fontSize: 16, backgroundColor: "#fff" },
  textArea: { height: 80, textAlignVertical: "top" },
  payButton: { backgroundColor: "#FF6B35", padding: 18, borderRadius: 12, 
alignItems: "center", marginTop: 10 },
  disabled: { opacity: 0.7 },
  payButtonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  cancelBtn: { alignItems: "center", marginTop: 15, marginBottom: 30 },
  cancelText: { color: "#666" },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: 
"center", padding: 20 },
  emptyText: { fontSize: 18, color: "#666", marginTop: 20, marginBottom: 
30 },
  browseBtn: { backgroundColor: "#FF6B35", paddingHorizontal: 30, 
paddingVertical: 15, borderRadius: 10 },
  browseBtnText: { color: "#fff", fontWeight: "bold" },
});
