import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Alert, TextInput } from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { useOrder } from "../../contexts/OrderContext";
import { useRouter } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";
import { useState, useEffect } from "react";
import { doc, updateDoc, onSnapshot, setDoc, getDoc } from "firebase/firestore";
import { db } from "../../config/firebase";

const GAS_SIZES = ["3kg", "5kg", "6kg", "12kg", "25kg", "50kg"];

export default function SellerDashboard() {
  const { user, userData, signOut } = useAuth();
  const { orders } = useOrder();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [sellerData, setSellerData] = useState(null);
  const [prices, setPrices] = useState({});
  const [inventory, setInventory] = useState({});
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    // Create seller doc if doesn't exist
    const initSeller = async () => {
      const sellerRef = doc(db, "sellers", user.uid);
      const snap = await getDoc(sellerRef);
      if (!snap.exists()) {
        await setDoc(sellerRef, {
          businessName: userData?.fullName || "My Store",
          businessEmail: userData?.email,
          ownerId: user.uid,
          isOpen: false,
          isApproved: true,
          prices: {},
          inventory: {},
          rating: 0,
          reviewCount: 0,
          createdAt: new Date(),
          location: null,
        });
      }
    };
    initSeller();

    const unsubscribe = onSnapshot(doc(db, "sellers", user.uid), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setSellerData(data);
        setIsOpen(data.isOpen || false);
        setPrices(data.prices || {});
        setInventory(data.inventory || {});
      }
    });
    
    return unsubscribe;
  }, [user]);

  const toggleOpen = async () => {
    if (!user) return;
    try {
      await updateDoc(doc(db, "sellers", user.uid), {
        isOpen: !isOpen,
        updatedAt: new Date()
      });
      setIsOpen(!isOpen);
    } catch (error) {
      Alert.alert("Error", "Could not update status");
    }
  };

  const updatePrice = (size, price) => {
    setPrices({ ...prices, [size]: parseInt(price) || 0 });
  };

  const updateInventory = (size, stock) => {
    setInventory({ ...inventory, [size]: parseInt(stock) || 0 });
  };

  const savePrices = async () => {
    if (!user) return;
    try {
      await updateDoc(doc(db, "sellers", user.uid), {
        prices: prices,
        updatedAt: new Date()
      });
      Alert.alert("Success", "Prices updated!");
      setEditing(false);
    } catch (error) {
      Alert.alert("Error", "Could not save prices");
    }
  };

  const pendingOrders = orders.filter((o) => o.status === "pending");
  const confirmedOrders = orders.filter((o) => o.status === "confirmed");
  const totalRevenue = orders
    .filter((o) => o.status === "delivered")
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  const handleLogout = async () => {
    await signOut();
    router.replace("/auth");
  };

  const acceptOrder = async (orderId) => {
    try {
      await updateDoc(doc(db, "orders", orderId), {
        status: "confirmed",
        updatedAt: new Date()
      });
      Alert.alert("Success", "Order accepted!");
    } catch (error) {
      Alert.alert("Error", "Could not accept order");
    }
  };

  const markDelivered = async (orderId) => {
    try {
      await updateDoc(doc(db, "orders", orderId), {
        status: "delivered",
        deliveredAt: new Date(),
        updatedAt: new Date()
      });
      Alert.alert("Success", "Order marked as delivered!");
    } catch (error) {
      Alert.alert("Error", "Could not update order");
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Vendor Dashboard</Text>
        <TouchableOpacity onPress={handleLogout}>
          <FontAwesome name="sign-out" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Business Info */}
      <View style={styles.businessCard}>
        <FontAwesome name="building" size={40} color="#FF6B35" />
        <Text style={styles.businessName}>{sellerData?.businessName || userData?.fullName || "My Store"}</Text>
        <Text style={styles.businessEmail}>{userData?.email}</Text>
        
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Store Status:</Text>
          <Switch
            value={isOpen}
            onValueChange={toggleOpen}
            trackColor={{ false: "#767577", true: "#81b0ff" }}
            thumbColor={isOpen ? "#FF6B35" : "#f4f3f4"}
          />
          <Text style={[styles.statusText, isOpen ? styles.open : styles.closed]}>
            {isOpen ? "OPEN FOR ORDERS" : "CLOSED"}
          </Text>
        </View>
      </View>

      <TouchableOpacity style={styles.calcBtn} onPress={() => router.push("/seller/lpg-calculator") }>
        <Text style={styles.calcBtnText}>Open Smart LPG Calculator</Text>
      </TouchableOpacity>

      {/* Stats */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{pendingOrders.length}</Text>
          <Text style={styles.statLabel}>New Orders</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{confirmedOrders.length}</Text>
          <Text style={styles.statLabel}>In Progress</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>₦{totalRevenue.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Revenue</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{sellerData?.rating || "0.0"}</Text>
          <Text style={styles.statLabel}>Rating</Text>
        </View>
      </View>

      {/* Inventory & Prices Management */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Inventory & Prices</Text>
          <TouchableOpacity onPress={() => setEditing(!editing)}>
            <Text style={styles.editBtn}>{editing ? "Cancel" : "Edit"}</Text>
          </TouchableOpacity>
        </View>

        {GAS_SIZES.map((size) => (
          <View key={size} style={styles.inventoryRow}>
            <View style={styles.sizeInfo}>
              <FontAwesome name="fire" size={20} color="#FF6B35" />
              <Text style={styles.sizeText}>{size}</Text>
            </View>
            
            {editing ? (
              <View style={styles.inputsRow}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Stock</Text>
                  <TextInput
                    style={styles.input}
                    value={(inventory[size] || 0).toString()}
                    onChangeText={(text) => updateInventory(size, text)}
                    keyboardType="numeric"
                    placeholder="0"
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Price (₦)</Text>
                  <TextInput
                    style={styles.input}
                    value={(prices[size] || 0).toString()}
                    onChangeText={(text) => updatePrice(size, text)}
                    keyboardType="numeric"
                    placeholder="0"
                  />
                </View>
              </View>
            ) : (
              <View style={styles.displayRow}>
                <Text style={styles.stockText}>Stock: {inventory[size] || 0}</Text>
                <Text style={styles.priceText}>₦{(prices[size] || 0).toLocaleString()}</Text>
              </View>
            )}
          </View>
        ))}

        {editing && (
          <TouchableOpacity style={styles.saveBtn} onPress={savePrices}>
            <Text style={styles.saveBtnText}>Save Changes</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Pending Orders */}
      <Text style={styles.sectionTitle}>New Orders (Pending)</Text>
      
      {pendingOrders.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No new orders</Text>
        </View>
      ) : (
        pendingOrders.map((order) => (
          <View key={order.id} style={styles.orderCard}>
            <View style={styles.orderHeader}>
              <Text style={styles.orderId}>Order #{order.id?.slice(-6).toUpperCase()}</Text>
              <Text style={styles.orderTime}>{order.createdAt?.toDate ? new Date(order.createdAt.toDate()).toLocaleString() : "Just now"}</Text>
            </View>
            <Text style={styles.customerInfo}>Customer: {order.customerName}</Text>
            <Text style={styles.customerInfo}>Phone: {order.customerPhone}</Text>
            <Text style={styles.orderItems}>
              {order.items?.map((i) => i.quantity + "x " + i.name).join(", ")}
            </Text>
            <Text style={styles.orderTotal}>Total: ₦{order.totalAmount?.toLocaleString()}</Text>
            <TouchableOpacity 
              style={styles.acceptBtn}
              onPress={() => acceptOrder(order.id)}
            >
              <Text style={styles.acceptBtnText}>Accept Order</Text>
            </TouchableOpacity>
          </View>
        ))
      )}

      {/* Confirmed Orders */}
      <Text style={styles.sectionTitle}>Orders In Progress</Text>
      
      {confirmedOrders.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No orders in progress</Text>
        </View>
      ) : (
        confirmedOrders.map((order) => (
          <View key={order.id} style={[styles.orderCard, styles.confirmedCard]}>
            <View style={styles.orderHeader}>
              <Text style={styles.orderId}>Order #{order.id?.slice(-6).toUpperCase()}</Text>
              <View style={styles.confirmedBadge}>
                <Text style={styles.confirmedText}>CONFIRMED</Text>
              </View>
            </View>
            <Text style={styles.customerInfo}>Customer: {order.customerName}</Text>
            <Text style={styles.orderItems}>
              {order.items?.map((i) => i.quantity + "x " + i.name).join(", ")}
            </Text>
            <Text style={styles.orderTotal}>Total: ₦{order.totalAmount?.toLocaleString()}</Text>
            <TouchableOpacity 
              style={styles.deliverBtn}
              onPress={() => markDelivered(order.id)}
            >
              <Text style={styles.deliverBtnText}>Mark as Delivered</Text>
            </TouchableOpacity>
          </View>
        ))
      )}

      {/* Switch to Buyer */}
      <TouchableOpacity 
        style={styles.switchBtn}
        onPress={() => router.replace("/(tabs)")}
      >
        <Text style={styles.switchBtnText}>Switch to Buyer Mode</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    backgroundColor: "#FF6B35",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: 50,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  businessCard: {
    backgroundColor: "#fff",
    margin: 15,
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  businessName: {
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 10,
    color: "#333",
  },
  businessEmail: {
    color: "#666",
    marginTop: 5,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 15,
  },
  statusLabel: {
    marginRight: 10,
    color: "#666",
  },
  statusText: {
    marginLeft: 10,
    fontWeight: "bold",
  },
  open: {
    color: "#4CAF50",
  },
  closed: {
    color: "#F44336",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 10,
  },
  statCard: {
    width: "48%",
    backgroundColor: "#fff",
    margin: "1%",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FF6B35",
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 5,
  },
  section: {
    backgroundColor: "#fff",
    margin: 15,
    padding: 15,
    borderRadius: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  editBtn: {
    color: "#FF6B35",
    fontWeight: "bold",
  },
  inventoryRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
  },
  sizeInfo: {
    flexDirection: "row",
    alignItems: "center",
    width: 60,
  },
  sizeText: {
    marginLeft: 8,
    fontWeight: "600",
    color: "#333",
  },
  inputsRow: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
  },
  inputGroup: {
    alignItems: "center",
  },
  inputLabel: {
    fontSize: 10,
    color: "#666",
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 8,
    width: 70,
    textAlign: "center",
  },
  displayRow: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 20,
  },
  stockText: {
    color: "#666",
  },
  priceText: {
    fontWeight: "bold",
    color: "#FF6B35",
    fontSize: 16,
  },
  saveBtn: {
    backgroundColor: "#4CAF50",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 15,
  },
  saveBtnText: {
    color: "#fff",
    fontWeight: "bold",
  },
  calcBtn: {
    backgroundColor: "#fff",
    marginHorizontal: 15,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#FF6B35",
    marginBottom: 15,
  },
  calcBtnText: {
    color: "#FF6B35",
    fontWeight: "bold",
    fontSize: 16,
  },
  emptyState: {
    padding: 20,
    alignItems: "center",
  },
  emptyText: {
    color: "#999",
  },
  orderCard: {
    backgroundColor: "#fff",
    marginHorizontal: 15,
    marginBottom: 12,
    padding: 15,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#FF6B35",
  },
  confirmedCard: {
    borderLeftColor: "#2196F3",
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  orderId: {
    fontWeight: "bold",
    color: "#333",
  },
  orderTime: {
    fontSize: 12,
    color: "#999",
  },
  customerInfo: {
    color: "#666",
    fontSize: 14,
    marginBottom: 4,
  },
  confirmedBadge: {
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  confirmedText: {
    color: "#2196F3",
    fontSize: 10,
    fontWeight: "bold",
  },
  orderItems: {
    color: "#333",
    marginVertical: 10,
  },
  orderTotal: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FF6B35",
    marginBottom: 10,
  },
  acceptBtn: {
    backgroundColor: "#4CAF50",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  acceptBtnText: {
    color: "#fff",
    fontWeight: "bold",
  },
  deliverBtn: {
    backgroundColor: "#FF6B35",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  deliverBtnText: {
    color: "#fff",
    fontWeight: "bold",
  },
  switchBtn: {
    backgroundColor: "#fff",
    margin: 15,
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FF6B35",
    marginBottom: 30,
  },
  switchBtnText: {
    color: "#FF6B35",
    fontWeight: "bold",
  },
});
