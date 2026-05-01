import { ScrollView, StyleSheet, View, Text } from "react-native";
import { useSearchParams } from "expo-router/build/hooks";
import { useAuth } from "../../contexts/AuthContext";
import LpgSmartCalculator from "../../components/LpgSmartCalculator";

export default function SellerLpgCalculatorScreen() {
  const { userData } = useAuth();
  const params = useSearchParams();

  const size = params.get("size") ?? undefined;
  const price = params.get("price") ?? undefined;
  const deliveryAvailable = params.get("deliveryAvailable") ?? undefined;
  const deliveryFee = params.get("deliveryFee") ?? undefined;

  const parsedSize = Number(size) || 12.5;
  const parsedPrice = Number(price) || 820;
  const parsedDeliveryAvailable = String(deliveryAvailable) === "1";
  const parsedDeliveryFee = Number(deliveryFee) || 500;

  return (
    <ScrollView contentContainerStyle={styles.screen} keyboardShouldPersistTaps="handled">
      <View style={styles.hero}>
        <Text style={styles.pageTitle}>Vendor LPG Calculator</Text>
        <Text style={styles.pageSubtitle}>
          {userData?.businessName ? `Manage pricing and delivery options for ${userData.businessName}.` : "Calculate cylinder cost and stock recommendations."}
        </Text>
      </View>

      <LpgSmartCalculator
        defaultPricePerKg={parsedPrice}
        defaultDeliveryFee={parsedDeliveryFee}
        defaultSize={parsedSize}
        sellerId={String(userData?.uid || "")}
        sellerName={userData?.businessName || "Seller"}
        deliveryAvailable={parsedDeliveryAvailable}
        deliveryFee={parsedDeliveryFee}
        prefillPricePerCylinder={parsedPrice}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    padding: 16,
    paddingBottom: 30,
    backgroundColor: "#f8f8f8",
  },
  hero: {
    marginBottom: 14,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#222",
    marginBottom: 8,
  },
  pageSubtitle: {
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
  },
});
