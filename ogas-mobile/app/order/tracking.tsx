import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from "react-native";
import { useOrder } from "@/contexts/OrderContext";
import { useEffect } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MapPin, Phone, Package, CheckCircle, Truck, Navigation } from "lucide-react-native";
import MapView, { Marker, Polyline } from "react-native-maps";

const { width, height } = Dimensions.get("window");

const STATUS_STEPS = [
  { key: "pending", label: "Order Placed", icon: Package },
  { key: "accepted", label: "Driver Assigned", icon: Truck },
  { key: "picked_up", label: "Picked Up", icon: Navigation },
  { key: "delivered", label: "Delivered", icon: CheckCircle },
];

export default function TrackingScreen() {
  const { id } = useLocalSearchParams();
  const { activeOrder, trackOrder, stopTracking } = useOrder();
  const router = useRouter();

  useEffect(() => {
    if (id) trackOrder(id as string);
    return () => stopTracking();
  }, [id]);

  if (!activeOrder) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading order...</Text>
      </View>
    );
  }

  const currentStepIndex = STATUS_STEPS.findIndex(s => s.key === activeOrder.status);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Order #{id?.toString().slice(-6)}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(activeOrder.status) }]}>
          <Text style={styles.statusText}>{activeOrder.status.replace("_", " ").toUpperCase()}</Text>
        </View>
      </View>

      <MapView
        style={styles.map}
        initialRegion={{
          latitude: activeOrder.location.lat,
          longitude: activeOrder.location.lng,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        <Marker
          coordinate={{
            latitude: activeOrder.location.lat,
            longitude: activeOrder.location.lng,
          }}
          title="Delivery Location"
        >
          <View style={styles.markerContainer}>
            <MapPin color="#f97316" size={32} />
          </View>
        </Marker>
      </MapView>

      <View style={styles.trackingCard}>
        <Text style={styles.etaText}>Estimated arrival: 15-25 mins</Text>
        
        <View style={styles.stepsContainer}>
          {STATUS_STEPS.map((step, index) => {
            const Icon = step.icon;
            const isActive = index <= currentStepIndex;
            const isCurrent = index === currentStepIndex;
            
            return (
              <View key={step.key} style={styles.step}>
                <View style={[styles.stepIcon, isActive && styles.stepIconActive, isCurrent && styles.stepIconCurrent]}>
                  <Icon color={isActive ? "white" : "#6b7280"} size={20} />
                </View>
                <Text style={[styles.stepLabel, isActive && styles.stepLabelActive]}>{step.label}</Text>
                {index < STATUS_STEPS.length - 1 && (
                  <View style={[styles.stepLine, index < currentStepIndex && styles.stepLineActive]} />
                )}
              </View>
            );
          })}
        </View>

        <View style={styles.driverCard}>
          <View style={styles.driverInfo}>
            <Text style={styles.driverLabel}>Your Driver</Text>
            <Text style={styles.driverName}>John Doe</Text>
            <Text style={styles.driverVehicle}>Toyota Camry • ABC-123-GJ</Text>
          </View>
          <TouchableOpacity style={styles.callBtn}>
            <Phone color="white" size={20} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    pending: "#fbbf24",
    accepted: "#3b82f6",
    picked_up: "#f97316",
    delivered: "#22c55e",
    cancelled: "#ef4444",
  };
  return colors[status] || "#6b7280";
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "black" },
  header: { padding: 16, paddingTop: 48, flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#111827" },
  headerTitle: { color: "white", fontSize: 20, fontWeight: "bold" },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  statusText: { color: "white", fontWeight: "bold", fontSize: 12 },
  loadingText: { color: "white", textAlign: "center", marginTop: 100 },
  map: { width, height: height * 0.4 },
  markerContainer: { backgroundColor: "white", borderRadius: 20, padding: 4 },
  trackingCard: { backgroundColor: "#111827", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, marginTop: -20, flex: 1 },
  etaText: { color: "#fbbf24", fontSize: 18, fontWeight: "600", marginBottom: 20 },
  stepsContainer: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
  step: { alignItems: "center", flex: 1 },
  stepIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#374151", justifyContent: "center", alignItems: "center", marginBottom: 8 },
  stepIconActive: { backgroundColor: "#22c55e" },
  stepIconCurrent: { backgroundColor: "#f97316" },
  stepLabel: { color: "#6b7280", fontSize: 10, textAlign: "center" },
  stepLabelActive: { color: "white" },
  stepLine: { position: "absolute", top: 20, right: -50, width: 100, height: 2, backgroundColor: "#374151" },
  stepLineActive: { backgroundColor: "#22c55e" },
  driverCard: { backgroundColor: "#1f2937", borderRadius: 16, padding: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderWidth: 1, borderColor: "#374151" },
  driverInfo: { flex: 1 },
  driverLabel: { color: "#9ca3af", fontSize: 12 },
  driverName: { color: "white", fontSize: 18, fontWeight: "bold", marginTop: 4 },
  driverVehicle: { color: "#6b7280", fontSize: 14, marginTop: 2 },
  callBtn: { backgroundColor: "#22c55e", width: 48, height: 48, borderRadius: 24, justifyContent: "center", alignItems: "center" },
});
