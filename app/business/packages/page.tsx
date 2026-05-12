'use client';

import { Flame, ShoppingCart, ArrowRight, Star, TrendingUp, Shield, Truck 
} from 'lucide-react';
import Link from 'next/link';

const packages = [
  {
    id: 'starter',
    name: 'Starter Spark',
    tagline: 'Begin Your LPG Journey',
    price: 350000,
    originalPrice: 400000,
    badge: 'Most Popular',
    badgeColor: 'bg-orange-500',
    description: 'Everything you need to start selling gas today.',
    items: [
      '1x 47kg Brand New Cylinder',
      '1x Digital Weighing Scale',
      '1x High-Pressure Gas Hose 3m',
      '1x Regulator Valve Set',
      '1x Safety Fire Extinguisher',
      'OGas Branded Apron and Cap FREE',
      'Business Registration Guide FREE',
    ],
    savings: 50000,
    color: 'from-orange-500 to-red-600',
    borderColor: 'border-orange-500',
  },
  {
    id: 'pro',
    name: 'Pro Dealer',
    tagline: 'Scale Your Business Fast',
    price: 650000,
    originalPrice: 750000,
    badge: 'Best Value',
    badgeColor: 'bg-amber-500',
    description: 'Double your capacity. For serious builders.',
    items: [
      '2x 47kg Brand New Cylinders',
      '1x Industrial Digital Scale',
      '2x High-Pressure Gas Hose 5m',
      '2x Regulator Valve Set',
      '1x Safety Fire Extinguisher',
      '1x Gas Leak Detector',
      'OGas Branded Uniform Set 2 FREE',
      'Marketing Banner and Flyers FREE',
      'WhatsApp Business Setup Guide FREE',
    ],
    savings: 100000,
    color: 'from-amber-500 to-orange-600',
    borderColor: 'border-amber-500',
  },
  {
    id: 'enterprise',
    name: 'OGas Enterprise',
    tagline: 'Dominate Your Market',
    price: 1200000,
    originalPrice: 1450000,
    badge: 'Premium',
    badgeColor: 'bg-red-600',
    description: 'The ultimate package for market leaders.',
    items: [
      '4x 47kg Brand New Cylinders',
      '1x Heavy-Duty Industrial Scale',
      '4x High-Pressure Gas Hose 5m',
      '4x Premium Regulator Valve Set',
      '2x Safety Fire Extinguisher',
      '1x Smart Gas Leak Detector',
      '1x Cylinder Transport Trolley',
      'OGas Full Branding Package FREE',
      'Social Media Marketing Kit FREE',
      'Priority Customer Support FREE',
      'DSON Gas Safety Certificate FREE',
    ],
    savings: 250000,
    color: 'from-red-600 to-rose-700',
    borderColor: 'border-red-600',
  },
];

