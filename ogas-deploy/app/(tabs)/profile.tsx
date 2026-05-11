import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { useRouter } from "expo-router";

export default function ProfileScreen() {
  const { user, userData, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: async () => { await logout(); router.replace("/auth/login"); } }
    ]);
  };

  if (!user) return (
    <View style={styles.center}>
      <Text style={styles.guestIcon}>👤</Text>
      <Text style={styles.guestTitle}>You're not signed in</Text>
      <Text style={styles.guestSub}>Sign in to manage orders, track deliveries, and more</Text>
      <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push("/auth/login")}>
        <Text style={styles.primaryBtnText}>Sign In</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.push("/auth/register")}>
        <Text style={styles.secondaryBtnText}>Create Buyer Account</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.push("/auth/seller-register")}>
        <Text style={styles.sellerLink}>Register as Gas Seller →</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(userData?.fullName || userData?.businessName || "U")[0].toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{userData?.fullName || userData?.businessName || user.email}</Text>
        <Text style={styles.role}>{userData?.role === "seller" ? "🏪 Gas Seller" : "🛒 Buyer"}</Text>
        {userData?.phone && <Text style={styles.phone}>📞 {userData.phone}</Text>}
      </View>

      {userData?.role === "seller" && (
        <TouchableOpacity style={styles.dashboardBtn} onPress={() => router.push("/(app)/seller/dashboard")}>
          <Text style={styles.dashboardText}>📊 Go to Seller Dashboard</Text>
        </TouchableOpacity>
      )}

      <View style={styles.menu}>
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/(tabs)/orders")}>
          <Text style={styles.menuIcon}>📦</Text>
          <Text style={styles.menuLabel}>My Orders</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/lpg-calculator")}>
          <Text style={styles.menuIcon}>🧮</Text>
          <Text style={styles.menuLabel}>LPG Calculator</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/terms")}>
          <Text style={styles.menuIcon}>📄</Text>
          <Text style={styles.menuLabel}>Terms & Conditions</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 30, backgroundColor: "#fff" },
  guestIcon: { fontSize: 60, marginBottom: 16 },
  guestTitle: { fontSize: 22, fontWeight: "bold", color: "#333", marginBottom: 8 },
  guestSub: { color: "#888", textAlign: "center", marginBottom: 32, lineHeight: 22 },
  primaryBtn: { backgroundColor: "#FF6B35", padding: 16, borderRadius: 12, width: "100%", alignItems: "center", marginBottom: 14 },
  primaryBtnText: { color: "#fff", fontWeight: "bold", fontSize: 17 },
  secondaryBtn: { borderWidth: 2, borderColor: "#FF6B35", padding: 16, borderRadius: 12, width: "100%", alignItems: "center", marginBottom: 20 },
  secondaryBtnText: { color: "#FF6B35", fontWeight: "bold", fontSize: 17 },
  sellerLink: { color: "#1a7a4a", fontWeight: "600", fontSize: 15 },
  header: { backgroundColor: "#FF6B35", padding: 30, alignItems: "center", paddingTop: 70 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: "rgba(255,255,255,0.3)", justifyContent: "center", alignItems: "center", marginBottom: 12 },
  avatarText: { fontSize: 32, fontWeight: "bold", color: "#fff" },
  name: { fontSize: 22, fontWeight: "bold", color: "#fff" },
  role: { color: "rgba(255,255,255,0.85)", marginTop: 4, fontSize: 15 },
  phone: { color: "rgba(255,255,255,0.75)", marginTop: 4, fontSize: 14 },
  dashboardBtn: { backgroundColor: "#1a7a4a", margin: 16, padding: 16, borderRadius: 12, alignItems: "center" },
  dashboardText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  menu: { backgroundColor: "#fff", margin: 16, borderRadius: 12, overflow: "hidden" },
  menuItem: { flexDirection: "row", alignItems: "center", padding: 16, borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  menuIcon: { fontSize: 20, width: 32 },
  menuLabel: { flex: 1, fontSize: 16, color: "#333" },
  menuArrow: { color: "#ccc", fontSize: 22 },
  logoutBtn: { margin: 16, marginTop: 8, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: "#ffccbb", alignItems: "center" },
  logoutText: { color: "#FF6B35", fontWeight: "bold", fontSize: 16 },
});
