import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { OGasColors, kits, products, Kit } from './OGasKitData';

const { width } = Dimensions.get('window');

export default function StarterKitHomeScreen({ navigation }: any) {
  const renderKitCard = (kit: Kit) => (
    <TouchableOpacity
      key={kit.id}
      style={styles.kitCard}
      onPress={() => navigation.navigate('SmartCalculator')}
    >
      <LinearGradient
        colors={[OGasColors.card, OGasColors.darker]}
        style={styles.kitGradient}
      >
        {kit.badge && (
          <View style={styles.badgeContainer}>
            <Text style={styles.badgeText}>{kit.badge}</Text>
          </View>
        )}
        <Text style={styles.kitName}>{kit.name}</Text>
        <Text style={styles.kitSubtitle}>{kit.subtitle}</Text>
        
        <View style={styles.kitProducts}>
          {kit.products.map((pid) => {
            const product = products.find(p => p.id === pid);
            return product ? (
              <View key={pid} style={styles.miniProduct}>
                <Text style={styles.miniProductText}>• {product.name}</Text>
              </View>
            ) : null;
          })}
        </View>
        
        <View style={styles.priceRow}>
          <Text style={styles.originalPrice}>₦{kit.totalPrice.toLocaleString()}</Text>
          <Text style={styles.finalPrice}>₦{kit.finalPrice.toLocaleString()}</Text>
        </View>
        
        <Text style={styles.savingsText}>You save ₦{kit.discount.toLocaleString()}</Text>
        
        <TouchableOpacity 
          style={styles.buyButton}
          onPress={() => navigation.navigate('Checkout', { 
            items: kit.products.map(pid => products.find(p => p.id === pid)).filter(Boolean),
            total: kit.finalPrice 
          })}
        >
          <Text style={styles.buyButtonText}>Get This Kit</Text>
        </TouchableOpacity>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={[OGasColors.primary, OGasColors.secondary]}
        style={styles.hero}
      >
        <Text style={styles.heroTitle}>Start Your LPG Business</Text>
        <Text style={styles.heroSubtitle}>
          Complete starter kits with OGas branding. 
          Everything you need. Delivered nationwide.
        </Text>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>50+</Text>
            <Text style={styles.statLabel}>Businesses Started</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>₦200</Text>
            <Text style={styles.statLabel}>Profit/kg Potential</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>2-4</Text>
            <Text style={styles.statLabel}>Months to ROI</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Choose Your Starter Kit</Text>
        {kits.map(renderKitCard)}
      </View>

      <TouchableOpacity 
        style={styles.calculatorCTA}
        onPress={() => navigation.navigate('SmartCalculator')}
      >
        <LinearGradient
          colors={[OGasColors.accent, OGasColors.primary]}
          style={styles.calculatorGradient}
        >
          <Text style={styles.calculatorTitle}>💡 Smart Calculator</Text>
          <Text style={styles.calculatorSubtitle}>
            See how much you can earn before you buy
          </Text>
        </LinearGradient>
      </TouchableOpacity>

      <View style={styles.trustSection}>
        <Text style={styles.trustTitle}>Why Buy From OGas?</Text>
        <View style={styles.trustGrid}>
          <View style={styles.trustItem}>
            <Text style={styles.trustIcon}>🚚</Text>
            <Text style={styles.trustText}>Nationwide Delivery</Text>
          </View>
          <View style={styles.trustItem}>
            <Text style={styles.trustIcon}>✓</Text>
            <Text style={styles.trustText}>Verified Quality</Text>
          </View>
          <View style={styles.trustItem}>
            <Text style={styles.trustIcon}>🛡️</Text>
            <Text style={styles.trustText}>6-Month Warranty</Text>
          </View>
          <View style={styles.trustItem}>
            <Text style={styles.trustIcon}>💬</Text>
            <Text style={styles.trustText}>Business Support</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: OGasColors.darker,
  },
  hero: {
    padding: 24,
    paddingTop: 60,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: OGasColors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  stat: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: OGasColors.text,
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  section: {
    padding: 20,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: OGasColors.text,
    marginBottom: 16,
  },
  kitCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: OGasColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  kitGradient: {
    padding: 20,
  },
  badgeContainer: {
    backgroundColor: OGasColors.primary,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 12,
  },
  badgeText: {
    color: OGasColors.text,
    fontSize: 12,
    fontWeight: 'bold',
  },
  kitName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: OGasColors.text,
    marginBottom: 4,
  },
  kitSubtitle: {
    fontSize: 14,
    color: OGasColors.textMuted,
    marginBottom: 12,
  },
  kitProducts: {
    marginBottom: 16,
  },
  miniProduct: {
    marginBottom: 4,
  },
  miniProductText: {
    fontSize: 13,
    color: OGasColors.textMuted,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  originalPrice: {
    fontSize: 16,
    color: OGasColors.textMuted,
    textDecorationLine: 'line-through',
    marginRight: 12,
  },
  finalPrice: {
    fontSize: 28,
    fontWeight: 'bold',
    color: OGasColors.primary,
  },
  savingsText: {
    fontSize: 13,
    color: OGasColors.success,
    marginBottom: 16,
  },
  buyButton: {
    backgroundColor: OGasColors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  buyButtonText: {
    color: OGasColors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  calculatorCTA: {
    margin: 20,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 5,
  },
  calculatorGradient: {
    padding: 24,
    alignItems: 'center',
  },
  calculatorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: OGasColors.text,
    marginBottom: 8,
  },
  calculatorSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  trustSection: {
    padding: 20,
    marginBottom: 30,
  },
  trustTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: OGasColors.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  trustGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  trustItem: {
    width: width / 2 - 30,
    backgroundColor: OGasColors.card,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  trustIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  trustText: {
    fontSize: 12,
    color: OGasColors.textMuted,
    textAlign: 'center',
  },
});
