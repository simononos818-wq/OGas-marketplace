import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { listPublicSellers, type PublicSeller } from '@/lib/public-sellers';
import { GAS_LOCATIONS, sellersForLocation } from '@/lib/gas-locations';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Coordinates = { lat: number; lng: number };
type RankedSeller = PublicSeller & { distanceKm?: number };

const attempts = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 12;

function allowed(ip: string): boolean {
  const now = Date.now();
  const current = attempts.get(ip);
  if (!current || current.resetAt <= now) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (current.count >= MAX_REQUESTS) return false;
  current.count += 1;
  return true;
}

function distanceKm(a: Coordinates, b: Coordinates): number {
  const radians = (degrees: number) => degrees * Math.PI / 180;
  const dLat = radians(b.lat - a.lat);
  const dLng = radians(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(radians(a.lat)) * Math.cos(radians(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function rankSellers(sellers: PublicSeller[], message: string, coords: Coordinates | null): RankedSeller[] {
  const query = message.toLowerCase();
  const wantsCheap = /cheap|lowest|affordable|budget|best price/.test(query);
  const meaningfulWords = new Set(query.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((word) => word.length >= 4));
  const requestedLocations = GAS_LOCATIONS.filter((location) =>
    [location.name, ...location.searchTerms].some((term) => meaningfulWords.has(term.toLowerCase()))
  );

  const ranked = sellers.map((seller) => {
    const distance = coords && seller.lat != null && seller.lng != null
      ? distanceKm(coords, { lat: seller.lat, lng: seller.lng })
      : undefined;
    const haystack = `${seller.businessName} ${seller.area} ${seller.city || ''} ${seller.state || ''}`.toLowerCase();
    const knownLocationMatch = requestedLocations.some((location) => sellersForLocation([seller], location).length > 0);
    const locationMatches = [...meaningfulWords].filter((word) => haystack.includes(word)).length + (knownLocationMatch ? 10 : 0);
    return { ...seller, distanceKm: distance, locationMatches, knownLocationMatch };
  });

  const eligible = requestedLocations.length ? ranked.filter((seller) => seller.knownLocationMatch) : ranked;
  return eligible
    .sort((a, b) => {
      if (a.locationMatches !== b.locationMatches) return b.locationMatches - a.locationMatches;
      if (wantsCheap && a.pricePerKg !== b.pricePerKg) return a.pricePerKg - b.pricePerKg;
      const aDistance = a.distanceKm ?? 50;
      const bDistance = b.distanceKm ?? 50;
      if (aDistance !== bDistance) return aDistance - bDistance;
      return a.pricePerKg - b.pricePerKg;
    })
    .slice(0, 3)
    .map(({ locationMatches: _locationMatches, knownLocationMatch: _knownLocationMatch, ...seller }) => seller);
}

function fallbackAnswer(recommendations: RankedSeller[], hasCoords: boolean): string {
  if (!recommendations.length) {
    return 'I could not find a live verified seller listing to recommend right now. Please browse all shops or contact OGas support for help.';
  }
  const first = recommendations[0];
  const distance = first.distanceKm != null ? `, about ${first.distanceKm < 1 ? `${Math.round(first.distanceKm * 1000)}m` : `${first.distanceKm.toFixed(1)}km`} away` : '';
  return `I found ${recommendations.length} live seller ${recommendations.length === 1 ? 'match' : 'matches'}. ${first.businessName} is listed at ₦${first.pricePerKg.toLocaleString()}/kg${distance}. Compare the options below and confirm the current price and delivery fee on the shop page before ordering.${hasCoords ? ' Matches use your location.' : ' Add your location for distance-based matching.'}`;
}

function json(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (!allowed(ip)) return json({ success: false, message: 'Too many requests. Please wait a minute and try again.' }, 429);

  try {
    const body = await req.json();
    const message = typeof body.message === 'string' ? body.message.trim().slice(0, 500) : '';
    if (message.length < 2) return json({ success: false, message: 'Tell us what cooking gas help you need.' }, 400);

    if (/smell gas|gas leak|leaking gas|gas is leaking/.test(message.toLowerCase())) {
      return json({
        success: true,
        mode: 'safety',
        answer: 'Do not use flames, light switches or phones indoors. Open doors and windows, close the cylinder valve only if it is safe to reach, and move everyone outside. Call your gas seller or emergency help from a safe distance.',
        recommendations: [],
      });
    }

    let coords: Coordinates | null = null;
    const lat = Number(body.location?.lat);
    const lng = Number(body.location?.lng);
    if (Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
      coords = { lat, lng };
    }

    const sellers = await listPublicSellers(60);
    const recommendations = rankSellers(sellers, message, coords);
    const fallback = fallbackAnswer(recommendations, Boolean(coords));
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || !recommendations.length) {
      return json({ success: true, mode: 'live-data', answer: fallback, recommendations });
    }

    const catalog = recommendations.map((seller) => ({
      id: seller.id,
      businessName: seller.businessName,
      area: seller.area,
      pricePerKgNaira: seller.pricePerKg,
      deliveryFeeNaira: seller.deliveryFee > 0 ? seller.deliveryFee : null,
      distanceKm: seller.distanceKm == null ? null : Number(seller.distanceKm.toFixed(1)),
    }));

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite',
        systemInstruction: `You are OGas AI, a concise cooking-gas shopping assistant for Nigeria. Use ONLY the supplied live seller catalog for seller names, areas, prices, distances and delivery fees. Never invent sellers, prices, ratings, stock, delivery times or promises. You may calculate refill costs from catalog prices and show the calculation. A null delivery fee means the fee is unknown, not free. Mention that buyers should confirm the current price and delivery fee on the shop page. Recommend only catalog sellers and keep answers under 180 words. If the request is unrelated to LPG, briefly redirect to cooking gas help.`,
      });
      const result = await model.generateContent({
        contents: [{
          role: 'user',
          parts: [{ text: `Buyer request: ${message}\n\nLive seller catalog:\n${JSON.stringify(catalog)}` }],
        }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 400 },
      });
      const answer = result.response.text().trim();
      return json({ success: true, mode: 'ai-live-data', answer: answer || fallback, recommendations });
    } catch (error) {
      console.error('OGas AI generation failed; using live-data fallback:', error instanceof Error ? error.message : 'unknown error');
      return json({ success: true, mode: 'live-data', answer: fallback, recommendations });
    }
  } catch (error) {
    console.error('OGas assistant route failed:', error instanceof Error ? error.message : 'unknown error');
    return json({ success: false, message: 'The assistant could not load seller data. Please try again or browse all shops.' }, 500);
  }
}
