'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Loader2, MapPin, MessageCircle, Navigation, Send, ShieldCheck, Sparkles } from 'lucide-react';
import { whatsappLink } from '@/lib/contact';

type Seller = {
  id: string;
  businessName: string;
  area: string;
  pricePerKg: number;
  deliveryFee: number;
  distanceKm?: number;
};

type AssistantAction = {
  label: string;
  href: string;
};

type AssistantResponse = {
  success: boolean;
  mode?: 'safety' | 'guide' | 'live-data' | 'ai-live-data';
  answer?: string;
  actions?: AssistantAction[];
  recommendations?: Seller[];
  notice?: string;
  message?: string;
};

const PROMPTS = [
  'How much is a 12.5kg refill near me?',
  'Show me affordable verified sellers in Ughelli',
  'How do I place my first order?',
  'How do I register as a seller?',
];

const SUPPORT_LINK = whatsappLink('Hello OGas support, I need help with the OGas AI assistant.');

export default function AssistantClient() {
  const [message, setMessage] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState('Add location for closer matches');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AssistantResponse | null>(null);
  const [error, setError] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('Location is not supported on this device');
      return;
    }
    setLocationStatus('Finding your location…');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
        setLocationStatus('Location added — used only for seller matching');
      },
      () => setLocationStatus('Location unavailable. You can still ask by town or area.'),
      { timeout: 10000, maximumAge: 300000 },
    );
  };

  const ask = async (event: FormEvent) => {
    event.preventDefault();
    if (message.trim().length < 2 || loading) return;
    setLoading(true);
    setError('');
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const timeout = setTimeout(() => controller.abort(), 25000);
    try {
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        signal: controller.signal,
        body: JSON.stringify({ message: message.trim(), location: coords }),
      });
      const data = await response.json() as AssistantResponse;
      if (!response.ok || !data.success) throw new Error(data.message || 'Please try again.');
      setResult(data);
    } catch (err: any) {
      const timedOut = err?.name === 'AbortError';
      setError(timedOut
        ? 'The assistant took too long to answer. Please try again.'
        : err?.message || 'The assistant is unavailable. Please try again.');
    } finally {
      clearTimeout(timeout);
      if (abortRef.current === controller) abortRef.current = null;
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh bg-[#f4f6f8] pb-12 text-[#16305e]" style={{ maxWidth: 480, margin: '0 auto' }}>
      <header className="px-5 pb-7 pt-6" style={{ background: 'linear-gradient(135deg, #16305e, #1e4078)' }}>
        <Link href="/" className="inline-flex min-h-[44px] items-center text-[13px] font-bold text-[#2dd4c2]">← OGas marketplace</Link>
        <div className="mt-3 flex items-center gap-2 text-[12px] font-bold text-[#2dd4c2]">
          <Sparkles size={17} /> OGAS AI + LIVE SELLER DATA
        </div>
        <h1 className="mt-2 max-w-[390px] text-[30px] font-black leading-[1.12] text-white">How can OGas AI help you today?</h1>
        <p className="mt-3 max-w-[420px] text-[15px] leading-relaxed text-[#c9d6e8]">Get clear steps for buying, orders and seller registration, or compare verified sellers with live OGas prices—never invented listings.</p>
      </header>

      <main className="px-4 py-5">
        <section aria-label="Ask OGas AI" aria-busy={loading} className="rounded-2xl bg-white p-4" style={{ boxShadow: '0 2px 8px rgba(20,30,50,.06)' }}>
          <div className="flex flex-wrap gap-2" aria-label="Suggested questions">
            {PROMPTS.map((prompt) => (
              <button key={prompt} type="button" disabled={loading} onClick={() => { setMessage(prompt); setResult(null); setError(''); }} className="min-h-[44px] rounded-xl border border-[#c9d6e8] px-3 py-2 text-left text-[12px] font-bold text-[#16305e] transition-colors hover:border-[#12a5b0] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#12a5b0] disabled:cursor-not-allowed disabled:opacity-50">
                {prompt}
              </button>
            ))}
          </div>

          <form onSubmit={ask} className="mt-4">
            <label htmlFor="gas-question" className="text-[12px] font-extrabold">Your question</label>
            <textarea
              id="gas-question"
              value={message}
              onChange={(event) => setMessage(event.target.value.slice(0, 500))}
              placeholder="For example: I need gas for a 12.5kg cylinder in Warri"
              rows={4}
              maxLength={500}
              required
              className="mt-2 w-full resize-none rounded-xl border border-[#c9d6e8] bg-[#f4f6f8] p-3 text-[16px] leading-relaxed text-[#16305e] outline-none focus:border-[#12a5b0]"
            />
            <div className="mt-2 flex items-center justify-between gap-3">
              <button type="button" onClick={requestLocation} className="flex min-h-[44px] flex-1 items-center gap-2 rounded-xl px-2 text-left text-[11px] font-bold text-[#0a7f88] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#12a5b0]">
                <Navigation size={16} className="shrink-0" />
                <span>{locationStatus}</span>
              </button>
              <span className="text-[11px] text-[#5b616b]">{message.length}/500</span>
            </div>
            <button type="submit" disabled={loading || message.trim().length < 2} className="mt-3 flex min-h-[50px] w-full items-center justify-center gap-2 rounded-xl bg-[#0a7f88] px-4 text-[14px] font-extrabold text-white transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#16305e] disabled:cursor-not-allowed disabled:opacity-50">
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={17} />}
              {loading ? 'Finding your OGas answer…' : 'Ask OGas AI'}
            </button>
          </form>
        </section>

        {error && (
          <div role="alert" className="mt-4 rounded-xl border border-[#e74c3c] bg-[#fff4f2] p-4 text-[14px] font-semibold text-[#9f2d20]">
            <p>{error}</p>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
              <Link href="/shops" className="underline">Browse shops</Link>
              <a href={SUPPORT_LINK} target="_blank" rel="noreferrer" className="underline">WhatsApp support</a>
            </div>
          </div>
        )}

        {result?.notice && (
          <div role="status" className="mt-4 rounded-xl border border-[#d8a72d] bg-[#fff9e8] p-3 text-[13px] font-semibold leading-relaxed text-[#6b4b00]">
            {result.notice}
          </div>
        )}

        {result?.answer && (
          <section aria-live="polite" className="mt-4 rounded-r-2xl border-l-[3px] border-[#12a5b0] bg-white p-4" style={{ boxShadow: '0 2px 8px rgba(20,30,50,.06)' }}>
            <div className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#0a7f88]">
              {result.mode === 'safety' ? <ShieldCheck size={16} /> : <Sparkles size={16} />}
              {result.mode === 'ai-live-data' ? 'Gemini answer + live OGas data' : result.mode === 'safety' ? 'Safety guidance' : result.mode === 'guide' ? 'OGas self-service guide' : 'Live-data recommendations'}
            </div>
            <p className="mt-3 whitespace-pre-wrap text-[15px] leading-[1.7] text-[#263b5a]">{result.answer}</p>
            {result.actions && result.actions.length > 0 && (
              <div className="mt-4 grid gap-2" aria-label="Next steps">
                {result.actions.map((action) => (
                  <Link key={action.href} href={action.href} className="flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-[#16305e] px-4 text-[13px] font-extrabold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#12a5b0]">
                    {action.label} <ArrowRight size={15} />
                  </Link>
                ))}
              </div>
            )}
          </section>
        )}

        {result?.recommendations && result.recommendations.length > 0 && (
          <section className="mt-5" aria-label="Recommended verified sellers">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[17px] font-extrabold">Top live matches</h2>
              <span className="text-[11px] font-bold text-[#5b616b]">Confirm on shop page</span>
            </div>
            <div className="space-y-3">
              {result.recommendations.map((seller) => (
                <article key={seller.id} className="rounded-2xl bg-white p-4" style={{ boxShadow: '0 2px 8px rgba(20,30,50,.06)' }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <ShieldCheck size={17} color="#0fa958" />
                        <h3 className="truncate text-[16px] font-extrabold">{seller.businessName}</h3>
                      </div>
                      <p className="mt-1 flex items-start gap-1 text-[12px] leading-relaxed text-[#5b616b]"><MapPin size={13} className="mt-0.5 shrink-0" />{seller.area}</p>
                      <p className="mt-1 text-[11px] font-semibold text-[#5b616b]">
                        {seller.distanceKm != null ? `${seller.distanceKm < 1 ? `${Math.round(seller.distanceKm * 1000)}m` : `${seller.distanceKm.toFixed(1)}km`} away • ` : ''}
                        {seller.deliveryFee > 0 ? `Delivery from ₦${seller.deliveryFee.toLocaleString()}` : 'Delivery fee confirmed at checkout'}
                      </p>
                    </div>
                    <p className="shrink-0 text-right text-[18px] font-black">₦{seller.pricePerKg.toLocaleString()}<span className="block text-[11px] font-semibold text-[#5b616b]">per kg</span></p>
                  </div>
                  <Link href={`/buy/${seller.id}`} className="mt-4 flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-[#16305e] px-4 text-[13px] font-extrabold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#12a5b0]">
                    View shop and order <ArrowRight size={15} />
                  </Link>
                </article>
              ))}
            </div>
          </section>
        )}

        <div className="mt-5 text-center">
          <a href={SUPPORT_LINK} target="_blank" rel="noreferrer" className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-4 text-[13px] font-extrabold text-[#16305e] underline decoration-[#12a5b0] decoration-2 underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#12a5b0]">
            <MessageCircle size={17} /> Need a person? WhatsApp OGas
          </a>
          <p className="mt-2 text-[12px] leading-relaxed text-[#5b616b]">AI can make mistakes. Seller names, prices and delivery details should always be confirmed on the live shop page before payment. Never share your password, PIN or OTP with the assistant.</p>
        </div>
      </main>
    </div>
  );
}
