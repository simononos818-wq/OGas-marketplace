'use client';

import { useState } from 'react';
import { Package, MapPin, Phone, Navigation, CheckCircle, Clock, Star } from 'lucide-react';

const orders = [
  { id: 'ORD-105', status: 'picked_up', customer: 'Chioma Adeleke', address: '15 Admiralty Way, Lekki', items: '12.5kg LPG x 2', phone: '+2348012345678', distance: '2.3 km', eta: '12 min' },
  { id: 'ORD-106', status: 'assigned', customer: 'Emeka Okafor', address: '42 Adeola Odeku St, VI', items: '25kg LPG', phone: '+2348098765432', distance: '4.1 km', eta: '18 min' },
  { id: 'ORD-107', status: 'pending', customer: 'Amina Bello', address: '10 Bishop Aboyade Cole, VI', items: '5kg LPG x 3', phone: '+2348076543210', distance: '1.8 km', eta: '8 min' },
];

export default function DriverOrdersPage() {
  const [activeTab, setActiveTab] = useState('active');

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">My Orders</h1>

      <div className="flex gap-2 bg-slate-800 p-1 rounded-lg">
        {['active', 'completed', 'cancelled'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 px-4 rounded-md font-medium capitalize transition-colors ${activeTab === tab ? 'bg-green-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order.id} className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-white font-semibold">{order.id}</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${order.status === 'picked_up' ? 'bg-blue-500/20 text-blue-400' : order.status === 'assigned' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-500/20 text-gray-400'}`}>
                    {order.status.replace('_', ' ')}
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
  );
}
