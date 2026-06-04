import { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, StyleSheet, TextInput } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getOrders } from '../api';

export default function OrdersScreen({ navigation }: any) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [buyerPhone, setBuyerPhone] = useState('');

  useEffect(() => {
    loadPhone();
  }, []);

  const loadPhone = async () => {
    const stored = await AsyncStorage.getItem('ogas_phone');
    if (stored) {
      setBuyerPhone(stored);
      fetchOrders(stored, filter);
    } else {
      setLoading(false);
    }
  };

  const fetchOrders = async (phone: string, statusFilter: string) => {
    try {
      const params: any = { buyerId: phone.replace(/\D/g, '') };
      if (statusFilter !== 'all') params.status = statusFilter;
      const data = await getOrders(params);
      setOrders(data.orders || []);
    } catch (e) {
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (buyerPhone) fetchOrders(buyerPhone, filter);
    }, [buyerPhone, filter])
  );

  const onRefresh = () => {
    setRefreshing(true);
    if (buyerPhone) fetchOrders(buyerPhone, filter);
  };

  const statusColors: any = {
    pending: { bg: 'rgba(234,179,8,0.15)', text: '#eab308', border: 'rgba(234,179,8,0.3)' },
    confirmed: { bg: 'rgba(59,130,246,0.15)', text: '#3b82f6', border: 'rgba(59,130,246,0.3)' },
    out_for_delivery: { bg: 'rgba(168,85,247,0.15)', text: '#a855f7', border: 'rgba(168,85,247,0.3)' },
    delivered: { bg: 'rgba(34,197,94,0.15)', text: '#22c55e', border: 'rgba(34,197,94,0.3)' },
    cancelled: { bg: 'rgba(239,68,68,0.15)', text: '#ef4444', border: 'rgba(239,68,68,0.3)' },
  };

  const statusLabels: any = {
    pending: '⏳ Pending',
    confirmed: '✅ Confirmed',
    out_for_delivery: '🚚 Out for Delivery',
    delivered: '🎉 Delivered',
    cancelled: '❌ Cancelled',
  };

  const filters = ['all', 'pending', 'confirmed', 'out_for_delivery', 'delivered'];

  const renderOrder = ({ item }: any) => (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View>
          <Text style={styles.orderId}>#{item.id?.slice(-6).toUpperCase()}</Text>
          <Text style={styles.sellerName}>{item.sellerName || 'Unknown Seller'}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColors[item.status]?.bg, borderColor: statusColors[item.status]?.border }]}>
          <Text style={[styles.statusText, { color: statusColors[item.status]?.text }]}>
            {statusLabels[item.status] || item.status}
          </Text>
        </View>
      </View>

      <View style={styles.orderDetails}>
        <Text style={styles.detailText}>📍 {item.deliveryAddress}</Text>
        <Text style={styles.detailText}>📞 {item.buyerPhone}</Text>
        {item.items?.map((it: any, i: number) => (
          <Text key={i} style={styles.detailText}>🔥 {it.kg}kg × ₦{it.pricePerKg?.toLocaleString()}</Text>
        ))}
      </View>

      <View style={styles.orderFooter}>
        <View>
          <Text style={styles.totalPrice}>₦{item.total?.toLocaleString()}</Text>
          <Text style={styles.paymentMethod}>
            {item.paymentMethod === 'cash_on_delivery' ? '💵 Cash on Delivery' : '💳 Card Payment'}
          </Text>
        </View>
        <Text style={styles.date}>
          {item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-NG') : ''}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📦 My Orders</Text>

      <TextInput
        value={buyerPhone}
        onChangeText={(text) => { setBuyerPhone(text); setLoading(true); }}
        placeholder="Enter your phone to see orders"
        placeholderTextColor="#6b7280"
        style={styles.phoneInput}
        keyboardType="phone-pad"
      />

      {/* Filter Tabs */}
      <FlatList
        horizontal
        data={filters}
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        style={styles.filterList}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => { setFilter(item); setLoading(true); }}
            style={[styles.filterTab, filter === item && styles.filterTabActive]}>
            <Text style={[styles.filterText, filter === item && styles.filterTextActive]}>
              {item === 'all' ? 'All' : statusLabels[item]?.split(' ')[1] || item}
            </Text>
          </TouchableOpacity>
        )}
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#f97316" />
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>📭</Text>
          <Text style={styles.emptyText}>No orders found</Text>
          <Text style={styles.emptySub}>
            {buyerPhone ? 'Try a different phone number' : 'Enter your phone number above'}
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Buy')} style={styles.orderButton}>
            <Text style={styles.orderButtonText}>Order Gas Now →</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrder}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f97316" />}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', padding: 16 },
  title: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginBottom: 12 },
  phoneInput: { backgroundColor: '#111', borderWidth: 1, borderColor: '#222', borderRadius: 12, padding: 14, color: '#fff', fontSize: 14, marginBottom: 12 },
  filterList: { marginBottom: 12, maxHeight: 40 },
  filterTab: { backgroundColor: '#111', borderWidth: 1, borderColor: '#222', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, marginRight: 8 },
  filterTabActive: { backgroundColor: '#f97316', borderColor: '#f97316' },
  filterText: { color: '#9ca3af', fontSize: 12, fontWeight: '600' },
  filterTextActive: { color: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: '#9ca3af', fontSize: 16 },
  emptySub: { color: '#6b7280', fontSize: 13, marginTop: 4 },
  orderButton: { backgroundColor: '#f97316', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12, marginTop: 16 },
  orderButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  orderCard: { backgroundColor: '#111', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#222' },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  orderId: { color: '#6b7280', fontSize: 11, fontFamily: 'monospace' },
  sellerName: { color: '#fff', fontWeight: 'bold', fontSize: 15, marginTop: 2 },
  statusBadge: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1 },
  statusText: { fontSize: 11, fontWeight: '600' },
  orderDetails: { marginBottom: 10 },
  detailText: { color: '#9ca3af', fontSize: 13, marginBottom: 2 },
  orderFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#222', paddingTop: 10 },
  totalPrice: { color: '#fb923c', fontWeight: 'bold', fontSize: 18 },
  paymentMethod: { color: '#6b7280', fontSize: 11, marginTop: 2 },
  date: { color: '#4b5563', fontSize: 11 },
});
