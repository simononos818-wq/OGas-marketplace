import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

export default function AuthIndex() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <Text style={styles.logo}>🔥 OGas</Text>
      <Text style={styles.tagline}>Nigeria's #1 LPG Marketplace</Text>
      <Text style={styles.sub}>Order cooking gas from verified sellers near you</Text>
      <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push("/auth/login")}>
        <Text style={styles.primaryText}>Sign In</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.push("/auth/register")}>
        <Text style={styles.secondaryText}>Create Buyer Account</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.sellerBtn} onPress={() => router.push("/auth/seller-register")}>
        <Text style={styles.sellerText}>Register as Gas Seller →</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 30, backgroundColor: "#fff" },
  logo: { fontSize: 52, fontWeight: "bold", color: "#FF6B35" },
  tagline: { fontSize: 18, fontWeight: "600", color: "#222", marginTop: 8 },
  sub: { fontSize: 14, color: "#888", textAlign: "center", marginTop: 10, marginBottom: 40, lineHeight: 22 },
  primaryBtn: { backgroundColor: "#FF6B35", padding: 16, borderRadius: 12, width: "100%", alignItems: "center", marginBottom: 14 },
  primaryText: { color: "#fff", fontWeight: "bold", fontSize: 17 },
  secondaryBtn: { borderWidth: 2, borderColor: "#FF6B35", padding: 16, borderRadius: 12, width: "100%", alignItems: "center", marginBottom: 20 },
  secondaryText: { color: "#FF6B35", fontWeight: "bold", fontSize: 17 },
  sellerBtn: { marginTop: 10 },
  sellerText: { color: "#1a7a4a", fontWeight: "600", fontSize: 15 },
});
