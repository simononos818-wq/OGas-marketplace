import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Shop QR Code',
  description: 'Print your unique OGas seller QR code for walk-in customers.',
  robots: { index: false, follow: false },
};

export default function SellerQrLayout({ children }: { children: React.ReactNode }) {
  return children;
}
