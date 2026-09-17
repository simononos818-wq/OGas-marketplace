/**
 * Shop scale: 0.05, 0.10 … 0.95, 1.00, 1.05.
 * Extra kobo is change, not extra gas.
 */

export const SCALE_STEP = 0.05;
export const DEFAULT_PRICE_PER_KG = 1350;
export const COMMON_CYLINDERS = [3, 6, 12, 12.5, 25, 50] as const;
export const BOTTLE_SIZES = [3, 6, 12, 12.5] as const;
export type CylinderSize = (typeof COMMON_CYLINDERS)[number];

export function naira(n: number) {
  return "₦" + Number(n || 0).toLocaleString("en-NG");
}

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
  return { kg, formatted: `${kg.toFixed(2)} kg`, exact, gasCost, change };
}

export function kgToMoney(kg: number, pricePerKg: number) {
  if (!kg || !pricePerKg || pricePerKg <= 0) {
    return { amount: 0, formatted: "₦0", error: "Invalid input" };
  }
  const amount = Math.round(kg * pricePerKg);
  return { amount, formatted: naira(amount), exact: kg * pricePerKg };
}

export function getCylinderCosts(pricePerKg: number) {
  return COMMON_CYLINDERS.map((size) => ({
    size,
    ...kgToMoney(size, pricePerKg),
  }));
}

export type SaleRow = {
  id: string;
  at: number;
  kg: number;
  gasCost: number;
  cash: number;
  change: number;
  kind: "money" | "bottle";
};

function salesKey(day = new Date()) {
  const y = day.getFullYear();
  const m = String(day.getMonth() + 1).padStart(2, "0");
  const d = String(day.getDate()).padStart(2, "0");
  return `ogas_sales_${y}-${m}-${d}`;
}

export function loadTodaySales(): SaleRow[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(salesKey());
    return raw ? (JSON.parse(raw) as SaleRow[]) : [];
  } catch {
    return [];
  }
}

export function saveTodaySales(rows: SaleRow[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(salesKey(), JSON.stringify(rows));
}

export function saleTotals(rows: SaleRow[]) {
  return rows.reduce(
    (acc, r) => {
      acc.count += 1;
      acc.kg += r.kg;
      acc.naira += r.gasCost;
      return acc;
    },
    { count: 0, kg: 0, naira: 0 },
  );
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
