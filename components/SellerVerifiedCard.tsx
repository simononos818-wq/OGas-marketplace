'use client';

import { useState } from 'react';
import { BadgeCheck, Download, Share2 } from 'lucide-react';
import type { SellerBadgeTier } from '@/lib/seller-badges';

const NAVY = '#16305e';
const TEAL = '#12a5b0';

function drawCard(businessName: string, tier: SellerBadgeTier, shopUrl: string): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 630;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.fillStyle = NAVY;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#1e4078';
  ctx.beginPath();
  ctx.arc(1050, 40, 350, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2dd4c2';
  ctx.fillRect(72, 70, 96, 8);

  ctx.fillStyle = '#ffffff';
  ctx.font = '800 34px Arial, sans-serif';
  ctx.fillText('OGas', 72, 135);
  ctx.fillStyle = '#9fb4d8';
  ctx.font = '600 18px Arial, sans-serif';
  ctx.fillText('VERIFIED LPG MARKETPLACE', 72, 170);

  ctx.fillStyle = '#2dd4c2';
  ctx.beginPath();
  ctx.arc(108, 282, 42, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = NAVY;
  ctx.lineWidth = 10;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(88, 282);
  ctx.lineTo(103, 298);
  ctx.lineTo(132, 263);
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 58px Arial, sans-serif';
  ctx.fillText(`I'M ${tier} ON OGAS`, 174, 302);
  ctx.font = '800 40px Arial, sans-serif';
  const safeName = businessName.length > 34 ? `${businessName.slice(0, 33)}…` : businessName;
  ctx.fillText(safeName, 72, 405);

  ctx.fillStyle = '#c9d6e8';
  ctx.font = '500 25px Arial, sans-serif';
  ctx.fillText('Live per-kg prices • Weighed receipts • Escrow-protected orders', 72, 465);
  ctx.fillStyle = '#2dd4c2';
  ctx.font = '700 23px Arial, sans-serif';
  ctx.fillText(shopUrl.replace(/^https?:\/\//, ''), 72, 545);
  return canvas;
}

export default function SellerVerifiedCard({
  businessName,
  sellerId,
  tier,
  completedOrders,
  nextTier,
  ordersToNext,
}: {
  businessName: string;
  sellerId: string;
  tier: SellerBadgeTier;
  completedOrders: number;
  nextTier?: SellerBadgeTier;
  ordersToNext?: number;
}) {
  const [message, setMessage] = useState('');
  const shopUrl = `https://ogaslpgmarketplace.com/buy/${sellerId}`;
  const shareText = `I'm ${tier.toLowerCase()} on OGas! Buy LPG from ${businessName} with live per-kg prices and weighed receipts: ${shopUrl}`;

  const shareCard = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: `${businessName} on OGas`, text: shareText, url: shopUrl });
        setMessage('Verification card shared.');
      } else {
        await navigator.clipboard.writeText(shareText);
        setMessage('Share text copied — paste it on WhatsApp or social media.');
      }
    } catch (error: any) {
      if (error?.name !== 'AbortError') setMessage('Could not share. Download the card instead.');
    }
  };

  const downloadCard = () => {
    const canvas = drawCard(businessName, tier, shopUrl);
    const link = document.createElement('a');
    link.download = `${businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-ogas-${tier.toLowerCase()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    setMessage('Verification card downloaded.');
  };

  return (
    <section aria-label="Seller verification card" className="overflow-hidden rounded-2xl bg-white" style={{ boxShadow: '0 2px 8px rgba(20,30,50,.06)' }}>
      <div className="p-4" style={{ background: `linear-gradient(135deg, ${NAVY}, #1e4078)` }}>
        <div className="flex items-center gap-2">
          <BadgeCheck size={24} color="#2dd4c2" />
          <div>
            <p className="text-[10px] font-bold tracking-[0.16em]" style={{ color: '#9fb4d8' }}>I'M {tier} ON OGAS</p>
            <h2 className="text-white text-[16px] font-extrabold">{businessName}</h2>
          </div>
        </div>
        <p className="mt-3 text-[11px] leading-relaxed" style={{ color: '#c9d6e8' }}>
          Live per-kg prices • Weighed receipts • Escrow-protected orders
        </p>
      </div>
      <div className="p-3.5">
        <p className="text-[11px] font-semibold" style={{ color: '#5b616b' }}>
          {completedOrders} completed orders{nextTier ? ` • ${ordersToNext} more to ${nextTier}` : ' • Highest seller badge earned'}
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button type="button" onClick={shareCard} className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-3 text-[12px] font-extrabold text-white" style={{ background: TEAL }}>
            <Share2 size={15} /> Share card
          </button>
          <button type="button" onClick={downloadCard} className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-3 text-[12px] font-extrabold" style={{ color: NAVY, border: '1.5px solid #c9d6e8' }}>
            <Download size={15} /> Download
          </button>
        </div>
        {message && <p role="status" className="mt-2 text-[11px] font-semibold" style={{ color: '#0a7a42' }}>{message}</p>}
      </div>
    </section>
  );
}
