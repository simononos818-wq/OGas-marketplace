import { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { Flame, MapPin, Phone, CheckCircle, XCircle, Navigation } from "lucide-react-native";

export default function SellerMobileScreen() {
  const [activeOrder, setActiveOrder] = useState<string | null>("ORD123");
  const [status, setStatus] = useState<"idle" | "pickup" | "delivery">("idle");

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.logoRow}>
            <Flame color="white" size={32} />
            <Text style={styles.logoText}>OGas Driver</Text>
          </View>
          <View style={styles.onlineBadge}>
            <Text style={styles.onlineText}>● Online</Text>
          </View>
        </View>
        
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Today is Earnings</Text>
            <Text style={styles.statValue}>₦24,500</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Completed</Text>
            <Text style={styles.statValue}>8 deliveries</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {!activeOrder ? (
          <View style={styles.waitingContainer}>
            <View style={styles.spinner} />
            <Text style={styles.waitingText}>Waiting for orders...</Text>
            <Text style={styles.waitingSubtext}>Stay in high-demand areas</Text>
          </View>
        ) : (
          <View style={styles.orderCard}>
            <View style={styles.orderHeader}>
              <View>
                <Text style={styles.orderId}>Order #{activeOrder.slice(-4)}</Text>
                <Text style={styles.orderDetails}>12.5kg Gas × 1</Text>
              </View>
              <View style={styles.priceBadge}>
                <Text style={styles.priceText}>₦9,500</Text>
              </View>
            </View>

            <View style={styles.customerInfo}>
              <View style={styles.infoRow}>
                <MapPin size={16} color="#f97316" />
                <Text style={styles.infoText}>123 Admiralty Way, Lekki</Text>
              </View>
              <View style={styles.infoRow}>
                <Phone size={16} color="#22c55e" />
                <Text style={styles.infoText}>+234 801 234 5678</Text>
              </View>
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.navigateBtn}>
                <Navigation size={20} color="#d1d5db" />
                <Text style={styles.navigateText}>Navigate</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.deliverBtn}
                onPress={() => setStatus(status === "idle" ? "pickup" : "delivery")}
              >
                <CheckCircle size={20} color="white" />
                <Text style={styles.deliverText}>
                  {status === "idle" ? "Picked Up" : "Delivered"}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.secondaryActions}>
              <TouchableOpacity style={styles.cancelBtn}>
                <XCircle size={20} color="#ef4444" />
                <Text style={styles.cancelText}>Cannot Deliver</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.supportBtn}>
                <Phone size={20} color="#3b82f6" />
                <Text style={styles.supportText}>Call Support</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "black" },
  header: { backgroundColor: "#f97316", padding: 16, paddingBottom: 24 },
  headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  logoRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  logoText: { color: "white", fontWeight: "bold", fontSize: 20 },
  onlineBadge: { backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  onlineText: { color: "white", fontWeight: "600" },
  statsRow: { flexDirection: "row", gap: 12, marginTop: 16 },
  statBox: { flex: 1, backgroundColor: "rgba(0,0,0,0.3)", borderRadius: 12, padding: 12 },
  statLabel: { color: "#fde047", fontSize: 12 },
  statValue: { color: "white", fontSize: 20, fontWeight: "bold", marginTop: 4 },
  content: { padding: 16 },
  waitingContainer: { alignItems: "center", paddingVertical: 48 },
  spinner: { width: 48, height: 48, borderRadius: 24, borderWidth: 4, borderColor: "#f97316", borderTopColor: "transparent" },
  waitingText: { color: "#d1d5db", fontSize: 18, fontWeight: "600", marginTop: 16 },
  waitingSubtext: { color: "#6b7280", marginTop: 8 },
  orderCard: { backgroundColor: "#111827", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "rgba(249,115,22,0.3)" },
  orderHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
  orderId: { color: "#fb923c", fontWeight: "600" },
  orderDetails: { color: "white", fontSize: 20, fontWeight: "bold", marginTop: 4 },
  priceBadge: { backgroundColor: "rgba(34,197,94,0.2)", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  priceText: { color: "#4ade80", fontWeight: "600" },
  customerInfo: { backgroundColor: "rgba(31,41,55,0.5)", borderRadius: 12, padding: 12, marginBottom: 16 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  infoText: { color: "#d1d5db", fontSize: 14 },
  actionRow: { flexDirection: "row", gap: 12, marginBottom: 12 },
  navigateBtn: { flex: 1, backgroundColor: "#374151", padding: 16, borderRadius: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  navigateText: { color: "#d1d5db", fontWeight: "600" },
  deliverBtn: { flex: 1, backgroundColor: "#f97316", padding: 16, borderRadius: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  deliverText: { color: "white", fontWeight: "bold" },
  secondaryActions: { flexDirection: "row", gap: 12 },
  cancelBtn: { flex: 1, backgroundColor: "#111827", padding: 12, borderRadius: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderWidth: 1, borderColor: "rgba(239,68,68,0.3)" },
  cancelText: { color: "#ef4444", fontWeight: "600" },
  supportBtn: { flex: 1, backgroundColor: "#111827", padding: 12, borderRadius: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderWidth: 1, borderColor: "rgba(59,130,246,0.3)" },
  supportText: { color: "#3b82f6", fontWeight: "600" },
});
