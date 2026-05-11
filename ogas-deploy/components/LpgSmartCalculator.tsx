import { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Switch,
  Alert,
} from "react-native";
import type { OrderItem } from "../contexts/OrderContext";

type CalculatorMode = "KG" | "AMOUNT";

type LpgSmartCalculatorProps = {
  defaultPricePerKg?: number;
  defaultDeliveryFee?: number;
  defaultSize?: number;
  availableSizes?: number[];
  sellerId?: string;
  sellerName?: string;
  deliveryAvailable?: boolean;
  deliveryFee?: number;
  prefillPricePerCylinder?: number;
  onProceed?: (payload: { item: OrderItem; deliveryRequested: boolean; deliveryFee: number }) => void;
};

const DEFAULT_SIZES = [3, 5, 6, 12.5, 25, 50];

const formatCurrency = (value: number) => {
  const safeValue = Number.isFinite(value) ? value : 0;
  return `₦${Math.round(safeValue).toLocaleString()}`;
};

const formatWeight = (value: number) => {
  const safeValue = Number.isFinite(value) ? value : 0;
  return `${safeValue.toFixed(2)} kg`;
};

const parseNumericInput = (value: string) => {
  const parsed = parseFloat(value.replace(/[^0-9.]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
};

export default function LpgSmartCalculator({
  defaultPricePerKg = 800,
  defaultDeliveryFee = 500,
  defaultSize = 12.5,
  availableSizes = DEFAULT_SIZES,
  sellerId,
  sellerName,
  deliveryAvailable = false,
  deliveryFee: initialDeliveryFee,
  prefillPricePerCylinder: initialPrefillPricePerCylinder,
  onProceed,
}: LpgSmartCalculatorProps) {
  const [mode, setMode] = useState<CalculatorMode>("KG");
  const [selectedSize, setSelectedSize] = useState<number>(defaultSize);
  const [pricePerKgInput, setPricePerKgInput] = useState(String(defaultPricePerKg));
  const [pricePerCylinderInput, setPricePerCylinderInput] = useState(initialPrefillPricePerCylinder ? String(initialPrefillPricePerCylinder) : "");
  const [weightInput, setWeightInput] = useState(String(defaultSize));
  const [amountInput, setAmountInput] = useState("10000");
  const [deliveryFeeInput, setDeliveryFeeInput] = useState(String(initialDeliveryFee ?? defaultDeliveryFee));
  const [deliveryRequested, setDeliveryRequested] = useState(Boolean(deliveryAvailable));

  const pricePerKg = parseNumericInput(pricePerKgInput);
  const pricePerCylinder = parseNumericInput(pricePerCylinderInput);
  const weightValue = parseNumericInput(weightInput);
  const amountValue = parseNumericInput(amountInput);
  const deliveryFee = parseNumericInput(deliveryFeeInput);

  const effectivePricePerKg = useMemo(() => {
    if (pricePerKg > 0) {
      return pricePerKg;
    }

    if (pricePerCylinder > 0 && selectedSize > 0) {
      return pricePerCylinder / selectedSize;
    }

    return 0;
  }, [pricePerKg, pricePerCylinder, selectedSize]);

  const effectivePricePerCylinder = useMemo(() => {
    if (pricePerCylinder > 0) {
      return pricePerCylinder;
    }

    if (effectivePricePerKg > 0 && selectedSize > 0) {
      return effectivePricePerKg * selectedSize;
    }

    return 0;
  }, [pricePerCylinder, effectivePricePerKg, selectedSize]);

  const computedAmount = useMemo(() => {
    if (mode === "KG") {
      return effectivePricePerKg * weightValue;
    }

    return amountValue;
  }, [mode, effectivePricePerKg, weightValue, amountValue]);

  const computedWeight = useMemo(() => {
    if (mode === "AMOUNT") {
      return effectivePricePerKg > 0 ? amountValue / effectivePricePerKg : 0;
    }

    return weightValue;
  }, [mode, amountValue, effectivePricePerKg, weightValue]);

  const cylinderCount = useMemo(() => {
    if (selectedSize <= 0) return 0;
    return Math.floor(computedWeight / selectedSize);
  }, [computedWeight, selectedSize]);

  const remainderKg = useMemo(() => {
    if (selectedSize <= 0) return computedWeight;
    return Number((computedWeight - cylinderCount * selectedSize).toFixed(2));
  }, [computedWeight, cylinderCount, selectedSize]);

  const totalPayable = useMemo(() => {
    return computedAmount + deliveryFee;
  }, [computedAmount, deliveryFee]);

  const handleProceed = () => {
    if (!sellerId) {
      Alert.alert("Add to cart", "This calculator is ready for estimates. Select a seller first to add to cart.");
      return;
    }

    if (computedAmount <= 0) {
      Alert.alert("Invalid estimate", "Please enter a valid price and amount/weight to continue.");
      return;
    }

    const item: OrderItem = {
      id: `${sellerId}_${selectedSize}_${mode}_${Date.now()}`,
      name: `${selectedSize}kg from ${sellerName || "Seller"}`,
      size: String(selectedSize),
      price: Math.max(1, Math.round(computedAmount)),
      quantity: 1,
      sellerId,
      sellerName,
      sellerDeliveryAvailable: deliveryAvailable,
      sellerDeliveryFee: deliveryAvailable ? Number(deliveryFee || 0) : 0,
    };

    onProceed?.({ item, deliveryRequested, deliveryFee: Number(deliveryFee || 0) });
  };

  useEffect(() => {
    if (!deliveryAvailable) {
      setDeliveryRequested(false);
    }
  }, [deliveryAvailable]);

  const resetForm = () => {
    setMode("KG");
    setSelectedSize(defaultSize);
    setPricePerKgInput(String(defaultPricePerKg));
    setPricePerCylinderInput("");
    setWeightInput(String(defaultSize));
    setAmountInput("10000");
    setDeliveryFeeInput(String(deliveryFee ?? defaultDeliveryFee));
    setDeliveryRequested(Boolean(deliveryAvailable));
  };

  const modeLabel = mode === "KG" ? "Buy by Weight (kg)" : "Buy by Amount (₦)";

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.wrapper}
    >
      <View style={styles.container}>
        <View style={styles.topBar}>
          <Text style={styles.heading}>Smart Gas Calculator</Text>
          <Text style={styles.subheading}>Quickly estimate LPG cost by weight or amount.</Text>
        </View>

        <View style={styles.modeSwitcher}>
          {(["KG", "AMOUNT"] as CalculatorMode[]).map((option, index) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.modeButton,
                index === 0 ? styles.modeButtonSpacing : null,
                mode === option ? styles.modeButtonActive : styles.modeButtonInactive,
              ]}
              onPress={() => setMode(option)}
            >
              <Text
                style={[
                  styles.modeButtonText,
                  mode === option ? styles.modeButtonTextActive : styles.modeButtonTextInactive,
                ]}
              >
                {option === "KG" ? "Buy by Kg" : "Buy by Amount"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pricing Inputs</Text>
          <Text style={styles.fieldLabel}>Selected cylinder size</Text>
          <View style={styles.sizeRow}>
            {availableSizes.map((size) => (
              <TouchableOpacity
                key={size}
                onPress={() => setSelectedSize(size)}
                style={[
                  styles.sizeButton,
                  selectedSize === size ? styles.sizeButtonSelected : styles.sizeButtonDefault,
                ]}
              >
                <Text
                  style={selectedSize === size ? styles.sizeButtonTextSelected : styles.sizeButtonTextDefault}
                >
                  {size}kg
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.fieldLabel}>Price per kg</Text>
          <TextInput
            style={styles.input}
            value={pricePerKgInput}
            onChangeText={setPricePerKgInput}
            placeholder="Enter price per kg"
            keyboardType="decimal-pad"
            returnKeyType="done"
          />

          <Text style={styles.fieldLabel}>Price per selected cylinder</Text>
          <TextInput
            style={styles.input}
            value={pricePerCylinderInput}
            onChangeText={setPricePerCylinderInput}
            placeholder="Optional: enter price for selected size"
            keyboardType="decimal-pad"
            returnKeyType="done"
          />

          <Text style={styles.hintText}>
            Tip: if you enter both, price per kg is used first. If only cylinder price is given, unit/kg is derived from the selected size.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{modeLabel}</Text>
          {mode === "KG" ? (
            <>
              <Text style={styles.fieldLabel}>Weight in kilograms</Text>
              <TextInput
                style={styles.input}
                value={weightInput}
                onChangeText={setWeightInput}
                placeholder="Enter kilograms"
                keyboardType="decimal-pad"
                returnKeyType="done"
              />
            </>
          ) : (
            <>
              <Text style={styles.fieldLabel}>Amount in Naira</Text>
              <TextInput
                style={styles.input}
                value={amountInput}
                onChangeText={setAmountInput}
                placeholder="Enter amount"
                keyboardType="decimal-pad"
                returnKeyType="done"
              />
            </>
          )}

          <Text style={styles.fieldLabel}>Delivery fee</Text>
          <TextInput
            style={styles.input}
            value={deliveryFeeInput}
            onChangeText={setDeliveryFeeInput}
            placeholder="Enter delivery fee"
            keyboardType="decimal-pad"
            returnKeyType="done"
          />

          <View style={styles.deliveryRow}>
            <Text style={styles.fieldLabel}>{deliveryAvailable ? "Request delivery" : "Pickup only"}</Text>
            <Switch
              value={deliveryRequested}
              onValueChange={setDeliveryRequested}
              disabled={!deliveryAvailable}
              trackColor={{ false: "#767577", true: "#FF6B35" }}
              thumbColor={deliveryRequested ? "#fff" : "#fff"}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Estimate</Text>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Effective price / kg</Text>
            <Text style={styles.resultValue}>{formatCurrency(effectivePricePerKg)}</Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Effective price / {selectedSize}kg</Text>
            <Text style={styles.resultValue}>{formatCurrency(effectivePricePerCylinder)}</Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Estimated purchase</Text>
            <Text style={styles.resultValue}>{formatWeight(computedWeight)}</Text>
          </View>
          <View style={styles.resultRow}> 
            <Text style={styles.resultLabel}>Estimated payment</Text>
            <Text style={styles.resultValue}>{formatCurrency(computedAmount)}</Text>
          </View>
          <View style={styles.resultRow}> 
            <Text style={styles.resultLabel}>Delivery fee</Text>
            <Text style={styles.resultValue}>{formatCurrency(deliveryFee)}</Text>
          </View>
          <View style={[styles.resultRow, styles.totalRow]}> 
            <Text style={[styles.resultLabel, styles.totalText]}>Expected total</Text>
            <Text style={[styles.resultValue, styles.totalText]}>{formatCurrency(totalPayable)}</Text>
          </View>

          <View style={styles.breakdownBox}>
            <Text style={styles.breakdownTitle}>Cylinder breakdown</Text>
            <Text style={styles.breakdownText}>{cylinderCount} × {selectedSize}kg full cylinders</Text>
            <Text style={styles.breakdownText}>Remaining: {formatWeight(remainderKg)}</Text>
          </View>

          <View style={styles.recommendationBox}>
            <Text style={styles.recommendationTitle}>Smart recommendation</Text>
            <Text style={styles.recommendationText}>
              {mode === "KG"
                ? `Pay ${formatCurrency(computedAmount)} for ${formatWeight(weightValue)} of gas.`
                : effectivePricePerKg > 0
                ? `₦${amountValue.toLocaleString()} buys about ${formatWeight(computedWeight)}.`
                : "Enter a valid price per kg or cylinder to see an estimate."}
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.proceedButton} onPress={handleProceed}>
          <Text style={styles.proceedButtonText}>{sellerId ? "Add to cart" : "Save estimate"}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.resetButton} onPress={resetForm}>
          <Text style={styles.resetButtonText}>Reset calculator</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 18,
    backgroundColor: "#f8f8f8",
  },
  topBar: {
    marginBottom: 14,
  },
  heading: {
    fontSize: 22,
    fontWeight: "800",
    color: "#222",
    marginBottom: 6,
  },
  subheading: {
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
  },
  modeSwitcher: {
    flexDirection: "row",
    marginBottom: 16,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  modeButtonSpacing: {
    marginRight: 10,
  },
  modeButtonActive: {
    backgroundColor: "#FF6B35",
  },
  modeButtonInactive: {
    backgroundColor: "#fff",
    borderColor: "#ddd",
    borderWidth: 1,
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: "700",
  },
  modeButtonTextActive: {
    color: "#fff",
  },
  modeButtonTextInactive: {
    color: "#333",
  },
  section: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 18,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#222",
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 13,
    color: "#666",
    marginBottom: 8,
  },
  sizeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 12,
  },
  sizeButton: {
    marginRight: 10,
    marginBottom: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    minWidth: 70,
    justifyContent: "center",
    alignItems: "center",
  },
  sizeButtonDefault: {
    backgroundColor: "#f3f3f3",
  },
  sizeButtonSelected: {
    backgroundColor: "#FF6B35",
  },
  sizeButtonTextDefault: {
    color: "#333",
    fontWeight: "700",
  },
  sizeButtonTextSelected: {
    color: "#fff",
    fontWeight: "700",
  },
  input: {
    borderWidth: 1,
    borderColor: "#e4e4e4",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 16,
    color: "#222",
    marginBottom: 14,
    backgroundColor: "#fafafa",
  },
  hintText: {
    fontSize: 12,
    color: "#777",
    lineHeight: 18,
  },
  resultRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  resultLabel: {
    color: "#555",
    flex: 1,
    fontSize: 14,
  },
  resultValue: {
    fontSize: 15,
    fontWeight: "700",
    color: "#222",
  },
  totalRow: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 10,
  },
  totalText: {
    color: "#FF6B35",
    fontSize: 16,
  },
  breakdownBox: {
    marginTop: 10,
    backgroundColor: "#fff5f0",
    borderRadius: 14,
    padding: 14,
  },
  breakdownTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#d5552d",
    marginBottom: 8,
  },
  breakdownText: {
    color: "#5a4336",
    fontSize: 14,
    marginBottom: 4,
  },
  recommendationBox: {
    marginTop: 14,
    backgroundColor: "#f3f8ff",
    borderRadius: 14,
    padding: 14,
  },
  recommendationTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1c4fff",
    marginBottom: 8,
  },
  recommendationText: {
    color: "#334777",
    fontSize: 14,
    lineHeight: 20,
  },
  deliveryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  proceedButton: {
    marginTop: 4,
    borderRadius: 14,
    backgroundColor: "#FF6B35",
    paddingVertical: 16,
    alignItems: "center",
  },
  proceedButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  resetButton: {
    marginTop: 8,
    borderRadius: 14,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#FF6B35",
    paddingVertical: 14,
    alignItems: "center",
  },
  resetButtonText: {
    color: "#FF6B35",
    fontWeight: "700",
    fontSize: 15,
  },
});
