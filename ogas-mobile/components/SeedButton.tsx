import { TouchableOpacity, Text, StyleSheet, Alert } from "react-native";
import { seedSellers } from "@/lib/seedSellers";
import { Database } from "lucide-react-native";

export default function SeedButton() {
  const handleSeed = async () => {
    try {
      Alert.alert(
        "Seed Database",
        "This will add 8 mock sellers around Lagos. Continue?",
        [
          { text: "Cancel", style: "cancel" },
          { 
            text: "Seed", 
            onPress: async () => {
              await seedSellers();
              Alert.alert("Success", "Mock sellers added! Pull to refresh.");
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert("Error", "Failed to seed database");
    }
  };

  return (
    <TouchableOpacity style={styles.button} onPress={handleSeed}>
      <Database color="white" size={16} />
      <Text style={styles.text}>Seed Test Data</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: { backgroundColor: "#374151", flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  text: { color: "white", fontSize: 12 },
});
