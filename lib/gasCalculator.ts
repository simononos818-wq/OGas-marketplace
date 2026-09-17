/**
 * Smart Gas Calculator - OGas Marketplace
 * Scale counts 0.05, 0.10 … 0.95, 1.00, 1.05 (shop digital scale).
 */

export const SCALE_STEP = 0.05;
export const DEFAULT_PRICE_PER_KG = 1350;
export const COMMON_CYLINDERS = [3, 6, 12, 12.5, 25, 50] as const;
export type CylinderSize = (typeof COMMON_CYLINDERS)[number];

/** Floor exact kg down to the next 0.05 the scale can show. Remainder is change. */
export function floorToScale(exactKg: number, step = SCALE_STEP) {
  if (!exactKg || exactKg < step) return 0;
  return Math.round((Math.floor((exactKg + 1e-9) / step) * step) * 100) / 100;
}

export function moneyToKg(amount: number, pricePerKg: number) {
  if (!amount || !pricePerKg || pricePerKg <= 0) {
    return { kg: 0, formatted: "0.00 kg", exact: 0, gasCost: 0, change: 0, error: "Invalid input" };
  }
  const exact = amount / pricePerKg;
  const kg = floorToScale(exact);
  const gasCost = Math.round(kg * pricePerKg);
  const change = Math.max(0, Math.round(amount - gasCost));
  return {
    kg,
    formatted: `${kg.toFixed(2)} kg`,
    exact,
    gasCost,
    change,
  };
}

export function kgToMoney(kg: number, pricePerKg: number) {
  if (!kg || !pricePerKg || pricePerKg <= 0) {
    return { amount: 0, formatted: "₦0", error: "Invalid input" };
  }
  const amount = kg * pricePerKg;
  return {
    amount: Math.round(amount),
    formatted: `₦${Math.round(amount).toLocaleString()}`,
    exact: amount,
  };
}

export function getCylinderCosts(pricePerKg: number) {
  return COMMON_CYLINDERS.map((size) => ({
    size,
    ...kgToMoney(size, pricePerKg),
  }));
}

export function estimateUsage({
  familySize = 4,
  cookingHoursPerDay = 1.5,
  cylinderSize = 12.5,
  pricePerKg = DEFAULT_PRICE_PER_KG,
}: {
  familySize?: number;
  cookingHoursPerDay?: number;
  cylinderSize?: number;
  pricePerKg?: number;
}) {
  const kgPerHour = 0.2;
  const dailyKg = cookingHoursPerDay * kgPerHour;
  const adjustedDailyKg = dailyKg * (1 + (familySize - 3) * 0.08);
  const finalDailyKg = Math.max(0.25, Number(adjustedDailyKg.toFixed(3)));

  const daysLasting = cylinderSize / finalDailyKg;
  const monthlyKg = finalDailyKg * 30;
  const monthlyCost = monthlyKg * pricePerKg;
  const annualCost = monthlyCost * 12;

  return {
    dailyKg: finalDailyKg,
    daysLasting: Math.round(daysLasting),
    monthlyKg: Number(monthlyKg.toFixed(1)),
    monthlyCost: Math.round(monthlyCost),
    annualCost: Math.round(annualCost),
    formatted: {
      daily: `${finalDailyKg} kg/day`,
      days: `~${Math.round(daysLasting)} days`,
      monthly: `₦${Math.round(monthlyCost).toLocaleString()}`,
      annual: `₦${Math.round(annualCost).toLocaleString()}`,
    },
    advice: getAdvice(daysLasting, cylinderSize),
  };
}

function getAdvice(days: number, size: number) {
  if (days < 18)
    return `Your ${size}kg finishes fast. Consider a bigger cylinder or check for leaks.`;
  if (days > 45) return `Excellent efficiency with your ${size}kg cylinder.`;
  return `Normal usage for a ${size}kg cylinder.`;
}

export function generateWhatsAppMessage({
  kg,
  amount,
  pricePerKg,
}: {
  kg: number;
  amount: number;
  pricePerKg: number;
}) {
  return `Please fill *${kg.toFixed(2)} kg* for ₦${amount.toLocaleString()} at ₦${pricePerKg}/kg. Thank you. – via OGas`;
}
