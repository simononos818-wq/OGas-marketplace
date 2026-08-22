/**
 * Smart Gas Calculator - OGas Marketplace
 * Built to make OGas #1 in Nigeria
 */

export const COMMON_CYLINDERS = [3, 5, 6, 12.5, 25, 50] as const;
export type CylinderSize = (typeof COMMON_CYLINDERS)[number];

export function moneyToKg(amount: number, pricePerKg: number) {
  if (!amount || !pricePerKg || pricePerKg <= 0) {
    return { kg: 0, formatted: "0.00 kg", error: "Invalid input" };
  }
  const kg = amount / pricePerKg;
  return {
    kg: Number(kg.toFixed(3)),
    formatted: `${kg.toFixed(2)} kg`,
    exact: kg,
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
  pricePerKg = 1400,
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
    return `Your ${size}kg finishes fast. Consider a bigger cylinder or 
check for leaks.`;
  if (days > 45) return `Excellent efficiency with your ${size}kg 
cylinder.`;
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
  return `Please fill *${kg.toFixed(2)} kg* for 
₦${amount.toLocaleString()} at ₦${pricePerKg}/kg. Thank you. – via OGas`;
}
