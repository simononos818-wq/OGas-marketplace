// ============================================
// OGas Gas Calculator & Price Converter
// Works for ALL of Nigeria
// ============================================

// OGas takes 10% per transaction. Seller gets 90%.
export const PLATFORM_FEE_PERCENT = 0.10;
export const SELLER_SHARE_PERCENT = 0.90;

// Standard LPG density: 1 kg ≈ 1.96 litres (at 15°C, 1 atm)
export const CYLINDER_SIZES = [
  { kg: 3, label: "3kg (Camping)", litres: 5.88, popular: false },
  { kg: 5, label: "5kg (Small Home)", litres: 9.8, popular: false },
  { kg: 6, label: "6kg (Single)", litres: 11.76, popular: true },
  { kg: 10, label: "10kg (Couple)", litres: 19.6, popular: true },
  { kg: 12.5, label: "12.5kg (Family)", litres: 24.5, popular: true },
  { kg: 15, label: "15kg (Large Family)", litres: 29.4, popular: false },
  { kg: 25, label: "25kg (Restaurant)", litres: 49.0, popular: false },
  { kg: 50, label: "50kg (Commercial)", litres: 98.0, popular: false },
] as const;

// Price per kg ranges by Nigerian region (₦)
export const REGION_PRICES: Record<string, { min: number; max: number; avg: number }> = {
  "Lagos": { min: 1100, max: 1400, avg: 1250 },
  "Abuja": { min: 1150, max: 1450, avg: 1300 },
  "Port Harcourt": { min: 1100, max: 1400, avg: 1250 },
  "Delta": { min: 1050, max: 1350, avg: 1200 },
  "Warri": { min: 1050, max: 1350, avg: 1200 },
  "Benin": { min: 1080, max: 1380, avg: 1230 },
  "Ibadan": { min: 1100, max: 1400, avg: 1250 },
  "Kano": { min: 1050, max: 1350, avg: 1200 },
  "Enugu": { min: 1100, max: 1400, avg: 1250 },
  "Aba": { min: 1050, max: 1350, avg: 1200 },
  "Onitsha": { min: 1050, max: 1350, avg: 1200 },
  "Kaduna": { min: 1050, max: 1350, avg: 1200 },
  "Jos": { min: 1100, max: 1400, avg: 1250 },
  "Uyo": { min: 1100, max: 1400, avg: 1250 },
  "Calabar": { min: 1100, max: 1400, avg: 1250 },
  "Owerri": { min: 1050, max: 1350, avg: 1200 },
  "Abeokuta": { min: 1100, max: 1400, avg: 1250 },
  "Oshogbo": { min: 1100, max: 1400, avg: 1250 },
  "Akure": { min: 1100, max: 1400, avg: 1250 },
  "Makurdi": { min: 1050, max: 1350, avg: 1200 },
  "default": { min: 1100, max: 1400, avg: 1250 },
};

// Delivery fee by distance (km)
export const DELIVERY_FEES: Record<string, number> = {
  "0-1": 300,
  "1-3": 500,
  "3-5": 700,
  "5-10": 1000,
  "10+": 1500,
};

// ============================================
// CONVERSION FUNCTIONS
// ============================================

export function kgToLitres(kg: number): number {
  return Number((kg * 1.96).toFixed(2));
}

export function litresToKg(litres: number): number {
  return Number((litres / 1.96).toFixed(2));
}

export function calculatePrice(kg: number, pricePerKg: number): number {
  return Math.round(kg * pricePerKg);
}

export function calculateBreakdown(kg: number, pricePerKg: number, deliveryFee: number = 0) {
  const subtotal = kg * pricePerKg;
  const platformFee = Math.round(subtotal * PLATFORM_FEE_PERCENT);
  const sellerAmount = Math.round(subtotal * SELLER_SHARE_PERCENT);
  const total = subtotal + platformFee + deliveryFee;
  
  return {
    kg,
    litres: kgToLitres(kg),
    pricePerKg,
    subtotal: Math.round(subtotal),
    platformFee,
    sellerAmount,
    deliveryFee,
    total,
  };
}

