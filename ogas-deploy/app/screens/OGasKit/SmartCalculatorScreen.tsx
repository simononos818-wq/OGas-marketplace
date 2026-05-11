import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { OGasColors, calculateROI, CalculatorResult } from './OGasKitData';

const { width } = Dimensions.get('window');

export default function SmartCalculatorScreen({ navigation }: any) {
  const [inputs, setInputs] = useState({
    cylinderSize: '50',
    buyPrice: '1200',
    sellPrice: '1400',
    dailySales: '20',
    kitPrice: '250000',
  });

  const [result, setResult] = useState<CalculatorResult | null>(null);

  const handleCalculate = () => {
    const calcResult = calculateROI({
      cylinderSize: parseFloat(inputs.cylinderSize) || 50,
      buyPricePerKg: parseFloat(inputs.buyPrice) || 1200,
      sellPricePerKg: parseFloat(inputs.sellPrice) || 1400,
      dailySalesKg: parseFloat(inputs.dailySales) || 20,
      kitPrice: parseFloat(inputs.kitPrice) || 250000,
    });
    setResult(calcResult);
  };

  const renderInput = (label: string, value: string, key: string, placeholder: string) => (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={(text) => setInputs({ ...inputs, [key]: text })}
        placeholder={placeholder}
        placeholderTextColor={OGasColors.textMuted}
        keyboardType="numeric"
      />
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={[OGasColors.primary, OGasColors.secondary]}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>💡 Smart Calculator</Text>
        <Text style={styles.headerSubtitle}>
          Calculate your profit before you invest
        </Text>
      </LinearGradient>

      <View style={styles.formContainer}>
        <Text style={styles.formTitle}>Your Business Inputs</Text>
        
        {renderInput('Cylinder Size (kg)', inputs.cylinderSize, 'cylinderSize', '50')}
        {renderInput('Buy Price per kg (₦)', inputs.buyPrice, 'buyPrice', '1200')}
        {renderInput('Sell Price per kg (₦)', inputs.sellPrice, 'sellPrice', '1400')}
        {renderInput('Daily Sales (kg)', inputs.dailySales, 'dailySales', '20')}
        {renderInput('Kit Investment (₦)', inputs.kitPrice, 'kitPrice', '250000')}

        <TouchableOpacity style={styles.calculateButton} onPress={handleCalculate}>
          <Text style={styles.calculateButtonText}>Calculate My Earnings</Text>
        </TouchableOpacity>
      </View>

      {result && (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>📊 Your Business Forecast</Text>
          
          <View style={styles.resultCard}>
            <Text style={styles.resultLabel}>Profit per kg</Text>
            <Text style={styles.resultValue}>₦{result.profitPerKg}</Text>
          </View>

          <View style={styles.resultRow}>
            <View style={[styles.resultCard, styles.halfCard]}>
              <Text style={styles.resultLabel}>Daily Profit</Text>
              <Text style={styles.resultValue}>₦{result.dailyProfit.toLocaleString()}</Text>
            </View>
            <View style={[styles.resultCard, styles.halfCard]}>
              <Text style={styles.resultLabel}>Weekly Profit</Text>
              <Text style={styles.resultValue}>₦{result.weeklyProfit.toLocaleString()}</Text>
            </View>
          </View>

          <View style={styles.resultRow}>
            <View style={[styles.resultCard, styles.halfCard, styles.highlightCard]}>
              <Text style={styles.resultLabel}>Monthly Profit</Text>
              <Text style={[styles.resultValue, styles.highlightValue]}>
                ₦{Math.round(result.monthlyProfit).toLocaleString()}
              </Text>
            </View>
            <View style={[styles.resultCard, styles.halfCard, styles.highlightCard]}>
              <Text style={styles.resultLabel}>Yearly Profit</Text>
              <Text style={[styles.resultValue, styles.highlightValue]}>
                ₦{Math.round(result.yearlyProfit).toLocaleString()}
              </Text>
            </View>
          </View>

          <LinearGradient
            colors={[OGasColors.success, '#27AE60']}
            style={styles.roiCard}
          >
            <Text style={styles.roiLabel}>⏱️ Return on Investment</Text>
            <Text style={styles.roiValue}>{result.monthsToROI} months</Text>
            <Text style={styles.roiSubtext}>
              Your kit pays for itself in {result.breakEvenDays} days
            </Text>
          </LinearGradient>

          <View style={styles.insightCard}>
            <Text style={styles.insightTitle}>💡 Business Insight</Text>
            <Text style={styles.insightText}>
              With a ₦{parseInt(inputs.kitPrice).toLocaleString()} investment, you'll earn back 
              your money in {result.monthsToROI} months. After that, every naira is pure profit. 
              In 1 year, you could earn ₦{Math.round(result.yearlyProfit).toLocaleString()} 
              from this single kit.
            </Text>
          </View>

          <TouchableOpacity 
            style={styles.ctaButton}
            onPress={() => navigation.navigate('Checkout', { 
              items: [{ id: 'kit-standard', name: 'Standard Business Kit', price: parseInt(inputs.kitPrice) }],
              total: parseInt(inputs.kitPrice)
            })}
          >
            <Text style={styles.ctaButtonText}>Get This Kit Now →</Text>
          </TouchableOpacity>
        </View>
      )}
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
  formContainer: {
    padding: 20,
    marginTop: 10,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: OGasColors.text,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: OGasColors.textMuted,
    marginBottom: 6,
  },
  input: {
    backgroundColor: OGasColors.card,
    borderRadius: 12,
    padding: 14,
    color: OGasColors.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: OGasColors.border,
  },
  calculateButton: {
    backgroundColor: OGasColors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    elevation: 5,
    shadowColor: OGasColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  calculateButtonText: {
    color: OGasColors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultsContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  resultsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: OGasColors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  resultCard: {
    backgroundColor: OGasColors.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: OGasColors.border,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfCard: {
    width: width / 2 - 30,
  },
  highlightCard: {
    borderColor: OGasColors.primary,
    borderWidth: 2,
  },
  resultLabel: {
    fontSize: 12,
    color: OGasColors.textMuted,
    marginBottom: 4,
  },
  resultValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: OGasColors.text,
  },
  highlightValue: {
    color: OGasColors.primary,
  },
  roiCard: {
    padding: 20,
    borderRadius: 16,
    marginVertical: 16,
    alignItems: 'center',
  },
  roiLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 8,
  },
  roiValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: OGasColors.text,
  },
  roiSubtext: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 8,
  },
  insightCard: {
    backgroundColor: OGasColors.card,
    padding: 20,
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: OGasColors.accent,
    marginBottom: 20,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: OGasColors.accent,
    marginBottom: 8,
  },
  insightText: {
    fontSize: 14,
    color: OGasColors.textMuted,
    lineHeight: 22,
  },
  ctaButton: {
    backgroundColor: OGasColors.primary,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 5,
  },
  ctaButtonText: {
    color: OGasColors.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
});
