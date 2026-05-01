import { useState, useEffect } from "react";
import * as Location from "expo-location";
import { collection, query, where, getDocs, GeoPoint } from "firebase/firestore";
import { db } from "@/config/firebase";

interface Seller {
  id: string;
  name: string;
  location: GeoPoint;
  rating: number;
  isOnline: boolean;
  inventory: {
    size: string;
    price: number;
    stock: number;
  }[];
  distance?: number;
}

export function useLocationAndSellers() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [address, setAddress] = useState<string>("Detecting location...");
  const [nearbySellers, setNearbySellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        // Get permission
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setError("Location permission denied");
          setLoading(false);
          return;
        }

        // Get current location
        let loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        setLocation(loc);

        // Reverse geocode to get address
        let reverseGeocode = await Location.reverseGeocodeAsync({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });

        if (reverseGeocode[0]) {
          let addr = reverseGeocode[0];
          setAddress(`${addr.street || ""}, ${addr.city || "Lagos"}`);
        }

        // Fetch nearby sellers from Firebase
        await fetchNearbySellers(loc.coords.latitude, loc.coords.longitude);
        
      } catch (err) {
        setError("Could not get location");
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const fetchNearbySellers = async (lat: number, lng: number) => {
    try {
      // Query online sellers within delivery range
      const sellersRef = collection(db, "sellers");
      const q = query(sellersRef, where("isOnline", "==", true));
      const snapshot = await getDocs(q);
      
      const sellers: Seller[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data() as Seller;
        const distance = calculateDistance(
          lat, lng,
          data.location.latitude, data.location.longitude
        );
        
        // Only include sellers within 10km
        if (distance <= 10) {
          sellers.push({ ...data, id: doc.id, distance });
        }
      });

      // Sort by distance
      sellers.sort((a, b) => (a.distance || 0) - (b.distance || 0));
      setNearbySellers(sellers);
      
    } catch (err) {
      console.error("Error fetching sellers:", err);
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Get best price for each gas size from nearby sellers
  const getBestPrices = () => {
    const sizes = ["3kg", "5kg", "6kg", "12.5kg", "25kg", "50kg"];
    const prices: Record<string, { price: number; seller: string; distance: number }> = {};
    
    sizes.forEach(size => {
      let bestPrice = Infinity;
      let bestSeller = "";
      let bestDistance = 0;
      
      nearbySellers.forEach(seller => {
        const item = seller.inventory?.find(i => i.size === size && i.stock > 0);
        if (item && item.price < bestPrice) {
          bestPrice = item.price;
          bestSeller = seller.name;
          bestDistance = seller.distance || 0;
        }
      });
      
      if (bestPrice !== Infinity) {
        prices[size] = { price: bestPrice, seller: bestSeller, distance: bestDistance };
      }
    });
    
    return prices;
  };

  return { location, address, nearbySellers, loading, error, getBestPrices, refreshSellers: () => location && fetchNearbySellers(location.coords.latitude, location.coords.longitude) };
}
