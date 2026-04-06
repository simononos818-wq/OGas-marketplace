import { View, StyleSheet, Dimensions, TouchableOpacity, Text } from "react-native";
import MapView, { Marker, Callout } from "react-native-maps";
import { useLocationAndSellers } from "@/hooks/useLocationAndSellers";
import { Flame, Navigation } from "lucide-react-native";
import { useEffect, useState } from "react";
import * as Location from "expo-location";

const { width, height } = Dimensions.get("window");

export default function ExploreScreen() {
  const { nearbySellers, loading } = useLocationAndSellers();
  const [region, setRegion] = useState({
    latitude: 6.5244,
    longitude: 3.3792,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  });

  useEffect(() => {
    (async () => {
      let location = await Location.getCurrentPositionAsync({});
      setRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    })();
  }, []);

  const centerOnUser = async () => {
    let location = await Location.getCurrentPositionAsync({});
    setRegion({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    });
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        region={region}
        onRegionChangeComplete={setRegion}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {nearbySellers.map((seller) => (
          <Marker
            key={seller.id}
            coordinate={{
              latitude: seller.location.latitude,
              longitude: seller.location.longitude,
            }}
            title={seller.name}
          >
            <View style={styles.markerContainer}>
              <View style={styles.marker}>
                <Flame color="white" size={20} />
              </View>
              <View style={styles.markerTail} />
            </View>
            <Callout tooltip>
              <View style={styles.callout}>
                <Text style={styles.calloutTitle}>{seller.name}</Text>
                <Text style={styles.calloutSubtitle}>{seller.area}</Text>
                <Text style={styles.calloutRating}>★ {seller.rating.toFixed(1)}</Text>
                <View style={styles.inventoryPreview}>
                  {seller.inventory.slice(0, 3).map((item, idx) => (
                    <Text key={idx} style={styles.inventoryItem}>
                      {item.size}: ₦{item.price.toLocaleString()}
                    </Text>
                  ))}
                </View>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      <View style={styles.overlay}>
        <Text style={styles.title}>Nearby Sellers</Text>
        <Text style={styles.subtitle}>{nearbySellers.length} sellers in your area</Text>
      </View>

      <TouchableOpacity style={styles.locationBtn} onPress={centerOnUser}>
        <Navigation color="white" size={24} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "black" },
  map: { width, height },
  markerContainer: { alignItems: "center" },
  marker: { backgroundColor: "#f97316", width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center", borderWidth: 3, borderColor: "white" },
  markerTail: { width: 0, height: 0, borderLeftWidth: 8, borderRightWidth: 8, borderTopWidth: 10, borderLeftColor: "transparent", borderRightColor: "transparent", borderTopColor: "#f97316", marginTop: -3 },
  callout: { backgroundColor: "#111827", borderRadius: 12, padding: 16, width: 200, borderWidth: 1, borderColor: "#374151" },
  calloutTitle: { color: "white", fontSize: 16, fontWeight: "bold" },
  calloutSubtitle: { color: "#9ca3af", fontSize: 14, marginTop: 2 },
  calloutRating: { color: "#fbbf24", fontSize: 14, marginTop: 4 },
  inventoryPreview: { marginTop: 8, borderTopWidth: 1, borderTopColor: "#374151", paddingTop: 8 },
  inventoryItem: { color: "#d1d5db", fontSize: 12, marginTop: 2 },
  overlay: { position: "absolute", top: 48, left: 16, right: 16, backgroundColor: "rgba(0,0,0,0.8)", padding: 16, borderRadius: 16, borderWidth: 1, borderColor: "#374151" },
  title: { color: "white", fontSize: 20, fontWeight: "bold" },
  subtitle: { color: "#9ca3af", fontSize: 14, marginTop: 4 },
  locationBtn: { position: "absolute", bottom: 100, right: 16, backgroundColor: "#f97316", width: 56, height: 56, borderRadius: 28, justifyContent: "center", alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 8 },
});
