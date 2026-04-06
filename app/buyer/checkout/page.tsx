'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

function CheckoutContent() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<any>(null);
  
  useEffect(() => {
    const order = searchParams.get('order');
    const reorder = searchParams.get('reorder');
    setData({ order, reorder });
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-4">
      <h1 className="text-2xl font-bold text-orange-500 mb-4">Checkout - Oteri, Ughelli</h1>
      <div className="bg-zinc-900 rounded-xl p-4">
        <p>Order: {data?.order || 'New Order'}</p>
        <p className="mt-4 text-zinc-400">Checkout form coming soon...</p>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-950 flex items-center justify-center text-orange-500">Loading...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
