import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Modal, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../../contexts/AuthContext';
import { db } from '../../../config/firebase';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'expo-router';
import { MapPin, Search, Filter, Star, Truck, X } from 'lucide-react-native';

type Seller = { id: string; businessName: string; city: string; state: string; address: string; phone: string; rating: number; totalDeliveries: number; isVerified: boolean };
type InventoryItem = { cylinderSize: string; price: number; stock: number; available: boolean };
type DeliveryZone = { area: string; fee: number; available: boolean };

export default function SellerDiscovery() {
  const { user } = useAuth();
  const router = useRouter();
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [filteredSellers, setFilteredSellers] = useState<Seller[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('All');
  const [selectedCylinder, setSelectedCylinder] = useState('All');
  const [loading, setLoading] = useState(true);
  const [filterModal, setFilterModal] = useState(false);
  const [sellerInventory, setSellerInventory] = useState<Record<string, InventoryItem[]>>({});
  const [sellerDelivery, setSellerDelivery] = useState<Record<string, DeliveryZone[]>>({});

  const cities = ['All', 'Lagos', 'Abuja', 'Port Harcourt', 'Ibadan', 'Kano'];
  const cylinderSizes = ['All', '3kg', '5kg', '6kg', '12.5kg', '25kg', '50kg'];

  useEffect(() => {
    const q = query(collection(db, 'sellers'), where('isVerified', '==', true));
    const unsub = onSnapshot(q, async (snapshot) => {
      const sellersData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Seller[];
      setSellers(sellersData); setFilteredSellers(sellersData);
      const inventoryData: Record<string, InventoryItem[]> = {};
      const deliveryData: Record<string, DeliveryZone[]> = {};
      for (const seller of sellersData) {
        const [invSnap, delSnap] = await Promise.all([getDoc(doc(db, 'sellerInventory', seller.id)), getDoc(doc(db, 'deliveryZones', seller.id))]);
        if (invSnap.exists()) inventoryData[seller.id] = invSnap.data().items || [];
        if (delSnap.exists()) deliveryData[seller.id] = delSnap.data().zones || [];
      }
      setSellerInventory(inventoryData); setSellerDelivery(deliveryData); setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    let filtered = sellers;
    if (searchQuery) filtered = filtered.filter((s) => s.businessName.toLowerCase().includes(searchQuery.toLowerCase()) || s.city.toLowerCase().includes(searchQuery.toLowerCase()) || s.address.toLowerCase().includes(searchQuery.toLowerCase()));
    if (selectedCity !== 'All') filtered = filtered.filter((s) => s.city === selectedCity);
    if (selectedCylinder !== 'All') filtered = filtered.filter((s) => (sellerInventory[s.id] || []).some((item) => item.cylinderSize === selectedCylinder && item.available && item.stock > 0));
    setFilteredSellers(filtered);
  }, [searchQuery, selectedCity, selectedCylinder, sellers, sellerInventory]);

  const getLowestPrice = (sellerId: string) => { const inventory = sellerInventory[sellerId] || []; const prices = inventory.filter((i) => i.available && i.stock > 0).map((i) => i.price); return prices.length > 0 ? Math.min(...prices) : null; };

  const renderSellerCard = ({ item }: { item: Seller }) => {
    const inventory = sellerInventory[item.id] || [];
    const delivery = sellerDelivery[item.id] || [];
    return (
      <TouchableOpacity onPress={() => router.push(`/buyer/order?sid=${item.id}`)} className="bg-white mx-4 mb-4 p-4 rounded-2xl shadow-sm border border-gray-100">
        <View className="flex-row justify-between items-start mb-2">
          <View className="flex-1"><Text className="font-bold text-lg">{item.businessName}</Text><View className="flex-row items-center mt-1"><MapPin size={14} color="#6B7280" /><Text className="text-gray-500 text-sm ml-1">{item.city}, {item.state}</Text></View></View>
          <View className="items-end">{item.isVerified && <View className="bg-blue-100 px-2 py-1 rounded-full mb-1"><Text className="text-blue-600 text-xs font-medium">✓ Verified</Text></View>}<View className="flex-row items-center"><Star size={14} color="#F59E0B" fill="#F59E0B" /><Text className="text-sm ml-1 font-medium">{item.rating || 4.5}</Text><Text className="text-gray-400 text-xs ml-1">({item.totalDeliveries || 0})</Text></View></View>
        </View>
        <View className="flex-row flex-wrap gap-2 my-3">
          {inventory.filter((i) => i.available && i.stock > 0).slice(0, 3).map((inv) => (<View key={inv.cylinderSize} className="bg-gray-50 px-3 py-1 rounded-lg"><Text className="text-sm"><Text className="font-medium">{inv.cylinderSize}kg</Text><Text className="text-green-600 font-bold"> ₦{inv.price.toLocaleString()}</Text></Text></View>))}
          {inventory.filter((i) => i.available && i.stock > 0).length > 3 && <View className="bg-gray-50 px-3 py-1 rounded-lg"><Text className="text-sm text-gray-500">+ more</Text></View>}
        </View>
        <View className="flex-row items-center justify-between pt-3 border-t border-gray-100">
          <View className="flex-row items-center"><Truck size={14} color="#6B7280" /><Text className="text-gray-500 text-xs ml-1">{delivery.filter((d) => d.available).length > 0 ? `Delivery from ₦${Math.min(...delivery.filter((d) => d.available).map((d) => d.fee)).toLocaleString()}` : 'Pickup only'}</Text></View>
          <TouchableOpacity onPress={() => router.push(`/buyer/order?sid=${item.id}`)} className="bg-blue-600 px-4 py-2 rounded-lg"><Text className="text-white font-medium text-sm">Order Now</Text></TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) return <SafeAreaView className="flex-1 justify-center items-center"><ActivityIndicator size="large" color="#2563EB" /><Text className="mt-4 text-gray-500">Finding sellers near you...</Text></SafeAreaView>;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="bg-white px-4 pt-4 pb-3"><Text className="text-2xl font-bold">Find Gas Sellers</Text><Text className="text-gray-500 text-sm">{filteredSellers.length} sellers available</Text></View>
      <View className="bg-white px-4 pb-4">
        <View className="flex-row gap-2">
          <View className="flex-1 flex-row items-center bg-gray-100 rounded-xl px-3"><Search size={18} color="#9CA3AF" /><TextInput className="flex-1 py-3 px-2" placeholder="Search by name, city, area..." value={searchQuery} onChangeText={setSearchQuery} /></View>
          <TouchableOpacity onPress={() => setFilterModal(true)} className="bg-blue-600 p-3 rounded-xl"><Filter size={20} color="#fff" /></TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-3">
          {cities.map((city) => (<TouchableOpacity key={city} onPress={() => setSelectedCity(city === selectedCity ? 'All' : city)} className={`mr-2 px-4 py-2 rounded-full ${selectedCity === city ? 'bg-blue-600' : 'bg-gray-100'}`}><Text className={`text-sm font-medium ${selectedCity === city ? 'text-white' : 'text-gray-600'}`}>{city}</Text></TouchableOpacity>))}
        </ScrollView>
      </View>
      <FlatList data={filteredSellers} renderItem={renderSellerCard} keyExtractor={(item) => item.id} contentContainerStyle={{ paddingTop: 16, paddingBottom: 32 }} ListEmptyComponent={<View className="items-center py-12 px-8"><Search size={48} color="#D1D5DB" /><Text className="text-gray-400 mt-4 text-lg text-center">No sellers found matching your criteria</Text></View>} />
      <Modal visible={filterModal} animationType="slide" transparent>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6">
            <View className="flex-row justify-between items-center mb-6"><Text className="text-xl font-bold">Filters</Text><TouchableOpacity onPress={() => setFilterModal(false)}><X size={24} color="#374151" /></TouchableOpacity></View>
            <Text className="font-medium mb-3">Cylinder Size</Text>
            <View className="flex-row flex-wrap gap-2 mb-6">{cylinderSizes.map((size) => (<TouchableOpacity key={size} onPress={() => setSelectedCylinder(size === selectedCylinder ? 'All' : size)} className={`px-4 py-2 rounded-full border ${selectedCylinder === size ? 'bg-blue-600 border-blue-600' : 'border-gray-200'}`}><Text className={selectedCylinder === size ? 'text-white' : 'text-gray-600'}>{size === 'All' ? 'Any Size' : `${size}kg`}</Text></TouchableOpacity>))}</View>
            <Text className="font-medium mb-3">City</Text>
            <View className="flex-row flex-wrap gap-2 mb-6">{cities.map((city) => (<TouchableOpacity key={city} onPress={() => setSelectedCity(city === selectedCity ? 'All' : city)} className={`px-4 py-2 rounded-full border ${selectedCity === city ? 'bg-blue-600 border-blue-600' : 'border-gray-200'}`}><Text className={selectedCity === city ? 'text-white' : 'text-gray-600'}>{city}</Text></TouchableOpacity>))}</View>
            <TouchableOpacity onPress={() => { setSelectedCity('All'); setSelectedCylinder('All'); setSearchQuery(''); }} className="py-3 rounded-xl border border-gray-200 mb-3"><Text className="text-center text-gray-600 font-medium">Reset All Filters</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => setFilterModal(false)} className="bg-blue-600 py-4 rounded-xl"><Text className="text-white text-center font-bold text-lg">Show Results</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
