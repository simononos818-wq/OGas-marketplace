'use client';

import SmartGasCalculator from './components/SmartGasCalculator';
import { useSellers } from './hooks/useSellers';

export default function HomePage() {
  const { sellers } = useSellers();
  const mega =
    sellers.find((s) => /mega think/i.test(s.businessName || '')) ||
    sellers.find((s) => /ughelli|oteri/i.test(`${s.address || ''} ${s.city || ''}`)) ||
    sellers[0];

  return (
    <SmartGasCalculator
      defaultMode="buyer"
      shopName={mega?.businessName || 'Mega Think Success'}
      shopArea={mega?.address || mega?.city || 'Oteri, Ughelli'}
      lockedPrice={mega?.pricePerKg || 1350}
      refillHref={mega ? `/buy/${mega.id}` : undefined}
    />
  );
}
