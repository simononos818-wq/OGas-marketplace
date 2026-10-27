import type { Metadata } from 'next';
import AssistantClient from './AssistantClient';

export const metadata: Metadata = {
  title: 'OGas AI — Cooking Gas Prices, Refill Costs and Sellers',
  description: 'Ask OGas AI how much cooking gas you can buy, estimate LPG refill costs and find verified sellers using live OGas prices per kg and location-based recommendations.',
  alternates: { canonical: '/assistant' },
  openGraph: {
    title: 'Ask OGas AI — Cooking Gas Help from Live Seller Data',
    description: 'Get cooking gas refill guidance and verified seller recommendations grounded in live OGas shop listings.',
    url: '/assistant',
    type: 'website',
    locale: 'en_NG',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ask OGas AI — Cooking Gas Help',
    description: 'Refill cost guidance and verified LPG seller recommendations from live OGas data.',
  },
};

export default function AssistantPage() {
  return <AssistantClient />;
}
