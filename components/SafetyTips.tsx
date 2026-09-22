'use client';

import { useState, useEffect } from 'react';
import { Shield } from 'lucide-react';

const TIPS = [
  { icon: '🔍', text: 'Check your gas hose every month for cracks.' },
  { icon: '🚪', text: 'Keep your cylinder in open air, never inside a cupboard.' },
  { icon: '👃', text: 'Smell gas? Do not switch on any light. Open windows first.' },
  { icon: '🔒', text: 'Always turn off the valve after cooking.' },
  { icon: '🔥', text: 'Keep your cylinder far from fire and direct sun.' },
  { icon: '🧼', text: 'Check leaks with soapy water, never a phone torch.' },
  { icon: '👶', text: 'Keep children away from the gas cylinder.' },
  { icon: '🚗', text: 'Carry your cylinder standing up, never lying down.' },
];

export default function SafetyTips() {
  const [i, setI] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setI((p) => (p + 1) % TIPS.length), 5000);
    return () => clearInterval(t);
  }, []);

  const tip = TIPS[i];

  return (
    <button
      onClick={() => setI((p) => (p + 1) % TIPS.length)}
      className="flex w-full items-center gap-3 rounded-2xl border-2 bg-[#16305e] p-4 text-left"
      style={{ borderColor: '#12a5b0' }}
      aria-label="Gas safety tip. Tap for next tip."
    >
      <Shield size={22} color="#12a5b0" />
      <span style={{ fontSize: '26px' }}>{tip.icon}</span>
      <span className="text-[15px] font-medium leading-snug text-white">
        {tip.text}
      </span>
    </button>
  );
}
