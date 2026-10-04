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

// --- Location helpers (used by hooks/useLocation.ts) ---
export const NIGERIAN_CITIES = [
  { name: 'Lagos', state: 'Lagos', lat: 6.5244, lng: 3.3792 },
  { name: 'Abuja', state: 'FCT', lat: 9.0765, lng: 7.3986 },
  { name: 'Port Harcourt', state: 'Rivers', lat: 4.8156, lng: 7.0498 },
  { name: 'Ibadan', state: 'Oyo', lat: 7.3775, lng: 3.9470 },
  { name: 'Kano', state: 'Kano', lat: 12.0022, lng: 8.5920 },
  { name: 'Kaduna', state: 'Kaduna', lat: 10.5105, lng: 7.4165 },
  { name: 'Benin City', state: 'Edo', lat: 6.3350, lng: 5.6037 },
  { name: 'Maiduguri', state: 'Borno', lat: 11.8469, lng: 13.1571 },
  { name: 'Zaria', state: 'Kaduna', lat: 11.1113, lng: 7.7227 },
  { name: 'Aba', state: 'Abia', lat: 5.1066, lng: 7.3667 },
  { name: 'Ilorin', state: 'Kwara', lat: 8.4799, lng: 4.5418 },
  { name: 'Jos', state: 'Plateau', lat: 9.8965, lng: 8.8583 },
  { name: 'Ogbomosho', state: 'Oyo', lat: 8.1337, lng: 4.8167 },
  { name: 'Owerri', state: 'Imo', lat: 5.4836, lng: 7.0333 },
  { name: 'Warri', state: 'Delta', lat: 5.5174, lng: 5.7501 },
  { name: 'Ughelli', state: 'Delta', lat: 5.5000, lng: 5.9833 },
  { name: 'Enugu', state: 'Enugu', lat: 6.5244, lng: 7.5186 },
  { name: 'Abeokuta', state: 'Ogun', lat: 7.1600, lng: 3.3500 },
  { name: 'Sokoto', state: 'Sokoto', lat: 13.0059, lng: 5.2476 },
  { name: 'Onitsha', state: 'Anambra', lat: 6.1667, lng: 6.7833 },
];

export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function findNearestCity(lat: number, lng: number) {
  let nearest = NIGERIAN_CITIES[0];
  let minD = Infinity;
  for (const city of NIGERIAN_CITIES) {
    const d = calculateDistance(lat, lng, city.lat, city.lng);
    if (d < minD) {
      minD = d;
      nearest = city;
    }
  }
  return { ...nearest, distanceKm: minD };
}

export function detectUserLocation(): Promise<{ lat: number; lng: number; accuracy: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
}

// --- Order helpers (used by hooks/useOrders.ts) ---
export function calculateBreakdown(items: { size: number; quantity: number }[], pricePerKg: number) {
  const subtotal = items.reduce((sum, item) => sum + item.size * item.quantity * pricePerKg, 0);
  return { subtotal, items };
}

export function getDeliveryFee(distanceKm: number): number {
  if (distanceKm <= 0) return 0;
  if (distanceKm <= 2) return 300;
  if (distanceKm <= 5) return 500;
  if (distanceKm <= 10) return 800;
  return 1000;
}
