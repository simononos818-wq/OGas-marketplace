'use client';

import { MessageCircle } from 'lucide-react';

export default function SupportButton() {
  return (
    <a 
      href="https://wa.me/2349133110237?text=Hi%20OGas%20Support"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-20 left-4 z-40 w-12 h-12 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30 active:scale-90 transition-transform"
    >
      <MessageCircle className="w-6 h-6 text-white" />
    </a>
  );
}
