'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';

export default function Fab() {
  return (
    <Link href="/buy"
      className="fixed bottom-20 right-4 z-40 w-14 h-14 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full flex items-center justify-center shadow-lg shadow-orange-500/30 active:scale-90 transition-transform">
      <Plus className="w-6 h-6 text-white stroke-[2.5px]" />
    </Link>
  );
}
