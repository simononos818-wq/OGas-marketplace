import React from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';

export default function PrivacyScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft color="#fff" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.lastUpdated}>Last Updated: July 3, 2026</Text>

        <Text style={styles.sectionTitle}>1. Introduction</Text>
        <Text style={styles.paragraph}>
          OGas LPG Marketplace ("OGas", "we", "us") respects your privacy. This Privacy Policy explains how we collect, use, store, and protect your personal information when you use our mobile application and services.
        </Text>

        <Text style={styles.sectionTitle}>2. Information We Collect</Text>
        <Text style={styles.paragraph}>
          <Text style={styles.bold}>Account Information:</Text> Name, phone number, email address, profile photo{'\n\n'}
          <Text style={styles.bold}>Location Data:</Text> Delivery address, GPS coordinates (with permission){'\n\n'}
          <Text style={styles.bold}>Transaction Data:</Text> Order history, payment records, wallet addresses{'\n\n'}
          <Text style={styles.bold}>Device Information:</Text> Device type, OS version, app version, IP address{'\n\n'}
          <Text style={styles.bold}>KYC Documents:</Text> Business registration (sellers only), ID verification
        </Text>

        <Text style={styles.sectionTitle}>3. How We Use Your Information</Text>
        <Text style={styles.paragraph}>
          • Facilitate orders and payments{'\n'}
          • Verify seller identity and prevent fraud{'\n'}
          • Send order notifications and updates{'\n'}
          • Improve app performance and user experience{'\n'}
          • Comply with legal obligations{'\n'}
          • Resolve disputes between buyers and sellers
        </Text>

        <Text style={styles.sectionTitle}>4. Data Storage & Security</Text>
        <Text style={styles.paragraph}>
          Your data is stored on Firebase (Google Cloud Platform) with encryption at rest and in transit. We use industry-standard security measures including SSL/TLS, Firebase Authentication, and Firestore Security Rules. Wallet private keys are NEVER stored by OGas — they remain on your device.
        </Text>

        <Text style={styles.sectionTitle}>5. Data Sharing</Text>
        <Text style={styles.paragraph}>
          We share data only with:{'\n\n'}
          • <Text style={styles.bold}>Paystack</Text> — for payment processing{'\n'}
          • <Text style={styles.bold}>Celo Network</Text> — for blockchain transactions{'\n'}
          • <Text style={styles.bold}>Firebase/Google</Text> — for cloud infrastructure{'\n'}
          • <Text style={styles.bold}>Law enforcement</Text> — when legally required{'\n\n'}
          We do NOT sell your personal data to third parties.
        </Text>

        <Text style={styles.sectionTitle}>6. Your Rights</Text>
        <Text style={styles.paragraph}>
          • <Text style={styles.bold}>Access:</Text> Request a copy of your data{'\n'}
          • <Text style={styles.bold}>Correction:</Text> Update inaccurate information{'\n'}
          • <Text style={styles.bold}>Deletion:</Text> Request account deletion{'\n'}
          • <Text style={styles.bold}>Opt-out:</Text> Disable marketing notifications{'\n\n'}
          To exercise these rights, contact support@ogaslpgmarketplace.com
        </Text>

        <Text style={styles.sectionTitle}>7. Cookies & Tracking</Text>
        <Text style={styles.paragraph}>
          Our web version uses essential cookies for authentication and session management. We do not use third-party tracking cookies for advertising.
        </Text>

        <Text style={styles.sectionTitle}>8. Children's Privacy</Text>
        <Text style={styles.paragraph}>
          OGas is not intended for users under 18. We do not knowingly collect data from minors. If you believe a child has provided us data, contact us immediately.
        </Text>

        <Text style={styles.sectionTitle}>9. Data Retention</Text>
        <Text style={styles.paragraph}>
          We retain transaction records for 7 years for legal compliance. Account data is deleted within 30 days of account closure, except where retention is required by law.
        </Text>

        <Text style={styles.sectionTitle}>10. Changes to This Policy</Text>
        <Text style={styles.paragraph}>
          We may update this policy. Significant changes will be notified via in-app notification and email.
        </Text>

        <Text style={styles.sectionTitle}>11. Contact Us</Text>
        <Text style={styles.paragraph}>
          Data Protection Officer: Simon Onos{'\n'}
          Email: support@ogaslpgmarketplace.com{'\n'}
          Address: Oteri, Ughelli, Delta State, Nigeria
        </Text>

        <TouchableOpacity onPress={() => Linking.openURL('mailto:support@ogaslpgmarketplace.com')}>
          <Text style={styles.link}>support@ogaslpgmarketplace.com</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  backBtn: { padding: 4 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  scroll: { flex: 1 },
  content: { padding: 20 },
  lastUpdated: { color: '#666', fontSize: 12, marginBottom: 20 },
  sectionTitle: { color: '#ff6b35', fontSize: 16, fontWeight: '700', marginTop: 24, marginBottom: 8 },
  paragraph: { color: '#ccc', fontSize: 14, lineHeight: 22 },
  bold: { color: '#fff', fontWeight: '600' },
  link: { color: '#4fc3f7', fontSize: 14, marginTop: 4, textDecorationLine: 'underline' },
});
