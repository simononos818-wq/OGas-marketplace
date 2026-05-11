import { ScrollView, StyleSheet, View, Text, Alert } from "react-native";
import { useSearchParams, useRouter } from "expo-router/build/hooks";
import { useOrder } from "../../contexts/OrderContext";
import LpgSmartCalculator from "../../components/LpgSmartCalculator";

export default function LpgCalculatorScreen() {
  const { addToCart } = useOrder();
  const params = useSearchParams();
  const router = useRouter();

  const sellerId = params.get("sellerId") ?? undefined;
  const sellerName = params.get("sellerName") ?? undefined;
  const size = params.get("size") ?? undefined;
  const price = params.get("price") ?? undefined;
  const deliveryAvailable = params.get("deliveryAvailable") ?? undefined;
  const deliveryFee = params.get("deliveryFee") ?? undefined;

  const parsedSize = Number(size) || 12.5;
  const parsedPrice = Number(price) || 820;
  const parsedDeliveryAvailable = String(deliveryAvailable) === "1";
  const parsedDeliveryFee = Number(deliveryFee) || 500;

  const handleProceed = async ({ item }: { item: any }) => {
    addToCart(item);
    Alert.alert("Added to cart", "Your estimate was added to the cart.", [
      { text: "Checkout", onPress: () => router.push("/order/checkout") },
      { text: "Continue", style: "cancel" },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={styles.screen} keyboardShouldPersistTaps="handled">
      <View style={styles.hero}>
        <Text style={styles.pageTitle}>LPG Smart Calculator</Text>
        <Text style={styles.pageSubtitle}>
          Estimate your LPG purchase with confidence — choose whether you want to buy by weight or by amount.
        </Text>
      </View>

      <LpgSmartCalculator
        defaultPricePerKg={parsedPrice}
        defaultDeliveryFee={parsedDeliveryFee}
        defaultSize={parsedSize}
        sellerId={String(sellerId || "")}
        sellerName={String(sellerName || "")}
        deliveryAvailable={parsedDeliveryAvailable}
        deliveryFee={parsedDeliveryFee}
        prefillPricePerCylinder={parsedPrice}
        onProceed={handleProceed}
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
