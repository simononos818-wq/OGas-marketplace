'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { QRCodeSVG } from '@/components/vendor/qrcode.react';
import { ArrowLeft, Check, Copy, Download, ExternalLink, Printer, QrCode, Store } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/app/hooks/useAuth';
import { sellerIsApproved } from '@/lib/seller-badges';

const NAVY = '#16305e';
const TEAL = '#12a5b0';
const MUTED = '#697386';
const PRODUCTION_ORIGIN = 'https://www.ogaslpgmarketplace.com';

type SellerProfile = {
  businessName?: string;
  address?: string;
  city?: string;
  state?: string;
  pricePerKg?: number;
  isApproved?: boolean;
  verified?: boolean;
  isVerified?: boolean;
  status?: string;
};

function publicArea(seller: SellerProfile): string {
  const address = typeof seller.address === 'string' ? seller.address.trim() : '';
  const parts = address.split(',').map((part) => part.trim()).filter(Boolean);
  return (parts.length > 3 ? parts.slice(-3).join(', ') : address)
    || [seller.city, seller.state].filter(Boolean).join(', ')
    || 'Nigeria';
}

export default function SellerQrPage() {
  const { user, loading: authLoading } = useAuth();
  const [seller, setSeller] = useState<SellerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [printMode, setPrintMode] = useState<'poster' | 'stickers'>('poster');
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    getDoc(doc(db, 'sellers', user.uid))
      .then((snapshot) => {
        if (!active) return;
        setSeller(snapshot.exists() ? (snapshot.data() as SellerProfile) : null);
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setLoadError('We could not load your shop. Check your connection and try again.');
        setLoading(false);
      });

    return () => { active = false; };
  }, [authLoading, user]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#fafafa', color: NAVY }}>
        <p className="text-sm font-bold">Preparing your shop QR…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6" style={{ background: '#fafafa' }}>
        <div className="max-w-sm text-center">
          <QrCode size={40} color={NAVY} className="mx-auto mb-4" />
          <h1 className="text-2xl font-black" style={{ color: NAVY }}>Sign in to get your shop QR</h1>
          <p className="mt-2 text-sm leading-6" style={{ color: MUTED }}>Your QR is unique to your seller account. Sign in so we can load the right shop.</p>
          <Link href="/seller/login" className="inline-block mt-6 px-7 py-3.5 rounded-xl text-white font-extrabold" style={{ background: TEAL }}>Seller sign in</Link>
        </div>
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6" style={{ background: '#fafafa' }}>
        <div className="max-w-sm text-center">
          <h1 className="text-xl font-black" style={{ color: NAVY }}>Your QR could not be loaded</h1>
          <p className="mt-2 text-sm leading-6" style={{ color: MUTED }}>{loadError}</p>
          <button onClick={() => window.location.reload()} className="mt-6 px-7 py-3 rounded-xl text-white font-extrabold" style={{ background: NAVY }}>Try again</button>
        </div>
      </main>
    );
  }

  if (!seller) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6" style={{ background: '#fafafa' }}>
        <div className="max-w-sm text-center">
          <Store size={40} color={NAVY} className="mx-auto mb-4" />
          <h1 className="text-2xl font-black" style={{ color: NAVY }}>Register your shop first</h1>
          <p className="mt-2 text-sm leading-6" style={{ color: MUTED }}>A seller QR is created from your approved OGas shop, so buyers always reach the right seller.</p>
          <Link href="/seller/register" className="inline-block mt-6 px-7 py-3.5 rounded-xl text-white font-extrabold" style={{ background: TEAL }}>Register store</Link>
        </div>
      </main>
    );
  }

  const approved = seller.isApproved === true && sellerIsApproved(seller);
  const hasPrice = Number(seller.pricePerKg) > 0;
  const shopUrl = `${PRODUCTION_ORIGIN}/buy/${encodeURIComponent(user.uid)}`;
  const businessName = seller.businessName?.trim() || 'My OGas shop';
  const area = publicArea(seller);

  if (!approved || !hasPrice) {
    return (
      <main className="min-h-screen px-4 py-5" style={{ background: '#fafafa' }}>
        <div className="max-w-md mx-auto">
          <Link href="/seller/dashboard" className="inline-flex items-center gap-2 text-sm font-bold" style={{ color: NAVY }}><ArrowLeft size={18} /> Seller dashboard</Link>
          <div className="mt-8 bg-white border border-black/10 p-6">
            <p className="text-[11px] font-mono font-bold uppercase tracking-[0.18em]" style={{ color: TEAL }}>Shop QR</p>
            <h1 className="mt-2 text-2xl font-black leading-tight" style={{ color: '#191919' }}>
              {!approved ? 'Your shop is still awaiting approval' : 'Set your live price before printing'}
            </h1>
            <p className="mt-3 text-sm leading-6" style={{ color: MUTED }}>
              {!approved
                ? 'Your unique QR will be available after OGas approves your seller profile. This prevents buyers from scanning into a shop that cannot take orders yet.'
                : 'Buyers use your QR to see the current price and order. Add a valid price per kg in your dashboard first.'}
            </p>
            <Link href="/seller/dashboard" className="inline-block mt-6 px-6 py-3.5 rounded-xl text-white font-extrabold" style={{ background: NAVY }}>
              {!approved ? 'Check my seller setup' : 'Set price in dashboard'}
            </Link>
          </div>
        </div>
      </main>
    );
  }

  async function copyShopLink() {
    try {
      await navigator.clipboard.writeText(shopUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      window.prompt('Copy your shop link:', shopUrl);
    }
  }

  async function downloadQr() {
    if (!qrRef.current || downloading) return;
    const source = qrRef.current.querySelector('svg');
    if (!source) return;
    setDownloading(true);
    try {
      const svg = source.cloneNode(true) as SVGSVGElement;
      svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      svg.setAttribute('width', '1024');
      svg.setAttribute('height', '1024');
      const svgUrl = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml;charset=utf-8' }));
      const image = new Image();
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error('QR image could not be rendered'));
        image.src = svgUrl;
      });
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 1024;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Image download is not supported');
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, 1024, 1024);
      context.drawImage(image, 0, 0, 1024, 1024);
      URL.revokeObjectURL(svgUrl);
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('QR image could not be saved');
      const pngUrl = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = pngUrl;
      anchor.download = `OGas-${businessName.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'shop'}-QR.png`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(pngUrl), 1000);
    } catch {
      window.alert('Could not download the image. Use Print / Save PDF instead.');
    } finally {
      setDownloading(false);
    }
  }

  return (
    <main className={`qr-page mode-${printMode} min-h-screen pb-28`} style={{ background: '#fafafa', color: '#191919' }}>
      <div className="no-print max-w-md mx-auto px-4 pt-4">
        <div className="flex items-center gap-3">
          <Link href="/seller/dashboard" aria-label="Back to seller dashboard" className="p-2 bg-white border border-black/10 rounded-xl"><ArrowLeft size={19} color={NAVY} /></Link>
          <div>
            <h1 className="text-lg font-black" style={{ color: NAVY }}>Your shop QR</h1>
            <p className="text-xs" style={{ color: MUTED }}>For cylinders, counters and shop walls</p>
          </div>
        </div>

        <div className="mt-5 border-l-2 pl-3 py-1" style={{ borderColor: TEAL }}>
          <p className="text-sm font-extrabold">One code. Always your shop.</p>
          <p className="mt-1 text-xs leading-5" style={{ color: MUTED }}>Buyers scan to see your live price and place a real order. Scanning alone does not complete an order or payment.</p>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2" aria-label="Print format">
          {(['poster', 'stickers'] as const).map((mode) => (
            <button key={mode} type="button" onClick={() => setPrintMode(mode)} aria-pressed={printMode === mode}
              className="py-3 px-2 border text-sm font-extrabold rounded-xl"
              style={printMode === mode ? { background: NAVY, borderColor: NAVY, color: '#fff' } : { background: '#fff', borderColor: '#d7d7d7', color: '#191919' }}>
              {mode === 'poster' ? 'A4 shop poster' : '4 cylinder stickers'}
            </button>
          ))}
        </div>
        <p className="mt-2 text-[11px] leading-5" style={{ color: MUTED }}>
          {printMode === 'poster' ? 'Best for your entrance, counter or signboard.' : 'Four copies on one A4 sheet. Cut along the borders and use strong adhesive.'}
        </p>
      </div>

      <div className="qr-print-root max-w-md mx-auto px-4 mt-5">
        <article className="qr-print-poster">
          <header className="qr-poster-header">
            <div className="qr-brand">OGas<span>.</span></div>
            <p>VERIFIED LPG SELLER</p>
          </header>
          <div className="qr-poster-title">
            <p>COOKING GAS</p>
            <h2>SOLD HERE.</h2>
          </div>
          <p className="qr-seller-name">{businessName}</p>
          <p className="qr-seller-area">{area}</p>
          <div className="qr-poster-code" ref={qrRef}>
            <QRCodeSVG value={shopUrl} size={256} level="M" marginSize={4} bgColor="#ffffff" fgColor="#000000" title={`Scan to order from ${businessName} on OGas`} />
          </div>
          <p className="qr-scan-label">SCAN TO ORDER</p>
          <p className="qr-live-price">See today&apos;s price. Choose pickup or delivery.<br />Pay cash or online.</p>
          <ol className="qr-steps">
            <li><b>01</b><span>Scan</span></li>
            <li><b>02</b><span>Order</span></li>
            <li><b>03</b><span>Weigh &amp; fill</span></li>
          </ol>
          <footer className="qr-poster-footer">
            <span>No app download needed</span>
            <span>ogaslpgmarketplace.com</span>
          </footer>
        </article>

        <section className="qr-sticker-sheet" aria-label="Four printable shop stickers">
          {[0, 1, 2, 3].map((copy) => (
            <article className="qr-sticker" key={copy}>
              <QRCodeSVG value={shopUrl} size={128} level="M" marginSize={4} bgColor="#ffffff" fgColor="#000000" title={`Scan to order from ${businessName}`} />
              <div>
                <p className="qr-sticker-brand">OGas.</p>
                <h2>GAS HERE.</h2>
                <p className="qr-sticker-scan">SCAN TO ORDER</p>
                <p className="qr-sticker-seller">{businessName}</p>
                <p className="qr-sticker-note">Live price · Pickup or delivery</p>
              </div>
            </article>
          ))}
        </section>
      </div>

      <div className="no-print max-w-md mx-auto px-4 mt-4">
        <div className="border-t border-black/15 pt-4">
          <p className="text-xs font-extrabold" style={{ color: NAVY }}>Your permanent shop link</p>
          <p className="mt-1 break-all font-mono text-[10px] leading-4" style={{ color: MUTED }}>{shopUrl}</p>
          <div className="grid grid-cols-2 gap-2 mt-3">
            <button onClick={copyShopLink} className="flex items-center justify-center gap-2 py-3 bg-white border border-black/15 rounded-xl text-xs font-extrabold">
              {copied ? <Check size={15} color="#0fa958" /> : <Copy size={15} />} {copied ? 'Link copied' : 'Copy shop link'}
            </button>
            <Link href={`/buy/${user.uid}`} target="_blank" className="flex items-center justify-center gap-2 py-3 bg-white border border-black/15 rounded-xl text-xs font-extrabold">
              <ExternalLink size={15} /> Test my shop
            </Link>
          </div>
          <button onClick={downloadQr} disabled={downloading} className="mt-2 w-full flex items-center justify-center gap-2 py-3 bg-white border border-black/15 rounded-xl text-xs font-extrabold disabled:opacity-50">
            <Download size={15} /> {downloading ? 'Preparing image…' : 'Download QR image'}
          </button>
        </div>

        <div className="mt-5 text-xs leading-5" style={{ color: MUTED }}>
          <p className="font-extrabold" style={{ color: '#191919' }}>Before sharing your QR</p>
          <p className="mt-1">Keep your store open and your price and stock up to date. Online payment, cash confirmation, weighing and Door Code steps still happen in the normal OGas order flow.</p>
        </div>
      </div>

      <div className="no-print fixed bottom-0 left-0 right-0 z-20 px-4 py-3 bg-white border-t border-black/10" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
        <button onClick={() => window.print()} className="max-w-md mx-auto w-full flex items-center justify-center gap-2 py-4 rounded-xl text-white font-black" style={{ background: TEAL }}>
          <Printer size={19} /> Print / Save PDF — {printMode === 'poster' ? 'poster' : '4 stickers'}
        </button>
      </div>

      <style>{`
        .qr-print-poster { background: #fff; color: #000; border: 1px solid #d4d4d4; padding: 22px; font-family: Arial, Helvetica, sans-serif; }
        .qr-poster-header { display: flex; align-items: flex-end; justify-content: space-between; border-bottom: 1px solid #000; padding-bottom: 10px; }
        .qr-brand { font-size: 28px; line-height: 1; font-weight: 900; letter-spacing: -2px; }
        .qr-brand span { color: ${TEAL}; }
        .qr-poster-header p { margin: 0; font: 700 8px/1.2 monospace; letter-spacing: 1.2px; }
        .qr-poster-title { margin-top: 22px; }
        .qr-poster-title p { margin: 0; font: 700 13px/1 monospace; letter-spacing: 4px; }
        .qr-poster-title h2 { margin: 5px 0 0; font-size: 43px; line-height: .95; letter-spacing: -2px; font-weight: 900; }
        .qr-seller-name { margin: 18px 0 0; font-size: 15px; line-height: 1.25; font-weight: 800; overflow-wrap: anywhere; }
        .qr-seller-area { margin: 4px 0 0; font-size: 10px; line-height: 1.4; color: #444; }
        .qr-poster-code { width: 100%; max-width: 260px; margin: 18px auto 0; padding: 8px; background: #fff; }
        .qr-poster-code svg { display: block; width: 100%; height: auto; }
        .qr-scan-label { margin: 6px 0 0; text-align: center; font: 900 20px/1.2 monospace; letter-spacing: 2px; }
        .qr-live-price { margin: 9px 0 0; text-align: center; font-size: 11px; line-height: 1.5; }
        .qr-steps { list-style: none; display: grid; grid-template-columns: repeat(3, 1fr); margin: 18px 0 0; padding: 12px 0; border-top: 1px solid #000; border-bottom: 1px solid #000; }
        .qr-steps li { display: flex; flex-direction: column; gap: 4px; text-align: center; border-right: 1px solid #bbb; }
        .qr-steps li:last-child { border-right: 0; }
        .qr-steps b { font: 700 9px/1 monospace; }
        .qr-steps span { font-size: 11px; font-weight: 800; }
        .qr-poster-footer { display: flex; justify-content: space-between; gap: 8px; margin-top: 10px; font: 400 8px/1.3 monospace; }
        .qr-sticker-sheet { display: none; }
        @page { size: A4 portrait; margin: 12mm; }
        @media print {
          html, body { position: static !important; inset: auto !important; overflow: visible !important; width: auto !important; height: auto !important; background: #fff !important; }
          .ogas-phone { position: static !important; inset: auto !important; overflow: visible !important; height: auto !important; }
          body:has(.qr-page) .ogas-phone > main { min-height: 0 !important; padding: 0 !important; }
          body:has(.qr-page) .ogas-phone > main > :not(.qr-page),
          body:has(.qr-page) .ogas-phone > :not(main) { display: none !important; }
          body * { visibility: hidden !important; }
          .qr-print-root, .qr-print-root * { visibility: visible !important; }
          .no-print { display: none !important; }
          .qr-page { min-height: 0 !important; padding: 0 !important; background: #fff !important; }
          .qr-print-root { position: absolute !important; inset: 0 auto auto 0 !important; width: 186mm !important; max-width: none !important; margin: 0 !important; padding: 0 !important; }
          .qr-print-poster { width: 186mm; min-height: 258mm; padding: 12mm; border: 0; box-shadow: none; display: flex; flex-direction: column; }
          .qr-brand { font-size: 34px; }
          .qr-brand span { color: #000; }
          .qr-poster-header p { font-size: 10px; }
          .qr-poster-title { margin-top: 14mm; }
          .qr-poster-title p { font-size: 15px; }
          .qr-poster-title h2 { font-size: 56px; }
          .qr-seller-name { margin-top: 8mm; font-size: 18px; }
          .qr-seller-area { font-size: 12px; }
          .qr-poster-code { max-width: 80mm; margin-top: 8mm; padding: 0; }
          .qr-scan-label { font-size: 24px; margin-top: 3mm; }
          .qr-live-price { font-size: 13px; margin-top: 4mm; }
          .qr-steps { margin-top: auto; padding: 5mm 0; }
          .qr-steps b { font-size: 10px; }
          .qr-steps span { font-size: 13px; }
          .qr-poster-footer { font-size: 9px; margin-top: 4mm; }
          .mode-stickers .qr-print-poster { display: none !important; }
          .mode-stickers .qr-sticker-sheet { display: grid !important; grid-template-columns: repeat(2, 1fr); gap: 8mm 6mm; }
          .qr-sticker { min-height: 60mm; padding: 5mm; border: .35mm solid #000; display: grid; grid-template-columns: 34mm 1fr; align-items: center; gap: 4mm; break-inside: avoid; font-family: Arial, Helvetica, sans-serif; color: #000; background: #fff; }
          .qr-sticker > svg { display: block; width: 34mm; height: 34mm; }
          .qr-sticker-brand { margin: 0 0 3mm; font-size: 16px; line-height: 1; font-weight: 900; letter-spacing: -1px; }
          .qr-sticker h2 { margin: 0; font-size: 20px; line-height: 1; letter-spacing: -.5px; font-weight: 900; }
          .qr-sticker-scan { margin: 2mm 0 0; font: 900 10px/1.2 monospace; }
          .qr-sticker-seller { margin: 4mm 0 0; font-size: 10px; line-height: 1.3; font-weight: 800; overflow-wrap: anywhere; }
          .qr-sticker-note { margin: 1.5mm 0 0; font-size: 7px; line-height: 1.35; }
        }
      `}</style>
    </main>
  );
}
