'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Package, MapPin, DollarSign, Star, Clock, Navigation, Phone, CheckCircle, TrendingUp } from 'lucide-react';

const stats = [
  { label: "Today's Earnings", value: '₦12,500', icon: DollarSign, color: 'text-green-400', bg: 'bg-green-500/20' },
  { label: 'Completed', value: '5', icon: CheckCircle, color: 'text-blue-400', bg: 'bg-blue-500/20' },
  { label: 'Rating', value: '4.9', icon: Star, color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
  { label: 'Online Hours', value: '4.5h', icon: Clock, color: 'text-purple-400', bg: 'bg-purple-500/20' },
];

const activeOrders = [
  {
    id: 'ORD-105',
    customer: 'Chioma Adeleke',
    address: '15 Admiralty Way, Lekki Phase 1, Lagos',
    items: '12.5kg LPG x 2',
    phone: '+2348012345678',
    distance: '2.3 km',
    status: 'picked_up',
    eta: '12 min',
  },
  {
    id: 'ORD-106',
    customer: 'Emeka Okafor',
    address: '42 Adeola Odeku St, Victoria Island, Lagos',
    items: '25kg LPG',
    phone: '+2348098765432',
    distance: '4.1 km',
    status: 'assigned',
    eta: '18 min',
  },
];

export default function DriverDashboard() {
  const auth = useAuth(); const user = auth?.user;
  const [isOnline, setIsOnline] = useState(true);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Driver Dashboard</h1>
          <p className="text-slate-400">Welcome back, {user?.displayName?.split(' ')[0] || 'Driver'}</p>
        </div>
        
        <button
          onClick={() => setIsOnline(!isOnline)}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${isOnline ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'}`}
        >
          <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-white animate-pulse' : 'bg-slate-400'}`} />
          {isOnline ? 'Online' : 'Offline'}
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-slate-800 rounded-xl p-4 border border-slate-700">
              <div className={`w-10 h-10 ${stat.bg} rounded-lg flex items-center justify-center mb-3`}>
                <Icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <p className="text-slate-400 text-sm">{stat.label}</p>
              <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* Active Orders */}
      <div>
        <h2 className="text-lg font-bold text-white mb-4">Active Orders</h2>
        <div className="space-y-3">
          {activeOrders.map((order) => (
            <div key={order.id} className="bg-slate-800 rounded-xl p-4 border border-slate-700">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-semibold">{order.id}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${order.status === 'picked_up' ? 'bg-blue-500/20 text-blue-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                      {order.status === 'picked_up' ? 'In Transit' : 'New'}
                    </span>
                  </div>
                  <p className="text-slate-400 text-sm mt-1">{order.items}</p>
                </div>
                <div className="text-right">
                  <p className="text-green-400 font-semibold">{order.distance}</p>
                  <p className="text-slate-500 text-sm">{order.eta}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-slate-300 mb-3">
                <MapPin className="w-4 h-4 text-slate-500" />
                <span className="text-sm">{order.address}</span>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-700">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-white">{order.customer.split(' ').map(n => n[0]).join('')}</span>
                  </div>
                  <span className="text-sm text-slate-300">{order.customer}</span>
                </div>
                
                <div className="flex gap-2">
                  <a href={`tel:${order.phone}`} className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-300 transition-colors">
                    <Phone className="w-4 h-4" />
                  </a>
                  <button className="flex items-center gap-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors">
                    <Navigation className="w-4 h-4" />
                    Navigate
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <Link href="/driver/earnings" className="bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl p-4 transition-colors">
          <DollarSign className="w-8 h-8 text-green-400 mb-2" />
          <p className="text-white font-semibold">View Earnings</p>
          <p className="text-slate-400 text-sm">Check your payment history</p>
        </Link>
        
        <Link href="/driver/profile" className="bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl p-4 transition-colors">
          <Package className="w-8 h-8 text-blue-400 mb-2" />
          <p className="text-white font-semibold">Vehicle Info</p>
          <p className="text-slate-400 text-sm">Update your vehicle details</p>
        </Link>
      </div>
    </div>
  );
}