const whyChooseUs = [
  { icon: Shield, title: 'Certified Equipment', desc: 'DSON approved and 
safety tested' },
  { icon: Truck, title: 'Free Delivery', desc: 'Delivered to your 
doorstep' },
  { icon: TrendingUp, title: 'High Margins', desc: '500 to 1000 naira 
profit per kg' },
  { icon: Star, title: 'OGas Brand', desc: 'Trusted brand from day one' },
];

function formatPrice(price) {
  return 'N' + price.toLocaleString();
}

export default function BusinessPackagesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 
via-slate-900 to-slate-950 text-white">
      <section className="py-20 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-orange-500/20 
border border-orange-500/30 rounded-full px-4 py-2 mb-6">
            <Flame className="w-5 h-5 text-orange-400" />
            <span className="text-orange-300 text-sm font-medium">Start 
Your LPG Business Today</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-orange-400 to-red-400 
bg-clip-text text-transparent">OGas Business</span>
            <br />Starter Packages
          </h1>
          <p className="text-xl text-slate-400 mb-8">
            Everything you need to launch a profitable gas retail business 
in Nigeria.
          </p>
        </div>
      </section>

      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 
gap-6">
          {whyChooseUs.map((item) => (
            <div key={item.title} className="bg-slate-800/50 border 
border-slate-700/50 rounded-2xl p-6 text-center">
              <item.icon className="w-8 h-8 text-orange-400 mx-auto mb-3" 
/>
              <h3 className="font-semibold text-white 
mb-1">{item.title}</h3>
              <p className="text-sm text-slate-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Choose Your 
Package</h2>
            <p className="text-slate-400">Pick the perfect starter kit for 
your budget</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {packages.map((pkg) => (
              <div key={pkg.id} className={`relative bg-slate-800/60 
border-2 ${pkg.borderColor} rounded-3xl overflow-hidden`}>
                <div className={`absolute top-4 right-4 ${pkg.badgeColor} 
text-white text-xs font-bold px-3 py-1 rounded-full`}>
                  {pkg.badge}
                </div>
                <div className="p-8">
                  <h3 className="text-2xl font-bold mb-1">{pkg.name}</h3>
                  <p className="text-orange-400 text-sm 
mb-4">{pkg.tagline}</p>
                  
                  <div className="mb-4">
                    <span className="text-4xl 
font-bold">{formatPrice(pkg.price)}</span>
                    <span className="text-lg text-slate-500 line-through 
ml-2">{formatPrice(pkg.originalPrice)}</span>
                  </div>
                  <div className="inline-flex items-center gap-1 
bg-green-500/20 text-green-400 text-sm px-3 py-1 rounded-full mb-4">
                    <TrendingUp className="w-4 h-4" /> Save 
{formatPrice(pkg.savings)}
                  </div>

                  <p className="text-slate-400 text-sm 
mb-6">{pkg.description}</p>

                  <div className="space-y-2 mb-8">
                    {pkg.items.map((item, j) => (
                      <div key={j} className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-slate-700 
flex items-center justify-center text-sm shrink-0">
                          {item.includes('FREE') ? '*' : 'v'}
                        </div>
                        <span className={`text-sm ${item.includes('FREE') 
? 'text-orange-300' : 'text-slate-300'}`}>{item}</span>
                      </div>
                    ))}
                  </div>

                  <Link href={`/buyer/checkout?package=${pkg.id}`} 
className={`w-full block text-center bg-gradient-to-r ${pkg.color} 
text-white font-bold py-4 rounded-xl`}>
                    <span className="flex items-center justify-center 
gap-2">
                      <ShoppingCart className="w-5 h-5" /> Get This 
Package <ArrowRight className="w-5 h-5" />
                    </span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-slate-900/50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-8">Why Entrepreneurs Trust 
OGas</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-slate-800/50 rounded-2xl p-6">
              <div className="text-4xl font-bold text-orange-400 
mb-2">500+</div>
              <div className="text-slate-400">Active Retailers</div>
            </div>
            <div className="bg-slate-800/50 rounded-2xl p-6">
              <div className="text-4xl font-bold text-orange-400 
mb-2">36</div>
              <div className="text-slate-400">States Covered</div>
            </div>
            <div className="bg-slate-800/50 rounded-2xl p-6">
              <div className="text-4xl font-bold text-orange-400 
mb-2">98%</div>
              <div className="text-slate-400">Satisfaction</div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">How It 
Works</h2>
          <div className="space-y-6">
            {[
              { step: '1', title: 'Choose Package', desc: 'Pick the kit 
that matches your budget.' },
              { step: '2', title: 'Pay Securely', desc: 'Via Paystack card 
transfer or USSD.' },
              { step: '3', title: 'We Deliver', desc: 'Team delivers and 
helps with setup.' },
              { step: '4', title: 'Start Selling', desc: 'Use app to 
manage and grow business.' },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-4 
bg-slate-800/30 border border-slate-700/30 rounded-2xl p-6">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 
to-red-600 rounded-xl flex items-center justify-center text-xl font-bold 
shrink-0">{item.step}</div>
                <div>
                  <h3 className="text-lg font-semibold 
mb-1">{item.title}</h3>
                  <p className="text-slate-400">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
