import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, RefreshControl, Alert } from "react-native";
import { Flame, MapPin, ShoppingCart, Navigation, Database } from "lucide-react-native";
import { useLocationAndSellers } from "@/hooks/useLocationAndSellers";
import { useOrder } from "@/contexts/OrderContext";
import { useState } from "react";
import { useRouter } from "expo-router";
import { seedSellers } from "@/lib/seedSellers";

const gasTypes = [
  { size: "3kg", basePrice: 2500, color: "#22c55e" },
  { size: "5kg", basePrice: 4000, color: "#3b82f6" },
  { size: "6kg", basePrice: 4800, color: "#8b5cf6" },
  { size: "12.5kg", basePrice: 9500, color: "#f97316" },
  { size: "25kg", basePrice: 18000, color: "#ef4444" },
  { size: "50kg", basePrice: 35000, color: "#dc2626" },
];

export default function BuyerHome() {
  const { location, address, nearbySellers, loading, error, getBestPrices, refreshSellers } = useLocationAndSellers();
  const { addToCart, cart } = useOrder();
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const bestPrices = getBestPrices();

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshSellers();
    setRefreshing(false);
  };

  const handleSeed = () => {
    Alert.alert("Seed Database", "Add 8 mock sellers around Lagos?", [
      { text: "Cancel", style: "cancel" },
      { text: "Add Sellers", onPress: async () => { await seedSellers(); onRefresh(); } }
    ]);
  };

  const handleAddToCart = (gasSize: string) => {
    const bestDeal = bestPrices[gasSize];
    if (!bestDeal) {
      Alert.alert("Unavailable", "No sellers have this size in stock nearby");
      return;
    }

    const seller = nearbySellers.find(s => s.name === bestDeal.seller);
    if (!seller) return;

    addToCart({
      size: gasSize,
      price: bestDeal.price,
      quantity: 1,
      sellerId: seller.id,
      sellerName: seller.name,
    });

    Alert.alert("Added to Cart", `${gasSize} from ${seller.name} added`, [
      { text: "Continue", style: "cancel" },
      { text: "View Cart", onPress: () => router.push("/order/cart") }
    ]);
  };

  const getPriceForSize = (size: string, basePrice: number) => {
    if (bestPrices[size]) return bestPrices[size].price;
    return basePrice + 500;
  };

  const getSellerInfo = (size: string) => {
    if (bestPrices[size]) {
      return `${bestPrices[size].seller} • ${bestPrices[size].distance.toFixed(1)}km`;
    }
    return "No sellers nearby";
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.logoRow}>
            <Flame color="#f97316" size={32} />
            <Text style={styles.logoText}>OGas</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.seedBtn} onPress={handleSeed}>
              <Database color="white" size={16} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.cartBtn} onPress={() => router.push("/order/cart")}>
              <ShoppingCart color="white" size={24} />
              {cart.length > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{cart.length}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.locationRow}>
          <Navigation color="#fbbf24" size={16} />
          {loading ? (
            <ActivityIndicator size="small" color="#fbbf24" style={{ marginLeft: 8 }} />
          ) : (
            <Text style={styles.locationText} numberOfLines={1}>
              {error ? "Location unavailable" : address}
            </Text>
          )}
        </View>
        
        {!loading && nearbySellers.length > 0 && (
          <Text style={styles.sellerCount}>
            {nearbySellers.length} seller{nearbySellers.length !== 1 ? "s" : ""} nearby
          </Text>
        )}
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f97316" />
        }
      >
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Nearby Gas Prices</Text>
          <TouchableOpacity onPress={onRefresh}>
            <Text style={styles.refreshText}>Refresh</Text>
          </TouchableOpacity>
        </View>
        
        {nearbySellers.length === 0 && !loading && (
          <View style={styles.noSellersCard}>
            <Text style={styles.noSellersTitle}>No sellers in your area</Text>
            <Text style={styles.noSellersText}>Tap the database icon above to add test sellers.</Text>
          </View>
        )}

        <View style={styles.grid}>
          {gasTypes.map((gas) => {
            const price = getPriceForSize(gas.size, gas.basePrice);
            const sellerInfo = getSellerInfo(gas.size);
            const hasSellers = bestPrices[gas.size];

            return (
              <View key={gas.size} style={[styles.gasCard, !hasSellers && styles.gasCardDisabled]}>
                <View style={[styles.gasIcon, { backgroundColor: gas.color + "20" }]}>
                  <Flame color={gas.color} size={32} />
                </View>
                <Text style={styles.gasSize}>{gas.size}</Text>
                <Text style={styles.gasPrice}>₦{price.toLocaleString()}</Text>
                <Text style={styles.sellerInfo} numberOfLines={1}>{sellerInfo}</Text>
                
                <TouchableOpacity 
                  style={[styles.orderBtn, !hasSellers && styles.orderBtnDisabled]}
                  onPress={() => handleAddToCart(gas.size)}
                  disabled={!hasSellers}
                >
                  <Text style={styles.orderBtnText}>
                    {hasSellers ? "Add to Cart" : "Unavailable"}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        {nearbySellers.length > 0 && (
          <View style={styles.mapCard}>
            <Text style={styles.mapTitle}>Closest Seller</Text>
            <Text style={styles.mapSeller}>{nearbySellers[0]?.name}</Text>
            <Text style={styles.mapDistance}>{nearbySellers[0]?.distance?.toFixed(1)}km away</Text>
            <TouchableOpacity style={styles.mapBtn} onPress={() => router.push("/(tabs)/explore")}>
              <MapPin color="white" size={16} />
              <Text style={styles.mapBtnText}>View on Map</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "black" },
  header: { backgroundColor: "#111827", padding: 16, paddingTop: 48, borderBottomWidth: 1, borderBottomColor: "#374151" },
  headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  logoRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  logoText: { color: "white", fontWeight: "bold", fontSize: 24 },
  headerActions: { flexDirection: "row", gap: 12 },
  seedBtn: { backgroundColor: "#374151", padding: 8, borderRadius: 12 },
  cartBtn: { backgroundColor: "#374151", padding: 8, borderRadius: 12, position: "relative" },
  badge: { position: "absolute", top: -8, right: -8, backgroundColor: "#ef4444", width: 20, height: 20, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  badgeText: { color: "white", fontSize: 12, fontWeight: "bold" },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 8 },
  locationText: { color: "#fbbf24", fontSize: 14, flex: 1 },
  sellerCount: { color: "#6b7280", fontSize: 12, marginTop: 4 },
  content: { padding: 16 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  sectionTitle: { color: "white", fontSize: 20, fontWeight: "bold" },
  refreshText: { color: "#f97316", fontSize: 14 },
  noSellersCard: { backgroundColor: "#1f2937", borderRadius: 16, padding: 24, marginBottom: 16, borderWidth: 1, borderColor: "#374151" },
  noSellersTitle: { color: "white", fontSize: 18, fontWeight: "bold", textAlign: "center" },
  noSellersText: { color: "#9ca3af", textAlign: "center", marginTop: 8 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  gasCard: { backgroundColor: "#111827", borderRadius: 16, padding: 16, width: "47%", borderWidth: 1, borderColor: "#374151", alignItems: "center" },
  gasCardDisabled: { opacity: 0.5 },
  gasIcon: { width: 64, height: 64, borderRadius: 32, justifyContent: "center", alignItems: "center", marginBottom: 12 },
  gasSize: { color: "white", fontSize: 18, fontWeight: "bold" },
  gasPrice: { color: "#f97316", fontSize: 16, fontWeight: "600", marginTop: 4 },
  sellerInfo: { color: "#6b7280", fontSize: 11, marginTop: 2, marginBottom: 12 },
  orderBtn: { backgroundColor: "#f97316", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, width: "100%" },
  orderBtnDisabled: { backgroundColor: "#374151" },
  orderBtnText: { color: "white", textAlign: "center", fontWeight: "bold", fontSize: 12 },
  mapCard: { backgroundColor: "#1f2937", borderRadius: 16, padding: 20, marginTop: 24, borderWidth: 1, borderColor: "#f97316" },
  mapTitle: { color: "#f97316", fontSize: 14, fontWeight: "600" },
  mapSeller: { color: "white", fontSize: 18, fontWeight: "bold", marginTop: 4 },
  mapDistance: { color: "#9ca3af", fontSize: 14, marginTop: 2 },
  mapBtn: { backgroundColor: "#f97316", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, padding: 12, borderRadius: 12, marginTop: 12 },
  mapBtnText: { color: "white", fontWeight: "bold" },
});
