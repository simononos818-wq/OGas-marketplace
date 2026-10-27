import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Buy Cooking Gas Online — Verified LPG Sellers',
  description: 'Find verified LPG sellers, compare live cooking gas prices per kg and order your next refill on OGas.',
  alternates: { canonical: '/buy' },
};

export default function BuyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