export function getPriceForLocation(location: string): { min: number; max: number; avg: number } {
  if (REGION_PRICES[location]) return REGION_PRICES[location];
  const match = Object.keys(REGION_PRICES).find(
    city => location.toLowerCase().includes(city.toLowerCase()) || 
            city.toLowerCase().includes(location.toLowerCase())
  );
  return match ? REGION_PRICES[match] : REGION_PRICES["default"];
}

export function getDeliveryFee(distanceKm: number): number {
  if (distanceKm <= 1) return DELIVERY_FEES["0-1"];
  if (distanceKm <= 3) return DELIVERY_FEES["1-3"];
  if (distanceKm <= 5) return DELIVERY_FEES["3-5"];
  if (distanceKm <= 10) return DELIVERY_FEES["5-10"];
  return DELIVERY_FEES["10+"];
}

export function formatPrice(amount: number): string {
  if (typeof amount !== 'number' || isNaN(amount)) return '₦0';
  return `₦${Math.round(amount).toLocaleString('en-NG')}`;
}

export function getCylinderInfo(kg: number) {
  return CYLINDER_SIZES.find(c => c.kg === kg) || null;
}

export function calculateDistance(
  lat1: number, lon1: number, lat2: number, lon2: number
): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return Number((R * c).toFixed(1));
}

export function detectUserLocation(): Promise<{ lat: number; lng: number; accuracy: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation not supported"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => reject(error),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  });
}

export const NIGERIAN_CITIES = [
  { name: "Lagos", lat: 6.5244, lng: 3.3792, state: "Lagos" },
  { name: "Abuja", lat: 9.0765, lng: 7.3986, state: "FCT" },
  { name: "Port Harcourt", lat: 4.8156, lng: 7.0498, state: "Rivers" },
  { name: "Ibadan", lat: 7.3775, lng: 3.9470, state: "Oyo" },
  { name: "Kano", lat: 12.0022, lng: 8.5920, state: "Kano" },
  { name: "Warri", lat: 5.5544, lng: 5.7932, state: "Delta" },
  { name: "Benin City", lat: 6.3350, lng: 5.6037, state: "Edo" },
  { name: "Kaduna", lat: 10.5105, lng: 7.4165, state: "Kaduna" },
  { name: "Enugu", lat: 6.5244, lng: 7.5186, state: "Enugu" },
  { name: "Aba", lat: 5.1066, lng: 7.3667, state: "Abia" },
  { name: "Onitsha", lat: 6.1667, lng: 6.7833, state: "Anambra" },
  { name: "Uyo", lat: 5.0513, lng: 7.9335, state: "Akwa Ibom" },
  { name: "Calabar", lat: 4.9757, lng: 8.3417, state: "Cross River" },
  { name: "Owerri", lat: 5.4836, lng: 7.0332, state: "Imo" },
  { name: "Jos", lat: 9.8965, lng: 8.8583, state: "Plateau" },
  { name: "Abeokuta", lat: 7.1608, lng: 3.3483, state: "Ogun" },
  { name: "Oshogbo", lat: 7.7710, lng: 4.5560, state: "Osun" },
  { name: "Akure", lat: 7.2571, lng: 5.2058, state: "Ondo" },
  { name: "Makurdi", lat: 7.7338, lng: 8.5214, state: "Benue" },
  { name: "Oteri", lat: 5.5000, lng: 5.8000, state: "Delta" },
] as const;

export function findNearestCity(lat: number, lng: number) {
  let nearest = NIGERIAN_CITIES[0];
  let minDist = Infinity;
  for (const city of NIGERIAN_CITIES) {
    const dist = calculateDistance(lat, lng, city.lat, city.lng);
    if (dist < minDist) {
      minDist = dist;
      nearest = city;
    }
  }
  return { city: nearest, distanceKm: minDist };
}

export default {
  kgToLitres,
  litresToKg,
  calculatePrice,
  calculateBreakdown,
  getPriceForLocation,
  getDeliveryFee,
  formatPrice,
  getCylinderInfo,
  calculateDistance,
  detectUserLocation,
  findNearestCity,
  CYLINDER_SIZES,
  NIGERIAN_CITIES,
  PLATFORM_FEE_PERCENT,
  SELLER_SHARE_PERCENT,
  DELIVERY_FEES,
};
