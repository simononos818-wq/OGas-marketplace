import { useState } from "react";
import { View, Text, TouchableOpacity, Modal, StyleSheet } from "react-native";
import { Flame, AlertTriangle, MapPin } from "lucide-react-native";

export default function EmergencyButton() {
  const [visible, setVisible] = useState(false);

  const handleEmergency = () => {
    setVisible(false);
  };

  return (
    <>
      <TouchableOpacity style={styles.fab} onPress={() => setVisible(true)}>
        <Flame color="white" size={24} />
        <Text style={styles.fabText}>SOS</Text>
      </TouchableOpacity>

      <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={() => setVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <AlertTriangle color="#ef4444" size={48} />
            <Text style={styles.title}>Emergency Gas Delivery</Text>
            <Text style={styles.description}>Running out of gas? We will find the nearest seller immediately.</Text>
            
            <View style={styles.infoBox}>
              <MapPin color="#f97316" size={20} />
              <Text style={styles.infoText}>Auto-detecting your location...</Text>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setVisible(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.emergencyBtn} onPress={handleEmergency}>
                <Text style={styles.emergencyText}>GET GAS NOW</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fab: { position: "absolute", bottom: 100, right: 20, backgroundColor: "#dc2626", padding: 16, borderRadius: 50, flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 2, borderColor: "#fbbf24", zIndex: 999, elevation: 8 },
  fabText: { color: "white", fontWeight: "bold", fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.9)", justifyContent: "center", alignItems: "center", padding: 20 },
  modalContent: { backgroundColor: "#111827", borderRadius: 20, padding: 24, width: "100%", borderWidth: 1, borderColor: "rgba(249,115,22,0.3)", alignItems: "center" },
  title: { color: "white", fontSize: 24, fontWeight: "bold", marginTop: 16, marginBottom: 8 },
  description: { color: "#9ca3af", textAlign: "center", marginBottom: 20 },
  infoBox: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(249,115,22,0.1)", padding: 12, borderRadius: 12, width: "100%", gap: 8, marginBottom: 20 },
  infoText: { color: "#fb923c", fontSize: 14 },
  buttonRow: { flexDirection: "row", gap: 12, width: "100%" },
  cancelBtn: { flex: 1, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: "#4b5563", alignItems: "center" },
  cancelText: { color: "#9ca3af", fontWeight: "600" },
  emergencyBtn: { flex: 1, backgroundColor: "#dc2626", padding: 16, borderRadius: 12, alignItems: "center" },
  emergencyText: { color: "white", fontWeight: "bold" },
});
