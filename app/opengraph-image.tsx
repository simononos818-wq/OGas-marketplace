import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'OGas — Verified LPG Marketplace';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px',
          background: 'linear-gradient(135deg, #16305e 0%, #1e4078 100%)',
          color: 'white',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div
            style={{
              width: '110px',
              height: '110px',
              borderRadius: '28px',
              background: '#12a5b0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '64px',
              fontWeight: 800,
            }}
          >
            G
          </div>
          <div style={{ fontSize: '96px', fontWeight: 800, letterSpacing: '2px' }}>OGAS</div>
        </div>
        <div style={{ marginTop: '40px', fontSize: '44px', fontWeight: 700 }}>
          Nigeria&apos;s Verified LPG Marketplace
        </div>
        <div style={{ marginTop: '20px', fontSize: '30px', color: '#2dd4c2' }}>
          Verified sellers · Live per-kg prices · Weigh-on-scale receipts
        </div>
      </div>
    ),
    { ...size }
  );
}
