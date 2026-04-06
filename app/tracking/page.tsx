'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

function TrackingContent() {
  const searchParams = useSearchParams();
  const [orderId, setOrderId] = useState<string | null>(null);
  
  useEffect(() => {
    const id = searchParams.get('orderId');
    setOrderId(id);
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-4">
      <h1 className="text-2xl font-bold text-orange-500 mb-4">Track Order - Oteri, Ughelli</h1>
      <div className="bg-zinc-900 rounded-xl p-4">
        <p>Order ID: {orderId || 'No order ID'}</p>
        <p className="mt-4 text-zinc-400">Tracking information coming soon...</p>
      </div>
    </div>
  );
}

export default function TrackingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-950 flex items-center justify-center text-orange-500">Loading...</div>}>
      <TrackingContent />
    </Suspense>
  );
}
