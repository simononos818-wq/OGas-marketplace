'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

/**
 * Captures ?ref= invite links (e.g. ogaslpgmarketplace.com/?ref=USERID)
 * into localStorage so signup can attribute the referral.
 * Skips /orders, where ?ref= carries a Paystack order id instead.
 */
export default function CaptureRef() {
  const searchParams = useSearchParams();
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === '/orders') return;
    const ref = searchParams.get('ref');
    if (ref && /^[A-Za-z0-9_-]{6,64}$/.test(ref)) {
      try {
        localStorage.setItem('ogas_ref', ref);
      } catch {
        /* private mode */
      }
    }
  }, [searchParams, pathname]);

  return null;
}
