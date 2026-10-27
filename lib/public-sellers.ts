import 'server-only';

import { cache } from 'react';
import { adminDb } from '@/lib/firebase-admin';
import { sellerIsApproved } from '@/lib/seller-badges';
import { isValidPricePerKg } from '@/lib/pricing';

export type PublicSeller = {
  id: string;
  businessName: string;
  area: string;
  city?: string;
  state?: string;
  pricePerKg: number;
  deliveryFee: number;
  completedOrders: number;
  lat?: number;
  lng?: number;
};

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function publicArea(address: string, city?: string, state?: string): string {
  const parts = address.split(',').map((part) => part.trim()).filter(Boolean);
  const area = parts.length > 3 ? parts.slice(-3).join(', ') : address;
  return area || [city, state].filter(Boolean).join(', ') || 'Nigeria';
}

function priceFrom(data: Record<string, any>): number {
  if (isValidPricePerKg(data.pricePerKg)) return data.pricePerKg;
  const prices = data.prices || {};
  const from125 = Number(prices['12.5kg'] || prices['12kg'] || 0);
  if (from125 > 0) return Math.round(from125 / 12.5);
  const from6 = Number(prices['6kg'] || 0);
  if (from6 > 0) return Math.round(from6 / 6);
  const from3 = Number(prices['3kg'] || 0);
  if (from3 > 0) return Math.round(from3 / 3);
  return 0;
}

function coordinates(data: Record<string, any>): { lat?: number; lng?: number } {
  const lat = Number(data.location?.lat ?? data.location?.latitude ?? data.geolocation?.latitude ?? data.latitude);
  const lng = Number(data.location?.lng ?? data.location?.longitude ?? data.geolocation?.longitude ?? data.longitude);
  return Number.isFinite(lat) && Number.isFinite(lng) && lat !== 0 && lng !== 0 ? { lat, lng } : {};
}

function serializeSeller(id: string, data: Record<string, any>): PublicSeller | null {
  if (id.startsWith('seed_') || data.isActive === false || data.isApproved !== true || !sellerIsApproved(data)) return null;
  const businessName = text(data.businessName);
  const pricePerKg = priceFrom(data);
  if (!businessName || !isValidPricePerKg(pricePerKg)) return null;
  const city = text(data.city) || undefined;
  const state = text(data.state) || undefined;
  return {
    id,
    businessName,
    area: publicArea(text(data.address), city, state),
    city,
    state,
    pricePerKg,
    deliveryFee: Math.max(0, Number(data.deliveryFee) || 0),
    completedOrders: Math.max(0, Math.floor(Number(data.completedOrders) || 0)),
    ...coordinates(data),
  };
}

export const getPublicSeller = cache(async (sellerId: string): Promise<PublicSeller | null> => {
  if (!/^[a-zA-Z0-9_-]{1,160}$/.test(sellerId)) return null;
  const snapshot = await adminDb.collection('sellers').doc(sellerId).get();
  if (!snapshot.exists) return null;
  return serializeSeller(snapshot.id, snapshot.data() || {});
});

export async function listPublicSellers(maximum = 60): Promise<PublicSeller[]> {
  const limit = Math.min(Math.max(Math.floor(maximum), 1), 100);
  const snapshot = await adminDb
    .collection('sellers')
    .where('isApproved', '==', true)
    .limit(100)
    .get();
  return snapshot.docs
    .map((doc) => serializeSeller(doc.id, doc.data()))
    .filter((seller): seller is PublicSeller => Boolean(seller))
    .slice(0, limit);
}
