import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Switch, Alert } from "react-native";
import { useAuth } from "../../../contexts/AuthContext";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db } from "../../../config/firebase";

export default function SellerDashboard() {
  const { user, userData, logout } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    if (!user) { router.replace("/auth/login"); return; }
    const q = query(collection(db, "orders"), where("sellerId", "==", user.uid), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, () => setLoading(false));
    return unsub;
  }, [user]);

  const toggleStore = async (val: boolean) => {
    setIsOpen(val);
    if (user) {
      try { await updateDoc(doc(db, "users", user.uid), { isOpen: val }); } catch (e) {}
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      await updateDoc(doc(db, "orders", orderId), { status });
      Alert.alert("Updated", `Order marked as ${status}`);
    } catch (e) {
      Alert.alert("Error", "Could not update order");
    }
  };

  const pending = orders.filter(o => o.status === "pending" || o.status === "confirmed");
  const completed = orders.filter(o => o.status === "delivered");
  const revenue = completed.reduce((sum, o) => sum + (o.total || 0), 0);

  const statusColor = (s: string) => s === "delivered" ? "#1a7a4a" : s === "cancelled" ? "#e53935" : "#FF6B35";

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#FF6B35" /></View>;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {userData?.businessName || userData?.fullName || "Seller"} 👋</Text>
          <Text style={styles.subGreeting}>{userData?.address || "Your store"}</Text>
        </View>
        <TouchableOpacity onPress={() => { logout(); router.replace("/auth/login"); }}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.storeToggle}>
        <View>
          <Text style={styles.storeLabel}>Store Status</Text>
          <Text style={{ color: isOpen ? "#1a7a4a" : "#e53935", fontWeight: "600" }}>{isOpen ? "🟢 Open — accepting orders" : "🔴 Closed"}</Text>
        </View>
        <Switch value={isOpen} onValueChange={toggleStore} trackColor={{ false: "#ddd", true: "#1a7a4a" }} thumbColor="#fff" />
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{pending.length}</Text>
          <Text style={styles.statLabel}>Pending Orders</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{completed.length}</Text>
          <Text style={styles.statLabel}>Delivered</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNum, { color: "#1a7a4a" }]}>₦{(revenue / 1000).toFixed(0)}k</Text>
          <Text style={styles.statLabel}>Revenue</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Incoming Orders</Text>
      {pending.length === 0 ? (
        <View style={styles.emptyCard}><Text style={styles.emptyText}>No pending orders right now</Text></View>
      ) : pending.map(order => (
        <View key={order.id} style={styles.orderCard}>
          <View style={styles.orderHeader}>
            <Text style={styles.orderId}>#{order.id.slice(-6).toUpperCase()}</Text>
            <Text style={[styles.orderStatus, { color: statusColor(order.status) }]}>{(order.status || "pending").toUpperCase()}</Text>
          </View>
          <Text style={styles.orderDetail}>📍 {order.customerAddress || "Pickup"}</Text>
          <Text style={styles.orderDetail}>📞 {order.customerPhone || "-"}</Text>
          <Text style={styles.orderAmount}>₦{(order.total || 0).toLocaleString()}</Text>
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.confirmBtn} onPress={() => updateOrderStatus(order.id, "confirmed")}>
              <Text style={styles.actionText}>Confirm</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deliverBtn} onPress={() => updateOrderStatus(order.id, "delivered")}>
              <Text style={styles.actionText}>Mark Delivered</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => updateOrderStatus(order.id, "cancelled")}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      <Text style={styles.sectionTitle}>Recent History</Text>
      {completed.slice(0, 5).map(order => (
        <View key={order.id} style={[styles.orderCard, { opacity: 0.7 }]}>
          <View style={styles.orderHeader}>
            <Text style={styles.orderId}>#{order.id.slice(-6).toUpperCase()}</Text>
            <Text style={[styles.orderStatus, { color: "#1a7a4a" }]}>DELIVERED</Text>
          </View>
          <Text style={styles.orderAmount}>₦{(order.total || 0).toLocaleString()}</Text>
        </View>
      ))}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", padding: 20, paddingTop: 60, backgroundColor: "#FF6B35" },
  greeting: { fontSize: 20, fontWeight: "bold", color: "#fff" },
  subGreeting: { color: "rgba(255,255,255,0.8)", fontSize: 13, marginTop: 2 },
  logoutText: { color: "#fff", fontSize: 14, opacity: 0.9 },
  storeToggle: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#fff", margin: 16, padding: 16, borderRadius: 12, elevation: 2 },
  storeLabel: { fontWeight: "bold", color: "#333", fontSize: 15, marginBottom: 4 },
  statsRow: { flexDirection: "row", paddingHorizontal: 16, gap: 10, marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: "#fff", borderRadius: 12, padding: 14, alignItems: "center", elevation: 2 },
  statNum: { fontSize: 22, fontWeight: "bold", color: "#FF6B35" },
  statLabel: { fontSize: 11, color: "#888", marginTop: 4, textAlign: "center" },
  sectionTitle: { fontSize: 17, fontWeight: "bold", color: "#333", paddingHorizontal: 16, marginBottom: 10 },
  orderCard: { backgroundColor: "#fff", marginHorizontal: 16, marginBottom: 12, borderRadius: 12, padding: 16, elevation: 2 },
  orderHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  orderId: { fontWeight: "bold", color: "#333" },
  orderStatus: { fontWeight: "bold", fontSize: 12 },
  orderDetail: { color: "#666", fontSize: 14, marginBottom: 4 },
  orderAmount: { fontWeight: "bold", color: "#FF6B35", fontSize: 17, marginTop: 6, marginBottom: 12 },
  actionRow: { flexDirection: "row", gap: 8 },
  confirmBtn: { flex: 1, backgroundColor: "#FF6B35", padding: 10, borderRadius: 8, alignItems: "center" },
  deliverBtn: { flex: 1, backgroundColor: "#1a7a4a", padding: 10, borderRadius: 8, alignItems: "center" },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: "#ddd", padding: 10, borderRadius: 8, alignItems: "center" },
  actionText: { color: "#fff", fontWeight: "600", fontSize: 13 },
  cancelText: { color: "#888", fontWeight: "600", fontSize: 13 },
  emptyCard: { backgroundColor: "#fff", margin: 16, padding: 30, borderRadius: 12, alignItems: "center" },
  emptyText: { color: "#aaa", fontSize: 15 },
});
