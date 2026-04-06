'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Flame, Truck, Store, Shield, Star, TrendingUp, Users } from 'lucide-react';

export default function Home() {
  const features = [
    { icon: Store, title: 'Pickup', desc: 'Collect from station', color: 'from-orange-500 to-orange-600' },
    { icon: Truck, title: 'Delivery', desc: 'We bring it to you', color: 'from-green-500 to-green-600' },
    { icon: Shield, title: 'Verified', desc: 'Trusted vendors only', color: 'from-blue-500 to-blue-600' },
    { icon: Flame, title: 'Quality', desc: 'Original products', color: 'from-red-500 to-red-600' },
  ];

  const stats = [
    { icon: Users, value: '10,000+', label: 'Happy Customers' },
    { icon: Store, value: '500+', label: 'Verified Vendors' },
    { icon: Star, value: '4.9', label: 'Average Rating' },
    { icon: TrendingUp, value: '50,000+', label: 'Orders Delivered' },
  ];

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-orange-500/10 to-transparent" />
        <div className="max-w-lg mx-auto px-4 py-12 relative">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="w-24 h-24 bg-gradient-to-br from-orange-500 to-orange-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-orange-500/30"
            >
              <Flame className="w-12 h-12 text-white" />
            </motion.div>
            
            <h1 className="text-5xl font-bold text-white mb-4 tracking-tight">
              O<span className="text-orange-500">Gas</span>
            </h1>
            <p className="text-xl text-zinc-400 mb-2">Nigeria's #1 Gas Marketplace</p>
            <p className="text-sm text-zinc-500">Fast • Reliable • Affordable</p>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-3 mt-8"
          >
            <Link 
              href="/buy"
              className="block w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white text-center font-bold py-4 rounded-2xl hover:from-orange-600 hover:to-orange-700 transition-all shadow-xl shadow-orange-500/25 flex items-center justify-center gap-2"
            >
              <Flame className="w-5 h-5" />
              Buy Gas Now
            </Link>
            
            <Link 
              href="/auth/login"
              className="block w-full bg-zinc-900 border border-zinc-800 text-white text-center font-bold py-4 rounded-2xl hover:bg-zinc-800 transition-all flex items-center justify-center gap-2"
            >
              Sign In
            </Link>
          </motion.div>

          {/* Features Grid */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="grid grid-cols-2 gap-3 mt-8"
          >
            {features.map((feature, idx) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7 + idx * 0.1 }}
                className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl hover:border-zinc-700 transition-colors"
              >
                <div className={`w-10 h-10 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-3`}>
                  <feature.icon className="w-5 h-5 text-white" />
                </div>
                <div className="font-bold text-white text-sm">{feature.title}</div>
                <div className="text-xs text-zinc-500 mt-1">{feature.desc}</div>
              </motion.div>
            ))}
          </motion.div>

          {/* Stats */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-zinc-800"
          >
            {stats.map((stat, idx) => (
              <div key={stat.label} className="text-center">
                <div className="flex items-center justify-center gap-1 text-orange-500 mb-1">
                  <stat.icon className="w-4 h-4" />
                  <span className="font-bold text-lg">{stat.value}</span>
                </div>
                <div className="text-xs text-zinc-500">{stat.label}</div>
              </div>
            ))}
          </motion.div>

          {/* Vendor CTA */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1 }}
            className="mt-8 text-center p-6 bg-gradient-to-r from-green-600/20 to-green-500/20 rounded-2xl border border-green-500/30"
          >
            <p className="text-white font-medium mb-2">Are you a gas vendor?</p>
            <p className="text-zinc-400 text-sm mb-4">Join 500+ vendors earning with OGas</p>
            <Link 
              href="/vendor/register"
              className="inline-flex items-center gap-2 text-green-400 hover:text-green-300 font-medium transition"
            >
              Register your business →
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
