import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen() {
  const { user, userData } = useAuth();
  const router = useRouter();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Hello, {userData?.fullName?.split(' ')[0] || 'Guest'} 👋</Text>
        <Text style={styles.subtitle}>Nigeria's LPG Marketplace</Text>
      </View>

      {!user && (
        <View style={styles.authBanner}>
          <Text style={styles.authText}>Sign in to order gas and track your deliveries</Text>
          <View style={styles.authButtons}>
            <TouchableOpacity style={styles.authBtn} onPress={() => router.push('/auth/login')}>
              <Text style={styles.authBtnText}>Sign In</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.authBtn, styles.authBtnOutline]} onPress={() => router.push('/auth/register')}>
              <Text style={[styles.authBtnText, styles.authBtnTextOutline]}>Register</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <TouchableOpacity 
        style={styles.starterKitBanner}
        onPress={() => router.push('/screens/OGasKit/StarterKitHomeScreen')}
      >
        <View style={styles.starterKitContent}>
          <Ionicons name="flame" size={32} color="#fff" />
          <View style={styles.starterKitTextContainer}>
            <Text style={styles.starterKitTitle}>Start Your LPG Business</Text>
            <Text style={styles.starterKitSubtitle}>
              Complete starter kits from ₦250,000 • Nationwide delivery
            </Text>
          </View>
          <Ionicons name="arrow-forward" size={24} color="#fff" />
        </View>
      </TouchableOpacity>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.card} onPress={() => router.push('/(tabs)/lpg-calculator')}>
          <Ionicons name="calculator" size={32} color="#FF6B35" />
          <Text style={styles.cardTitle}>Price Calculator</Text>
          <Text style={styles.cardDesc}>Calculate LPG costs instantly</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={() => router.push('/(app)/buyer/sellers')}>
          <Ionicons name="people" size={32} color="#FF6B35" />
          <Text style={styles.cardTitle}>Find Sellers</Text>
          <Text style={styles.cardDesc}>Browse nearby LPG sellers</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={() => user ? router.push('/(tabs)/orders') : router.push('/auth/login')}>
          <Ionicons name="list" size={32} color="#FF6B35" />
          <Text style={styles.cardTitle}>My Orders</Text>
          <Text style={styles.cardDesc}>Track your gas deliveries</Text>
        </TouchableOpacity>

        {userData?.role === 'seller' && (
          <TouchableOpacity style={[styles.card, styles.sellerCard]} onPress={() => router.push('/(app)/seller/dashboard')}>
            <Ionicons name="storefront" size={32} color="#fff" />
            <Text style={[styles.cardTitle, { color: '#fff' }]}>Seller Dashboard</Text>
            <Text style={[styles.cardDesc, { color: 'rgba(255,255,255,0.8)' }]}>Manage your listings & orders</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { padding: 24, paddingTop: 60, backgroundColor: '#FF6B35' },
  greeting: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 16, color: 'rgba(255,255,255,0.85)', marginTop: 4 },
  authBanner: { margin: 16, backgroundColor: '#fff', borderRadius: 12, padding: 20, borderLeftWidth: 4, borderLeftColor: '#FF6B35' },
  authText: { color: '#444', fontSize: 15, marginBottom: 16, lineHeight: 22 },
  authButtons: { flexDirection: 'row', gap: 12 },
  authBtn: { flex: 1, backgroundColor: '#FF6B35', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  authBtnOutline: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#FF6B35' },
  authBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  authBtnTextOutline: { color: '#FF6B35' },
  starterKitBanner: { margin: 16, marginTop: 8, backgroundColor: '#1A1A2E', borderRadius: 16, padding: 20, borderWidth: 2, borderColor: '#FF6B35', shadowColor: '#FF6B35', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  starterKitContent: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  starterKitTextContainer: { flex: 1 },
  starterKitTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  starterKitSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  actions: { padding: 16, gap: 12 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 20, borderWidth: 1, borderColor: '#eee', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  sellerCard: { backgroundColor: '#FF6B35', borderColor: '#FF6B35' },
  cardTitle: { fontSize: 18, fontWeight: '600', marginTop: 12, color: '#333' },
  cardDesc: { fontSize: 14, color: '#666', marginTop: 4 },
});
