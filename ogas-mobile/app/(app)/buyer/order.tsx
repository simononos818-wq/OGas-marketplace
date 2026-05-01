import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../../contexts/AuthContext';
import { db } from '../../../config/firebase';
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Package, MapPin, Truck, Check } from 'lucide-react-native';

type InventoryItem = { cylinderSize: string; price: number; stock: number; available: boolean };
type DeliveryZone = { area: string; fee: number; available: boolean };
type Seller = { id: string; businessName: string; phone: string; address: string; city: string };

export default function PlaceOrder() {
  const { user } = useAuth();
  const router = useRouter();
  const { sid } = useLocalSearchParams();
  const [seller, setSeller] = useState<Seller | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>([]);
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [selectedDelivery, setSelectedDelivery] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!sid) return;
      const [sellerSnap, invSnap, delSnap] = await Promise.all([
        getDoc(doc(db, 'sellers', sid as string)), getDoc(doc(db, 'sellerInventory', sid as string)), getDoc(doc(db, 'deliveryZones', sid as string))
      ]);
      if (sellerSnap.exists()) setSeller({ id: sellerSnap.id, ...sellerSnap.data() } as Seller);
      if (invSnap.exists()) setInventory(invSnap.data().items.filter((i: InventoryItem) => i.available && i.stock > 0));
      if (delSnap.exists()) setDeliveryZones(delSnap.data().zones.filter((z: DeliveryZone) => z.available));
      setLoading(false);
    };
    fetchData();
  }, [sid]);

  const selectedItem = inventory.find((i) => i.cylinderSize === selectedSize);
  const selectedZone = deliveryZones.find((z) => z.area === selectedDelivery);
  const subtotal = selectedItem ? selectedItem.price * quantity : 0;
  const deliveryFee = selectedZone ? selectedZone.fee : 0;
  const total = subtotal + deliveryFee;

  const placeOrder = async () => {
    if (!user || !seller || !selectedItem || !selectedZone || !deliveryAddress.trim()) { Alert.alert('Error', 'Please fill in all required fields'); return; }
    setPlacingOrder(true);
    try {
      const orderData = {
        userId: user.uid, userName: user.displayName || 'Customer', userPhone: user.phoneNumber || '', userEmail: user.email || '',
        sellerId: seller.id, sellerName: seller.businessName, sellerPhone: seller.phone,
        cylinderSize: selectedItem.cylinderSize, quantity, pricePerCylinder: selectedItem.price,
        subtotal, deliveryFee, totalAmount: total, deliveryArea: selectedZone.area, deliveryAddress,
        status: 'pending', paymentStatus: 'pending', createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
      };
      await addDoc(collection(db, 'orders'), orderData);
      Alert.alert('Order Placed!', `Your order has been sent to ${seller.businessName}. You'll be notified when they confirm.`, [
        { text: 'View Orders', onPress: () => router.push('/buyer/orders') }, { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) { Alert.alert('Error', 'Failed to place order. Please try again.'); }
    finally { setPlacingOrder(false); }
  };

  if (loading) return <SafeAreaView className="flex-1 justify-center items-center"><ActivityIndicator size="large" color="#2563EB" /></SafeAreaView>;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1">
        <View className="bg-white p-4 mb-4"><Text className="text-gray-500 text-sm mb-1">Ordering from</Text><Text className="font-bold text-xl">{seller?.businessName}</Text><View className="flex-row items-center mt-1"><MapPin size={14} color="#6B7280" /><Text className="text-gray-500 text-sm ml-1">{seller?.city}</Text></View></View>
        <View className="bg-white p-4 mb-4"><Text className="font-bold text-lg mb-3">Select Cylinder Size</Text><View className="gap-2">
          {inventory.map((item) => (<TouchableOpacity key={item.cylinderSize} onPress={() => setSelectedSize(item.cylinderSize)} className={`flex-row justify-between items-center p-4 rounded-xl border-2 ${selectedSize === item.cylinderSize ? 'border-blue-600 bg-blue-50' : 'border-gray-100'}`}>
            <View className="flex-row items-center"><Package size={20} color={selectedSize === item.cylinderSize ? '#2563EB' : '#6B7280'} /><View className="ml-3"><Text className={`font-medium ${selectedSize === item.cylinderSize ? 'text-blue-600' : ''}`}>{item.cylinderSize}kg Cylinder</Text><Text className="text-gray-500 text-sm">{item.stock} in stock</Text></View></View>
            <View className="items-end"><Text className={`font-bold text-lg ${selectedSize === item.cylinderSize ? 'text-blue-600' : ''}`}>₦{item.price.toLocaleString()}</Text>{selectedSize === item.cylinderSize && <Check size={20} color="#2563EB" />}</View>
          </TouchableOpacity>))}
        </View></View>
        {selectedSize && <View className="bg-white p-4 mb-4"><Text className="font-bold text-lg mb-3">Quantity</Text><View className="flex-row items-center gap-4">
          <TouchableOpacity onPress={() => setQuantity(Math.max(1, quantity - 1))} className="w-12 h-12 bg-gray-100 rounded-xl items-center justify-center"><Text className="text-xl font-bold">−</Text></TouchableOpacity>
          <Text className="text-2xl font-bold w-12 text-center">{quantity}</Text>
          <TouchableOpacity onPress={() => setQuantity(Math.min(selectedItem?.stock || 1, quantity + 1))} className="w-12 h-12 bg-gray-100 rounded-xl items-center justify-center"><Text className="text-xl font-bold">+</Text></TouchableOpacity>
        </View></View>}
        {selectedSize && <View className="bg-white p-4 mb-4"><Text className="font-bold text-lg mb-3">Delivery Options</Text><View className="gap-2">
          {deliveryZones.map((zone) => (<TouchableOpacity key={zone.area} onPress={() => setSelectedDelivery(zone.area)} className={`flex-row justify-between items-center p-4 rounded-xl border-2 ${selectedDelivery === zone.area ? 'border-blue-600 bg-blue-50' : 'border-gray-100'}`}>
            <View className="flex-row items-center"><Truck size={20} color={selectedDelivery === zone.area ? '#2563EB' : '#6B7280'} /><View className="ml-3"><Text className={`font-medium ${selectedDelivery === zone.area ? 'text-blue-600' : ''}`}>{zone.area}</Text></View></View>
            <View className="items-end"><Text className={`font-bold ${selectedDelivery === zone.area ? 'text-blue-600' : ''}`}>₦{zone.fee.toLocaleString()}</Text>{selectedDelivery === zone.area && <Check size={20} color="#2563EB" />}</View>
          </TouchableOpacity>))}
        </View></View>}
        {selectedDelivery && <View className="bg-white p-4 mb-4"><Text className="font-bold text-lg mb-3">Delivery Address</Text><TextInput className="border border-gray-200 rounded-xl p-4 text-base min-h-[100]" multiline placeholder="Enter your full delivery address..." value={deliveryAddress} onChangeText={setDeliveryAddress} /></View>}
        {selectedSize && <View className="bg-white p-4 mb-8"><Text className="font-bold text-lg mb-3">Order Summary</Text><View className="gap-2 mb-4">
          <View className="flex-row justify-between"><Text className="text-gray-500">{quantity}x {selectedItem?.cylinderSize}kg</Text><Text>₦{subtotal.toLocaleString()}</Text></View>
          <View className="flex-row justify-between"><Text className="text-gray-500">Delivery ({selectedZone?.area})</Text><Text>₦{deliveryFee.toLocaleString()}</Text></View>
          <View className="border-t border-gray-100 pt-2 mt-2"><View className="flex-row justify-between"><Text className="font-bold text-lg">Total</Text><Text className="font-bold text-lg text-blue-600">₦{total.toLocaleString()}</Text></View></View>
        </View>
          <TouchableOpacity onPress={placeOrder} disabled={placingOrder || !deliveryAddress.trim()} className={`py-4 rounded-xl ${placingOrder || !deliveryAddress.trim() ? 'bg-gray-300' : 'bg-blue-600'}`}><Text className="text-white text-center font-bold text-lg">{placingOrder ? 'Placing Order...' : 'Place Order'}</Text></TouchableOpacity>
        </View>}
      </ScrollView>
    </SafeAreaView>
  );
}
