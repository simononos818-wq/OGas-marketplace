import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ProfileScreen({ navigation }: any) {
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const storedPhone = await AsyncStorage.getItem('ogas_phone');
    const storedName = await AsyncStorage.getItem('ogas_name');
    const storedAddress = await AsyncStorage.getItem('ogas_address');
    if (storedPhone) setPhone(storedPhone);
    if (storedName) setName(storedName);
    if (storedAddress) setAddress(storedAddress);
  };

  const saveData = async () => {
    await AsyncStorage.setItem('ogas_phone', phone);
    await AsyncStorage.setItem('ogas_name', name);
    await AsyncStorage.setItem('ogas_address', address);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const clearData = async () => {
    Alert.alert(
      'Clear Data?',
      'This will remove your saved phone, name and address.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.multiRemove(['ogas_phone', 'ogas_name', 'ogas_address']);
            setPhone('');
            setName('');
            setAddress('');
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.title}>👤 Profile</Text>

      {/* Saved Info Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>💾 Your Information</Text>
        <Text style={styles.label}>Phone Number</Text>
        <TextInput
          value={phone}
          onChangeText={setPhone}
          placeholder="08012345678"
          placeholderTextColor="#6b7280"
          keyboardType="phone-pad"
          style={styles.input}
        />
        <Text style={styles.label}>Your Name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Simon Onos"
          placeholderTextColor="#6b7280"
          style={styles.input}
        />
        <Text style={styles.label}>Default Address</Text>
        <TextInput
          value={address}
          onChangeText={setAddress}
          placeholder="Your address in Oteri/Ughelli"
          placeholderTextColor="#6b7280"
          style={styles.input}
        />
        <TouchableOpacity onPress={saveData} style={styles.saveButton}>
          <Text style={styles.saveButtonText}>{saved ? '✓ Saved!' : 'Save Details'}</Text>
        </TouchableOpacity>
        {(phone || name || address) && (
          <TouchableOpacity onPress={clearData} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>Clear Saved Data</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Quick Links */}
      <Text style={styles.sectionTitle}>Quick Links</Text>

      <TouchableOpacity onPress={() => navigation.navigate('Orders')} style={styles.linkCard}>
        <View style={styles.linkLeft}>
          <Text style={styles.linkEmoji}>📦</Text>
          <View>
            <Text style={styles.linkTitle}>My Orders</Text>
            <Text style={styles.linkDesc}>Track all your gas orders</Text>
          </View>
        </View>
        <Text style={styles.linkArrow}>→</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Buy')} style={styles.linkCard}>
        <View style={styles.linkLeft}>
          <Text style={styles.linkEmoji}>🔥</Text>
          <View>
            <Text style={styles.linkTitle}>Order Gas</Text>
            <Text style={styles.linkDesc}>Buy LPG from nearby sellers</Text>
          </View>
        </View>
        <Text style={styles.linkArrow}>→</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Home')} style={styles.linkCard}>
        <View style={styles.linkLeft}>
          <Text style={styles.linkEmoji}>🏪</Text>
          <View>
            <Text style={styles.linkTitle}>Become a Seller</Text>
            <Text style={styles.linkDesc}>Start selling gas on OGas</Text>
          </View>
        </View>
        <Text style={styles.linkArrow}>→</Text>
      </TouchableOpacity>

      {/* App Info */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>💡 About OGas</Text>
        <Text style={styles.infoText}>
          OGas connects you with LPG gas sellers in your area. Order for delivery or pickup. 
          Cash on delivery available. Built with 🔥 in Delta State, Nigeria.
        </Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoMeta}>v1.0.0</Text>
          <Text style={styles.infoMeta}>•</Text>
          <Text style={styles.infoMeta}>ogasapp.web.app</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  title: { color: '#fff', fontSize: 24, fontWeight: 'bold', padding: 16, paddingTop: 8 },
  card: { backgroundColor: '#111', borderRadius: 16, padding: 16, marginHorizontal: 16, marginBottom: 16, borderWidth: 1, borderColor: '#222' },
  cardTitle: { color: '#fff', fontWeight: 'bold', fontSize: 15, marginBottom: 12 },
  label: { color: '#9ca3af', fontSize: 12, marginBottom: 4, marginTop: 8 },
  input: { backgroundColor: '#000', borderWidth: 1, borderColor: '#333', borderRadius: 12, padding: 14, color: '#fff', fontSize: 15 },
  saveButton: { backgroundColor: '#f97316', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 14 },
  saveButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  clearButton: { marginTop: 10, alignItems: 'center' },
  clearButtonText: { color: '#ef4444', fontSize: 13 },
  sectionTitle: { color: '#fff', fontWeight: 'bold', fontSize: 16, paddingHorizontal: 16, marginBottom: 10, marginTop: 4 },
  linkCard: { backgroundColor: '#111', borderRadius: 16, padding: 16, marginHorizontal: 16, marginBottom: 10, borderWidth: 1, borderColor: '#222', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  linkLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  linkEmoji: { fontSize: 24 },
  linkTitle: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  linkDesc: { color: '#6b7280', fontSize: 12, marginTop: 1 },
  linkArrow: { color: '#6b7280', fontSize: 18 },
  infoCard: { backgroundColor: '#111', borderRadius: 16, padding: 16, marginHorizontal: 16, marginTop: 6, borderWidth: 1, borderColor: '#222' },
  infoTitle: { color: '#fff', fontWeight: 'bold', fontSize: 14, marginBottom: 8 },
  infoText: { color: '#9ca3af', fontSize: 12, lineHeight: 18 },
  infoRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  infoMeta: { color: '#4b5563', fontSize: 11 },
});
