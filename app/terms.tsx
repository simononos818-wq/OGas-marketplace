import React from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';

export default function TermsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft color="#fff" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms of Service</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.lastUpdated}>Last Updated: July 3, 2026</Text>

        <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
        <Text style={styles.paragraph}>
          By accessing or using OGas LPG Marketplace ("OGas", "we", "us", or "our"), you agree to be bound by these Terms of Service. If you do not agree, do not use our services.
        </Text>

        <Text style={styles.sectionTitle}>2. Description of Service</Text>
        <Text style={styles.paragraph}>
          OGas is a peer-to-peer marketplace connecting LPG (cooking gas) buyers with verified sellers in Nigeria. We facilitate order placement, payment processing via Paystack and Celo stablecoins, and delivery coordination. OGas is not a gas supplier — we are a technology platform.
        </Text>

        <Text style={styles.sectionTitle}>3. User Accounts</Text>
        <Text style={styles.paragraph}>
          You must be 18 years or older to use OGas. You agree to provide accurate information during registration. You are responsible for maintaining the confidentiality of your account credentials.
        </Text>

        <Text style={styles.sectionTitle}>4. Buyer Responsibilities</Text>
        <Text style={styles.paragraph}>
          • Verify seller ratings and reviews before ordering{'\n'}
          • Provide accurate delivery address{'\n'}
          • Inspect gas cylinder upon delivery before confirming receipt{'\n'}
          • Report issues within 24 hours of delivery{'\n'}
          • Pay for orders promptly
        </Text>

        <Text style={styles.sectionTitle}>5. Seller Responsibilities</Text>
        <Text style={styles.paragraph}>
          • Provide accurate product descriptions and pricing{'\n'}
          • Maintain valid business registration where required{'\n'}
          • Deliver orders within agreed timeframe{'\n'}
          • Ensure gas cylinders meet safety standards{'\n'}
          • Respond to buyer inquiries within 2 hours
        </Text>

        <Text style={styles.sectionTitle}>6. Payments & Fees</Text>
        <Text style={styles.paragraph}>
          OGas charges a 10% commission on each completed transaction. Payment processing fees (Paystack: 1.5% + ₦100; Celo network: variable gas fees) are borne by the seller unless otherwise stated. Funds are held in escrow until buyer confirms delivery.
        </Text>

        <Text style={styles.sectionTitle}>7. Refunds & Disputes</Text>
        <Text style={styles.paragraph}>
          Refunds are processed within 5-7 business days. Disputes must be filed within 48 hours of delivery. OGas reserves the right to mediate disputes and make final decisions.
        </Text>

        <Text style={styles.sectionTitle}>8. Prohibited Activities</Text>
        <Text style={styles.paragraph}>
          • Selling counterfeit or substandard gas cylinders{'\n'}
          • Fraudulent transactions or chargeback abuse{'\n'}
          • Harassment of other users{'\n'}
          • Attempting to bypass OGas payment system{'\n'}
          • Using the platform for illegal activities
        </Text>

        <Text style={styles.sectionTitle}>9. Limitation of Liability</Text>
        <Text style={styles.paragraph}>
          OGas is not liable for: gas quality issues (seller responsibility), delivery delays due to traffic/weather, or losses from cryptocurrency price volatility. Our maximum liability is limited to the transaction amount.
        </Text>

        <Text style={styles.sectionTitle}>10. Termination</Text>
        <Text style={styles.paragraph}>
          We may suspend or terminate accounts violating these terms. Users may delete their account at any time via the Profile settings.
        </Text>

        <Text style={styles.sectionTitle}>11. Governing Law</Text>
        <Text style={styles.paragraph}>
          These terms are governed by the laws of the Federal Republic of Nigeria. Disputes shall be resolved in courts located in Lagos State.
        </Text>

        <Text style={styles.sectionTitle}>12. Contact</Text>
        <Text style={styles.paragraph}>
          For questions about these terms, contact us at:
        </Text>
        <TouchableOpacity onPress={() => Linking.openURL('mailto:support@ogaslpgmarketplace.com')}>
          <Text style={styles.link}>support@ogaslpgmarketplace.com</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => Linking.openURL('https://t.me/ogaslpg')}>
          <Text style={styles.link}>Telegram: @ogaslpg</Text>
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
  link: { color: '#4fc3f7', fontSize: 14, marginTop: 4, textDecorationLine: 'underline' },
});
