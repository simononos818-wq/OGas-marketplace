import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, ActivityInput, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getVendors, createOrder } from '../api';

export default function BuyScreen({ route, navigation }: any) {
  const preselectedSeller = route.params?.seller;

  const [sellers, setSellers] = useState<any[]>([]);
  const [selectedSeller, setSelectedSeller] = useState<any>(preselectedSeller || null);
  const [kg, setKg] = useState(12);
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [buyerName, setBuyerName] = useState('');
  const [loading, setLoading] = useState(!preselectedSeller);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadStoredData();
    if (!preselectedSeller) {
      getVendors().then(data => {
        setSellers(data.vendors || []);
        setLoading(false);
      });
    }
  }, []);

  const loadStoredData = async () => {
    const storedPhone = await AsyncStorage.getItem('ogas_phone');
    const storedName = await AsyncStorage.getItem('ogas_name');
    const storedAddress = await AsyncStorage.getItem('ogas_address');
    if (storedPhone) setPhone(storedPhone);
    if (storedName) setBuyerName(storedName);
    if (storedAddress) setAddress(storedAddress);
  };

  const saveData = async () => {
    await AsyncStorage.setItem('ogas_phone', phone);
    await AsyncStorage.setItem('ogas_name', buyerName);
    await AsyncStorage.setItem('ogas_address', address);
  };

  const pricePerKg = selectedSeller?.pricePerKg || 1200;
  const total = kg * pricePerKg;

  const placeOrder = async () => {
    if (!selectedSeller || !address || !phone || !buyerName) {
      Alert.alert('Missing Info', 'Please fill in all fields');
      return;
    }
    setSubmitting(true);
    await saveData();
    try {
      const order = {
        buyerId: phone.replace(/\D/g, ''),
        buyerName,
        buyerPhone: phone,
        sellerId: selectedSeller.id,
        sellerName: selectedSeller.shopName || selectedSeller.businessName,
        items: [{ name: 'LPG Gas', kg, pricePerKg }],
        total,
        deliveryAddress: address,
        paymentMethod: 'cash_on_delivery',
        status: 'pending'
      };
      const res = await createOrder(order);
      Alert.alert(
        '🔥 Order Placed!',
        `Order ID: ${res.orderId}\n\nThe seller will contact you shortly.`,
        [{ text: 'Track Order', onPress: () => navigation.navigate('Orders') }]
      );
      setKg(12);
      setAddress('');
    } catch (e: any) {
      Alert.alert('Error', 'Order failed: ' + e.message);
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#f97316" />
          <Text style={styles.loadingText}>Loading sellers...</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.title}>🔥 Order Gas</Text>

      {!selectedSeller ? (
        <View>
          <Text style={styles.label}>Select a seller:</Text>
          {sellers.map((s: any) => (
            <TouchableOpacity key={s.id} onPress={() => setSelectedSeller(s)} style={styles.sellerCard}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sellerName}>{s.shopName || s.businessName}</Text>
                  <Text style={styles.sellerAddress}>{s.address || 'Oteri, Ughelli'}</Text>
                  {s.hasDelivery && <Text style={styles.deliveryBadge}>🚚 Offers Delivery</Text>}
                </View>
                <Text style={styles.sellerPrice}>₦{(s.pricePerKg || 1200).toLocaleString()}/kg</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <View>
          {/* Seller Info */}
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Ordering from</Text>
            <Text style={styles.infoName}>{selectedSeller.shopName || selectedSeller.businessName}</Text>
            <Text style={styles.infoAddress}>{selectedSeller.address || 'Oteri, Ughelli'}</Text>
            <TouchableOpacity onPress={() => setSelectedSeller(null)}>
              <Text style={styles.changeLink}>← Change Seller</Text>
            </TouchableOpacity>
          </View>

          {/* KG Selector */}
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>How many kg?</Text>
            <View style={styles.kgRow}>
              <TouchableOpacity onPress={() => setKg(Math.max(1, kg - 1))} style={styles.kgButton}>
                <Text style={styles.kgButtonText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.kgValue}>{kg}</Text>
              <TouchableOpacity onPress={() => setKg(kg + 1)} style={styles.kgButton}>
                <Text style={styles.kgButtonText}>+</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.totalPrice}>₦{total.toLocaleString()}</Text>
            <Text style={styles.perKg}>₦{pricePerKg.toLocaleString()} per kg</Text>
          </View>

          {/* Form */}
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Delivery Details</Text>
            <TextInput
              value={buyerName}
              onChangeText={setBuyerName}
              placeholder="Your Name"
              placeholderTextColor="#6b7280"
              style={styles.input}
            />
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="Phone Number (08012345678)"
              placeholderTextColor="#6b7280"
              keyboardType="phone-pad"
              style={styles.input}
            />
            <TextInput
              value={address}
              onChangeText={setAddress}
              placeholder="Delivery Address in Oteri/Ughelli"
              placeholderTextColor="#6b7280"
              style={styles.input}
            />
          </View>

          <TouchableOpacity
            onPress={placeOrder}
            disabled={submitting || !buyerName || !phone || !address}
            style={[styles.placeButton, (submitting || !buyerName || !phone || !address) && styles.placeButtonDisabled]}>
            <Text style={styles.placeButtonText}>
              {submitting ? 'Placing Order...' : `Place Order — ₦${total.toLocaleString()}`}
            </Text>
          </TouchableOpacity>
          <Text style={styles.codNote}>💵 Cash on Delivery</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#9ca3af', marginTop: 12, fontSize: 14 },
  title: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  label: { color: '#9ca3af', fontSize: 14, marginBottom: 10 },
  sellerCard: { backgroundColor: '#111', borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: '#222' },
  sellerName: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  sellerAddress: { color: '#9ca3af', fontSize: 13, marginTop: 2 },
  deliveryBadge: { color: '#4ade80', fontSize: 12, marginTop: 4 },
  sellerPrice: { color: '#fb923c', fontWeight: 'bold', fontSize: 15 },
  infoCard: { backgroundColor: '#111', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#222' },
  infoLabel: { color: '#9ca3af', fontSize: 13, marginBottom: 6 },
  infoName: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  infoAddress: { color: '#9ca3af', fontSize: 13, marginTop: 2 },
  changeLink: { color: '#f97316', fontSize: 13, marginTop: 8, fontWeight: '500' },
  kgRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20, marginVertical: 10 },
  kgButton: { width: 56, height: 56, backgroundColor: '#222', borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  kgButtonText: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  kgValue: { color: '#fff', fontSize: 36, fontWeight: 'bold', width: 60, textAlign: 'center' },
  totalPrice: { color: '#fb923c', fontWeight: 'bold', fontSize: 28, textAlign: 'center', marginTop: 8 },
  perKg: { color: '#6b7280', fontSize: 12, textAlign: 'center', marginTop: 2 },
  input: { backgroundColor: '#000', borderWidth: 1, borderColor: '#333', borderRadius: 12, padding: 14, color: '#fff', fontSize: 15, marginBottom: 10 },
  placeButton: { backgroundColor: '#f97316', borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 4 },
  placeButtonDisabled: { opacity: 0.5 },
  placeButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  codNote: { color: '#6b7280', fontSize: 12, textAlign: 'center', marginTop: 8 },
});
