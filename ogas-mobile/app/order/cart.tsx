import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { useOrder } from "@/contexts/OrderContext";
import { Flame, Trash2, MapPin } from "lucide-react-native";
import { useRouter } from "expo-router";

export default function CartScreen() {
  const { cart, removeFromCart, cartTotal } = useOrder();
  const router = useRouter();

  if (cart.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Cart</Text>
        </View>
        <View style={styles.emptyState}>
          <Flame color="#374151" size={64} />
          <Text style={styles.emptyText}>Your cart is empty</Text>
          <TouchableOpacity style={styles.browseBtn} onPress={() => router.push("/")}>
            <Text style={styles.browseBtnText}>Browse Gas</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Cart ({cart.length})</Text>
      </View>
      
      <ScrollView style={styles.content}>
        {cart.map((item, index) => (
          <View key={index} style={styles.cartItem}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemSize}>{item.size}</Text>
              <Text style={styles.itemSeller}>{item.sellerName}</Text>
              <Text style={styles.itemPrice}>₦{item.price.toLocaleString()} × {item.quantity}</Text>
            </View>
            <TouchableOpacity onPress={() => removeFromCart(index)} style={styles.deleteBtn}>
              <Trash2 color="#ef4444" size={20} />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalPrice}>₦{cartTotal.toLocaleString()}</Text>
        </View>
        <TouchableOpacity 
          style={styles.checkoutBtn}
          onPress={() => router.push("/order/checkout")}
        >
          <Text style={styles.checkoutBtnText}>Proceed to Checkout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "black" },
  header: { padding: 16, paddingTop: 48, borderBottomWidth: 1, borderBottomColor: "#374151" },
  headerTitle: { color: "white", fontSize: 24, fontWeight: "bold" },
  emptyState: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32 },
  emptyText: { color: "#6b7280", fontSize: 18, marginTop: 16 },
  browseBtn: { backgroundColor: "#f97316", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24, marginTop: 16 },
  browseBtnText: { color: "white", fontWeight: "bold" },
  content: { padding: 16 },
  cartItem: { backgroundColor: "#111827", borderRadius: 12, padding: 16, marginBottom: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderWidth: 1, borderColor: "#374151" },
  itemInfo: { flex: 1 },
  itemSize: { color: "white", fontSize: 18, fontWeight: "bold" },
  itemSeller: { color: "#9ca3af", fontSize: 14, marginTop: 2 },
  itemPrice: { color: "#f97316", fontSize: 16, fontWeight: "600", marginTop: 4 },
  deleteBtn: { backgroundColor: "rgba(239,68,68,0.1)", padding: 8, borderRadius: 8 },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: "#374151" },
  totalRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
  totalLabel: { color: "#9ca3af", fontSize: 18 },
  totalPrice: { color: "white", fontSize: 24, fontWeight: "bold" },
  checkoutBtn: { backgroundColor: "#f97316", padding: 16, borderRadius: 12, alignItems: "center" },
  checkoutBtnText: { color: "white", fontWeight: "bold", fontSize: 16 },
});
