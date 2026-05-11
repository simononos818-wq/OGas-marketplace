import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../../config/firebase";

export default function OrdersScreen() {
  const auth = useAuth(); const user = auth?.user;
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const q = query(collection(db, "orders"), where("userId", "==", user.uid), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, () => setLoading(false));
    return unsub;
  }, [user]);

  if (!user) return (
    <View style={styles.center}>
      <Text style={styles.emptyTitle}>Sign in to see your orders</Text>
      <TouchableOpacity style={styles.btn} onPress={() => router.push("/auth/login")}>
        <Text style={styles.btnText}>Sign In</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#FF6B35" /></View>;

  if (orders.length === 0) return (
    <View style={styles.center}>
      <Text style={styles.emptyIcon}>📦</Text>
      <Text style={styles.emptyTitle}>No orders yet</Text>
      <Text style={styles.emptyText}>Browse sellers and place your first gas order</Text>
      <TouchableOpacity style={styles.btn} onPress={() => router.push("/(tabs)/explore")}>
        <Text style={styles.btnText}>Find Sellers</Text>
      </TouchableOpacity>
    </View>
  );

  const statusColor = (s: string) => s === "delivered" ? "#1a7a4a" : s === "cancelled" ? "#e53935" : "#FF6B35";

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Orders</Text>
      <FlatList
        data={orders}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => router.push({ pathname: "/order/tracking", params: { orderId: item.id } })}>
            <View style={styles.cardRow}>
              <Text style={styles.orderId}>Order #{item.id.slice(-6).toUpperCase()}</Text>
              <Text style={[styles.status, { color: statusColor(item.status) }]}>{(item.status || "pending").toUpperCase()}</Text>
            </View>
            <Text style={styles.seller}>{item.sellerName || "Gas Seller"}</Text>
            <View style={styles.cardRow}>
              <Text style={styles.amount}>N{(item.total || 0).toLocaleString()}</Text>
              <Text style={styles.date}>{item.createdAt?.toDate?.().toLocaleDateString?.() || ""}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5", padding: 16, paddingTop: 60 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 30 },
  title: { fontSize: 26, fontWeight: "bold", color: "#222", marginBottom: 20 },
  card: { backgroundColor: "#fff", borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  cardRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  orderId: { fontWeight: "bold", color: "#333", fontSize: 15 },
  status: { fontWeight: "bold", fontSize: 12 },
  seller: { color: "#666", marginBottom: 6 },
  amount: { fontWeight: "bold", color: "#FF6B35", fontSize: 16 },
  date: { color: "#aaa", fontSize: 13 },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: "bold", color: "#333", marginBottom: 8 },
  emptyText: { color: "#888", textAlign: "center", marginBottom: 28, lineHeight: 22 },
  btn: { backgroundColor: "#FF6B35", paddingHorizontal: 32, paddingVertical: 14, borderRadius: 10 },
  btnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
