import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0B1224',
        }}
      >
        <div
          style={{
            width: 148,
            height: 160,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(180deg,#1B2A4A 0%,#0B1224 100%)',
            border: '8px solid #D4AF37',
            borderRadius: '18px 18px 74px 74px',
            color: '#F3E3A1',
            fontSize: 22,
            fontWeight: 800,
            letterSpacing: 1,
          }}
        >
          OG
        </div>
      </div>
    ),
    size,
  );
}
