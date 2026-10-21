'use client';

import { useRouter } from 'next/navigation';
import { CheckCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const kits = [
  {
    id: 'starter',
    name: 'STARTER KIT',
    price: 85000,
    badge: 'Most Popular',
    badgeColor: 'bg-[#12a5b0]',
    features: [
      '12.5kg gas cylinder (brand new)',
      'Digital weighing scale',
      'Fire extinguisher (2kg)',
      'Safety apron & gloves',
      'OGas branded signage',
      'Seller onboarding training',
    ],
    ctaColor: 'bg-[#12a5b0]',
  },
  {
    id: 'pro',
    name: 'PRO KIT',
    price: 150000,
    badge: null,
    badgeColor: '',
    features: [
      '25kg + 12.5kg cylinders',
      'Heavy-duty digital scale',
      'Fire extinguisher (4kg)',
      'Complete safety gear set',
      'Large OGas shop banner',
      'Priority seller support',
      'Free first month on OGas',
    ],
    ctaColor: 'bg-[#0e8a94]',
  },
  {
    id: 'plant',
    name: 'MINI-PLANT KIT',
    price: 350000,
    badge: null,
    badgeColor: '',
    features: [
      '50kg cylinder + decanting kit',
      'Industrial digital scale',
      '2x Fire extinguishers (6kg)',
      'Full PPE & safety station',
      'OGas plant certification support',
      'Dedicated account manager',
    ],
    ctaColor: 'bg-[#16305e]',
  },
];

export default function BuyKitPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#f4f6f8] text-[#16305e] pb-20">
      <div className="sticky top-0 bg-[#f4f6f8] border-b border-[#e6e9ee] p-4 z-10 flex items-center gap-3">
        <button onClick={() => router.back()} className="p-1">
          <ArrowLeft size={24} className="text-[#8a8f98]" />
        </button>
        <div>
          <h1 className="text-xl font-bold">OGas Seller Kits</h1>
          <p className="text-sm text-[#8a8f98]">Everything you need to start selling gas</p>
        </div>
      </div>

      <div className="p-4 max-w-lg mx-auto space-y-5">
        {kits.map((kit) => (
          <div
            key={kit.id}
            className="bg-white border border-[#e6e9ee] rounded-2xl p-5 relative overflow-hidden"
          >
            {kit.badge && (
              <span className={`absolute top-4 right-4 ${kit.badgeColor} text-white text-xs font-bold px-3 py-1 rounded-full`}>
                {kit.badge}
              </span>
            )}
            <div className="mb-4">
              <p className="text-sm font-semibold text-[#8a8f98]">{kit.name}</p>
              <p className="text-3xl font-bold mt-1">₦{kit.price.toLocaleString()}</p>
            </div>
            <ul className="space-y-2 mb-5">
              {kit.features.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-[#8a8f98]">
                  <CheckCircle size={14} className="text-green-500 mt-0.5 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => alert('Kit ordering coming soon! Contact support@ogaslpgmarketplace.com')}
              className={`w-full ${kit.ctaColor} text-white font-bold py-3 rounded-xl`}
            >
              Buy {kit.name.split(' ')[0]} Kit
            </button>
          </div>
        ))}

        <div className="bg-white/50 border border-[#e6e9ee] rounded-xl p-4 text-center">
          <p className="text-sm text-[#8a8f98]">
            Already have equipment?{' '}
            <Link href="/seller/register" className="text-[#12a5b0] font-semibold">
              Register as a seller instead ›
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
