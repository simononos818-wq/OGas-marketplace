import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useOrder } from '../../contexts/OrderContext';
import { useAuth } from '../../contexts/AuthContext';
import { Truck, Package, CheckCircle, Clock, MapPin, ArrowLeft } from 'lucide-react-native';
import { useEffect, useState } from 'react';

export default function OrderTrackingScreen() {
  const router = useRouter();
  const { orders, loading } = useOrder();
  const auth = useAuth(); const user = auth?.user;
  const [activeOrders, setActiveOrders] = useState([]);

  useEffect(() => {
    // Filter active orders (pending, confirmed, out_for_delivery)
    const active = orders.filter(order => 
      ['pending', 'confirmed', 'out_for_delivery'].includes(order.status)
    );
    setActiveOrders(active);
  }, [orders]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock size={24} color="#FFA500" />;
      case 'confirmed':
        return <CheckCircle size={24} color="#4CAF50" />;
      case 'out_for_delivery':
        return <Truck size={24} color="#2196F3" />;
      case 'delivered':
        return <Package size={24} color="#4CAF50" />;
      default:
        return <Clock size={24} color="#999" />;
    }
  };

  const getStatusText = (status) => {
    const statusMap = {
      pending: 'Order Pending',
      confirmed: 'Order Confirmed',
      out_for_delivery: 'Out for Delivery',
      delivered: 'Delivered',
      cancelled: 'Cancelled'
    };
    return statusMap[status] || status;
  };

  const renderOrderCard = (order) => (
    <View key={order.id} style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View style={styles.orderIdContainer}>
          <Text style={styles.orderId}>Order #{order.id.slice(-6)}</Text>
          <Text style={styles.orderDate}>
            {new Date(order.createdAt?.toDate()).toLocaleDateString()}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
          {getStatusIcon(order.status)}
          <Text style={styles.statusText}>{getStatusText(order.status)}</Text>
        </View>
      </View>

      <View style={styles.orderDetails}>
        <Text style={styles.detailText}>
          {order.items?.length || 0} items • ₦{order.total?.toLocaleString()}
        </Text>
        <Text style={styles.sellerText}>
          From: {order.sellerName || 'Unknown Seller'}
        </Text>
      </View>

      {/* Progress Steps */}
      <View style={styles.progressContainer}>
        <View style={styles.progressStep}>
          <View style={[styles.stepCircle, order.status !== 'cancelled' && styles.stepActive]}>
            <CheckCircle size={16} color="#fff" />
          </View>
          <Text style={styles.stepText}>Ordered</Text>
        </View>
        <View style={styles.progressLine} />
        <View style={styles.progressStep}>
          <View style={[styles.stepCircle, ['confirmed', 'out_for_delivery', 'delivered'].includes(order.status) && styles.stepActive]}>
            <Package size={16} color="#fff" />
          </View>
          <Text style={styles.stepText}>Confirmed</Text>
        </View>
        <View style={styles.progressLine} />
        <View style={styles.progressStep}>
          <View style={[styles.stepCircle, ['out_for_delivery', 'delivered'].includes(order.status) && styles.stepActive]}>
            <Truck size={16} color="#fff" />
          </View>
          <Text style={styles.stepText}>Delivery</Text>
        </View>
        <View style={styles.progressLine} />
        <View style={styles.progressStep}>
          <View style={[styles.stepCircle, order.status === 'delivered' && styles.stepActive]}>
            <MapPin size={16} color="#fff" />
          </View>
          <Text style={styles.stepText}>Delivered</Text>
        </View>
      </View>

      {/* Delivery Info */}
      {order.status === 'out_for_delivery' && (
        <View style={styles.deliveryInfo}>
          <Text style={styles.deliveryText}>Your order is on the way!</Text>
          <Text style={styles.etaText}>Estimated arrival: 30-45 mins</Text>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.trackButton}>
          <MapPin size={18} color="#FF6B35" />
          <Text style={styles.trackButtonText}>Track on Map</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.contactButton}>
          <Text style={styles.contactButtonText}>Contact Seller</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const getStatusColor = (status) => {
    const colors = {
      pending: '#FFF3E0',
      confirmed: '#E8F5E9',
      out_for_delivery: '#E3F2FD',
      delivered: '#E8F5E9',
      cancelled: '#FFEBEE'
    };
    return colors[status] || '#F5F5F5';
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order Tracking</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Please login to view your orders</Text>
          <TouchableOpacity 
            style={styles.loginButton}
            onPress={() => router.push('/auth/login')}
          >
            <Text style={styles.loginButtonText}>Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Tracking</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {activeOrders.length === 0 ? (
          <View style={styles.emptyState}>
            <Truck size={64} color="#ccc" />
            <Text style={styles.emptyText}>No active orders</Text>
            <Text style={styles.emptySubtext}>
              Your active orders will appear here
            </Text>
            <TouchableOpacity 
              style={styles.orderButton}
              onPress={() => router.push('/(tabs)')}
            >
              <Text style={styles.orderButtonText}>Order Gas Now</Text>
            </TouchableOpacity>
          </View>
        ) : (
          activeOrders.map(renderOrderCard)
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    padding: 15,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  orderIdContainer: {
    flex: 1,
  },
  orderId: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  orderDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  orderDetails: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 15,
    marginBottom: 15,
  },
  detailText: {
    fontSize: 16,
    color: '#333',
  },
  sellerText: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  progressStep: {
    alignItems: 'center',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepActive: {
    backgroundColor: '#FF6B35',
  },
  stepText: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  progressLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 5,
  },
  deliveryInfo: {
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
  },
  deliveryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976D2',
  },
  etaText: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  trackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF6B35',
  },
  trackButtonText: {
    color: '#FF6B35',
    marginLeft: 8,
    fontWeight: '600',
  },
  contactButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  contactButtonText: {
    color: '#333',
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 100,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
    textAlign: 'center',
  },
  orderButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 40,
    marginTop: 30,
  },
  orderButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 40,
    marginTop: 20,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
