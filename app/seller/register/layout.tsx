import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Register Your LPG Shop',
  description: 'Complete your OGas seller registration with your real business details, confirmed shop location, photos, stock, prices and delivery availability.',
  alternates: { canonical: '/sell' },
  robots: { index: false, follow: true },
  openGraph: {
    title: 'Register Your LPG Shop on OGas',
    description: 'Complete the self-service seller registration and submit your LPG business for OGas review.',
    url: '/sell',
  },
};

export default function SellerRegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
