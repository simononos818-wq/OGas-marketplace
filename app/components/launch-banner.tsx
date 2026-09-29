'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const MESSAGES = [
  '🔥 90-Day Free Program is live',
  '💰 Sellers: ₦0 commission + ₦300 per referral',
  '🎁 Buyers: ₦300 gas credit on first order',
];

export default function LaunchBanner() {
  const [i, setI] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Respect dismissal for 24h, then show again
    const hid = Number(localStorage.getItem('ogas_banner_hide') || 0);
    if (Date.now() - hid < 24 * 60 * 60 * 1000) return;
    setVisible(true);
    const t = setInterval(() => setI(v => (v + 1) % MESSAGES.length), 3500);
    return () => clearInterval(t);
  }, []);

  if (!visible) return null;

  return (
    <>
      <style>{`
        @keyframes ogasShine { from { transform: translateX(-120%) skewX(-20deg); } to { transform: translateX(240%) skewX(-20deg); } }
        @keyframes ogasMsgIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        @keyframes ogasPulse { 0%,100% { box-shadow: 0 0 0 0 rgba(45,212,194,.6); } 50% { box-shadow: 0 0 0 6px rgba(45,212,194,0); } }
        .ogas-banner { position: relative; overflow: hidden; background: linear-gradient(100deg,#071c33 0%,#0a8f84 55%,#0fb5a6 100%); }
        .ogas-banner::after { content:''; position:absolute; top:0; bottom:0; width:60px; background: linear-gradient(90deg, transparent, rgba(255,255,255,.28), transparent); animation: ogasShine 3.5s ease-in-out infinite; }
        .ogas-msg { animation: ogasMsgIn .45s ease both; }
        .ogas-dot { width:8px; height:8px; border-radius:50%; background:#2dd4c2; animation: ogasPulse 1.6s infinite; }
      `}</style>
      <Link href="/launch" className="ogas-banner"
        style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '11px 12px', textDecoration: 'none', color: '#fff' }}>
        <span className="ogas-dot" style={{ flexShrink: 0 }} />
        <span key={i} className="ogas-msg"
          style={{ flex: 1, minWidth: 0, fontSize: '12.5px', fontWeight: 800, letterSpacing: '.1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {MESSAGES[i]}
        </span>
        <span style={{ flexShrink: 0, background: 'rgba(255,255,255,.2)', borderRadius: 999, padding: '3px 11px', fontSize: '11.5px', fontWeight: 800 }}>
          Learn more →
        </span>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            localStorage.setItem('ogas_banner_hide', String(Date.now()));
            setVisible(false);
          }}
          aria-label="Dismiss"
          style={{ flexShrink: 0, background: 'rgba(255,255,255,.15)', border: 'none', color: '#fff', width: '20px', height: '20px', borderRadius: '50%', fontSize: '11px', lineHeight: '20px', cursor: 'pointer', padding: 0 }}>
          ✕
        </button>
      </Link>
    </>
  );
}
