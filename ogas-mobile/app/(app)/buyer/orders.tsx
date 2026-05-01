import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../../contexts/AuthContext';
import { db } from '../../../config/firebase';
import { collection, query, where, onSnapshot, orderBy, Timestamp } from 'firebase/firestore';
import { useRouter } from 'expo-router';
import { Package, Clock, CheckCircle, Truck, XCircle, ChevronRight } from 'lucide-react-native';

type Order = {
  id: string; sellerName: string; sellerPhone: string; cylinderSize: string;
  quantity: number; totalAmount: number; deliveryAddress: string;
  status: 'pending' | 'confirmed' | 'out_for_delivery' | 'delivered' | 'cancelled';
  paymentStatus: 'paid' | 'pending'; createdAt: Timestamp;
};

export default function BuyerOrders() {
  const { user } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'orders'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => { setOrders(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Order[]); setLoading(false); });
    return () => unsub();
  }, [user]);

  const filteredOrders = orders.filter((order) => {
    if (activeFilter === 'active') return ['pending', 'confirmed', 'out_for_delivery'].includes(order.status);
    if (activeFilter === 'completed') return ['delivered', 'cancelled'].includes(order.status);
    return true;
  });

  const getStatusIcon = (status: string) => {
    switch (status) { case 'pending': return <Clock size={20} color="#F59E0B" />; case 'confirmed': return <CheckCircle size={20} color="#3B82F6" />; case 'out_for_delivery': return <Truck size={20} color="#F97316" />; case 'delivered': return <CheckCircle size={20} color="#10B981" />; case 'cancelled': return <XCircle size={20} color="#EF4444" />; default: return <Package size={20} color="#6B7280" />; }
  };

  const getStatusColor = (status: string) => {
    switch (status) { case 'pending': return 'text-yellow-600 bg-yellow-50'; case 'confirmed': return 'text-blue-600 bg-blue-50'; case 'out_for_delivery': return 'text-orange-600 bg-orange-50'; case 'delivered': return 'text-green-600 bg-green-50'; case 'cancelled': return 'text-red-600 bg-red-50'; default: return 'text-gray-600 bg-gray-50'; }
  };

  const renderOrder = ({ item }: { item: Order }) => (
    <TouchableOpacity onPress={() => router.push(`/order/tracking?id=${item.id}`)} className="bg-white mx-4 mb-3 p-4 rounded-2xl shadow-sm border border-gray-100">
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-row items-center">{getStatusIcon(item.status)}<View className="ml-3"><Text className="font-bold text-lg">{item.sellerName}</Text><Text className="text-gray-500 text-sm">{item.cylinderSize}kg × {item.quantity}</Text></View></View>
        <View className={`px-3 py-1 rounded-full ${getStatusColor(item.status)}`}><Text className="text-xs font-medium capitalize">{item.status.replace('_', ' ')}</Text></View>
      </View>
      <View className="flex-row justify-between items-center pt-3 border-t border-gray-100">
        <View><Text className="font-bold text-lg">₦{item.totalAmount.toLocaleString()}</Text><Text className={`text-xs ${item.paymentStatus === 'paid' ? 'text-green-600' : 'text-orange-500'}`}>{item.paymentStatus === 'paid' ? '✓ Paid' : '⏳ Pending Payment'}</Text></View>
        <ChevronRight size={20} color="#9CA3AF" />
      </View>
    </TouchableOpacity>
  );

  if (loading) return <SafeAreaView className="flex-1 justify-center items-center"><ActivityIndicator size="large" color="#2563EB" /></SafeAreaView>;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="bg-white px-4 pt-4 pb-3"><Text className="text-2xl font-bold">My Orders</Text><Text className="text-gray-500 text-sm">{orders.length} total orders</Text></View>
      <View className="bg-white px-4 pb-3 flex-row gap-2">
        {[{ key: 'all', label: 'All' }, { key: 'active', label: 'Active' }, { key: 'completed', label: 'Completed' }].map((filter) => (
          <TouchableOpacity key={filter.key} onPress={() => setActiveFilter(filter.key as "all" | "active" | "completed")} className={`px-4 py-2 rounded-full ${activeFilter === filter.key ? 'bg-blue-600' : 'bg-gray-100'}`}><Text className={`text-sm font-medium ${activeFilter === filter.key ? 'text-white' : 'text-gray-600'}`}>{filter.label}</Text></TouchableOpacity>
        ))}
      </View>
      <FlatList data={filteredOrders} renderItem={renderOrder} keyExtractor={(item) => item.id} contentContainerStyle={{ paddingTop: 16, paddingBottom: 32 }} ListEmptyComponent={
        <View className="items-center py-12 px-8"><Package size={48} color="#D1D5DB" /><Text className="text-gray-400 mt-4 text-lg text-center">No orders found</Text><TouchableOpacity onPress={() => router.push('/buyer/sellers')} className="mt-4 bg-blue-600 px-6 py-3 rounded-xl"><Text className="text-white font-medium">Find Sellers</Text></TouchableOpacity></View>
      } />
    </SafeAreaView>
  );
}
