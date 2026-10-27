import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sell Cooking Gas Online — Register Your LPG Shop Free',
  description: 'Register your LPG shop on OGas, reach cooking gas buyers near you, show your live price per kg and build a verifiable sales record with digital orders and weighed receipts.',
  alternates: { canonical: '/seller/register' },
  openGraph: {
    title: 'Sell Cooking Gas Online with OGas',
    description: 'List your verified LPG shop on OGas and reach more cooking gas buyers near you.',
    url: '/seller/register',
  },
};

export default function SellerRegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
