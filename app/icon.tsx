import { ImageResponse } from 'next/og';

export const size = { width: 512, height: 512 };
export const contentType = 'image/png';

export default function Icon() {
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
            width: 420,
            height: 460,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(180deg,#1B2A4A 0%,#0B1224 100%)',
            border: '14px solid #D4AF37',
            borderRadius: '40px 40px 210px 210px',
            color: '#F3E3A1',
            fontSize: 72,
            fontWeight: 800,
            letterSpacing: 4,
          }}
        >
          OGAS
        </div>
      </div>
    ),
    size,
  );
}
