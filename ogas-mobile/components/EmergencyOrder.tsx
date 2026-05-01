import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import * as Location from 'expo-location';
import { router } from 'expo-router';

export default function EmergencyOrder() {
  const handleEmergencyOrder = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required for emergency orders');
        return;
      }

      let pos = await Location.getCurrentPositionAsync({});
      
      // Navigate to checkout with emergency params
      router.push({
        pathname: '/order/checkout',
        params: {
          emergency: 'true',
          lat: pos.coords.latitude.toString(),
          lng: pos.coords.longitude.toString()
        }
      });
    } catch (error) {
      Alert.alert('Error', 'Could not get your location');
    }
  };

  return (
    <TouchableOpacity style={styles.button} onPress={handleEmergencyOrder}>
      <Text style={styles.text}>🚨 Emergency Gas Delivery</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#FF4444',
    padding: 16,
    borderRadius: 8,
    margin: 16,
    alignItems: 'center'
  },
  text: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16
  }
});
