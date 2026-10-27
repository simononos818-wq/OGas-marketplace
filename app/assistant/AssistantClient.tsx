'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, BadgeCheck, Bot, MapPin, Send, Sparkles } from 'lucide-react';

const NAVY = '#16305e';
const TEAL = '#12a5b0';

const PROMPTS = [
  'Where can I find affordable cooking gas in Ughelli?',
  'How much gas can ₦10,000 buy?',
  'I smell gas in my kitchen. What should I do?',
];

type Recommendation = {
  id: string;
  businessName: string;
  area: string;
  pricePerKg: number;
  deliveryFee: number;
  distanceKm?: number;
};

type AssistantResult = {
  success: boolean;
  mode?: 'ai-live-data' | 'live-data' | 'safety';
  answer?: string;
  message?: string;
  recommendations?: Recommendation[];
};

export default function AssistantClient() {
  const [message, setMessage] = useState('');
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AssistantResult | null>(null);

  const useLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('Location is not supported on this device. You can still ask by town or area.');
      return;
    }
    setLocationStatus('Finding your location…');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
        setLocationStatus('Location added for this question. It is not saved by OGas.');
      },
      () => setLocationStatus('We could not access your location. Type your town or area instead.'),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  };

  const ask = async (event?: FormEvent) => {
    event?.preventDefault();
    if (message.trim().length < 2 || loading) return;
    setLoading(true);
    setResult(null);
    try {
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: message.trim(), location }),
      });
      const data = await response.json() as AssistantResult;
      setResult(response.ok ? data : { success: false, message: data.message || 'Please try again.' });
    } catch {
      setResult({ success: false, message: 'Network error. Check your connection and try again.' });
    } finally {
      setLoading(false);
    }
  };

  const modeLabel = result?.mode === 'ai-live-data'
    ? 'OGas AI answer'
    : result?.mode === 'safety'
      ? 'Safety guidance'
      : 'Live-data recommendations';

  return (
    <div className="min-h-dvh bg-[#f4f6f8] pb-10 text-[#16305e]" style={{ maxWidth: 480, margin: '0 auto' }}>
      <header className="px-5 pb-6 pt-7 text-white" style={{ background: 'linear-gradient(135deg, #16305e, #1e4078)' }}>
        <Link href="/" className="inline-flex min-h-[36px] items-center text-[13px] font-bold text-[#2dd4c2]">← OGas marketplace</Link>
        <div className="mt-3 flex items-center gap-2">
          <Sparkles size={22} color="#2dd4c2" />
          <h1 className="text-[27px] font-black">Ask OGas AI</h1>
        </div>
        <p className="mt-2 max-w-[390px] text-[14px] leading-relaxed text-[#c9d6e8]">Cooking gas guidance, refill estimates and verified seller recommendations from live OGas listings.</p>
      </header>

      <main className="px-4 py-5">
        <div className="flex flex-wrap gap-2" aria-label="Suggested questions">
          {PROMPTS.map((prompt) => (
            <button key={prompt} type="button" onClick={() => setMessage(prompt)} className="rounded-full border border-[#c9d6e8] bg-white px-3 py-2 text-left text-[11px] font-semibold text-[#33465f]">{prompt}</button>
          ))}
        </div>

        <form onSubmit={ask} className="mt-4 rounded-2xl bg-white p-4" style={{ boxShadow: '0 2px 8px rgba(20,30,50,.06)' }}>
          <label htmlFor="assistant-question" className="text-[13px] font-extrabold">What do you need help with?</label>
          <textarea
            id="assistant-question"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            maxLength={500}
            rows={4}
            placeholder="e.g. Find an affordable seller in Warri"
            className="mt-2 w-full resize-none rounded-xl border border-[#d8e0ec] bg-[#f8fafc] p-3 text-[15px] leading-relaxed outline-none focus:border-[#12a5b0]"
          />
          <div className="mt-1 flex items-center justify-between gap-3">
            <button type="button" onClick={useLocation} className="flex min-h-[40px] items-center gap-1.5 text-[12px] font-bold text-[#0a7f88]"><MapPin size={15} />{location ? 'Location added' : 'Use my location'}</button>
            <span className="text-[11px] text-[#7a8492]">{message.length}/500</span>
          </div>
          {locationStatus && <p className="mb-2 text-[11px] leading-relaxed text-[#5b616b]">{locationStatus}</p>}
          <button type="submit" disabled={loading || message.trim().length < 2} className="flex min-h-[50px] w-full items-center justify-center gap-2 rounded-xl px-4 text-[14px] font-extrabold text-white disabled:opacity-50" style={{ background: TEAL }}>
            <Send size={17} /> {loading ? 'Checking live sellers…' : 'Ask OGas AI'}
          </button>
        </form>

        {result && !result.success && (
          <div role="alert" className="mt-4 rounded-2xl border border-[#f0c4c4] bg-[#fff6f6] p-4 text-[13px] leading-relaxed text-[#8d2f2f]">
            {result.message} <Link href="/shops" className="font-bold underline">Browse shops</Link>
          </div>
        )}

        {result?.success && result.answer && (
          <section className="mt-4 rounded-2xl bg-white p-4" style={{ boxShadow: '0 2px 8px rgba(20,30,50,.06)' }} aria-live="polite">
            <div className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-wide text-[#0a7f88]"><Bot size={17} />{modeLabel}</div>
            <p className="mt-3 whitespace-pre-wrap text-[14px] leading-[1.75] text-[#263c59]">{result.answer}</p>
          </section>
        )}

        {result?.recommendations && result.recommendations.length > 0 && (
          <section className="mt-5" aria-label="Recommended verified sellers">
            <h2 className="text-[16px] font-extrabold">Verified seller options</h2>
            <div className="mt-3 space-y-3">
              {result.recommendations.map((seller) => (
                <article key={seller.id} className="rounded-2xl bg-white p-4" style={{ boxShadow: '0 2px 8px rgba(20,30,50,.06)' }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5"><BadgeCheck size={17} color="#0fa958" /><h3 className="truncate text-[15px] font-extrabold">{seller.businessName}</h3></div>
                      <p className="mt-1 text-[12px] leading-relaxed text-[#5b616b]">{seller.area}</p>
                      {seller.distanceKm != null && <p className="mt-1 text-[11px] font-semibold text-[#0a7f88]">About {seller.distanceKm < 1 ? `${Math.round(seller.distanceKm * 1000)}m` : `${seller.distanceKm.toFixed(1)}km`} away</p>}
                    </div>
                    <p className="shrink-0 text-right text-[17px] font-black">₦{seller.pricePerKg.toLocaleString()}<span className="block text-[10px] font-semibold text-[#5b616b]">per kg</span></p>
                  </div>
                  <p className="mt-2 text-[11px] text-[#5b616b]">{seller.deliveryFee > 0 ? `Listed delivery fee: ₦${seller.deliveryFee.toLocaleString()}` : 'Delivery fee not listed — confirm before ordering.'}</p>
                  <Link href={`/buy/${seller.id}`} className="mt-3 flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#16305e] px-4 text-[12px] font-extrabold text-white">View live shop and order <ArrowRight size={14} /></Link>
                </article>
              ))}
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-[#5b616b]">Seller details come from current OGas listings. Confirm the live price, stock and delivery fee on the shop page before payment.</p>
          </section>
        )}

        <p className="mt-6 text-center text-[11px] leading-relaxed text-[#7a8492]">For emergencies, move to a safe place and contact local emergency help. OGas AI does not replace professional safety or medical advice.</p>
      </main>
    </div>
  );
}
