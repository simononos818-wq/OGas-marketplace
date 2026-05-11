import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { OGasColors, waybillCosts } from './OGasKitData';

export default function CheckoutScreen({ route, navigation }: any) {
  const { items, total } = route.params || { items: [], total: 0 };
  
  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'waybill'>('pickup');
  const [location, setLocation] = useState('Delta State');
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  const waybillCost = deliveryMethod === 'waybill' ? (waybillCosts[location] || 10000) : 0;
  const finalTotal = total + waybillCost;

  const handlePayment = () => {
    if (!customerName || !phone) {
      Alert.alert('Required Fields', 'Please enter your name and phone number');
      return;
    }
    
    if (deliveryMethod === 'waybill' && !address) {
      Alert.alert('Required Field', 'Please enter your delivery address');
      return;
    }

    // TODO: Integrate Paystack here
    // For now, show order summary
    Alert.alert(
      'Order Ready',
      `Total: ₦${finalTotal.toLocaleString()}\n\nPaystack integration coming next.`,
      [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={[OGasColors.primary, OGasColors.secondary]}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>🛒 Checkout</Text>
        <Text style={styles.headerSubtitle}>Complete your OGas Starter Kit order</Text>
      </LinearGradient>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Order Summary</Text>
        {items.map((item: any, index: number) => (
          <View key={index} style={styles.orderItem}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemPrice}>₦{item.price.toLocaleString()}</Text>
          </View>
        ))}
        <View style={styles.divider} />
        <View style={styles.orderItem}>
          <Text style={styles.itemName}>Subtotal</Text>
          <Text style={styles.itemPrice}>₦{total.toLocaleString()}</Text>
        </View>
        <View style={styles.orderItem}>
          <Text style={styles.itemName}>Waybill ({location})</Text>
          <Text style={styles.itemPrice}>₦{waybillCost.toLocaleString()}</Text>
        </View>
        <View style={[styles.orderItem, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalPrice}>₦{finalTotal.toLocaleString()}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Customer Details</Text>
        <TextInput
          style={styles.input}
          placeholder="Full Name *"
          placeholderTextColor={OGasColors.textMuted}
          value={customerName}
          onChangeText={setCustomerName}
        />
        <TextInput
          style={styles.input}
          placeholder="Phone Number *"
          placeholderTextColor={OGasColors.textMuted}
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Delivery Method</Text>
        <TouchableOpacity
          style={[styles.methodButton, deliveryMethod === 'pickup' && styles.methodActive]}
          onPress={() => setDeliveryMethod('pickup')}
        >
          <Text style={[styles.methodText, deliveryMethod === 'pickup' && styles.methodTextActive]}>
            📍 Self Pickup (Ughelli) - FREE
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.methodButton, deliveryMethod === 'waybill' && styles.methodActive]}
          onPress={() => setDeliveryMethod('waybill')}
        >
          <Text style={[styles.methodText, deliveryMethod === 'waybill' && styles.methodTextActive]}>
            🚚 Waybill to Any Location
          </Text>
        </TouchableOpacity>
      </View>

      {deliveryMethod === 'waybill' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Location</Text>
          {Object.keys(waybillCosts).map((loc) => (
            <TouchableOpacity
              key={loc}
              style={[styles.locationButton, location === loc && styles.locationActive]}
              onPress={() => setLocation(loc)}
            >
              <Text style={styles.locationText}>{loc}</Text>
              <Text style={styles.locationCost}>₦{waybillCosts[loc].toLocaleString()}</Text>
            </TouchableOpacity>
          ))}
          <TextInput
            style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
            placeholder="Full Delivery Address *"
            placeholderTextColor={OGasColors.textMuted}
            value={address}
            onChangeText={setAddress}
            multiline
            numberOfLines={3}
          />
        </View>
      )}

      <TouchableOpacity style={styles.payButton} onPress={handlePayment}>
        <LinearGradient
          colors={[OGasColors.primary, OGasColors.secondary]}
          style={styles.payGradient}
        >
          <Text style={styles.payText}>Pay ₦{finalTotal.toLocaleString()} via Paystack</Text>
        </LinearGradient>
      </TouchableOpacity>

      <View style={styles.securityNote}>
        <Text style={styles.securityText}>
          🔒 Secured by Paystack. Your payment is protected.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: OGasColors.darker,
  },
  header: {
    padding: 24,
    paddingTop: 60,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: OGasColors.text,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginTop: 8,
  },
  section: {
    padding: 20,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: OGasColors.text,
    marginBottom: 16,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  itemName: {
    fontSize: 14,
    color: OGasColors.textMuted,
    flex: 1,
    marginRight: 10,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: OGasColors.text,
  },
  divider: {
    height: 1,
    backgroundColor: OGasColors.border,
    marginVertical: 12,
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: OGasColors.primary,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: OGasColors.text,
  },
  totalPrice: {
    fontSize: 22,
    fontWeight: 'bold',
    color: OGasColors.primary,
  },
  input: {
    backgroundColor: OGasColors.card,
    borderRadius: 12,
    padding: 14,
    color: OGasColors.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: OGasColors.border,
    marginBottom: 12,
  },
  methodButton: {
    backgroundColor: OGasColors.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: OGasColors.border,
  },
  methodActive: {
    borderColor: OGasColors.primary,
    backgroundColor: 'rgba(255,107,53,0.1)',
  },
  methodText: {
    color: OGasColors.textMuted,
    fontSize: 14,
  },
  methodTextActive: {
    color: OGasColors.primary,
    fontWeight: '600',
  },
  locationButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: OGasColors.card,
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: OGasColors.border,
  },
  locationActive: {
    borderColor: OGasColors.primary,
    backgroundColor: 'rgba(255,107,53,0.1)',
  },
  locationText: {
    color: OGasColors.text,
    fontSize: 14,
  },
  locationCost: {
    color: OGasColors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  payButton: {
    margin: 20,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 5,
  },
  payGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  payText: {
    color: OGasColors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  securityNote: {
    alignItems: 'center',
    marginBottom: 30,
  },
  securityText: {
    color: OGasColors.textMuted,
    fontSize: 12,
  },
});
