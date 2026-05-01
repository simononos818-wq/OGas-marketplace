import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../../config/firebase";
import { Ionicons } from "@expo/vector-icons";

export default function ExploreScreen() {
  const router = useRouter();
  const [sellers, setSellers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "users"), where("role", "==", "seller"));
    const unsub = onSnapshot(q, (snap) => {
      setSellers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, () => setLoading(false));
    return unsub;
  }, []);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#FF6B35" /></View>;

  if (sellers.length === 0) {
    return (
      <View style={styles.center}>
        <Ionicons name="storefront-outline" size={64} color="#ccc" />
        <Text style={styles.emptyTitle}>No sellers yet</Text>
        <Text style={styles.emptyText}>Be the first to register as a seller!</Text>
        <TouchableOpacity style={styles.btn} onPress={() => router.push("/auth/seller-register")}>
          <Text style={styles.btnText}>Register as Seller</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Find Sellers</Text>
      <FlatList
        data={sellers}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => router.push({ pathname: "/buyer/sellers", params: { sellerId: item.id } })}>
            <Text style={styles.sellerName}>{item.businessName || item.fullName || "Gas Seller"}</Text>
            <Text style={styles.sellerPhone}>{item.phone || "No phone"}</Text>
            <Text style={styles.sellerAddress}>{item.address || "Address not set"}</Text>
            {item.deliveryAvailable && <Text style={styles.deliveryBadge}>Delivery Available</Text>}
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
  sellerName: { fontSize: 18, fontWeight: "bold", color: "#333", marginBottom: 4 },
  sellerPhone: { fontSize: 14, color: "#666", marginBottom: 2 },
  sellerAddress: { fontSize: 14, color: "#888", marginBottom: 8 },
  deliveryBadge: { fontSize: 12, color: "#27ae60", fontWeight: "bold", backgroundColor: "#e8f5e9", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, alignSelf: "flex-start" },
  emptyTitle: { fontSize: 20, fontWeight: "bold", color: "#333", marginTop: 16, marginBottom: 8 },
  emptyText: { color: "#888", textAlign: "center", marginBottom: 28 },
  btn: { backgroundColor: "#FF6B35", paddingHorizontal: 32, paddingVertical: 14, borderRadius: 10 },
  btnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
