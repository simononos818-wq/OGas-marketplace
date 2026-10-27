import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cooking Gas Calculator — LPG kg, Litres and Refill Cost',
  description: 'Calculate how much cooking gas your money buys, convert LPG kilograms to litres, estimate cylinder refill costs and compare seller margins with the OGas gas calculator.',
  alternates: { canonical: '/calculator' },
  openGraph: {
    title: 'Free Cooking Gas Calculator — OGas',
    description: 'Convert LPG kg and litres, calculate refill costs and plan your next cooking gas purchase.',
    url: '/calculator',
  },
};

export default function CalculatorLayout({ children }: { children: React.ReactNode }) {
  return children;
}
