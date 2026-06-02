import { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getVendors } from '../api';

export default function HomeScreen({ navigation }: any) {
  const [sellers, setSellers] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const data = await getVendors();
      setSellers(data.vendors || []);
    } catch (e) {
      setSellers([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const renderSeller = ({ item }: any) => (
    <TouchableOpacity 
      onPress={() => navigation.navigate('Buy', { seller: item })}
      style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.shopName}>{item.shopName || item.businessName || 'Unnamed Shop'}</Text>
          <Text style={styles.address}>{item.address || 'Oteri, Ughelli'}</Text>
          <View style={styles.tags}>
            {item.hasDelivery && (
              <View style={styles.deliveryTag}>
                <Text style={styles.deliveryText}>🚚 Delivery</Text>
              </View>
            )}
            <View style={styles.newTag}>
              <Text style={styles.newText}>⭐ New</Text>
            </View>
          </View>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.price}>₦{(item.pricePerKg || 1200).toLocaleString()}</Text>
          <Text style={styles.perKg}>/kg</Text>
        </View>
      </View>
      <TouchableOpacity 
        onPress={() => navigation.navigate('Buy', { seller: item })}
        style={styles.orderButton}>
        <Text style={styles.orderButtonText}>Order Now →</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.location}>📍 Oteri, Ughelli</Text>
          <Text style={styles.title}>Order Gas, Delivered Fast 🔥</Text>
        </View>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#f97316" />
          <Text style={styles.loadingText}>Finding sellers near you...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.location}>📍 Oteri, Ughelli</Text>
        <Text style={styles.title}>Order Gas, Delivered Fast 🔥</Text>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{sellers.length}</Text>
          <Text style={styles.statLabel}>Sellers</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>5-15</Text>
          <Text style={styles.statLabel}>Min Delivery</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>₦0</Text>
          <Text style={styles.statLabel}>Platform Fee</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>🔥 Nearby Sellers</Text>

      <FlatList
        data={sellers}
        renderItem={renderSeller}
        keyExtractor={(item: any) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f97316" />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🏪</Text>
            <Text style={styles.emptyText}>No sellers yet in your area.</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
              <Text style={styles.emptyLink}>Be the first to sell! →</Text>
            </TouchableOpacity>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { padding: 16, paddingTop: 8 },
  location: { color: '#f97316', fontSize: 12, fontWeight: '500' },
  title: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginTop: 4 },
  statsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 16 },
  statBox: { flex: 1, backgroundColor: '#111', borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: '#222' },
  statNumber: { color: '#fb923c', fontWeight: 'bold', fontSize: 18 },
  statLabel: { color: '#6b7280', fontSize: 11, marginTop: 2 },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', paddingHorizontal: 16, marginBottom: 10 },
  card: { backgroundColor: '#111', borderRadius: 16, padding: 16, marginHorizontal: 16, marginBottom: 12, borderWidth: 1, borderColor: '#222' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  shopName: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  address: { color: '#9ca3af', fontSize: 13, marginTop: 2 },
  tags: { flexDirection: 'row', gap: 8, marginTop: 8 },
  deliveryTag: { backgroundColor: 'rgba(34,197,94,0.15)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  deliveryText: { color: '#4ade80', fontSize: 11, fontWeight: '500' },
  newTag: { backgroundColor: 'rgba(249,115,22,0.15)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  newText: { color: '#fb923c', fontSize: 11, fontWeight: '500' },
  price: { color: '#fb923c', fontWeight: 'bold', fontSize: 18 },
  perKg: { color: '#6b7280', fontSize: 11 },
  orderButton: { backgroundColor: '#f97316', borderRadius: 12, paddingVertical: 12, marginTop: 12, alignItems: 'center' },
  orderButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#9ca3af', marginTop: 12, fontSize: 14 },
  empty: { padding: 40, alignItems: 'center' },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyText: { color: '#9ca3af', fontSize: 14, textAlign: 'center' },
  emptyLink: { color: '#f97316', fontSize: 13, marginTop: 8, fontWeight: '500' },
});
