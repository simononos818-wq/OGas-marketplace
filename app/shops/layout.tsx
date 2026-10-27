import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Verified LPG Shops Near You — Live Cooking Gas Prices',
  description: 'Browse verified cooking gas sellers on OGas. Compare live LPG prices per kg, find sellers in Ughelli, Warri and across Nigeria, and order with a weighed receipt.',
  alternates: { canonical: '/shops' },
  openGraph: {
    title: 'Verified LPG Shops Near You — OGas',
    description: 'Compare verified LPG sellers and live cooking gas prices per kg on OGas.',
    url: '/shops',
  },
};

export default function ShopsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
