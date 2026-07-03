import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

export function LegalLinks() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <TouchableOpacity onPress={() => router.push('/terms')}>
          <Text style={styles.link}>Terms of Service</Text>
        </TouchableOpacity>
        <Text style={styles.dot}>•</Text>
        <TouchableOpacity onPress={() => router.push('/privacy')}>
          <Text style={styles.link}>Privacy Policy</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.copyright}>© 2026 OGas LPG Marketplace. All rights reserved.</Text>
      <Text style={styles.publisher}>Operated by Simon Onos</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#1a1a1a',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  link: { color: '#ff6b35', fontSize: 13, fontWeight: '500' },
  dot: { color: '#444', fontSize: 13 },
  copyright: { color: '#555', fontSize: 11, marginTop: 4 },
  publisher: { color: '#444', fontSize: 10, marginTop: 2 },
});
