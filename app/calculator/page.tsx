'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import SmartGasCalculator from '@/app/components/SmartGasCalculator';

function CalculatorInner() {
  const params = useSearchParams();
  const forSeller = params.get('for') === 'seller';
  return <SmartGasCalculator defaultMode={forSeller ? 'seller' : 'buyer'} />;
}

export default function CalculatorPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-black" />}>
      <CalculatorInner />
    </Suspense>
  );
}
